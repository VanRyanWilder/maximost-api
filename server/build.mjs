import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entryPoint = path.resolve(__dirname, 'src/index.ts');
const outFile = path.resolve(__dirname, '../dist/_worker.js');

try {
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    outfile: outFile,
    platform: 'browser',
    format: 'esm',
    conditions: ['worker', 'browser'],
  });
  console.log('Build finished successfully:', outFile);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
