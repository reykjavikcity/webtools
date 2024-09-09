import {
  _PatchedCollator,
  _PatchedDateTimeFormat,
  _patchedDateToLocaleDateString,
  _patchedDateToLocaleString,
  _patchedDateToLocaleTimeString,
  _PatchedListFormat,
  _PatchedNumberFormat,
  _patchedNumberToLocaleString,
  _PatchedPluralRules,
  _patchedStringLocaleCompare,
} from './fixIcelandicLocale.privates.js';

/*
  Mantra: Partial Icelandic suppoort is better than none. Partial Icelandic
  suppoort is better than none. Partial Icelandic suppoort is better than
  none. Partial Icelandic suppoort is better than none. Partial Icelandic...
*/

if (!Intl.Collator.supportedLocalesOf(['is']).length) {
  Intl.Collator = _PatchedCollator;
  String.prototype.localeCompare = _patchedStringLocaleCompare;

  Intl.NumberFormat = _PatchedNumberFormat;
  Number.prototype.toLocaleString = _patchedNumberToLocaleString;

  Intl.DateTimeFormat = _PatchedDateTimeFormat;
  Date.prototype.toLocaleString = _patchedDateToLocaleString;
  Date.prototype.toLocaleDateString = _patchedDateToLocaleDateString;
  Date.prototype.toLocaleTimeString = _patchedDateToLocaleTimeString;
}
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unnecessary-condition */
if (Intl.ListFormat && !Intl.ListFormat.supportedLocalesOf(['is']).length) {
  (Intl.ListFormat as typeof Intl.ListFormat) = _PatchedListFormat;
}
if (Intl.PluralRules && !Intl.PluralRules.supportedLocalesOf(['is']).length) {
  (Intl.PluralRules as typeof Intl.PluralRules) = _PatchedPluralRules;
}
/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unnecessary-condition */
