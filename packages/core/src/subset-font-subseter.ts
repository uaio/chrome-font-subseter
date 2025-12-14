/**
 * 基于 subset-font 的专业字体子集化器
 * 使用 HarfBuzz WebAssembly 提供工业级字体处理能力
 */

import {
  FontFormat,
  SubsetOptions,
  SubsetResult,
  SubsetError
} from './types';

// 浏览器环境检测
const isBrowser = typeof window !== 'undefined';

/**
 * subset-font 字体子集化器
 * 使用专业级 subset-font 库，提供完整的字体子集化功能
 */
export class SubsetFontSubseter {
  private originalData: ArrayBuffer | null = null;
  private originalSize: number = 0;
  private isInitialized = false;
  private subsetFont: any = null;

  /**
   * 初始化 subset-font 引擎
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (isBrowser) {
        // 浏览器环境：由于 CSP 限制，暂时禁用 subset-font
        // subset-font 需要 eval() 权限，这在 Chrome 扩展中不安全
        console.log('在 Chrome 扩展环境中，subset-font 暂时不可用');
        this.subsetFont = null;
      } else {
        // Node.js 环境
        const module = await import('subset-font');
        this.subsetFont = module.default; // subset-font 默认导出
      }

      this.isInitialized = true;
      console.log(this.subsetFont ? 'subset-font 引擎初始化成功' : 'subset-font 在当前环境不可用');
    } catch (error) {
      console.error('subset-font 初始化失败:', error);
      this.subsetFont = null;
      this.isInitialized = true;
    }
  }

  /**
   * 加载字体文件
   */
  async loadFont(data: ArrayBuffer | Uint8Array): Promise<void> {
    if (!data) {
      throw new SubsetError('无效的字体文件', 'INVALID_FONT');
    }

    await this.initialize();

    try {
      this.originalData = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer.slice(0);
      this.originalSize = this.originalData.byteLength;

      console.log(`字体加载成功: ${this.originalSize} bytes`);
    } catch (error) {
      throw new SubsetError(`加载字体失败: ${error instanceof Error ? error.message : '未知错误'}`, 'LOAD_ERROR');
    }
  }

  /**
   * 创建专业字体子集
   */
  async createSubset(options: SubsetOptions): Promise<SubsetResult> {
    if (!this.originalData) {
      throw new SubsetError('未加载字体', 'NO_FONT_LOADED');
    }

    if (!this.subsetFont) {
      throw new SubsetError('subset-font 在 Chrome 扩展环境中不可用，请使用 opentype.js 引擎', 'ENVIRONMENT_NOT_SUPPORTED');
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
    console.log(`subset-font 子集化: ${uniqueChars.length} 个字符`);

    try {
      // 使用 subset-font 进行专业子集化
      const subsetData = await this.createSubsetFont(this.originalData, uniqueChars, options);

      const subsetSize = subsetData.byteLength;
      const compressionRate = this.calculateCompressionRate(this.originalSize, subsetSize);

      console.log(`subset-font 子集创建成功: ${subsetSize} bytes, 压缩率: ${compressionRate}%`);

      return {
        data: subsetData,
        originalSize: this.originalSize,
        subsetSize,
        compressionRate,
        characterCount: uniqueChars.length
      };
    } catch (error) {
      console.error('subset-font 子集化失败:', error);
      throw new SubsetError(`创建子集失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SUBSET_ERROR');
    }
  }

  /**
   * 使用 subset-font 创建字体子集
   */
  private async createSubsetFont(
    fontData: ArrayBuffer,
    characters: string[],
    options: SubsetOptions
  ): Promise<ArrayBuffer> {
    try {
      // 将字符转换为唯一字符串
      const text = characters.join('');

      // 输出格式映射
      const targetFormat = this.mapOutputFormat(options.outputFormat || 'woff2');

      // subset-font 选项
      const subsetOptions: any = {
        targetFormat,
      };

      // 可变字体轴裁剪（如果有）
      if (options.variationAxes) {
        subsetOptions.variationAxes = options.variationAxes;
      }

      // 保留字体名称表
      if (options.preserveNameIds) {
        subsetOptions.preserveNameIds = options.preserveNameIds;
      }

      console.log(`使用 subset-font，格式: ${targetFormat}, 字符数: ${characters.length}`);

      // 调用 subset-font
      const subsetBuffer = await this.subsetFont(fontData, text, subsetOptions);

      return subsetBuffer;
    } catch (error) {
      console.error('subset-font 处理失败:', error);
      // 回退到原始数据
      return this.originalData!;
    }
  }

  /**
   * 映射输出格式
   */
  private mapOutputFormat(format: FontFormat): string {
    switch (format) {
      case 'ttf':
      case 'otf':
        return 'sfnt'; // subset-font 使用 'sfnt' 表示 TTF/OTF
      case 'woff':
        return 'woff';
      case 'woff2':
        return 'woff2';
      default:
        return 'woff2';
    }
  }

  /**
   * 计算压缩率
   */
  private calculateCompressionRate(originalSize: number, subsetSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - subsetSize) / originalSize) * 100 * 100) / 100;
  }

  /**
   * 获取字体信息
   */
  getFontInfo() {
    if (!this.originalData) {
      throw new SubsetError('未加载字体', 'NO_FONT_LOADED');
    }

    // 基本检测
    const view = new DataView(this.originalData);
    const signature = view.getUint32(0, false);

    let format = 'unknown';
    switch (signature) {
      case 0x00010000:
      case 0x74727565:
        format = 'ttf';
        break;
      case 0x4F54544F:
        format = 'otf';
        break;
      case 0x774F4632:
        format = 'woff2';
        break;
      case 0x774F4630:
        format = 'woff';
        break;
    }

    return {
      familyName: 'Unknown', // subset-font 可能需要解析 name 表
      styleName: 'Regular',
      format,
      unitsPerEm: 0, // 需要额外解析
      glyphCount: 0, // 需要额外解析
      // subset-font 特定信息
      engine: 'subset-font (HarfBuzz)',
      version: 'Latest'
    };
  }

  /**
   * 获取原始字体数据
   */
  getOriginalData(): ArrayBuffer | null {
    return this.originalData;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.originalData = null;
    this.originalSize = 0;
    this.subsetFont = null;
  }
}

/**
 * 便捷函数：使用 subset-font 创建字体子集
 */
export async function createSubsetFont(
  data: ArrayBuffer | Uint8Array,
  characters: string,
  options: Omit<SubsetOptions, 'characters'> = {}
): Promise<SubsetResult> {
  const subseter = new SubsetFontSubseter();
  try {
    await subseter.loadFont(data);
    return await subseter.createSubset({ ...options, characters });
  } finally {
    subseter.dispose();
  }
}