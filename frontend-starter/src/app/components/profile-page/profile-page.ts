import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';
import { trimmedMinLength } from '../../shared/validators/trimmed-min-length';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, trimmedMinLength(2)],
    }),
  });
  readonly name = this.form.controls.name;

  constructor() {
    this.load();
  }

  private load(): void {
    this.auth.profile().subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[ProfilePage] Chargement impossible, statut', error.status);
        this.error.set(httpErrorMessage(error, 'Impossible de charger le profil.'));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.saving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.message.set('');
    this.saving.set(true);

    this.auth.update(this.form.getRawValue().name).subscribe({
      next: (user) => {
        console.debug('[ProfilePage] Profil enregistré', user.id);
        this.message.set('Nom mis à jour.');
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[ProfilePage] Enregistrement impossible, statut', error.status);
        this.error.set(httpErrorMessage(error, 'Impossible d’enregistrer le profil.'));
        this.saving.set(false);
      },
    });
  }
}
