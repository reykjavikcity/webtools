//@ts-check
import 'node:fs'; // hmm... tricks TS into allowing the process global ¯\_(ツ)_/¯

import {
  args,
  errorCheckSources,
  formatSources,
  lintSources,
} from '@maranomynet/libtools';

if (args.format) {
  await formatSources();
} else if (args.lint) {
  await lintSources();
} else if (args.errors) {
  await errorCheckSources();
} else {
  console.info('No action specified. Use one of: --format, --lint, --errors');
  process.exit(0);
}
