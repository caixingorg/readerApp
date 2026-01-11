# EPUB TOC Navigation Analysis & Fix

## 1. Problem Description

Users reported that clicking on Table of Contents (TOC) entries for certain EPUB books failed to navigate to the selected chapter. However, using the "Next/Previous" page buttons worked correctly.

## 2. Root Cause Analysis

### 2.1 Mismatch in Path Resolution

The core issue stems from a discrepancy between how our app parses the EPUB structure (OPF Manifest) and how the `epub.js` rendering engine manages internal paths.

- **Manifest (OPF)**: Often defines paths relatively, e.g., `chapter1.xhtml`.
- **Internal Engine**: When the book is unzipped, the engine might mount it under a root prefix, e.g., `EPUB/xhtml/chapter1.xhtml`.

When we call `goToLocation('chapter1.xhtml')`, the engine fails to match it against its internal registry of sections because it expects the full path `EPUB/xhtml/chapter1.xhtml`.

### 2.2 Difference Between Page Turn and Jump

- **Page Turn (`next() / prev()`)**: Works because it uses an internal iterator (Index-based) or Linked List approach (`next` spine item). It does not rely on resolving file paths stringently.
- **TOC Jump (`display(href)`)**: When passing a string, the engine treats it as a Path lookup. If the path string doesn't essentially match the keys in its internal `spine` object, the lookup returns `undefined`, and navigation fails silently or logs a warning.

## 3. The Fix: Hybrid Navigation Strategy

We implemented a **Hybrid Strategy** in `ReaderScreen.tsx` that leverages the robustness of Index-based navigation while preserving the precision of Path-based navigation for deep linking (anchors).

### 3.1 Strategy Detail

1.  **Strict Chapter Jumps (No Hash)** -> **Use Index**
    - If the TOC entry points to a file without a hash (e.g., `chapter1.xhtml`), we find the index of that chapter in our parsed spine and call `epubRef.current.goToLocation(index)`.
    - **Why**: Passing a Number (Index) to `epub.js`'s `display()` method bypasses path resolution entirely. It simply loads the N-th item in the spine. This is 100% reliable as long as our parsed spine matches the book's spine order.

2.  **Anchor Jumps (Has Hash)** -> **Use Prefix-Aware Path**
    - If the TOC entry has an anchor (e.g., `chapter1.xhtml#section3`), we must use the path string because an Index only points to the file, not the specific element inside it.
    - **Fix**: We implemented a dynamic **Path Prefix Detection** system.
        - We listen to `onSectionChange` events.
        - We compare the Engine's reported href (`EPUB/xhtml/chapter1.xhtml`) with our Spine's href (`chapter1.xhtml`).
        - We calculate the specific prefix (`EPUB/xhtml/`) required for this book.
        - When jumping to an anchor, we prepend this prefix to the target href.

### 3.2 Code Changes

**`ReaderScreen.tsx` (Logic):**

```typescript
const hasHash = href.includes('#');

if (!hasHash) {
    // Scenario 1: Strict Chapter Jump -> Use Index (Robust)
    epubRef.current.goToLocation(chapterIndex);
} else {
    // Scenario 2: Anchor Jump -> Use Path + Hash + Detected Prefix
    let targetJump = spineHref + originalHash;
    if (pathPrefixRef.current && !targetJump.startsWith(pathPrefixRef.current)) {
        targetJump = pathPrefixRef.current + targetJump;
    }
    epubRef.current.goToLocation(targetJump);
}
```

**`EpubReader.tsx` (Interface):**
Updated `goToLocation` signature to accept `string | number`.

## 4. Verification

- **Clicking Chapter Title**: Calls `goToLocation(5)` -> Success.
- **Clicking Sub-Chapter**: Calls `goToLocation('EPUB/xhtml/ch5.xhtml#sub1')` -> Success (Prefix auto-detected).

---

# EPUB 目录跳转问题分析与修复 (中文说明)

## 1. 问题描述

用户反馈部分 EPUB 书籍点击目录无法跳转，但翻页正常。使用“上一页/下一页”按钮功能正常，但点击目录项无反应。

## 2. 根本原因

### 2.1 路径解析不匹配

问题的核心在于我们的应用解析 EPUB 结构（OPF Manifest）的方式与 `epub.js` 渲染引擎管理内部路径的方式存在差异。

- **Manifest (OPF)**: 通常定义相对路径，例如 `chapter1.xhtml`。
- **内部引擎**: 当书籍被解压时，引擎可能会将其挂载在根前缀下，例如 `EPUB/xhtml/chapter1.xhtml`。

当我们调用 `goToLocation('chapter1.xhtml')` 时，引擎无法在其内部注册表中找到匹配项，因为它期望的是完整路径 `EPUB/xhtml/chapter1.xhtml`。

### 2.2 翻页与跳转的区别

- **翻页 (`next() / prev()`)**: 工作正常，因为它使用内部迭代器（基于索引）或链表方法（下一个 Spine 项目）。它不依赖于严格的文件路径解析。
- **目录跳转 (`display(href)`)**: 当传递字符串时，引擎将其视为路径查找。如果路径字符串与内部 `spine` 对象中的键不匹配，查找返回 `undefined`，导致导航失败且往往没有明显报错。

## 3. 修复方案：混合导航策略

我们在 `ReaderScreen.tsx` 中实现了**混合策略**，利用索引导航的稳健性，同时保留锚点深层链接的精确性。

### 3.1 策略详情

1.  **纯章节跳转（无哈希锚点） -> 使用索引 (Index)**
    - 如果目录项指向没有哈希的文件（例如 `chapter1.xhtml`），我们在解析的 Spine 中找到该章节的索引，并调用 `epubRef.current.goToLocation(index)`。
    - **原因**: 向 `epub.js` 的 `display()` 方法传递数字（索引）会完全绕过路径解析。它只是加载 Spine 中的第 N 项。只要我们解析的 Spine 与书籍的 Spine 顺序一致，这通过索引跳转是 100% 可靠的。

2.  **锚点跳转（有哈希锚点） -> 使用带前缀的路径**
    - 如果目录项包含锚点（例如 `chapter1.xhtml#section3`），我们必须使用路径字符串，因为索引只能指向文件，无法指向文件内的特定元素。
    - **修复**: 我们实现了一个动态的**路径前缀检测**系统。
        - 监听 `onSectionChange` 事件。
        - 比较引擎报告的 href（`EPUB/xhtml/chapter1.xhtml`）与我们 Spine 的 href（`chapter1.xhtml`）。
        - 计算该书籍所需的特定前缀（`EPUB/xhtml/`）。
        - 跳转到锚点时，将此前缀预先添加到目标 href 前。

### 4. 验证

- **点击章节标题**: 调用 `goToLocation(5)` -> 成功。
- **点击子章节**: 调用 `goToLocation('EPUB/xhtml/ch5.xhtml#sub1')` -> 成功 (自动检测到前缀)。
