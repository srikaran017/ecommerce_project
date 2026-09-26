import { themeConfig, generateCssVariables, ThemeConfig } from "@/config/theme.config";

interface ThemeScriptProps {
  currentTheme?: ThemeConfig;
}

export function ThemeScript({ currentTheme = themeConfig }: ThemeScriptProps) {
  const cssString = generateCssVariables(currentTheme);

  return (
    <style
      id="dynamic-theme-vars"
      dangerouslySetInnerHTML={{ __html: cssString }}
    />
  );
}
