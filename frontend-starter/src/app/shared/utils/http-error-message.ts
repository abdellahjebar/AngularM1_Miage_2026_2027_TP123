import { HttpErrorResponse } from '@angular/common/http';

/** Turns an HTTP error into a message the user can understand. */
export function httpErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'Serveur injoignable. Vérifiez votre connexion et que le backend est démarré.';
  }

  const body: { message?: string } | null = error.error;
  return body?.message ?? fallback;
}
