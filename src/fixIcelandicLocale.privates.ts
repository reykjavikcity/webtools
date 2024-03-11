const _Collator = Intl.Collator;

const mapLocales = (
  locales: string | Array<string> | undefined
): [string] | undefined => {
  locales = typeof locales === 'string' ? [locales] : locales || [];
  for (let i = 0, loc; (loc = locales[i]); i++) {
    const isIsLocale = /^isl?(?:-|$)/i.test(loc);
    if (isIsLocale) {
      // Danish feels like a "good enough" substitution for Icelandic.
      // For alphabetization, it seems to just the internal order of `Ø` and `Ö`
      // that's different, and when the `sensitivity` option is set to "base"
      // or "accent" then `ð` is consiered a variant of `d` and the letters
      // á, é, í, ó, ú, and ý are not treated as separate letters but simply
      // variants of a, e, i, o, u, and y.
      // Also when the accented characters are part of a word, they are treated
      // as fully equal to the base letter.
      return ['da'];
    }
    if (_Collator.supportedLocalesOf(loc).length) {
      return; // no mapping needed. YOLO!
    }
  }
};

const combineParts = (parts: Array<{ value: string }>) =>
  parts.map(({ value }) => value).join('');

// ===========================================================================
// Collator
// ===========================================================================

type PatchedCollatorInstance = Intl.Collator & {
  constructor: typeof PatchedCollator;
};

