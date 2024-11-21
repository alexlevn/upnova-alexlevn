export interface FontStyle {
  family?: string;
  variants?: string;
  letterSpacings?: string;
  fontWeight?: string;
  url?: string;
}

export interface ButtonStyle {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  textAlign?: string;
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
}

export interface ScraperResponse {
  fonts: FontStyle[];
  primaryButton: ButtonStyle;
}
