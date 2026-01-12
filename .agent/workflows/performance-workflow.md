# 性能优化工作流

> 系统化诊断和优化前端性能的标准流程

## 适用场景

- 首屏加载时间过长
- 页面交互卡顿
- 内存占用过高
- 打包体积过大
- 定期性能审计

## 性能指标标准

### Web Vitals (核心指标)

| 指标 | 说明 | 优秀 | 需改进 | 差 |
|------|------|------|--------|-----|
| **LCP** | 最大内容绘制 | < 2.5s | 2.5-4s | > 4s |
| **FID** | 首次输入延迟 | < 100ms | 100-300ms | > 300ms |
| **CLS** | 累积布局偏移 | < 0.1 | 0.1-0.25 | > 0.25 |
| **FCP** | 首次内容绘制 | < 1.8s | 1.8-3s | > 3s |
| **TTI** | 可交互时间 | < 3.8s | 3.8-7.3s | > 7.3s |

### 其他关键指标

- **Bundle Size**: < 200KB (gzipped)
- **首屏请求数**: < 50 个
- **内存占用**: < 100MB (空闲状态)

## 前置条件

- [ ] 已收集性能数据（Lighthouse / Analytics）
- [ ] 已确定优化目标（具体指标）
- [ ] 开发环境可运行
- [ ] 有生产环境访问权限（查看真实数据）

## 执行步骤

### 阶段 1：性能诊断 (20-40 分钟)

**目标**：精准定位性能瓶颈

#### 数据收集

1. **使用 Lighthouse 审计**：
   ```bash
   # Chrome DevTools
   # 打开 DevTools -> Lighthouse -> 生成报告
   
   # 或使用 CLI
   npm install -g lighthouse
   lighthouse https://your-site.com --view
   ```
   
   关注重点：
   - Performance 分数
   - Opportunities（优化机会）
   - Diagnostics（诊断信息）

2. **使用浏览器 DevTools**：
   
   **Performance 面板**：
   - 记录页面加载
   - 识别长任务（Long Tasks > 50ms）
   - 检查主线程活动
   
   **Network 面板**：
   - 资源加载时间
   - 资源大小
   - 请求瀑布图
   
   **Memory 面板**：
   - 堆快照（Heap Snapshot）
   - 内存时间线
   - 识别内存泄漏

3. **真实用户监控数据**：
   ```typescript
   // 收集 Web Vitals
   import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';
   
   function sendToAnalytics(metric) {
     console.log(metric);
     // 发送到分析服务
   }
   
   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getFCP(sendToAnalytics);
   getLCP(sendToAnalytics);
   getTTFB(sendToAnalytics);
   ```

#### 问题分类

4. **识别性能瓶颈类型**：

   **加载性能问题**：
   - [ ] 打包体积过大
   - [ ] 资源加载慢
   - [ ] 首屏白屏时间长
   - [ ] 关键资源阻塞渲染

   **运行时性能问题**：
   - [ ] 页面交互卡顿
   - [ ] 滚动不流畅
   - [ ] 动画掉帧
   - [ ] 组件渲染慢

   **资源问题**：
   - [ ] 图片未优化
   - [ ] 字体加载慢
   - [ ] 第三方脚本过多
   - [ ] CSS 未优化

   **内存问题**：
   - [ ] 内存泄漏
   - [ ] 内存占用持续增长
   - [ ] 大对象未释放

5. **优先级排序**：
   使用影响力矩阵：
   ```
   高影响 | 快速优化 | 重点优化
   ------|---------|--------
   低影响 | 低优先级 | 评估价值
         | 低成本  | 高成本
   ```

✅ **检查点**：
- 已收集完整性能数据
- 已识别出主要瓶颈
- 已确定优化优先级

### 阶段 2：制定优化方案 (15-30 分钟)

**目标**：针对性制定优化策略

#### 按问题类型制定方案

**1. 打包体积优化**

```bash
# 分析打包体积
npm run build
npx webpack-bundle-analyzer dist/stats.json

# 或 Vite
npx vite-bundle-visualizer
```

