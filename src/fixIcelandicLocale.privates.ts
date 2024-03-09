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

const reformatNumber = function (this: PatchedNumberFormatInstance, result: string) {
  if (!this.mapped) {
    return result;
  }
  const options = this.super.resolvedOptions();
  if (options.style === 'currency' && options.currencyDisplay === 'symbol') {
    if (options.currency === 'DKK') {
      return result.replace(/kr\./g, 'DKK');
    }
    if (options.currency === 'ISK') {
      return result.replace(/ISK/g, 'kr.');
    }
  }
  return result;
};

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
    return reformatNumber.call(this, this.super.format(value));
  },
  formatRange(value1, value2) {
    return reformatNumber.call(this, this.super.formatRange(value1, value2));
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

const months: Array<[da: string, en: string, checkShort?: true]> = [
  ['januar', 'janúar', true],
  ['februar', 'febrúar'],
  ['marts', 'mars'],
  ['april', 'apríl'],
  ['maj', 'maí'],
  ['juni', 'júní', true],
  ['juli', 'júlí', true],
  ['august', 'ágúst', true],
  // ['september', 'september'],
  ['oktober', 'október'],
  ['november', 'nóvember', true],
  ['december', 'desember', true],
];
const weekdays: Array<[da: string, is: string, shortLength?: number]> = [
  ['mandag', 'mánudagur'],
  ['tirsdag', 'þriðjudagur', 4],
  ['onsdag', 'miðvikudagur'],
  ['torsdag', 'fimmtudagur', 4],
  ['fredag', 'föstudagur'],
  ['lørdag', 'laugardagur'],
  ['søndag', 'sunnudagur'],
];
const reformatDateTime = function (this: PatchedDateTimeFormatInstance, result: string) {
  if (!this.mapped) {
    return result;
  }
  const options = this.super.resolvedOptions();

  let monthMatches = 0;
  for (let i = 0, month; (month = months[i]); i++) {
    const [da, is, checkShort] = month;
    let mappedResult = result.replaceAll(da, is);
    if (checkShort && mappedResult === result) {
      mappedResult = mappedResult.replaceAll(da.slice(0, 3), is.slice(0, 3));
    }
    if (mappedResult !== result) {
      monthMatches++;
      result = mappedResult;
      if (monthMatches >= 2) {
        break;
      }
    }
  }

  let weekdayMatches = 0;
  for (let i = 0, weekday; (weekday = weekdays[i]); i++) {
    const [da, is, shortLength] = weekday;
    let mappedResult = result.replaceAll(da, is);
    if (mappedResult === result) {
      mappedResult = mappedResult.replaceAll(
        da.slice(0, shortLength || 3),
        is.slice(0, 3)
      );
    }
    if (mappedResult !== result) {
      weekdayMatches++;
      result = mappedResult;
      if (weekdayMatches >= 2) {
        break;
      }
    }
  }

  if (/Kristus/.test(result)) {
    result = result.replace(/før Kristus/g, 'fyrir Krist');
    result = result.replace(/efter Kristus/g, 'eftir Krist');
  }
  result = result.replace(/(f|e)Kr/g, '$1.k.');

  result = result.replace(/AM/g, 'f.h.');
  result = result.replace(/PM/g, 'e.h.');

  // convert timestamps from `00.00` to `00:00`
  result = result.replace(/(?:^|\s)\d\d\.\d\d(?:\.\d\d)?(?:,|\s|$)/g, (match) =>
    match.replace(/\./g, ':')
  );
  result = result.replace(/ den/g, 'inn');

  return result;
};

const reformatDateTimeParts = function (
  this: PatchedDateTimeFormatInstance,
  parts: Array<Intl.DateTimeFormatPart>
) {
  if (!this.mapped) {
    return parts;
  }
  const options = this.super.resolvedOptions();
  // reformat
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
    return reformatDateTime.call(this, this.super.format(value));
  },
  formatRange(value1, value2) {
    return reformatDateTime.call(this, this.super.formatRange(value1, value2));
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
