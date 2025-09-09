import esbuild from 'esbuild';
import pkg from './package.json' assert { type: 'json' };

console.log('Starting programmatic esbuild build...');

esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.js',
  format: 'esm',
  external: Object.keys(pkg.dependencies),
}).then(() => {
  console.log('⚡ Build finished successfully!');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
