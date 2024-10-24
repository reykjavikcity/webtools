type IntlClassLike = {
  supportedLocalesOf: (
    locales: string | Array<string>,
    options?: Record<string, unknown>
  ) => Array<string>;
};

const islLocaleRe = /^isl?(?:-|$)/i;

const mapLocales = (
  constr: IntlClassLike,
  locales: string | Array<string> | undefined
): [string] | undefined => {
  locales = typeof locales === 'string' ? [locales] : locales || [];
  for (let i = 0, loc; (loc = locales[i]); i++) {
    const isIslLocale = islLocaleRe.test(loc);
    if (isIslLocale) {
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
    if (constr.supportedLocalesOf(loc).length) {
      return; // no mapping needed. YOLO!
    }
  }
};

const patchSupportedLocalesOf = <T extends IntlClassLike>(
  constr: T
): T['supportedLocalesOf'] => {
  const BASE_CHAR_CODE = 64; // 'A'.charCodeAt(0) - 1; // used for generating unique suffix for fake locales
  const sLO: T['supportedLocalesOf'] = (locales, options) => {
    let localesArr = typeof locales === 'string' ? [locales] : locales;
    const memoIsl: Array<string> = [];
    localesArr = localesArr.map((locale) => {
      if (islLocaleRe.test(locale)) {
        // Some engines throw a RangeError if the locale is weirdly shaped,
        // so we must use a short, safe, unique fake locale instead,
        // and store the actual locale in `memoIsl` for later reinsertion.
        memoIsl.push(locale);
        return `da-X${String.fromCharCode(BASE_CHAR_CODE + memoIsl.length)}`;
      }
      return locale;
    });
    const supportedLocales = constr.supportedLocalesOf(localesArr, options);
    if (!memoIsl.length) {
      return supportedLocales;
    }
    return supportedLocales.map((locale) =>
      locale.startsWith('da-X') ? memoIsl.shift()! : locale
    );
  };
  return sLO;
};

const combineParts = (parts: Array<{ value: string }>) =>
  parts.map(({ value }) => value).join('');

// ===========================================================================
// Collator
// ===========================================================================

const _Collator = Intl.Collator;

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
  const mappedLocales = mapLocales(_Collator, locales);
  const super_ = _Collator(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.compare = (a, b) => {
    const res1 = super_.compare(a, b);
    if (!mapped) {
      return res1;
    }
    const a0 = a.charAt(0);
    const b0 = b.charAt(0);
    if (/\d/.test(a0 + b0)) {
      return res1;
    }
    const res2 = super_.compare(a0, b0);
    return res2 !== 0 ? res2 : res1;
  };
  this.resolvedOptions = () => super_.resolvedOptions();
};

PatchedCollator.prototype = { constructor: PatchedCollator };
PatchedCollator.supportedLocalesOf = /*#__PURE__*/ patchSupportedLocalesOf(_Collator);
PatchedCollator.$original = _Collator;

export const _PatchedCollator = PatchedCollator as unknown as typeof Intl.Collator & {
  $original: typeof Intl.Collator;
};

// ---------------------------------------------------------------------------

const _stringLocaleCompare = String.prototype.localeCompare;

export const _patchedStringLocaleCompare = function localeCompare(
  this: string,
  that: string,
  locales?: string | Array<string>,
  options?: Intl.CollatorOptions
) {
  return _PatchedCollator(locales, options).compare(this, that);
};
_patchedStringLocaleCompare.$original = _stringLocaleCompare;

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
  const mappedLocales = mapLocales(_NumberFormat, locales);
  const super_ = _NumberFormat(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.format = (value) =>
    mapped ? combineParts(this.formatToParts(value)) : super_.format(value);
  this.formatRange = (value1, value2) =>
    mapped
      ? combineParts(this.formatRangeToParts(value1, value2))
      : super_.formatRange(value1, value2);
  this.formatToParts = (value) => {
    const parts = super_.formatToParts(value);
    return mapped ? reformatNumberParts(super_, parts) : parts;
  };
  this.formatRangeToParts = (value1, value2) => {
    const parts = super_.formatRangeToParts(value1, value2);
    return mapped ? reformatNumberParts(super_, parts) : parts;
  };
  this.resolvedOptions = () => super_.resolvedOptions();
};

PatchedNumberFormat.prototype = { constructor: PatchedNumberFormat };
PatchedNumberFormat.supportedLocalesOf =
  /*#__PURE__*/ patchSupportedLocalesOf(_NumberFormat);
PatchedNumberFormat.$original = _NumberFormat;

export const _PatchedNumberFormat =
  PatchedNumberFormat as unknown as typeof Intl.NumberFormat & {
    $original: typeof Intl.NumberFormat;
  };

// ---------------------------------------------------------------------------

const _numberToLocaleString = Number.prototype.toLocaleString;

export const _patchedNumberToLocaleString = function toLocaleString(
  this: number,
  locales?: string | Array<string>,
  options?: Intl.NumberFormatOptions
) {
  return _PatchedNumberFormat(locales, options).format(this);
};
_patchedNumberToLocaleString.$original = _numberToLocaleString;

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
      return ', ';
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
  const mappedLocales = mapLocales(_DateTimeFormat, locales);
  if (options?.hour12) {
    options = {
      ...options,
      hour12: undefined,
      hourCycle: 'h11',
    };
  }
  const super_ = _DateTimeFormat(mappedLocales || locales, options);
  const mapped = !!mappedLocales;

  this.format = (value) =>
    mapped ? combineParts(this.formatToParts(value)) : super_.format(value);
  this.formatRange = (value1, value2) =>
    mapped
      ? combineParts(this.formatRangeToParts(value1, value2))
      : super_.formatRange(value1, value2);

  this.formatToParts = (value) => {
    const parts = super_.formatToParts(value);
    return mapped ? reformatDateTimeParts(super_, parts) : parts;
  };
  this.formatRangeToParts = (value1, value2) => {
    const parts = super_.formatRangeToParts(value1, value2);
    return mapped ? reformatDateTimeParts(super_, parts) : parts;
  };
  this.resolvedOptions = () => super_.resolvedOptions();
};

