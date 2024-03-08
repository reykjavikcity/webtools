const _Collator = Intl.Collator;

const mapLocales = (
  locales: string | Array<string> | undefined
): [string] | undefined => {
  locales = typeof locales === 'string' ? [locales] : locales || [];
  for (let i = 0, loc; (loc = locales[i]); i++) {
    const isIsLocale = /^isl?(?:-|$)/i.test(loc);
    if (isIsLocale) {
      // Danish feels like a "good enough" substitution for Icelandic.
      // It seems to just the internal order of `Ø` and `Ö` that's different,
      // and when the `sensitivity` option is set to "base" or "accent" then
      // `ð` is consiered a variant of `d` and the letters á, é, í, ó, ú, and ý
      // are not treated as separate letters but simply variants of
      // a, e, i, o, u, and y.
      return ['da'];
    }
    if (_Collator.supportedLocalesOf(loc).length) {
      return; // no mapping needed. YOLO!
    }
  }
};

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

const _NumberFormat = Intl.NumberFormat;

const reformat = function (this: PatchedNumberFormatInstance, result: string) {
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

const reformatParts = function (
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
const prototype: PatchedNumberFormatInstance = {
  constructor: PatchedNumberFormat,
  format(value) {
    return reformat.call(this, this.super.format(value));
  },
  formatRange(value1, value2) {
    return reformat.call(this, this.super.formatRange(value1, value2));
  },
  formatToParts(value) {
    return reformatParts.call(this, this.super.formatToParts(value));
  },
  formatRangeToParts(value1, value2) {
    return reformatParts.call(this, this.super.formatRangeToParts(value1, value2));
  },
  resolvedOptions() {
    return this.super.resolvedOptions();
  },
} as PatchedNumberFormatInstance;

PatchedNumberFormat.prototype = prototype;
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

// ---------------------------------------------------------------------------
