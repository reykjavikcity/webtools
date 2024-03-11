import {
  _PatchedCollator,
  _PatchedDateTimeFormat,
  _PatchedListFormat,
  _patchedLocaleCompare,
  _PatchedNumberFormat,
  _PatchedPluralRules,
  _patchedToLocaleDateString,
  _patchedToLocaleString,
} from './fixIcelandicLocale.privates.js';

/*
  Mantra: Partial Icelandic suppoort is better than none. Partial Icelandic
  suppoort is better than none. Partial Icelandic suppoort is better than
  none. Partial Icelandic suppoort is better than none. Partial Icelandic...
*/

if (Intl.Collator.supportedLocalesOf(['is']).length < 1) {
  Intl.Collator = _PatchedCollator;
  String.prototype.localeCompare = _patchedLocaleCompare;

  Intl.NumberFormat = _PatchedNumberFormat;
  Number.prototype.toLocaleString = _patchedToLocaleString;

  Intl.DateTimeFormat = _PatchedDateTimeFormat;
  Date.prototype.toLocaleDateString = _patchedToLocaleDateString;
}
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unnecessary-condition */
if (Intl.ListFormat && Intl.ListFormat.supportedLocalesOf(['is']).length < 1) {
  (Intl.ListFormat as typeof Intl.ListFormat) = _PatchedListFormat;
}
if (Intl.PluralRules && Intl.PluralRules.supportedLocalesOf(['is']).length < 1) {
  (Intl.PluralRules as typeof Intl.PluralRules) = _PatchedPluralRules;
}
/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unnecessary-condition */
