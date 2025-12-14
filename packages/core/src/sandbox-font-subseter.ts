/**
 * 基于 Chrome 扩展沙盒环境的字体子集化器
 * 解决 fonteditor-core WOFF2 初始化的 CSP 限制问题
 */

import {
  FontFormat,
  SubsetOptions,
  SubsetResult,
  SubsetError
} from './types';

// 浏览器环境检测
const isBrowser = typeof window !== 'undefined';
const isChromeExtension = typeof (window as any).chrome?.runtime !== 'undefined';

/**
 * 沙盒字体子集化器
 * 使用 Chrome 扩展的沙盒页面来绕过 CSP 限制
 */
export class SandboxFontSubseter {
  private originalData: ArrayBuffer | null = null;
  private originalSize: number = 0;
  private isInitialized = false;
  private sandboxFrame: HTMLIFrameElement | null = null;

  /**
   * 初始化沙盒环境
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!isBrowser || !isChromeExtension) {
      throw new SubsetError('沙盒子集化器仅支持 Chrome 扩展环境', 'ENVIRONMENT_NOT_SUPPORTED');
    }

    try {
      console.log('初始化 Chrome 扩展沙盒环境...');

      // 创建沙盒 iframe
      const sandboxUrl = (window as any).chrome.runtime.getURL('sandbox.html');

      // 检查是否已经创建了沙盒
      let existingSandbox = document.getElementById('font-subseter-sandbox') as HTMLIFrameElement;

      if (existingSandbox) {
        this.sandboxFrame = existingSandbox;
        console.log('使用现有的沙盒 iframe');
      } else {
        // 创建新的沙盒 iframe
        this.sandboxFrame = document.createElement('iframe');
        this.sandboxFrame.id = 'font-subseter-sandbox';
        this.sandboxFrame.src = sandboxUrl;
        this.sandboxFrame.style.display = 'none';

        // 添加到页面
        document.body.appendChild(this.sandboxFrame);
        console.log('创建新的沙盒 iframe:', sandboxUrl);
      }

      // 等待沙盒加载
      await this.waitForSandboxLoad();

      // 初始化并传递字体处理库给沙盒
      await this.initializeLibraries();

      this.isInitialized = true;
      console.log('✅ 沙盒环境初始化完成');

    } catch (error) {
      console.error('沙盒环境初始化失败:', error);
      throw new SubsetError(`沙盒环境初始化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SANDBOX_INIT_FAILED');
    }
  }

  /**
   * 初始化字体处理库并传递给沙盒
   */
  private async initializeLibraries(): Promise<void> {
    try {
      console.log('🔧 等待沙盒独立加载字体处理库...');

      // 不传递库，让沙盒自己加载
      // 等待沙盒完全就绪
      await this.waitForSandboxLibraries();

      console.log('✅ 沙盒已独立加载所有必要的库');

    } catch (error) {
      console.error('❌ 沙盒库初始化失败:', error);
      throw new SubsetError(`沙盒库初始化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'LIBRARIES_INIT_FAILED');
    }
  }

  /**
   * 等待沙盒加载完成
   */
  private async waitForSandboxLoad(): Promise<void> {
    if (!this.sandboxFrame) {
      throw new Error('沙盒 iframe 不存在');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ 沙盒加载超时 - 可能的原因:');
        console.error('1. sandbox.html 文件不存在或无法访问');
        console.error('2. fonteditor-core 加载失败');
        console.error('3. WASM 文件无法加载');
        reject(new Error('沙盒加载超时'));
      }, 30000); // 增加到 30 秒超时

      this.sandboxFrame!.onload = async () => {
        console.log('📄 沙盒 iframe HTML 加载完成');
        console.log('🔗 沙盒URL:', this.sandboxFrame!.src);

        try {
          // 等待一小段时间让脚本开始执行
          await new Promise(resolve => setTimeout(resolve, 100));

          // 检查沙盒窗口状态
          const sandboxWindow = this.sandboxFrame!.contentWindow as any;
          console.log('🔍 沙盒窗口检查:', {
            exists: !!sandboxWindow,
            scripts: sandboxWindow.document ? sandboxWindow.document.scripts.length : 'N/A',
            console: sandboxWindow.console ? 'available' : 'blocked',
            location: sandboxWindow.location ? sandboxWindow.location.href : 'N/A'
          });

          // 等待沙盒 JavaScript 执行完成
          await this.waitForSandboxReady();
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      this.sandboxFrame!.onerror = (event) => {
        clearTimeout(timeout);
        console.error('❌ 沙盒 iframe 加载失败:', event);
        reject(new Error('沙盒加载失败'));
      };
    });
  }

  /**
   * 等待沙盒 JavaScript 准备就绪
   */
  private async waitForSandboxReady(): Promise<void> {
    if (!this.sandboxFrame?.contentWindow) {
      throw new Error('沙盒内容窗口不可用');
    }

    const sandboxWindow = this.sandboxFrame.contentWindow as any;
    let retries = 0;
    const maxRetries = 300; // 最多等待 30 秒

    console.log('⏳ 等待沙盒 JavaScript 准备就绪...');

    while (retries < maxRetries) {
      // 检查沙盒函数是否可用
      if (sandboxWindow.sandboxCreateSubset && sandboxWindow.sandboxReady) {
        console.log('✅ 沙盒函数可用，沙盒准备就绪');
        return;
      }

      // 检查沙盒是否有错误
      if (sandboxWindow.sandboxError) {
        console.error('❌ 沙盒报告错误:', sandboxWindow.sandboxError);
        throw new Error(`沙盒初始化错误: ${sandboxWindow.sandboxError}`);
      }

      // 等待 100ms 后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;

      if (retries % 50 === 0) { // 每 5 秒记录一次
        console.log(`⏳ 沙盒准备中... (${retries * 100}ms)`);
        console.log('📊 状态检查:', {
          sandboxReady: sandboxWindow.sandboxReady,
          hasCreateSubset: !!sandboxWindow.sandboxCreateSubset,
          sandboxError: sandboxWindow.sandboxError
        });
      }
    }

    throw new Error('沙盒 JavaScript 准备超时');
  }

  /**
   * 等待沙盒独立加载所有库
   */
  private async waitForSandboxLibraries(): Promise<void> {
    if (!this.sandboxFrame?.contentWindow) {
      throw new Error('沙盒内容窗口不可用');
    }

    const sandboxWindow = this.sandboxFrame.contentWindow as any;
    let retries = 0;
    const maxRetries = 100; // 最多等待 10 秒

    console.log('⏳ 等待沙盒独立加载库...');

    while (retries < maxRetries) {
      // 检查沙盒是否就绪并且库是否加载
      if (sandboxWindow.sandboxReady &&
          sandboxWindow.sandboxCreateSubset &&
          sandboxWindow.opentype &&
          sandboxWindow.woff2Encoder) {
        console.log('✅ 沙盒库加载完成');

        // 验证库的完整性
        console.log('🔧 验证库的完整性:');
        console.log('  opentype:', typeof sandboxWindow.opentype);
        console.log('  woff2Encoder:', typeof sandboxWindow.woff2Encoder);

        return;
      }

      // 检查沙盒是否有错误
      if (sandboxWindow.sandboxError) {
        console.error('❌ 沙盒报告错误:', sandboxWindow.sandboxError);
        throw new Error(`沙盒库加载错误: ${sandboxWindow.sandboxError}`);
      }

      // 等待 100ms 后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;

      if (retries % 10 === 0) { // 每秒记录一次
        console.log(`⏳ 沙盒库加载中... (${retries * 100}ms)`);
      }
    }

    throw new Error('沙盒库加载超时');
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
      // 确保 data 是 ArrayBuffer 类型
      if (data instanceof ArrayBuffer) {
        this.originalData = data;
      } else {
        // 转换为 ArrayBuffer
        const dataLength = (data as any).byteLength || data.length || 0;
        this.originalData = new ArrayBuffer(dataLength);
        new Uint8Array(this.originalData).set(new Uint8Array(data));
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

    if (!this.sandboxFrame?.contentWindow) {
      throw new SubsetError('沙盒环境不可用', 'SANDBOX_NOT_AVAILABLE');
    }

    // 处理字符参数
    const characters = typeof options.characters === 'string'
      ? options.characters
      : options.characters.join('');

    if (!characters) {
      throw new SubsetError('请指定需要保留的字符', 'NO_CHARACTERS');
    }

    const uniqueChars = [...new Set(characters)];
    console.log(`沙盒子集化: ${uniqueChars.length} 个字符，格式: ${options.outputFormat || 'woff2'}`);

    try {
      // 调用沙盒中的函数
      const sandboxWindow = this.sandboxFrame.contentWindow as any;

      if (!sandboxWindow.sandboxCreateSubset) {
        throw new SubsetError('沙盒函数不可用', 'SANDBOX_FUNCTION_NOT_AVAILABLE');
      }

      // 将 ArrayBuffer 转换为可传输的格式
      const fontDataArray = new Uint8Array(this.originalData);

      // 调用沙盒函数
      const result = await sandboxWindow.sandboxCreateSubset(
        fontDataArray.buffer,
        characters,
        options.outputFormat || 'woff2'
      );

      console.log(`沙盒子集化完成: ${result.subsetSize} bytes, 实际格式: ${result.actualFormat}`);

      return {
        data: result.data,
        originalSize: result.originalSize,
        subsetSize: result.subsetSize,
        compressionRate: result.compressionRate,
        characterCount: result.characterCount,
        actualFormat: result.actualFormat as FontFormat
      };

    } catch (error) {
      console.error('沙盒子集化失败:', error);

      if (error instanceof SubsetError) {
        throw error;
      }

      throw new SubsetError(`沙盒子集化失败: ${error instanceof Error ? error.message : '未知错误'}`, 'SANDBOX_SUBSET_ERROR');
    }
  }

  /**
   * 获取字体信息
   */
  getFontInfo() {
    if (!this.originalData) {
      throw new SubsetError('未加载字体', 'NO_FONT_LOADED');
    }

    // 简单的格式检测
    const view = new DataView(this.originalData);
    const signature = view.getUint32(0, false);
    let format: FontFormat = 'ttf';

    if (signature === 0x774F4632) {
      format = 'woff2';
    } else if (signature === 0x774F4600) {
      format = 'woff';
    } else if (signature === 0x4F54544F) {
      format = 'otf';
    }

    return {
      familyName: 'Unknown',
      styleName: 'Regular',
      format,
      unitsPerEm: 0,
      glyphCount: 0,
      engine: 'fonteditor-core (sandbox)',
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
    // 不移除 iframe，保持重用
    this.isInitialized = false;
  }
}

/**
 * 便捷函数：使用沙盒创建字体子集
 */
export async function createSandboxSubset(
  data: ArrayBuffer | Uint8Array,
  characters: string,
  options: Omit<SubsetOptions, 'characters'> = {}
): Promise<SubsetResult> {
  const subseter = new SandboxFontSubseter();
  try {
    await subseter.loadFont(data);
    return await subseter.createSubset({ ...options, characters });
  } finally {
    subseter.dispose();
  }
}