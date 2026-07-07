import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthCardComponent } from './auth-card.component';
import { AuthStore } from './auth.store';

/**
 * Registrierung gegen POST /api/auth/register — Client-Validierung spiegelt
 * die Backend-Regeln (docs/05 §2.1), die Wahrheit bleibt der Server:
 * API-Feldfehler (EMAIL_TAKEN, PASSWORD_TOO_WEAK, …) landen an den Feldern.
 */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
  template: `
    <app-auth-card subtitle="Erstelle dein Konto und baue deine Industrie auf.">
      <form class="space-y-3" [formGroup]="form" (ngSubmit)="submit()">
        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">E-Mail</span>
          <input type="email" formControlName="email" autocomplete="email" [class]="inputClass" />
          @if (fieldError('email'); as message) {
            <span class="mt-1 block text-xs text-[var(--danger)]">{{ message }}</span>
          }
        </label>

        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">Username</span>
          <input type="text" formControlName="username" autocomplete="username" [class]="inputClass" />
          @if (fieldError('username'); as message) {
            <span class="mt-1 block text-xs text-[var(--danger)]">{{ message }}</span>
          }
        </label>

        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">Anzeigename (optional)</span>
          <input type="text" formControlName="displayName" [class]="inputClass" />
          @if (fieldError('displayName'); as message) {
            <span class="mt-1 block text-xs text-[var(--danger)]">{{ message }}</span>
          }
        </label>

        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">Passwort</span>
          <input type="password" formControlName="password" autocomplete="new-password" [class]="inputClass" />
          @if (fieldError('password'); as message) {
            <span class="mt-1 block text-xs text-[var(--danger)]">{{ message }}</span>
          } @else {
            <span class="mt-1 block text-xs text-[var(--text-muted)]">
              Mindestens 10 Zeichen mit Groß-/Kleinbuchstabe, Zahl und Sonderzeichen.
            </span>
          }
        </label>

        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">Passwort wiederholen</span>
          <input type="password" formControlName="passwordRepeat" autocomplete="new-password" [class]="inputClass" />
          @if (fieldError('passwordRepeat'); as message) {
            <span class="mt-1 block text-xs text-[var(--danger)]">{{ message }}</span>
          }
        </label>

        <label class="flex items-start gap-2 text-sm text-[var(--text-muted)]">
          <input type="checkbox" formControlName="acceptedTerms" class="mt-0.5" />
          <span>Ich akzeptiere die Nutzungsbedingungen.</span>
        </label>
        @if (fieldError('acceptedTerms'); as message) {
          <span class="block text-xs text-[var(--danger)]">{{ message }}</span>
        }

        @if (auth.error(); as error) {
          @if (!hasFieldErrors(error.fieldErrors)) {
            <p class="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm text-[var(--danger)]">
              {{ error.message }}
            </p>
          }
        }

        <button
          type="submit"
          [disabled]="auth.isLoading()"
          class="w-full rounded-lg bg-[var(--primary)] px-3 py-2 font-medium text-[var(--bg)] disabled:opacity-50"
        >
          {{ auth.isLoading() ? 'Registrieren …' : 'Konto erstellen' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-[var(--text-muted)]">
        Schon ein Konto?
        <a routerLink="/login" class="text-[var(--primary)]">Zum Login</a>
      </p>
    </app-auth-card>
  `,
})
export class RegisterComponent {
  protected readonly auth = inject(AuthStore);
  readonly #router = inject(Router);
  readonly #fb = inject(NonNullableFormBuilder);

  protected readonly inputClass =
    'mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--primary)]';

  protected readonly form = this.#fb.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]{3,24}$/)]],
      displayName: ['', [Validators.maxLength(48)]],
      password: ['', [Validators.required, passwordPolicyValidator]],
      passwordRepeat: ['', [Validators.required]],
      acceptedTerms: [false, [Validators.requiredTrue]],
    },
    { validators: [passwordMatchValidator] },
  );

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    try {
      await this.auth.register({
        email: value.email.trim(),
        username: value.username.trim(),
        displayName: value.displayName.trim() || undefined,
        password: value.password,
        acceptedTerms: value.acceptedTerms,
      });
      await this.#router.navigateByUrl('/dashboard');
    } catch {
      // Fehler steht im AuthStore.error; fieldError() blendet ihn am Feld ein
    }
  }

  /** Client-Validierungsfehler (nach Touch) oder Server-Feldfehler. */
  protected fieldError(field: string): string | null {
    const serverError = this.auth.error()?.fieldErrors[field];
    if (serverError) return serverError;

    const control = this.form.get(field);
    if (!control || !control.touched) return null;
    if (field === 'passwordRepeat' && this.form.errors?.['passwordMismatch']) {
      return 'Die Passwörter stimmen nicht überein.';
    }
    if (!control.errors) return null;
    if (control.errors['required']) return 'Pflichtfeld.';
    if (control.errors['requiredTrue']) return 'Bitte akzeptiere die Nutzungsbedingungen.';
    if (control.errors['email']) return 'Keine gültige E-Mail-Adresse.';
    if (control.errors['maxlength']) return 'Zu lang.';
    if (control.errors['pattern']) return '3–24 Zeichen, nur Buchstaben, Ziffern, _ und -.';
    if (control.errors['passwordPolicy']) return control.errors['passwordPolicy'] as string;
    return null;
  }

  protected hasFieldErrors(fieldErrors: Record<string, string>): boolean {
    return Object.keys(fieldErrors).length > 0;
  }
}

/** Spiegel der Backend-PasswordPolicy (docs/08 §2.1). */
export function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null; // required greift separat
  const violations: string[] = [];
  if (value.length < 10) violations.push('mindestens 10 Zeichen');
  if (value.length > 128) violations.push('höchstens 128 Zeichen');
  if (!/[A-Z]/.test(value)) violations.push('ein Großbuchstabe');
  if (!/[a-z]/.test(value)) violations.push('ein Kleinbuchstabe');
  if (!/[0-9]/.test(value)) violations.push('eine Ziffer');
  if (!/[^a-zA-Z0-9]/.test(value)) violations.push('ein Sonderzeichen');
  return violations.length > 0 ? { passwordPolicy: `Fehlt: ${violations.join(', ')}.` } : null;
}

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const repeat = group.get('passwordRepeat')?.value;
  return password && repeat && password !== repeat ? { passwordMismatch: true } : null;
}
