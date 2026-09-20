import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let auth: AuthService;
  let router: Router;

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => auth.token.set(null));

  it('redirige vers /login quand il n’y a pas de token', () => {
    auth.token.set(null);

    const result = run();

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login');
  });

  it('laisse passer quand un token existe', () => {
    auth.token.set('jeton-de-test');

    expect(run()).toBe(true);
  });
});
