import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['electron/main.ts', 'electron/preload.ts'],
  outDir: 'dist-electron',
  format: ['cjs'],
  target: 'node18',
  clean: true,
  external: ['electron'],
  noExternal: [], // Add node modules here if they need to be bundled
  sourcemap: true,
});
