# 📱 真机调试指南 (iOS Real Device Debugging)

由于我们修改了原生配置 (iCloud Entitlements)，为了最准确地测试导入功能，建议使用 **开发构建 (Development Build)** 安装到真机上，而不是使用 Expo Go。

## 前置条件
1.  **Mac 电脑**（您正在使用）。
2.  **iPhone 手机**。
3.  **数据线** 连接。
4.  **Apple ID** (无需付费开发者账号，免费账号即可调试，但有效期仅7天，过期需重新安装)。

## 步骤 Step-by-Step

### 1. 连接设备
*   使用数据线将 iPhone 连接到 Mac。
*   解锁 iPhone，如果在手机上弹出 "要信任此电脑吗？" (Trust This Computer)，点击 **信任 (Trust)** 并输入密码。

### 2. 准备签名 (Xcode)
*   为了把 App 装到真机，Apple 要求应用必须经过签名。
*   在终端执行以下命令打开 Xcode 项目：
    ```bash
    xed ios
    ```
*   Xcode 打开后：
    1.  在左侧导航栏点击蓝色的根节点 **ReaderApp**。
    2.  在右侧主视图选择 **Signing & Capabilities** 选项卡。
    3.  找到 **Team** 下拉框。
    4.  如果里面是空的，点击 **Add an Account...**，登录您的 Apple ID。
    5.  登录后，在 Team 下拉框中选择您的 **Personal Team** (例如 `Your Name (Personal Team)`).
    6.  确保 `Bundle Identifier` (例如 `com.anonymous.ReaderApp`) 是唯一的。如果 Xcode 报错说 ID 被占用，请手动修改它，例如改成 `com.yourname.readerapp`。
    7.  等待下方的 `Signing Certificate` 显示正常 (没有红色错误)。

### 3. 运行安装
*   回到 VS Code 终端，执行：
    ```bash
    npx expo run:ios --device
    ```
*   终端会列出检测到的设备，用键盘上下键选择您的 iPhone，回车确认。
*   App 会开始编译并安装到手机上。

### 4. 信任开发者 (首次运行必须)
*   App 安装成功后，点击图标可能会弹窗提示 "Untrusted Developer" (不受信任的开发者)。
*   **解决方法**：
    *   打开 iPhone **设置 (Settings)** -> **通用 (General)** -> **VPN与设备管理 (VPN & Device Management)** (iOS 16+ 可能是 “设备管理”)。
    *   在 "开发者 APP" 下点击您的 Apple ID。
    *   点击 **信任 (Trust)**。

### 5. 摇一摇调试
*   现在您可以打开 App 了。
*   **摇晃手机** (Shake) 可以呼出开发菜单 (Reload, Debug Remote JS 等)。
*   点击“书库” -> “导入”进行测试。

---

## 常见问题 (Troubleshooting)

*   **Error: No device found**
    *   确保手机已解锁并信任电脑。
    *   尝试拔插数据线。
    *   运行 `xcrun xctrace list devices` 查看系统是否识别到了手机。
*   **Signing Error**
    *   回到 Xcode，检查 **Signing & Capabilities** 里的报错信息。通常是 Bundle ID 重复（改个名就行）或 Team 未选择。
