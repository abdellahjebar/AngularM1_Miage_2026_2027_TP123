import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
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

describe('TracksPageComponent — suppression et erreurs de liste', () => {
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
});
