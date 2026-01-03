# 文件导入卡死问题修复说明

## 📋 问题描述
在使用 expo-document-picker 导入 epub/txt 文件时，应用会卡死无法选中文件。

## 🔧 修复内容

### 1. 平台特定配置
- **iOS**: 使用正确的 UTI 类型 (`public.text`, `org.idpf.epub-container`)
- **Android**: 使用 MIME 类型 (`text/plain`, `application/epub+zip`)
- 确保跨平台兼容性

### 2. 文件缓存策略
- 将 `copyToCacheDirectory` 从 `false` 改为 `true`
- 这样可以确保文件在应用沙盒中可访问，避免权限问题

### 3. 超时保护
- 添加 60 秒超时机制
- 防止文件选择器无限期挂起

### 4. 错误处理优化
- 文件格式验证
- 文件复制错误捕获
- 用户友好的错误提示

### 5. 文件名清理改进
- 保留点号(.)、下划线(_)和中划线(-)
- 只替换真正有问题的特殊字符

## 🧪 测试步骤

### 测试 1: 基本导入
1. 启动应用
2. 进入书库页面
3. 点击"导入"按钮
4. 选择一个 .txt 或 .epub 文件
5. ✅ 确认文件成功导入且显示在列表中

### 测试 2: 取消导入
1. 点击"导入"按钮
2. 在文件选择器中点击"取消"
3. ✅ 确认应用正常返回，没有错误提示

### 测试 3: 特殊文件名
1. 准备一个包含中文、空格、特殊字符的文件名，如: `测试 书籍 (v1.0).txt`
2. 尝试导入
3. ✅ 确认文件正常导入（文件名会被清理但不影响导入）

### 测试 4: 大文件
1. 准备一个较大的 epub 文件 (10MB+)
2. 导入文件
3. ✅ 确认显示 Loading 状态，且最终成功导入

### 测试 5: 不支持的格式
1. 尝试导入 .pdf 或其他格式
2. ✅ 确认显示友好的错误提示

## 📱 平台测试清单

### iOS
- [ ] 模拟器测试
- [ ] 真机测试 (推荐)
- [ ] 不同 iOS 版本 (15+, 16+, 17+)

### Android
- [ ] 模拟器测试
- [ ] 真机测试 (推荐)
- [ ] 不同 Android 版本 (10+, 11+, 12+)

## 🐛 如果问题仍然存在

### 检查项
1. **确认 expo-document-picker 版本**
   ```bash
   npm list expo-document-picker
   ```
   当前项目使用: `~14.0.8`

2. **检查权限配置**
   - iOS: 检查 `Info.plist` 是否包含文件访问权限
   - Android: 检查 `AndroidManifest.xml` 存储权限

3. **清理缓存重新构建**
   ```bash
   rm -rf node_modules
   npm install
   npm run ios  # 或 npm run android
   ```

4. **查看日志输出**
   - 所有导入步骤都有详细的 console.log
   - 使用 `npx react-native log-ios` 或 `npx react-native log-android` 查看完整日志

## 🔍 调试模式

如果需要更详细的调试信息，可以临时在代码中添加：

```typescript
// 在 handleImport 函数开始处
console.log('[DEBUG] Platform:', Platform.OS);
console.log('[DEBUG] FileSystem.documentDirectory:', FileSystem.documentDirectory);
```

## ⚡ 性能优化建议

1. **大文件处理**: 对于超大文件(100MB+)，考虑添加进度提示
2. **批量导入**: 当前只支持单文件，未来可扩展多文件选择
3. **后台处理**: 考虑使用后台任务处理大文件解析

## 📞 获取帮助

如果以上方法都无法解决问题，请提供：
1. 设备信息 (型号、系统版本)
2. 完整的错误日志
3. 尝试导入的文件类型和大小
4. 问题重现步骤
