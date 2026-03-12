export interface AppEnv {
  DB: D1Database;
  JWT_SECRET: string;
  BRAPI_TOKEN: string;
  COINCAP_API_KEY: string;
  ASSET_CACHE: KVNamespace;
}

export function createNoopExecutionContext(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
    props: {},
  };
}
