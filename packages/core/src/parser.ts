import * as opentype from 'opentype.js';
import { FontInfo, FontFormat, SubsetError } from './types';
import { detectFontFormat } from './utils';

/**
 * 从ArrayBuffer或文件解析字体信息
 */
export function parseFontInfo(data: ArrayBuffer | Uint8Array, fileName?: string): FontInfo {
  let font: opentype.Font;

  try {
    font = opentype.parse(data);
  } catch (error) {
    throw new SubsetError(`解析字体失败: ${error instanceof Error ? error.message : '未知错误'}`, 'PARSE_ERROR');
  }

  const format = fileName ? detectFontFormat(fileName) : 'ttf';
  const size = data.byteLength;

  return {
    familyName: font.names.fontFamily?.en || font.names.fullName?.en || 'Unknown',
    styleName: font.names.fontSubfamily?.en || 'Regular',
    size,
    format,
    unitsPerEm: font.unitsPerEm || 1000,
    ascender: font.ascender || 800,
    descender: font.descender || -200
  };
}

/**
 * 获取字体中的所有字符
 */
export function getAllCharacters(font: opentype.Font): string[] {
  const chars: string[] = [];

  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    if (glyph && glyph.unicode) {
      chars.push(String.fromCodePoint(glyph.unicode));
    }
  }

  return chars;
}

/**
 * 检查字符是否在字体中存在
 */
export function hasCharacters(font: opentype.Font, characters: string): boolean[] {
  return characters.split('').map(char => {
    const code = char.codePointAt(0);
    if (!code) return false;
    return font.charToGlyphIndex(char) !== 0;
  });
}

/**
 * 获取缺失的字符
 */
export function getMissingCharacters(font: opentype.Font, characters: string): string[] {
  const missing: string[] = [];

  for (const char of characters) {
    if (font.charToGlyphIndex(char) === 0) {
      missing.push(char);
    }
  }

  return [...new Set(missing)];
}

/**
 * 解析字体并返回OpenType字体对象
 */
export async function parseFont(data: ArrayBuffer | Uint8Array): Promise<opentype.Font> {
  try {
    return opentype.parse(data);
  } catch (error) {
    throw new SubsetError(`解析字体失败: ${error instanceof Error ? error.message : '未知错误'}`, 'PARSE_ERROR');
  }
}

/**
 * 验证字体数据
 */
export function validateFontData(data: ArrayBuffer | Uint8Array): boolean {
  if (!data || data.byteLength < 4) {
    return false;
  }

  // 检查字体签名
  const buffer = data instanceof ArrayBuffer ? data : data.buffer;
  const view = new DataView(buffer);
  const signature = view.getUint32(0, false);

  // TrueType签名: 0x00010000
  // OpenType with CFF: 'OTTO'
  // WOFF: 'wOFF'
  // WOFF2: 'wOF2'
  return (
    signature === 0x00010000 ||
    signature === 0x4F54544F || // 'OTTO'
    signature === 0x774F4646 || // 'wOFF'
    signature === 0x774F4632    // 'wOF2'
  );
}

/**
 * 辅助函数：从MIME类型检测格式
 */
function detectFontMimeType(mimeType: string): FontFormat {
  if (mimeType.includes('ttf')) return 'ttf';
  if (mimeType.includes('otf')) return 'otf';
  if (mimeType.includes('woff2')) return 'woff2';
  if (mimeType.includes('woff')) return 'woff';
  return 'ttf'; // 默认
}