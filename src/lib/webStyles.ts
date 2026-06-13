import type { TextStyle, ViewStyle } from "react-native";

type WebOnlyStyle = {
  appearance?: string;
  background?: string;
  backgroundImage?: string;
  border?: string;
  boxShadow?: string;
  cursor?: string;
  fontFamily?: string;
  outline?: string;
  outlineStyle?: string;
};

export type WebViewStyle = Omit<ViewStyle, keyof WebOnlyStyle> & WebOnlyStyle;
export type WebTextStyle = Omit<TextStyle, keyof WebOnlyStyle> & WebOnlyStyle;

export function webViewStyle(style: WebViewStyle): ViewStyle {
  return style as unknown as ViewStyle;
}

export function webTextStyle(style: WebTextStyle): TextStyle {
  return style as unknown as TextStyle;
}
