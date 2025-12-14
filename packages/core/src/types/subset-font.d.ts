/**
 * subset-font 类型声明
 */

declare module 'subset-font' {
  /**
   * subset-font 主函数
   * @param fontData 字体数据
   * @param text 需要保留的字符
   * @param options 配置选项
   * @returns 子集化后的字体数据
   */
  function subsetFont(
    fontData: ArrayBuffer,
    text: string,
    options?: SubsetFontOptions
  ): Promise<ArrayBuffer>;

  export default subsetFont;

  export interface SubsetFontOptions {
    /** 输出格式: 'sfnt'(ttf), 'woff', 'woff2' */
    targetFormat?: 'sfnt' | 'woff' | 'woff2';

    /** 可变字体轴裁剪 */
    variationAxes?: {
      [axisTag: string]: number | { min?: number; max?: number; default?: number };
    };

    /** 保留的 name 表 ID */
    preserveNameIds?: number[];
  }
}