PatchedDateTimeFormat.prototype = { constructor: PatchedDateTimeFormat };
PatchedDateTimeFormat.supportedLocalesOf =
  /*#__PURE__*/ patchSupportedLocalesOf(_DateTimeFormat);
PatchedDateTimeFormat.$original = _DateTimeFormat;

export const _PatchedDateTimeFormat =
  PatchedDateTimeFormat as unknown as typeof Intl.DateTimeFormat & {
    $original: typeof Intl.DateTimeFormat;
  };

// ---------------------------------------------------------------------------

const _dateToLocaleString = Date.prototype.toLocaleString;

export const _patchedDateToLocaleString = function toLocaleString(
  this: Date,
  locales?: string | Array<string>,
  options?: Intl.DateTimeFormatOptions
) {
  options = options || {};
  if (
    !options.weekday &&
    !options.year &&
    !options.month &&
    !options.day &&
    !options.dayPeriod &&
    !options.hour &&
    !options.minute &&
    !options.second &&
    !options.fractionalSecondDigits
  ) {
    options = {
      ...options,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
  }

  return _PatchedDateTimeFormat(locales, options).format(this);
};
_patchedDateToLocaleString.$original = _dateToLocaleString;

// ---------------------------------------------------------------------------

const _dateToLocaleDateString = Date.prototype.toLocaleDateString;

export const _patchedDateToLocaleDateString = function toLocaleDateString(
  this: Date,
  locales?: string | Array<string>,
  options?: Intl.DateTimeFormatOptions
) {
  options = options || {};
  if (options.timeStyle) {
    throw new TypeError("can't set option timeStyle in Date.toLocaleDateString()");
  }
  if (!options.weekday && !options.year && !options.month && !options.day) {
    options = {
      ...options,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    };
  }
  return _PatchedDateTimeFormat(locales, options).format(this);
};
_patchedDateToLocaleDateString.$original = _dateToLocaleDateString;

// ---------------------------------------------------------------------------

const _dateToLocaleTimeString = Date.prototype.toLocaleTimeString;

export const _patchedDateToLocaleTimeString = function toLocaleTimeString(
  this: Date,
  locales?: string | Array<string>,
  options?: Intl.DateTimeFormatOptions
) {
  options = options || {};
  if (options.dateStyle) {
    throw new TypeError("can't set option dateStyle in Date.toLocaleTimeString()");
  }
  if (
    !options.dayPeriod &&
    !options.hour &&
    !options.minute &&
    !options.second &&
    !options.fractionalSecondDigits
  ) {
    options = {
      ...options,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
  }
  return _PatchedDateTimeFormat(locales, options).format(this);
};
_patchedDateToLocaleTimeString.$original = _dateToLocaleTimeString;

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
      n = n < 0 ? -n : n;
      return this.ord ? 'other' : n % 10 !== 1 || n % 100 === 11 ? 'other' : 'one';
    }

    constructor(locales: string | Array<string>, options?: Intl.PluralRulesOptions) {
      const mappedLocales = mapLocales(_PluralRules, locales);
      super(mappedLocales || locales, options);
      this.mapped = !!mappedLocales;
      this.ord = options?.type === 'ordinal';
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

    static supportedLocalesOf = /*#__PURE__*/ patchSupportedLocalesOf(_PluralRules);
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
      const mappedLocales = mapLocales(_ListFormat, locales);
      super(mappedLocales || locales, options);
      this.mapped = !!mappedLocales;
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
          const { type, value } = item;
          if (type === 'literal' && (value === ' el. ' || value === ' eller ')) {
            item.value = ' eða ';
          }
        }
      }
      return parts;
    }

    static supportedLocalesOf = /*#__PURE__*/ patchSupportedLocalesOf(_ListFormat);
    static $original = _ListFormat;
  };
}

