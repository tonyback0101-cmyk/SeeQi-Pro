# CSV 文件导入指南

## 问题诊断

如果 Supabase 显示第一列为中文音译（如"启旭"、"杨旭"）而不是英文 code（如"qixu"、"yangxu"），可能是以下原因：

1. **上传了错误的文件** - 可能使用了旧版本的 CSV
2. **编码问题** - CSV 文件编码不正确
3. **列名识别问题** - Supabase 可能错误识别了列名

## 解决方案

### 1. 使用正确的文件

**推荐使用**：`dict_constitution_simple.csv`

这个文件包含：
- ✅ 正确的列名：`code`, `name_zh`, `name_en`, `desc_zh`, `desc_en`
- ✅ 正确的英文 code 值：`pinghe`, `qixu`, `yangxu` 等
- ✅ UTF-8 编码

### 2. 导入步骤

1. **删除旧文件**：
   - 在 Supabase 导入界面，点击"删除文件"
   - 确保没有残留的旧文件

2. **上传新文件**：
   - 点击"上传 CSV"
   - 选择 `dict_constitution_simple.csv`
   - 文件位置：`C:\Users\cherr\Desktop\dict_constitution_simple.csv`

3. **检查预览**：
   - 第一列应该显示为 `code`（不是"法典"）
   - 第一列的值应该是英文：`pinghe`, `qixu`, `yangxu` 等
   - 如果显示为中文音译，说明文件有问题

4. **如果仍有问题**：
   - 尝试使用 `dict_constitution_basic.csv`
   - 或者手动检查文件内容

### 3. 验证文件内容

在导入前，可以用文本编辑器打开 `dict_constitution_simple.csv`，确认：
- 第一行是列名：`code,name_zh,name_en,desc_zh,desc_en`
- 第二行第一列是：`pinghe`（不是"平河"或其他中文）

### 4. 文件位置

所有 CSV 文件都在：`C:\Users\cherr\Desktop\`

- `dict_constitution_simple.csv` - **推荐使用**（简化版本，仅必需列）
- `dict_constitution_basic.csv` - 基础版本（备用）
- `dict_constitution.csv` - 完整版本（包含扩展列，需要先运行扩展迁移）

## 常见问题

### Q: 为什么显示"数据不兼容"？

A: 可能的原因：
1. CSV 文件的列名与数据库表结构不匹配
2. CSV 文件包含数据库表中不存在的列
3. 数据类型不匹配

**解决方法**：使用 `dict_constitution_simple.csv`，它只包含基础必需列。

### Q: 第一列显示为"法典"而不是"code"？

A: 这可能是 Supabase 的列名识别问题。确保：
1. CSV 文件第一行是英文列名：`code,name_zh,name_en,desc_zh,desc_en`
2. 没有 BOM（字节顺序标记）
3. 使用 UTF-8 编码

### Q: 第一列的值显示为中文音译？

A: 说明上传了错误的文件或文件被错误解析。请：
1. 删除当前文件
2. 重新上传 `dict_constitution_simple.csv`
3. 检查预览是否正确

## 数据库表结构

`dict_constitution` 表需要的列：
- `code` (text, primary key) - **必需**
- `name_zh` (text, not null) - **必需**
- `name_en` (text, not null) - **必需**
- `desc_zh` (text, not null) - **必需**
- `desc_en` (text, not null) - **必需**
- `created_at` (timestamptz) - 自动生成，不需要在 CSV 中

可选列（需要先运行扩展迁移）：
- `feature` (text)
- `advice_diet` (text)
- `advice_activity` (text)
- `advice_acupoint` (text)





