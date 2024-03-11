import { describe, expect, test } from 'bun:test';

import * as moduleExports from './fixIcelandicLocale.js';
import {
  _PatchedDateTimeFormat,
  _PatchedListFormat,
  _PatchedNumberFormat,
  _PatchedPluralRules,
} from './fixIcelandicLocale.privates.js';

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
    // currncyDisplay: 'name'
    expect(
      _PatchedNumberFormat('is', {
        style: 'currency',
        currency: 'ISK',
        currencyDisplay: 'name',
      }).format(-123)
    ).toBe('-123 islandske kroner');
    // style: 'unit'
    expect(
      new _PatchedNumberFormat('is', {
        style: 'unit',
        unit: 'kilometer-per-degree',
        unitDisplay: 'long',
      }).format(1234)
    ).toBe('1.234 kilometer pr. grad');
  });
});

// ---------------------------------------------------------------------------

describe('_PatchedDateTimeFormat', () => {
  test('Can be called with and without `new`', () => {
    const d = new Date('2024-02-29T12:34:56Z');

    expect(new _PatchedDateTimeFormat('is').format(d)).toBe('29.2.2024');
    // Can be called without `new`
    expect(_PatchedDateTimeFormat('is').format(d)).toBe('29.2.2024');
    // Accepts timestamps
    expect(_PatchedDateTimeFormat('is').format(d.getTime())).toBe('29.2.2024');
    // Defaults to Date.now()
    expect(_PatchedDateTimeFormat('is').format()).toBe(
      _PatchedDateTimeFormat('is').format(Date.now())
    );

    // respects preceding locales ...including "da"
    expect(new _PatchedDateTimeFormat(['en', 'is']).format(d)).toBe(`2/29/2024`);
    expect(new _PatchedDateTimeFormat(['da', 'is'], { weekday: 'long' }).format(d)).toBe(
      'torsdag'
    );
  });

  test('Has static methods', () => {
    expect(_PatchedDateTimeFormat.supportedLocalesOf(['da'])).toEqual(['da']);
  });
});

