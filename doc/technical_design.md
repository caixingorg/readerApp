# Reader App - 技术设计文档 (Technical Design Document)

## 1. 架构概览 (Architecture Overview)

*   **架构模式**: Feature-Based (按功能分层) + MVVM (借助 Zustand 和 React Hooks).
*   **技术栈**:
    *   **Core**: React Native (Expo SDK 52)
    *   **UI Framework**: @shopify/restyle (Type-safe Theme System)
    *   **State Management**: Zustand (Global Store), React Context (Theme/Auth)
    *   **Local Storage**: WatermelonDB (SQLite) for structured data, MMKV for settings.
    *   **Reader Engine**: `react-native-webview` (EPUB/HTML), Native ScrollView (TXT).
    *   **File System**: `expo-file-system` (Book management).

---

## 2. 模块设计 (Module Design)

### 2.1 数据层 (Data Layer - WatermelonDB)

*   **Database Schema**:
    *   **Book Table**: 存储书籍元数据。
        *   `id`: string (UUID)
        *   `title`: string
        *   `author`: string
        *   `cover`: string (Local URI)
        *   `filePath`: string (Relative/Absolute path - actively managed)
        *   `fileType`: 'epub' | 'txt' | 'pdf'
        *   `progress`: number (0-100)
        *   `lastRead`: number (Timestamp)
        *   `currentChapterIndex`: number
        *   `currentScrollPosition`: number
    *   **Note Table** (Proposed): 存储笔记和高亮。
        *   `id`: string
        *   `book_id`: relation (to Book)
        *   `cfi`: string (EPUB Location) / `range`: string (TXT)
        *   `content`: string (Note text)
        *   `highlightColor`: string
        *   `selectedText`: string
        *   `createdAt`: number

### 2.2 图书库模块 (Library Module)

*   **文件导入 (Import Strategy)**:
    *   使用 `expo-document-picker` 选择文件。
    *   **关键修正**: 由于 iOS Sandbox 路径轮转机制，数据库仅存储**文件名**或**相对路径**，或在运行时动态修复绝对路径。
    *   **TXT**: 直接复制到 `DocumentDirectory/books/`。
    *   **EPUB**: 复制到 `DocumentDirectory/books/`，首次打开时解压到 `CacheDirectory/unzip/{bookId}/`。
*   **封面解析**:
    *   **EPUB**: 解析 `content.opf` 提取封面图片，缓存至本地。
    *   **TXT**: 生成默认封面（使用书名首字）。

### 2.3 阅读器核心 (Reader Core Module)

#### 2.3.1 EPUB 引擎 (`EpubReader`)
*   **渲染原理**: 使用 `WebView` 加载解压后的 HTML章节文件。
*   **样式注入 (Style Injection)**:
    *   使用 `injectJavaScript` 注入 CSS 变量，覆盖原书样式。
    *   支持：字号 (`--reader-font-size`)、背景色 (`--reader-bg`)、字体颜色 (`--reader-text`)。
*   **交互通信 (Bridge)**:
    *   Using `window.ReactNativeWebView.postMessage`.
    *   **Events**: `TAP_CENTER`, `TAP_LEFT`, `TAP_RIGHT`, `SCROLL` (progress), `SELECTION` (text selection).
*   **翻页逻辑**:
    *   **Scroll Mode**: 平滑滚动。
    *   **Pagination Mode** (Future): 利用 CSS Column 布局模拟翻页。
*   **进度管理**:
    *   记录 `currentChapterIndex` (Spine Index) 和 `scrollPercentage` (0.0 - 1.0).

#### 2.3.2 TXT 引擎 (`NativeReader`)
*   **渲染原理**: `FlatList` (Virtualization) 或 `ScrollView` (Simple).
*   **分页策略**:
    *   **简单分页**: 将大文本按换行符或固定长度切割成 Chunk 数组。
    *   **精确分页** (Advanced): 使用 `TextLayout` 测量计算（复杂，后期优化）。
*   **大文件优化**: 分块读取 (File System reading in chunks) 以降低内存占用。

### 2.4 设置模块 (Settings Module)

*   **存储**: 使用 `zustand` + `MMKV` 持久化用户偏好。
*   **配置项**:
    *   `fontSize`: number
    *   `lineHeight`: number
    *   `fontFamily`: string
    *   `themeMode`: 'light' | 'dark' | 'warm' | 'eye-care'
    *   `turnAnimation`: 'slide' | 'curl' | 'none'

---

## 3. 关键实现细节 (Implementation Details)

### 3.1 目录解析 (Table of Contents)
*   **EPUB**: 解析 `.ncx` (EPUB2) 或 `nav.xhtml` (EPUB3)。
*   **TXT**: 正则匹配 `/(第[一二三四五六七八九十百千0-9]+[章回节卷集])/`。

### 3.2 笔记系统 (Notes & Highlights)
*   **选中机制**:
    *   WebView 端监听 `selectionchange` 事件。
    *   获取选中 Range 的 CFI (Canonical Fragment Identifier) 或 XPath。
*   **渲染高亮**:
    *   WebView 端注入 JS: `document.execCommand('hilite')` 或包裹 `<span>` 标签。
    *   页面加载时，根据 DB 中的 CFI 列表重新绘制高亮。

### 3.3 跨页面动效
*   使用 `react-native-reanimated` 实现共享元素转场 (Shared Element Transition) - 从书架点击封面到阅读器打开。

---

## 4. 任务分解与状态 (Task Breakdown & Status)

> 基于 `PROJECT_PLAN.md` 和代码现状更新。

### Phase 1: 基础建设 (Infrastructure) - [Completed]
- [x] 初始化项目与导航 (Expo Router/React Navigation).
- [x] 集成 ui-lib (`@shopify/restyle`).
- [x] 集成 WatermelonDB.
- [x] 实现基础书架 (List/Grid).

### Phase 2: 阅读器核心 (Reader Core)
- [x] 基础 EPUB 渲染 (WebView).
- [x] 基础 TXT 渲染 (ScrollView).
- [x] 翻页交互 (点击/滑动).
- [x] 动态样式 (字号/主题).
- [x] 目录 (TOC) 基础 UI.
- [ ] **TOC 解析优化**: 目前仅支持基础 ncx，需增强对 EPUB3 nav 的支持.
- [ ] **TXT 智能分章**: 实现正则分章逻辑.

### Phase 3: 交互与增强 (Enhancements)
- [ ] **搜索功能**: 实现书架搜索 (UI已就绪，需完善筛选逻辑).
- [ ] **笔记系统**:
    *   [ ] WebView 端选词与坐标获取 (Selection API).
    *   [ ] 数据库 Note 表定义.
    *   [ ] 高亮持久化与重绘.
- [ ] **听书 (TTS)**: 集成 `expo-speech` (Preliminary UI added).

### Phase 4: 性能与细节 (Polish)
- [ ] **大文件优化**: 优化 TXT > 10MB 时的加载性能.
- [ ] **iOS 沙盒路径自愈**: 完善 `getSafePath` 逻辑，确保每次冷启动都能找到文件.
- [ ] **导入体验**: 增加导入进度条，处理特殊文件名.
