// Build-time switch set by `npm run console`; the deployed site is built without it.
interface ImportMetaEnv {
  readonly VITE_MPILE_CONSOLE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
