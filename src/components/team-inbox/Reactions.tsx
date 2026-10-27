// Emoji reactions on a message, as on WhatsApp: a small picker beside the bubble, and the chosen emoji shown under it.
import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { InboxMessage } from "@/services/teamInboxApi";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/** The reaction chips under a bubble. */
export function ReactionChips({ reactions, mine }: { reactions: InboxMessage["reactions"]; mine: boolean }) {
  if (!reactions?.length) return null;
  return (
    <span className={`-mt-1 mb-0.5 flex ${mine ? "justify-end" : "justify-start"}`}>
      <span className="inline-flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 text-sm leading-none shadow-sm dark:bg-[#202c33]">
        {reactions.map((r) => <span key={r.side} title={r.side}>{r.emoji}</span>)}
      </span>
    </span>
  );
}

interface PickerProps {
  current?: string;
  label: string;
  removeLabel: string;
  onPick: (emoji: string) => void;
}

/** The button that opens the quick reactions. Choosing the one already set removes it. */
export function ReactionPicker({ current, label, removeLabel, onPick }: PickerProps) {
  const [open, setOpen] = useState(false);
  const pick = (emoji: string) => { setOpen(false); onPick(emoji === current ? "" : emoji); };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} title={label}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-black/5 focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100">
          <SmilePlus className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto p-1.5">
        <div className="flex gap-0.5" role="group" aria-label={label}>
          {QUICK_REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => pick(e)} aria-label={e} aria-pressed={e === current}
              className={`rounded-full p-1.5 text-xl leading-none hover:bg-muted ${e === current ? "bg-muted" : ""}`}>{e}</button>
          ))}
          {current && <button type="button" onClick={() => { setOpen(false); onPick(""); }} className="rounded-full px-2 text-xs text-muted-foreground hover:bg-muted">{removeLabel}</button>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
