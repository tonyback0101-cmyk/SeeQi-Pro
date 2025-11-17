# 环境变量配置清单

## 必需的环境变量（生产环境）

### Supabase 配置
- ✅ `ENABLE_SUPABASE_ANALYZE` - 已设置：`true`
- `SUPABASE_URL` 或 `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key（服务器端使用）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key（客户端使用）
- `SUPABASE_ANALYSIS_BUCKET` - 存储桶名称（可选，默认：`analysis-temp`）

### NextAuth 配置
- `NEXTAUTH_SECRET` - NextAuth 加密密钥
- `NEXT_PUBLIC_APP_URL` 或 `APP_URL` - 应用 URL（如：`https://seeqipro.vercel.app`）

### Stripe 支付配置（如果启用支付功能）
- `STRIPE_SECRET_KEY` - Stripe 密钥
- `STRIPE_WEBHOOK_SECRET` - Stripe Webhook 密钥
- `STRIPE_FULL_REPORT_PRICE_ID` - 完整报告价格 ID
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe 公钥（客户端使用）

### Google OAuth 配置（可选）
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

## 存储桶配置检查

根据你的 Supabase Storage，以下存储桶已存在：
- ✅ `palmprints` - 用于掌纹图片
- ✅ `analysis-temp` - 用于分析临时文件（默认）
- ⚠️ `SUPABASE_ANALYSIS_BUCKET` - 这个名称看起来像是环境变量名，不是存储桶名
- ✅ `rules` - 用于规则文件

**建议：**
- 如果设置了 `SUPABASE_ANALYSIS_BUCKET` 环境变量，确保它的值是 `analysis-temp`（不是 `SUPABASE_ANALYSIS_BUCKET`）
- 或者不设置这个环境变量，使用默认值 `analysis-temp`

## 验证步骤

1. 检查所有必需的环境变量是否已设置
2. 确保存储桶名称正确（`analysis-temp`）
3. 确保 Supabase Service Role Key 有足够的权限访问存储桶
4. 检查 RLS 策略是否正确配置

