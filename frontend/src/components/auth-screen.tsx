import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLogin, useRegister } from "@/hooks/use-auth"
import { ApiClientError } from "@/lib/api"

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

export function AuthScreen() {
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
    <div className="flex min-h-svh items-center justify-center p-6">
      <form
        role="form"
        aria-labelledby="auth-title"
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <h1 id="auth-title" className="text-lg font-semibold">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>

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

        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? "sign-in" : "sign-up")
            login.reset()
            register.reset()
            form.clearErrors()
          }}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  )
}
