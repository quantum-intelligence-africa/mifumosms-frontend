import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface MockupFrameProps {
  children: React.ReactNode;
  chrome?: "browser" | "app" | "none";
  label?: string;
  className?: string;
  innerClassName?: string;
}

export const MockupFrame = ({
  children,
  chrome = "browser",
  label,
  className,
  innerClassName,
}: MockupFrameProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [14, 0, -4]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.97]);

  return (
    <div
      ref={ref}
      className="relative"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          boxShadow:
            "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        }}
        className={cn(
          "relative border-4 border-[#6C6C6C] bg-[#222222] rounded-[30px] p-2 md:p-4 shadow-2xl",
          className
        )}
      >
        <div className="relative rounded-2xl overflow-hidden bg-white">
          {chrome !== "none" && (
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              {label && (
                <div className="ml-3 flex-1 truncate text-[11px] font-medium text-gray-500">
                  {label}
                </div>
              )}
            </div>
          )}
          <div className={cn("relative", innerClassName)}>{children}</div>
        </div>
      </motion.div>
    </div>
  );
};
