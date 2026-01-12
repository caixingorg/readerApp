---
description: rn-per
---

# React Native 性能优化工作流

> React Native 应用性能诊断和优化的系统化流程

## ⚠️ 适用范围

**本工作流仅适用于 React Native 移动应用**

## 适用场景

- 应用启动时间过长
- 列表滚动卡顿
- 动画掉帧（FPS < 60）
- 内存占用过高或泄漏
- 打包体积过大
- 导航切换卡顿
- 定期性能审计

## 性能指标标准

### 移动端核心指标

| 指标 | 说明 | 优秀 | 需改进 | 差 |
|------|------|------|--------|-----|
| **App 启动时间** | 冷启动到可交互 | < 2s | 2-4s | > 4s |
| **JS 启动时间** | JS Bundle 加载和执行 | < 1s | 1-2s | > 2s |
| **FPS** | 滚动和动画帧率 | 60 fps | 45-60 fps | < 45 fps |
| **内存占用** | 空闲时内存 | < 100MB | 100-200MB | > 200MB |
| **包体积** | APK/IPA 大小 | < 30MB | 30-50MB | > 50MB |
| **导航时间** | 页面切换耗时 | < 200ms | 200-500ms | > 500ms |

### 平台差异

- **iOS**：更关注流畅度（60fps）和内存管理
- **Android**：更关注启动时间和包体积

## 前置条件

- [ ] 开发模式和生产模式都要测试（性能差异大）
- [ ] 准备真机测试（模拟器性能不准确）
- [ ] iOS 和 Android 都要测试
- [ ] 准备低端设备测试

## 执行步骤

### 阶段 1：性能诊断 (30-60 分钟)

**目标**：精准定位 React Native 特有的性能瓶颈

#### 工具准备

1. **启用性能监控**：
   ```typescript
   // App.tsx
   import { enableScreens } from 'react-native-screens';
   import { enableFreeze } from 'react-native-screens';
   
   if (__DEV__) {
     // 开发模式启用性能监控
     enableScreens();
     enableFreeze(true);
   }
   ```

2. **使用 React Native 性能监控工具**：
   - **Flipper**：Meta 官方调试工具
   - **React DevTools Profiler**：组件渲染分析
   - **Reactotron**：实时监控和调试
   - **@shopify/react-native-performance**：性能打点

#### 数据收集

**1. 启动性能分析**

```bash
# iOS
npx react-native run-ios --configuration Release
# 使用 Instruments 的 Time Profiler

# Android
npx react-native run-android --variant=release
# 使用 Android Studio Profiler
```

关注点：
- Time to Interactive (TTI)
- JS Bundle 加载时间
- Native 模块初始化时间
- 首屏渲染时间

**2. 运行时性能分析**

使用 Flipper 的 Performance Plugin：
- JS 线程 FPS
- UI 线程 FPS
- Bridge 通信耗时
- 内存使用情况

**3. 特定场景测试**：

```typescript
// 使用 react-native-performance 打点
import { performance } from '@shopify/react-native-performance';

// 页面导航性能
const mark1 = performance.mark('navigation-start');
navigation.navigate('Details');
const mark2 = performance.mark('navigation-end');
performance.measure('navigation-time', mark1, mark2);

// 列表渲染性能
const mark3 = performance.mark('list-render-start');
// 渲染列表
const mark4 = performance.mark('list-render-end');
performance.measure('list-render-time', mark3, mark4);
```

#### 问题分类

**JavaScript 线程问题**：
- [ ] JS Bundle 过大
- [ ] 复杂计算阻塞主线程
- [ ] 大量 setState 导致重渲染
- [ ] 闭包导致内存泄漏

**UI 线程问题**：
- [ ] 复杂布局导致渲染慢
- [ ] 大量 Native 视图
- [ ] 动画使用不当
- [ ] 阴影/模糊等昂贵样式

**Bridge 通信问题**：
- [ ] 频繁跨 Bridge 调用
- [ ] 大数据传输
- [ ] Native 模块调用过多

**内存问题**：
- [ ] 图片未释放
- [ ] 事件监听未清理
- [ ] 定时器未清除
- [ ] 循环引用

**包体积问题**：
- [ ] 未优化的图片资源
- [ ] 未使用的依赖
- [ ] Native 模块过多

✅ **检查点**：
- 已识别主要性能瓶颈
- 已收集详细性能数据
- 已确定优化优先级

### 阶段 2：制定优化方案 (20-30 分钟)

**目标**：针对 React Native 特性制定优化策略

#### 按问题类型制定方案

**1. 启动优化**

- [ ] 启用 Hermes 引擎（Android 必须，iOS 可选）
- [ ] 代码分割和懒加载
- [ ] 减少启动时的初始化逻辑
- [ ] 优化 Native 模块加载
- [ ] 使用内联 Requires

