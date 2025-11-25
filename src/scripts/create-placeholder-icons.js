/**
 * 创建占位图标文件的脚本
 * 使用 Node.js 创建一个简单的单色 PNG 图标作为占位符
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个最小的有效 PNG 文件（1x1 像素，透明）
// 这是一个最小的有效 PNG 文件的 base64 编码
// 实际使用时应该替换为真正的图标

// 192x192 像素的占位 PNG（最小有效 PNG）
// 这是一个简单的单色 PNG，背景色为 #0D1B2A（主题色）
const createPlaceholderPNG = (size) => {
  // 这是一个最小的有效 PNG 文件结构
  // PNG 文件头 + IHDR + IDAT + IEND
  // 为了简化，我们创建一个简单的单色图像
  
  // 注意：这是一个非常简化的方法
  // 实际应该使用图像处理库如 sharp 或 canvas
  
  // 最小有效 PNG (1x1 透明像素) 的字节
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  
  return minimalPNG;
};

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 创建占位图标
const sizes = [192, 512];
sizes.forEach(size => {
  const filename = `icon-${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // 创建占位图标（最小有效 PNG）
  const placeholder = createPlaceholderPNG(size);
  fs.writeFileSync(filepath, placeholder);
  
  console.log(`✅ Created placeholder: ${filename}`);
  console.log(`   ⚠️  This is a minimal placeholder. Please replace with actual icon image.`);
});

console.log('\n📝 Next steps:');
console.log('   1. Replace placeholder icons with actual SeeQi brand icons');
console.log('   2. Icons should be PNG format');
console.log('   3. Recommended: Use design tools (Figma, Sketch) or online PWA icon generators');
console.log('   4. Icons should use SeeQi brand colors and be clearly visible at small sizes');

