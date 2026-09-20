import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';
import { TrackService, UploadEvent } from './track.service';

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() envoie GET /api/tracks avec page et limit puis renvoie la page reçue', () => {
    const answer: Page<Track> = { items: [], page: 2, limit: 3, total: 7, pages: 3 };
    let result: Page<Track> | undefined;

    service.list(2, 3).subscribe((page) => (result = page));

    const request = http.expectOne((r) => r.url === '/api/tracks');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('3');
    request.flush(answer);

    expect(result).toEqual(answer);
  });

  it('list() sans argument demande la page 1 avec 5 pistes', () => {
    service.list().subscribe();

    const request = http.expectOne((r) => r.url === '/api/tracks');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({ items: [], page: 1, limit: 5, total: 0, pages: 0 });
  });

  it('delete() envoie DELETE /api/tracks/:id sans corps et se termine sur 204', () => {
    let done = false;

    service.delete('abc123').subscribe({ complete: () => (done = true) });

    const request = http.expectOne('/api/tracks/abc123');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(done).toBe(true);
  });

  describe('upload()', () => {
    const file = () => new File(['abc'], 'riff.mp3', { type: 'audio/mpeg' });
    const track: Track = { id: 't1', title: 'Riff', originalName: 'riff.mp3', mimeType: 'audio/mpeg', size: 3, createdAt: '2026-09-20T10:00:00.000Z' };

    it('envoie un POST multipart (audio + title) avec le suivi de progression activé', () => {
      service.upload(file(), 'Riff').subscribe();

      const request = http.expectOne('/api/tracks');
      expect(request.request.method).toBe('POST');
      expect(request.request.reportProgress).toBe(true);
      const body = request.request.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect((body.get('audio') as File).name).toBe('riff.mp3');
      expect(body.get('title')).toBe('Riff');
      request.flush(track);
    });

    it('émet des pourcentages arrondis puis la piste créée, et ignore les autres événements', () => {
      const events: UploadEvent[] = [];
      let completed = false;
      service.upload(file(), 'Riff').subscribe({ next: (e) => events.push(e), complete: () => (completed = true) });

      const request = http.expectOne('/api/tracks');
      request.event({ type: HttpEventType.Sent });
      request.event({ type: HttpEventType.UploadProgress, loaded: 1, total: 3 });
      request.event({ type: HttpEventType.UploadProgress, loaded: 3, total: 3 });
      request.flush(track);

      expect(events).toEqual([
        { type: 'progress', percent: 33 },
        { type: 'progress', percent: 100 },
        { type: 'done', track },
      ]);
      expect(completed).toBe(true);
    });

    it('émet un pourcentage inconnu (null, jamais NaN) quand le total n’est pas connu', () => {
      const events: UploadEvent[] = [];
      service.upload(file(), 'Riff').subscribe((e) => events.push(e));

      const request = http.expectOne('/api/tracks');
      request.event({ type: HttpEventType.UploadProgress, loaded: 500 });
      request.flush(track);

      expect(events[0]).toEqual({ type: 'progress', percent: null });
    });

    it('propage l’erreur HTTP du serveur', () => {
      let status = 0;
      service.upload(file(), 'Riff').subscribe({ error: (e) => (status = e.status) });

      http.expectOne('/api/tracks').flush({ message: 'Format refusé' }, { status: 400, statusText: 'Bad Request' });

      expect(status).toBe(400);
    });
  });
});
