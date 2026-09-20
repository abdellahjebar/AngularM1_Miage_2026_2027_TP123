import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { audioFileError, audioFormat, formatSize } from '../../shared/utils/audio-file';
import { formatDate } from '../../shared/utils/format-date';
import { httpErrorMessage } from '../../shared/utils/http-error-message';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly formatSize = formatSize;
  protected readonly formatDate = formatDate;
  protected readonly audioFormat = audioFormat;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly audioUrl = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadMessage = signal('');

  constructor() {
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

    this.uploadError.set('');
    this.uploadMessage.set('');
    this.uploading.set(true);

    this.service.upload(file, this.title.value.trim() || file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploadMessage.set(`Piste « ${track.title} » envoyée.`);
        this.title.setValue('');
        this.file.set(null);
        const input = this.fileInput()?.nativeElement;
        if (input) input.value = '';
        this.uploading.set(false);
        this.load(1);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[TracksPage] Envoi impossible, statut', error.status);
        this.uploadError.set(httpErrorMessage(error, 'Envoi impossible.'));
        this.uploading.set(false);
      },
    });
  }

  play(track: Track): void {
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (error) => console.error('[TracksPage] Lecture impossible', error),
    });
  }
}
