// web/src modules share the DOM-bridge bundle and read import.meta.env —
// Metro defines it at runtime (EXPO_PUBLIC_* only); this declares it for tsc.
interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
