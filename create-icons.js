// 使用 Canvas 生成图标
const { createCanvas } = require('canvas');
const fs = require('fs');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.47, 0, 2 * Math.PI);
    ctx.fill();

    // 绘制 "T" 字母（代表Type/字体）
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = Math.max(1, size / 32);

    // T的横线
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size * 0.35);
    ctx.lineTo(size * 0.7, size * 0.35);
    ctx.stroke();

    // T的竖线
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.35);
    ctx.lineTo(size * 0.5, size * 0.75);
    ctx.stroke();

    // 裁剪标记
    ctx.setLineDash([size * 0.04, size * 0.025]);
    ctx.globalAlpha = 0.6;

    // 上裁剪线
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.22);
    ctx.lineTo(size * 0.8, size * 0.22);
    ctx.stroke();

    // 下裁剪线
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.78);
    ctx.lineTo(size * 0.8, size * 0.78);
    ctx.stroke();

    // 小三角表示压缩
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(size * 0.85, size * 0.15);
    ctx.lineTo(size * 0.92, size * 0.25);
    ctx.lineTo(size * 0.78, size * 0.25);
    ctx.closePath();
    ctx.fill();

    return canvas;
}

// 生成所有尺寸的图标
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icons/icon${size}.png`, buffer);
    console.log(`Generated icon${size}.png`);
});

console.log('All icons generated!');