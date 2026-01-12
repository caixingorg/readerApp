---
description: 重构
---

# Workflow: Legacy Refactoring (The Surgical Protocol)
# 触发器: "重构 [模块]...", "优化 [旧代码]..."

## 阶段 1: 尸检与定界 (Autopsy & Bounding)
1.  **现状分析**:
    - 识别旧代码的输入 (Props/Params) 和输出 (Callbacks/Nav)。
    - 识别 "上帝组件" (God Component) 和 隐式耦合 (Global Events)。
2.  **建立防线 (Safety Net)**:
    - 现有代码是否有测试？如果有，运行它。
    - 如果没有，**必须**先写一个基本的集成测试 (Integration Test) 覆盖核心路径。

## 阶段 2: 隔离设计 (Isolation Design)
1.  **接口定义 (Facade)**:
    - 定义一个新的 Hook 接口 (如 `useNewProfileLogic`)，模拟旧逻辑的输入输出。
2.  **组件克隆**:
    - 创建 `[Component].v2.tsx`。
    - 保持 UI 结构不变，先替换数据层；或者保持数据不变，先替换 UI 层 (Gluestack)。**严禁同时修改 UI 和数据层**。

## 阶段 3: 增量执行 (Incremental Execution)
1.  **Step 1 - 数据层**: 抽离逻辑到 Hook，并在旧组件中使用该 Hook 验证。
2.  **Step 2 - UI 层**: 使用新 UI 库重写渲染层，对接同一个 Hook。
3.  **Step 3 - A/B 测试**: 在父组件中通过简单布尔值切换 V1/V2。

## 阶段 4: 验证与清理 (Verify & Purge)
1.  **人工验收**: 对比 V1 和 V2 的视觉差异、性能差异 (FlashList FPS)。
2.  **僵尸代码标记**: 给旧代码文件添加 `@deprecated` 注释，设定删除日期。