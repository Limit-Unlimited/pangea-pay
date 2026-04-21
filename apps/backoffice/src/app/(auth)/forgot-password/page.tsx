"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    setIsLoading(false);
    setSubmitted(true); // Always show success — never reveal whether email exists
  }

  if (submitted) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-[#22C55E] mx-auto" />
          <p className="font-medium text-[#1A2332]">Check your email</p>
          <p className="text-sm text-[#64748B]">
            If an account exists for that email address, you will receive a password reset link shortly.
          </p>
          <a href="/login" className="text-sm text-[#4A8C1C] hover:underline block mt-4">
            Back to sign in
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-[#1A2332]">Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button
            type="submit"
            className="w-full bg-[#4A8C1C] hover:bg-[#3a7016] text-white"
            disabled={isLoading}
          >
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
          </Button>
          <a href="/login" className="block text-center text-sm text-[#64748B] hover:text-[#1A2332]">
            Back to sign in
          </a>
        </form>
      </CardContent>
    </Card>
  );
}
