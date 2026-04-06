"use client";

import { signOut } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyMfaPage() {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl text-[#1A2332]">Two-factor authentication</CardTitle>
        <CardDescription>
          Your session requires MFA verification. Please sign in again with your authentication code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <p>For security, please sign in again to verify your identity with your MFA code.</p>
        </div>
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
