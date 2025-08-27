import esbuild from 'esbuild';

console.log('Starting programmatic esbuild build...');

esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'esnext',
  outfile: 'dist/server.js',
  format: 'esm',
}).then(() => {
  console.log('⚡ Build finished successfully!');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});