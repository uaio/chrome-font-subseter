import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 复制 manifest.json
const srcManifest = path.join(__dirname, '../manifest.json');
const distManifest = path.join(__dirname, '../dist/manifest.json');
fs.copyFileSync(srcManifest, distManifest);

// 移动 popup.html 到根目录
const srcPopup = path.join(__dirname, '../dist/src/popup.html');
const distPopup = path.join(__dirname, '../dist/popup.html');
if (fs.existsSync(srcPopup)) {
  fs.renameSync(srcPopup, distPopup);
}

// 复制 icons
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    fs.copyFileSync(srcPath, destPath);
  });
}

const srcIcons = path.join(__dirname, '../public/icons');
const distIcons = path.join(__dirname, '../dist/icons');
copyDir(srcIcons, distIcons);

console.log('Post-build complete!');