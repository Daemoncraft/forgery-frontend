import { Pipe, PipeTransform } from '@angular/core';

/**
 * Kompakte Zahlen: < 1000 exakt, sonst 1.2k / 3.4M / 1.1B (docs/06 §4.2).
 * Optionales '+' erzwingt Vorzeichen (für Raten).
 */
@Pipe({ name: 'compactNumber' })
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | null | undefined, signed = false): string {
    if (value === null || value === undefined) return '–';
    const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
    const abs = Math.abs(value);
    if (abs < 1000) return sign + trim(abs);
    if (abs < 1_000_000) return `${sign}${trim(abs / 1000)}k`;
    if (abs < 1_000_000_000) return `${sign}${trim(abs / 1_000_000)}M`;
    return `${sign}${trim(abs / 1_000_000_000)}B`;
  }
}

function trim(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
