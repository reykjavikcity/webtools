import {
  _PatchedCollator,
  _PatchedDateTimeFormat,
  _patchedLocaleCompare,
  _PatchedNumberFormat,
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
