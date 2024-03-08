/*
  Mantra: Partial Icelandic suppoort is better than none. Partial Icelandic
  suppoort is better than none. Partial Icelandic suppoort is better than
  none. Partial Icelandic suppoort is better than none. Partial Icelandic...


  TODO:
  Also attempt to patch:

  - `Intl.DateTimeFormat`
    Possible with some mad-scientist string-replacement hackery and
    the `locales` array detection magic, as mentioned above.

*/

import {
  _PatchedCollator,
  _patchedLocaleCompare,
  _PatchedNumberFormat,
  _patchedToLocaleString,
} from './fixIcelandicLocale.privates.js';

if (Intl.Collator.supportedLocalesOf(['is']).length < 1) {
  Intl.Collator = _PatchedCollator;
  String.prototype.localeCompare = _patchedLocaleCompare;

  Intl.NumberFormat = _PatchedNumberFormat;
  Number.prototype.toLocaleString = _patchedToLocaleString;
}
