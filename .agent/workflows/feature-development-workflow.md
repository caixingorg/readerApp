# 功能开发工作流

> 从需求分析到上线的标准化开发流程

## 适用场景

开发新功能或模块时使用此流程

## 前置条件

- [ ] 需求已明确，有设计稿或 PRD 文档
- [ ] 已从主分支拉取最新代码
- [ ] 开发环境正常运行
- [ ] 了解项目技术栈规则（vue-rules / react-rules / nextjs-rules）

## 执行步骤

### 阶段 1：分析与规划 (5-10 分钟)

**目标**：全面理解需求，规划技术方案，避免返工

#### 需求分析
1. 阅读需求文档，提取关键信息：
   - 核心功能点是什么？
   - 涉及哪些数据模型？
   - UI 交互逻辑如何？
   - 是否有性能要求？
   - 潜在风险点在哪？

2. 识别依赖关系：
   - 是否依赖后端接口？（未完成则需 Mock）
   - 是否依赖其他模块？
   - 是否需要新增第三方库？

#### 技术方案设计
3. 确定技术选型（参考项目规则）：
   - 状态管理方案
   - 数据获取方式
   - UI 组件库选择

4. 规划文件结构：
   ```
   features/
     [feature-name]/
       components/
       hooks/         # 或 composables (Vue)
       api/
       types/
       utils/
   ```

5. 评估风险：
   - 是否需要 POC 验证可行性？
   - 是否会影响现有功能？
   - 是否需要数据库迁移？

✅ **检查点**：
- 能用一句话清晰描述功能
- 技术方案团队无异议
- 文件结构符合项目规范

### 阶段 2：环境准备 (2-5 分钟)

**目标**：创建隔离的开发环境

1. 创建功能分支：
   ```bash
   git checkout -b feature/[feature-name]
   ```

2. 如需新依赖，先验证：
   ```bash
   # 示例：安装并测试新库
   npm install [package-name]
   # 创建 demo 文件验证基本功能
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

✅ **检查点**：
- 分支创建成功
- 依赖安装无错误
- 开发服务器正常运行

### 阶段 3：增量开发 (主要开发时间)

**目标**：按优先级逐层实现，保持每一步可验证

#### 开发顺序（由内而外）

**Step 1: 类型定义层**
```typescript
// types/feature.types.ts
export interface FeatureData {
  // 定义数据结构
}

