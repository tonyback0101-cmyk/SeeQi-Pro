#!/usr/bin/env tsx
/**
 * 验证 Supabase 规则存储配置
 * 用途：检查规则存储的配置是否正确
 * 运行：npm run verify:rules-storage
 */

import { createClient } from "@supabase/supabase-js";
import process from "node:process";

const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RULES_BUCKET",
  "RULES_BUCKET_PREFIX",
] as const;

interface CheckResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
}

async function checkEnvVars(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (value) {
      results.push({
        name: `环境变量 ${varName}`,
        status: "✅",
        message: "已配置",
      });
    } else {
      results.push({
        name: `环境变量 ${varName}`,
        status: "❌",
        message: "未配置",
      });
    }
  }
  
  return results;
}

async function checkSupabaseConnection(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return {
      name: "Supabase 连接",
      status: "❌",
      message: "缺少必要的环境变量",
    };
  }
  
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    
    // 测试连接：获取项目信息
    const { data, error } = await client.from("_realtime").select("id").limit(1);
    
    if (error && error.code !== "PGRST116") {
      // PGRST116 是正常的（表不存在），其他错误才是问题
      return {
        name: "Supabase 连接",
        status: "❌",
        message: `连接失败: ${error.message}`,
      };
    }
    
    return {
      name: "Supabase 连接",
      status: "✅",
      message: "连接成功",
    };
  } catch (error) {
    return {
      name: "Supabase 连接",
      status: "❌",
      message: `连接异常: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkBucketExists(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.RULES_BUCKET ?? "rules";
  
  if (!url || !key) {
    return {
      name: "Bucket 存在性",
      status: "❌",
      message: "缺少必要的环境变量",
    };
  }
  
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    
    const { data, error } = await client.storage.listBuckets();
    
    if (error) {
      return {
        name: "Bucket 存在性",
        status: "❌",
        message: `查询失败: ${error.message}`,
      };
    }
    
    const bucketExists = data?.some((b) => b.name === bucket);
    
    if (bucketExists) {
      return {
        name: "Bucket 存在性",
        status: "✅",
        message: `Bucket "${bucket}" 存在`,
      };
    } else {
      return {
        name: "Bucket 存在性",
        status: "❌",
        message: `Bucket "${bucket}" 不存在，请在 Dashboard 中创建`,
      };
    }
  } catch (error) {
    return {
      name: "Bucket 存在性",
      status: "❌",
      message: `查询异常: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkBucketAccess(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.RULES_BUCKET ?? "rules";
  const prefix = process.env.RULES_BUCKET_PREFIX ?? "rules";
  
  if (!url || !key) {
    return {
      name: "Bucket 访问权限",
      status: "❌",
      message: "缺少必要的环境变量",
    };
  }
  
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1 });
    
    if (error) {
      return {
        name: "Bucket 访问权限",
        status: "❌",
        message: `访问失败: ${error.message}。请检查 RLS 策略配置`,
      };
    }
    
    return {
      name: "Bucket 访问权限",
      status: "✅",
      message: "可以访问 bucket",
    };
  } catch (error) {
    return {
      name: "Bucket 访问权限",
      status: "❌",
      message: `访问异常: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkRuleFiles(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.RULES_BUCKET ?? "rules";
  const prefix = process.env.RULES_BUCKET_PREFIX ?? "rules";
  
  if (!url || !key) {
    return {
      name: "规则文件",
      status: "❌",
      message: "缺少必要的环境变量",
    };
  }
  
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 100 });
    
    if (error) {
      return {
        name: "规则文件",
        status: "❌",
        message: `查询失败: ${error.message}`,
      };
    }
    
    if (!data || data.length === 0) {
      return {
        name: "规则文件",
        status: "⚠️",
        message: "Bucket 中没有规则文件，请运行 `npm run rules:upload` 上传",
      };
    }
    
    const jsonlFiles = data.filter((file) => file.name?.endsWith(".jsonl"));
    
    if (jsonlFiles.length === 0) {
      return {
        name: "规则文件",
        status: "⚠️",
        message: "Bucket 中没有 .jsonl 文件",
      };
    }
    
    return {
      name: "规则文件",
      status: "✅",
      message: `找到 ${jsonlFiles.length} 个规则文件: ${jsonlFiles.map((f) => f.name).join(", ")}`,
    };
  } catch (error) {
    return {
      name: "规则文件",
      status: "❌",
      message: `查询异常: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function main() {
  console.log("🔍 开始验证 Supabase 规则存储配置...\n");
  
  const results: CheckResult[] = [];
  
  // 检查环境变量
  results.push(...(await checkEnvVars()));
  results.push({ name: "", status: "✅", message: "" }); // 分隔线
  
  // 检查 Supabase 连接
  results.push(await checkSupabaseConnection());
  
  // 检查 Bucket 存在性
  results.push(await checkBucketExists());
  
  // 检查 Bucket 访问权限
  results.push(await checkBucketAccess());
  
  // 检查规则文件
  results.push(await checkRuleFiles());
  
  // 输出结果
  console.log("📊 验证结果：\n");
  results.forEach((result) => {
    if (result.name === "") {
      console.log("");
      return;
    }
    console.log(`${result.status} ${result.name}: ${result.message}`);
  });
  
  // 统计
  const success = results.filter((r) => r.status === "✅").length;
  const warning = results.filter((r) => r.status === "⚠️").length;
  const error = results.filter((r) => r.status === "❌").length;
  
  console.log("\n📈 统计：");
  console.log(`  ✅ 通过: ${success}`);
  console.log(`  ⚠️  警告: ${warning}`);
  console.log(`  ❌ 失败: ${error}`);
  
  if (error > 0) {
    console.log("\n❌ 验证失败，请根据上述错误信息修复配置");
    process.exitCode = 1;
  } else if (warning > 0) {
    console.log("\n⚠️  验证通过，但有警告，建议检查配置");
  } else {
    console.log("\n✅ 所有检查通过！");
  }
}

main().catch((error) => {
  console.error("❌ 验证过程出错:", error);
  process.exitCode = 1;
});


