// A small built-in emoji picker (no extra download: the emoji are plain text). Choosing one inserts it where the cursor is.
import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const GROUPS: Array<{ icon: string; name: string; items: string }> = [
  { icon: "😀", name: "Smileys", items: "😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👻 👽 🤖" },
  { icon: "👍", name: "Hands", items: "👍 👎 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 ✍️ 💪 🙌 👏 🤲 🫶 👐 🫡 🫰" },
  { icon: "❤️", name: "Hearts", items: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 😻 💋 💯 💢 💥 💫 💦 💨 🔥 ✨ ⭐ 🌟 🎉 🎊 🎁 🏆 🥇" },
  { icon: "🐶", name: "Nature", items: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦅 🦋 🐝 🐞 🌸 🌹 🌺 🌻 🌼 🌷 🌱 🌿 🍀 🌴 🌳 ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌈 ☔ ❄️ 🌙 ⭐" },
  { icon: "🍔", name: "Food", items: "🍎 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥑 🍅 🥕 🌽 🥔 🍞 🧀 🍗 🍖 🍔 🍟 🍕 🌭 🌮 🍜 🍝 🍣 🍚 🍰 🎂 🍪 🍩 🍫 🍬 ☕ 🍵 🥤 🍺 🍷" },
  { icon: "🚗", name: "Travel", items: "🚗 🚕 🚌 🚑 🚒 🚓 🚚 🏍️ 🚲 ✈️ 🚀 🚢 🏠 🏢 🏥 🏫 🏪 🏦 ⛪ 🕌 📍 🗺️ 🌍 🌅 🌃" },
  { icon: "💡", name: "Objects", items: "📱 💻 🖥️ ⌚ 📷 🎥 📞 ☎️ 📧 ✉️ 📦 📝 📄 📎 📌 🔒 🔑 💡 🔋 💰 💵 💳 🧾 🛒 🛍️ 🎧 🎵 📅 ⏰ ✅ ❌ ⚠️ ❓ ❗ ➕ ➖ ➡️ ⬅️ 🔔" },
];

const sets = GROUPS.map((g) => ({ ...g, list: Array.from(new Set(g.items.split(" ").filter(Boolean))) }));

export function EmojiPicker({ onPick, disabled, label }: { onPick: (emoji: string) => void; disabled?: boolean; label: string }) {
  const [group, setGroup] = useState(0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={label} title={label} className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-2">
        <div className="mb-1 flex gap-0.5 border-b pb-1" role="tablist">
          {sets.map((g, i) => (
            <button key={g.name} type="button" role="tab" aria-selected={group === i} aria-label={g.name} onClick={() => setGroup(i)}
              className={`flex-1 rounded px-1 py-1 text-lg leading-none ${group === i ? "bg-muted" : "hover:bg-muted/60"}`}>
              {g.icon}
            </button>
          ))}
        </div>
        <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto" role="grid" aria-label={sets[group].name}>
          {sets[group].list.map((e) => (
            <button key={e} type="button" onClick={() => onPick(e)} className="rounded p-1 text-xl leading-none hover:bg-muted" aria-label={e}>{e}</button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
