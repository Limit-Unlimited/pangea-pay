"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isPrivileged: boolean;
  isSystem: boolean;
  status: string;
  createdAt: string;
};

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/roles");
    const data = await res.json();
    setRoles(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Define access levels and assign them to users."
        action={
          <Button className="bg-[#4A8C1C] hover:bg-[#3a7016] text-white" onClick={() => router.push("/administration/roles/new")}>
            <Plus className="mr-2 h-4 w-4" /> Create role
          </Button>
        }
      />

      <Card className="overflow-hidden border-[#E2E8F0]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FBEF] hover:bg-[#F8FBEF]">
              <TableHead className="text-[#64748B] font-medium">Name</TableHead>
              <TableHead className="text-[#64748B] font-medium">Description</TableHead>
              <TableHead className="text-[#64748B] font-medium">Type</TableHead>
              <TableHead className="text-[#64748B] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-[#64748B]">Loading…</TableCell></TableRow>
            ) : !roles.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-[#64748B]">No roles found.</TableCell></TableRow>
            ) : roles.map((role) => (
              <TableRow
                key={role.id}
                className="cursor-pointer hover:bg-[#F8FBEF]"
                onClick={() => router.push(`/administration/roles/${role.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {role.isPrivileged
                      ? <ShieldCheck className="h-4 w-4 text-[#D4EDAA]" />
                      : <Shield className="h-4 w-4 text-[#64748B]" />}
                    <span className="font-medium text-[#1A2332]">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs text-[#64748B] border-[#CBD5E1]">System</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[#64748B] max-w-sm truncate">{role.description ?? "—"}</TableCell>
                <TableCell>
                  {role.isPrivileged
                    ? <Badge variant="outline" className="text-xs text-[#D4EDAA] border-[#D4EDAA]/30 bg-[#D4EDAA]/10">Privileged</Badge>
                    : <Badge variant="outline" className="text-xs text-[#64748B] border-[#CBD5E1]">Standard</Badge>}
                </TableCell>
                <TableCell><StatusBadge status={role.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
