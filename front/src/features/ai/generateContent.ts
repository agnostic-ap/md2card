export type Provider = 'anthropic' | 'openai' | 'doubao' | 'qianwen'
export type GenerateMode = 'api-key' | 'local'

export type ProviderConfig = {
  id: Provider
  label: string
  endpoint: string
  models: { value: string; label: string }[]
  keyPlaceholder: string
  keyGuideUrl: string
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    label: 'Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5（快速）' },
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6（推荐）' },
    ],
    keyPlaceholder: 'sk-ant-...',
    keyGuideUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o mini（快速）' },
      { value: 'gpt-4o', label: 'GPT-4o（推荐）' },
    ],
    keyPlaceholder: 'sk-...',
    keyGuideUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'doubao',
    label: '豆包',
    endpoint: 'https://ark.volces.com/api/v3/chat/completions',
    models: [
      { value: 'doubao-lite-32k', label: 'Lite 32K（快速）' },
      { value: 'doubao-pro-32k', label: 'Pro 32K（推荐）' },
    ],
    keyPlaceholder: 'API Key...',
    keyGuideUrl: 'https://console.volcengine.com/ark',
  },
  {
    id: 'qianwen',
    label: '千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: [
      { value: 'qwen-turbo', label: 'Turbo（快速）' },
      { value: 'qwen-plus', label: 'Plus（推荐）' },
      { value: 'qwen-max', label: 'Max（最强）' },
    ],
    keyPlaceholder: 'sk-...',
    keyGuideUrl: 'https://bailian.console.aliyun.com/',
  },
]

export function getProvider(id: Provider): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id)!
}

// ── Prompt templates ─────────────────────────────────────────────────────────

export type PromptTemplate = {
  id: string
  label: string
  prompt: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'card-general',
    label: '通用卡片',
    prompt: `你是专业内容创作者，把知识点整理为结构清晰的图文卡片内容。

规则：
- 每张卡片以 # 标题 开头，内容简洁重点突出
- 用 === 单独一行分隔每张卡片
- 每张卡片不超过 300 字
- 直接输出 Markdown，不要输出任何解释或前言`,
  },
  {
    id: 'concept-explain',
    label: '概念解析',
    prompt: `你擅长深入浅出讲解概念。针对用户的输入，生成多张解析卡片：

- 第一张：是什么（简洁定义）
- 第二张：为什么（核心原理）
- 第三张：怎么用（实际示例）
- 最后一张：要点总结

每张以 # 标题 开头，用 === 单独成行分隔，直接输出 Markdown。`,
  },
  {
    id: 'knowledge-summary',
    label: '知识总结',
    prompt: `你擅长将复杂内容提炼成精华要点。将用户的主题整理为卡片式知识总结：

- 每张卡片聚焦一个核心要点
- 使用简洁标题、列表和加粗强调
- 最后一张给出实践建议或总结

每张以 # 标题 开头，用 === 单独成行分隔，直接输出 Markdown。`,
  },
  {
    id: 'interview-qa',
    label: '面试问答',
    prompt: `你是专业双语（中英）技术内容创作者。根据面试题生成结构化图文卡片：

- 第1张：题目 + 高分回答逻辑框架（中英双语）
- 第2-N张：双语回答卡（每卡2条：英文句 + 中文翻译，用 --- 分隔两条）
- 最后：核心词汇解析卡（每卡2个词汇）

每张以 # 卡片系列 开头，用 === 单独成行分隔，不输出结构说明文字，直接输出 Markdown。`,
  },
]

export const DEFAULT_TEMPLATE_ID = 'card-general'

/** Detect which template the current prompt matches (or 'custom' if none). */
export function detectTemplateId(prompt: string): string {
  const trimmed = prompt.trim()
  for (const t of PROMPT_TEMPLATES) {
    if (trimmed === t.prompt.trim()) return t.id
  }
  return 'custom'
}

// ── Generate options ──────────────────────────────────────────────────────────

export type GenerateOptions = {
  mode: GenerateMode
  provider: Provider
  apiKey?: string
  systemPrompt: string
  question: string
  model?: string
}

// ── API call implementations ──────────────────────────────────────────────────

async function callAnthropic(opts: GenerateOptions): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model ?? 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.question }],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message ?? `HTTP ${response.status}`
    throw new Error(msg)
  }
  const data = (await response.json()) as { content: Array<{ type: string; text: string }> }
  return (data.content.find((b) => b.type === 'text')?.text ?? '').trim()
}

async function callOpenAICompat(opts: GenerateOptions): Promise<string> {
  const provider = getProvider(opts.provider)
  const model = opts.model ?? provider.models[0]!.value
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey!}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.question },
      ],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message ?? `HTTP ${response.status}`
    throw new Error(msg)
  }
  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return (data.choices[0]?.message?.content ?? '').trim()
}

async function generateViaLocalProxy(opts: GenerateOptions): Promise<string> {
  const modelAlias = opts.model?.includes('haiku')
    ? 'haiku'
    : opts.model?.includes('opus')
    ? 'opus'
    : 'sonnet'
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: opts.question,
      systemPrompt: opts.systemPrompt,
      model: modelAlias,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: string })?.error ?? `HTTP ${response.status}`
    throw new Error(msg)
  }
  const data = (await response.json()) as { text: string }
  return (data.text ?? '').trim()
}

export async function checkProxyHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('/api/health', { signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

export async function generateContent(opts: GenerateOptions): Promise<string> {
  if (opts.mode === 'local') return generateViaLocalProxy(opts)
  if (opts.provider === 'anthropic') return callAnthropic(opts)
  return callOpenAICompat(opts)
}
