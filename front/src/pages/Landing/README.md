# MD2Card Landing — React + Vite 集成

把这两个文件丢进你的 `web/src/pages/`（或你习惯的目录）：

```
Landing.tsx
Landing.css
```

## 1. 在路由里挂上

如果你用 hash 路由（项目现在的 `#/` 风格）：

```tsx
// 在你的根路由组件里
import Landing from "./pages/Landing";

const route = window.location.hash || "#/";
if (route === "#/" || route === "") return <Landing />;
// ... #/app, #/docs 走原来的逻辑
```

如果用 react-router：

```tsx
import { Route } from "react-router-dom";
import Landing from "./pages/Landing";

<Route path="/" element={<Landing />} />
```

## 2. 字体（推荐放在 `index.html` 里 preconnect）

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@500;600;700&display=swap" rel="stylesheet">
```

中文正文用系统 PingFang / 思源黑，不需要额外加载。

## 3. 注意事项

- **`Landing.css` 里的样式作用域不带前缀**，如果担心污染全局，把 `.md2card-landing` 作为 scope 包裹（已经在 root div 上了），但 CSS 内的选择器是裸的。要严格隔离，建议改成 CSS Modules（重命名 `Landing.module.css` 并把 className 改成 `styles.xxx`）。
- 进入工作台的链接是 `#/app`，文档链接 `#/docs` —— 和你的现有路由一致。
- Tailwind 没有依赖，纯独立 CSS，不会和你现有的 Tailwind 设置冲突。
- 所有交互（滚动效果、主题切换）都用 React state，无 jQuery / 全局变量。

## 4. 没有依赖
组件只用 React 内置 hooks，不需要装任何新包。
