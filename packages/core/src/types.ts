/**
 * 支持的字体格式
 */
export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'sfnt';

/**
 * 字体信息
 */
export interface FontInfo {
  /** 字体家族名称 */
  familyName: string;
  /** 字体样式名称 */
  styleName: string;
  /** 文件大小 */
  size: number;
  /** 格式 */
  format: FontFormat;
  /** 单位每EM */
  unitsPerEm: number;
  /** 上升高度 */
  ascender: number;
  /** 下降高度 */
  descender: number;
}

/**
 * 子集化选项
 */
export interface SubsetOptions {
  /** 需要保留的字符 */
  characters: string | string[];
  /** 输出格式 */
  outputFormat?: FontFormat;
  /** 是否保留字体元数据 */
  preserveMetadata?: boolean;
  /** 字体名称后缀 */
  nameSuffix?: string;
  /** 可变字体轴裁剪 (subset-font) */
  variationAxes?: {
    [axisTag: string]: number | { min?: number; max?: number; default?: number };
  };
  /** 保留的 name 表 ID (subset-font) */
  preserveNameIds?: number[];
}

/**
 * 子集化结果
 */
export interface SubsetResult {
  /** 子集字体数据 (ArrayBuffer) */
  data: ArrayBuffer;
  /** 原始大小 */
  originalSize: number;
  /** 子集大小 */
  subsetSize: number;
  /** 压缩率 (百分比) */
  compressionRate: number;
  /** 保留的字符数 */
  characterCount: number;
  /** 实际输出的格式 */
  actualFormat: FontFormat;
}

/**
 * 字符统计信息
 */
export interface CharacterStats {
  /** 总字符数 */
  total: number;
  /** 唯一字符数 */
  unique: number;
  /** 唯一字符列表 */
  uniqueChars: string[];
}

/**
 * 错误类型
 */
export class SubsetError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SubsetError';
  }
}