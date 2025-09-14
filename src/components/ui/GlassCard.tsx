import React from "react";

type Props = React.PropsWithChildren<{
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}>;

/** Subtle frosted card with soft border and shadow */
export default function GlassCard({ className = "", header, footer, children }: Props) {
  return (
    <div
      className={
        "rounded-2xl border border-white/40 bg-white/70 backdrop-blur-[6px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] " +
        "dark:border-white/10 dark:bg-white/5 " +
        className
      }
    >
      {header && (
        <div className="border-b border-white/50 px-4 py-3 text-sm font-semibold text-slate-800/90 dark:border-white/10 dark:text-white">
          {header}
        </div>
      )}
      <div className="px-4 py-4">{children}</div>
      {footer && (
        <div className="border-t border-white/50 px-4 py-3 dark:border-white/10">
          {footer}
        </div>
      )}
    </div>
  );
}
