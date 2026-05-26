import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Sparkles, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/state/AuthContext'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

type AuthMode = 'signin' | 'signup'

type AuthDialogProps = {
  open: boolean
  defaultMode?: AuthMode
  onOpenChange: (open: boolean) => void
}

const signInSchema = z.object({
  email: z.string().min(1, '请填写邮箱').email('请输入正确的邮箱格式'),
  password: z.string().min(1, '请填写密码'),
})

const signUpSchema = z.object({
  name: z.string().min(2, '昵称至少需要 2 个字'),
  email: z.string().min(1, '请填写邮箱').email('请输入正确的邮箱格式'),
  password: z.string().min(6, '密码至少需要 6 位'),
})

type SignInValues = z.infer<typeof signInSchema>
type SignUpValues = z.infer<typeof signUpSchema>

export function AuthDialog({ open, defaultMode = 'signin', onOpenChange }: AuthDialogProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>(defaultMode)

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  useEffect(() => {
    if (!open) return
    setMode(defaultMode)
    signInForm.reset()
    signUpForm.reset()
  }, [defaultMode, open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn(values: SignInValues) {
    try {
      await signIn(values)
      trackEvent('signin_success')
      toast.success('已登录')
      onOpenChange(false)
    } catch (err) {
      signInForm.setError('root', {
        message: err instanceof Error ? err.message : '操作失败，请稍后重试',
      })
    }
  }

  async function handleSignUp(values: SignUpValues) {
    try {
      await signUp(values)
      trackEvent('signup_success')
      toast.success('注册成功，欢迎使用墨工坊')
      onOpenChange(false)
    } catch (err) {
      signUpForm.setError('root', {
        message: err instanceof Error ? err.message : '操作失败，请稍后重试',
      })
    }
  }

  const isSignUp = mode === 'signup'
  const activeForm = isSignUp ? signUpForm : signInForm
  const isSubmitting = activeForm.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-emerald-500/12 text-emerald-600">
            {isSignUp ? <UserPlus className="size-5" /> : <LogIn className="size-5" />}
          </div>
          <DialogTitle>{isSignUp ? '创建墨工坊账户' : '登录账户'}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? '保存你的卡片草稿、样式方案和后续团队协作配置。'
              : '登录后继续管理你的卡片内容和创作资产。'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 rounded-md border border-(--border) bg-(--background) p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={cn('rounded px-3 py-2 text-sm transition-colors', !isSignUp && 'bg-(--card-shell) shadow-sm')}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={cn('rounded px-3 py-2 text-sm transition-colors', isSignUp && 'bg-(--card-shell) shadow-sm')}
          >
            注册
          </button>
        </div>

        {isSignUp ? (
          <Form key="signup" {...signUpForm}>
            <form className="space-y-3" onSubmit={signUpForm.handleSubmit(handleSignUp)} noValidate>
              <FormField
                control={signUpForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>昵称</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm outline-none transition focus:border-(--ring)"
                        placeholder="例如：小红书运营同学"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        className="h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm outline-none transition focus:border-(--ring)"
                        placeholder="you@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="password"
                        className="h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm outline-none transition focus:border-(--ring)"
                        placeholder="至少 6 位"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {signUpForm.formState.errors.root && (
                <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {signUpForm.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Sparkles className="size-4" />
                {isSubmitting ? '请稍候…' : '注册并进入工作台'}
              </Button>
            </form>
          </Form>
        ) : (
          <Form key="signin" {...signInForm}>
            <form className="space-y-3" onSubmit={signInForm.handleSubmit(handleSignIn)} noValidate>
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        className="h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm outline-none transition focus:border-(--ring)"
                        placeholder="you@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="password"
                        className="h-10 w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm outline-none transition focus:border-(--ring)"
                        placeholder="至少 6 位"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {signInForm.formState.errors.root && (
                <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {signInForm.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Sparkles className="size-4" />
                {isSubmitting ? '请稍候…' : '登录'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
