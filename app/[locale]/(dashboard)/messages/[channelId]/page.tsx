"use client";

import { useParams } from "next/navigation";
import { ChatProvider } from "@/components/chat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useTranslations } from "next-intl";

export default function ChatPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const t = useTranslations("chat");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("conversation")}</h1>
      </div>
      <ChatProvider>
        <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-border/60">
          <ChatWindow
            channelId={channelId}
            showBackButton
            backUrl="/messages"
          />
        </div>
      </ChatProvider>
    </div>
  );
}
