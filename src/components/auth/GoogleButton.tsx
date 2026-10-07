import type { ReactNode } from "react";

interface GoogleButtonProps {
  href: string;
  children: ReactNode;
  roundedClassName: string;
}

const GoogleMark = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
    />
    <path
      fill="#34A853"
      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z"
    />
    <path
      fill="#FBBC05"
      d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.36l3.25-2.53Z"
    />
    <path
      fill="#EA4335"
      d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53c.77-2.31 2.93-4.03 5.47-4.03Z"
    />
  </svg>
);

export default function GoogleButton({
  href,
  children,
  roundedClassName,
}: GoogleButtonProps) {
  return (
    <a
      href={href}
      aria-label="Continue with Google"
      className={`flex w-full items-center justify-center gap-3 border border-[#dadce0] bg-white py-3 text-center text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2 ${roundedClassName}`}
    >
      <GoogleMark />
      <span>{children}</span>
    </a>
  );
}
