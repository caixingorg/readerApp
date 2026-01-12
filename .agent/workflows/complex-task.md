---
description: 模糊任务
---

# Workflow: Complex Feature Breakdown
# 触发器: "实现 [大型模块]", "创建 [复杂系统]"

## 阶段 1: WBS 任务分解 (Work Breakdown Structure)
*Agent 必须先输出任务清单，等待用户确认，不可直接写代码。*

**Output Template**:
1.  **Infrastructure**: 数据库 Schema (Realm/WatermelonDB), API 定义, 类型定义。
2.  **Core Logic**: 状态管理 (Zustand Stores), 业务 Hooks。
3.  **UI Components**: 原子组件, 复合组件。
4.  **Integration**: 页面组装, 导航配置。
5.  **Polish**: 动画, 错误处理, 边界情况。

*(等待用户确认 "Approve Plan")*

## 阶段 2: 迭代执行 (Iterative Execution)
*进入循环模式:*
1.  **选取任务**: "现在执行任务 2.1: 编写购物车 Store"。
2.  **执行代码**: 生成代码。
3.  **单元验证**: 提供测试该小模块的方法。
4.  **Checkpoint**: "任务 2.1 完成。当前系统状态：Store 已就绪，但 UI 未连接。下一步：任务 3.1 购物车卡片组件。"

## 阶段 3: 集成联调 (Integration)
- 将各个孤立的模块在 `screens/` 中组装。
- 全链路跑通 (Happy Path)。