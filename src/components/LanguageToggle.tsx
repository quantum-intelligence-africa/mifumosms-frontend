import { Globe } from "lucide-react";
import { useContext } from "react";
import { LanguageContext } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle({ isDark = false }: { isDark?: boolean }) {
  const context = useContext(LanguageContext);
  if (!context) return null;

  const { language, setLanguage } = context;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm border ${
          isDark
            ? 'border-gray-900/20 text-gray-900 hover:bg-gray-200/50'
            : 'border-white/20 text-white hover:bg-white/10'
        }`}>
          <Globe className="w-4 h-4" />
          <span>
            {language === "en" ? "EN" : "SW"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer py-2.5 px-3 rounded-md text-sm transition-colors ${
            language === "en"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <span>English</span>
            {language === "en" && <span className="text-blue-700">✓</span>}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("sw")}
          className={`cursor-pointer py-2.5 px-3 rounded-md text-sm transition-colors ${
            language === "sw"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <span>Kiswahili</span>
            {language === "sw" && <span className="text-blue-700">✓</span>}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