describe('_PatchedDateTimeFormat.format', () => {
  test('Translates month names', () => {
    const monthLong = _PatchedDateTimeFormat('is', { month: 'long' });
    const monthShort = _PatchedDateTimeFormat('is', { month: 'short' });
    [
      'janúar',
      'febrúar',
      'mars',
      'apríl',
      'maí',
      'júní',
      'júlí',
      'ágúst',
      'september',
      'október',
      'nóvember',
      'desember',
    ].forEach((month, idx) => {
      const d = new Date(2024, idx, 1);
      expect(monthLong.format(d)).toBe(month);
      expect(monthShort.format(d)).toBe(
        month.length > 3 ? `${month.slice(0, 3)}.` : month
      );
    });
  });

  test('Translates weekday names', () => {
    const weekdayLong = _PatchedDateTimeFormat('is', { weekday: 'long' });
    const weekdayShort = _PatchedDateTimeFormat('is', { weekday: 'short' });
    [
      'mánudagur',
      'þriðjudagur',
      'miðvikudagur',
      'fimmtudagur',
      'föstudagur',
      'laugardagur',
      'sunnudagur',
    ].forEach((weekday, idx) => {
      const d = new Date(2024, 1, 5 + idx);
      expect(weekdayLong.format(d)).toBe(weekday);
      expect(weekdayShort.format(d)).toBe(`${weekday.slice(0, 3)}.`);
    });
  });

  test('Translates month names', () => {
    const eraLong = _PatchedDateTimeFormat('is', { era: 'long' });
    const eraShort = _PatchedDateTimeFormat('is', { era: 'short' });
    const eraNarrow = _PatchedDateTimeFormat('is', { era: 'narrow' });
    (
      [
        [new Date(-999, 1, 1), 'fyrir'],
        [new Date(1000, 1, 1), 'eftir'],
      ] as const
    ).forEach(([date, era]) => {
      expect(eraLong.format(date)).toBe(`1.2.1000 ${era} Krist`);
      expect(eraShort.format(date)).toBe(`1.2.1000 ${era[0]!}.Kr.`);
      expect(eraNarrow.format(date)).toBe(`1.2.1000 ${era[0]!}.k.`);
    });
  });

  test('Dates are fine', () => {
    expect(
      _PatchedDateTimeFormat('is', { dateStyle: 'full' }).format(new Date('2024-08-03'))
    ).toBe('laugardagurinn 3. ágúst 2024');
    expect(
      _PatchedDateTimeFormat('is', { dateStyle: 'long' }).format(
        new Date('2024-08-03T12:34:56Z')
      )
    ).toBe('3. ágúst 2024');
    expect(
      _PatchedDateTimeFormat('is', { dateStyle: 'medium' }).format(
        new Date('2024-08-03T12:34:56Z')
      )
    ).toBe('3. ágú. 2024');
    expect(
      _PatchedDateTimeFormat('is', { dateStyle: 'short' }).format(
        new Date('2024-08-03T12:34:56Z')
      )
    ).toBe('03.08.2024');
  });

  test('Times are fine', () => {
    expect(
      _PatchedDateTimeFormat('is', {
        minute: '2-digit',
        hour: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      }).format(new Date('2024-08-03T12:34:01.2345Z'))
    ).toBe('12:34:01,234');
    expect(
      _PatchedDateTimeFormat('is', {
        minute: '2-digit',
        hour: '2-digit',
      }).format(new Date('2024-08-03T12:34:01.2345Z'))
    ).toBe('12:34');
  });

  test('Fixes AM/PM', () => {
    const hour12 = _PatchedDateTimeFormat('is', { hour12: true, timeStyle: 'short' });
    expect(hour12.format(new Date('2024-08-03T15:34'))).toBe('03:34 e.h.');
    // 12 hour clock defaults to h11
    expect(hour12.format(new Date('2024-08-03T00:34'))).toBe('00:34 f.h.');
    // 24 hour clock is fine
    expect(
      _PatchedDateTimeFormat('is', {
        timeStyle: 'long',
        timeZone: 'America/Los_Angeles',
      }).format(new Date('2024-08-03T07:34'))
    ).toBe('00:34:00 GMT-7');
  });

  test('dayPeriod', () => {
    const dpLong = _PatchedDateTimeFormat('is', { dayPeriod: 'long' });
    const dpShort = _PatchedDateTimeFormat('is', { dayPeriod: 'short' });
    const dpNarrow = _PatchedDateTimeFormat('is', { dayPeriod: 'narrow' });
    const variants: Array<[string, string]> = [
      /* 0 */ ['að nóttu', 'n.'],
      /* 1 */ ['að nóttu', 'n.'],
      /* 2 */ ['að nóttu', 'n.'],
      /* 3 */ ['að nóttu', 'n.'],
      /* 4 */ ['að nóttu', 'n.'],
      /* 5 */ ['að morgni', 'mrg.'], // Mismatch: should be 'að nóttu'
      /* 6 */ ['að morgni', 'mrg.'],
      /* 7 */ ['að morgni', 'mrg.'],
      /* 8 */ ['að morgni', 'mrg.'],
      /* 9 */ ['að morgni', 'mrg.'],
      /* 10 */ ['að morgni', 'mrg.'],
      /* 11 */ ['að morgni', 'mrg.'],
      /* 12 */ ['síðdegis', 'sd.'], // Mismatch: should be 'hádegi'
      /* 13 */ ['síðdegis', 'sd.'],
      /* 14 */ ['síðdegis', 'sd.'],
      /* 15 */ ['síðdegis', 'sd.'],
      /* 16 */ ['síðdegis', 'sd.'],
      /* 17 */ ['síðdegis', 'sd.'],
      /* 18 */ ['að kvöldi', 'kv.'],
      /* 19 */ ['að kvöldi', 'kv.'],
      /* 20 */ ['að kvöldi', 'kv.'],
      /* 21 */ ['að kvöldi', 'kv.'],
      /* 22 */ ['að kvöldi', 'kv.'],
      /* 23 */ ['að kvöldi', 'kv.'],
    ];
    variants.forEach(([long, narrow], hour) => {
      const date = new Date(Date.UTC(2021, 0, 1, hour, 0, 0));
      expect(dpLong.format(date)).toBe(long);
      expect(dpShort.format(date)).toBe(long);
      expect(dpNarrow.format(date)).toBe(narrow);
    });
  });

  // Proves that the this is actually a patched instance,
  // Also makes it clear what's not supported (yet).
  test('Not supported features', () => {
    // month: 'narrow'
    expect(
      _PatchedDateTimeFormat('is', { month: 'narrow' }).format(new Date('2024-08-03'))
    ).toBe('A');
    // weekday: 'narrow'
    expect(
      _PatchedDateTimeFormat('is', { weekday: 'narrow' }).format(new Date('2024-07-24'))
    ).toBe('O');
    // timeZoneStyle: 'narrow'
    expect(
      _PatchedDateTimeFormat('is', {
        timeZone: 'America/Los_Angeles',
        timeStyle: 'full',
      }).format(new Date('2024-08-03T13:01:00Z'))
    ).toBe('06:01:00 Pacific-sommertid');
  });
});

// ---------------------------------------------------------------------------