优化措施：
- [ ] 代码分割（Code Splitting）
- [ ] 路由懒加载
- [ ] 移除未使用的依赖
- [ ] Tree Shaking 优化
- [ ] 压缩代码
- [ ] 使用更小的替代库

**2. 首屏加载优化**

- [ ] 关键 CSS 内联
- [ ] 预加载关键资源（`<link rel="preload">`）
- [ ] 延迟加载非关键资源
- [ ] 使用 CDN
- [ ] 启用 HTTP/2
- [ ] 服务端渲染（SSR）或静态生成（SSG）

**3. 图片优化**

- [ ] 使用现代格式（WebP, AVIF）
- [ ] 响应式图片（srcset）
- [ ] 图片懒加载
- [ ] 图片压缩
- [ ] 使用 CDN
- [ ] 关键图片预加载

**4. 运行时性能优化**

**React 项目**：
- [ ] 使用 `React.memo` 避免无用渲染
- [ ] 使用 `useMemo` / `useCallback` 优化计算
- [ ] 虚拟列表（react-virtual）
- [ ] 避免在 render 中创建函数/对象
- [ ] 使用 Concurrent Features（React 18+）

**Vue 项目**：
- [ ] 使用 `v-memo` 优化列表
- [ ] 合理使用 `computed` vs `watch`
- [ ] 虚拟滚动
- [ ] 使用 `shallowRef` / `shallowReactive`
- [ ] 组件懒加载

**Next.js 项目**：
- [ ] 使用 Server Components
- [ ] 优化数据获取（并行请求）
- [ ] 配置正确的缓存策略
- [ ] 使用 `next/image` 和 `next/font`
- [ ] 路由预取优化

**5. 内存优化**

- [ ] 清理事件监听器
- [ ] 取消订阅（unsubscribe）
- [ ] 清理定时器
- [ ] 避免闭包陷阱
- [ ] 合理使用 WeakMap / WeakSet

✅ **检查点**：
- 优化方案明确可行
- 已评估实施成本
- 已预估优化效果

### 阶段 3：实施优化 (1-4 小时)

**目标**：增量实施优化措施

#### 优化实施原则

1. **小步快跑**：每次只优化一个方面
2. **测量驱动**：优化前后都要测量
3. **保持功能**：不破坏现有功能

#### 分批实施

**批次 1：快速优化（30-60 分钟）**

低成本高收益的优化：

1. **图片优化**：
   ```typescript
   // Next.js
   import Image from 'next/image';
   
   <Image 
     src="/hero.jpg"
     width={800}
     height={600}
     priority  // 关键图片
     alt="Hero"
   />
   
   // Vue/React
   <img 
     loading="lazy"  // 懒加载
     srcset="..."    // 响应式
     alt="..."
   />
   ```

2. **代码分割**：
   ```typescript
   // React
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   
   // Vue
   const HeavyComponent = defineAsyncComponent(() => 
     import('./HeavyComponent.vue')
   );
   
   // 路由懒加载
   {
     path: '/dashboard',
     component: () => import('./Dashboard.vue')
   }
   ```

3. **移除未使用的依赖**：
   ```bash
   # 分析依赖
   npx depcheck
   
   # 移除未使用的包
   npm uninstall unused-package
   ```

4. **启用压缩**：
   ```javascript
   // vite.config.js
   export default {
     build: {
       minify: 'terser',
       terserOptions: {
         compress: {
           drop_console: true,  // 生产环境移除 console
         },
       },
     },
   };
   ```

**批次 2：渲染优化（1-2 小时）**

1. **React 优化**：
   ```typescript
   // 避免不必要渲染
   const MemoizedComponent = React.memo(Component, (prev, next) => {
     return prev.id === next.id; // 自定义比较
   });
   
   // 优化计算
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(a, b);
   }, [a, b]);
   
   // 优化回调
   const handleClick = useCallback(() => {
     doSomething(id);
   }, [id]);
   ```

