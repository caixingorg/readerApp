# 🎯 模拟器+真机兼容性测试指南

## ✅ 最新修复说明

已恢复并优化配置，确保**模拟器和真机都能正常工作**。

### 关键修改点

1. **`copyToCacheDirectory: false`** - 对模拟器和真机兼容性最好
2. **智能文件复制** - 主方法失败时自动尝试备用方案
3. **源文件检查** - 复制前验证文件是否存在
4. **详细日志** - 便于定位不同环境的问题

---

## 📱 快速测试步骤

### iOS 模拟器测试

```bash
# 1. 准备测试文件
echo "这是测试内容" > ~/Desktop/test.txt

# 2. 启动应用
npm run ios

# 3. 将文件拖拽到模拟器窗口（会自动保存到 Files app）

# 4. 在 Reader App 中：
#    - 点击"导入"
#    - 在文件选择器中点击"浏览"或"Browse"
#    - 选择 "On My iPhone" > test.txt
#    - ✅ 应该成功导入
```

### iOS 真机测试

```bash
# 1. 连接 iPhone 到 Mac

# 2. 启动应用到真机
npm run ios -- --device "你的iPhone名称"

# 3. 在 iPhone 上：
#    - 通过 AirDrop、iCloud、或其他方式添加文件到 Files app
#    - 打开 Reader App
#    - 点击"导入"
#    - 选择任意位置的文件（iCloud、本地、Dropbox 等）
#    - ✅ 应该成功导入
```

### Android 模拟器测试

```bash
# 1. 准备并推送测试文件
echo "测试内容" > test.txt
adb push test.txt /sdcard/Download/

# 2. 启动应用
npm run android

# 3. 在 Reader App 中：
#    - 点击"导入"
#    - 选择 Downloads 文件夹
#    - 选择 test.txt
#    - ✅ 应该成功导入
```

### Android 真机测试

```bash
# 1. 启用 USB 调试，连接设备

# 2. 启动应用
npm run android

# 3. 在手机上：
#    - 使用任何方式下载或添加文件
#    - 打开 Reader App
#    - 点击"导入"
#    - 从文件管理器选择文件
#    - ✅ 应该成功导入
```

---

## 🔍 验证检查清单

### 基础功能
- [ ] 可以打开文件选择器
- [ ] 可以看到文件列表
- [ ] 可以选择 .txt 文件
- [ ] 可以选择 .epub 文件
- [ ] 文件成功导入到书库
- [ ] 导入后可以打开阅读

### 边界情况
- [ ] 取消选择不会报错
- [ ] 大文件（10MB+）可以导入
- [ ] 中文文件名可以处理
- [ ] 特殊字符文件名可以处理
- [ ] 不支持的格式显示友好错误

### 平台测试
- [ ] iOS 模拟器
- [ ] iOS 真机
- [ ] Android 模拟器  
- [ ] Android 真机

---

## 📊 查看调试日志

如果遇到问题，查看详细日志：

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### 关键日志输出

成功的导入流程应该显示：

```
[Library] Starting import process...
[Library] Opening DocumentPicker...
[Library] DocumentPicker config: {...}
[Library] DocumentPicker result: {"canceled":false,"assets":[...]}
[Library] Selected file details: {name: "test.txt", ...}
[Library] File type identified: txt
[Library] Copying file from: file://...
[Library] Copying file to: file://...
[Library] Source file info: {exists: true, ...}
[Library] File copy successful
[Library] Saving to DB: {...}
[Library] Import Complete
```

### 常见错误日志

**如果看到:**
```
[Library] Copy error: ...
[Library] Trying alternative copy method...
[Library] Alternative copy successful
```
**说明:** 主复制方法失败，但备用方法成功 ✅

**如果看到:**
```
[Library] Source file info: {exists: false}
源文件不存在或无法访问
```
**说明:** 文件 URI 无效，可能是模拟器文件未正确添加 ❌

---

## 🐛 问题排查

### 问题 1: 模拟器看不到文件

**iOS 模拟器:**
- 确认文件已拖拽到模拟器
- 打开 Files app，检查 "On My iPhone" 中是否有文件
- 在文件选择器中点击 "Browse" 而不是最近文件

**Android 模拟器:**
- 确认使用 `adb push` 推送成功
- 检查推送路径：`/sdcard/Download/` 或 `/sdcard/Documents/`
- 在文件选择器中选择正确的文件夹

### 问题 2: 真机无法导入

**检查项:**
1. 文件确实存在于可访问位置
2. 应用有文件访问权限
3. 查看控制台错误日志
4. 尝试不同的文件源（本地 vs 云端）

### 问题 3: 选择器打开后卡死

**可能原因:**
- 文件类型配置过于严格
- 超时或内存问题

**解决:**
- 重启应用和模拟器
- 查看日志中的错误信息
- 尝试更小的文件

---

## 💡 开发提示

### 推荐工作流

1. **日常开发**: 使用模拟器 + 预先添加的测试文件
2. **功能测试**: 使用真机测试完整流程
3. **发布前**: 在多个设备上全面测试

### 测试文件准备

创建不同类型的测试文件：

```bash
# 小文本文件
echo "简单测试" > small.txt

# 中文文件名
echo "测试内容" > "中文书名.txt"

# 特殊字符文件名
echo "测试" > "测试(版本1.0)[新].txt"

# 较大文件
head -c 10M /dev/random > large.txt
```

### 性能监控

观察不同文件大小的导入时间：
- < 1MB: 应该 < 1 秒
- 1-10MB: 应该 < 3 秒
- 10-50MB: 应该 < 10 秒
- > 50MB: 可能需要优化或显示进度

---

## ✨ 预期结果

✅ **模拟器**: 可以导入预先添加的文件  
✅ **真机**: 可以从任意位置导入文件  
✅ **跨平台**: iOS 和 Android 表现一致  
✅ **错误处理**: 失败时显示清晰的错误信息  

现在配置已优化为同时支持模拟器和真机！🎉