```javascript
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // 启用内联 require
      },
    }),
  },
};
```

**2. 渲染性能优化**

- [ ] 使用 `React.memo` 避免无用渲染
- [ ] 使用 `useMemo` / `useCallback` 优化
- [ ] 列表优化（FlatList 配置）
- [ ] 使用 `@shopify/flash-list` 替代 FlatList
- [ ] 避免匿名函数和内联样式

```typescript
// ❌ 错误：每次渲染创建新对象
<View style={{ flex: 1 }}>

// ✅ 正确：复用样式对象
const styles = StyleSheet.create({
  container: { flex: 1 },
});
<View style={styles.container}>
```

**3. 列表优化（关键）**

```typescript
// 使用 @shopify/flash-list
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  estimatedItemSize={100}  // 关键：提供预估尺寸
  // 性能优化配置
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
/>
```

**4. 动画优化**

使用原生动画（运行在 UI 线程）：

```typescript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

function AnimatedComponent() {
  const translateX = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return <Animated.View style={animatedStyle} />;
}
```

**5. 图片优化**

```typescript
// 使用 react-native-fast-image
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
  style={styles.image}
/>

// 配置图片缓存
FastImage.preload([
  { uri: url1, priority: FastImage.priority.high },
  { uri: url2 },
]);
```

**6. 内存优化**

```typescript
// 清理副作用
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  const timer = setInterval(() => {}, 1000);
  
  return () => {
    subscription.remove();  // 清理事件监听
    clearInterval(timer);   // 清理定时器
  };
}, []);

// 清理图片缓存
import FastImage from 'react-native-fast-image';
FastImage.clearMemoryCache();
FastImage.clearDiskCache();
```

**7. Bundle 优化**

```bash
# 分析 Bundle 大小
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android.bundle \
  --sourcemap-output android.map

# 使用可视化工具分析
npm install -g react-native-bundle-visualizer
react-native-bundle-visualizer
```

优化措施：
- [ ] 移除未使用的依赖
- [ ] 使用轻量级替代库
- [ ] 启用 ProGuard（Android）
- [ ] 启用 Bitcode（iOS）

**8. 新架构优化（React Native 0.74+）**

```javascript
// 启用新架构
// android/gradle.properties
newArchEnabled=true

// ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

新架构优势：
- Fabric：新的渲染系统
- TurboModules：懒加载 Native 模块
- JSI：直接调用 Native，无需 Bridge

✅ **检查点**：
- 优化方案明确可行
- 已评估实施成本
- 已预估性能提升

### 阶段 3：实施优化 (2-6 小时)

**目标**：增量实施优化措施

#### 批次 1：快速优化（1-2 小时）

**1. 启用 Hermes**：

```javascript
// android/app/build.gradle
project.ext.react = [
    enableHermes: true,
]

// iOS - Podfile
:hermes_enabled => true
```

重新编译并测试。

**2. 优化 FlatList 配置**：

```typescript
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemType={(item) => item.type} // 多类型优化
/>
```

**3. 图片优化**：

```bash
# 安装 fast-image
npm install react-native-fast-image
cd ios && pod install
```

替换所有 `Image` 为 `FastImage`。

**4. 启用内联 Requires**：

```javascript
// metro.config.js
inlineRequires: true
```

#### 批次 2：渲染优化（2-3 小时）

**1. 组件优化**：

```typescript
// 使用 memo 避免无用渲染
const ListItem = React.memo(({ item }) => {
  return <View>...</View>;
}, (prev, next) => prev.item.id === next.item.id);

// 优化回调
const handlePress = useCallback(() => {
  navigation.navigate('Details', { id });
}, [id, navigation]);
```

**2. 动画优化**：

```bash
# 安装 reanimated
npm install react-native-reanimated
cd ios && pod install
```

将 `Animated` 替换为 `react-native-reanimated`。

**3. 样式优化**：

```typescript
// 提取样式
const styles = StyleSheet.create({
  container: { flex: 1 },
  text: { fontSize: 16 },
});

// 避免内联样式
<View style={styles.container} />
```

#### 批次 3：深度优化（2-3 小时）

**1. 代码分割**：

```typescript
// 使用动态 import
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

**2. Native 模块优化**：

- 减少 Bridge 调用频率
- 批量传输数据
- 使用 TurboModules（新架构）

**3. 内存泄漏修复**：

使用 Flipper 的 Memory Profiler：
- 拍摄堆快照
- 对比前后差异
- 定位泄漏对象
- 修复引用

✅ **检查点（每批次后）**：
- 优化已实施
- 功能正常运行
- 性能有所提升

### 阶段 4：性能测试 (30-60 分钟)

**目标**：在真机上验证优化效果

#### 测试设备

