import { CompactNumberPipe } from './compact-number.pipe';

describe('CompactNumberPipe', () => {
  const pipe = new CompactNumberPipe();

  it('zeigt Werte unter 1000 exakt', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(999)).toBe('999');
    expect(pipe.transform(12.34)).toBe('12.3');
  });

  it('kürzt Tausender/Millionen/Milliarden (docs/06 §4.2)', () => {
    expect(pipe.transform(1200)).toBe('1.2k');
    expect(pipe.transform(3_400_000)).toBe('3.4M');
    expect(pipe.transform(1_100_000_000)).toBe('1.1B');
  });

  it('erzwingt Vorzeichen für Raten (signed)', () => {
    expect(pipe.transform(60, true)).toBe('+60');
    expect(pipe.transform(-30, true)).toBe('-30');
    expect(pipe.transform(0, true)).toBe('0');
  });

  it('zeigt – für fehlende Werte', () => {
    expect(pipe.transform(null)).toBe('–');
    expect(pipe.transform(undefined)).toBe('–');
  });
});
