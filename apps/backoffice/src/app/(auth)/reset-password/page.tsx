"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  password:        z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-[#EF4444] mx-auto" />
          <p className="font-medium text-[#1A2332]">Invalid reset link</p>
          <p className="text-sm text-[#64748B]">This link is missing a token. Please request a new reset link.</p>
          <a href="/forgot-password" className="text-sm text-[#4A8C1C] hover:underline block">Request new link</a>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-[#22C55E] mx-auto" />
          <p className="font-medium text-[#1A2332]">Password reset successfully</p>
          <p className="text-sm text-[#64748B]">You can now sign in with your new password.</p>
          <Button
            className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white mt-2"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    const json = await res.json().catch(() => ({}));
    setIsLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-[#1A2332]">Set a new password</CardTitle>
        <CardDescription>Your new password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting password…</> : "Set new password"}
          </Button>
          <a href="/login" className="block text-center text-sm text-[#64748B] hover:text-[#1A2332]">Back to sign in</a>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
