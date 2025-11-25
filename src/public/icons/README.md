# PWA Icons

## 图标文件状态

✅ **当前状态**:
- `icon-192.png` - 192x192 像素的 PNG 图标（已替换为品牌图标）
- `icon-512.png` - 512x512 像素的 PNG 图标（已替换为品牌图标）

## 图标要求

- **格式**: PNG
- **尺寸**: 
  - icon-192.png: 192x192 像素
  - icon-512.png: 512x512 像素
- **用途**: PWA 安装图标和主屏幕图标
- **设计建议**: 
  - 使用 SeeQi 品牌标识
  - 背景透明或使用主题色 (#0D1B2A)
  - 图标应该清晰可见，适合小尺寸显示

## 临时解决方案

如果暂时没有图标文件，可以使用占位图标或从现有资源生成。

## 生成图标的方法

### 方法 1: 使用设计工具
- 使用 Figma、Sketch、Adobe Illustrator 等设计工具
- 创建 192x192 和 512x512 像素的图标
- 导出为 PNG 格式

### 方法 2: 使用在线工具
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### 方法 3: 从现有 Logo 生成
- 如果有 SeeQi 的 logo 文件，可以使用图像编辑软件缩放
- 确保图标在小尺寸下仍然清晰可见
- 建议使用矢量图形（SVG）转换为 PNG

## 替换占位图标

1. 准备图标文件：
   - `icon-192.png` (192x192 像素) ✅ 已完成
   - `icon-512.png` (512x512 像素) ✅ 已完成

2. 替换 `public/icons/` 目录下的现有文件

3. 验证图标：
   - 访问 `/icons/icon-192.png` 和 `/icons/icon-512.png`
   - 确认文件可以正常加载
   - 测试 PWA 安装功能

