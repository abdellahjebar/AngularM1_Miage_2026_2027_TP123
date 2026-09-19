import { ValidatorFn } from '@angular/forms';

/** The backend trims the name before checking its minimum length, so we do the same. */
export const trimmedMinLength =
  (min: number): ValidatorFn =>
  (control) =>
    String(control.value ?? '').trim().length >= min ? null : { trimmedMinLength: { min } };
