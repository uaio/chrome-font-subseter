import { watch } from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 复制 manifest.json
function copyManifest() {
  const srcManifest = path.join(__dirname, '../manifest.json');
  const distManifest = path.join(__dirname, '../dist/manifest.json');
  fs.copyFileSync(srcManifest, distManifest);
  console.log('Manifest copied');
}

// 初始复制
copyManifest();

// 监听 manifest.json 变化
watch(path.join(__dirname, '../manifest.json')).on('change', copyManifest);

console.log('Watching for changes...');