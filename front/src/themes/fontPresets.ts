export type FontPreset = {
  id: string
  label: string
  /** Sample character shown in the swatch */
  sample: string
  /** CSS font-family value applied to both --body-font and --heading-font */
  fontFamily: string
}

/** null id means "inherit from theme" */
export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'sans',
    label: '黑体',
    sample: '黑',
    fontFamily:
      '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  },
  {
    id: 'serif',
    label: '宋体',
    sample: '宋',
    fontFamily:
      '"Georgia", "Songti SC", "Noto Serif SC", "SimSun", serif',
  },
  {
    id: 'rounded',
    label: '圆体',
    sample: '圆',
    fontFamily:
      '"Hiragino Rounded Gothic Pro", "PingFang SC", system-ui, sans-serif',
  },
  {
    id: 'mono',
    label: '等宽',
    sample: 'M',
    fontFamily:
      '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", monospace',
  },
  {
    id: 'apple',
    label: '苹果',
    sample: 'Aa',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif',
  },
]
