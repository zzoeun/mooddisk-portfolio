import DesignTokens from "./designTokens";

const tintColorLight = DesignTokens.colors.primary;
const tintColorDark = DesignTokens.colors.background;

export default {
  light: {
    text: DesignTokens.colors.text,
    background: DesignTokens.colors.background,
    tint: tintColorLight,
    tabIconDefault: DesignTokens.colors.gray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DesignTokens.colors.background,
    background: DesignTokens.colors.text,
    tint: tintColorDark,
    tabIconDefault: DesignTokens.colors.gray,
    tabIconSelected: tintColorDark,
  },
};
