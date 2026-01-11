# Reader Module 开发者指南

本模块负责处理核心的阅读体验，支持 EPUB、PDF 和 TXT 多种格式，集成了 TTS（语音朗读）、笔记书签管理及高度灵活的阅读设置。

## 1. 架构概览

模块采用典型的 **Screen -> Hook -> Service** 分层架构：

-   **ReaderScreen.tsx**: 渲染入口，负责 UI 控制流和各种弹窗（模态框）的管理。
-   **useReaderLogic.ts**: 核心业务逻辑 Hook，封装了书籍加载、进度保存、分页跳转等跨格式的逻辑。
-   **useTtsLogic.ts**: 语音朗读逻辑，处理文本提取与播放控制。
-   **Services (EpubService, TxtService, etc.)**: 基础解析库，直接与文件系统和第三方解析引擎交互。

---

## 2. 核心逻辑实现

### 2.1 进度保存与恢复（重难点）
这是阅读器最复杂的逻辑之一，因为我们需要在不同设备、不同路径下保持进度一致。

-   **位置标识 (CFI)**:
    -   **EPUB**: 使用标准的 EpubCFI。
    -   **TXT**: 使用字符偏移量 (scroll offset)。
    -   **PDF**: 使用页码。
-   **章节索引 (ChapterIndex)**: 我们维护一个统一的数字索引，用于快速跳转和目录匹配。
-   **iOS 路径漂移坑**: iOS 的应用沙盒路径在每次安装或更新后由于 GUID 变化会发生变动。
    -   *解决方案*: 数据库仅存储相对路径（或只存储文件名），在加载时通过 `expo-file-system` 动态拼接最新的 `documentDirectory`。
-   **恢复跳转时机**:
    -   EPUB 是在 Webview 中渲染的，`onReady` 回调触发时，Webview 内部的 `rendition` 可能还未完全就绪。
    -   *经验法则*: 在 `onReady` 后设置 **1500ms** 的延迟执行 `goToLocation`，能极大地提高跳转成功率。

### 2.2 大文件 TXT 的“虚拟分块”
为了保证流畅度，我们不直接在界面渲染 10MB+ 的 TXT 文件。
-   **解析**: TXT 加载时会根据正则匹配进度（如“第[一二三...]章”）进行虚拟分块。
-   **渲染**: 使用 React Native 的普通 `ScrollView` 或针对特大文本的优化策略。

### 2.3 EPUB 渲染引擎
基于自定义的 `EpubReader`（底层通常是 Webview + epub.js）。
-   **双重同步**: 需要同步 Webview 内部的滚动位置与外层的控制逻辑。

---

## 3. 注意事项与坑点

### ⚠️ 闭包陷阱
在 `useReaderLogic` 中处理各类回调（如消息处理函数）时，容易陷入 React 闭包陷阱（拿到的 state 是旧的）。
-   *解决方案*: 大量使用 `useRef` (如 `currentChapterIndexRef`) 来实时获取最新状态，并在 UI 渲染层通过 `useState` 进行反馈。

### 🔋 性能与电量
-   **亮度调节**: 阅读器会请求系统亮度权限。退出时注意是否需要恢复（当前实现是跟随用户在应用内的手动调节）。
-   **节流保存**: 进度保存是高频操作，通过 `lastSaveTimeRef` 实现了简单的节流逻辑（如 5 秒内只存一次）。

### 🎨 主题适配
-   由于 EPUB 是在 Webview 里，App 的原生主题无法直接穿透。
-   *实现*: 需要通过 `injectJavascript` 或特定的 Props 将颜色配置实时注入到 Webview 的 CSS 变量中。

---

## 4. 常见问题 (FAQ)

**Q: 为什么书签跳转后页面是白的？**
A: 通常是因为 CFI 路径失效，或者 Webview 渲染过于复杂导致渲染超时。可以尝试切换为基于章节索引 (Index) 的跳转。

**Q: 如何添加新的阅读器格式？**
A: 1. 在 `Book` 类型中增加 `fileType`；2. 在 `hooks/useReaderLogic` 中添加对应的加载分支；3. 在 `ReaderScreen` 中增加对应的渲染子组件。
