# EPUB 导航与进度调试经验总结

## 🎯 核心问题回顾

本次调试主要解决了三个层面的问题，涉及文件系统路径、组件初始化时序以及 React 状态管理冲突。

### 1. 路径格式不兼容 ("File not readable")
*   **现象**：打开电子书时，控制台报错无法读取文件，导致内容无法加载。
*   **原因**：
    *   `@epubjs-react-native` 组件（底层使用 `epub.js`）的 `goToLocation` 方法严格要求 **相对路径**（例如 `EPUB/xhtml/chapter1.xhtml`）。
    *   我们的 `EpubService` 生成的 `href` 有时包含绝对路径前缀（`file:///...`）或 `bookDir` 前缀。
    *   然而，当我们为了适配 UI 组件将 `href` 改为相对路径后，原本直接读取文件的 `getChapterContent` 方法失效了，因为它期望 **绝对路径**。
*   **解决方案**：
    *   **路径标准化**：在 `EpubService` 中实现健壮的 `makeRelativePath`，确保传递给 UI 组件的永远是纯净的相对路径。
    *   **上下文注入**：修改 `getChapterContent(href, bookId)`，将 `bookId` 传入，在方法内部根据 `CACHE_DIR + bookId` 重新构建绝对路径，从而同时满足了 UI 组件（相对路径）和文件读取（绝对路径）的需求。

### 2. 进度恢复失效 (时序竞争)
*   **现象**：App 保存了进度（例如第6章），但重新打开时总是停留在封面（第0章）。
*   **原因**：
    *   **Race Condition**：在 `onReady` 回调中立即调用 `goToLocation` 时，底层 WebView 可能尚未完全初始化完毕（虽然 JS 层已 ready，但渲染层可能还在加载）。
    *   指令被吞：过早发送的跳转指令被组件忽略或被随后的初始化逻辑覆盖。
*   **尝试过的方案**：
    *   ❌ 纯命令式（`onReady` + `goToLocation`）：极不可靠，受设备性能影响大。
    *   ❌ 延时大法（`setTimeout`）：虽然有效，但体验不佳且不优雅。
*   **最终方案（部分）**：
    *   **声明式导航**：利用组件的 props (`location`) 来控制初始位置。组件内部机制会确保在准备就绪后自动处理此属性。

### 3. 目录跳转失效 (Props vs State 冲突)
*   **现象**：点击目录无法跳转，或者只能跳转一次，无法重复跳转同一章。
*   **原因**：
    *   **状态同步冲突**：`EpubReader` 内部有一个 `useEffect` 将 `location` prop 同步到了 `savedLocation`  state。
    *   **判断逻辑失效**：跳转逻辑依赖于 `if (location !== savedLocation)`。由于状态被立即同步，当 Effect 执行时，两者已经相等，导致跳转被跳过。
    *   **纯声明式的局限**：单纯依赖 `location` prop 很难处理 "用户交互"（如点击目录）和 "内部状态"（如翻页）的混合场景。
*   **最终方案：混合导航策略 (Hybrid Strategy)**

## 💡 终极解决方案：混合策略

为了同时解决 "恢复" 和 "交互" 的需求，我们采用了 **各取所长** 的策略：

### 1. 初始恢复：使用 Prop (声明式)
*   **场景**：`loadBook` / `reload`
*   **机制**：通过 `ReaderScreen` 的 state (`targetLocation`) 传递给 `<EpubReader location={targetLocation} />`。
*   **优势**：利用组件生命周期，确保在 Reader 及其依赖（Rendition）完全 Ready 后自动执行初始跳转。

### 2. 交互跳转：使用 Ref (命令式)
*   **场景**：用户点击目录 (TOC)
*   **机制**：直接调用 `epubRef.current.goToLocation(href)`。
*   **优势**：
    *   **响应迅速**：无需等待 React diff 或状态更新周期。
    *   **无状态冲突**：绕过了 `location` prop 的 diff 检查，即使目标是当前章节也能强制刷新/跳转。
    *   **解耦**：避免了 `ReaderScreen` state 与 `EpubReader` prop 之间复杂的同步逻辑。

## 📝 最佳实践建议

1.  **路径分离**：明确区分 "用于显示的路径"（相对）和 "用于读取的路径"（绝对）。不要混用。
2.  **避免副作用同步**：不要在子组件中盲目将 props 同步到 state，这往往是 bug 之源。State 应该由内部行为驱动（如翻页），Props 应该由外部命令驱动。
3.  **区分场景**：对于阅读器这类复杂组件，"初始化" 和 "运行时交互" 往往需要不同的控制手段。混合策略通常比单一的 "完全受控" 或 "完全非受控" 更实用。
