import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function NiceTooltip({ children, content, side = "top" }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={4}
            className="z-[9999] bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-2xl text-[11px] font-medium text-slate-200 select-none animate-in fade-in zoom-in-95 duration-150"
          >
            {content}
            <Tooltip.Arrow className="fill-slate-700/80" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
