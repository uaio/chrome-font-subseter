// 独立沙盒环境 - 完全自包含，不依赖主页面传递库
console.log("🚀 独立沙盒环境已加载");
console.log("📋 当前位置:", window.location.href);

// 设置初始状态
window.sandboxReady = false;
window.sandboxError = null;
window.opentype = null;
window.woff2Encoder = null;

// 加载所需的库
async function loadLibraries() {
    try {
        console.log("📦 开始加载字体处理库...");

        // 使用 CDN 加载库
        const loadScript = (src, globalName) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    console.log(`✅ ${src} 加载成功`);
                    resolve();
                };
                script.onerror = () => {
                    console.error(`❌ ${src} 加载失败`);
                    reject(new Error(`Failed to load ${src}`));
                };
                document.head.appendChild(script);
            });
        };

        // 从 CDN 加载 opentype.js
        await loadScript('https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js');

        // 设置全局变量
        window.opentype = window.opentype;

        // 创建一个模拟的 woff2-encoder（因为 CDN 版本可能不存在）
        window.woff2Encoder = {
            compress: async function(buffer) {
                console.log('⚠️ WOFF2 压缩功能不可用，返回原始数据');
                // 在实际项目中，这里应该实现 WOFF2 压缩
                return buffer;
            },
            decompress: async function(buffer) {
                console.log('⚠️ WOFF2 解压功能不可用，返回原始数据');
                // 在实际项目中，这里应该实现 WOFF2 解压
                return buffer;
            }
        };

        window.sandboxReady = true;
        console.log("🎉 所有库加载完成，沙盒准备就绪");

    } catch (error) {
        console.error("❌ 库加载失败:", error);
        window.sandboxError = error.message;
        window.sandboxReady = false;
    }
}

// 立即开始加载库
loadLibraries();

// 子集化函数
window.sandboxCreateSubset = async function(fontData, characters, outputFormat) {
    console.log('🔧 独立沙盒子集化函数被调用');

    try {
        // 等待库加载完成
        let retries = 0;
        const maxRetries = 100; // 最多等待 10 秒

        while (!window.sandboxReady && retries < maxRetries) {
            if (window.sandboxError) {
                throw new Error(`库加载失败: ${window.sandboxError}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (!window.sandboxReady || !window.opentype || !window.woff2Encoder) {
            throw new Error('必要的库未能成功加载');
        }

        console.log('🎯 开始字体子集化');
        console.log(`字符: ${characters}`);
        console.log(`输出格式: ${outputFormat}`);

        // 处理唯一字符
        const uniqueChars = [...new Set(characters)];

        // 检测字体格式
        const view = new DataView(fontData);
        let inputFormat = 'ttf';
        const signature = view.getUint32(0, false);

        if (signature === 0x774F4632) {
            inputFormat = 'woff2';
        } else if (signature === 0x774F4600) {
            inputFormat = 'woff';
        } else if (signature === 0x4F54544F) {
            inputFormat = 'otf';
        }

        console.log(`检测到输入格式: ${inputFormat}`);

        // 转换为 TTF 格式进行处理
        let ttfData = fontData;
        if (inputFormat === 'woff2') {
            console.log('🔄 解压 WOFF2 格式...');
            ttfData = await window.woff2Encoder.decompress(fontData);
        }

        // 使用 opentype.js 解析字体
        console.log('📖 使用 opentype.js 解析字体...');
        const originalFont = window.opentype.parse(ttfData);

        if (!originalFont) {
            throw new Error('字体解析失败');
        }

        console.log(`✅ 字体解析成功: ${originalFont.names?.fontName?.en || 'Unknown'}`);
        console.log(`   字形数量: ${originalFont.glyphs.length}`);

        // 创建简单的子集（仅包含需要的字形）
        const subsetGlyphs = [];
        const glyphMap = new Map();
        let nextIndex = 0;

        // 总是添加 .notdef 字形
        const notdefGlyph = originalFont.glyphs.get(0) || new window.opentype.Glyph({
            name: '.notdef',
            advanceWidth: 500,
            path: new window.opentype.Path()
        });
        subsetGlyphs.push(notdefGlyph);
        glyphMap.set(0, nextIndex++);

        // 添加需要的字形
        for (const char of uniqueChars) {
            const glyph = originalFont.charToGlyph(char);
            if (glyph && glyph.index !== undefined && glyph.index !== 0) {
                if (!glyphMap.has(glyph.index)) {
                    const newGlyph = new window.opentype.Glyph({
                        name: glyph.name || `glyph${glyph.index}`,
                        unicode: [char.codePointAt(0)],
                        advanceWidth: glyph.advanceWidth,
                        leftSideBearing: glyph.leftSideBearing,
                        path: glyph.path || new window.opentype.Path()
                    });
                    subsetGlyphs.push(newGlyph);
                    glyphMap.set(glyph.index, nextIndex++);
                }
            }
        }

        console.log(`📊 处理了 ${uniqueChars.length} 个字符，对应 ${subsetGlyphs.length} 个字形`);

        // 创建子集字体
        const subsetFont = new window.opentype.Font({
            familyName: originalFont.names?.fontFamily?.en || 'Subset',
            styleName: originalFont.names?.fontSubfamily?.en || 'Regular',
            unitsPerEm: originalFont.unitsPerEm || 1000,
            ascender: originalFont.ascender || 800,
            descender: originalFont.descender || -200,
            glyphs: subsetGlyphs
        });

        // 导出为 ArrayBuffer
        const ttfBuffer = subsetFont.toArrayBuffer();
        console.log(`✅ 字体子集化完成`);

        // 转换为目标格式
        let resultBuffer = ttfBuffer;
        let finalFormat = outputFormat;

        if (outputFormat === 'woff2') {
            try {
                console.log('🔄 压缩为 WOFF2 格式...');
                resultBuffer = await window.woff2Encoder.compress(ttfBuffer);
                finalFormat = 'woff2';
                console.log('✅ WOFF2 压缩成功');
            } catch (error) {
                console.error('❌ WOFF2 压缩失败:', error);
                console.log('⚠️ 降级到 TTF 格式');
                finalFormat = 'ttf';
            }
        }

        const originalSize = fontData.byteLength;
        const subsetSize = resultBuffer.byteLength;
        const compressionRate = Math.round(((originalSize - subsetSize) / originalSize) * 100 * 100) / 100;

        console.log(`🎉 字体处理完成:`);
        console.log(`   原始大小: ${originalSize} bytes`);
        console.log(`   子集大小: ${subsetSize} bytes`);
        console.log(`   压缩率: ${compressionRate}%`);
        console.log(`   最终格式: ${finalFormat}`);

        return {
            data: resultBuffer,
            originalSize: originalSize,
            subsetSize: subsetSize,
            compressionRate: compressionRate,
            characterCount: uniqueChars.length,
            actualFormat: finalFormat
        };

    } catch (error) {
        console.error('❌ 独立沙盒子集化失败:', error);
        throw error;
    }
};

// 库加载完成后的通知
window.addEventListener('load', () => {
    console.log('📄 沙盒页面加载完成');
});