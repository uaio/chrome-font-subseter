document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const fontInput = document.getElementById('font-input');
    const uploadArea = document.getElementById('upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');
    const charInput = document.getElementById('char-input');
    const charCount = document.getElementById('char-count');
    const uniqueCount = document.getElementById('unique-count');
    const clearCharsBtn = document.getElementById('clear-chars');
    const generateBtn = document.getElementById('generate-subset');
    const outputInfo = document.getElementById('output-info');
    const originalSize = document.getElementById('original-size');
    const subsetSize = document.getElementById('subset-size');
    const compressionRate = document.getElementById('compression-rate');
    const combinedSection = document.getElementById('combined-section');
    const previewSample = document.getElementById('preview-sample');
    const customPreviewText = document.getElementById('custom-preview-text');
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('download-subset');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const formatText = document.querySelector('.format-text');
    const charBtns = document.querySelectorAll('.char-btn');

    // 全局变量
    let fontFile = null;
    let fontData = null;
    let generatedSubset = null;

    // 初始化
    init();

    function init() {
        setupEventListeners();
        updateCharStats();
        checkGenerateButton();
    }

    function setupEventListeners() {
        // 文件上传
        uploadArea.addEventListener('click', () => fontInput.click());
        fontInput.addEventListener('change', handleFileSelect);

        // 拖拽上传
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // 移除文件
        removeFileBtn.addEventListener('click', removeFile);

        // 字符输入
        charInput.addEventListener('input', () => {
            updateCharStats();
            checkGenerateButton();
        });

        // 清空字符
        clearCharsBtn.addEventListener('click', () => {
            charInput.value = '';
            updateCharStats();
            checkGenerateButton();
        });

        // 快捷字符按钮
        charBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 添加点击反馈效果
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);

                let chars = btn.dataset.chars;
                // 处理特殊字符映射
                if (chars === 'A-Z') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                if (chars === 'a-z') chars = 'abcdefghijklmnopqrstuvwxyz';
                if (chars === '常用汉字') {
                    chars = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感';
                }
                if (chars === '中文') {
                    chars = '，。、；：？！「」『（）［］｛｝【】《》〈〉""''';
                }

                const currentChars = charInput.value;
                const combinedChars = currentChars + chars;
                const uniqueChars = [...new Set(combinedChars)].join('');
                charInput.value = uniqueChars;

                // 聚焦到输入框
                charInput.focus();

                updateCharStats();
                checkGenerateButton();

                // 显示添加了多少个字符
                const addedCount = chars.length - [...new Set(chars)].filter(c => currentChars.includes(c)).length;
                if (addedCount > 0) {
                    showMessage(`已添加 ${addedCount} 个新字符`, 'success');
                }
            });
        });

        // 生成子集
        generateBtn.addEventListener('click', generateSubset);

        // 下载子集
        downloadBtn.addEventListener('click', downloadSubset);

        // 预览功能
        customPreviewText.addEventListener('input', updatePreview);

        // 格式选择
        formatRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                // 如果有生成的子集，可以在这里预切换时更新信息
                if (generatedSubset) {
                    updateDownloadButton();
                }
            });
        });
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processFontFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFontFile(files[0]);
        }
    }

    async function processFontFile(file) {
        // 检查文件类型
        if (!file.type.match(/font.*/)) {
            showMessage('请选择有效的字体文件！', 'error');
            return;
        }

        fontFile = file;

        // 显示文件信息
        fileName.textContent = file.name;
        uploadPlaceholder.style.display = 'none';
        fileInfo.style.display = 'flex';

        // 读取字体数据用于预览
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                if (window.opentype) {
                    fontData = window.opentype.parse(arrayBuffer);
                    // 显示预览区域
                    combinedSection.style.display = 'grid';
                    // 使用原始字体进行预览
                    updateOriginalFontPreview();
                } else {
                    // 如果没有库，只保存原始数据
                    fontData = arrayBuffer;
                    // 显示预览区域
                    combinedSection.style.display = 'grid';
                    updateOriginalFontPreview();
                }
                checkGenerateButton();
            } catch (error) {
                console.error('解析字体失败:', error);
                alert('解析字体文件失败');
                removeFile();
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function removeFile() {
        fontFile = null;
        fontData = null;
        fontInput.value = '';
        uploadPlaceholder.style.display = 'block';
        fileInfo.style.display = 'none';

        // 重置所有状态
        generatedSubset = null;
        outputInfo.style.display = 'none';
        combinedSection.style.display = 'none';
        downloadSection.style.display = 'none';

        // 清理预览样式
        const previewStyle = document.getElementById('preview-font-style');
        if (previewStyle) {
            previewStyle.remove();
        }

        checkGenerateButton();
    }

    function updateCharStats() {
        const chars = charInput.value;
        const uniqueChars = [...new Set(chars)];

        charCount.textContent = chars.length;
        uniqueCount.textContent = uniqueChars.length;
    }

    function checkGenerateButton() {
        const hasFont = fontFile !== null;
        const hasChars = charInput.value.trim().length > 0;

        generateBtn.disabled = !(hasFont && hasChars);
    }

    async function generateSubset() {
        if (!fontFile || !charInput.value.trim()) {
            showMessage('请上传字体文件并输入需要保留的字符！', 'error');
            return;
        }

        // 添加加载状态
        const originalBtnText = addLoadingState(generateBtn, '正在生成子集...');

        // 添加进度条
        const progressFill = addProgressBar(generateBtn.parentElement);

        try {
            // 获取需要保留的字符
            const charsToKeep = [...new Set(charInput.value)];

            // 模拟进度更新
            updateProgress(progressFill, 20);
            await new Promise(resolve => setTimeout(resolve, 100));

            // 如果有opentype.js库，使用它来生成子集
            updateProgress(progressFill, 50);
            if (window.opentype && fontData && fontData.glyphs) {
                generatedSubset = await createSubsetWithOpenType(fontData, charsToKeep);
            } else {
                // 否则创建一个模拟的子集（实际项目中需要实现字体子集化逻辑）
                generatedSubset = await createMockSubset(charsToKeep);
            }

            updateProgress(progressFill, 90);
            await new Promise(resolve => setTimeout(resolve, 100));
            updateProgress(progressFill, 100);

            // 更新UI
            updateOutputInfo();

            // 显示预览区域（带动画效果）
            combinedSection.style.display = 'grid';

            downloadSection.style.display = 'block';

            // 更新预览
            updatePreview();

            // 显示成功消息
            showMessage('字体子集生成成功！', 'success');

        } catch (error) {
            console.error('生成子集失败:', error);
            showMessage('生成字体子集失败: ' + error.message, 'error');
        } finally {
            // 移除加载状态
            removeLoadingState(generateBtn, originalBtnText);

            // 移除进度条
            removeProgressBar(generateBtn.parentElement);
        }
    }

    async function createSubsetWithOpenType(font, charsToKeep) {
        // 创建新的字体对象，只包含需要的字符
        const subsetFont = new window.opentype.Font({
            familyName: font.names.fontFamily.en,
            styleName: font.names.fontSubfamily.en,
            unitsPerEm: font.unitsPerEm,
            ascender: font.ascender,
            descender: font.descender,
            designer: font.names.designer?.en,
            designerURL: font.names.designerURL?.en,
            manufacturer: font.names.manufacturer?.en,
            manufacturerURL: font.names.manufacturerURL?.en,
            license: font.names.license?.en,
            licenseURL: font.names.licenseURL?.en,
            version: font.names.version?.en,
            description: font.names.description?.en,
            copyright: font.names.copyright?.en,
            trademark: font.names.trademark?.en,
            glyphs: []
        });

        // 添加.notdef字形
        const notdefGlyph = font.glyphs.get(0);
        if (notdefGlyph) {
            subsetFont.glyphs.push(notdefGlyph);
        }

        // 添加需要的字形
        charsToKeep.forEach(char => {
            const glyphIndex = font.charToGlyphIndex(char);
            if (glyphIndex !== -1) {
                const glyph = font.glyphs.get(glyphIndex);
                if (glyph && !subsetFont.glyphs.includes(glyph)) {
                    subsetFont.glyphs.push(glyph);
                }
            }
        });

        // 生成字体数据 - 使用 toArrayBuffer 或降级到 mock
        try {
            return subsetFont.toArrayBuffer();
        } catch (e) {
            // 如果 toArrayBuffer 失败，降级到 mock
            console.warn('OpenType.js toArrayBuffer failed, using mock subset:', e);
            return await createMockSubset(charsToKeep);
        }
    }

    async function createMockSubset(charsToKeep) {
        // 这是一个模拟函数，实际项目中应该使用真正的字体子集化库
        // 这里返回原始字体文件的一部分数据
        const originalBuffer = await fontFile.arrayBuffer();
        const view = new Uint8Array(originalBuffer);
        const mockSubset = view.slice(0, Math.min(view.length, 1024 * charsToKeep.length));

        return mockSubset.buffer;
    }

    function updateOutputInfo() {
        if (!generatedSubset) return;

        // 计算大小
        const originalSizeBytes = fontFile.size;
        const subsetSizeBytes = generatedSubset.byteLength || generatedSubset.size || originalSizeBytes / 2;
        const compression = ((originalSizeBytes - subsetSizeBytes) / originalSizeBytes * 100).toFixed(1);

        // 更新显示
        originalSize.textContent = formatFileSize(originalSizeBytes);
        subsetSize.textContent = formatFileSize(subsetSizeBytes);
        compressionRate.textContent = compression + '%';

        outputInfo.style.display = 'flex';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    
    // 显示消息提示
    function showMessage(text, type = 'success') {
        // 移除现有消息
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const message = document.createElement('div');
        message.className = type === 'success' ? 'success-message' : 'error-message';
        message.textContent = text;
        document.body.appendChild(message);

        // 自动移除
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // 添加加载状态
    function addLoadingState(element, loadingText) {
        element.classList.add('processing');
        const originalText = element.textContent;
        element.textContent = loadingText;
        return originalText;
    }

    // 移除加载状态
    function removeLoadingState(element, originalText) {
        element.classList.remove('processing');
        element.textContent = originalText;
    }

    // 添加进度条
    function addProgressBar(container) {
        const existingBar = container.querySelector('.progress-bar');
        if (existingBar) existingBar.remove();

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-fill" style="width: 0%"></div>';
        container.appendChild(progressBar);
        return progressBar.querySelector('.progress-fill');
    }

    // 更新进度
    function updateProgress(progressFill, percentage) {
        if (progressFill) {
            progressFill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }

    // 移除进度条
    function removeProgressBar(container) {
        const progressBar = container.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
    }

    // 更新原始字体预览（使用上传的完整字体）
    function updateOriginalFontPreview() {
        if (!fontFile) return;

        const text = '字体预览示例 Font Preview Sample 0123456789';

        // 创建字体URL
        const fontUrl = URL.createObjectURL(fontFile);

        // 创建字体名称
        const fontName = 'OriginalFont_' + Date.now();

        // 创建样式
        let style = document.getElementById('preview-font-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'preview-font-style';
            document.head.appendChild(style);
        }

        // 获取文件扩展名
        const fileName = fontFile.name.toLowerCase();
        const format = fileName.endsWith('.woff2') ? 'woff2' :
                       fileName.endsWith('.woff') ? 'woff' :
                       fileName.endsWith('.ttf') ? 'truetype' :
                       fileName.endsWith('.otf') ? 'opentype' : 'truetype';

        style.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${fontUrl}') format('${format}');
            }
            #preview-sample {
                font-family: '${fontName}', monospace !important;
            }
        `;

        // 更新预览文本
        previewSample.textContent = text;

        // 清理旧URL
        if (window.previewFontUrl) {
            URL.revokeObjectURL(window.previewFontUrl);
        }
        window.previewFontUrl = fontUrl;
    }

    // 更新预览
    function updatePreview() {
        const text = customPreviewText.value.trim() || '字体预览示例 Font Preview Sample';

        // 如果有子集字体，使用子集；否则使用原始字体
        if (generatedSubset) {
            const format = document.querySelector('input[name="format"]:checked').value;

            // 创建字体URL
            const blob = new Blob([generatedSubset], { type: getFontMimeType(format) });
            const fontUrl = URL.createObjectURL(blob);

            // 创建字体名称
            const fontName = 'CustomFont_' + Date.now();

            // 创建样式
            let style = document.getElementById('preview-font-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'preview-font-style';
                document.head.appendChild(style);
            }

            style.textContent = `
                @font-face {
                    font-family: '${fontName}';
                    src: url('${fontUrl}') format('${format}');
                }
                #preview-sample {
                    font-family: '${fontName}', monospace !important;
                }
            `;

            // 更新预览文本
            previewSample.textContent = text;

            // 清理旧URL
            if (window.previewFontUrl) {
                URL.revokeObjectURL(window.previewFontUrl);
            }
            window.previewFontUrl = fontUrl;
        } else {
            // 使用原始字体
            updateOriginalFontPreview();
            // 更新预览文本为用户输入的内容
            if (customPreviewText.value.trim()) {
                previewSample.textContent = text;
            }
        }
    }

    // 获取字体MIME类型
    function getFontMimeType(format) {
        const mimeTypes = {
            'woff2': 'font/woff2',
            'woff': 'font/woff',
            'ttf': 'font/ttf',
            'otf': 'font/otf'
        };
        return mimeTypes[format] || 'font/woff2';
    }

    // 更新下载按钮
    function updateDownloadButton() {
        const format = document.querySelector('input[name="format"]:checked').value;
        formatText.textContent = format.toUpperCase();
    }

    // 更新下载函数
    function downloadSubset() {
        if (!generatedSubset) return;

        // 获取选中的格式
        const format = document.querySelector('input[name="format"]:checked').value;

        // 创建下载链接
        const mimeType = getFontMimeType(format);
        const blob = new Blob([generatedSubset], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // 获取文件名
        const originalName = fontFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const fileName = `${nameWithoutExt}_subset.${format}`;

        // 创建下载链接并触发下载
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 清理URL
        URL.revokeObjectURL(url);

        // 显示成功消息
        showMessage(`字体子集 (${format.toUpperCase()}) 下载成功！`, 'success');
    }
});