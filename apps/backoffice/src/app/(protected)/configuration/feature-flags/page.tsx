"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type FeatureFlag = {
  id: string; key: string; name: string; description: string | null; isEnabled: boolean;
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/configuration/feature-flags");
    const data = await res.json();
    setFlags(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(flag: FeatureFlag) {
    setToggling(flag.id);
    await fetch(`/api/configuration/feature-flags/${flag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !flag.isEnabled }),
    });
    setToggling(null);
    load();
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Feature flags" description="Toggle platform features without deploying code." />
        <p className="text-[#64748B]">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Feature flags"
        description="Toggle platform features without deploying code. Changes take effect immediately."
      />

      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-4 divide-y divide-[#E2E8F0]">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between py-4">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#1A2332]">{flag.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${flag.isEnabled ? "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/5" : "text-[#64748B] border-[#CBD5E1]"}`}
                  >
                    {flag.isEnabled ? "On" : "Off"}
                  </Badge>
                </div>
                {flag.description && (
                  <p className="text-sm text-[#64748B] mt-0.5">{flag.description}</p>
                )}
                <p className="text-xs font-mono text-[#64748B]/70 mt-1">{flag.key}</p>
              </div>
              <Switch
                checked={flag.isEnabled}
                disabled={toggling === flag.id}
                onCheckedChange={() => toggle(flag)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
