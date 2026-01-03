# 📱 Reader App 开发计划与进度总览

> **最后更新时间**: 2026-01-03
> **当前阶段**: Phase 2 - 阅读器核心功能增强 (Reader Enhancement)

## ✅ 已完成功能 (Completed)

### 1. 基础架构
- [x] 项目初始化 & 导航架构 (Tab + Stack)
- [x] 数据库集成 (WatermelonDB)
- [x] 状态管理 (Zustand)
- [x] 国际化支持 (i18next)

### 2. 图书库 (Library)
- [x] 列表展示与网格布局
- [x] 本地文件导入 (支持 `.epub`, `.txt`)
    - **修复 v1**: 解决了文件名含特殊字符导致的导入卡死问题。
    - **修复 v2**: 禁用了 `DocumentPicker` 自动缓存，解决了模拟器/iOS 部分版本下的挂起问题。
    - **修复 v3 (2026-01-03)**: 兼容模拟器和真机的最终方案
        - 使用 `copyToCacheDirectory: false` 确保模拟器和真机都能正常工作
        - 优化文件类型配置：iOS 使用多种 UTI 类型，Android 使用通配符
        - 添加源文件存在性检查，避免复制不存在的文件
        - 实现智能双重复制机制：copyAsync 失败时自动尝试 read+write 方式
        - 增强错误日志，便于调试不同环境问题
    - **优化**: 增加了全屏导入 Loading 状态。
- [x] 简单的封面解析
- [x] 删除与搜索功能

### 3. 阅读器基础 (Reader Core)
- [x] 基于 `react-native-webview` 的阅读引擎
- [x] EPUB 格式解析与渲染
- [x] TXT 格式分页与渲染

### 4. 阅读器增强 (Enhancements)
- [x] **沉浸式阅读模式 (Immersive Mode)**
    - 点击屏幕中央切换 顶部/底部 菜单栏。
    - 状态栏安全区域适配。
- [x] **动态样式注入**
    - **字号设置**: 通过 JS 动态注入 CSS (`!important`)，解决了 EPUB 内置样式覆盖问题。
    - **背景/主题**: 实现了 Light, Dark, Sepia, EyeCare 四种模式的无刷新切换。
- [x] **UI 面板优化**
    - 字体与主题面板改为底部非模态浮层。
    - 适配了刘海屏 (Safe Area)。

---

## 🚧 正在进行中 (In Progress) & 近期计划

### 1. 目录导航 (Table of Contents) `[优先级: 高]`
- **目标**: 让用户能查看书籍目录并跳转。
- **计划**:
    - [ ] 完善 `TOCDrawer` 组件。
    - [ ] 解析 EPUB 的 `ncx` 或 `toc` 数据。
    - [ ] 实现章节点击跳转。
    - [ ] (可选) 章节当前阅读位置的高亮。

### 2. 笔记与高亮 (Notes & Highlights) `[优先级: 中]`
- **目标**: 支持长按文本高亮，并添加笔记。
- **计划**:
    - [ ] 实现 WebView 端选文交互 (Selection API)。
    - [ ] 获取 CFI (EPUB 位置) 或 DOM Range。
    - [ ] 存入 WatermelonDB (`notes` 表)。
    - [ ] 在 `NotesModal` 中展示、编辑、删除笔记。

### 3. 听书功能 (TTS) `[优先级: 低]`
- **目标**: 基础的朗读功能。
- **计划**:
    - [ ] 集成 `expo-speech`。
    - [ ] 实现 播放/暂停/停止 控制条。
    - [ ] (进阶) 支持段落级的高亮跟随。

---

## 🐛 已知问题与待优化 (Backlog)

1.  **大文件性能**: 数百兆的 TXT 加载速度有待优化（目前采用简单的分页切割）。
2.  **EPUB 复杂样式**: 部分排版复杂的 CSS 可能仍需针对性适配。
3.  **安卓兼容性**: 目前主要在 iOS 模拟器验证，需补充 Android 真机测试。

---

## 🛠 技术栈概览
- **Core**: React Native (Expo)
- **UI**: @shopify/restyle
- **Local DB**: WatermelonDB (SQLite)
- **State**: Zustand
- **Reader Engine**: WebView + Injected JavaScript
