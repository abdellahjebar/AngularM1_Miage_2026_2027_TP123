import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';
import { TrackService } from './track.service';

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
});
