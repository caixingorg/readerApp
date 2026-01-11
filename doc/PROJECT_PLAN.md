# 📱 Reader App 开发计划与实施文档 (Implementation Plan)

> **关联文档**:
>
> - `product.md` (需求文档)
> - `interaction_design.md` (交互文档)
> - `technical_design.md` (技术文档)

## ✅ Phase 1: 基础架构与书架 (Infrastructure & Library)

本阶段目标：应用可运行，能导入并展示书籍。

- [x] **项目初始化**
    - [x] Tab + Stack 导航架构搭建.
    - [x] `@shopify/restyle` 主题系统集成.
    - [x] WatermelonDB 数据库集成 (Book Table).
- [x] **书架功能**
    - [x] 书籍列表/网格展示 (FlatList).
    - [x] **文件导入优化** (关键功能)
        - [x] 支持 `.txt`, `.epub` 类型.
        - [x] iOS Sandbox 路径兼容处理 (`copyToCache` + 双重复制策略).
        - [x] 解决文件名含特殊字符导致的 Crash.
    - [x] 书籍删除功能 (软删除/硬删除).
    - [x] 基础封面解析 (EPUB/Default).
    - [ ] (Refine) 书架搜索逻辑 (按标题/作者筛选).

## 🚧 Phase 2: 阅读器核心 (Reader Core)

本阶段目标：提供舒适的基础阅读体验。

- [x] **EPUB 阅读引擎**
    - [x] 基于 `react-native-webview` 的渲染容器.
    - [x] 章节加载与渲染.
    - [x] **动态样式注入** (Font Size, Colors, Line Height).
    - [x] 翻页交互 (点击两侧翻页, 触摸中间呼出菜单).
- [x] **TXT 阅读引擎**
    - [x] 基础 ScrollView 渲染.
    - [x] 状态栏/安全区域适配.
- [x] **阅读状态同步**
    - [x] 阅读进度 (Chapter/Scroll) 自动保持到数据库.
    - [x] 上次阅读时间更新.
- [ ] **目录功能 (TOC)**
    - [x] UI侧边栏 (`TOCDrawer`) 实现.
    - [ ] (Task) 优化 EPUB 目录解析 (支持该死的 EPUB3 `nav.xhtml`).
    - [ ] (Task) 实现 TXT 正则分章 (如 "第\d+章").

## 🔜 Phase 3: 交互增强 (Interaction & Enhancements)

本阶段目标：实现高亮、笔记、TTS等高级功能。

- [ ] **笔记与高亮系统 (Notes & Highlights)**
    - [ ] **Database**: 创建 `Notes` 表 (`book_id`, `cfi`, `content`, `color`).
    - [ ] **Selections**: 实现 WebView 端 JS 选词逻辑 (获取 Range/CFI).
    - [ ] **UI**: 选中文字弹出 Action Tooltip (复制/高亮/笔记).
    - [ ] **Persistence**: 将高亮数据存入 DB，并在再次打开章节时注入 JS 还原高亮.
    - [ ] **Management**: 在目录侧边栏增加"笔记" Tab，管理所有笔记.
- [ ] **听书功能 (TTS)**
    - [ ] (UI Ready) `TTSModal` 播放控制条.
    - [ ] 集成 `expo-speech` 引擎.
    - [ ] 实现 播放/暂停/语速调节/上一句/下一句.
    - [ ] (Advanced) 阅读高亮跟随 (Karaoke effect).

## � Phase 4: 性能优化与细节 (Performance & Polish)

- [ ] **性能优化**
    - [ ] TXT 大文件 (>10MB) 分页加载策略.
    - [ ] 列表图片的懒加载与缓存优化.
- [ ] **细节打磨**
    - [ ] App 启动动画优化.
    - [ ] 更加丝滑的转场动画 (Shared Element).
    - [ ] iOS/Android 兼容性回归测试.

---

## � 下一步执行指引 (Next Actions)

请按照 **Phase 2 -> Phase 3** 的顺序推进。优先完成 **TXT 智能分章** 和 **EPUB 目录解析完善**，这是阅读体验完整性的关键。
