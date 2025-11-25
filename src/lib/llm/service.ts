import type { PalmArchetype } from "@/lib/analysis/palmRulesV2";
import { buildPalmArchetype } from "@/lib/analysis/palmRulesV2";
import type { PalmFeatureSummary, PalmLineSummary } from "@/lib/analysis/palmFeatures";
import type { PalmLineSummaryExtended } from "@/lib/analysis/palmRulesV2";
import type { TongueFeatureSummary } from "@/lib/analysis/tongueFeatures";
import type { TongueStateTags, TongueFeatures } from "@/lib/analysis/tongueRulesV2";
import { inferTongueArchetype } from "@/lib/analysis/tongueRulesV2";
// 别名：为了保持命名一致性（实际使用的是 TongueStateTags 和 inferTongueArchetype）
import type { TongueStateTags as TonguePattern } from "@/lib/analysis/tongueRulesV2";
import { inferTongueArchetype as buildTonguePattern } from "@/lib/analysis/tongueRulesV2";
import {
  DreamArchetype,
  buildDreamArchetypeFromText,
  buildDreamArchetypeFromText as buildDreamArchetype,
} from "@/lib/analysis/dreamRulesV2";
import { getInternalAppUrl } from "@/lib/env/urls";
// 注意：Locale 类型在文件内定义为 type Locale = "zh" | "en"

/**
 * 获取内部 LLM 代理路由的绝对 URL
 * 用于后端 API 调用（需要绝对路径）
 */
function getLLMProxyUrl(): string {
  try {
    return `${getInternalAppUrl()}/api/llm/chat`;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000/api/llm/chat";
    }
    throw error;
  }
}

/**
 * 通过内部代理路由调用 LLM（统一入口）
 */
async function callLLMViaProxy(params: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  const proxyUrl = getLLMProxyUrl();
  
  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`LLM proxy error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * 通过内部代理路由调用 LLM（兼容旧接口）
 */
async function callLLMProxy(params: {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
}): Promise<{ content: string; usage?: any }> {
  const proxyUrl = getLLMProxyUrl();
  
  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`LLM proxy error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: data.usage,
  };
}

/**
 * LLM 服务模块 + 纯规则兜底解读
 */

