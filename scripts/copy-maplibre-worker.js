const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist');
const destDir = path.join(__dirname, '..', 'public', 'maplibre');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'].forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`[postinstall] Copied ${file} to public/maplibre/`);
  }
});
