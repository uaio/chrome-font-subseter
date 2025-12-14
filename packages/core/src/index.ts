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

// 导出主要功能类
export {
  FontSubseter
} from './subseter';

// 导出便捷函数
export {
  createSubset
} from './subseter';

// 导出浏览器友好的字体子集化
export {
  BrowserSubseter,
  createBrowserSubset
} from './browser-subseter';

// 导出HarfBuzz.js专业字体子集化
export {
  HarfBuzzSubseter,
  createHarfBuzzSubset
} from './harfbuzz-subseter';

// 导出subset-font专业字体子集化
export {
  SubsetFontSubseter,
  createSubsetFont
} from './subset-font-subseter';

// 注意：专业字体子集化(fontkit)仅在Node.js环境中可用
// export {
//   ProfessionalSubseter,
//   createProfessionalSubset
// } from './professional-subseter';

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

// 提供默认导出
export { FontSubseter as default } from './subseter';