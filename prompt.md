# ReaderApp 项目上下文提示词

> 用于快速让 AI 了解项目背景，直接复制后附上具体任务即可。

---

## 项目核心

- **定位**: 本地电子书阅读器 App (iOS/Android)
- **技术栈**: React Native (Expo SDK 54) + TypeScript
- **架构**: Feature-Based + MVVM

---

## 核心依赖

| 领域       | 库                                                    |
| ---------- | ----------------------------------------------------- |
| UI/主题    | `@shopify/restyle` (Type-safe Theme System)           |
| 状态管理   | `zustand` (Global Store)                              |
| 数据查询   | `@tanstack/react-query`                               |
| 本地存储   | `expo-sqlite`                                         |
| EPUB 渲染  | `@epubjs-react-native/core` + `react-native-webview`  |
| PDF 渲染   | `react-native-pdf`                                    |
| 导航       | `@react-navigation/native` (Stack + Bottom Tabs)      |
| 动画       | `react-native-reanimated`                             |
| 图标       | `lucide-react-native`, `@expo/vector-icons`           |

---

## 目录结构

```
src/
├── components/         # 全局共享组件
├── features/           # 功能模块 (核心)
│   ├── library/        # 书架 (书籍展示/导入/搜索)
│   ├── reader/         # 阅读器核心 (EPUB/TXT/PDF)
│   ├── share/          # WiFi传书
│   ├── stats/          # 阅读统计
│   ├── notebook/       # 笔记书签
│   └── settings/       # 设置
├── services/database/  # SQLite仓储层 (BookRepo, NoteRepo...)
├── stores/             # Zustand全局Store
├── theme/              # Restyle 主题配置
├── i18n/               # 国际化 (中/英)
└── navigation/         # 导航配置
```

---

## 数据模型 (SQLite)

- **Book**: `id`, `title`, `author`, `cover`, `filePath`, `fileType`('epub'|'txt'|'pdf'), `progress`, `lastRead`, `currentChapterIndex`
- **Bookmark/Note**: `id`, `bookId`, `cfi`, `content`, `color`
- **ReadingSession**: 阅读时长统计

---

## 已实现功能

### Phase 1-2: 基础建设 & 阅读器核心
- [x] 书架展示 (Grid/List/Carousel 视图)
- [x] 文件导入 (TXT/EPUB/PDF)
- [x] EPUB 阅读器 (WebView + 样式注入)
- [x] TXT 阅读器 (ScrollView)
- [x] 阅读进度保存/恢复 (CFI/章节索引)
- [x] 目录侧边栏 (TOCDrawer)
- [x] WiFi 传书 (HTTP Server)
- [x] 深色/浅色主题
- [x] App Lock (指纹/Face ID)
- [x] 阅读统计

### Phase 3: 交互增强
- [x] TXT 智能分章 (正则匹配 `第X章/回/节/卷`)
- [x] EPUB3 nav.xhtml 支持 (`parseNavList`)
- [x] 笔记/高亮系统 (NoteRepository + NotebookScreen)
- [x] TTS 听书功能 (expo-speech + TTSModal/MiniPlayer)

---

## 待优化功能 (Phase 4)

- [ ] 大文件优化 (TXT >10MB 分页加载)
- [ ] 列表图片懒加载与缓存优化
- [ ] 转场动画 (Shared Element)

---

## 关键坑点

1. **iOS 沙盒路径漂移**: 数据库存相对路径，运行时拼接 `documentDirectory`
2. **EPUB 进度恢复**: WebView `onReady` 后延迟 1500ms 执行 `goToLocation`
3. **闭包陷阱**: 使用 `useRef` 获取最新 state，避免回调闭包问题
4. **主题穿透**: EPUB 主题通过 `injectJavaScript` 注入 CSS 变量

---

## 开发规范

- **样式**: 全部使用 `@shopify/restyle` Box/Text 组件，禁止 `StyleSheet.create`
- **类型**: 显式定义，禁止 `any`
- **命名**: Feature-First 目录组织
- **关键文档**:
  - `product.md` (需求)
  - `doc/technical_design.md` (技术)
  - `doc/PROJECT_PLAN.md` (计划)
