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

if (/*#__PURE__*/ 'ö'.localeCompare('p', 'is') < 0) {
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
