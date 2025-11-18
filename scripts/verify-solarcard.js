// 验证 SolarCard.tsx 代码是否正确
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/SolarCard.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

console.log('=== SolarCard.tsx 验证 ===\n');

// 检查1: 是否有硬编码常量
const hasModernYi = content.includes('MODERN_YI_ACTIONS = ["签约合作", "学习进修", "整理空间"]');
const hasModernJi = content.includes('MODERN_JI_ACTIONS = ["动土破土", "远距离搬迁"]');
console.log('1. 硬编码常量定义:');
console.log('   MODERN_YI_ACTIONS:', hasModernYi ? '✅' : '❌');
console.log('   MODERN_JI_ACTIONS:', hasModernJi ? '✅' : '❌');

// 检查2: 是否使用硬编码常量
const usesModernYi = content.includes('const goodList = MODERN_YI_ACTIONS');
const usesModernJi = content.includes('const badList = MODERN_JI_ACTIONS');
console.log('\n2. 使用硬编码常量:');
console.log('   goodList = MODERN_YI_ACTIONS:', usesModernYi ? '✅' : '❌');
console.log('   badList = MODERN_JI_ACTIONS:', usesModernJi ? '✅' : '❌');

// 检查3: 是否没有使用黄历数据渲染主列表
const noYiSlice = !content.includes('yi.slice(0, 3)') || content.indexOf('yi.slice(0, 3)') > content.indexOf('const goodList = MODERN_YI_ACTIONS');
const noJiSlice = !content.includes('ji.slice(0, 2)') || content.indexOf('ji.slice(0, 2)') > content.indexOf('const badList = MODERN_JI_ACTIONS');
console.log('\n3. 不使用黄历数据渲染主列表:');
console.log('   没有 yi.slice():', noYiSlice ? '✅' : '❌');
console.log('   没有 ji.slice():', noJiSlice ? '✅' : '❌');

// 检查4: 是否没有旧版元素
const noDetails = !content.includes('<details>');
const noOldText = !content.includes('查看完整版黄历') && !content.includes('查看完整黄历');
console.log('\n4. 没有旧版元素:');
console.log('   没有 <details>:', noDetails ? '✅' : '❌');
console.log('   没有旧版文本:', noOldText ? '✅' : '❌');

// 检查5: 是否使用 styled-jsx
const usesStyledJsx = content.includes('<style jsx>');
console.log('\n5. 使用 styled-jsx:');
console.log('   有 <style jsx>:', usesStyledJsx ? '✅' : '❌');

const allPassed = hasModernYi && hasModernJi && usesModernYi && usesModernJi && noDetails && noOldText && usesStyledJsx;
console.log('\n=== 验证结果 ===');
console.log(allPassed ? '✅ 所有检查通过' : '❌ 存在问题');

process.exit(allPassed ? 0 : 1);