export interface FeatureProps {
  // 定义组件 Props
}
```

**Step 2: API 层**
```typescript
// api/feature.api.ts
// 定义接口请求函数
// 使用 Zod 定义响应 Schema
```

**Step 3: 业务逻辑层**
```typescript
// hooks/useFeature.ts (React)
// composables/useFeature.ts (Vue)
// 封装业务逻辑，保持 UI 组件纯净
```

**Step 4: UI 组件层**
```tsx
// components/FeatureComponent.tsx
// 只负责渲染，逻辑在 hooks 中
```

#### 开发节奏

每完成一个模块：
1. 运行类型检查：`npm run type-check`
2. 运行 Lint：`npm run lint`
3. 手动测试功能
4. 提交代码（Conventional Commits）：
   ```bash
   git add .
   git commit -m "feat(feature-name): add data layer"
   ```

✅ **检查点**（每个 Step 后）：
- TypeScript 无类型错误
- ESLint 无警告
- 功能在浏览器中正常显示
- 无控制台错误

### 阶段 4：质量保证 (15-30 分钟)

**目标**：确保代码质量、性能、可维护性

#### 功能测试
1. 正常流程测试：
   - [ ] 主流程能走通
   - [ ] 数据正确显示
   - [ ] 交互响应正常

2. 异常流程测试：
   - [ ] 网络错误有友好提示
   - [ ] 空状态正确显示
   - [ ] 加载状态正确显示

3. 边界情况测试：
   - [ ] 空数据
   - [ ] 超长数据
   - [ ] 特殊字符

#### 代码审查（自审）
1. 代码质量：
   - [ ] 无 `any` 类型（TypeScript）
   - [ ] 无 `console.log` 遗留
   - [ ] 无硬编码的值（使用常量）
   - [ ] 命名清晰有意义

2. 性能检查：
   - [ ] 无不必要的重渲染
   - [ ] 网络请求无重复调用
   - [ ] 图片已优化（使用 next/image 或类似）
   - [ ] 长列表使用虚拟滚动

3. 安全检查：
   - [ ] 用户输入已验证
   - [ ] 敏感信息未泄露
   - [ ] API Key 未硬编码

4. 可维护性：
   - [ ] 复杂逻辑已抽离到 hooks/utils
   - [ ] 单文件行数 ≤ 150 行（React）/ 200 行（Vue）
   - [ ] 关键逻辑有注释

#### 性能测试
1. 使用浏览器 DevTools：
   - Network 检查请求数量和大小
   - Performance 检查渲染性能
   - Lighthouse 检查综合得分（目标 ≥ 90）

2. 框架特定工具：
   - React：React DevTools Profiler
   - Vue：Vue DevTools Performance

✅ **检查点**：
- 所有测试用例通过
- 性能指标符合要求
- 代码审查无严重问题

### 阶段 5：测试编写 (可选但推荐)

**目标**：为关键逻辑添加单元测试

1. 测试 hooks/composables：
   ```typescript
   // __tests__/useFeature.test.ts
   describe('useFeature', () => {
     it('should fetch data correctly', () => {
       // 测试用例
     });
   });
   ```

2. 测试 utils 函数：
   ```typescript
   // __tests__/feature.util.test.ts
   ```

3. 运行测试：
   ```bash
   npm test
   ```

✅ **检查点**：
- 测试覆盖率 ≥ 80%（关键逻辑）
- 所有测试通过

### 阶段 6：提交与协作 (5-10 分钟)

**目标**：代码合并到主分支

1. 整理提交记录（可选）：
   ```bash
   git rebase -i HEAD~n  # 合并琐碎提交
   ```

2. 推送到远程：
   ```bash
   git push origin feature/[feature-name]
   ```

3. 创建 Pull Request：
   - 标题：`feat(scope): description`
   - 描述模板：
     ```markdown
     ## 功能描述
     [简述功能]

     ## 技术方案
     - 使用 [技术栈]
     - 数据获取方式：[方式]

     ## 测试
     - [ ] 功能测试通过
     - [ ] 性能测试通过
     - [ ] 无控制台错误

     ## 截图
     [功能截图]
     ```

4. 等待 Code Review：
   - 及时回复评审意见
   - 修改后重新请求审查

5. 合并后验证：
   - 部署到测试环境
   - 完整回归测试
   - 通知相关人员验收

✅ **检查点**：
- PR 通过审查
- 代码成功合并
- 测试环境验证通过

## 验收标准

- [ ] 功能完整符合需求
- [ ] 代码通过 Code Review
- [ ] 无 TypeScript / ESLint 错误
- [ ] 测试覆盖关键逻辑
- [ ] 性能无明显劣化
- [ ] 无新增控制台错误或警告
- [ ] 文档已更新（如需要）

## 回滚方案

### 开发阶段回滚
如发现方案不可行：
```bash
git checkout main
git branch -D feature/[feature-name]
# 重新规划方案
```

### 上线后回滚
如功能上线后出现严重问题：

1. 紧急回滚代码：
   ```bash
   git revert <commit-hash>
   git push
   ```

2. 或回滚部署：
   ```bash
   # 回滚到上一个稳定版本
   ```

3. 创建 hotfix 分支修复
4. 修复后重新走完整流程

## 常见问题

**Q: 开发过程中需求变更怎么办？**
A: 立即暂停开发，重新评估影响范围。如变更较大，建议重新走"阶段 1：分析与规划"。记录变更原因和决策过程。

**Q: 依赖的后端接口未完成怎么办？**
A: 使用 Mock 数据开发。提前与后端约定接口契约（定义 TypeScript Interface），后端完成后替换 Mock。

**Q: 发现需要修改老代码怎么办？**
A: 参考项目规则中的"绞杀植物模式"。优先考虑在新文件中实现，通过 Feature Flag 切换，避免直接修改运行中的代码。

**Q: 单个功能太大，预计超过 2 天开发时间？**
A: 拆分为多个子功能，分别开发。每个子功能都走完整的 workflow，保持可交付状态。

**Q: 性能测试不达标怎么办？**
A: 
1. 使用 Profiler 定位瓶颈
2. 检查是否有不必要的重渲染
3. 检查网络请求是否可优化
4. 考虑使用虚拟滚动、懒加载等技术
5. 如实在无法优化，与团队讨论是否降低标准

**Q: Code Review 提出大量修改意见？**
A: 这很正常。逐条回复和修改，不确定的地方主动沟通。把 Review 意见当作学习机会。

## 快捷指令

在对话中使用以下指令快速触发 workflow：

- **/dev-start [feature-name]**: 开始功能开发，自动执行阶段 1-2
- **/dev-check**: 执行质量检查（阶段 4）
- **/dev-pr**: 生成 PR 描述模板
- **/dev-rollback**: 回滚当前功能分支

## 持续改进

本 workflow 会根据团队实践持续优化。如有改进建议，请提交到团队讨论。
