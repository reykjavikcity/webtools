import { shell$, typeCheckSources } from '@maranomynet/libtools';

await shell$(`bun install`);
shell$(`bun test --watch --dots`);
typeCheckSources({ watch: true });