export const _PatchedListFormat =
  PatchedListFormat as unknown as typeof Intl.ListFormat & {
    $original: typeof Intl.ListFormat;
  };

// ===========================================================================
// RelativeTimeFormat
// ===========================================================================

const _RelativeTimeFormat = Intl.RelativeTimeFormat;
let PatchedRelativeTimeFormat;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (_RelativeTimeFormat) {
  let pluralIsl: Intl.PluralRules | undefined;
  let numFormatIsl: Intl.NumberFormat | undefined;

  const islUnits: Record<
    Intl.RelativeTimeFormatUnitSingular,
    [
      long: [sPast: string, pPast: string, sFuture: string, pFuture: string],
      short?: string
    ]
  > = {
    year: [['ári', 'árum', 'ár', 'ár'], ''],
    quarter: [['ársfjórðungi', 'ársfjórðungum', 'ársfjórðung', 'ársfjórðunga'], 'ársfj.'],
    month: [['mánuði', 'mánuðum', 'mánuð', 'mánuði'], 'mán.'],
    week: [['viku', 'vikum', 'viku', 'vikur'], ''],
    day: [['degi', 'dögum', 'dag', 'daga'], ''],
    hour: [['klukkustund', 'klukkustundum', 'klukkustund', 'klukkustundir'], 'klst.'],
    minute: [['mínútu', 'mínútum', 'mínútu', 'mínútur'], 'mín.'],
    second: [['sekúndu', 'sekúndum', 'sekúndu', 'sekúndur'], 'sek.'],
  };
  const phrases: Record<string, string> = {
    nu: 'núna',
    'næste år': 'á næsta ári',
    'sidste år': 'á síðasta ári',
    'i år': 'á þessu ári',

    'sidste kvartal': 'síðasti ársfjórðungur',
    'dette kvartal': 'þessi ársfjórðungur',
    'næste kvartal': 'næsti ársfjórðungur',
    'sidste kvt.': 'síðasti ársfj.',
    'dette kvt.': 'þessi ársfj.',
    'næste kvt.': 'næsti ársfj.',

    'sidste måned': 'í síðasta mánuði',
    'denne måned': 'í þessum mánuði',
    'næste måned': 'í næsta mánuði',
    'sidste md.': 'í síðasta mán.',
    'denne md.': 'í þessum mán.',
    'næste md.': 'í næsta mán.',

    'sidste uge': 'í síðustu viku',
    'denne uge': 'í þessari viku',
    'næste uge': 'í næstu viku',

    'i forgårs': 'í fyrradag',
    'i går': 'í gær',
    'i dag': 'í dag',
    'i morgen': 'á morgun',
    'i overmorgen': 'eftir tvo daga', // 'á hinn daginn',

    'denne time': 'þessa stundina',

    'dette minut': 'á þessari mínútu',
  };

  PatchedRelativeTimeFormat = class RelativeTimeFormat extends _RelativeTimeFormat {
    private mapped: boolean;

    constructor(
      locales: string | Array<string>,
      options?: Intl.RelativeTimeFormatOptions
    ) {
      const mappedLocales = mapLocales(_RelativeTimeFormat, locales);
      super(mappedLocales || locales, options);
      this.mapped = !!mappedLocales;
    }
    format(value: number, unit: Intl.RelativeTimeFormatUnit): string {
      return this.mapped
        ? combineParts(this.formatToParts(value, unit))
        : super.format(value, unit);
    }

    // eslint-disable-next-line complexity
    formatToParts(
      value: number,
      unit: Intl.RelativeTimeFormatUnit
    ): Array<Intl.RelativeTimeFormatPart> {
      const parts = super.formatToParts(value, unit);
      if (!this.mapped) {
        return parts;
      }
      if (!pluralIsl) {
        pluralIsl = new _PatchedPluralRules('is');
      }
      if (!numFormatIsl) {
        numFormatIsl = new _PatchedNumberFormat('is');
      }

      const options = this.resolvedOptions();
      const unitSngl = unit.replace(/s$/, '') as Intl.RelativeTimeFormatUnitSingular;

      if (parts.length === 1) {
        const firstPart = parts[0]!;
        firstPart.value = phrases[firstPart.value] || firstPart.value;
        return parts;
      }

      const [long, short] = islUnits[unitSngl];
      const idx = (value < 0 ? 0 : 2) + (pluralIsl.select(value) === 'one' ? 0 : 1);

      const prefixStr =
        options.style === 'narrow' &&
        (unitSngl === 'second' || unitSngl === 'minute' || unitSngl === 'hour')
          ? value < 0
            ? '-'
            : '+'
          : value < 0
          ? 'fyrir '
          : 'eftir ';
      const valueStr = (options.style !== 'long' && short) || long[idx];

      const islParts: Array<Intl.RelativeTimeFormatPart> = [
        { type: 'literal', value: prefixStr },
        ...(numFormatIsl.formatToParts(Math.abs(value)).map((part) => {
          (part as Exclude<Intl.RelativeTimeFormatPart, { type: 'literal' }>).unit =
            unitSngl;
          return part;
        }) as Array<Intl.RelativeTimeFormatPart>),
        { type: 'literal', value: ` ${valueStr}` },
      ];

      return islParts;
    }

    static $original = _RelativeTimeFormat;
  };
}

export const _PatchedRelativeTimeFormat =
  PatchedRelativeTimeFormat as unknown as typeof Intl.RelativeTimeFormat & {
    $original: typeof Intl.RelativeTimeFormat;
  };