describe('_PatchedDateTimeFormat.formatRange', () => {
  test('Translates month names', () => {
    const d1 = new Date(2024, 4, 2);
    const d2 = new Date(2024, 11, 2);
    expect(_PatchedDateTimeFormat('is', { month: 'long' }).formatRange(d1, d2)).toBe(
      'maí–desember'
    );
    expect(_PatchedDateTimeFormat('is', { month: 'short' }).formatRange(d1, d2)).toBe(
      'maí–des.'
    );
  });

  test('Translates weekday names', () => {
    const d1 = new Date(2024, 1, 5);
    const d2 = new Date(2024, 1, 6);
    expect(_PatchedDateTimeFormat('is', { weekday: 'long' }).formatRange(d1, d2)).toBe(
      'mánudagur – þriðjudagur'
    );
    expect(_PatchedDateTimeFormat('is', { weekday: 'short' }).formatRange(d1, d2)).toBe(
      'mán. – þri.'
    );
  });

  test('Fixes AM/PM', () => {
    const hour12 = _PatchedDateTimeFormat('is', { hour12: true, timeStyle: 'short' });
    expect(
      hour12.formatRange(new Date('2024-08-03T15:34'), new Date('2024-08-03T16:34'))
    ).toBe('3:34–4:34 e.h.');
    // 12 hour clock defaults to h11
    expect(
      hour12.formatRange(new Date('2024-08-03T00:34'), new Date('2024-08-03T13:34'))
    ).toBe('0:34 f.h. – 1:34 e.h.');
  });
});

// ---------------------------------------------------------------------------

describe('_PatchedPluralRules', () => {
  test('Can be called with `new`', () => {
    expect(new _PatchedPluralRules('is').select(21)).toBe('one');
    // Throws if called without `new`
    expect(() => _PatchedPluralRules('is')).toThrow(TypeError);

    // respects preceding locales ...including "da"
    expect(new _PatchedPluralRules(['en', 'is']).select(21)).toBe('other');
    expect(new _PatchedPluralRules(['da', 'is']).select(21)).toBe('other');
  });

  test('Has static methods', () => {
    expect(_PatchedPluralRules.supportedLocalesOf(['da'])).toEqual(['da']);
  });

  const islPlural = new _PatchedPluralRules('is');
  const islPluralReal = new _PatchedPluralRules.$original('is');

  test('.select() handles icelandic', () => {
    [-1, 1].forEach((f) => {
      [0, 1, 2, 11, 17, 21, 91, 101, 111, 121, 100011, 101234].forEach((n) => {
        expect(islPlural.select(n)).toEqual(islPluralReal.select(n));
        expect(new _PatchedPluralRules('is', { type: 'ordinal' }).select(n)).toEqual(
          new _PatchedPluralRules.$original('is', { type: 'ordinal' }).select(n)
        );
      });
    });
  });

  test('.selectRange() handles icelandic', () => {
    (
      [
        [0, 3],
        [1, 3],
        [2, 21],
        [11, 21],
        [17, 31],
        [21, 101],
        [91, 92],
      ] as const
    ).forEach(([a, b]) => {
      // @ts-expect-error  (TS doesn't know about the .selectRange() method ...yet?)
      expect(islPlural.selectRange(a, b)).toEqual(islPluralReal.selectRange(a, b));
    });
  });
});

// ---------------------------------------------------------------------------

describe('_PatchedListFormat', () => {
  test('Can be called with `new`', () => {
    const input = ['a', 'b'];
    const opts: Intl.ListFormatOptions = { type: 'disjunction' };
    expect(new _PatchedListFormat('is', opts).format(input)).toBe('a eða b');
    // @ts-expect-error  (Throws if called without `new`)
    expect(() => _PatchedListFormat('is')).toThrow(TypeError);

    // respects preceding locales ...including "da"
    expect(new _PatchedListFormat(['en', 'is'], opts).format(input)).toBe('a or b');
    expect(new _PatchedListFormat(['da', 'is'], opts).format(input)).toBe('a eller b');
  });

  test('Has static methods', () => {
    expect(_PatchedListFormat.supportedLocalesOf(['da'])).toEqual(['da']);
  });

  test('Supports both conjunction and disjunction', () => {
    (['conjunction', 'disjunction', 'unit'] as const).forEach((type) => {
      (['long', 'short', 'narrow'] as const).forEach((style) => {
        [['a', 'b', 'c'], ['a', 'b'], ['a']].forEach((input) => {
          const opts = { style, type };
          const narrowUnit = style === 'narrow' && type === 'unit';
          const comma = narrowUnit ? '' : ',';
          const joint = narrowUnit ? '' : type === 'disjunction' ? ' eða' : ' og';
          expect(new _PatchedListFormat('is', opts).format(['a', 'b', 'c'])).toEqual(
            `a${comma} b${joint} c`
          );
          expect(new _PatchedListFormat('is', opts).format(['a', 'b'])).toEqual(
            `a${joint} b`
          );
          expect(new _PatchedListFormat('is', opts).format(['a'])).toEqual(`a`);
        });
      });
    });
  });
});
