import { describe, expect, test } from 'bun:test';

import * as moduleExports from './fixIcelandicLocale.js';
import { _PatchedNumberFormat } from './fixIcelandicLocale.privates.js';

// ---------------------------------------------------------------------------
// Test exports

describe('fixIcelandicLocale', () => {
  test('has no exports', () => {
    expect(Object.keys(moduleExports).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test methods

describe('_PatchedNumberFormat', () => {
  test('Can be called with and without `new`', () => {
    expect(new _PatchedNumberFormat('is').format(1234)).toBe('1.234');
    // Can be called without `new`
    expect(_PatchedNumberFormat('is').format(-12345.6)).toBe('-12.345,6');

    // respects preceding locales ...including "da"
    expect(new _PatchedNumberFormat(['en', 'is']).format(1234)).toBe(`1,234`);
    expect(
      new _PatchedNumberFormat(['da', 'is'], { style: 'unit', unit: 'hour' }).format(1)
    ).toBe('1 t.');
  });

  test('Has static methods', () => {
    expect(_PatchedNumberFormat.supportedLocalesOf(['da'])).toEqual(['da']);
  });

  test('Translates ISK to kr.', () => {
    const nf = _PatchedNumberFormat('is', {
      style: 'currency',
      currency: 'ISK',
      currencyDisplay: 'symbol',
    });
    expect(nf.format(1234)).toBe('1.234 kr.');
    expect(nf.formatRange(123, 234)).toBe('123-234 kr.');
    expect(nf.formatToParts(10)).toEqual([
      { type: 'integer', value: '10' },
      { type: 'literal', value: ' ' },
      { type: 'currency', value: 'kr.' }, // <-- !!!
    ]);
    expect(nf.formatRangeToParts(10, 20)).toEqual([
      { source: 'startRange', type: 'integer', value: '10' },
      { source: 'shared', type: 'literal', value: '-' },
      { source: 'endRange', type: 'integer', value: '20' },
      { source: 'shared', type: 'literal', value: ' ' },
      { source: 'shared', type: 'currency', value: 'kr.' }, // <-- !!!
    ]);
  });

  test('Translates DKK to DKK', () => {
    const nf = _PatchedNumberFormat('is', {
      style: 'currency',
      currency: 'DKK',
      currencyDisplay: 'symbol',
    });
    expect(nf.format(1234)).toBe('1.234,00 DKK');
    expect(nf.formatRange(123, 234)).toBe('123,00-234,00 DKK');
    expect(nf.formatToParts(10)).toEqual([
      { type: 'integer', value: '10' },
      { type: 'decimal', value: ',' },
      { type: 'fraction', value: '00' },
      { type: 'literal', value: ' ' },
      { type: 'currency', value: 'DKK' }, // <-- !!!
    ]);
    expect(nf.formatRangeToParts(10, 20)).toEqual([
      { source: 'startRange', type: 'integer', value: '10' },
      { source: 'startRange', type: 'decimal', value: ',' },
      { source: 'startRange', type: 'fraction', value: '00' },
      { source: 'shared', type: 'literal', value: '-' },
      { source: 'endRange', type: 'integer', value: '20' },
      { source: 'endRange', type: 'decimal', value: ',' },
      { source: 'endRange', type: 'fraction', value: '00' },
      { source: 'shared', type: 'literal', value: ' ' },
      { source: 'shared', type: 'currency', value: 'DKK' }, // <-- !!!
    ]);
  });

  // Proves that the this is actually a patched instance,
  // Also makes it clear what's not supported (yet).
  test('Not supported features', () => {
    // currncyDisplay: 'name';
    expect(
      _PatchedNumberFormat('is', {
        style: 'currency',
        currency: 'ISK',
        currencyDisplay: 'name',
      }).format(-123)
    ).toBe('-123 islandske kroner');
    // style: 'unit';
    expect(
      new _PatchedNumberFormat('is', {
        style: 'unit',
        unit: 'kilometer-per-degree',
        unitDisplay: 'long',
      }).format(1234)
    ).toBe('1.234 kilometer pr. grad');
  });
});
