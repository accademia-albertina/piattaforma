// Tipi per gli import statici di immagini (next/image). next-env.d.ts li include già, ma
// non è versionato: senza questo file `pnpm typecheck` fallisce in CI prima della build.
/// <reference types="next/image-types/global" />
