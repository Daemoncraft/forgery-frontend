import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { passwordMatchValidator, passwordPolicyValidator } from './register.component';

describe('passwordPolicyValidator', () => {
  const validate = (value: string) => passwordPolicyValidator(new FormControl(value));

  it('akzeptiert Passwörter nach Backend-Policy', () => {
    expect(validate('Abcdef123!')).toBeNull();
    expect(validate('Sehr-Lange5Passphrase')).toBeNull();
  });

  it('meldet fehlende Zeichenklassen und Länge gesammelt', () => {
    const errors = validate('abc');
    expect(errors).not.toBeNull();
    const message = errors!['passwordPolicy'] as string;
    expect(message).toContain('mindestens 10 Zeichen');
    expect(message).toContain('Großbuchstabe');
    expect(message).toContain('Ziffer');
    expect(message).toContain('Sonderzeichen');
  });

  it('überlässt leere Eingaben dem required-Validator', () => {
    expect(validate('')).toBeNull();
  });
});

describe('passwordMatchValidator', () => {
  const group = (password: string, repeat: string) =>
    new FormGroup({
      password: new FormControl(password),
      passwordRepeat: new FormControl(repeat),
    });

  it('meldet Mismatch nur bei zwei ausgefüllten, unterschiedlichen Feldern', () => {
    expect(passwordMatchValidator(group('Abcdef123!', 'anders'))).toEqual({ passwordMismatch: true });
    expect(passwordMatchValidator(group('Abcdef123!', 'Abcdef123!'))).toBeNull();
    expect(passwordMatchValidator(group('Abcdef123!', ''))).toBeNull();
  });
});
