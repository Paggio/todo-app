import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLogin, useRegister } from "@/hooks/use-auth"
import { ApiClientError } from "@/lib/api"
import { cn } from "@/lib/utils"

type AuthMode = "sign-up" | "sign-in"

const baseEmailField = z.string().email("Enter a valid email address")

// Sign-up enforces min-length 8 (matches backend RegisterRequest.password).
// Sign-in deliberately skips min-length so users whose passwords predate the
// policy can still sign in — the backend's LoginRequest also has no
// min_length to avoid leaking password rules via validation-vs-401 timing.
const signUpSchema = z.object({
  email: baseEmailField,
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const signInSchema = z.object({
  email: baseEmailField,
  password: z.string().min(1, "Enter your password"),
})

type AuthFormValues = z.infer<typeof signUpSchema>

interface AuthScreenProps {
  isExiting?: boolean
}

export function AuthScreen({ isExiting }: AuthScreenProps) {
  const [mode, setMode] = React.useState<AuthMode>("sign-in")
  const register = useRegister()
  const login = useLogin()

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "sign-up" ? signUpSchema : signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  })

  const isSignIn = mode === "sign-in"
  const activeMutation = isSignIn ? login : register

  const serverError =
    activeMutation.error instanceof ApiClientError
      ? activeMutation.error.payload.detail
      : null

  const onSubmit = form.handleSubmit((values) => {
    if (isSignIn) {
      login.mutate(values)
    } else {
      register.mutate(values)
    }
  })

  const isSignUp = mode === "sign-up"

  return (
    <div
      className={cn(
        "relative flex min-h-svh items-center justify-center p-6",
        isExiting && "animate-auth-fade-out"
      )}
    >
      {/* Decorative gradient shapes behind the frosted glass */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.03]" />
      </div>

      {/* Frosted glass backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-lg" />

      {/* Theme toggle stays above the glass */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Auth card floats above the glass */}
      <form
        role="form"
        aria-labelledby="auth-title"
        onSubmit={onSubmit}
        className="relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card/90 p-6 shadow-elevated backdrop-blur-sm animate-auth-card-in"
      >
        {/* App branding */}
        <div className="text-center mb-2">
          <span className="text-display">Todos</span>
        </div>
        <h1 id="auth-title" className="text-heading text-center">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>

        {/* Animated form fields container — key={mode} triggers remount animation */}
        <div key={mode} className="animate-auth-mode-switch flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              aria-invalid={form.formState.errors.email ? "true" : "false"}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-invalid={form.formState.errors.password ? "true" : "false"}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={login.isPending || register.isPending}>
            {login.isPending
              ? "Signing in..."
              : register.isPending
                ? "Creating account..."
                : isSignUp
                  ? "Sign up"
                  : "Sign in"}
          </Button>

          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? "sign-in" : "sign-up")
            login.reset()
            register.reset()
            form.reset()
          }}
          className="min-h-[44px] text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  )
}
