/**
 * 沙盒环境中的字体子集化处理器
 * 在这里可以使用 subset-font 和需要 eval 的功能
 */

// 动态导入 subset-font（在沙盒环境中允许）
let subsetFont = null;

async function initSubsetFont() {
  if (subsetFont) return subsetFont;

  try {
    // 尝试导入 subset-font
    const module = await import('subset-font');
    subsetFont = module.default;
    console.log('subset-font 在沙盒中加载成功');
    return subsetFont;
  } catch (error) {
    console.error('subset-font 加载失败:', error);
    return null;
  }
}

// 监听来自主页面的消息
window.addEventListener('message', async (event) => {
  const { type, id, fontBuffer, text, options } = event.data;

  if (type !== 'SUBSET_FONT') return;

  try {
    // 初始化 subset-font
    await initSubsetFont();

    if (!subsetFont) {
      throw new Error('subset-font 不可用，请回退到 opentype.js');
    }

    // 在沙盒中执行子集化（这里可以用 eval）
    const result = await subsetFont(
      new Uint8Array(fontBuffer),
      text,
      {
        targetFormat: options.format || 'woff2',
        // 可选：支持可变字体轴裁剪
        ...(options.variationAxes && { variationAxes: options.variationAxes }),
        ...(options.preserveNameIds && { preserveNameIds: options.preserveNameIds }),
      }
    );

    // 将结果发送回主页面
    event.source.postMessage({
      type: 'SUBSET_RESULT',
      id,
      success: true,
      data: Array.from(new Uint8Array(result)), // 转为普通数组以便传输
      originalSize: fontBuffer.length,
      newSize: result.byteLength,
    }, event.origin);

  } catch (error) {
    console.error('沙盒子集化失败:', error);
    event.source.postMessage({
      type: 'SUBSET_RESULT',
      id,
      success: false,
      error: error.message,
    }, event.origin);
  }
});

// 通知父页面沙盒已准备好
window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');