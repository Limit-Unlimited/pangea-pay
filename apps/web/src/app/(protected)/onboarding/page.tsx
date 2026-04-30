"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { User, Building2, ArrowRight } from "lucide-react";
import { IndividualForm } from "./individual-form";
import { BusinessForm } from "./business-form";

type CustomerType = "individual" | "business" | null;

export default function OnboardingPage() {
  const [customerType, setCustomerType] = useState<CustomerType>(null);

  if (customerType === "individual") return <IndividualForm onBack={() => setCustomerType(null)} />;
  if (customerType === "business")   return <BusinessForm  onBack={() => setCustomerType(null)} />;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2332]">Add an account</h1>
        <p className="text-[#64748B] mt-1">
          Open a personal account or register a business to get started.
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => setCustomerType("individual")}
          className="group text-left w-full"
        >
          <Card className="p-6 border-[#D1E8B8] bg-white hover:border-[#4A8C1C] hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#F0F7E6] flex items-center justify-center shrink-0 group-hover:bg-[#B0D980]/40 transition-colors">
                <User className="h-6 w-6 text-[#4A8C1C]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-[#1A2332]">Personal account</h2>
                  <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#4A8C1C] shrink-0 transition-colors" />
                </div>
                <p className="text-sm text-[#64748B] mt-1">
                  For individuals sending money internationally — to family, friends, or for personal payments abroad.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["ID verification", "4 steps", "~5 minutes"].map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#F0F7E6] text-[#4A8C1C] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </button>

        <button
          onClick={() => setCustomerType("business")}
          className="group text-left w-full"
        >
          <Card className="p-6 border-[#D1E8B8] bg-white hover:border-[#4A8C1C] hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#F0F7E6] flex items-center justify-center shrink-0 group-hover:bg-[#B0D980]/40 transition-colors">
                <Building2 className="h-6 w-6 text-[#4A8C1C]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-[#1A2332]">Business account</h2>
                  <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#4A8C1C] shrink-0 transition-colors" />
                </div>
                <p className="text-sm text-[#64748B] mt-1">
                  For companies, partnerships, and sole traders. Cross-border payments, supplier payments, and FX conversions for your business.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Company verification", "5 steps", "~10 minutes"].map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#F0F7E6] text-[#4A8C1C] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </button>
      </div>

      <p className="text-xs text-[#64748B] text-center mt-6">
        Not sure? <a href="mailto:support@pangea.local" className="text-[#4A8C1C] hover:underline">Contact support</a> and we&apos;ll help you choose.
      </p>
    </div>
  );
}
