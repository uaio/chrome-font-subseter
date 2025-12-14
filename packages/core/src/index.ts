// 导出所有公共类型
export type {
  FontFormat,
  FontInfo,
  SubsetOptions,
  SubsetResult,
  CharacterStats
} from './types';

export {
  SubsetError
} from './types';

// 注意：opentype.js 功能已集成到 sandbox-font-subseter.ts 中

// 导出沙盒字体子集化器
export {
  SandboxFontSubseter,
  createSandboxSubset
} from './sandbox-font-subseter';

// 导出解析器功能
export {
  parseFontInfo,
  getAllCharacters,
  hasCharacters,
  getMissingCharacters,
  parseFont,
  validateFontData
} from './parser';

// 导出工具函数
export {
  detectFontFormat,
  getFontMimeType,
  formatFileSize,
  calculateCompressionRate,
  analyzeCharacters,
  generateSubsetFileName,
  validateCharacters,
  createDownloadLink,
  revokeDownloadLink,
  isBrowser,
  supportsArrayBuffer
} from './utils';

// 提供默认导出（使用沙盒子集化器作为默认）
export { SandboxFontSubseter as default } from './sandbox-font-subseter';