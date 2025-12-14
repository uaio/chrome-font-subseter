/**
 * HarfBuzz.js 类型声明
 * 由于该库没有官方类型定义，这里提供基本类型支持
 */

declare module 'harfbuzzjs' {
  export interface HBFont {
    create(face: ArrayBuffer | Uint8Array): HBFont;
    getGlyphCount(): number;
    getNominalGlyphs(codepoints: number[]): number[];
    shape(text: string, features?: any[]): HBGlyph[];
    subset(glyphs: number[], subsetTags?: string[]): ArrayBuffer;
    destroy(): void;
  }

  export interface HBGlyph {
    codepoint: number;
    glyph: number;
    cluster: number;
    x_advance: number;
    y_advance: number;
    x_offset: number;
    y_offset: number;
    attributes: any[];
  }

  export interface HBFace {
    create(data: ArrayBuffer | Uint8Array): HBFace;
    getUpem(): number;
    getGlyphCount(): number;
    getTable(tag: string): ArrayBuffer | null;
    destroy(): void;
  }

  export interface HBTag {
    fromString(str: string): number;
    toString(tag: number): string;
  }

  export const HB: {
    create: () => Promise<void>;
    version: () => string;
    Font: {
      create(face: ArrayBuffer | Uint8Array): HBFont;
    };
    Face: {
      create(data: ArrayBuffer | Uint8Array): HBFace;
    };
  };
}