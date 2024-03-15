import { argStrings, publishToNpm, updatePkgVersion } from '@maranomynet/libtools';

await updatePkgVersion({ preReleaseName: argStrings.name });
await import('./build.js');
await publishToNpm();
