"use client";

import { LucideIcon, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export function MenuItem({
  icon: Icon,
  label,
  description,
  value,
  onClick,
  isSwitch,
  switchValue,
  onSwitchChange,
  variant = "default",
  disabled,
}: MenuItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 transition-all duration-200",
        !disabled && "hover:bg-accent/40 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled && !isSwitch ? onClick : undefined}
    >
      <div 
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          variant === "destructive" 
            ? "bg-destructive/10" 
            : "bg-muted/60"
        )}
      >
        <Icon 
          className={cn(
            "h-[18px] w-[18px]",
            variant === "destructive" 
              ? "text-destructive" 
              : "text-muted-foreground"
          )} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <p 
          className={cn(
            "font-medium text-sm",
            variant === "destructive" && "text-destructive"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        )}
      </div>
      {isSwitch ? (
        <Switch
          checked={switchValue}
          onCheckedChange={onSwitchChange}
          disabled={disabled}
        />
      ) : value ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium bg-muted/50 px-2 py-1 rounded-lg">{value}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      )}
    </div>
  );
}
