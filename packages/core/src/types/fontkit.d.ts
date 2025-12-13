// Fontkit 类型定义

declare module 'fontkit' {
  export interface Font {
    familyName: string;
    styleName: string;
    fullName: string;
    postscriptName: string;
    format: string;
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
    numGlyphs: number;
    isCJK?: boolean;
    variable?: boolean;

    getGlyph(codePoint: number): Glyph;
    stringToGlyphs(string: string): Glyph[];
    layout(string: string): Glyph[];
  }

  export interface Glyph {
    id: number;
    codePoints: number[];
    path?: any;
    advanceWidth?: number;
    advanceHeight?: number;
    leftSideBearing?: number;
    topSideBearing?: number;
    boundingBox?: any;
    name?: string;
    unicode?: number[];
    _cachedGlyph?: any;
    _baseGlyph?: any;
    ligatureCaretPositions?: any[];
    features?: any[];
  }

  export interface VariationInfo {
    axes: any[];
    instances: any[];
    defaultInstance?: any;
    location?: any;
  }

  export function create(data: Uint8Array): Font;
  export function createWOFF(data: Uint8Array): Font;
  export function createWOFF2(data: Uint8Array): Font;
}