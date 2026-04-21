"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  mfaToken: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  account_locked:      "Your account has been temporarily locked due to too many failed attempts. Contact your administrator.",
  account_suspended:   "Your account has been suspended. Contact your administrator.",
  mfa_invalid:         "The authentication code is incorrect or has expired.",
  CredentialsSignin:   "Email or password is incorrect.",
  CallbackRouteError:  "Email or password is incorrect.",
  default:             "Something went wrong. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = params.get("error");
  const pageError = errorParam ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.default) : null;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", mfaToken: "" },
  });

  const watchedEmail    = form.watch("email");
  const watchedPassword = form.watch("password");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const canSubmit  = !isLoading && (requiresMfa || (emailValid && watchedPassword.length >= 12));

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      mfaToken: data.mfaToken ?? "",
      redirect: false,
    });

    setIsLoading(false);

    if (!result?.error) {
      router.push("/dashboard");
      return;
    }

    if (result.error === "mfa_required") {
      setRequiresMfa(true);
      return;
    }

    setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl text-[#1A2332]">Sign in</CardTitle>
        <CardDescription>
          {requiresMfa
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter your email and password to access the platform."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {(error ?? pageError) && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>{error ?? pageError}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
            if (e.key === "Enter" && canSubmit) {
              e.preventDefault();
              form.handleSubmit(onSubmit)();
            }
          }}
          className="space-y-4"
        >
          {!requiresMfa ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1A2332]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs text-[#4A8C1C] hover:underline"
                  tabIndex={0}
                >
                  Forgot password?
                </a>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="mfaToken">Authentication code</Label>
              <Input
                id="mfaToken"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                {...form.register("mfaToken")}
              />
              <p className="text-xs text-[#64748B]">
                Open your authenticator app and enter the 6-digit code.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
            ) : requiresMfa ? (
              "Verify code"
            ) : (
              "Sign in"
            )}
          </Button>

          {requiresMfa && (
            <button
              type="button"
              onClick={() => { setRequiresMfa(false); setError(null); }}
              className="w-full text-sm text-[#64748B] hover:text-[#1A2332] text-center"
            >
              ← Back to login
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
