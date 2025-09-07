import esbuild from 'esbuild';

console.log('Starting programmatic esbuild build...');

esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18', // More specific target
  outfile: 'dist/server.js',
  format: 'esm',
  external: [
    '@hono/node-server',
    '@supabase/supabase-js',
    'hono',
    'jsonwebtoken'
  ],
}).then(() => {
  console.log('⚡ Build finished successfully!');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});