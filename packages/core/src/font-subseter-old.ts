/**
 * 基于 fonteditor-core 的字体子集化器
 * 纯 JavaScript 实现，无需 WebAssembly 或 Node.js 依赖
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
 * 字体子集化器
 * 使用 fonteditor-core 进行格式转换
 */
export class FontSubseter {
  private originalData: ArrayBuffer | null = null;
  private originalSize: number = 0;
  private isInitialized = false;
  private fontEditor: any = null;

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (isBrowser) {
        // 浏览器环境：动态导入 fonteditor-core
        const fontEditorModule = await import('fonteditor-core');
        this.fontEditor = fontEditorModule;
        console.log('fonteditor-core 引擎初始化成功');

        // 详细分析 fonteditor-core 的结构
        console.log('=== fonteditor-core 结构分析 ===');
        console.log('fontEditorModule 键:', Object.keys(fontEditorModule));
        console.log('fontEditorModule.woff2:', fontEditorModule.woff2);
        console.log('fontEditorModule.WOFF2:', (fontEditorModule as any).WOFF2);

        // 检查全局 window 对象
        if (typeof window !== 'undefined') {
          console.log('window.WOFF2:', (window as any).WOFF2);
          console.log('window.woff2:', (window as any).woff2);
        }

        // 尝试初始化 WOFF2 模块
        await this.initializeWoff2();
      } else {
        // Node.js 环境
        const fontEditorModule = await import('fonteditor-core');
        this.fontEditor = fontEditorModule;
        console.log('fonteditor-core 引擎初始化成功 (Node.js)');

        // 详细分析 fonteditor-core 的结构
        console.log('=== fonteditor-core 结构分析 (Node.js) ===');
        console.log('fontEditorModule 键:', Object.keys(fontEditorModule));
        console.log('fontEditorModule.woff2:', fontEditorModule.woff2);
        console.log('fontEditorModule.WOFF2:', (fontEditorModule as any).WOFF2);

        // 尝试初始化 WOFF2 模块
        await this.initializeWoff2();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('fonteditor-core 初始化失败:', error);
      throw new SubsetError(`fonteditor-core 不可用: ${error instanceof Error ? error.message : '未知错误'}`, 'ENGINE_NOT_AVAILABLE');
    }
  }

  /**
   * 初始化 WOFF2 模块
   */
  private async initializeWoff2(): Promise<void> {
    try {
      // 新方法：尝试直接导入 WOFF2
      console.log('尝试直接导入 WOFF2 模块...');

      try {
        // 方法1: 尝试通过动态导入 WOFF2 (更兼容)
        let woff2Instance;
        try {
          console.log('尝试通过动态导入 fonteditor-core/woff2');
          // 在浏览器中，fonteditor-core 会在全局作用域中设置 WOFF2
          if (typeof window !== 'undefined' && (window as any).fonteditorCore?.woff2) {
            woff2Instance = (window as any).fonteditorCore.woff2;
            console.log('从全局 fonteditorCore.woff2 获取 WOFF2 模块');
          } else if (this.fontEditor?.woff2) {
            woff2Instance = this.fontEditor.woff2;
            console.log('从 fontEditor.woff2 获取 WOFF2 模块');
          } else {
            console.log('无法获取 WOFF2 模块实例');
          }
        } catch (error) {
          console.log('获取 WOFF2 模块失败:', error);
        }

        if (woff2Instance) {
          console.log('woff2Instance:', woff2Instance);
          console.log('woff2Instance.isInited:', woff2Instance.isInited);
          console.log('woff2Instance.init:', woff2Instance.init);

          if (woff2Instance?.init && typeof woff2Instance.init === 'function') {
            if (!woff2Instance.isInited()) {
              console.log('WOFF2 模块未初始化，开始初始化...');

              // 根据用户提供的示例，在浏览器中需要指定 .wasm 文件路径
              let wasmUrl: string | undefined;

              if (typeof window !== 'undefined') {
                // 在 Chrome 扩展中，WOFF2.wasm 文件应该与扩展文件在同一目录
                // 使用 chrome.runtime.getURL 来获取正确的路径
                try {
                  if (typeof (window as any).chrome?.runtime?.getURL === 'function') {
                    wasmUrl = (window as any).chrome.runtime.getURL('woff2.wasm');
                    console.log('使用 Chrome 扩展路径:', wasmUrl);
                  } else {
                    // 备用路径，相对于扩展根目录
                    wasmUrl = './woff2.wasm';
                    console.log('使用相对路径:', wasmUrl);
                  }
                } catch (urlError) {
                  console.warn('无法获取 WASM 路径，使用默认设置:', urlError);
                  wasmUrl = undefined;
                }
              }

              await woff2Instance.init(wasmUrl);
              console.log('WOFF2 模块初始化成功');
            } else {
              console.log('WOFF2 模块已经初始化');
            }
            // 保存引用以供后续使用
            this.fontEditor.woff2 = woff2Instance;
            return;
          }
        }
      } catch (error) {
        console.log('所有 WOFF2 导入方法都失败:', error);
      }

      // 检查 fonteditor-core 是否包含 WOFF2 模块
      if (this.fontEditor?.WOFF2) {
        console.log('发现 WOFF2 模块 (WOFF2)，正在初始化...');

        // 方法2: 尝试直接调用 WOFF2.init()
        if (this.fontEditor.WOFF2.init && typeof this.fontEditor.WOFF2.init === 'function') {
          await this.fontEditor.WOFF2.init();
          console.log('WOFF2 模块初始化成功 (WOFF2.init)');
          return;
        }
      }

      if (this.fontEditor?.woff2) {
        console.log('发现 woff2 模块，正在初始化...');

        // 方法3: 尝试 woff2.init()
        if (this.fontEditor.woff2.init && typeof this.fontEditor.woff2.init === 'function') {
          await this.fontEditor.woff2.init();
          console.log('WOFF2 模块初始化成功 (woff2.init)');
          return;
        }

        // 方法4: 检查是否已经初始化
        if (this.fontEditor.woff2.isInited && this.fontEditor.woff2.isInited()) {
          console.log('WOFF2 模块已经初始化');
          return;
        }

        console.warn('WOFF2 模块存在但无法找到正确的初始化方法');
      } else {
        console.log('未找到 WOFF2 模块，WOFF2 功能将不可用');
      }
    } catch (error) {
      console.warn('WOFF2 模块初始化失败:', error);
      // 不抛出错误，继续使用其他格式
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

    // 确保数据格式正确后再检测格式
    let detectionBuffer: ArrayBuffer;
    if (data instanceof ArrayBuffer) {
      detectionBuffer = data;
    } else {
      detectionBuffer = new ArrayBuffer(data.byteLength);
      new Uint8Array(detectionBuffer).set(data);
    }

    const inputFormat = this.detectInputFormat(detectionBuffer);
    console.log(`检测到输入字体格式: ${inputFormat}`);

    try {
      // 确保数据是 ArrayBuffer 类型
      if (data instanceof ArrayBuffer) {
        this.originalData = data;
      } else if (data instanceof Uint8Array) {
        // 检查是否有 byteOffset 属性（处理 Buffer 和其他 Uint8Array 子类）
        if (typeof data.byteOffset === 'number' && typeof data.byteLength === 'number') {
          const bufferSlice = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
          // 确保返回的是 ArrayBuffer，而不是 SharedArrayBuffer
          this.originalData = bufferSlice instanceof ArrayBuffer ? bufferSlice : new ArrayBuffer(data.byteLength);
        } else {
          // 创建新的 ArrayBuffer 并复制数据
          this.originalData = new ArrayBuffer(data.length);
          new Uint8Array(this.originalData).set(data);
        }
      } else {
        // 尝试转换为 Uint8Array 然后再转换为 ArrayBuffer
        const uint8Array = new Uint8Array(data);
        this.originalData = new ArrayBuffer(uint8Array.length);
        new Uint8Array(this.originalData).set(uint8Array);
      }

      // 验证 this.originalData 确实是 ArrayBuffer
      if (!(this.originalData instanceof ArrayBuffer)) {
        throw new Error('数据转换失败，无法获得有效的 ArrayBuffer');
      }

      this.originalSize = this.originalData.byteLength;

      console.log(`字体加载成功: ${this.originalSize} bytes`);
    } catch (error) {
      throw new SubsetError(`加载字体失败: ${error instanceof Error ? error.message : '未知错误'}`, 'LOAD_ERROR');
    }
  }

  /**
   * 创建字体子集
   */
  async createSubset(options: SubsetOptions): Promise<SubsetResult> {
    if (!this.originalData) {
      throw new SubsetError('未加载字体', 'NO_FONT_LOADED');
    }

    if (!this.fontEditor) {
      throw new SubsetError('fonteditor-core 未初始化', 'ENGINE_NOT_INITIALIZED');
    }

    // 处理字符参数
    const characters = typeof options.characters === 'string'
      ? options.characters
      : options.characters.join('');

    if (!characters) {
      throw new SubsetError('请指定需要保留的字符', 'NO_CHARACTERS');
    }

    const uniqueChars = [...new Set(characters)];
    console.log(`字体处理: ${uniqueChars.length} 个字符，转换为 ${options.outputFormat || 'woff2'} 格式`);

    try {
      // 使用 fonteditor-core 进行真正的字体子集化
      // 只保留指定字符对应的字形，大幅减小字体文件大小

      const result = await this.createFontSubset(
        this.originalData,
        uniqueChars.join(''),
        options.outputFormat || 'woff2'
      );

      const convertedBuffer = result.buffer;
      const actualFormat = result.actualFormat;
      const subsetSize = convertedBuffer.byteLength;
      const compressionRate = this.calculateCompressionRate(this.originalSize, subsetSize);

      console.log(`字体处理成功: ${subsetSize} bytes, 压缩率: ${compressionRate}%`);

      return {
        data: convertedBuffer,
        originalSize: this.originalSize,
        subsetSize,
        compressionRate,
        characterCount: uniqueChars.length,
        actualFormat: actualFormat as FontFormat
      };
    } catch (error) {
      console.error('字体处理失败:', error);
      throw new SubsetError(`字体处理失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SUBSET_ERROR');
    }
  }

  /**
   * 创建字体子集
   */
  private async createFontSubset(
    fontData: ArrayBuffer,
    characters: string,
    targetFormat: string
  ): Promise<{ buffer: ArrayBuffer; actualFormat: string }> {
    try {
      // 1. 验证输入数据
      if (!(fontData instanceof ArrayBuffer)) {
        throw new SubsetError(`fontData 不是有效的 ArrayBuffer，实际类型: ${typeof fontData}`, 'INVALID_DATA');
      }

      console.log(`开始字体子集化，需要保留 ${characters.length} 个字符，输出格式: ${targetFormat}`);

      // 2. 尝试使用请求的格式，包括 WOFF2
      const actualTargetFormat = targetFormat;
      console.log(`原始请求格式: ${targetFormat}, 输出格式: ${actualTargetFormat}`);

      // 3. 使用 fonteditor-core 直接处理

      // 确保 fontData 是 ArrayBuffer
      let fontBuffer: ArrayBuffer;
      if (fontData instanceof ArrayBuffer) {
        fontBuffer = fontData;
      } else {
        // 转换为 ArrayBuffer
        const uint8Array = new Uint8Array(fontData);
        const dataLength = uint8Array.byteLength || uint8Array.length || 0;
        fontBuffer = new ArrayBuffer(dataLength);
        new Uint8Array(fontBuffer).set(uint8Array);
      }

      const uniqueChars = [...new Set(characters)];
      const charCodes = uniqueChars
        .map(char => char.codePointAt(0))
        .filter(code => code !== undefined);

      console.log(`开始字符级子集化: 原始字符数: ${characters.length}, 唯一字符数: ${uniqueChars.length}`);
      console.log(`字符列表: ${uniqueChars.join('')}`);
      console.log(`字符码点: [${charCodes.join(', ')}]`);
      console.log(`字体数据大小: ${fontBuffer.byteLength} bytes`);
      console.log(`字体数据类型: ${fontBuffer.constructor.name}`);

      const subsetFont = this.fontEditor.createFont(fontBuffer, {
        type: 'ttf',
        subset: charCodes,
        hinting: false,
        compound2simple: true
      });

      if (!subsetFont) {
        throw new SubsetError('字体子集化失败 - createFont 返回空值', 'SUBSET_FAILED');
      }

      subsetFont.optimize();

      // 4. 导出为指定格式
      const exportOptions: any = {
        type: actualTargetFormat,
        hinting: false
      };

      // 如果是 WOFF2，确保模块已初始化
      if (actualTargetFormat === 'woff2') {
        console.log('准备导出 WOFF2 格式，检查模块状态...');

        // 尝试多种方式初始化 WOFF2
        let woff2Initialized = false;

        try {
          // 方法1: 尝试 WOFF2.init()
          if (this.fontEditor?.WOFF2?.init && typeof this.fontEditor.WOFF2.init === 'function') {
            console.log('调用 WOFF2.init()...');
            await this.fontEditor.WOFF2.init();
            console.log('WOFF2 模块重新初始化成功 (WOFF2.init)');
            woff2Initialized = true;
          }
          // 方法2: 尝试 woff2.init()
          else if (this.fontEditor?.woff2?.init && typeof this.fontEditor.woff2.init === 'function') {
            console.log('调用 woff2.init()...');
            await this.fontEditor.woff2.init();
            console.log('WOFF2 模块重新初始化成功 (woff2.init)');
            woff2Initialized = true;
          }
          // 方法3: 检查是否已初始化
          else if (this.fontEditor?.woff2?.isInited && this.fontEditor.woff2.isInited()) {
            console.log('WOFF2 模块已经初始化');
            woff2Initialized = true;
          }
          // 方法4: 尝试全局 WOFF2
          else if (typeof window !== 'undefined' && (window as any).WOFF2?.init) {
            console.log('调用全局 WOFF2.init()...');
            await (window as any).WOFF2.init();
            console.log('全局 WOFF2 模块初始化成功');
            woff2Initialized = true;
          } else {
            console.warn('WOFF2 模块状态未知或无初始化方法');
          }

          if (!woff2Initialized) {
            console.warn('无法初始化 WOFF2 模块，将尝试直接导出');
          }
        } catch (initError) {
          console.warn('WOFF2 模块初始化尝试失败:', initError);
          console.log('将继续尝试导出 WOFF2，可能会失败并提供回退选项');
        }
      }

      let resultBuffer;
      try {
        resultBuffer = subsetFont.write(exportOptions);
      } catch (error) {
        // 如果 WOFF2 失败，提供详细错误信息
        if (actualTargetFormat === 'woff2' && error instanceof Error) {
          console.error('WOFF2 导出失败:', error);

          let errorDetails = '';
          if (error.message.includes('use woff2.init()')) {
            errorDetails = `WOFF2 模块未正确初始化。\n` +
              `建议：\n` +
              `1. 尝试使用 WOFF 格式作为替代（压缩率稍低但兼容性更好）\n` +
              `2. 刷新页面后重试\n` +
              `3. 使用其他字体格式（TTF、OTF）`;
          } else if (error.message.includes('WebAssembly') || error.message.includes('WASM') || error.message.includes('eval')) {
            errorDetails = `WOFF2 格式在当前环境中不可用，这可能是因为浏览器安全策略限制了 WebAssembly 执行。\n` +
              `建议：\n` +
              `1. 尝试使用 WOFF 格式作为替代（文件大小稍大但兼容性更好）\n` +
              `2. 在浏览器设置中允许扩展运行 WebAssembly\n` +
              `3. 使用其他字体格式（TTF、OTF）`;
          } else {
            errorDetails = `WOFF2 处理失败。\n` +
              `建议：\n` +
              `1. 尝试使用 WOFF 格式作为替代\n` +
              `2. 检查字体文件是否完整\n` +
              `3. 使用其他字体格式`;
          }

          throw new SubsetError(
            `${errorDetails}\n\n` +
            `原始错误: ${error.message}`,
            'WOFF2_NOT_SUPPORTED'
          );
        }
        throw error;
      }

      if (!resultBuffer || resultBuffer.length === 0) {
        throw new Error('字体导出失败');
      }

      console.log(`字体子集化成功，输出格式: ${actualTargetFormat}`);

      // 5. 确保 ArrayBuffer 类型
      let buffer: ArrayBuffer;
      if (resultBuffer.buffer instanceof ArrayBuffer) {
        buffer = resultBuffer.buffer;
      } else if (resultBuffer instanceof ArrayBuffer) {
        buffer = resultBuffer;
      } else {
        buffer = new ArrayBuffer(resultBuffer.length);
        new Uint8Array(buffer).set(resultBuffer);
      }

      return {
        buffer,
        actualFormat: actualTargetFormat
      };
    } catch (error) {
      console.error('字体子集化失败:', error);
      throw new SubsetError(`字体子集化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SUBSET_ERROR');
    }
  }

  /**
   * 检测输入字体格式
   */
  private detectInputFormat(fontData: ArrayBuffer): string {
    try {
      // 验证输入确实是 ArrayBuffer
      if (!(fontData instanceof ArrayBuffer)) {
        console.warn(`检测输入格式失败：传入的不是 ArrayBuffer，实际类型是 ${typeof fontData}，构造函数是 ${(fontData as any)?.constructor?.name}`);
        return 'ttf';
      }

      // 检查文件是否足够大以进行格式检测
      if (fontData.byteLength < 4) {
        console.warn('字体文件太小，默认为 TTF 格式');
        return 'ttf';
      }

      const view = new DataView(fontData);
      console.log(`成功创建 DataView，字体数据大小: ${fontData.byteLength} bytes`);

      // 读取前4个字节用于格式检测
      const signature = view.getUint32(0, false);
      const signatureLE = view.getUint32(0, true);

      console.log(`字体文件头部标识: 0x${signature.toString(16)} (BE), 0x${signatureLE.toString(16)} (LE)`);

      // WOFF2 格式检查 (wOF2)
      if (signature === 0x774F4632) {
        console.log('检测为 WOFF2 格式');
        return 'woff2';
      }

      // WOFF 格式检查 (wOFF)
      if (signature === 0x774F4600) {
        console.log('检测为 WOFF 格式');
        return 'woff';
      }

      // OTF/TTF 格式检查
      if (fontData.byteLength >= 12) {
        // OTF 格式 (OTTO)
        if (signature === 0x4F54544F) {
          console.log('检测为 OTF 格式');
          return 'otf';
        }

        // TTF 格式 (0x00010000 或 trueType)
        if (signature === 0x00010000 || signatureLE === 0x00010000) {
          console.log('检测为 TTF 格式');
          return 'ttf';
        }

        // 检查 sfnt 版本 (trueType 1.0)
        const version = view.getUint32(0, false);
        if (version === 0x74727565) { // 'true'
          console.log('检测为 TTF 格式 (sfnt)');
          return 'ttf';
        }
      }

      // 如果都匹配不上，尝试通过文件扩展名或其他启发式方法
      console.warn('无法确定字体格式，默认为 TTF');
      return 'ttf';
    } catch (error) {
      console.error('字体格式检测出错:', error);
      return 'ttf';
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

    // 检测实际输入格式
    const inputFormat = this.detectInputFormat(this.originalData);

    return {
      familyName: 'Unknown',
      styleName: 'Regular',
      format: inputFormat as FontFormat,
      unitsPerEm: 0,
      glyphCount: 0,
      engine: 'fonteditor-core',
      version: '2.6.3'
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
    this.fontEditor = null;
    this.isInitialized = false;
  }
}

/**
 * 便捷函数：创建字体子集
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