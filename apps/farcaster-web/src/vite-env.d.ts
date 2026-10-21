/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RELEASE_ID: string;
  readonly VITE_SAME_ORIGIN_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
