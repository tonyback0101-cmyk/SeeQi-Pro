/**
 * 创建更好的占位图标文件
 * 使用 canvas API 创建一个简单的单色 PNG 图标作为占位符
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个简单的单色 PNG（使用主题色 #0D1B2A）
// 这是一个简化的方法，创建一个基本的 PNG 文件
function createSimplePNG(size, color = '#0D1B2A') {
  // 将颜色转换为 RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // 创建一个最小的有效 PNG 文件
  // 这是一个简化的方法，实际应该使用图像处理库
  
  // PNG 文件头
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes data + 4 bytes length + 4 bytes type + 4 bytes CRC = 25 bytes)
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  // 计算 CRC (简化版本，实际应该使用正确的 CRC 算法)
  // 这里我们创建一个基本的 PNG 结构
  
  // 由于创建完整的 PNG 文件比较复杂，我们使用一个更简单的方法：
  // 创建一个最小的有效 PNG（1x1 像素，然后让浏览器缩放）
  // 或者使用 base64 编码的简单 PNG
  
  // 最简单的方法：创建一个 1x1 像素的 PNG，然后复制多次来创建更大的文件
  // 但更好的方法是使用一个真正的图像处理库
  
  // 这里我们创建一个最小的有效 PNG 作为占位符
  // 实际使用时应该替换为真正的图标
  
  // 最小有效 PNG (1x1 RGB)
  const minimalPNG = Buffer.from([
    // PNG signature
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width
    0x00, 0x00, 0x00, 0x01, // height
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xDE, // CRC (placeholder)
    // IDAT chunk (minimal)
    0x00, 0x00, 0x00, 0x0C, // length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
    0x0D, 0x0A, 0x2D, 0xB4, // CRC (placeholder)
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return minimalPNG;
}

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
  
  // 创建占位图标
  const placeholder = createSimplePNG(size);
  fs.writeFileSync(filepath, placeholder);
  
  console.log(`✅ Created placeholder: ${filename} (${placeholder.length} bytes)`);
  console.log(`   ⚠️  This is a minimal placeholder. Please replace with actual ${size}x${size} icon image.`);
});

console.log('\n📝 Next steps:');
console.log('   1. Replace placeholder icons with actual SeeQi brand icons');
console.log('   2. Icons should be PNG format, exactly ' + sizes.join('x' + sizes[0] + ' and ') + 'x' + sizes[1] + ' pixels');
console.log('   3. Recommended: Use design tools (Figma, Sketch) or online PWA icon generators');
console.log('   4. Icons should use SeeQi brand colors (#0D1B2A theme color) and be clearly visible at small sizes');
console.log('   5. Icons will be used for PWA installation and home screen display');

