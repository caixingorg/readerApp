# 🛠️ 开发者工具箱 (DevKit) & 构建指南

## 1. 概述
**DevKit** 是一个集成在 ReaderApp 中的隐藏式、生产环境安全的调试模块。它允许开发者和 QA 人员检查网络流量、切换 API 环境和重置应用数据，而无需依赖 Debug 包或 USB 连接。

---

## 2. 如何进入
- **触发方式**：进入 **“设置”** 页面，**连续点击版本号 5 次**。
- **Debug 包**：为了方便，“设置”页面中也会直接显示一个 “Dev Menu” 按钮。

---

## 3. 核心功能

### 🌍 环境切换器 (Environment Switcher)
*   **用途**：在 API 环境（Dev, Staging, Prod）之间切换，或输入自定义 URL。
*   **持久化**：选择结果通过 `devStore` 持久化存储在 `AsyncStorage` 中。重启应用后依然有效。
*   **UI**：位于开发菜单顶部。

### 📡 网络抓包 (Network Logger)
*   **用途**：在 App 内检查实时的 HTTP 请求和响应。
*   **底层库**：基于 `react-native-network-logger`。
*   **用法**：点击 “View Logs” 打开全屏日志视图。

### 🧹 数据擦除 (Data Wiper)
*   **用途**：彻底清除所有应用数据，模拟全新安装。
*   **操作**：
    *   清除所有 `AsyncStorage` 键值。
    *   删除本地数据库 (已预留接口)。
    *   清除文档目录 (已预留接口)。
    *   **重启应用**：使用 `expo-updates` 立即重载应用包。

### 📱 设备信息 (Device Info)
*   **用途**：快速查看设备型号、系统版本、屏幕密度和安全区域边距。
*   **操作**：点击任意行即可将内容复制到剪贴板。

---

## 4. 架构设计

### 文件结构
该功能作为一个独立模块包含在 `src/features/dev` 中：
```
src/features/dev/
├── components/
│   ├── DevKit.tsx          # 主入口组件 (全局挂载)
│   ├── DevMenuModal.tsx    # 底部弹窗 UI (Bottom Sheet)
│   ├── EnvSwitcher.tsx     # 环境切换组件
│   ├── NetworkView.tsx     # 网络日志组件
│   ├── DataWiper.tsx       # 数据擦除组件
│   └── DeviceInfo.tsx      # 设备信息组件
├── config/
│   └── types.ts            # 类型定义 (环境配置等)
├── stores/
│   └── devStore.ts         # Zustand 状态管理 (持久化)
└── index.ts                # 公共 API
```

### 集成方式
DevKit 在 `App.tsx` 中全局挂载，位于导航容器之外，以确覆盖在所有层级之上：

```tsx
// App.tsx
import { DevKit } from '@/features/dev';

export default function App() {
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
      <DevKit /> {/* 全局挂载 */}
    </GestureHandlerRootView>
  );
}
```

---

## 5. 关键原生修复与构建补丁

在实现过程中，我们解决了几个原生模块的问题。**请勿删除以下配置。**

### A. Wi-Fi 传书服务架构
*   **旧方案**：曾使用 `react-native-http-bridge`，但因维护停止导致构建失败。
*   **新方案 (当前)**：使用 `react-native-tcp-socket` 配合纯 Typescript 实现了一个轻量级 HTTP 服务器 (`src/utils/SimpleHttpServer.ts`)。
*   **优势**：
    1.  **零 Patch**：移除了所有针对旧依赖的 Patch文件。
    2.  **标准协议**：基于 React Native 社区标准的 TCP 库，长期维护性好。
    3.  **可控性**：HTTP 解析逻辑在 TS 层，不再依赖黑盒原生代码。

### B. `expo-updates` 懒加载
*   **问题**：如果原生模块没有完全链接或重建，直接引用 `expo-updates`（例如 `import * as Updates from 'expo-updates'`）会导致开发客户端在运行时崩溃。
*   **方案**：我们只在真正需要执行重启操作时（在 Data Wiper 函数内部）才懒加载该模块。
*   **代码示例**：
    ```typescript
    // Inside DataWiper.tsx
    const Updates = require('expo-updates'); // Lazy require
    await Updates.reloadAsync();
    ```

### C. `react-native-gesture-handler`
*   **要求**：必须作为 `App.tsx` 中的 **第一个 import**，以确保正确处理手势交互并避免 Android 上的崩溃问题。

---

## 6. 添加新插件
要向 DevKit 添加新工具：
1.  在 `src/features/dev/components/` 中创建一个组件。
2.  将其添加到 `DevMenuModal.tsx`。
3.  如果需要状态管理，将其添加到 `devStore.ts`。