- **iOS**：至少测试 iPhone X / iPhone 14
- **Android**：至少测试低端（2GB RAM）和中端设备

#### 测试方法

**1. 启动性能测试**：

```bash
# 使用 Flashlight（自动化性能测试）
npm install -g @perf-profiler/profiler
npx @perf-profiler/profiler measure --bundleId com.yourapp
```

**2. FPS 测试**：

```typescript
// 在开发菜单中启用 "Show Perf Monitor"
// 或使用 Flipper 的 Performance 插件
```

目标：
- 列表滚动：60 FPS
- 动画：60 FPS
- 页面切换：> 45 FPS

**3. 内存测试**：

使用 Xcode Instruments (iOS) 或 Android Studio Profiler：
- 测试应用使用一段时间后内存是否持续增长
- 检查是否有内存泄漏

**4. 性能对比**：

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 启动时间 | 3.5s | 2.0s | -43% |
| JS Bundle | 2.5MB | 1.8MB | -28% |
| FPS (列表) | 45 fps | 60 fps | +33% |
| 内存占用 | 180MB | 120MB | -33% |

✅ **检查点**：
- 性能指标达到目标
- 真机测试表现良好
- 无功能回归

### 阶段 5：监控与持续优化

**目标**：建立性能监控机制

#### 生产环境监控

**1. 集成性能监控 SDK**：

```bash
# Firebase Performance Monitoring
npm install @react-native-firebase/perf

# Sentry Performance
npm install @sentry/react-native
```

```typescript
// 监控关键路径
import perf from '@react-native-firebase/perf';

const trace = await perf().startTrace('screen_load');
// ... 加载逻辑
await trace.stop();
```

**2. 自定义性能指标**：

```typescript
import { performance } from '@shopify/react-native-performance';

// 监控页面加载
performance.mark('screen-mount');
performance.measure('screen-load-time', 'navigation-start', 'screen-mount');

// 上报到分析服务
const metrics = performance.getEntriesByType('measure');
analytics.track('performance', metrics);
```

#### CI/CD 集成

```yaml
# .github/workflows/performance.yml
name: Performance Check
on: [pull_request]
jobs:
  perf:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and test performance
        run: |
          npm run build:release
          # 运行性能测试脚本
          npm run perf:test
```

✅ **检查点**：
- 监控系统已部署
- 性能基线已建立
- 告警机制已配置

## 验收标准

- [ ] 启动时间 < 2s（生产模式，真机）
- [ ] 列表滚动 60 FPS
- [ ] 动画流畅无卡顿
- [ ] 内存占用 < 150MB（正常使用）
- [ ] 无内存泄漏
- [ ] 包体积符合预算
- [ ] iOS 和 Android 都验证

## React Native 特有注意事项

### 开发模式 vs 生产模式

⚠️ **关键差异**：
- 开发模式有大量调试代码，性能差 3-5 倍
- **必须在 Release 模式测试性能**

```bash
# iOS Release 模式
npx react-native run-ios --configuration Release

# Android Release 模式  
npx react-native run-android --variant=release
```

### 平台差异

**iOS 优化重点**：
- 使用 Hermes 可选（需测试兼容性）
- 关注内存管理（iOS 对内存更敏感）
- 动画性能通常更好

**Android 优化重点**：
- Hermes 必须启用
- 启动时间优化更重要
- 包体积控制更严格
- 低端设备兼容性

### 常见陷阱

1. **模拟器测试**：性能不准确，必须真机测试
2. **开发模式测试**：性能数据无参考价值
3. **console.log**：大量日志严重影响性能（生产环境移除）
4. **内联样式**：每次渲染创建新对象
5. **匿名函数**：每次渲染创建新引用

## 工具箱

### 性能分析工具
- **Flipper**: Meta 官方调试工具
- **React DevTools Profiler**: 组件性能分析
- **Reactotron**: 实时监控
- **@shopify/react-native-performance**: 性能打点
- **Flashlight**: 自动化性能测试

### 优化库
- **@shopify/flash-list**: 高性能列表
- **react-native-fast-image**: 图片优化
- **react-native-reanimated**: 原生动画
- **Hermes**: JavaScript 引擎

### 监控工具
- **Firebase Performance**: Google 性能监控
- **Sentry**: 错误和性能监控
- **Instabug**: 性能和崩溃监控

## 快捷指令

- **/rn-perf-audit**: 执行 React Native 性能审计
- **/rn-perf-analyze**: 分析当前性能瓶颈
- **/rn-perf-optimize [type]**: 特定类型优化（startup/render/memory）
- **/rn-perf-test**: 生成性能测试脚本

## 参考资源

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Hermes 引擎](https://hermesengine.dev/)
- [新架构文档](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Flipper 文档](https://fbflipper.com/)
