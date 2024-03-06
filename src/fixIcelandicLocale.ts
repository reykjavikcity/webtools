/*
  TODO: Also attempt to patch these Classes:

  - `Intl.Collator`
    Same kind of magic as `String.prototype.localeCompare`

  - `Intl.NumberFormat`
    Only support default plain-number and percent formatting,
    not currency or unit — UNLESS we do some string-replacement hackery,
    and then we may need to handle the possibility of locales arrays
    already containing Danish ahead of "is".

  - `Intl.DateTimeFormat`
    Possible with some mad-scientist string-replacement hackery and
    the `locales` array detection magic, as mentioned above.

  Mantra: Partial Icelandic suppoort is better than no Icelandic support.
*/

const locAliases: Record<string, string> = {
  // Danish is good enough substitution for Icelandic
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
   * Polyfill for String.prototype.localeCompare for the 'is' locale
   * in browsers that don't support it (\*cough* Chrome \*cough*).
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
