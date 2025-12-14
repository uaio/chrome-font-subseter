import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FontSubseter,
  OpentypeFontSubseter,
  SandboxFontSubseter,
  parseFont,
  createSubset,
  createOpentypeSubset,
  createSandboxSubset,
  formatFileSize,
  getFontMimeType
} from '@font-subseter/core';

// 声明全局变量类型
declare global {
  interface Window {
    previewFontUrl?: string;
    fontEditorCore?: any;
    woff2Ready?: boolean;
    opentype?: any;
    woff2Encoder?: any;
  }
}

export const App: React.FC = () => {
  // 状态
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontData, setFontData] = useState<any>(null);
  const [generatedSubset, setGeneratedSubset] = useState<ArrayBuffer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputInfo, setOutputInfo] = useState<{
    originalSize: string;
    subsetSize: string;
    compressionRate: string;
  } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('woff2');
  const [generatedFormat, setGeneratedFormat] = useState<string>('woff2');
  const [usePreviewFont, setUsePreviewFont] = useState(false); // 控制是否使用上传的字体预览

  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLTextAreaElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  // 处理文件上传
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFontFile(file);
    }
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFontFile(files[0]);
    }
  }, []);

  // 处理字体文件
  const processFontFile = useCallback(async (file: File) => {
    // 检查文件类型
    if (!file.type.match(/font.*/)) {
      showMessage('请选择有效的字体文件！', 'error');
      return;
    }

    setFontFile(file);

    // 读取字体数据用于预览
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const parsedFont = parseFont(arrayBuffer);
        setFontData(parsedFont);
        // 字体解析完成后更新预览
        setTimeout(() => updatePreview(), 0);
      } catch (error) {
        console.error('解析字体失败:', error);
        showMessage('解析字体文件失败', 'error');
        removeFile();
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // 移除文件
  const removeFile = useCallback(() => {
    setFontFile(null);
    setFontData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setGeneratedSubset(null);
    setOutputInfo(null);

    // 清理预览样式
    const previewStyle = document.getElementById('preview-font-style');
    if (previewStyle) {
      previewStyle.remove();
    }
  }, []);

  // 更新字符统计
  const updateCharStats = useCallback(() => {
    const input = charInputRef.current;
    if (!input) return;

    const chars = input.value;
    const uniqueChars = [...new Set(chars)];

    const charCountEl = document.getElementById('char-count');
    const uniqueCountEl = document.getElementById('unique-count');

    if (charCountEl) charCountEl.textContent = chars.length;
    if (uniqueCountEl) uniqueCountEl.textContent = uniqueChars.length;
  }, []);

  // 检查生成按钮状态
  const checkGenerateButton = useCallback(() => {
    const button = document.getElementById('generate-subset') as HTMLButtonElement;
    if (button) {
      button.disabled = !fontFile || !charInputRef.current?.value.trim();
    }
  }, [fontFile]);

  // 清空字符
  const clearChars = useCallback(() => {
    if (charInputRef.current) {
      charInputRef.current.value = '';
    }
    updateCharStats();
    updatePreview();
    checkGenerateButton();
  }, [updateCharStats, checkGenerateButton]);

  // 快捷字符按钮点击
  const handleCharButtonClick = useCallback((chars: string) => {
    const current = charInputRef.current?.value || '';
    const combined = current + chars;
    const unique = [...new Set(combined)].join('');

    if (charInputRef.current) {
      charInputRef.current.value = unique;
      charInputRef.current.focus();
    }

    updateCharStats();
    updatePreview();
    checkGenerateButton();

    const added = chars.length - [...new Set(chars)].filter(c => current.includes(c)).length;
    if (added > 0) {
      showMessage(`已添加 ${added} 个新字符`, 'success');
    }
  }, [updateCharStats, checkGenerateButton]);

  // 生成子集
  const generateSubset = useCallback(async () => {
    if (!fontFile || !charInputRef.current?.value.trim()) {
      showMessage('请上传字体文件并输入需要保留的字符！', 'error');
      return;
    }

    const button = document.getElementById('generate-subset') as HTMLButtonElement;
    const originalText = button?.textContent || '';

    // 添加加载状态
    if (button) {
      button.classList.add('processing');
      button.textContent = '正在生成子集...';
    }

    // 添加进度条
    const progressFill = addProgressBar(button?.parentElement || document.body);

    setIsLoading(true);

    try {
      const charsToKeep = [...new Set(charInputRef.current.value)].join('');
      console.log('生成子集，字符数:', charsToKeep.length, '格式:', selectedFormat);

      // 使用字体子集化库
      updateProgress(progressFill, 20);
      const arrayBuffer = await fontFile.arrayBuffer();
      console.log('字体文件大小:', arrayBuffer.byteLength);

      updateProgress(progressFill, 50);

      // 使用沙盒环境进行子集化（避免CSP违规）
    let subsetResult;

    try {
        console.log('🚀 使用沙盒环境处理格式:', selectedFormat);

        // 使用沙盒字体子集化器
        subsetResult = await createSandboxSubset(arrayBuffer, charsToKeep, {
          outputFormat: selectedFormat as any,
          preserveMetadata: true
        });

        console.log('✅ 沙盒字体子集化成功，实际格式:', subsetResult.actualFormat);

        // 显示格式信息
        if (subsetResult.actualFormat !== selectedFormat) {
          console.log(`ℹ️ 格式转换: ${selectedFormat} → ${subsetResult.actualFormat}`);
        }

        console.log('✅ 子集生成成功，大小:', subsetResult.data.byteLength, '压缩率:', subsetResult.compressionRate + '%', '实际格式:', subsetResult.actualFormat);
      } catch (error) {
        console.error('字体处理失败:', error);
        throw new Error(`字体处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      updateProgress(progressFill, 90);

      setGeneratedSubset(subsetResult.data);
      // 使用实际生成的格式
      setGeneratedFormat(subsetResult.actualFormat);
      console.log('实际生成的格式:', subsetResult.actualFormat);

      updateProgress(progressFill, 100);

      // 更新UI
      updateOutputInfo(subsetResult.data);

      showMessage('字体子集生成成功！', 'success');
    } catch (error) {
      console.error('生成子集失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      // 检查是否是 WOFF2 支持问题
      if (errorMessage.includes('WOFF2_NOT_SUPPORTED') || errorMessage.includes('WebAssembly')) {
        // 提供自动重试选项，使用 WOFF 格式
        if (selectedFormat === 'woff2') {
          // 显示详细错误和自动重试选项
          const retryMessage = `WOFF2 格式在当前环境中不可用。点击"使用 WOFF 格式重试"按钮继续。`;
          showMessage(retryMessage, 'warning');

          // 添加自动重试按钮
          const container = document.querySelector('.subset-controls');
          if (container && !document.querySelector('.retry-woff-button')) {
            const retryButton = document.createElement('button');
            retryButton.className = 'retry-woff-button';
            retryButton.textContent = '使用 WOFF 格式重试';
            retryButton.style.cssText = `
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 8px;
              font-size: 14px;
              width: 100%;
              transition: all 0.3s ease;
            `;
            retryButton.onmouseover = () => {
              retryButton.style.transform = 'translateY(-2px)';
              retryButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            };
            retryButton.onmouseout = () => {
              retryButton.style.transform = 'translateY(0)';
              retryButton.style.boxShadow = 'none';
            };
            retryButton.onclick = () => {
              // 切换到 WOFF 格式并重试
              setSelectedFormat('woff');
              setTimeout(() => {
                generateSubset();
              }, 100);
              retryButton.remove();
            };
            container.appendChild(retryButton);
          }
          return;
        }
      }

      showMessage('生成字体子集失败: ' + errorMessage, 'error');
    } finally {
      // 恢复按钮状态
      if (button) {
        button.classList.remove('processing');
        button.textContent = originalText;
      }

      // 移除进度条
      removeProgressBar(button?.parentElement || document.body);
      setIsLoading(false);
      setProgress(0);
    }
  }, [fontFile]);

  
  // 更新输出信息
  const updateOutputInfo = useCallback((subsetData: ArrayBuffer) => {
    if (!fontFile) return;

    const originalSize = fontFile.size;
    const subsetSize = subsetData.byteLength;
    const compression = ((originalSize - subsetSize) / originalSize * 100).toFixed(1);

    setOutputInfo({
      originalSize: formatFileSize(originalSize),
      subsetSize: formatFileSize(subsetSize),
      compressionRate: compression + '%'
    });
  }, []);

  
  // 下载子集
  const downloadSubset = useCallback(() => {
    if (!generatedSubset) {
      console.log('没有可下载的子集字体');
      return;
    }

    const format = generatedFormat; // 使用生成时的格式
    console.log('下载格式:', format);
    console.log('generatedFormat 值:', generatedFormat);
    console.log('selectedFormat 值:', selectedFormat);

    const mimeType = getFontMimeType(format);
    const blob = new Blob([generatedSubset], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // 获取文件名
    const originalName = fontFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

    // 确定文件扩展名
    let fileExtension = format;
    if (format === 'sfnt') {
      fileExtension = 'ttf'; // sfnt 格式使用 .ttf 扩展名
    }

    const fileName = `${nameWithoutExt}_subset.${fileExtension}`;

    console.log('下载文件名:', fileName);
    console.log('MIME类型:', mimeType);

    // 创建下载链接并触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 清理URL
    URL.revokeObjectURL(url);

    showMessage(`字体子集 (${format.toUpperCase()}) 下载成功！`, 'success');
  }, [generatedSubset, generatedFormat, fontFile, selectedFormat]);

  
  // 更新预览
  const updatePreview = useCallback(async () => {
    if (!fontFile) {
      const fontPreview = document.getElementById('font-preview');
      if (fontPreview) {
        fontPreview.style.display = 'none';
      }

      // 清理预览样式
      const previewStyle = document.getElementById('preview-font-style');
      if (previewStyle) {
        previewStyle.remove();
      }
      return;
    }

    const fontPreview = document.getElementById('font-preview');
    const previewText = document.getElementById('preview-text');

    if (fontPreview) {
      fontPreview.style.display = 'block';
    }

    const chars = charInputRef.current?.value || '';
    // 显示完整文本，不截断
    let text = chars;
    if (!chars) {
      text = '请输入需要保留的字符';
    }

    if (previewText) {
      previewText.textContent = text;

      // 准备字体样式
      let previewStyle = document.getElementById('preview-font-style');
      if (!previewStyle) {
        previewStyle = document.createElement('style');
        previewStyle.id = 'preview-font-style';
        document.head.appendChild(previewStyle);
      }

      // 清理旧的字体URL
      if (window.previewFontUrl) {
        URL.revokeObjectURL(window.previewFontUrl);
      }

      let fontBuffer: ArrayBuffer;
      let fontFormat: string;
      let fontSource: string;

      // 决定使用哪个字体进行预览
      if (generatedSubset && usePreviewFont) {
        // 使用生成的子集字体
        fontBuffer = generatedSubset;
        fontFormat = generatedFormat;
        fontSource = '子集字体';
      } else if (fontFile) {
        // 使用原始字体
        fontBuffer = await fontFile.arrayBuffer();
        fontFormat = fontFile.name.split('.').pop()?.toLowerCase() || 'ttf';
        fontSource = '原始字体';
      } else {
        // 使用默认字体
        previewStyle.textContent = `
          #preview-text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto, sans-serif !important;
          }
        `;
        return;
      }

      // 创建字体blob
      const mimeType = getFontMimeType(fontFormat as any);
      const fontBlob = new Blob([fontBuffer], { type: mimeType });
      window.previewFontUrl = URL.createObjectURL(fontBlob);

      // 根据格式设置正确的format描述
      const formatMap: Record<string, string> = {
        'ttf': 'truetype',
        'otf': 'opentype',
        'woff': 'woff',
        'woff2': 'woff2'
      };

      const fontFormatStr = formatMap[fontFormat] || 'truetype';
      const fontName = `PreviewFont_${Date.now()}`;

      previewStyle.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${window.previewFontUrl}') format('${fontFormatStr}');
        }
        #preview-text {
          font-family: '${fontName}', monospace !important;
        }
      `;

      console.log(`预览使用: ${fontSource}, 格式: ${fontFormat}`);
    } else {
      // 使用默认字体
      previewStyle.textContent = `
        #preview-text {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto, sans-serif !important;
        }
      `;
    }
  }, [fontFile, fontData, usePreviewFont, generatedSubset, generatedFormat]);

  // 显示消息
  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
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
  }, []);

  // 添加进度条
  const addProgressBar = (container: HTMLElement | null): HTMLDivElement | null => {
    if (!container) return null;

    const existingBar = container.querySelector('.progress-bar');
    if (existingBar) existingBar.remove();

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill" style="width: 0%"></div>';
    container.appendChild(progressBar);
    return progressBar.querySelector('.progress-fill');
  };

  // 移除进度条
  const removeProgressBar = (container: HTMLElement | null): void => {
    if (!container) return;

    const progressBar = container.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.remove();
    }
  };

  // 更新进度
  const updateProgress = (progressFill: HTMLDivElement | null, percentage: number) => {
    if (progressFill) {
      progressFill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }
  };

  // 初始化
  useEffect(() => {
    updateCharStats();
    checkGenerateButton();

    // 监听字符输入
    const input = charInputRef.current;
    if (input) {
      input.addEventListener('input', updateCharStats);
      input.addEventListener('input', updatePreview);
      input.addEventListener('input', checkGenerateButton);
    }
  }, [updateCharStats, updatePreview, checkGenerateButton]);

  return (
    <>
      <div className="section">
        <h2>上传字体文件</h2>
        <div
          className={`upload-area ${isDragging ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="font-input"
            accept=".ttf,.otf,.woff,.woff2"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div className="upload-placeholder" id="upload-placeholder" style={{ display: fontFile ? 'none' : 'flex' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <p>点击或拖拽字体文件到此处</p>
            <p className="small">支持 TTF, OTF, WOFF, WOFF2 格式</p>
          </div>
          <div className="file-info" id="file-info" style={{ display: fontFile ? 'flex' : 'none' }}>
            <span className="file-name" id="file-name">{fontFile?.name}</span>
            <button className="btn-remove" onClick={removeFile}>×</button>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>快捷字符</h2>
        <div className="char-shortcuts">
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('0123456789')}
          >
            数字 (0-9)
          </button>
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}
          >
            大写字母 (A-Z)
          </button>
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('abcdefghijklmnopqrstuvwxyz')}
          >
            小写字母 (a-z)
          </button>
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('!@#$%^&*()_+-=[]{}|;:\'",./<>?')}
          >
            标点符号
          </button>
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感')}
          >
            常用汉字
          </button>
          <button
            className="char-btn"
            onClick={() => handleCharButtonClick('，。、；：？！「」『（）［］｛｝【】《》〈〉""\'\'')}
          >
            中文标点
          </button>
        </div>
      </div>

      <div className="section">
        <h2>输入字符</h2>
        <div className="text-input-area">
          <textarea
            ref={charInputRef}
            id="char-input"
            placeholder="在这里输入需要保留的字符..."
            rows={4}
          />
          <div className="input-stats">
            <span>字符数：<span id="char-count">0</span></span>
            <span>去重后：<span id="unique-count">0</span></span>
            <button className="btn-clear" onClick={clearChars}>清空</button>
          </div>
          <div className="font-preview" id="font-preview" style={{ display: 'none' }}>
            <div className="preview-controls">
              <button
                className={`font-toggle-btn ${usePreviewFont ? 'active' : ''}`}
                onClick={() => {
                  setUsePreviewFont(!usePreviewFont);
                  setTimeout(() => updatePreview(), 0);
                }}
              >
                {generatedSubset ? (usePreviewFont ? '使用原始字体' : '使用子集字体') : (usePreviewFont ? '使用默认字体' : '使用上传字体')}
              </button>
            </div>
            <p id="preview-text">预览文本</p>
          </div>
        </div>
      </div>

      <div className="section">
        <button
          id="generate-subset"
          className="btn-primary"
          onClick={generateSubset}
          disabled={!fontFile || !charInputRef.current?.value.trim()}
        >
          生成字体子集
        </button>
        <div className="output-info" id="output-info" style={{ display: outputInfo ? 'flex' : 'none' }}>
          <span>
            原始大小：
            <span id="original-size">{outputInfo?.originalSize || '-'}</span>
          </span>
          <span>
            子集大小：
            <span id="subset-size">{outputInfo?.subsetSize || '-'}</span>
          </span>
          <span>
            压缩率：
            <span id="compression-rate">{outputInfo?.compressionRate || '-'}</span>
          </span>
        </div>
      </div>

      {generatedSubset && (
        <div className="section">
          <h2>下载字体子集</h2>
          <div className="download-options">
            <div className="format-selector">
              <label>
                <input
                  type="radio"
                  name="format"
                  value="woff2"
                  checked={selectedFormat === 'woff2'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <span>WOFF2</span>
                <small>推荐 - 体积最小</small>
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="woff"
                  checked={selectedFormat === 'woff'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <span>WOFF</span>
                <small>兼容性好</small>
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="ttf"
                  checked={selectedFormat === 'ttf'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <span>TTF</span>
                <small>通用格式</small>
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="otf"
                  checked={selectedFormat === 'otf'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                />
                <span>OTF</span>
                <small>高质量</small>
              </label>
            </div>
            <button id="download-subset" className="btn-success" onClick={downloadSubset}>
              下载字体子集
            </button>
          </div>
        </div>
      )}
    </>
  );
};