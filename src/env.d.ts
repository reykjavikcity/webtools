/// <reference types="node" />

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ProcessEnv {
    readonly NODE_ENV: 'production' | 'development' | 'test';
  }
}
