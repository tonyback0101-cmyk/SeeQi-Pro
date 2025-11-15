# 数据字典导入指南（阶段一）  

为保证首期分析链路的体质、节气、梦境文案与建议保持最新，请按以下流程维护数据字典。

## 目录结构

```
data/seed/
  ├── constitutions.csv      # 体质字典
  ├── solar_terms.csv        # 节气字典
  └── dream_keywords.csv     # 梦境关键字字典
scripts/
  └── import-data.ts         # 一键导入脚本（npm run import:seed）
supabase/migrations/
  ├── 20251112_extend_dict_tables.sql
  └── 20251112_analysis_storage.sql
```

## 内容维护

1. 使用 UTF-8 编码编辑三份 CSV，字段顺序需保持不变。  
2. 每行数据代表一个字典条目；`do_list` / `avoid_list` 可用 `;` 或 `|` 分隔多个条目。  
3. 体质、节气、梦境字段说明参考 PRD 表格。  

## 导入方式

### 方式 A：项目脚本

```bash
# 安装依赖
npm install

# 导入所有字典数据（使用 Supabase 管理员密钥）
npm run import:seed
```

脚本会自动解析 CSV，生成/更新：

- `dict_constitution`
- `dict_solar_term`
- `dream_keywords`

### 方式 B：Supabase CLI

如需直接从命令行导入，可使用官方 CLI：

```bash
supabase db import dict_constitution.csv --table dict_constitution
supabase db import dict_solar_term.csv --table dict_solar_term
supabase db import dream_keywords.csv --table dream_keywords
```

> 建议在生产前重新执行导入命令，或接入 Notion / Airtable API 实现动态同步。

## 数据验证

导入成功后，可在 Supabase SQL 控制台或本地脚本验证：

```ts
const constitutions = await db.from("dict_constitution").select("*");
const solar = await db.from("dict_solar_term").select("*");
const dreams = await db.from("dream_keywords").select("*");
```

若需回滚，重新导入 CSV 即可覆盖旧数据。

---

**完成效果（阶段一）**  
体质、节气、梦境字典与主分析 `/api/analyze`、结果 `/api/result/:id` 完整联动，可输出体质建议、节气提示、梦境解读等内容，为后续前端展示与支付解锁奠定数据底座。

