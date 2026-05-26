import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import { useEditor, useEditorViewBridge } from '@/state/EditorContext'
import { replaceDoc } from '@/features/editor/markdownInsert'
import {
  checkProxyHealth,
  generateContent,
  PROVIDERS,
  PROMPT_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  type Provider,
  type GenerateMode,
} from '@/features/ai/generateContent'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ManagedTemplate } from '@/features/ai/types'
import { useWorkspaceSync } from '@/state/WorkspaceSync'

// ── Types ─────────────────────────────────────────────────────────────────────

type DialogView = 'main' | 'templates' | 'edit'

// ── Storage keys ──────────────────────────────────────────────────────────────

const S = {
  mode:        'md2card_generate_mode',
  provider:    'md2card_provider',
  apiKey:      (p: Provider) => `md2card_apikey_${p}`,
  model:       (p: Provider) => `md2card_model_${p}`,
  localModel:  'md2card_local_model',
  sysPrompt:   'md2card_system_prompt',
  activeTempl: 'md2card_active_template',
  templates:   'md2card_ai_templates',
}

const LOCAL_MODELS = [
  { value: 'haiku',  label: 'Haiku（快速）' },
  { value: 'sonnet', label: 'Sonnet（推荐）' },
  { value: 'opus',   label: 'Opus（最强）' },
]

const ALL_PROVIDERS = (['anthropic', 'openai', 'doubao', 'qianwen'] as const)

// ── Template storage helpers ──────────────────────────────────────────────────

function getBuiltinTemplates(): ManagedTemplate[] {
  return PROMPT_TEMPLATES.map((t) => ({ ...t, builtin: true }))
}

function loadTemplates(): ManagedTemplate[] {
  try {
    const raw = localStorage.getItem(S.templates)
    if (raw) return JSON.parse(raw) as ManagedTemplate[]
  } catch {
    return getBuiltinTemplates()
  }
  return getBuiltinTemplates()
}

function persistTemplates(list: ManagedTemplate[]): void {
  localStorage.setItem(S.templates, JSON.stringify(list))
}

const genId = () => Math.random().toString(36).slice(2, 9)

