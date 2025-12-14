/**
 * 测试 subset-font 的输出格式
 */

// 动态导入 subset-font
async function testSubsetFont() {
  try {
    console.log('开始测试 subset-font...');

    // 导入 subset-font
    const subsetFont = await import('subset-font');
    console.log('subset-font 导入成功:', typeof subsetFont.default);

    // 模拟一个简单的 TTF 字体数据（这里用空的 ArrayBuffer 做测试）
    const testFontData = new ArrayBuffer(100);
    const testData = new Uint8Array(testFontData);

    // 填充一些基本的 TTF 文件头
    testData.set([0x00, 0x01, 0x00, 0x00]); // TTF signature

    const testText = 'ABC123';

    console.log('测试不同格式...');

    // 测试 woff2 格式
    try {
      const woff2Result = await subsetFont.default(testFontData, testText, {
        targetFormat: 'woff2'
      });

      console.log('WOFF2 结果:');
      console.log('- 大小:', woff2Result.byteLength);
      console.log('- 前 8 字节:', new Uint8Array(woff2Result.slice(0, 8)));

      // 检查 WOFF2 签名
      const woff2View = new DataView(woff2Result);
      const signature = woff2View.getUint32(0, true); // little endian

      console.log('- WOFF2 签名 (期望 0x774F4632):', '0x' + signature.toString(16));

      if (signature === 0x774F4632) {
        console.log('✅ WOFF2 签名正确');
      } else {
        console.log('❌ WOFF2 签名错误，可能是 sfnt 格式');
        // 检查是否是 sfnt 格式
        const sfntSignature = woff2View.getUint32(0, false); // big endian
        console.log('- SFNT 签名:', '0x' + sfntSignature.toString(16));
      }
    } catch (error) {
      console.error('WOFF2 生成失败:', error);
    }

    // 测试 sfnt 格式
    try {
      const sfntResult = await subsetFont.default(testFontData, testText, {
        targetFormat: 'sfnt'
      });

      console.log('SFNT 结果:');
      console.log('- 大小:', sfntResult.byteLength);
      console.log('- 前 8 字节:', new Uint8Array(sfntResult.slice(0, 8)));

      // 检查 SFNT 签名
      const sfntView = new DataView(sfntResult);
      const sfntSignature = sfntView.getUint32(0, false); // big endian

      console.log('- SFNT 签名:', '0x' + sfntSignature.toString(16));

      if (sfntSignature === 0x00010000 || sfntSignature === 0x74727565) {
        console.log('✅ SFNT 签名正确');
      } else {
        console.log('❌ SFNT 签名错误');
      }
    } catch (error) {
      console.error('SFNT 生成失败:', error);
    }

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testSubsetFont();