2. **虚拟列表**：
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   
   function VirtualList({ items }) {
     const parentRef = React.useRef();
     const virtualizer = useVirtualizer({
       count: items.length,
       getScrollElement: () => parentRef.current,
       estimateSize: () => 50,
     });
     
     return (
       <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
         <div style={{ height: virtualizer.getTotalSize() }}>
           {virtualizer.getVirtualItems().map((virtualRow) => (
             <div key={virtualRow.index}>
               {items[virtualRow.index]}
             </div>
           ))}
         </div>
       </div>
     );
   }
   ```

**批次 3：深度优化（2-4 小时）**

1. **网络优化**：
   ```html
   <!-- 预加载关键资源 -->
   <link rel="preload" href="/critical.css" as="style">
   <link rel="preload" href="/critical.js" as="script">
   
   <!-- 预连接 -->
   <link rel="preconnect" href="https://api.example.com">
   
   <!-- DNS 预解析 -->
   <link rel="dns-prefetch" href="https://cdn.example.com">
   ```

2. **缓存策略**：
   ```typescript
   // Service Worker 缓存
   // sw.js
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request).then((response) => {
         return response || fetch(event.request);
       })
     );
   });
   ```

3. **内存泄漏修复**：
   ```typescript
   useEffect(() => {
     const subscription = observable.subscribe();
     const timer = setInterval(() => {}, 1000);
     const handler = () => {};
     element.addEventListener('click', handler);
     
     // 清理
     return () => {
       subscription.unsubscribe();
       clearInterval(timer);
       element.removeEventListener('click', handler);
     };
   }, []);
   ```

✅ **检查点（每批次后）**：
- 优化已实施
- 功能正常运行
- 无新增 Bug

### 阶段 4：性能测试 (15-30 分钟)

**目标**：验证优化效果

#### 测试方法

1. **Lighthouse 对比**：
   ```bash
   # 优化前
   lighthouse https://your-site.com --output json --output-path ./before.json
   
   # 优化后
   lighthouse https://your-site.com --output json --output-path ./after.json
   
   # 对比
   ```

2. **性能指标对比**：
   
   创建性能对比表：
   ```markdown
   | 指标 | 优化前 | 优化后 | 改善 |
   |------|--------|--------|------|
   | LCP  | 4.2s   | 2.1s   | -50% |
   | FID  | 150ms  | 80ms   | -47% |
   | CLS  | 0.15   | 0.05   | -67% |
   | Bundle Size | 500KB | 300KB | -40% |
   ```

3. **真实环境测试**：
   - 测试环境验证
   - 不同网络环境（Fast 3G / 4G / WiFi）
   - 不同设备（手机 / 平板 / 桌面）
   - 不同浏览器

4. **压力测试**（如适用）：
   - 大量数据场景
   - 频繁交互场景
   - 长时间运行场景

✅ **检查点**：
- 性能指标达到目标
- 真实环境表现良好
- 无功能回归

### 阶段 5：监控与持续优化 (设置长期机制)

**目标**：建立性能监控和持续优化机制

#### 建立监控

1. **添加性能监控**：
   ```typescript
   // 监控 Web Vitals
   import {getCLS, getFID, getLCP} from 'web-vitals';
   
   function sendToAnalytics({name, value, id}) {
     // 发送到你的分析服务
     analytics.track('Web Vitals', {
       metric: name,
       value: Math.round(value),
       id,
     });
   }
   
   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getLCP(sendToAnalytics);
   ```

2. **设置性能预算**：
   ```javascript
   // webpack.config.js
   module.exports = {
     performance: {
       maxAssetSize: 250000,    // 250KB
       maxEntrypointSize: 250000,
       hints: 'error',
     },
   };
   ```

3. **CI/CD 集成**：
   ```yaml
   # .github/workflows/performance.yml
   name: Performance Check
   on: [pull_request]
   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Run Lighthouse
           uses: treosh/lighthouse-ci-action@v9
           with:
             urls: |
               https://your-site.com
             uploadArtifacts: true
   ```

#### 文档记录

4. **记录优化成果**：
   ```markdown
   ## 性能优化记录
   
   ### 优化时间: 2026-01-12
   
   #### 问题
   - 首屏加载时间 4.2s
   - 打包体积 500KB
   
   #### 优化措施
   1. 代码分割 - 减少 200KB
   2. 图片优化 - LCP 提升 1.5s
   3. 虚拟列表 - 渲染性能提升 60%
   
   #### 结果
   - LCP: 4.2s → 2.1s (-50%)
   - Bundle: 500KB → 300KB (-40%)
   - Lighthouse: 65 → 92 (+42%)
   ```

5. **更新团队文档**：
   - 性能优化最佳实践
   - 常见性能问题和解决方案
   - 性能预算和标准

✅ **检查点**：
- 监控系统已部署
- 性能预算已设置
- 文档已更新

## 验收标准

- [ ] 核心 Web Vitals 达到"优秀"标准
- [ ] Lighthouse 性能分数 ≥ 90
- [ ] 打包体积符合预算
- [ ] 真实环境性能改善明显
- [ ] 无功能回归
- [ ] 性能监控已建立
- [ ] 优化文档已记录

## 回滚方案

### 如果优化导致问题

1. 立即回滚代码：
   ```bash
   git revert <commit-hash>
   git push
   ```

2. 分析问题原因

3. 修复后重新优化

### 如果优化效果不佳

1. 重新分析性能数据
2. 调整优化方向
3. 尝试其他优化方案

## 常见问题

**Q: 优化后性能提升不明显？**
A: 
1. 检查是否优化了真正的瓶颈
2. 使用 Profiler 重新诊断
3. 确认测试环境和真实环境一致
4. 可能需要更深层的架构优化

**Q: 如何平衡性能和功能？**
A: 
1. 明确性能目标和优先级
2. 功能完整性优先于过度优化
3. 使用渐进增强策略
4. 关键路径优先优化

**Q: 第三方库性能差怎么办？**
A: 
1. 寻找更轻量的替代库
2. 按需加载第三方库
3. 考虑自己实现核心功能
4. 延迟加载非关键功能

**Q: 性能优化优先级如何确定？**
A: 
1. 用户体验影响最大的优先
2. 快速见效的优先（快速胜利）
3. 投入产出比高的优先
4. 参考 Lighthouse 的 Opportunities

**Q: 如何持续保持性能？**
A: 
1. 设置性能预算和监控
2. 代码审查关注性能
3. 定期性能审计
4. 建立性能优化文化

## 性能优化工具箱

### 分析工具
- **Lighthouse**: 综合性能审计
- **WebPageTest**: 详细性能分析
- **Chrome DevTools**: 全方位分析
- **webpack-bundle-analyzer**: 打包分析
- **React DevTools Profiler**: React 性能分析
- **Vue DevTools**: Vue 性能分析

### 监控工具
- **web-vitals**: Web Vitals 监控
- **Sentry**: 错误和性能监控
- **Google Analytics**: 用户体验监控
- **Datadog**: 全栈性能监控

### 优化工具
- **sharp**: 图片压缩
- **imagemin**: 图片优化
- **terser**: JS 压缩
- **cssnano**: CSS 压缩
- **react-virtual**: 虚拟列表

## 快捷指令

- **/perf-audit**: 执行性能审计，生成诊断报告
- **/perf-analyze**: 分析当前性能瓶颈
- **/perf-optimize [type]**: 针对特定类型优化（bundle/render/image）
- **/perf-compare**: 生成优化前后对比报告

## 性能优化检查清单

```markdown
## 快速检查清单

### 加载性能 🚀
- [ ] 代码分割
- [ ] 路由懒加载
- [ ] 图片优化
- [ ] 资源压缩
- [ ] CDN 加速
- [ ] 预加载关键资源

### 渲染性能 ⚡
- [ ] 虚拟列表
- [ ] 避免不必要渲染
- [ ] 优化计算和回调
- [ ] 动画优化

### 打包优化 📦
- [ ] Tree Shaking
- [ ] 移除未使用依赖
- [ ] 代码压缩
- [ ] 环境变量优化

### 缓存策略 💾
- [ ] HTTP 缓存
- [ ] Service Worker
- [ ] CDN 缓存
- [ ] 浏览器缓存

### 监控告警 📊
- [ ] Web Vitals 监控
- [ ] 性能预算
- [ ] 错误监控
- [ ] 用户体验监控
```
