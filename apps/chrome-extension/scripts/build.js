import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 复制 manifest.json 到 dist 目录
const srcManifest = path.join(__dirname, '../manifest.json');
const distManifest = path.join(__dirname, '../dist/manifest.json');

fs.copyFileSync(srcManifest, distManifest);
console.log('Manifest copied to dist/manifest.json');

// 复制 icons 目录
const srcIcons = path.join(__dirname, '../public/icons');
const distIcons = path.join(__dirname, '../dist/icons');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    fs.copyFileSync(srcPath, destPath);
  });
}

if (fs.existsSync(srcIcons)) {
  copyDir(srcIcons, distIcons);
  console.log('Icons copied to dist/icons/');
}