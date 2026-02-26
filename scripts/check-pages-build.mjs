import fs from 'node:fs';
import path from 'node:path';

const distIndexPath = path.resolve('dist/index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error('No existe dist/index.html. Ejecuta primero: npm run build');
  process.exit(1);
}

const html = fs.readFileSync(distIndexPath, 'utf8');

const referencesSourceFiles = /src\/(main|bootstrap)\.(jsx|js)/i.test(html);
const referencesBuiltAssets = /assets\//i.test(html);

if (referencesSourceFiles || !referencesBuiltAssets) {
  console.error('Build inválido para GitHub Pages: dist/index.html referencia archivos fuente en lugar de assets compilados.');
  process.exit(1);
}

console.log('Build OK: dist/index.html referencia assets compilados.');
console.log('Recuerda configurar Pages para publicar dist (gh-pages o GitHub Actions), no main/root.');
