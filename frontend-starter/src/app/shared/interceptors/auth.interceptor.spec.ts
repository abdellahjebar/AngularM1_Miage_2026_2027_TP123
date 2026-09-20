import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    controller.verify();
    auth.token.set(null);
  });

  it('ajoute Authorization: Bearer <token> aux requêtes /api/ quand un token existe', () => {
    auth.token.set('jeton-de-test');

    http.get('/api/tracks').subscribe();

    const request = controller.expectOne('/api/tracks');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jeton-de-test');
    request.flush({});
  });

  it("n'ajoute aucun en-tête Authorization sans token", () => {
    auth.token.set(null);

    http.get('/api/tracks').subscribe();

    const request = controller.expectOne('/api/tracks');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it("n'envoie pas le token à une URL qui n'est pas /api/ (autre origine)", () => {
    auth.token.set('jeton-de-test');

    http.get('https://exemple.test/api/tracks').subscribe();

    const request = controller.expectOne('https://exemple.test/api/tracks');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
