import React from "react";
import { AlertTriangle, Trash } from "lucide-react";
import { cn } from "../../lib/utils";

export type ConfirmDialogVariant = "warning" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  variant: ConfirmDialogVariant;
  title: string;
  content: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  variant,
  title,
  content,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const styles =
    variant === "warning"
      ? {
          border: "border-slate-200",
          icon: "text-amber-500 bg-amber-100",
          title: "text-slate-900",
          body: "text-amber-700 mb-7",
          button:
            "bg-amber-100 text-amber-600 hover:bg-amber-500  hover:text-white focus:ring-amber-300 m-0",
          cancel:
            "border border-amber-100 bg-white text-amber-700 hover:bg-amber-50",
        }
      : {
          border: "border-slate-200",
          icon: "text-red-500 bg-red-100",
          title: "text-slate-900",
          body: "text-slate-700",
          button:
            "border border-red-300 bg-white text-red-500 hover:bg-red-50 focus:ring-red-300",
          cancel:
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-2 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={cn(
          "w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl",
          styles.border,
        )}
      >
        {/* Row 1: Icon + Title */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              styles.icon,
            )}
          >
            {variant === "warning" ? (
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            ) : (
              <Trash className="h-5 w-5" strokeWidth={2} />
            )}
          </div>
          <h2 id="confirm-dialog-title" className={cn("text-lg font-semibold leading-6", styles.title)}>
            {title}
          </h2>
        </div>

        {/* Row 2: Separator */}
        <div className="mb-3 border-t border-slate-200" aria-hidden="true" />

        {/* Row 3: Content */}
        <div className={cn("text-sm leading-6 mb-2", styles.body)}>
          {content}
        </div>

        {/* Row 4: Separator */}
        <div className="mb-3 border-t border-slate-100" aria-hidden="true" />

        {/* Row 5: Actions */}
        <div className="flex items-center justify-end gap-2 my-0">
          {cancelLabel ? (
            <button
              type="button"
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                styles.cancel,
              )}
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
              styles.button,
            )}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
