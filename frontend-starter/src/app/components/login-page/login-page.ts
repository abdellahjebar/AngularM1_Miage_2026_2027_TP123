import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly submitting = signal(false);
  readonly form = new FormGroup({
    email: new FormControl('demo@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('Demo1234!', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly email = this.form.controls.email;
  readonly password = this.form.controls.password;

  submit(): void {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    this.error.set('');
    this.submitting.set(true);

    this.auth.login(values.email, values.password).subscribe({
      next: () => {
        console.debug('[LoginPage] Connexion réussie');
        void this.router.navigateByUrl('/tracks');
      },
      error: (error: HttpErrorResponse) => {
        console.error('[LoginPage] Échec de connexion, statut', error.status);
        this.error.set(httpErrorMessage(error, 'Erreur de connexion'));
        this.submitting.set(false);
      },
    });
  }
}
