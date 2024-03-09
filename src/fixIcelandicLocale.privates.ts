const _Collator = Intl.Collator;
const _NumberFormat = Intl.NumberFormat;
const _DateTimeFormat = Intl.DateTimeFormat;

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

const PatchedCollator = function Collator(
  locales?: string | Array<string>,
  options?: Intl.CollatorOptions
) {
  locales = mapLocales(locales) || locales;
  const instance = new _Collator(locales, options);
  Object.setPrototypeOf(instance, PatchedCollator.prototype);
  return instance;
};
PatchedCollator.prototype = Object.create(_Collator.prototype) as Intl.Collator;
PatchedCollator.prototype.constructor = PatchedCollator;
// Static methods (not patched since "is" is not ACTUALLY supported.)
PatchedCollator.supportedLocalesOf = _Collator.supportedLocalesOf;
PatchedCollator.$original = _Collator;

export const _PatchedCollator = PatchedCollator as typeof Intl.Collator & {
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

const reformatNumberParts = function (
  this: PatchedNumberFormatInstance,
  parts: Array<Intl.NumberFormatPart>
) {
  if (!this.mapped) {
    return parts;
  }
  const options = this.super.resolvedOptions();
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
  mapped: boolean;
  super: Intl.NumberFormat;
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
  this.super = _NumberFormat(mappedLocales || locales, options);
  this.mapped = !!mappedLocales;
};

// This is all very hacky, but extending the class *AND* preseving the
// ability to instantiate without `new` is a bit of a pain.
// Eagerly interested in finding a better way to do this.
const numberFormatProto: PatchedNumberFormatInstance = {
  constructor: PatchedNumberFormat,
  format(value) {
    return combineParts(this.formatToParts(value));
  },
  formatRange(value1, value2) {
    return combineParts(this.formatRangeToParts(value1, value2));
  },
  formatToParts(value) {
    return reformatNumberParts.call(this, this.super.formatToParts(value));
  },
  formatRangeToParts(value1, value2) {
    return reformatNumberParts.call(this, this.super.formatRangeToParts(value1, value2));
  },
  resolvedOptions() {
    return this.super.resolvedOptions();
  },
} as PatchedNumberFormatInstance;

PatchedNumberFormat.prototype = numberFormatProto;
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

const reformatDateTimeParts = function (
  this: PatchedDateTimeFormatInstance,
  parts: Array<Intl.DateTimeFormatPart>
) {
  if (!this.mapped) {
    return parts;
  }
  const options = this.super.resolvedOptions();
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
  mapped: boolean;
  super: Intl.DateTimeFormat;
};

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
  this.super = _DateTimeFormat(mappedLocales || locales, options);
  this.mapped = !!mappedLocales;
};

// This is all very hacky, but extending the class *AND* preseving the
// ability to instantiate without `new` is a bit of a pain.
// Eagerly interested in finding a better way to do this.
const dateTimeFormatProto: PatchedDateTimeFormatInstance = {
  constructor: PatchedDateTimeFormat,
  format(value) {
    return combineParts(this.formatToParts(value));
  },
  formatRange(value1, value2) {
    return combineParts(this.formatRangeToParts(value1, value2));
  },
  formatToParts(value) {
    return reformatDateTimeParts.call(this, this.super.formatToParts(value));
  },
  formatRangeToParts(value1, value2) {
    return reformatDateTimeParts.call(
      this,
      this.super.formatRangeToParts(value1, value2)
    );
  },
  resolvedOptions() {
    return this.super.resolvedOptions();
  },
} as PatchedDateTimeFormatInstance;

PatchedDateTimeFormat.prototype = dateTimeFormatProto;
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
