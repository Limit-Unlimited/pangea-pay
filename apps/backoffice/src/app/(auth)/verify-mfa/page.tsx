"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  mfaToken: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Code must be digits only"),
});

type FormData = z.infer<typeof schema>;

export default function VerifyMfaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);

    // Re-invoke signIn with the stored credentials + MFA token.
    // Since we don't store raw credentials, the user must re-enter them.
    // This page is for cases where mfaVerified=false but session exists.
    // We redirect to login to re-authenticate with MFA.
    router.push("/login");
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl text-[#1A2332]">Two-factor authentication</CardTitle>
        <CardDescription>
          Your session requires MFA verification. Please sign in again with your authentication code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-[#64748B]">
          For security, please sign in again to verify your identity.
        </p>
        <Button
          className="w-full bg-[#1E4D8C] hover:bg-[#1a4279] text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign in again
        </Button>
      </CardContent>
    </Card>
  );
}
