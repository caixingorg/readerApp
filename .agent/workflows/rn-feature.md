---
description: React Native 功能实现
---

# 工作流: React Native 功能实现
# 触发器: "实现 [X] 功能"

## 阶段 1: 需求理解与环境 (Understanding & Setup)
1.  **分析 `package.json`**: 识别 UI 库 (Gluestack/Tamagui) 和导航库 (React Navigation/Expo Router)。
2.  **定义 DoD (完成的定义)**:
    - iOS 模拟器运行正常？
    - Android 模拟器运行正常？
    - 安全区域 (Safe Area) 处理完毕？
    - 键盘避让 (Keyboard Avoidance) 处理完毕？
    - 暗黑模式 (Dark Mode) 适配完毕？

## 阶段 2: 方案设计 (Interface First)
1.  **目录结构确认**:
    - `src/features/[feature]/components/`: UI 原子/分子组件
    - `src/features/[feature]/screens/`: 路由级页面
    - `src/features/[feature]/hooks/`: 业务逻辑 Hooks
2.  **类型定义**:
    - 定义领域接口 (Zod Schemas)。
    - 定义/更新 Navigation Param List。
    - **动作**: 在写代码前，先询问用户确认接口定义。

## 阶段 3: 任务执行 (Execution)
1.  **脚手架生成**: 创建文件结构。
2.  **逻辑填充**: 编写 Hooks 和状态管理。
3.  **UI 实现**:
    - 使用 UI 库提供的 `<Box>`, `<HStack>`, `<VStack>`, `<Text>`。
    - 如果涉及列表，强制使用 `FlashList`。
4.  **原生检查**:
    - 如引入新的原生依赖 -> 提示 `cd ios && pod install`。
    - 检查是否需要 Android 权限配置。

## 阶段 4: 自我审查 (Review)
- [ ] 样式是否使用了 Design Tokens？
- [ ] FlashList 是否设置了 `estimatedItemSize`？
- [ ] 安全区域 (SafeArea) 是否已正确处理？