type LLMProvider = "openai" | "anthropic";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: LLMMessage[], options?: { temperature?: number; max_tokens?: number }): Promise<LLMResponse> {
    const { provider, apiKey, model, baseURL } = this.config;
    const temperature = options?.temperature ?? 0.7;
    const max_tokens = options?.max_tokens ?? 2000;

    if (provider === "openai") {
      // 通过内部代理路由 /api/llm/chat 调用（除非指定了 baseURL）
      return this.callOpenAI(messages, { temperature, max_tokens, apiKey, model, baseURL });
    } else if (provider === "anthropic") {
      return this.callAnthropic(messages, { temperature, max_tokens, apiKey, model });
    } else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  private async callOpenAI(
    messages: LLMMessage[],
    options: { temperature: number; max_tokens: number; apiKey: string; model?: string; baseURL?: string },
  ): Promise<LLMResponse> {
    const { temperature, max_tokens, model = "gpt-4o-mini", baseURL } = options;
    
    // 如果指定了 baseURL，直接调用 OpenAI API（兼容旧行为，用于自定义端点）
    if (baseURL) {
      const url = baseURL.endsWith("/chat/completions") ? baseURL : `${baseURL}/chat/completions`;
      return this.callOpenAIDirect(url, messages, { temperature, max_tokens, model });
    }

    // 否则使用内部代理路由 /api/llm/chat（Edge Runtime）
    // 注意：所有 LLM 调用统一通过后端 API，不在前端直接调用
    const proxyUrl = getLLMProxyUrl();

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(`LLM proxy error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  // 直接调用 OpenAI API 的方法（用于兼容 baseURL 配置）
  private async callOpenAIDirect(
    url: string,
    messages: LLMMessage[],
    options: { temperature: number; max_tokens: number; model: string },
  ): Promise<LLMResponse> {
    const { temperature, max_tokens, model } = options;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for direct OpenAI calls");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  private async callAnthropic(
    messages: LLMMessage[],
    options: { temperature: number; max_tokens: number; apiKey: string; model?: string },
  ): Promise<LLMResponse> {
    const { temperature, max_tokens, apiKey, model = "claude-3-5-sonnet-20241022" } = options;

    // 转换消息格式（Anthropic 需要 system 消息单独处理）
    const systemMessage = messages.find((msg) => msg.role === "system");
    const conversationMessages = messages.filter((msg) => msg.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemMessage?.content || "",
        messages: conversationMessages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || "",
      usage: data.usage
        ? {
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens,
            total_tokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}

/**
 * 创建 LLM 服务实例
 */
export function createLLMService(): LLMService | null {
  // 优先使用 OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return new LLMService({
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  // 其次使用 Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return new LLMService({
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    });
  }

  // 如果没有配置，返回 null
  console.warn("[LLM Service] No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  return null;
}

/**
 * 解析 JSON 响应（带容错）
 */
export function parseJSONResponse<T>(text: string, fallback: T): T {
  try {
    // 尝试提取 JSON 代码块
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }

    // 尝试直接解析
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("[LLM Service] Failed to parse JSON response, using fallback:", error);
    return fallback;
  }
}

export type { LLMService, LLMMessage, LLMResponse };

const FALLBACK_RESPONSE =
  "[FALLBACK] 系统本次未完全解析成功，但从整体趋势看：保持节奏、减少压力、照顾好自己，会更顺利。";

const LLM_FALLBACK_ENDPOINT = process.env.LLM_FALLBACK_ENDPOINT || process.env.LLM_PROXY_ENDPOINT;

/**
 * 统一的轻量级 LLM 调用入口（带网络/超时兜底）
 */
export async function callLLM(prompt: string): Promise<string> {
  if (!LLM_FALLBACK_ENDPOINT) {
    console.warn("[LLM] No fallback endpoint configured, returning fallback text.");
    return FALLBACK_RESPONSE;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    const res = await fetch(LLM_FALLBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`LLM fallback request failed: ${res.status}`);
    }

    const text = await res.text();
    return text || FALLBACK_RESPONSE;
  } catch (error) {
    console.warn("[LLM] callLLM failed, using fallback:", error);
    return FALLBACK_RESPONSE;
  }
}

/**
 * 以下为规则化解读，替代旧版 interpreters.ts
 */

type Locale = "zh" | "en";

export interface PalmInsight {
  summary: string[]; // 分句后的 2–3 句
  bullets: string[]; // 建议列表
}

export interface TongueInsight {
  summary: string; // 一句话：身体状态 · 今日气机
  bullets: string[]; // 2–4 条保健建议
}

export interface DreamInsight {
  symbol: string; // 象义说明
  mood: string; // 心绪说明
  trend: string; // 趋势 / 提醒
  suggestions: string[]; // 2–3 条行动建议
}

export interface ConstitutionInsight {
  constitution_type: string;
  description_paragraphs: string[];
  constitution_advice: string[];
}

export interface QiRhythmInsight {
  summary: string;
  trend: string;
  advice: string[];
}

const CONSTITUTION_TYPES = [
  "emotional_surge",
  "mental_overclock",
  "grounded_steady",
  "social_drain",
  "thought_heavy",
  "mild_fatigue",
  "low_heart_qi",
  "yang_sensitive",
  "yin_sensitive",
  "digestive_soft",
  "qi_flow_free",
  "steady_build",
];

const DEFAULT_CONSTITUTION: ConstitutionInsight = {
  constitution_type: "steady_build",
  description_paragraphs: ["整体状态平稳，适度运动与规律作息即可。"],
  constitution_advice: ["保持作息稳定", "每日适量活动", "留意情绪起伏并及时调节"],
};

/**
 * 构建通用系统提示词基底（四模块共用）
 */
function buildBaseSystemPrompt(locale: Locale): string {
  if (locale === "en") {
    return `
You are a professional interpreter based on **Eastern Symbolism** (palmistry, tongue patterns, dream symbolism) + **solar terms & almanac** + **life trend insights**.

Your role: Generate report content with **Eastern wisdom, trend judgment, symbolic depth, and actionable insights** based on the **structured tags** provided by the system.

You **cannot** fabricate features or make absolute medical/fortune-telling predictions.

You **must** write only based on the provided tags.

【Core Principles】

✅ You CAN (encouraged):

- Use Eastern symbolism language: 象 (symbol), 气机 (qi flow), 底气 (foundation), 运势 (fortune), 节奏 (rhythm), 收心 (focus inward), 蓄力 (accumulate strength), 稳中求进 (steady progress), 内收外放 (internal focus & external expression), etc.

- Extract from tags:
  - States: 偏虚 (slightly deficient) / 偏实 (slightly excess) / 火力偏旺 (fire excess) / 情绪敏感 (emotionally sensitive) / 思虑偏多 (overthinking) ...
  - Trends: 上升期 (rising phase) / 平稳期 (stable phase) / 调整期 (adjustment phase) / 收心蓄力期 (focus & accumulate phase) / 稳中求进 (steady progress) ...
  - Reminders: 该慢一点 (should slow down) / 该收一收 (should focus inward) / 该表达 (should express) / 该整理 (should organize) / 该补足自己 (should replenish) ...

- Combine solar terms & almanac "宜/忌" (auspicious/avoid) to explain:
  - What's suitable today, what's not

- Give specific, immediately actionable advice:
  - Sleep, diet, exercise, communication, organization, mindset adjustment, rhythm arrangement, etc.

- Mention organs in a wellness context:
  - "可以多照顾一下肝脏" (can take more care of the liver)
  - "近期多关照一下脾胃" (recently pay more attention to spleen/stomach)
  - "注意肾部的休息与保养" (pay attention to kidney rest and maintenance)
  - **Premise**: Only "remind to pay attention / take more care", NOT "diagnose a disease"

❌ You MUST avoid:

- Medical diagnosis & conclusions:
  - Do NOT write "You have xxx disease" / "Your liver/kidney/heart already has problems"
  - Do NOT write "Need immediate treatment" / "Already developed into disease"

- Absolute predictions:
  - Do NOT write "You will definitely..." / "You must..." / "You will certainly..."

- Disaster-style fate pronouncements:
  - Do NOT write "必有大劫" (must have major disaster) / "注定失败" (destined to fail) / "必然破财/失去某人" (will definitely lose money/someone)

- Explicit legal, financial, medical conclusions:
  - Do NOT write "You have depression" / "You will go bankrupt" / "You will lose the lawsuit", etc.

- Fabricating beyond tags:
  - Do NOT add "metaphysical rules" or "medical rules" not provided by the system

**Allowed examples:**
- "从整体标签来看，更像是一个'需要多照顾脾胃和休息质量'的阶段。" (From the overall tags, this looks more like a phase that 'needs more care for spleen/stomach and rest quality'.)
- "最近的状态提示你，可以多关照一下肝脏，少熬夜、少生闷气，对你会更有利。" (Recent state suggests you can pay more attention to the liver, less staying up late and less holding in anger, which will be more beneficial for you.)
- "这个组合提醒你，肾部和下半身的精力要多保养，多睡一点、多保暖是加分项。" (This combination reminds you that kidney and lower body energy need more maintenance, more sleep and more warmth are pluses.)

**Not allowed examples:**
- "你肝脏已经有病了。" (Your liver already has a disease.)
- "你的肾肯定不好。" (Your kidneys are definitely not good.)
- "再不注意就会得重大疾病。" (If you don't pay attention, you will get a serious disease.)

【Output Style (Unified Across All Modules)】

Tone: Steady, warm, practical, with a touch of humor but not frivolous

Base: Speak like a consultant who understands both Eastern wisdom and modern life rhythms

Every piece of content should make users feel:
- 「被理解」("Understood") - Make users feel you understand their state and feelings
- 「被提醒」("Gently reminded") - Gently remind them of directions to pay attention to, not commands or threats
- 「知道今天可以做点什么」("Know what to do today") - Give specific, actionable, immediately implementable suggestions

Style examples:
- ✅ "Your vitality is generally good, but recently there's a tendency to push too hard."
- ✅ "Emotionally you're quite sensitive, easily overthinking in relationships."
- ✅ "Don't rush to finish everything at once, save some energy for future you."
- ✅ "Today you can give yourself a bit more quality rest time."
- ❌ "You must change immediately, or big problems will occur." (Too harsh)
- ❌ "Your condition is very bad, you need immediate treatment." (Too scary)
- ❌ "Haha, your problem is very simple." (Too frivolous)

【Unified Output Structure (All Modules)】

Each module (palm / tongue / dream / qi rhythm) should cover three types of content:

1. **summary (1–3 sentences)**
   - Summarize current state, trend, and qi baseline
   - Use descriptions like "偏……的状态" (slightly... state) or "呈现出……的走势" (showing... trend)
   - Example: "From the overall tags, showing a slightly deficient state that needs inward focus and energy accumulation."

2. **Analysis / Insights (varies by module focus)**
   - **Palm**: Vitality, emotions, thinking patterns, career/wealth tendencies, relationship rhythm
   - **Tongue**: Energy level, moisture/dryness bias, digestive rhythm, fatigue/heat tendency; can appropriately mention "liver/spleen-stomach/kidney need more care"
   - **Dream**: Symbolic meaning (Zhou Gong system), mood (psychological layer), trend reminders (focus inward/express/adjust/let go, etc.)
   - **Qi Rhythm**: Solar terms, auspicious/avoid, rhythm characteristics throughout the day (morning/afternoon/evening)

3. **advice suggestions (2–5 items)**
   - Specific, actionable, useful for today
   - Can cover sleep, diet, exercise, communication, organization, rhythm arrangement, etc.
   - When mentioning organs, only use "注意/关照/保养" (pay attention/care/maintain) tone, no diagnosis
   - Example: "可以多照顾一下肝脏，少熬夜、少生闷气。" (Can take more care of the liver, less staying up late and less holding in anger.)
`.trim();
  }

  // 默认中文
  return `
你是一位基于 **东方象学（掌纹、舌象、梦象）+ 节气黄历 + 生活趋势洞察** 的专业解读者。

你的职责是：根据系统给出的「已结构化标签」，生成 **有东方智慧、有趋势判断、有象意深度、又可落地** 的报告内容。

**你不能自己编造特征，也不能做医疗/命理上的"绝对性预言"。**

**你必须只基于提供的标签来写。**

【核心原则】

✅ 你可以（鼓励）：

- 使用东方象学语言：
  - 象、气机、底气、运势、节奏、收心、蓄力、稳中求进、内收外放 等

- 从标签中提炼：
  - **状态**：偏虚 / 偏实 / 火力偏旺 / 情绪敏感 / 思虑偏多 …
  - **趋势**：上升期 / 平稳期 / 调整期 / 收心蓄力期 / 稳中求进 …
  - **提醒**：该慢一点、该收一收、该表达、该整理、该补足自己 …

- 结合节气与黄历的「宜 / 忌」来解释：
  - 今天适合什么，不适合什么

- 给出具体、能马上执行的建议：
  - 作息、饮食、运动、沟通、整理、心态调节、节奏安排等

- 在保健语境下提到器官：
  - 「可以多照顾一下肝脏」「近期多关照一下脾胃」「注意肾部的休息与保养」
  - **前提**：只是"提醒关注 / 多保养"，而不是"诊断有病"

❌ 你必须避免：

- 医疗诊断与结论：
  - 不要写「你有 xxx 病」「你的肝/肾/心脏已经出问题」
  - 不要写「需要立刻治疗」「已经发展成疾病」

- 绝对性预言：
  - 不要写「你一定会…」「你必然会…」「你肯定会出事」

- 灾难式命运宣判：
  - 不要写「必有大劫」「注定失败」「必然破财/失去某人」

- 明确的法律、财务、医学结论：
  - 不写「你有抑郁症」「你会破产」「你会打官司失败」等等

- 不基于标签乱编：
  - 不增加系统未提供的"玄学规则"或"医学规则"

**允许的说法示例：**
- 「从整体标签来看，更像是一个'需要多照顾脾胃和休息质量'的阶段。」
- 「最近的状态提示你，可以多关照一下肝脏，少熬夜、少生闷气，对你会更有利。」
- 「这个组合提醒你，肾部和下半身的精力要多保养，多睡一点、多保暖是加分项。」

**不允许的说法示例：**
- 「你肝脏已经有病了。」
- 「你的肾肯定不好。」
- 「再不注意就会得重大疾病。」

【输出风格（全模块统一）】

语气：稳、温、实、有一点幽默但不轻浮

基调：像一个懂东方智慧、同时懂现代生活节奏的顾问在说话

每一段内容，都要让用户感觉：
- 「被理解」- 让用户感受到你理解他们的状态和感受
- 「被提醒」- 温和地提醒他们需要注意的方向，而不是命令或恐吓
- 「知道今天可以做点什么」- 给出具体、可执行、能马上落地的建议

示例风格：
- ✅ "你的生命力整体还不错，但最近有一点用力过猛的倾向。"
- ✅ "情绪上比较细腻，容易在关系里想得多一点。"
- ✅ "别急着把所有事一次做完，留点体力给未来的你。"
- ✅ "今天可以多给自己一点高质量的休息时间。"
- ❌ "你必须立刻改变，否则会出大问题。"（太强硬）
- ❌ "你的状态很糟糕，需要立刻治疗。"（太吓人）
- ❌ "哈哈，你这个问题很简单。"（太轻浮）

【统一输出结构（全模块通用）】

每个模块（掌纹 / 舌苔 / 梦境 / 气运），都围绕三类内容展开：

1. **summary（1–3 句）**
   - 总结当前的状态、趋势、气机基调
   - 用"偏……的状态""呈现出……的走势"等描述
   - 例如："从整体标签来看，呈现出偏虚、需要收心蓄力的走势。"

2. **分析 / 洞察（按模块重点变化）**
   - **掌纹**：生命力、情绪、思路、事业/财富倾向、关系节奏
   - **舌苔**：能量高低、湿燥偏向、消化节奏、疲劳/上火倾向，可适度点到「肝脏/脾胃/肾部要多照顾」
   - **梦境**：象意（周公系）、心绪（心理层）、趋势提醒（收心/表达/调整/放手 等）
   - **气运**：节气、宜忌、全天（上午/下午/晚上）的节奏特征

3. **advice 建议（2–5 条）**
   - 具体、可执行、对今天有用
   - 可以从作息、饮食、运动、沟通、整理、节奏安排等角度给出
   - 提到器官时，只用「注意/关照/保养」语气，不做诊断
   - 例如："可以多照顾一下肝脏，少熬夜、少生闷气。"
`.trim();
}

/**
 * 构建财富线分析模板（模板 + 插值，让 LLM 只做填空）
 */
function buildPalmWealthTemplate(
  locale: Locale,
  palmWealthFeatures: {
    level: "low" | "medium" | "high";
    pattern: string;
    money?: "clear" | "weak" | "broken" | "none";
    fate?: "strong" | "weak" | "broken" | "none";
    wealth_trend?: string;
  },
): string {
  if (locale === "en") {
    return `You are a palmistry analyst based on traditional palmistry and Chinese classics. Below are someone's palm features related to wealth lines. Please provide a professional but accessible analysis in English.

【Requirements】
1. Clearly state the strength of this person's wealth line, using terms like "weak / medium / strong / very strong".
2. Explain the wealth path suitable for this person, such as: stable management, preference for regular income/side income, suitable for partnership or independence.
3. Remind possible wealth loss risks, but do not frighten.
4. Language style should reference traditional palmistry sayings, avoid modern psychological platitudes.

【Palm Wealth Features】:
${JSON.stringify(palmWealthFeatures, null, 2)}

【Output Format】
Output JSON only:
{
  "level": "low" | "medium" | "high",
  "pattern": "description of line pattern (shallow/deep/intermittent/forked)",
  "risk": ["risk point 1", "risk point 2"],
  "potential": ["wealth accumulation method 1", "wealth accumulation method 2"],
  "summary": "one sentence summary in traditional palmistry style"
}`;
  }

  // 默认中文
  return `你是基于传统手相与国学的分析师。以下是某人的掌纹特征（财富线相关），请用中文输出专业但通俗的分析。

【要求】
1. 明确说明此人的财富线强弱，使用"偏弱 / 中等 / 较旺 / 很旺"这类表述。
2. 说明此人适合的财富路径，如：稳健经营、偏向正财/偏财、适合合伙还是独立。
3. 提醒可能的破财风险，但不要恐吓。
4. 语言风格参考传统手相论语，避免现代心理鸡汤。

【掌纹特征】：
${JSON.stringify(palmWealthFeatures, null, 2)}

【输出格式】
只输出一段 JSON：
{
  "level": "low" | "medium" | "high",
  "pattern": "纹理特征描述（浅/深/断续/分叉）",
  "risk": ["破财风险点1", "破财风险点2"],
  "potential": ["聚财途径1", "聚财途径2"],
  "summary": "一句话总结（国学式）"
}`;
}

/**
 * 使用 LLM 生成财富线洞察（模板 + 插值）
 */
export async function interpretPalmWealthWithLLM(
  locale: Locale,
  palmWealthFeatures: {
    level: "low" | "medium" | "high";
    pattern: string;
    money?: "clear" | "weak" | "broken" | "none";
    fate?: "strong" | "weak" | "broken" | "none";
    wealth_trend?: string;
  },
): Promise<{
  level: "low" | "medium" | "high";
  pattern: string;
  risk: string[];
  potential: string[];
  summary: string;
}> {
  try {
    const template = buildPalmWealthTemplate(locale, palmWealthFeatures);
    const raw = await callLLMViaProxy({
      system: "你是一位专业的手相分析师，擅长财富线解读。请严格按照模板要求，只做填空，不要自由发挥。",
      user: template,
      temperature: 0.6, // 降低温度，让输出更稳定
      max_tokens: 500,
    });

    const parsed = parseJSONResponse<{
      level?: "low" | "medium" | "high";
      pattern?: string;
      risk?: string[];
      potential?: string[];
      summary?: string;
    }>(raw, {
      level: palmWealthFeatures.level,
      pattern: palmWealthFeatures.pattern,
      risk: [],
      potential: [],
      summary: "",
    });

    return {
      level: parsed.level ?? palmWealthFeatures.level,
      pattern: parsed.pattern ?? palmWealthFeatures.pattern,
      risk: Array.isArray(parsed.risk) ? parsed.risk.filter((r): r is string => typeof r === "string").slice(0, 3) : [],
      potential: Array.isArray(parsed.potential) ? parsed.potential.filter((p): p is string => typeof p === "string").slice(0, 3) : [],
      summary: parsed.summary ?? (locale === "zh" ? "财帛纹略浅偏直，属'勤聚缓发'之象，宜重视稳健经营，少赌多积。" : "Wealth lines are slightly shallow and straight, indicating steady accumulation and gradual growth."),
    };
  } catch (error) {
    console.error("[LLM Service] interpretPalmWealthWithLLM failed:", error);
    // 返回基于规则的兜底结果
    return {
      level: palmWealthFeatures.level,
      pattern: palmWealthFeatures.pattern,
      risk: locale === "zh" ? ["避免高风险投资", "注意控制消费冲动"] : ["Avoid high-risk investments", "Pay attention to controlling consumption impulses"],
      potential: locale === "zh" ? ["通过稳健经营积累财富", "把握长期投资机会"] : ["Accumulate wealth through stable management", "Seize long-term investment opportunities"],
      summary: locale === "zh" ? "财帛纹略浅偏直，属'勤聚缓发'之象，宜重视稳健经营，少赌多积。" : "Wealth lines are slightly shallow and straight, indicating steady accumulation and gradual growth.",
    };
  }
}

/**
 * 构建掌纹系统提示词（模板化改进）
 */
function buildPalmSystemPrompt(locale: Locale, archetype: PalmArchetype): string {
  const {
    vitality,
    emotion_pattern,
    thinking_pattern,
    wealth_trend,
    career_trend,
    relationship_trend,
    palm_color_signal,
    palm_texture_signal,
    color_tag,
    texture_tag,
    systemTags,
  } = archetype;

  const basePrompt = buildBaseSystemPrompt(locale);
  
  // 掌纹模块局部说明
  const moduleSpecific = locale === "en" ? `
【Palm-Specific Tags】
You receive a structured PalmArchetype (already derived by rules):

- vitality: ${vitality}
- emotion_pattern: ${emotion_pattern}
- thinking_pattern: ${thinking_pattern}
- wealth_trend: ${wealth_trend ?? "not prominent"}
- career_trend: ${career_trend ?? "not prominent"}
- relationship_trend: ${relationship_trend ?? "not prominent"}
- palm_color_signal: ${palm_color_signal ?? "no significant signal"}
- palm_texture_signal: ${palm_texture_signal ?? "no significant signal"}
- color_tag: ${color_tag?.join(", ") || "none"}
- texture_tag: ${texture_tag?.join(", ") || "none"}
- systemTags (for internal logic, reference tone only, don't copy verbatim): ${systemTags.join(" , ")}

【Output Format】

Output JSON only:

{
  "summary": ["first summary sentence", "second summary sentence", "third optional"],
  "bullets": ["advice1", "advice2", "advice3", "advice4 (optional)"]
}

【Output Requirements】

1. **summary (1–3 sentences)**:
   - Summarize current state, trend, and qi baseline
   - Use descriptions like "slightly... state" or "showing... trend"
   - Focus on: vitality, emotions, thinking patterns, career/wealth tendencies, relationship rhythm
   - Example:
     - "Your vitality is generally good, but recently there's a tendency to push too hard."
     - "Emotionally you're quite sensitive, easily overthinking in relationships."
     - "From palm lines, showing a steady progress trend that needs inward focus."

2. **bullets (2–5 suggestions)**:
   - Each is a specific, actionable small suggestion, tone gentle with a touch of humor, non-judgmental, not scary
   - Can cover sleep, diet, exercise, communication, organization, rhythm arrangement, etc.
   - Example:
     - "Don't rush to finish everything at once, save some energy for future you."
     - "Today you can give yourself a bit more quality rest time."
     - "Before important decisions, give yourself a buffer time, don't rush to conclusions."

【Palm Module Specific Guidance】

You receive PalmArchetype tags including:
- vitality: foundation / energy state
- emotion_pattern: how you handle emotions and relationships
- thinking_pattern: thinking and decision-making rhythm
- wealth_trend: wealth / career tendency (steady / opportunity-based / adjustment phase, etc.)
- career_trend: symbolic signals for career advancement
- relationship_trend: symbolic signals for relationships and connections
- palm_color_signal / palm_texture_signal: one-sentence hints about palm color and texture
- color_tag / texture_tag / systemTags: auxiliary tags

Your task:
- Use 1–3 sentences in summary to clarify "what stage/rhythm you're currently in"
- In analysis, connect "qi flow, emotions, thinking, career and relationships" clearly
- Don't discuss lifespan or specific diseases
- 3–5 suggestions, language can be slightly humorous:
  - Like "Don't always push yourself to full capacity, save some battery for tomorrow's you."
  - Like "Today is suitable for taking care of the basics first, then consider sprinting."
` : `
【掌纹模块 · 局部说明】

你收到的是一份已经规则化的掌纹标签（由程序算好，不需要你再推理）：

【掌纹标签】
`;

  // 使用模板 + 插值方式，让 LLM 只做填空
  const palmFeatures = {
    vitality,
    emotion_pattern,
    thinking_pattern,
    wealth_trend: wealth_trend ?? "未突出",
    career_trend: career_trend ?? "未突出",
    relationship_trend: relationship_trend ?? "未突出",
    palm_color_signal: palm_color_signal ?? "无明显信号",
    palm_texture_signal: palm_texture_signal ?? "无明显信号",
    color_tag: color_tag?.join("、") || "无",
    texture_tag: texture_tag?.join("、") || "无",
  };

  const outputFormat = locale === "en" ? `
【Palm Features (Template Fill-in)】:
${JSON.stringify(palmFeatures, null, 2)}

【Output Template】
You must fill in the following template structure. Do NOT invent features or make predictions beyond the provided data.

{
  "summary": [
    "Fill in: Current vitality state based on '${vitality}'",
    "Fill in: Emotional pattern based on '${emotion_pattern}'",
    "Fill in: Thinking pattern based on '${thinking_pattern}'"
  ],
  "bullets": [
    "Fill in: One actionable suggestion related to vitality",
    "Fill in: One actionable suggestion related to emotions/relationships",
    "Fill in: One actionable suggestion related to thinking/decision-making",
    "Fill in: One actionable suggestion related to career/wealth (if '${wealth_trend}' is not '未突出')"
  ]
}

【Requirements】
- Use the exact feature values provided above
- Do NOT add features not in the template
- Language: gentle, warm, practical, with a touch of humor
- Avoid medical diagnosis or absolute predictions
` : `
【掌纹特征（模板填空）】：
${JSON.stringify(palmFeatures, null, 2)}

【输出模板】
你必须按照以下模板结构填空。不要编造特征，不要超出提供的数据做预测。

{
  "summary": [
    "填空：基于'${vitality}'的生命力状态描述",
    "填空：基于'${emotion_pattern}'的情绪模式描述",
    "填空：基于'${thinking_pattern}'的思维模式描述"
  ],
  "bullets": [
    "填空：一条与生命力相关的可执行建议",
    "填空：一条与情绪/关系相关的可执行建议",
    "填空：一条与思维/决策相关的可执行建议",
    "填空：一条与事业/财富相关的可执行建议（如果'${wealth_trend}'不是'未突出'）"
  ]
}

【要求】
- 使用上述提供的精确特征值
- 不要添加模板中没有的特征
- 语言：温和、温暖、实用，略带幽默
- 避免医疗诊断或绝对性预言
`;

  return `${basePrompt}

${moduleSpecific}${outputFormat}
`.trim();
}

/**
 * 安全解析掌纹 LLM 响应
 */
function safeParsePalmInsight(raw: string, archetype?: PalmArchetype, locale: Locale = "zh"): PalmInsight {
  const fallback: PalmInsight = archetype
    ? {
        summary: [
          locale === "zh"
            ? `你的生命力整体${archetype.vitality}，情绪上${archetype.emotion_pattern}，思维上${archetype.thinking_pattern}。`
            : `Your vitality is ${archetype.vitality}, emotionally ${archetype.emotion_pattern}, thinking-wise ${archetype.thinking_pattern}.`,
        ],
        bullets: buildPalmAdvice(archetype, locale),
      }
    : {
        summary: [locale === "zh" ? "整体状态平稳，保持节奏即可。" : "Overall state is steady—maintain your rhythm."],
        bullets: locale === "zh"
          ? ["保持作息稳定", "适度活动", "留意情绪起伏"]
          : ["Keep steady routines", "Moderate activity", "Watch emotional shifts"],
      };

  try {
    const parsed = parseJSONResponse<{ summary?: string[]; bullets?: string[] }>(raw, fallback);
    
    // 验证并清理数据
    const summary = Array.isArray(parsed.summary) && parsed.summary.length > 0
      ? parsed.summary.filter((s): s is string => typeof s === "string").slice(0, 3)
      : fallback.summary;
    
    const bullets = Array.isArray(parsed.bullets) && parsed.bullets.length > 0
      ? parsed.bullets.filter((b): b is string => typeof b === "string").slice(0, 4)
      : fallback.bullets;

    return { summary, bullets };
  } catch (error) {
    console.warn("[LLM Service] Failed to parse palm insight, using fallback:", error);
    return fallback;
  }
}

/**
 * 使用 LLM 解读掌纹
 */
export async function interpretPalmWithLLM(
  locale: Locale,
  palmResult: PalmFeatureSummary,
): Promise<PalmInsight> {
  // 1) 规则化：先算 archetype
  // 将 PalmLineSummary 扩展为 PalmLineSummaryExtended（添加 fate 和 money 字段）
  const extendedLines: PalmLineSummaryExtended = {
    ...palmResult.lines,
    fate: undefined,
    money: undefined,
  };
  const palmInput = {
    ...palmResult,
    lines: extendedLines,
  };
  const archetype: PalmArchetype = buildPalmArchetype(palmInput);

  // 2) 构建系统提示词
  const system = buildPalmSystemPrompt(locale, archetype);

  // 3) 将 archetype 作为 JSON 传给 user
  const user = JSON.stringify(archetype);

  // 4) 调用 LLM 代理
  try {
    const raw = await callLLMViaProxy({ system, user });
    return safeParsePalmInsight(raw, archetype, locale);
  } catch (error) {
    console.error("[LLM Service] interpretPalmWithLLM failed:", error);
    // 出错时返回基于规则的兜底结果
    return {
      summary: [
        `你的生命力整体${archetype.vitality}，情绪上${archetype.emotion_pattern}，思维上${archetype.thinking_pattern}。`,
      ],
      bullets: buildPalmAdvice(archetype, locale),
    };
  }
}

/**
 * 构建舌象系统提示词
 */
function buildTongueSystemPrompt(locale: Locale, pattern: TonguePattern): string {
  // 目前以中文为主，后续有需要可以再加英文分支
  if (locale === "en") {
    // 简单英文版：保留东方味道，以后你可以再精调
    // 使用现有字段构建 focus_tags 和 suggestion_tags
    const focusTags = [
      ...(pattern.special_signs || []),
      ...(pattern.body_color_tag || []),
      ...(pattern.coating_color_tag || []),
    ];
    const suggestionTags = [
      ...(pattern.moisture_tag || []),
      ...(pattern.body_color_tag || []),
    ];

    const basePrompt = buildBaseSystemPrompt(locale);
    
    // 舌象模块局部说明（英文）
    const moduleSpecific = `
【Tongue-Specific Tags】
You receive a structured TonguePattern (already derived by rules):
`;

    return `${basePrompt}

${moduleSpecific}

- energy_state: ${pattern.energy_state}

- moisture_pattern: ${pattern.moisture_pattern}

- digestive_trend: ${pattern.digestive_trend}

- focus_tags: ${focusTags.join(" , ") || "none"}
  ${focusTags.some(tag => tag.includes("liver") || tag.includes("spleen") || tag.includes("kidney") || tag.includes("肝脏") || tag.includes("脾胃") || tag.includes("肾"))
    ? "⚠️ Note: If focus_tags contains organ care labels like '注意肝脏'/'liver care', '注意脾胃'/'spleen-stomach care', '注意肾部保养'/'kidney care', you can mention them in summary and suggestions, but must use 'pay attention/care/maintain' tone, absolutely forbidden diagnostic statements."
    : ""}

- suggestion_tags: ${suggestionTags.join(" , ") || "none"}

- systemTags: ${pattern.systemTags.join(" , ")}
  ${pattern.systemTags.some(tag => tag.includes("liver") || tag.includes("spleen") || tag.includes("kidney"))
    ? "⚠️ Note: If systemTags contains liver_care, spleen_stomach_care, kidney_care, etc., it means these organs need special attention, but only as wellness reminders, not diagnosis."
    : ""}

【Output Format】

Output JSON only:

{
  "summary": "one concise sentence describing today's body qi state",
  "bullets": ["advice1", "advice2", "advice3 (optional)", "advice4 (optional)"]
}

【Output Requirements】

1. **summary (1 sentence)**:
   - Summarize current state, trend, and qi baseline
   - Use descriptions like "slightly... state" or "showing... trend"
   - Focus on: energy level, moisture/dryness bias, digestive rhythm, fatigue/heat tendency
   - Can appropriately mention "liver/spleen-stomach/kidney need more care", but only use "pay attention/care/maintain" tone, no diagnosis
   - Example: "Today your body is in a slightly low-energy, easy-to-get-tired state."

2. **bullets (2–4 suggestions)**:
   - Specific, actionable, practical for daily life
   - Can cover sleep, diet, exercise, communication, organization, rhythm arrangement, etc.
   - When mentioning organs, only use "pay attention/care/maintain" tone, no diagnosis
   - Tone: gentle, practical, slightly warm, not scary
   - Example: "Drink more warm water today, less cold drinks, don't challenge your stomach."

【Tongue Module Specific Guidance】

You receive TonguePattern tags including:
- energy_state: balanced / slightly deficient / slightly excess / prone to heat
- moisture_pattern: damp stagnation / slightly dry / moisture adequate
- digestive_trend: transformation/digestive rhythm
- focus_tags / suggestion_tags / systemTags

Your task:
- summary: one sentence describing today's body qi state
- In analysis, you can say:
  - Easy to get tired / prone to heat / easy to feel drowsy / easy to feel stuck / energy scattered, etc.
  - Can use expressions like "take more care of liver" / "pay attention to spleen-stomach" / "pay attention to kidney maintenance", but only as wellness reminders
- 2–4 suggestions, for example:
  - "Drink more warm water today, less cold drinks, your spleen-stomach will thank you."
  - "Go to bed a bit earlier, let the liver have time to repair properly."
  - "Moderate activity for lower back and lower limbs, which is taking care of kidney qi."
- **Absolutely forbidden**: Writing "your liver is bad" / "your kidney is sick", can only use **"needs special attention"** tone.
`.trim();
  }

  // 默认中文
  const basePrompt = buildBaseSystemPrompt(locale);
  
  // 使用现有字段构建 focus_tags 和 suggestion_tags
  const focusTags = [
    ...(pattern.special_signs || []),
    ...(pattern.body_color_tag || []),
    ...(pattern.coating_color_tag || []),
  ];
  const suggestionTags = [
    ...(pattern.moisture_tag || []),
    ...(pattern.body_color_tag || []),
  ];

  // 舌象模块局部说明
  const moduleSpecific = `
【舌象模块 · 局部说明】

你拿到的是一份已经规则化好的 TonguePattern（由程序算好，不需要你再推理）：
`;

  return `${basePrompt}

${moduleSpecific}

- 能量状态（energy_state）：${pattern.energy_state}

- 水分 / 湿度模式（moisture_pattern）：${pattern.moisture_pattern}

- 消化趋势（digestive_trend）：${pattern.digestive_trend}

- 需要关注的方向（focus_tags）：${focusTags.join("、") || "无特别强调"}
  ${focusTags.some(tag => tag.includes("肝脏") || tag.includes("脾胃") || tag.includes("肾")) 
    ? "⚠️ 注意：focus_tags 中如出现「注意肝脏」「注意脾胃」「注意肾部保养」等器官保健标签，你可以在 summary 和建议中适度提及，但必须使用「注意/关照/保养」语气，绝对禁止诊断性表述。" 
    : ""}

- 建议方向标签（suggestion_tags）：${suggestionTags.join("、") || "无特别强调"}

- 系统标签（systemTags，内部使用，可参考语气，不要原样照抄）：${pattern.systemTags.join(" , ")}
  ${pattern.systemTags.some(tag => tag.includes("liver") || tag.includes("spleen") || tag.includes("kidney"))
    ? "⚠️ 注意：systemTags 中如出现 liver_care、spleen_stomach_care、kidney_care 等标签，表示需要特别关照这些器官，但只能作为保健提醒，不能诊断。"
    : ""}

【输出格式】

只输出一段 JSON：

{
  "summary": "一句话总结今天的身体气机状态",
  "bullets": ["建议1", "建议2", "建议3（可选）", "建议4（可选）"]
}

【输出要求】

1. **summary（1 句）**：
   - 总结当前的状态、趋势、气机基调
   - 用"偏……的状态""呈现出……的走势"等描述
   - 重点分析：能量高低、湿燥偏向、消化节奏、疲劳/上火倾向
   - 可适度点到「肝脏/脾胃/肾部要多照顾」，但只用「注意/关照/保养」语气，不做诊断
   - 例如：
     - "从舌苔来看，今天属于有点容易累、需要慢慢恢复的一天。"
     - "呈现出偏虚、湿重明显的状态，可以多关照一下脾胃和休息质量。"

2. **bullets（2–4 条建议）**：
   - 具体、可执行、生活化，语气可以稍微幽默一点，但不要嘲讽用户
   - 可以从作息、饮食、运动、沟通、整理、节奏安排等角度给出
   - 提到器官时，只用「注意/关照/保养」语气，不做诊断
   - 例如：
     - "今天多喝温水，少喝冰饮，别拿肠胃去赌气。"
     - "少刷手机，早一点睡觉，身体会记得你的好。"
     - "可以多照顾一下脾胃，少吃生冷，饭后散散步帮助消化。"

【舌苔模块专属补充提示】

你会拿到 TonguePattern 标签，包括：
- energy_state：平衡 / 偏虚 / 偏实 / 易上火
- moisture_pattern：湿滞 / 偏燥 / 水分尚可
- digestive_trend：运化/消化节奏
- focus_tags / suggestion_tags / systemTags

你的任务：
- summary 一句话：今天身体气机的大致状态
- 分析中可以说：
  - 容易累 / 容易上火 / 容易困 / 容易闷 / 精力偏散 等
  - 可以用「多照顾肝脏」「注意脾胃」「注意肾部保养」等表达，但只能作为保健提醒
- 建议 2–4 条，例如：
  - 「今天多喝温水，少冰饮，脾胃会感谢你的。」
  - 「早点睡一会，让肝脏有时间好好修一修。」
  - 「适度活动下腰部和下肢，算是在照顾肾气。」
- 绝对禁止写成「你肝不好」「你肾有病」，只能是**"需要特别关照"**的语气。
`.trim();
}

/**
 * 安全解析舌象 LLM 响应
 */
function safeParseTongueInsight(raw: string, pattern?: TonguePattern, locale: Locale = "zh"): TongueInsight {
  try {
    const data = JSON.parse(raw);

    const summary = typeof data.summary === "string" ? data.summary : "";
    const bullets = Array.isArray(data.bullets)
      ? data.bullets.filter((b: unknown) => typeof b === "string")
      : [];

    if (!summary && bullets.length === 0) {
      throw new Error("empty tongue insight");
    }

    return { summary, bullets };
  } catch {
    // Fallback：使用 pattern 字段生成兜底结果
    if (pattern) {
      const fallbackSummary = locale === "zh"
        ? `整体气机：${pattern.energy_state}；湿度：${pattern.moisture_pattern}；消化：${pattern.digestive_trend}。`
        : `Overall qi: ${pattern.energy_state}; Moisture: ${pattern.moisture_pattern}; Digestion: ${pattern.digestive_trend}.`;
      
      const fallbackBullets = locale === "zh"
        ? [
            pattern.tongue_color_signal || "多喝温水，保持节奏温和。",
            pattern.tongue_coating_signal || "清淡饮食，少油腻。",
            pattern.tongue_moisture_signal || "早点休息，别熬夜。",
          ].filter(Boolean)
        : [
            "Sip warm water, keep the rhythm gentle.",
            "Keep meals light, less greasy.",
            "Wind down early tonight.",
          ];
      
      return {
        summary: fallbackSummary,
        bullets: fallbackBullets,
      };
    }
    
    // 如果没有 pattern，使用非常保守的默认文案
    return {
      summary: locale === "zh" ? "从舌苔来看，今天属于需要好好照顾自己的日子。" : "From tongue coating, today is a day to take good care of yourself.",
      bullets: locale === "zh"
        ? [
            "多喝点温水，少冰饮和重口味。",
            "尽量不要熬得太晚，留一点时间给身体恢复。",
          ]
        : [
            "Drink more warm water, less cold drinks and heavy flavors.",
            "Try not to stay up too late, leave some time for body recovery.",
          ],
    };
  }
}

/**
 * 将 TongueFeatureSummary 转换为 TongueFeatures
 */
function mapTongueFeatureSummaryToTongueFeatures(summary: TongueFeatureSummary): TongueFeatures {
  const bodyColor: TongueFeatures["bodyColor"] =
    summary.color === "pale"
      ? "light-red"
      : summary.color === "purple"
        ? "purple"
        : summary.color === "red"
          ? "red"
          : "light-red";

  const coatingColor: TongueFeatures["coatingColor"] =
    summary.coating === "yellow"
      ? "yellow"
      : summary.coating === "none"
        ? "none"
        : "white";

  const coatingThickness: TongueFeatures["coatingThickness"] =
    summary.coating === "thick" ? "thick" : "thin";

  const moisture: TongueFeatures["moisture"] = summary.texture === "moist" ? "moist" : "dry";

  // 注意：TongueFeatureSummary 没有 teethMarks 字段，默认为 false
  const teethMarks = false;

  return {
    bodyColor,
    coatingColor,
    coatingThickness,
    moisture,
    teethMarks,
  };
}

/**
 * 使用 LLM 解读舌象
 */
export async function interpretTongueWithLLM(
  locale: Locale,
  tongueResult: TongueFeatureSummary,
): Promise<TongueInsight> {
  // 1）先通过规则引擎算出结构化模式
  // 将 TongueFeatureSummary 转换为 TongueFeatures
  const tongueFeatures = mapTongueFeatureSummaryToTongueFeatures(tongueResult);
  const pattern: TonguePattern = buildTonguePattern(tongueFeatures as any);

  // 2）构建系统提示词
  const system = buildTongueSystemPrompt(locale, pattern);

  // 3）将 pattern 作为 JSON 传给 user
  const user = JSON.stringify(pattern);

  // 4）调用 LLM 代理
  try {
    const raw = await callLLMViaProxy({ system, user });
    return safeParseTongueInsight(raw, pattern, locale);
  } catch (error) {
    console.error("[LLM Service] interpretTongueWithLLM failed:", error);
    // 出错时返回基于规则的兜底结果
    return {
      summary: `整体气机：${pattern.energy_state}；湿度：${pattern.moisture_pattern}；寒热：${pattern.heat_pattern}；胃气：${pattern.digestive_trend}。`,
      bullets: locale === "zh"
        ? ["喝温水或淡茶", "清淡饮食，少油炸", "早点休息，别熬夜"]
        : ["Sip warm water or mild tea", "Keep meals light", "Wind down early tonight"],
    };
  }
}

/**
 * 构建梦境系统提示词
 */
function buildDreamSystemPrompt(locale: Locale, archetype: DreamArchetype): string {
  if (locale === "en") {
    const basePrompt = buildBaseSystemPrompt(locale);
    
    // 梦境模块局部说明（英文）
    const moduleSpecific = `
【Dream-Specific Tags】
You receive a pre-computed DreamArchetype:
`;

    return `${basePrompt}

${moduleSpecific}

- type: ${archetype.type}

- symbol_meaning: ${archetype.symbol_meaning}

- mood_pattern: ${archetype.mood_pattern}

- trend_hint: ${archetype.trend_hint}

- suggestions (rule-based): ${archetype.suggestion_tags.join(" ; ")}

- systemTags: ${archetype.systemTags.join(" , ")}

【Output Format】

Output JSON only:

{
  "symbol": "one paragraph explaining the symbolic meaning in plain language",
  "mood": "one paragraph explaining the emotional pattern",
  "trend": "one paragraph explaining the reminder or tendency",
  "suggestions": ["action1", "action2", "action3 (optional)"]
}

【Output Requirements】

1. **symbol (Symbolic Meaning)**:
   - Explain what this dream may symbolize in plain language
   - Based on Zhou Gong dream interpretation system
   - Example: "Being chased in dreams often relates to 'something pushing you forward' in life."

2. **mood (Emotional Pattern)**:
   - Explain what kind of mood pattern it reflects
   - From a psychological perspective
   - Example: "Inner sensitivity to pressure and evaluation, with a sense of 'not wanting to fall behind'."

3. **trend (Trend Reminder)**:
   - Explain what kind of gentle reminder it brings
   - Trend reminders: focus inward/express/adjust/let go, etc.
   - **Must use tone like "more like reminding you of ××" or "seems to remind you ××", do not predict specific events**
   - Example: "This is a reminder, not a bad omen: face things gradually, no need to carry everything alone."
   - Example: "More like reminding you that it's suitable to make some rhythm adjustments recently, don't push yourself too hard."

4. **suggestions (2–3 actionable items)**:
   - Very specific small things, not big principles
   - Can cover sleep, diet, exercise, communication, organization, rhythm arrangement, etc.
   - Example: "List the most annoying thing, break it into small steps, talk to someone about the current situation."
   - Tone: warm, respectful, non-scary.

【Dream Module Specific Guidance】

You receive DreamArchetype tags including:
- type: chase/fall/teeth/water/house...
- symbol_meaning: modern translation of Zhou Gong symbolic meaning
- mood_pattern: emotional pattern (caring about evaluation, afraid of losing control, craving support, etc.)
- trend_hint: reminder direction (should express / should organize / should let go / should adjust rhythm...)
- suggestions: preliminary suggestions

Your task:
- Use 1 paragraph to clarify the dream's symbolic meaning:
  - Based on Zhou Gong dream interpretation system, explain in plain language
  - Like "being pushed forward" / "foundation a bit unstable" / "security adjustment in progress", etc.
  - Use expressions like "seems like... symbol" or "more like... reminder"
- Use 1 paragraph to clarify the mood:
  - From a modern psychological perspective, explain inner concerns, worries, expectations
- Use 1 paragraph to clarify trend reminders:
  - **Must use tone like "more like reminding you of ××" or "seems to remind you ××"**
  - Explain which direction is suitable for adjustment recently
  - **Absolutely forbidden to predict specific events, like "you will encounter ××" or "you will experience ××"**
- Give 2–4 specific suggestions:
  - Write it down / talk to someone / adjust rhythm / give yourself some boundaries / give yourself some room for error

Not allowed:
- Saying "this dream predicts you will experience xx" / "you will encounter ××" / "you will definitely ××"
- Making judgment-style fortune (can say "more like reminding you of xx")
- Predicting specific time, place, person, or event
`.trim();
  }

  // 默认中文
  const basePrompt = buildBaseSystemPrompt(locale);
  
  // 梦境模块局部说明
  const moduleSpecific = `
【梦境模块 · 局部说明】

你拿到的是一份已经规则化好的 DreamArchetype（程序已经帮你分好类型和象）：
`;

  return `${basePrompt}

${moduleSpecific}

- 梦的类型（type）：${archetype.type}

- 象意说明（symbol_meaning）：${archetype.symbol_meaning}

- 心绪模式（mood_pattern）：${archetype.mood_pattern}

- 趋势提醒（trend_hint）：${archetype.trend_hint}

- 规则层建议（suggestions）：${archetype.suggestion_tags.join("；")}

- 象意标签（symbol_tags，内部用，可参考语气，不要原样输出）：${archetype.symbol_tags?.join(" , ") || "无"}

- 情绪标签（emotion_tags，内部用，可参考语气，不要原样输出）：${archetype.emotion_tags?.join(" , ") || "无"}

- 系统标签（systemTags，内部用，你可以参考大方向，不要照抄）：${archetype.systemTags.join(" , ")}

【输出格式】

只输出一段 JSON：

{
  "symbol": "象义说明（一小段）",
  "mood": "心绪说明（一小段）",
  "trend": "趋势提醒（一小段）",
  "suggestions": ["建议1", "建议2", "建议3（可选）"]
}

【输出要求】

1. **symbol（象义说明）**：
   - 这个梦大概在象征什么，用生活化中文说清楚
   - 基于周公解梦象意体系
   - 例如："被追的梦在周公解梦里，多与「有事在催你往前」有关，像是生活中总有一件事在推着你走。"

2. **mood（心绪说明）**：
   - 这个梦反映了当事人怎样的情绪 / 在意点
   - 从心理层面理解
   - 例如："内心对压力和评价都很在意，有一点「不想被落下」的紧绷感。"

3. **trend（趋势提醒）**：
   - 这个梦在提醒当事人近期可以注意什么
   - 趋势提醒：收心/表达/调整/放手 等
   - **必须使用「像是提醒你 ××」「更像是提醒你 ××」的语气，不要预言具体事件**
   - 例如："这是一个提醒，不是坏预兆：该面对的事慢慢面对，不必再一个人硬扛。"
   - 例如："更像是提醒你，最近适合在节奏上做一些调整，不要把自己逼得太紧。"

4. **suggestions（2–3 条行动建议）**：
   - 很具体的小事，不是大道理
   - 可以从作息、饮食、运动、沟通、整理、节奏安排等角度给出
   - 例如："列出最烦的一件事，拆分成小步骤，找人聊聊现状。"

【梦境模块专属补充提示】

你会拿到 DreamArchetype 标签，包括：
- type：追逐/坠落/掉牙/水/房屋…
- symbol_meaning：周公象意的现代转译
- mood_pattern：心绪模式（在意评价、害怕失控、渴望支持 等）
- trend_hint：提醒方向（该表达 / 该整理 / 该放手 / 该调整节奏 …）
- suggestions：初步建议

你的任务：
- 用 1 段话讲清楚梦的象意：
  - 基于周公解梦象意体系，用生活化语言说明
  - 像是「被催着往前走」「底气有点不稳」「安全感调试中」等
  - 使用「像是……的象」「更像是……的提醒」等表述
- 用 1 段话讲清楚心绪：
  - 从现代心理层面理解，说明内在的在意点、担心点、期待点
- 用 1 段话讲清楚趋势提醒：
  - **必须使用「像是提醒你 ××」「更像是提醒你 ××」的语气**
  - 说明最近适合在哪个方向做调整
  - **绝对禁止预言具体事件，如「你会遇到 ××」「你会发生 ××」**
- 给出 2–4 条具体建议：
  - 写下来 / 找人聊 / 调整节奏 / 给自己一点边界 / 给自己一点容错空间

不可：
- 说「这个梦预示你会发生 xx 事」「你将会遇到 ××」「你必然会 ××」
- 下判决式吉凶（可以说"更像是提醒你××"）
- 预言具体的时间、地点、人物、事件

【语气要求】

- 有东方玄学的味道，但不过度吓人；
- 多用"像是……的象""比较像在提醒你……"这种说法；
- 可以适度调侃，但绝不嘲笑用户本人。
`.trim();
}

/**
 * 安全解析梦境 LLM 响应
 */
function safeParseDreamInsight(raw: string, archetype?: DreamArchetype, locale: Locale = "zh"): DreamInsight {
  try {
    const data = JSON.parse(raw);
    const symbol = typeof data.symbol === "string" ? data.symbol : "";
    const mood = typeof data.mood === "string" ? data.mood : "";
    const trend = typeof data.trend === "string" ? data.trend : "";
    const suggestions = Array.isArray(data.suggestions)
      ? data.suggestions.filter((s: unknown) => typeof s === "string")
      : [];

    if (!symbol && !mood && !trend && suggestions.length === 0) {
      throw new Error("empty dream insight");
    }

    return { symbol, mood, trend, suggestions };
  } catch {
    // Fallback：使用 archetype 字段生成兜底结果
    if (archetype) {
      return {
        symbol: archetype.symbol_meaning || (locale === "zh" ? "梦境提醒你放慢节奏、留意内心。" : "Dream nudges you to slow down and listen inward."),
        mood: archetype.mood_pattern || (locale === "zh" ? "心绪需要被理解与安放。" : "Mood craves understanding and gentle pacing."),
        trend: archetype.trend_hint || (locale === "zh" ? "适合整理思绪、温柔推进。" : "Good for gentle sorting and paced progress."),
        suggestions: archetype.suggestion_tags.length > 0
          ? archetype.suggestion_tags.slice(0, 3)
          : locale === "zh"
            ? ["写下梦境片段", "和信任的人分享感受", "早点休息补充能量"]
            : ["Write down fragments", "Share with someone you trust", "Rest a little earlier tonight"],
      };
    }
    
    // 如果没有 archetype，使用非常保守的默认文案
    return {
      symbol: locale === "zh" ? "这个梦更像是你最近所思所想的一次混合放映，不必过度紧张。" : "This dream seems more like a mixed replay of your recent thoughts, no need to overthink.",
      mood: locale === "zh" ? "说明你心里装的事情比较多，大脑在睡觉时还在帮你「后台整理」。" : "Suggests you have a lot on your mind, your brain is still doing 'background processing' while you sleep.",
      trend: locale === "zh" ? "提醒你照顾好基本作息和情绪，不要把自己逼得太满。" : "Reminds you to take care of basic routines and emotions, don't push yourself too hard.",
      suggestions: locale === "zh"
        ? [
            "睡前少刷一点刺激的信息，给大脑留一点关机时间。",
            "可以简单记一记最近的梦，把感受写下来，我可以给你更好的建议。",
          ]
        : [
            "Reduce stimulating information before bed, give your brain some shutdown time.",
            "Simply note down recent dreams and feelings, I can give you better suggestions.",
          ],
    };
  }
}

/**
 * 构建气运系统提示词
 */
function buildQiRhythmSystemPrompt(
  locale: Locale,
  solarTermName: string,
  index: number,
  tag: string,
  yi: string[],
  ji: string[],
  palmInsight: PalmInsight,
  tongueInsight: TongueInsight,
  dreamInsight: DreamInsight,
  trendText?: string,
): string {
  const basePrompt = buildBaseSystemPrompt(locale);
  
  // 提取 Palm/Tongue/Dream 的关键信息
  const palmSummary = Array.isArray(palmInsight.summary) 
    ? palmInsight.summary.join(" ") 
    : palmInsight.summary || "";
  const tongueSummary = typeof tongueInsight.summary === "string" 
    ? tongueInsight.summary 
    : "";
  const dreamSymbol = dreamInsight.symbol || "";
  const dreamMood = dreamInsight.mood || "";
  
  // 气运模块局部说明
  const moduleSpecific = locale === "en" ? `
【Qi Rhythm-Specific Tags】
You receive QiRhythm tags including:
- solarTerm: ${solarTermName}
- yi (auspicious): ${yi.join(", ") || "none"}
- ji (avoid): ${ji.join(", ") || "none"}
- index: ${index} (0–100 daily qi value)
- tag: ${tag} (e.g., "steady progress" / "focus inward & accumulate" / "light pressure adjustment")
- trendText: ${trendText || "not specified"}

【Integrated Context from Palm/Tongue/Dream】
- Palm Insight: ${palmSummary || "not available"}
- Tongue Insight: ${tongueSummary || "not available"}
- Dream Insight: ${dreamSymbol ? `Symbol: ${dreamSymbol}` : ""} ${dreamMood ? `Mood: ${dreamMood}` : ""}${!dreamSymbol && !dreamMood ? "not available" : ""}

**Important**: You should synthesize the solar term + auspicious/avoid + Palm/Tongue/Dream states to generate a comprehensive qi rhythm interpretation.

【Output Format】

Output JSON only:

{
  "summary": "1–3 sentences describing today's qi baseline",
  "trend": "one paragraph explaining rhythm differences throughout the day",
  "advice": ["advice1", "advice2", "advice3", "advice4 (optional)", "advice5 (optional)"]
}

【Output Requirements】

1. **summary (1–3 sentences)**:
   - Describe today's qi baseline tone
   - Example: "Overall a steady-with-rise day, suitable for stabilizing first then advancing."

2. **trend (one paragraph)**:
   - Translate solar terms + auspicious/avoid into life language
   - Clearly state rhythm differences for morning / afternoon / evening
   - What's suitable for morning, what for afternoon, what for evening

3. **advice (3–5 specific arrangements)**:
   - Unit: "today"
   - Example: "Today is suitable for wrapping up unfinished tasks" / "suitable for planning rather than large-scale changes"

【Qi Rhythm Module Specific Guidance】

You receive QiRhythm tags including:
- solarTerm: solar term
- yi / ji: auspicious / avoid (already organized as verbs)
- index: 0–100 daily qi value
- tag: like "steady progress" / "focus inward & accumulate" / "light pressure adjustment"
- trendText: rhythm text for morning / afternoon / evening
- advice: preliminary suggestion list

Your task:
- Use 1–3 sentences to describe today's qi baseline:
  - Like "Overall a steady-with-rise day, suitable for stabilizing first then advancing."
- Translate solar terms + auspicious/avoid into life language:
  - Auspicious: organize, communicate, gentle progress, review, learn...
  - Avoid: impulsive decisions, sudden major actions, emotional spending...
- Clearly state morning / afternoon / evening rhythm differences:
  - What's suitable for morning, what for afternoon, what for evening
- 3–5 specific arrangements, unit: "today"
  - Like "Today is suitable for wrapping up unfinished tasks" / "suitable for planning rather than large-scale changes"
` : `
【气运模块 · 局部说明】

你收到的是一份已经规则化的气运标签（由程序算好，不需要你再推理）：

【气运标签】
- 节气（solarTerm）：${solarTermName}
- 宜（yi）：${yi.join("、") || "无"}
- 忌（ji）：${ji.join("、") || "无"}
- 指数（index）：${index}（0–100 的当日气机值）
- 标签（tag）：${tag}（如「稳中求进」「收心蓄力」「轻压调节」）
- 趋势文本（trendText）：${trendText || "未指定"}

【综合上下文（掌纹/舌苔/梦境）】
- 掌纹洞察：${palmSummary || "无"}
- 舌苔洞察：${tongueSummary || "无"}
- 梦境洞察：${dreamSymbol ? `象意：${dreamSymbol}` : ""} ${dreamMood ? `心绪：${dreamMood}` : ""}${!dreamSymbol && !dreamMood ? "无" : ""}

**重要**：你需要综合节气 + 宜忌 + 掌纹/舌苔/梦境状态，生成综合的气运解读。

【输出格式】

输出一段 JSON，格式如下：
{
  "summary": "1–3 句描述今日运势基调",
  "trend": "一段话解释全天节奏差异",
  "advice": ["建议1", "建议2", "建议3", "建议4（可选）", "建议5（可选）"]
}

【输出要求】

1. **summary（1–3 句）**：
   - 描述今日运势基调
   - 例如：「整体是一个稳中带升、适合先稳再进的一天。」

2. **trend（一段话）**：
   - 把节气 + 宜忌翻译成生活语言
   - 明确上午 / 下午 / 晚上的节奏差异
   - 上午适合做什么、下午适合什么、晚上适合什么

3. **advice（3–5 条具体安排）**：
   - 以"今天"为单位
   - 例如：「今天适合把未尽的事收一收」「适合做计划而不是大规模折腾」

【气运模块专属补充提示】

你会拿到 QiRhythm 标签，包括：
- solarTerm：节气
- yi / ji：宜 / 忌（已经按动词整理）
- index：0–100 的当日气机值
- tag：如「稳中求进」「收心蓄力」「轻压调节」
- trendText：上午 / 下午 / 晚上的节奏文字
- advice：初步建议列表

你的任务：
- 用 1–3 句描述今日运势基调：
  - 比如「整体是一个稳中带升、适合先稳再进的一天。」
- 把节气 + 宜忌翻译成生活语言：
  - 宜：整理、沟通、温和推进、复盘、学习…
  - 忌：冲动决策、临时大动作、情绪化消费…
- 明确上午 / 下午 / 晚上的节奏差异：
  - 上午适合做什么、下午适合什么、晚上适合什么
- 建议 3–5 条具体安排，以"今天"为单位
  - 如「今天适合把未尽的事收一收」「适合做计划而不是大规模折腾」
`;

  return `${basePrompt}

${moduleSpecific}
`.trim();
}

/**
 * 使用 LLM 解读梦境
 */
export async function interpretDreamWithLLM(
  locale: Locale,
  dreamText: string,
): Promise<DreamInsight> {
  // 1）先用规则引擎从文本构建 DreamArchetype
  const archetype: DreamArchetype = buildDreamArchetype({ text: dreamText });

  // 2）构建系统提示词
  const system = buildDreamSystemPrompt(locale, archetype);

  // 3）将 archetype 作为 JSON 传给 user
  const user = JSON.stringify(archetype);

  // 4）调用 LLM 代理
  try {
    const raw = await callLLMViaProxy({ system, user });
    return safeParseDreamInsight(raw, archetype, locale);
  } catch (error) {
    console.error("[LLM Service] interpretDreamWithLLM failed:", error);
    // 出错时返回基于规则的兜底结果
    return {
      symbol: archetype.symbol_meaning || (locale === "zh" ? "梦境提醒你放慢节奏、留意内心。" : "Dream nudges you to slow down and listen inward."),
      mood: archetype.mood_pattern || (locale === "zh" ? "心绪需要被理解与安放。" : "Mood craves understanding and gentle pacing."),
      trend: archetype.trend_hint || (locale === "zh" ? "适合整理思绪、温柔推进。" : "Good for gentle sorting and paced progress."),
      suggestions: archetype.suggestion_tags.length > 0
        ? archetype.suggestion_tags.slice(0, 3)
        : locale === "zh"
          ? ["写下梦境片段", "和信任的人分享感受", "早点休息补充能量"]
          : ["Write down fragments", "Share with someone you trust", "Rest a little earlier tonight"],
    };
  }
}

export function interpretConstitutionWithLLM(
  palmInsight: PalmInsight,
  tongueInsight: TongueInsight,
  dreamInsight: DreamInsight,
  locale: Locale,
): ConstitutionInsight {
  // 将新的 summary 数组合并为字符串用于评分
  const palmSummaryText = palmInsight.summary.join(" ");
  const tongueSummaryText = typeof tongueInsight.summary === "string"
    ? tongueInsight.summary
    : "";
  const score =
    (scoreSentence(palmSummaryText) +
      scoreSentence(tongueSummaryText) +
      scoreSentence(dreamInsight.mood)) / 3;

  let constitution: ConstitutionInsight = DEFAULT_CONSTITUTION;
  if (score < 45) {
    constitution = {
      constitution_type: "mild_fatigue",
      description_paragraphs: [
        locale === "zh"
          ? "整体有轻疲劳感，需要更规律的作息与补水。"
          : "Energy feels a bit drained—lean on steady routines and hydration.",
      ],
      constitution_advice:
        locale === "zh"
          ? ["午后放慢节奏", "多喝温水、少冰饮", "早点休息"]
          : ["Slow down afternoons", "Sip warm water, skip iced drinks", "Head to bed earlier"],
    };
  } else if (score > 70) {
    constitution = {
      constitution_type: "qi_flow_free",
      description_paragraphs: [
        locale === "zh"
          ? "气机流动感不错，可以顺势推进计划。"
          : "Qi flow feels smooth—it's a good window to push plans.",
      ],
      constitution_advice:
        locale === "zh"
          ? ["保持运动频率", "用好灵感、快速记录", "别一次性消耗过度"]
          : ["Maintain light exercise", "Capture inspirations quickly", "Don't burn out in one sprint"],
    };
  }

  if (!CONSTITUTION_TYPES.includes(constitution.constitution_type)) {
    constitution = DEFAULT_CONSTITUTION;
  }

  return constitution;
}

/**
 * 安全解析气运 LLM 响应
 */
function safeParseQiRhythmInsight(
  raw: string,
  solarTermName: string,
  index: number,
  tag: string,
  yi: string[],
  ji: string[],
  locale: Locale = "zh",
): QiRhythmInsight {
  try {
    const data = JSON.parse(raw);
    const summary = typeof data.summary === "string" ? data.summary : "";
    const trend = typeof data.trend === "string" ? data.trend : "";
    const advice = Array.isArray(data.advice)
      ? data.advice.filter((a: unknown) => typeof a === "string")
      : [];

    if (!summary && !trend && advice.length === 0) {
      throw new Error("empty qi rhythm insight");
    }

    return { summary, trend, advice };
  } catch {
    // Fallback：使用传入的参数生成兜底结果
    const fallbackSummary = locale === "zh"
      ? `节气「${solarTermName}」，指数 ${index}，整体氛围「${tag}」，掌纹和舌象都提醒今天要利用节奏感。`
      : `Solar term "${solarTermName}", index ${index}, tone "${tag}". Palms and tongue both nudge you to lean on rhythm today.`;

    const fallbackTrend = locale === "zh"
      ? yi.length > 0 || ji.length > 0
        ? `今天${yi.length > 0 ? `适合${yi.slice(0, 2).join("、")}` : ""}${ji.length > 0 ? `，避免${ji.slice(0, 2).join("、")}` : ""}。上午稳扎稳打，下午适合沟通推进，晚上留白慢慢收心。`
        : "上午稳扎稳打，下午适合沟通推进，晚上留白慢慢收心。"
      : yi.length > 0 || ji.length > 0
        ? `Today ${yi.length > 0 ? `favors ${yi.slice(0, 2).join(", ")}` : ""}${ji.length > 0 ? `, avoid ${ji.slice(0, 2).join(", ")}` : ""}. Keep mornings grounded, use afternoons for conversations, and leave space tonight to unwind.`
        : "Keep mornings grounded, use afternoons for conversations, and leave space tonight to unwind.";

    const fallbackAdvice = locale === "zh"
      ? [
          "把重点安排在精力最足的时段",
          "喝温水、保持胃气轻松",
          "晚上留一点无安排的时间",
        ]
      : [
          "Schedule key tasks during peak focus",
          "Sip warm water to keep digestion light",
          "Leave a margin of unscheduled time tonight",
        ];

    return {
      summary: fallbackSummary,
      trend: fallbackTrend,
      advice: fallbackAdvice,
    };
  }
}

/**
 * 气运节奏 Pattern 类型
 */
type QiRhythmPattern = {
  solarTermName: string;
  index: number;
  tag: string;
  yi: string[];
  ji: string[];
  trendText?: string;
  palmInsight: PalmInsight;
  tongueInsight: TongueInsight;
  dreamInsight: DreamInsight;
};

/**
 * 使用 LLM 解读气运
 */
export async function interpretQiRhythmWithLLM(
  palmInsight: PalmInsight,
  tongueInsight: TongueInsight,
  dreamInsight: DreamInsight,
  solarTermName: string,
  index: number,
  tag: string,
  yi: string[],
  ji: string[],
  trendText?: string,
  locale: Locale = "zh",
): Promise<QiRhythmInsight> {
  // 1) 构建 pattern 对象
  const pattern: QiRhythmPattern = {
    solarTermName,
    index,
    tag,
    yi,
    ji,
    trendText,
    palmInsight,
    tongueInsight,
    dreamInsight,
  };

  // 2) 构建系统提示词
  const system = buildQiRhythmSystemPrompt(
    locale,
    solarTermName,
    index,
    tag,
    yi,
    ji,
    palmInsight,
    tongueInsight,
    dreamInsight,
    trendText,
  );

  // 3) 将 pattern 作为 JSON 传给 user
  const user = JSON.stringify(pattern);

  // 4) 调用 LLM 代理
  try {
    const raw = await callLLMViaProxy({ system, user });
    return safeParseQiRhythmInsight(raw, solarTermName, index, tag, yi, ji, locale);
  } catch (error) {
    console.error("[LLM Service] interpretQiRhythmWithLLM failed:", error);
    // 出错时返回基于规则的兜底结果
    return safeParseQiRhythmInsight("", solarTermName, index, tag, yi, ji, locale);
  }
}

function buildPalmAdvice(archetype: PalmArchetype, locale: Locale): string[] {
  if (locale === "zh") {
    return [
      archetype.career_trend ? `事业：${archetype.career_trend}` : "处理任务先聚焦主线",
      archetype.relationship_trend ? `关系：${archetype.relationship_trend}` : "与亲近的人分享近况",
      archetype.palm_color_signal ? `气色：${archetype.palm_color_signal}` : "喝温水，别一次性冲太久",
    ];
  }
  return [
    archetype.career_trend ? `Career: ${archetype.career_trend}` : "Lead with the top task",
    archetype.relationship_trend ? `Relationships: ${archetype.relationship_trend}` : "Share your state with someone close",
    archetype.palm_color_signal ? `Color hint: ${archetype.palm_color_signal}` : "Sip something warm before sprinting",
  ];
}

function scoreSentence(input: string | undefined): number {
  if (!input) return 55;
  if (/[疲倦|low|tired|弱]/i.test(input)) return 40;
  if (/[轻松|flow|顺|bright]/i.test(input)) return 75;
  return 60;
}

