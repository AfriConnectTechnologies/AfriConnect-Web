"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MenuSectionProps {
  title: string;
  children: ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-1">
        {title}
      </h3>
      <Card className="overflow-hidden border-border/60 rounded-2xl">
        <CardContent className="p-0 divide-y divide-border/40">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
