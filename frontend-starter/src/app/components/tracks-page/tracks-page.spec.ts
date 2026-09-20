import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Page } from '../../shared/models/page.model';
import { Track } from '../../shared/models/track.model';
import { TracksPageComponent } from './tracks-page';

function track(id: string, title: string): Track {
  return { id, title, originalName: `${title}.mp3`, mimeType: 'audio/mpeg', size: 1_000_000, createdAt: '2026-09-20T10:00:00.000Z' };
}

function pageOf(items: Track[], page = 1, pages = 1): Page<Track> {
  return { items, page, limit: 5, total: items.length, pages };
}

describe('TracksPageComponent — liste, suppression et upload', () => {
  let fixture: ComponentFixture<TracksPageComponent>;
  let http: HttpTestingController;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  const root = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) => root().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const buttonByText = (text: string) =>
    Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.trim() === text)!;
  const listRequest = (page: number): TestRequest =>
    http.expectOne((r) => r.url === '/api/tracks' && r.params.get('page') === String(page));
  const titles = () => Array.from(root().querySelectorAll('.track-card h3')).map((h) => h.textContent);

  /** Creates the page and answers its first list request (always page 1; the answer decides the page shown). */
  function start(firstPage: Page<Track>): void {
    fixture = TestBed.createComponent(TracksPageComponent);
    fixture.detectChanges();
    listRequest(1).flush(firstPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatSnackBar, useValue: snackBar }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('affiche un message après un échec HTTP du chargement de la liste', () => {
    fixture = TestBed.createComponent(TracksPageComponent);
    fixture.detectChanges();

    listRequest(1).flush({ message: 'Erreur interne' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(root().querySelector('[role="alert"]')?.textContent).toContain('Erreur interne');
    expect(root().textContent).not.toContain('Aucune piste.');
  });

  it('demande une confirmation, puis envoie DELETE /api/tracks/:id et recharge la page courante', () => {
    start(pageOf([track('a1', 'Chanson A'), track('b2', 'Chanson B')]));

    button('Supprimer Chanson A').click();
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'DELETE'); // rien n'est envoyé avant la confirmation
    expect(root().textContent).toContain('Supprimer « Chanson A » ?');

    buttonByText('Oui, supprimer').click();
    const request = http.expectOne('/api/tracks/a1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    listRequest(1).flush(pageOf([track('b2', 'Chanson B')]));
    fixture.detectChanges();

    expect(titles()).toEqual(['Chanson B']);
    expect(snackBar.open).toHaveBeenCalledWith('Piste « Chanson A » supprimée.', 'Fermer', expect.anything());
  });

  it('Annuler ne supprime rien et ne contacte pas le serveur', () => {
    start(pageOf([track('a1', 'Chanson A')]));

    button('Supprimer Chanson A').click();
    fixture.detectChanges();
    buttonByText('Annuler').click();
    fixture.detectChanges();

    http.expectNone((r) => r.method === 'DELETE');
    expect(titles()).toEqual(['Chanson A']);
    expect(button('Supprimer Chanson A')).toBeTruthy();
  });

  it('un double clic sur « Oui, supprimer » n’envoie qu’une seule requête DELETE', () => {
    start(pageOf([track('a1', 'Chanson A')]));
    button('Supprimer Chanson A').click();
    fixture.detectChanges();

    const confirm = buttonByText('Oui, supprimer');
    confirm.click();
    confirm.click();

    const request = http.expectOne((r) => r.method === 'DELETE'); // échoue s'il y en a deux
    request.flush(null, { status: 204, statusText: 'No Content' });
    listRequest(1).flush(pageOf([]));
  });

  it('piste déjà supprimée ailleurs (404) : message clair et liste actualisée', () => {
    start(pageOf([track('a1', 'Chanson A'), track('b2', 'Chanson B')]));
    button('Supprimer Chanson A').click();
    fixture.detectChanges();
    buttonByText('Oui, supprimer').click();

    http.expectOne('/api/tracks/a1').flush({ message: 'Piste inconnue' }, { status: 404, statusText: 'Not Found' });
    listRequest(1).flush(pageOf([track('b2', 'Chanson B')]));
    fixture.detectChanges();

    expect(snackBar.open.mock.calls[0][0]).toContain('n’existe plus');
    expect(titles()).toEqual(['Chanson B']);
  });

  it('serveur injoignable (statut 0) : message, aucune actualisation, la piste reste affichée', () => {
    start(pageOf([track('a1', 'Chanson A')]));
    button('Supprimer Chanson A').click();
    fixture.detectChanges();
    buttonByText('Oui, supprimer').click();

    http.expectOne('/api/tracks/a1').error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();

    expect(snackBar.open.mock.calls[0][0]).toContain('Serveur injoignable');
    http.expectNone((r) => r.url === '/api/tracks'); // pas de rechargement
    expect(titles()).toEqual(['Chanson A']);
  });

  it('supprimer l’unique piste de la page 2 recharge la page 1 (pas de page vide)', () => {
    start(pageOf([track('z9', 'Chanson Z')], 2, 2));

    button('Supprimer Chanson Z').click();
    fixture.detectChanges();
    buttonByText('Oui, supprimer').click();
    http.expectOne('/api/tracks/z9').flush(null, { status: 204, statusText: 'No Content' });

    listRequest(1).flush(pageOf([track('a1', 'Chanson A')]));
    fixture.detectChanges();

    expect(titles()).toEqual(['Chanson A']);
  });

  describe('upload avec progression', () => {
    const song = () => new File(['abc'], 'riff.mp3', { type: 'audio/mpeg' });
    const send = () => buttonByText('Envoyer') ?? buttonByText('Envoi…');
    const bar = () => root().querySelector<HTMLProgressElement>('progress');

    /** Starts an upload of a valid file and returns the pending POST. */
    function startUpload(): TestRequest {
      start(pageOf([]));
      fixture.componentInstance.file.set(song());
      fixture.detectChanges();
      send().click();
      fixture.detectChanges();
      return http.expectOne((r) => r.method === 'POST' && r.url === '/api/tracks');
    }

    it('état « idle » au départ : pas de barre, bouton « Envoyer » désactivé sans fichier', () => {
      start(pageOf([]));

      expect(fixture.componentInstance.uploadState()).toBe('idle');
      expect(bar()).toBeNull();
      expect(buttonByText('Envoyer').disabled).toBe(true);
    });

    it('affiche le pourcentage réel pendant l’envoi et désactive les contrôles', () => {
      const request = startUpload();

      request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 200 });
      fixture.detectChanges();

      expect(fixture.componentInstance.uploadState()).toBe('uploading');
      expect(bar()?.getAttribute('value')).toBe('25');
      expect(root().textContent).toContain('Envoi… 25 %');
      expect(root().querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true);
      expect(root().querySelector<HTMLInputElement>('label input:not([type="file"])')!.disabled).toBe(true);
      expect(send().disabled).toBe(true);
      request.flush({ ...track('n1', 'Riff') });
      listRequest(1).flush(pageOf([]));
    });

    it('à 100 % l’envoi n’est pas encore réussi : il attend la réponse du serveur', () => {
      const request = startUpload();

      request.event({ type: HttpEventType.UploadProgress, loaded: 200, total: 200 });
      fixture.detectChanges();

      expect(fixture.componentInstance.uploadState()).toBe('uploading');
      expect(root().textContent).toContain('Traitement par le serveur…');
      expect(root().textContent).not.toContain('envoyée.');
      request.flush(track('n1', 'Riff'));
      listRequest(1).flush(pageOf([]));
    });

    it('total inconnu : barre indéterminée et jamais « NaN »', () => {
      const request = startUpload();

      request.event({ type: HttpEventType.UploadProgress, loaded: 40 });
      fixture.detectChanges();

      expect(bar()?.hasAttribute('value')).toBe(false);
      expect(root().textContent).not.toContain('NaN');
      request.flush(track('n1', 'Riff'));
      listRequest(1).flush(pageOf([]));
    });

    it('un second clic pendant l’envoi n’envoie pas un deuxième POST', () => {
      const request = startUpload();

      // Le bouton est désactivé (jsdom ne déclenche pas de clic dessus) : on appelle donc la méthode
      // directement pour vérifier que la garde du code, elle aussi, refuse une seconde soumission.
      fixture.componentInstance.upload();
      fixture.componentInstance.upload();

      http.expectNone((r) => r.method === 'POST'); // le premier est déjà consommé par expectOne
      request.flush(track('n1', 'Riff'));
      listRequest(1).flush(pageOf([]));
    });

    it('réussite : état « success », message, formulaire vidé et contrôles réactivés', () => {
      const request = startUpload();

      request.flush(track('n1', 'Riff'));
      listRequest(1).flush(pageOf([track('n1', 'Riff')]));
      fixture.detectChanges();

      expect(fixture.componentInstance.uploadState()).toBe('success');
      expect(root().querySelector('[role="status"]')?.textContent).toContain('Piste « Riff » envoyée.');
      expect(bar()).toBeNull();
      expect(fixture.componentInstance.file()).toBeNull();
      expect(root().querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(false);
      expect(root().querySelector<HTMLInputElement>('label input:not([type="file"])')!.disabled).toBe(false);
      expect(titles()).toEqual(['Riff']);
    });

    it('échec du serveur : état « error », message du serveur, fichier conservé pour réessayer', () => {
      const request = startUpload();

      request.flush({ message: 'Format audio refusé' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(fixture.componentInstance.uploadState()).toBe('error');
      expect(root().querySelector('[role="alert"]')?.textContent).toContain('Format audio refusé');
      expect(fixture.componentInstance.file()).not.toBeNull();
      expect(send().disabled).toBe(false); // on peut réessayer
      expect(root().querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(false);
      expect(root().querySelector<HTMLInputElement>('label input:not([type="file"])')!.disabled).toBe(false);
    });
  });
});
