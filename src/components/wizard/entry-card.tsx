"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EntryCardProps {
  title: string;
  /** Omit to make the entry permanent (e.g. the three required references). */
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}

export function EntryCard({
  title,
  onRemove,
  removeLabel,
  children,
}: EntryCardProps) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-brand-green-tint/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
          {title}
        </h3>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="-mr-1.5 h-8 gap-1 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Remove</span>
            <span className="sr-only">{removeLabel ?? title}</span>
          </Button>
        )}
      </header>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
}

interface AddEntryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  /** Shown instead of the button once the cap is reached. */
  atLimitLabel?: string;
  className?: string;
}

export function AddEntryButton({
  onClick,
  disabled,
  children,
  atLimitLabel,
  className,
}: AddEntryButtonProps) {
  if (disabled && atLimitLabel) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {atLimitLabel}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 w-full gap-2 border-dashed border-brand-green/45 text-brand-green-deep hover:border-brand-green hover:bg-brand-green-tint",
        className,
      )}
    >
      <Plus className="size-4" aria-hidden="true" />
      {children}
    </Button>
  );
}

/** Shown when a repeatable section has nothing in it yet. */
export function EmptyEntries({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
