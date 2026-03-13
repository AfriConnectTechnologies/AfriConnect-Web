"use client";

import { useTranslations } from "next-intl";
import { AgreementContent } from "@/components/agreements/AgreementContent";

export default function BuyerAgreementPage() {
  const t = useTranslations("agreements");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("buyer.title")}</h1>
        <p className="text-muted-foreground">{t("buyer.pageDescription")}</p>
      </div>

      <AgreementContent type="buyer" />
    </div>
  );
}
