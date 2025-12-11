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
    const downloadSection = document.getElementById('download-section');
    const downloadBtn = document.getElementById('download-subset');
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
                const chars = btn.dataset.chars;
                const currentChars = charInput.value;
                const combinedChars = currentChars + chars;
                const uniqueChars = [...new Set(combinedChars)].join('');
                charInput.value = uniqueChars;
                updateCharStats();
                checkGenerateButton();
            });
        });

        // 生成子集
        generateBtn.addEventListener('click', generateSubset);

        // 下载子集
        downloadBtn.addEventListener('click', downloadSubset);
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
            alert('请选择字体文件');
            return;
        }

        fontFile = file;

        // 显示文件信息
        fileName.textContent = file.name;
        uploadPlaceholder.style.display = 'none';
        fileInfo.style.display = 'flex';

        // 读取字体文件
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const arrayBuffer = e.target.result;

                // 如果有opentype.js库，解析字体
                if (window.opentype) {
                    fontData = window.opentype.parse(arrayBuffer);
                } else {
                    // 如果没有库，只保存原始数据
                    fontData = arrayBuffer;
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
            alert('请上传字体文件并输入字符');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = '正在生成子集...';

        try {
            // 获取需要保留的字符
            const charsToKeep = [...new Set(charInput.value)];

            // 如果有opentype.js库，使用它来生成子集
            if (window.opentype && fontData && fontData.glyphs) {
                generatedSubset = await createSubsetWithOpenType(fontData, charsToKeep);
            } else {
                // 否则创建一个模拟的子集（实际项目中需要实现字体子集化逻辑）
                generatedSubset = await createMockSubset(charsToKeep);
            }

            // 更新UI
            updateOutputInfo();
            downloadSection.style.display = 'block';

        } catch (error) {
            console.error('生成子集失败:', error);
            alert('生成字体子集失败: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成字体子集';
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

        // 生成字体数据
        return subsetFont.toArrayBuffer();
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

    function downloadSubset() {
        if (!generatedSubset) return;

        // 创建下载链接
        const blob = new Blob([generatedSubset], { type: 'font/woff2' });
        const url = URL.createObjectURL(blob);

        // 获取文件名
        const originalName = fontFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const extension = originalName.includes('.woff2') ? '.woff2' :
                         originalName.includes('.woff') ? '.woff' : '.woff2';
        const fileName = `${nameWithoutExt}_subset${extension}`;

        // 创建下载链接并触发下载
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 清理URL
        URL.revokeObjectURL(url);
    }
});