const PatchedCollator = function Collator(
  this: PatchedCollatorInstance,
  locales?: string | Array<string>,
  options?: Intl.CollatorOptions
) {
  if (!(this instanceof PatchedCollator)) {
    // @ts-expect-error  (YOLO! Can't be arsed)
    return new PatchedCollator(locales, options);
  }
  const mappedLocales = mapLocales(locales);
  const parent = _Collator(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.compare = (a, b) => {
    const res1 = parent.compare(a, b);
    if (!mapped) {
      return res1;
    }
    const a0 = a.charAt(0);
    const b0 = b.charAt(0);
    if (/\d/.test(a0 + b0)) {
      return res1;
    }
    const res2 = parent.compare(a0, b0);
    return res2 !== 0 ? res2 : res1;
  };
  this.resolvedOptions = () => parent.resolvedOptions();
};

PatchedCollator.prototype = { constructor: PatchedCollator };
// Static methods (not patched since "is" is not ACTUALLY supported.)
PatchedCollator.supportedLocalesOf = _Collator.supportedLocalesOf;
PatchedCollator.$original = _Collator;

export const _PatchedCollator = PatchedCollator as unknown as typeof Intl.Collator & {
  $original: typeof Intl.Collator;
};

// ---------------------------------------------------------------------------

const _localeCompare = String.prototype.localeCompare;

export const _patchedLocaleCompare = function localeCompare(
  this: string,
  that: string,
  locales?: string | Array<string>,
  options?: Intl.CollatorOptions
) {
  return _PatchedCollator(locales, options).compare(this, that);
};
_patchedLocaleCompare.$original = _localeCompare;

// ===========================================================================
// NumberFormat
// ===========================================================================

const _NumberFormat = Intl.NumberFormat;

const reformatNumberParts = function <Parts extends Array<Intl.NumberFormatPart>>(
  parent: Intl.NumberFormat,
  parts: Parts
): Parts {
  const options = parent.resolvedOptions();
  if (options.style === 'currency' && options.currencyDisplay === 'symbol') {
    const currency = options.currency;
    if (currency === 'DKK' || currency === 'ISK') {
      parts.forEach((part) => {
        if (part.type === 'currency') {
          part.value = currency === 'DKK' ? 'DKK' : 'kr.';
        }
      });
    }
  }
  return parts;
};

type PatchedNumberFormatInstance = Intl.NumberFormat & {
  constructor: typeof PatchedNumberFormat;
};

const PatchedNumberFormat = function NumberFormat(
  this: PatchedNumberFormatInstance,
  locales?: string | Array<string>,
  options?: Intl.NumberFormatOptions
) {
  if (!(this instanceof PatchedNumberFormat)) {
    // @ts-expect-error  (YOLO! Can't be arsed)
    return new PatchedNumberFormat(locales, options);
  }
  const mappedLocales = mapLocales(locales);
  const parent = _NumberFormat(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.format = (value) => combineParts(this.formatToParts(value));
  this.formatRange = (value1, value2) =>
    combineParts(this.formatRangeToParts(value1, value2));
  this.formatToParts = (value) => {
    const parts = parent.formatToParts(value);
    return mapped ? reformatNumberParts(parent, parts) : parts;
  };
  this.formatRangeToParts = (value1, value2) => {
    const parts = parent.formatRangeToParts(value1, value2);
    return mapped ? reformatNumberParts(parent, parts) : parts;
  };
  this.resolvedOptions = () => parent.resolvedOptions();
};

PatchedNumberFormat.prototype = { constructor: PatchedNumberFormat };
// Static methods (not patched since "is" is not ACTUALLY supported.)
PatchedNumberFormat.supportedLocalesOf = _NumberFormat.supportedLocalesOf;
PatchedNumberFormat.$original = _NumberFormat;

export const _PatchedNumberFormat =
  PatchedNumberFormat as unknown as typeof Intl.NumberFormat & {
    $original: typeof Intl.NumberFormat;
  };

// ---------------------------------------------------------------------------

const _toLocaleString = Number.prototype.toLocaleString;

export const _patchedToLocaleString = function toLocaleString(
  this: number,
  locales?: string | Array<string>,
  options?: Intl.NumberFormatOptions
) {
  return _PatchedNumberFormat(locales, options).format(this);
};
_patchedToLocaleString.$original = _toLocaleString;

// ===========================================================================
// DateTimeFormat
// ===========================================================================

const months: Record<string, string> = {
  jan: 'janúar',
  feb: 'febrúar',
  mar: 'mars',
  apr: 'apríl',
  maj: 'maí',
  jun: 'júní',
  jul: 'júlí',
  aug: 'ágúst',
  // sep: 'september', // is the same
  okt: 'október',
  nov: 'nóvember',
  dec: 'desember',
};
const weekdays: Record<string, string> = {
  man: 'mánudagur',
  tir: 'þriðjudagur',
  ons: 'miðvikudagur',
  tor: 'fimmtudagur',
  fre: 'föstudagur',
  lør: 'laugardagur',
  søn: 'sunnudagur',
};
const dayPeriods: Record<string, [long: string, narrow?: string]> = {
  AM: ['f.h.'],
  PM: ['e.h.'],
  'om natten': ['að nóttu', 'n.'],
  // Mismatch at 05:00 — da: 'om morgenen', is: 'að nóttu'
  'om morgenen': ['að morgni', 'mrg.'],
  'om formiddagen': ['að morgni', 'mrg.'],
  // Mismatch at 12:00 — da: 'om eftermiddagen', is: 'hádegi'
  'om eftermiddagen': ['síðdegis', 'sd.'],
  'om aftenen': ['að kvöldi', 'kv.'],
};

const partMappers: Partial<
  Record<
    Intl.DateTimeFormatPartTypes,
    (
      value: string,
      lastType: string | undefined,
      option: Intl.ResolvedDateTimeFormatOptions
    ) => string | undefined
  >
> = {
  month: (value) => {
    const isl = months[value.slice(0, 3)];
    if (isl) {
      return value.endsWith('.') ? `${isl.slice(0, 3)}.` : isl;
    }
  },
  weekday: (value) => {
    const isl = weekdays[value.slice(0, 3)];
    if (isl) {
      return value.endsWith('.') ? `${isl.slice(0, 3)}.` : isl;
    }
  },
  era: (value) => {
    if (!value.endsWith('.')) {
      return value.length === 3
        ? `${value[0]!}.k.`
        : value[0] === 'f'
        ? 'fyrir Krist'
        : 'eftir Krist';
    }
  },
  dayPeriod: (value, _, options) => {
    const isl = dayPeriods[value];
    if (isl) {
      const [long, narrow] = isl;
      return options.dayPeriod === 'narrow' ? narrow : long;
    }
  },
  literal: (value, lastType) => {
    if (value === ' den ') {
      return 'inn ';
    } else if (value === '.' && (lastType === 'hour' || lastType === 'minute')) {
      return ':';
    }
  },
};

const reformatDateTimeParts = function <Parts extends Array<Intl.DateTimeFormatPart>>(
  parent: Intl.DateTimeFormat,
  parts: Parts
): Parts {
  const options = parent.resolvedOptions();
  parts.forEach((part, idx) => {
    const mapper = partMappers[part.type];
    const newValue = mapper && mapper(part.value, parts[idx - 1]?.type, options);
    if (newValue != null) {
      part.value = newValue;
    }
  });

  return parts;
};

type PatchedDateTimeFormatInstance = Intl.DateTimeFormat & {
  constructor: typeof PatchedDateTimeFormat;
};

const _DateTimeFormat = Intl.DateTimeFormat;

const PatchedDateTimeFormat = function DateTimeFormat(
  this: PatchedDateTimeFormatInstance,
  locales?: string | Array<string>,
  options?: Intl.DateTimeFormatOptions
) {
  if (!(this instanceof PatchedDateTimeFormat)) {
    // @ts-expect-error  (YOLO! Can't be arsed)
    return new PatchedDateTimeFormat(locales, options);
  }
  const mappedLocales = mapLocales(locales);
  if (options?.hour12) {
    options = {
      ...options,
      hour12: undefined,
      hourCycle: 'h11',
    };
  }
  const parent = _DateTimeFormat(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.format = (value) => combineParts(this.formatToParts(value));
  this.formatRange = (value1, value2) =>
    combineParts(this.formatRangeToParts(value1, value2));

  this.formatToParts = (value) => {
    const parts = parent.formatToParts(value);
    return mapped ? reformatDateTimeParts(parent, parts) : parts;
  };
  this.formatRangeToParts = (value1, value2) => {
    const parts = parent.formatRangeToParts(value1, value2);
    return mapped ? reformatDateTimeParts(parent, parts) : parts;
  };
  this.resolvedOptions = () => parent.resolvedOptions();
};

PatchedDateTimeFormat.prototype = { constructor: PatchedDateTimeFormat };
// Static methods (not patched since "is" is not ACTUALLY supported.)
PatchedDateTimeFormat.supportedLocalesOf = _DateTimeFormat.supportedLocalesOf;
PatchedDateTimeFormat.$original = _DateTimeFormat;

export const _PatchedDateTimeFormat =
  PatchedDateTimeFormat as unknown as typeof Intl.DateTimeFormat & {
    $original: typeof Intl.DateTimeFormat;
  };

// ---------------------------------------------------------------------------

const _toLocaleDateString = Date.prototype.toLocaleDateString;

export const _patchedToLocaleDateString = function toLocaleDateString(
  this: Date,
  locales?: string | Array<string>,
  options?: Intl.DateTimeFormatOptions
) {
  return _PatchedDateTimeFormat(locales, options).format(this);
};
_patchedToLocaleDateString.$original = _toLocaleDateString;

// ===========================================================================
// PluralRules
// ===========================================================================

const _PluralRules = Intl.PluralRules;
let PatchedPluralRules;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (_PluralRules) {
  PatchedPluralRules = class PluralRules extends _PluralRules {
    private mapped: boolean;
    private ord: boolean;
    private pluralIsl(n: number) {
      return this.ord ? 'other' : n % 10 !== 1 || n % 100 === 11 ? 'other' : 'one';
    }

    constructor(locales: string | Array<string>, options?: Intl.PluralRulesOptions) {
      const mappedLocales = mapLocales(locales);
      super(mappedLocales || locales, options);
      this.mapped = !!mappedLocales;
      this.ord = options?.type === 'ordinal';

      this.select = this.select.bind(this);
      this.selectRange = this.selectRange.bind(this);
    }
    select(n: number): Intl.LDMLPluralRule {
      if (this.mapped) {
        // Pluralization function for Icelandic
        // Copied over from https://www.npmjs.com/package/translate.js
        return this.pluralIsl(n);
      }
      return super.select(n);
    }
    selectRange(n: number, n2: number): Intl.LDMLPluralRule {
      if (this.mapped) {
        return this.pluralIsl(n2);
      }
      // @ts-expect-error  (TS doesn't know about the .selectRange() method ...yet?)
      return super.selectRange(n, n2);
    }

    static $original = _PluralRules;
  };
}

export const _PatchedPluralRules =
  PatchedPluralRules as unknown as typeof Intl.PluralRules & {
    $original: typeof Intl.PluralRules;
  };

// ===========================================================================
// ListFormat
// ===========================================================================

const _ListFormat = Intl.ListFormat;
let PatchedListFormat;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (_ListFormat) {
  PatchedListFormat = class ListFormat extends _ListFormat {
    private mapped: boolean;

    constructor(locales: string | Array<string>, options?: Intl.ListFormatOptions) {
      const mappedLocales = mapLocales(locales);
      super(mappedLocales || locales, options);
      this.mapped = !!mappedLocales;

      this.format = this.format.bind(this);
      this.formatToParts = this.formatToParts.bind(this);
    }
    format(list: Iterable<string>) {
      return this.mapped ? combineParts(this.formatToParts(list)) : super.format(list);
    }

    formatToParts(
      list: Iterable<string>
    ): Array<{ type: 'element' | 'literal'; value: string }> {
      const parts = super.formatToParts(list);
      if (this.mapped) {
        for (const item of parts) {
          const { value } = item;
          if (item.type === 'literal' && (value === ' el. ' || value === ' eller ')) {
            item.value = ' eða ';
          }
        }
      }
      return parts;
    }

    static $original = _ListFormat;
  };
}

export const _PatchedListFormat =
  PatchedListFormat as unknown as typeof Intl.ListFormat & {
    $original: typeof Intl.ListFormat;
  };
