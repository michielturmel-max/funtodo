import type { SVGProps } from "react";

function Base({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CampItemIcon({ id, ...props }: SVGProps<SVGSVGElement> & { id: string }) {
  switch (id) {
    case "vlaggenlijn":
      return (
        <Base {...props}>
          <path d="M3 7c5 3 13 3 18 1" />
          <path d="m6 8 2 4 2-4M11 9l2 4 2-4M16 8.5l2 4 2-4" />
        </Base>
      );
    case "lantaarn":
      return (
        <Base {...props}>
          <path d="M12 21V9" />
          <path d="M8.5 9h7l-1.2-4H9.7L8.5 9Z" />
          <path d="M8 12h8M12 12v3" />
        </Base>
      );
    case "houtstapel":
      return (
        <Base {...props}>
          <rect x="4" y="14" width="16" height="4" rx="2" />
          <rect x="6" y="9" width="12" height="4" rx="2" />
          <path d="M6 18v2M18 18v2" />
        </Base>
      );
    case "bankje":
      return (
        <Base {...props}>
          <path d="M4 13h16M6 13v6M18 13v6" />
          <path d="M5 9h14v4H5Z" />
        </Base>
      );
    case "bloementuin":
      return (
        <Base {...props}>
          <path d="M8 20v-7M16 20v-9M4 20h16" />
          <circle cx="8" cy="10" r="2.2" />
          <circle cx="16" cy="8" r="2.2" />
        </Base>
      );
    case "brug":
      return (
        <Base {...props}>
          <path d="M3 16c4-6 14-6 18 0" />
          <path d="M4 16v3M20 16v3M8 13v4M12 11.5v5.5M16 13v4" />
          <path d="M3 13c4-5 14-5 18 0" />
        </Base>
      );
    case "vogelhuisje":
      return (
        <Base {...props}>
          <path d="M12 21v-8" />
          <path d="M7 13V8h10v5Z" />
          <path d="m6 8 6-4 6 4" />
          <circle cx="12" cy="10.5" r="1.2" />
        </Base>
      );
    default:
      return (
        <Base {...props}>
          <path d="M4 20h16M6 20V9l6-5 6 5v11" />
          <path d="M10 20v-5h4v5" />
        </Base>
      );
  }
}
