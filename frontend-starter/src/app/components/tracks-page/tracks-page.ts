import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { audioFileError, audioFormat, formatSize, mediaErrorMessage } from '../../shared/utils/audio-file';
import { formatDate } from '../../shared/utils/format-date';
import { httpErrorMessage } from '../../shared/utils/http-error-message';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private audioRequest?: Subscription;

  protected readonly formatSize = formatSize;
  protected readonly formatDate = formatDate;
  protected readonly audioFormat = audioFormat;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly audioUrl = signal('');
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal(false);
  readonly audioError = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadMessage = signal('');
  /** Upload progress in percent; null when unknown (then the bar is indeterminate). */
  readonly uploadPercent = signal<number | null>(null);
  /** The four upload states of the subject: nothing in progress, in progress, success, failure. */
  readonly uploadState = computed<'idle' | 'uploading' | 'success' | 'error'>(() => {
    if (this.uploading()) return 'uploading';
    if (this.uploadError()) return 'error';
    return this.uploadMessage() ? 'success' : 'idle';
  });
  /** Track waiting for the user's confirmation, and track being deleted (blocks double clicks). */
  readonly confirmingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.audioRequest?.unsubscribe();
      this.setAudioUrl('');
    });
    this.load();
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    const problem = selected ? audioFileError(selected) : null;

    this.uploadMessage.set('');
    this.uploadError.set(problem ?? '');

    if (problem) {
      input.value = '';
      this.file.set(null);
      return;
    }

    this.file.set(selected);
    console.debug('[TracksPage] Fichier sélectionné', selected?.name);
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list(page).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.page.set(response.page);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Chargement impossible, statut', error.status);
        this.error.set(httpErrorMessage(error, 'Impossible de charger les pistes.'));
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    this.load(page);
  }

  upload(): void {
    const file = this.file();
    if (!file || this.uploading()) return;

    const problem = audioFileError(file);
    if (problem) {
      this.uploadError.set(problem);
      return;
    }

    const title = this.title.value.trim() || file.name;
    this.uploadError.set('');
    this.uploadMessage.set('');
    this.uploadPercent.set(0);
    this.uploading.set(true);
    this.title.disable();

    this.service.upload(file, title).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.uploadPercent.set(event.percent);
          return;
        }
        console.debug('[TracksPage] Piste envoyée', event.track.id);
        this.uploadMessage.set(`Piste « ${event.track.title} » envoyée.`);
        this.title.setValue('');
        this.file.set(null);
        const input = this.fileInput()?.nativeElement;
        if (input) input.value = '';
        this.endUpload();
        this.load(1);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Envoi impossible, statut', error.status);
        this.uploadError.set(httpErrorMessage(error, 'Envoi impossible.'));
        this.endUpload();
      },
    });
  }

  play(track: Track): void {
    // A newer choice cancels the previous download, so a slow older answer can never replace it.
    this.audioRequest?.unsubscribe();
    this.setAudioUrl('');
    this.currentTrack.set(track);
    this.audioError.set('');
    this.audioLoading.set(true);

    this.audioRequest = this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        this.setAudioUrl(URL.createObjectURL(blob));
        this.audioLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Lecture impossible, statut', error.status);
        this.audioError.set(`Impossible de lire « ${track.title} ». ${this.audioRequestMessage(error)}`);
        this.audioLoading.set(false);
      },
    });
  }

  askDelete(track: Track): void {
    if (this.deletingId()) return;
    this.confirmingId.set(track.id);
    // The "Supprimer" button disappears: move the focus to the safe choice so keyboard users are not lost.
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('[data-cancel-delete]')?.focus(), {
      injector: this.injector,
    });
  }

  cancelDelete(): void {
    if (this.deletingId()) return;
    this.confirmingId.set(null);
  }

  confirmDelete(track: Track): void {
    if (this.deletingId()) return;
    this.deletingId.set(track.id);

    this.service.delete(track.id).subscribe({
      next: () => {
        console.debug('[TracksPage] Piste supprimée', track.id);
        if (this.currentTrack()?.id === track.id) this.stopPlayback();
        this.finishDelete(`Piste « ${track.title} » supprimée.`);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Suppression impossible, statut', error.status);
        this.finishDelete(this.deleteErrorMessage(error, track), error.status !== 0);
      },
    });
  }

  onAudioError(event: Event): void {
    const code = (event.target as HTMLAudioElement).error?.code;
    console.error('[TracksPage] Erreur du lecteur audio, code', code);
    this.audioError.set(mediaErrorMessage(code));
  }

  private endUpload(): void {
    this.uploading.set(false);
    this.uploadPercent.set(null);
    this.title.enable();
  }

  /** Ends the delete, tells the user, and refreshes the page content unless the server was unreachable. */
  private finishDelete(message: string, reload = true): void {
    this.deletingId.set(null);
    this.confirmingId.set(null);
    this.snackBar.open(message, 'Fermer', { duration: 6000 });
    if (!reload) return;
    // Deleting the last card of a page above 1 would leave an empty page: go back one page instead.
    const lastOfPage = this.tracks().length === 1 && this.page() > 1;
    this.load(lastOfPage ? this.page() - 1 : this.page());
  }

  private deleteErrorMessage(error: HttpErrorResponse, track: Track): string {
    if (error.status === 0) return httpErrorMessage(error, '');
    if (error.status === 404) {
      return `« ${track.title} » n’existe plus ou n’est pas à vous. La liste a été actualisée.`;
    }
    return `Suppression de « ${track.title} » incomplète : ${httpErrorMessage(error, 'erreur du serveur.')} La liste a été actualisée.`;
  }

  private stopPlayback(): void {
    this.audioRequest?.unsubscribe();
    this.setAudioUrl('');
    this.currentTrack.set(null);
    this.audioError.set('');
    this.audioLoading.set(false);
  }

  /** Replaces the object URL and releases the previous one, otherwise its Blob stays in memory. */
  private setAudioUrl(url: string): void {
    const previous = this.audioUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.audioUrl.set(url);
  }

  private audioRequestMessage(error: HttpErrorResponse): string {
    if (error.status === 0) return httpErrorMessage(error, '');
    if (error.status === 404) return 'Cette piste est introuvable.';
    return 'Le serveur n’a pas pu envoyer le fichier.';
  }
}
