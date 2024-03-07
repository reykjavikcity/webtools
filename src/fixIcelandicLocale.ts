/*
  Mantra: Partial Icelandic suppoort is better than none. Partial Icelandic
  suppoort is better than none. Partial Icelandic suppoort is better than
  none. Partial Icelandic suppoort is better than none. Partial Icelandic...


  TODO:
  Also attempt to patch:

  - `Intl.NumberFormat`
    Only support default plain-number and percent formatting,
    not currency or unit — UNLESS we do some string-replacement hackery,
    and then we may need to handle the possibility of locales arrays
    already containing Danish ahead of "is".

  - `Intl.DateTimeFormat`
    Possible with some mad-scientist string-replacement hackery and
    the `locales` array detection magic, as mentioned above.

*/

const locAliases: Record<string, string> = {
  // Danish feels like a "good enough" substitution for Icelandic.
  // It seems to just the internal order of `Ø` and `Ö` that's different,
  // and when the `sensitivity` option is set to "base" or "accent" then
  // `ð` is consiered a variant of `d` and the letters á, é, í, ó, ú, and ý
  // are not treated as separate letters but simply variants of
  // a, e, i, o, u, and y.
  is: 'da',
  'is-is': 'da',
};

const mapLocales = (locales: string | Array<string> | undefined) => {
  locales = typeof locales === 'string' ? [locales] : locales || [];
  return locales.map((loc) => locAliases[loc.toLowerCase()] || loc);
};

// ---------------------------------------------------------------------------

if ('ö'.localeCompare('p', 'is') < 0) {
  const _localeCompare = String.prototype.localeCompare;

  /**
   * Patching `String.prototype.localeCompare` to support Icelandic in browsers
   * (\*cough* Chrome \*cough*) that don't support the 'is'/'is-IS' locale.
   */
  String.prototype.localeCompare = function (
    this: string,
    that: string,
    locales?: string | Array<string>,
    options?: Intl.CollatorOptions
  ) {
    return _localeCompare.call(this, that, mapLocales(locales), options);
  };
}

// ---------------------------------------------------------------------------

if (Intl.Collator.supportedLocalesOf('is').length === 0) {
  const _Collator = Intl.Collator;

  const Patched = function Collator(
    locales?: string | Array<string>,
    options?: Intl.CollatorOptions
  ) {
    const instance = new _Collator(mapLocales(locales), options);
    Object.setPrototypeOf(instance, Patched.prototype);
    return instance;
  };
  Patched.prototype = Object.create(_Collator.prototype) as Intl.Collator;
  Patched.prototype.constructor = Patched;
  // Static methods
  Patched.supportedLocalesOf = _Collator.supportedLocalesOf;

  Intl.Collator = Patched as typeof Intl.Collator;
}