// First non-empty line of a prompt, used as fallback description
function promptHint(prompt: string): string {
  return (prompt.split('\n').find((l) => l.trim()) ?? '').slice(0, 60)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiGenerateDialog() {
  const { dispatch } = useEditor()
  const { view: editorView } = useEditorViewBridge()
  const { cloudTemplates, pushTemplates } = useWorkspaceSync()

  const [open, setOpen] = useState(false)
  const [dialogView, setDialogView] = useState<DialogView>('main')

  // Template state
  const [templates, setTemplates] = useState<ManagedTemplate[]>(getBuiltinTemplates)
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  const [editTarget, setEditTarget] = useState<ManagedTemplate | null>(null)
  const [editName, setEditName] = useState('')
  const [editPromptText, setEditPromptText] = useState('')

  // AI settings
  const [mode, setMode] = useState<GenerateMode>('api-key')
  const [provider, setProvider] = useState<Provider>('anthropic')
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    anthropic: '', openai: '', doubao: '', qianwen: '',
  })
  const [apiModels, setApiModels] = useState<Record<Provider, string>>({
    anthropic: '', openai: '', doubao: '', qianwen: '',
  })
  const [localModel, setLocalModel] = useState('sonnet')
  const [showKey, setShowKey] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // The actual system prompt sent to the API
  const [systemPrompt, setSystemPrompt] = useState('')

  // Generation
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')

  const questionRef = useRef<HTMLTextAreaElement>(null)
  const editNameRef = useRef<HTMLInputElement>(null)

  // Global shortcut ⌘⇧A / Ctrl⇧A to open the dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const checkProxy = useCallback(async () => {
    setProxyStatus('checking')
    const ok = await checkProxyHealth()
    setProxyStatus(ok ? 'ok' : 'error')
  }, [])

  // Load persisted settings when dialog opens
  useEffect(() => {
    if (!open) {
      setProxyStatus('idle')
      return
    }

    // Prefer cloud templates (if loaded); fall back to localStorage
    const loaded = (cloudTemplates !== null && cloudTemplates.length > 0)
      ? cloudTemplates
      : loadTemplates()
    setTemplates(loaded)
    setDialogView('main')

    const lastId = localStorage.getItem(S.activeTempl) ?? DEFAULT_TEMPLATE_ID
    const active = loaded.find((t) => t.id === lastId) ?? loaded[0]!
    setSelectedTemplateId(active.id)
    setSystemPrompt(localStorage.getItem(S.sysPrompt) ?? active.prompt)

    setMode((localStorage.getItem(S.mode) ?? 'api-key') as GenerateMode)
    setProvider((localStorage.getItem(S.provider) ?? 'anthropic') as Provider)
    setApiKeys({
      anthropic: localStorage.getItem(S.apiKey('anthropic')) ?? '',
      openai:    localStorage.getItem(S.apiKey('openai'))    ?? '',
      doubao:    localStorage.getItem(S.apiKey('doubao'))    ?? '',
      qianwen:   localStorage.getItem(S.apiKey('qianwen'))   ?? '',
    })
    setApiModels({
      anthropic: localStorage.getItem(S.model('anthropic')) ?? '',
      openai:    localStorage.getItem(S.model('openai'))    ?? '',
      doubao:    localStorage.getItem(S.model('doubao'))    ?? '',
      qianwen:   localStorage.getItem(S.model('qianwen'))   ?? '',
    })
    setLocalModel(localStorage.getItem(S.localModel) ?? 'sonnet')
    setError('')

    let cancelled = false
    if ((localStorage.getItem(S.mode) ?? 'api-key') === 'local') {
      setProxyStatus('checking')
      checkProxyHealth().then((ok) => {
        if (!cancelled) setProxyStatus(ok ? 'ok' : 'error')
      })
    }
    const focusTimer = setTimeout(() => questionRef.current?.focus(), 80)
    return () => {
      cancelled = true
      clearTimeout(focusTimer)
    }
  }, [open, cloudTemplates])

  // Derived values
  const providerCfg   = PROVIDERS.find((p) => p.id === provider)!
  const currentApiKey = apiKeys[provider]
  const currentModel  = apiModels[provider] || providerCfg.models[1]?.value || providerCfg.models[0]!.value
  const activeTempl   = templates.find((t) => t.id === selectedTemplateId)

  function selectTemplate(t: ManagedTemplate) {
    setSelectedTemplateId(t.id)
    setSystemPrompt(t.prompt)
    localStorage.setItem(S.activeTempl, t.id)
    localStorage.setItem(S.sysPrompt, t.prompt)
  }

  // ── Template CRUD ─────────────────────────────────────────────────────────

  function openNewTemplate() {
    setEditTarget({ id: genId(), label: '', prompt: '' })
    setEditName('')
    setEditPromptText('')
    setDialogView('edit')
    setTimeout(() => editNameRef.current?.focus(), 50)
  }

  function openEditTemplate(t: ManagedTemplate) {
    setEditTarget(t)
    setEditName(t.label)
    setEditPromptText(t.prompt)
    setDialogView('edit')
    setTimeout(() => editNameRef.current?.focus(), 50)
  }

  function saveEditTemplate() {
    if (!editTarget) return
    const isNew = !templates.find((t) => t.id === editTarget.id)
    const saved: ManagedTemplate = {
      ...editTarget,
      label: editName.trim() || '未命名',
      prompt: editPromptText,
    }
    const updated = isNew
      ? [...templates, saved]
      : templates.map((t) => (t.id === saved.id ? saved : t))

    setTemplates(updated)
    persistTemplates(updated)
    pushTemplates(updated)

    // Keep active template prompt in sync if it was edited
    if (!isNew && saved.id === selectedTemplateId) {
      setSystemPrompt(saved.prompt)
      localStorage.setItem(S.sysPrompt, saved.prompt)
    }
    setDialogView('templates')
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id)
    setTemplates(updated)
    persistTemplates(updated)
    pushTemplates(updated)
    if (id === selectedTemplateId && updated.length > 0) {
      selectTemplate(updated[0]!)
    }
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (mode === 'api-key' && !currentApiKey.trim()) {
      setError(`请先填写 ${providerCfg.label} API Key（展开"AI 设置"进行配置）`)
      return
    }
    if (!question.trim()) {
      setError('请输入想生成的主题或内容')
      return
    }
    if (!systemPrompt.trim()) {
      setError('请选择一个模板，或在"AI 设置"中填写提示词')
      return
    }
    if (mode === 'local') {
      if (proxyStatus === 'error') {
        setError('本地代理未启动，请先在另一个终端运行 npm run proxy')
        return
      }
      if (proxyStatus !== 'ok') {
        setProxyStatus('checking')
        const ok = await checkProxyHealth()
        setProxyStatus(ok ? 'ok' : 'error')
        if (!ok) { setError('无法连接本地代理'); return }
      }
    }

    setError('')
    setLoading(true)
    localStorage.setItem(S.mode, mode)
    localStorage.setItem(S.provider, provider)
    localStorage.setItem(S.sysPrompt, systemPrompt)
    if (mode === 'api-key') {
      localStorage.setItem(S.apiKey(provider), currentApiKey.trim())
      localStorage.setItem(S.model(provider), currentModel)
    } else {
      localStorage.setItem(S.localModel, localModel)
    }

    trackEvent('ai_generate', { mode, provider })
    try {
      const result = await generateContent({
        mode,
        provider,
        apiKey: currentApiKey.trim(),
        systemPrompt,
        question: question.trim(),
        model: mode === 'local' ? localModel : currentModel,
      })
      if (editorView) {
        replaceDoc(editorView, result)
      } else {
        dispatch({ type: 'setMarkdown', payload: result })
      }
      setOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试'
      const isCors = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('cors')
      setError(
        isCors
          ? `请求被跨域拦截。${providerCfg.label} 可能不支持浏览器直接调用，建议改用本地代理模式。`
          : msg,
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="AI 生成 ⌘⇧A"
          className="h-8 gap-1.5 px-2 text-xs text-(--accent-ui) border-(--accent-ui)/40 hover:bg-(--accent-ui)/10"
        >
          <Sparkles className="size-3.5" />
          AI 生成
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-y-auto">
        {/* ── Header (changes by view) ── */}
        <DialogHeader className="shrink-0">
          {dialogView === 'main' && (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="size-4 text-(--accent-ui)" />
                AI 生成卡片内容
              </DialogTitle>
              <DialogDescription>
                选择模板，输入主题，一键生成图文卡片内容。
              </DialogDescription>
            </>
          )}
          {dialogView === 'templates' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDialogView('main')}
                className="flex items-center gap-1 text-sm text-(--muted-foreground) hover:text-(--foreground)"
              >
                <ArrowLeft className="size-4" />
                返回
              </button>
              <DialogTitle className="text-base">管理模板</DialogTitle>
            </div>
          )}
          {dialogView === 'edit' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDialogView('templates')}
                className="flex items-center gap-1 text-sm text-(--muted-foreground) hover:text-(--foreground)"
              >
                <ArrowLeft className="size-4" />
                返回
              </button>
              <DialogTitle className="text-base">
                {templates.find((t) => t.id === editTarget?.id) ? '编辑模板' : '新增模板'}
              </DialogTitle>
            </div>
          )}
        </DialogHeader>

        {/* ════════════════════════════════════════════════════════════════════
            MAIN VIEW
            ════════════════════════════════════════════════════════════════════ */}
        {dialogView === 'main' && (
          <div className="mt-4 space-y-5">

            {/* Template selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>模板</Label>
                <button
                  type="button"
                  onClick={() => setDialogView('templates')}
                  className="flex items-center gap-1 text-xs text-(--muted-foreground) hover:text-(--foreground)"
                >
                  <Pencil className="size-3" />
                  管理
                </button>
              </div>
              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedTemplateId === t.id
                        ? 'border-(--accent-ui) bg-(--accent-ui)/10 text-(--accent-ui)'
                        : 'border-(--border) text-(--muted-foreground) hover:border-(--accent-ui)/50 hover:text-(--foreground)',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {/* Description of selected template */}
              {activeTempl && (
                <p className="text-[11px] text-(--muted-foreground)">
                  {promptHint(activeTempl.prompt)}
                </p>
              )}
            </div>

            {/* Topic input */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <Label htmlFor="ai-question">主题</Label>
                <span className="text-[11px] text-(--muted-foreground)">
                  AI 将按照上方模板格式，围绕这里输入的主题生成内容
                </span>
              </div>
              <textarea
                ref={questionRef}
                id="ai-question"
                rows={4}
                placeholder="例：用简单语言解释 Event Loop 的工作原理"
                className="flex w-full resize-none rounded-md border border-(--border) bg-transparent px-3 py-2 text-sm text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--accent-ui)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleGenerate()
                }}
              />
              <p className="text-[11px] text-(--muted-foreground)">可以是英文或中文，⌘Enter 快速生成。</p>
            </div>

            {/* AI Settings (collapsible) */}
            <div className="rounded-lg border border-(--border)/70">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-(--foreground)">
                  <Settings2 className="size-3.5 text-(--muted-foreground)" />
                  AI 设置
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-(--muted-foreground)">
                  {mode === 'local'
                    ? `本地 Claude · ${LOCAL_MODELS.find((m) => m.value === localModel)?.label ?? localModel}`
                    : `${providerCfg.label} · ${providerCfg.models.find((m) => m.value === currentModel)?.label ?? currentModel}`}
                  <ChevronDown className={cn('size-3.5 shrink-0 transition-transform duration-200', settingsOpen && 'rotate-180')} />
                </span>
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                style={{ gridTemplateRows: settingsOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="space-y-4 border-t border-(--border)/70 px-3 pb-3 pt-3">

                    {/* Mode */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-(--border) p-1">
                      <button type="button" onClick={() => setMode('api-key')}
                        className={cn('flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                          mode === 'api-key' ? 'bg-(--accent-ui) text-white' : 'text-(--muted-foreground) hover:text-(--foreground)')}>
                        <Sparkles className="size-3" />API Key
                      </button>
                      <button type="button" onClick={() => { setMode('local'); setError(''); checkProxy() }}
                        className={cn('flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                          mode === 'local' ? 'bg-(--accent-ui) text-white' : 'text-(--muted-foreground) hover:text-(--foreground)')}>
                        <Monitor className="size-3" />本地 Claude Code
                      </button>
                    </div>

                    {mode === 'api-key' ? (
                      <div className="space-y-3">
                        {/* Provider */}
                        <div className="grid grid-cols-4 gap-1 rounded-lg border border-(--border) p-1">
                          {ALL_PROVIDERS.map((pid) => {
                            const pc = PROVIDERS.find((p) => p.id === pid)!
                            return (
                              <button key={pid} type="button"
                                onClick={() => { setProvider(pid); setShowKey(false) }}
                                className={cn('rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                                  provider === pid ? 'bg-(--accent-ui) text-white' : 'text-(--muted-foreground) hover:text-(--foreground)')}>
                                {pc.label}
                              </button>
                            )
                          })}
                        </div>
                        {/* Key */}
                        <div className="space-y-1.5">
                          <Label htmlFor="ai-api-key" className="text-xs">
                            {providerCfg.label} API Key
                            <a href={providerCfg.keyGuideUrl} target="_blank" rel="noreferrer"
                              className="ml-2 text-[11px] text-(--accent-ui) hover:underline">
                              获取 Key →
                            </a>
                          </Label>
                          <div className="relative flex items-center">
                            <input id="ai-api-key" type={showKey ? 'text' : 'password'}
                              placeholder={providerCfg.keyPlaceholder}
                              className="flex h-8 w-full rounded-md border border-(--border) bg-transparent px-3 pr-9 font-mono text-xs text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--accent-ui)"
                              value={currentApiKey}
                              onChange={(e) => setApiKeys((k) => ({ ...k, [provider]: e.target.value }))}
                            />
                            <button type="button" tabIndex={-1}
                              className="absolute right-2.5 text-(--muted-foreground) hover:text-(--foreground)"
                              onClick={() => setShowKey((v) => !v)}>
                              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-(--muted-foreground)">Key 仅保存在本地，不会上传服务器。</p>
                        </div>
                        {/* Model */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">模型</Label>
                          <Select value={currentModel} onValueChange={(v) => setApiModels((m) => ({ ...m, [provider]: v }))}>
                            <SelectTrigger className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {providerCfg.models.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      /* Local mode */
                      <div className="space-y-3">
                        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">⚠️ 需要本地开发环境</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-(--muted-foreground)">
                            需克隆源码、安装依赖并单独运行代理服务。不熟悉命令行请使用{' '}
                            <strong className="text-(--foreground)">API Key 模式</strong>。
                          </p>
                          <button type="button" className="mt-1 text-[11px] text-(--accent-ui) hover:underline"
                            onClick={() => {
                              setOpen(false)
                              window.location.hash = '/docs'
                              setTimeout(() => document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
                            }}>
                            查看本地模式使用说明 →
                          </button>
                        </div>
                        {/* Proxy status */}
                        <div className={cn('rounded-md border px-3 py-2 text-xs transition-colors',
                          proxyStatus === 'ok' ? 'border-green-500/30 bg-green-500/5'
                          : proxyStatus === 'error' ? 'border-red-500/30 bg-red-500/5'
                          : 'border-(--border) bg-(--background)')}>
                          <div className="flex items-start gap-2">
                            {proxyStatus === 'checking' && <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-(--muted-foreground)" />}
                            {proxyStatus === 'ok' && <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-500" />}
                            {proxyStatus === 'error' && <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" />}
                            {proxyStatus === 'idle' && <Monitor className="mt-0.5 size-3.5 shrink-0 text-(--muted-foreground)" />}
                            <div>
                              {proxyStatus === 'checking' && <p className="text-(--muted-foreground)">正在检测代理状态…</p>}
                              {proxyStatus === 'ok' && <p className="text-green-600 dark:text-green-400">代理运行中，可以生成内容。</p>}
                              {proxyStatus === 'error' && (
                                <p className="flex flex-wrap items-center gap-x-1.5 text-red-400">
                                  <span>代理未启动：<code className="rounded bg-(--border)/50 px-1 font-mono">npm run proxy</code></span>
                                  <button type="button" onClick={checkProxy}
                                    className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline">
                                    <RefreshCw className="size-3" />重新检测
                                  </button>
                                </p>
                              )}
                              {proxyStatus === 'idle' && (
                                <p className="text-(--muted-foreground)">需先运行：<code className="rounded bg-(--border)/50 px-1 font-mono">npm run proxy</code>（另开终端）</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">模型</Label>
                          <Select value={localModel} onValueChange={setLocalModel}>
                            <SelectTrigger className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LOCAL_MODELS.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Raw prompt (advanced) */}
                    <div className="space-y-1.5 border-t border-(--border)/60 pt-3">
                      <Label className="text-xs text-(--muted-foreground)">
                        底层提示词
                        <span className="ml-1 font-normal">（高级：直接控制 AI 输出格式）</span>
                      </Label>
                      <textarea rows={5}
                        placeholder="切换模板会覆盖这里的内容…"
                        className="flex w-full resize-y rounded-md border border-(--border) bg-transparent px-3 py-2 text-xs leading-relaxed text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--accent-ui)"
                        value={systemPrompt}
                        onChange={(e) => {
                          setSystemPrompt(e.target.value)
                          // Deselect chip when prompt diverges from any template
                          const matched = templates.find((t) => t.prompt.trim() === e.target.value.trim())
                          setSelectedTemplateId(matched?.id ?? '')
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            <Button type="button" className="w-full gap-2" disabled={loading} onClick={handleGenerate}>
              {loading
                ? <><Loader2 className="size-4 animate-spin" />生成中，请稍候…</>
                : <><Wand2 className="size-4" />生成内容并填入编辑器</>}
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TEMPLATES MANAGEMENT VIEW
            ════════════════════════════════════════════════════════════════════ */}
        {dialogView === 'templates' && (
          <div className="mt-4 space-y-2">
            {templates.length === 0 && (
              <p className="py-8 text-center text-sm text-(--muted-foreground)">还没有模板，点击下方新增</p>
            )}

            <div className="space-y-1.5">
              {templates.map((t) => (
                <div key={t.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors',
                    t.id === selectedTemplateId
                      ? 'border-(--accent-ui)/40 bg-(--accent-ui)/5'
                      : 'border-(--border)/70',
                  )}
                >
                  {/* Click anywhere on the row to select */}
                  <button type="button" className="min-w-0 flex-1 text-left"
                    onClick={() => { selectTemplate(t); setDialogView('main') }}>
                    <p className={cn('truncate text-sm font-medium',
                      t.id === selectedTemplateId ? 'text-(--accent-ui)' : 'text-(--foreground)')}>
                      {t.label}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-(--muted-foreground)">
                      {promptHint(t.prompt)}
                    </p>
                  </button>
                  <button type="button"
                    onClick={() => openEditTemplate(t)}
                    className="shrink-0 rounded-md p-1.5 text-(--muted-foreground) hover:bg-(--background) hover:text-(--foreground)">
                    <Pencil className="size-3.5" />
                  </button>
                  {!t.builtin && (
                    <button type="button"
                      onClick={() => deleteTemplate(t.id)}
                      className="shrink-0 rounded-md p-1.5 text-(--muted-foreground) hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={openNewTemplate}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--border) py-2.5 text-sm text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/50 hover:text-(--accent-ui)">
              <Plus className="size-4" />
              新增模板
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            EDIT TEMPLATE VIEW
            ════════════════════════════════════════════════════════════════════ */}
        {dialogView === 'edit' && (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="templ-name">模板名称</Label>
              <input ref={editNameRef} id="templ-name" type="text"
                placeholder="例：技术博客、产品介绍…"
                className="flex h-9 w-full rounded-md border border-(--border) bg-transparent px-3 text-sm text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--accent-ui)"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="templ-prompt">提示词内容</Label>
              <textarea id="templ-prompt" rows={10}
                placeholder="告诉 AI 如何格式化输出，比如卡片结构、分隔符、语言风格等…"
                className="flex w-full resize-y rounded-md border border-(--border) bg-transparent px-3 py-2 text-sm leading-relaxed text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--accent-ui)"
                value={editPromptText}
                onChange={(e) => setEditPromptText(e.target.value)}
              />
              <p className="text-[11px] text-(--muted-foreground)">
                用自然语言描述输出格式、结构、语言风格等要求。
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setDialogView('templates')}>
                取消
              </Button>
              <Button type="button" className="flex-1"
                disabled={!editPromptText.trim()}
                onClick={saveEditTemplate}>
                保存
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
