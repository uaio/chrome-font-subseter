import { FontFormat, CharacterStats } from './types';

/**
 * 根据文件名或MIME类型检测字体格式
 */
export function detectFontFormat(fileName: string, mimeType?: string): FontFormat {
  // 先从文件名推断
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'ttf') return 'ttf';
  if (ext === 'otf') return 'otf';
  if (ext === 'woff') return 'woff';
  if (ext === 'woff2') return 'woff2';

  // 从MIME类型推断
  if (mimeType) {
    if (mimeType.includes('ttf')) return 'ttf';
    if (mimeType.includes('otf')) return 'otf';
    if (mimeType.includes('woff2')) return 'woff2';
    if (mimeType.includes('woff')) return 'woff';
  }

  throw new Error('无法识别的字体格式');
}

/**
 * 获取字体的MIME类型
 */
export function getFontMimeType(format: FontFormat): string {
  const mimeTypes = {
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2'
  };
  return mimeTypes[format];
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 计算压缩率
 */
export function calculateCompressionRate(originalSize: number, subsetSize: number): number {
  return Number(((originalSize - subsetSize) / originalSize * 100).toFixed(1));
}

/**
 * 分析字符统计
 */
export function analyzeCharacters(chars: string): CharacterStats {
  const uniqueChars = [...new Set(chars)];
  return {
    total: chars.length,
    unique: uniqueChars.length,
    uniqueChars
  };
}

/**
 * 生成字体子集文件名
 */
export function generateSubsetFileName(originalFileName: string, format: FontFormat, suffix?: string): string {
  const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
  const suffixStr = suffix || 'subset';
  return `${nameWithoutExt}_${suffixStr}.${format}`;
}

/**
 * 验证字符输入
 */
export function validateCharacters(chars: string): string[] {
  const errors: string[] = [];

  if (!chars || chars.length === 0) {
    errors.push('请输入需要保留的字符');
  }

  if (chars.length > 100000) {
    errors.push('字符数量不能超过100,000个');
  }

  return errors;
}

/**
 * 创建下载链接
 */
export function createDownloadLink(data: ArrayBuffer, fileName: string, mimeType: string): string {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * 清理下载链接
 */
export function revokeDownloadLink(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 检查浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 检查是否支持ArrayBuffer
 */
export function supportsArrayBuffer(): boolean {
  return typeof ArrayBuffer !== 'undefined';
}