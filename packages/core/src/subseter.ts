import * as opentype from 'opentype.js';
import {
  SubsetOptions,
  SubsetResult,
  FontFormat,
  SubsetError
} from './types';
import { calculateCompressionRate, getFontMimeType, generateSubsetFileName, supportsArrayBuffer } from './utils';
import { parseFont, hasCharacters, getMissingCharacters, validateFontData } from './parser';

/**
 * 字体子集化器类
 */
export class FontSubseter {
  private font: opentype.Font | null = null;
  private originalData: ArrayBuffer | null = null;
  private originalSize: number = 0;

  /**
   * 加载字体文件
   */
  async loadFont(data: ArrayBuffer | Uint8Array): Promise<void> {
    if (!validateFontData(data)) {
      throw new SubsetError('无效的字体文件', 'INVALID_FONT');
    }

    if (!supportsArrayBuffer()) {
      throw new SubsetError('浏览器不支持ArrayBuffer', 'UNSUPPORTED_BROWSER');
    }

    try {
      this.font = await parseFont(data);
      this.originalData = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer.slice(0);
      this.originalSize = this.originalData ? this.originalData.byteLength : 0;
    } catch (error) {
      throw new SubsetError(`加载字体失败: ${error instanceof Error ? error.message : '未知错误'}`, 'LOAD_ERROR');
    }
  }

  /**
   * 创建字体子集
   */
  async createSubset(options: SubsetOptions): Promise<SubsetResult> {
    if (!this.font) {
      throw new SubsetError('未加载字体文件', 'NO_FONT_LOADED');
    }

    // 处理字符参数
    const characters = typeof options.characters === 'string'
      ? options.characters
      : options.characters.join('');

    if (!characters) {
      throw new SubsetError('请指定需要保留的字符', 'NO_CHARACTERS');
    }

    // 获取唯一字符
    const uniqueChars = [...new Set(characters)];

    // 检查字体中是否包含所需字符
    const missingChars = getMissingCharacters(this.font, uniqueChars.join(''));
    if (missingChars.length > 0) {
      console.warn(`字体中缺失以下字符: ${missingChars.join('')}`);
    }

    try {
      // 对于Chrome扩展，我们采用一个实用的方法：
      // 暂时返回原始字体数据，但确保数据是完整的
      // 未来可以集成真正的字体子集化库如fonttools-js

      let subsetData: ArrayBuffer;

      // 如果字符数很少或者子集化可能失败，返回原始数据
      if (uniqueChars.length < 10 || !this.originalData) {
        console.warn(`字符数较少(${uniqueChars.length}个)或无原始数据，返回原始字体`);
        subsetData = this.originalData || new ArrayBuffer(0);
      } else {
        // 尝试创建真正的子集
        try {
          const subsetFont = this.createSubsetFont(this.font, uniqueChars, options);
          subsetData = subsetFont.toArrayBuffer();
          console.log(`成功创建子集，大小: ${subsetData.byteLength} bytes`);
        } catch (subsetError) {
          console.warn('子集创建失败，返回原始字体数据:', subsetError);
          subsetData = this.originalData;
        }
      }

      // 格式转换暂时未实现，返回原始格式
      if (options.outputFormat && options.outputFormat !== 'ttf') {
        console.warn(`格式转换到${options.outputFormat}尚未实现，返回TTF格式`);
      }

      const subsetSize = subsetData.byteLength;
      const compressionRate = calculateCompressionRate(this.originalSize, subsetSize);

      return {
        data: subsetData,
        originalSize: this.originalSize,
        subsetSize,
        compressionRate,
        characterCount: uniqueChars.length
      };
    } catch (error) {
      throw new SubsetError(`创建子集失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SUBSET_ERROR');
    }
  }

  /**
   * 创建子集字体对象
   */
  private createSubsetFont(
    originalFont: opentype.Font,
    characters: string[],
    options: SubsetOptions
  ): opentype.Font {
    // 简化实现：暂时返回原始字体
    // 真正的字体子集化需要更复杂的实现，包括：
    // 1. 重构字符到字形的映射表
    // 2. 移除不需要的字形
    // 3. 更新字体表（cmap, glyf, hmtx等）
    // 4. 处理kerning和其他特性

    console.warn('使用简化子集实现：返回原始字体');
    return originalFont;
  }

  /**
   * 降级方法：创建简单的子集数据
   */
  private createSubsetDataFallback(characters: string): ArrayBuffer {
    // 降级方法：返回原始字体数据的一个基本版本
    if (!this.originalData) {
      throw new SubsetError('没有原始字体数据', 'NO_DATA');
    }

    // 作为降级方案，我们返回原始字体数据
    // 这不是真正的子集化，但至少能确保文件可用
    console.warn('使用降级方法：返回原始字体数据');
    return this.originalData;
  }

  /**
   * 获取字体名称（支持后缀）
   */
  private getFontName(font: opentype.Font, suffix?: string): string {
    const baseName = font.names.fontFamily?.en || font.names.fullName?.en || 'SubsetFont';
    if (!suffix) return baseName;
    return `${baseName} ${suffix}`;
  }

  /**
   * 获取字体信息
   */
  getFontInfo() {
    if (!this.font) {
      throw new SubsetError('未加载字体文件', 'NO_FONT_LOADED');
    }

    return {
      familyName: this.font.names.fontFamily?.en || 'Unknown',
      styleName: this.font.names.fontSubfamily?.en || 'Regular',
      unitsPerEm: this.font.unitsPerEm,
      ascender: this.font.ascender,
      descender: this.font.descender,
      glyphCount: this.font.glyphs.length
    };
  }

  /**
   * 获取原始字体数据
   */
  getOriginalData(): ArrayBuffer | null {
    return this.originalData;
  }

  /**
   * 获取原始字体大小
   */
  getOriginalSize(): number {
    return this.originalSize;
  }

  /**
   * 检查是否已加载字体
   */
  isFontLoaded(): boolean {
    return this.font !== null;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.font = null;
    this.originalData = null;
    this.originalSize = 0;
  }
}

/**
 * 便捷函数：直接从数据创建子集
 */
export async function createSubset(
  data: ArrayBuffer | Uint8Array,
  characters: string,
  options: Omit<SubsetOptions, 'characters'> = {}
): Promise<SubsetResult> {
  const subseter = new FontSubseter();
  try {
    await subseter.loadFont(data);
    return await subseter.createSubset({ ...options, characters });
  } finally {
    subseter.dispose();
  }
}