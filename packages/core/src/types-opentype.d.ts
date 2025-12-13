// Type declarations for opentype.js
declare module 'opentype.js' {
  export interface Font {
    names: {
      fontFamily?: { en?: string };
      fullName?: { en?: string };
      fontSubfamily?: { en?: string };
      designer?: { en?: string };
      designerURL?: { en?: string };
      manufacturer?: { en?: string };
      manufacturerURL?: { en?: string };
      license?: { en?: string };
      licenseURL?: { en?: string };
      version?: { en?: string };
      description?: { en?: string };
      copyright?: { en?: string };
      trademark?: { en?: string };
    };
    unitsPerEm?: number;
    ascender?: number;
    descender?: number;
    glyphs: Glyph[];
    charToGlyphIndex: (char: string) => number;
    toArrayBuffer: () => ArrayBuffer;
  }

  export interface Glyph {
    unicode?: number;
    path?: any;
    advanceWidth?: number;
    leftSideBearing?: number;
  }

  export interface FontOptions {
    familyName?: string;
    styleName?: string;
    unitsPerEm?: number;
    ascender?: number;
    descender?: number;
    designer?: string;
    designerURL?: string;
    manufacturer?: string;
    manufacturerURL?: string;
    license?: string;
    licenseURL?: string;
    version?: string;
    description?: string;
    copyright?: string;
    trademark?: string;
    glyphs?: Glyph[];
  }

  export function parse(data: ArrayBuffer | Uint8Array): Font;
  export function load(url: string, callback?: (err: Error | null, font: Font | null) => void): Promise<Font>;

  const Font: {
    new(options: FontOptions): Font;
  };

  export default {
    parse,
    load,
    Font
  };
}