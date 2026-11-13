import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
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

export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </Base>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </Base>
  );
}

export function TentIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v10M9 20l3-5 3 5" />
    </Base>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3c1 3.5-2 4.5-2 7a2 2 0 0 0 4 0c0-1 0-1.5-.5-2.5 2.5 1.5 4.5 4 4.5 7a6 6 0 0 1-12 0c0-4 3-6 6-11.5Z" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 12.5 4.2 4L19 7" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Base>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Base>
  );
}

export function SwordsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 19 9-9M14 5l5-1-1 5M14 5l5 5" />
      <path d="m19 19-9-9M10 5 5 4l1 5M10 5 5 10" />
    </Base>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-3.3 4-5 7.5-5s6.3 1.7 7.5 5" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v5M14 11v5" />
    </Base>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8 5.5 19 12 8 18.5v-13Z" />
    </Base>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 5v14M15 5v14" />
    </Base>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Base>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 16H6l1.4-2.1A3 3 0 0 0 8 12.2V10a4 4 0 0 1 8 0v2.2a3 3 0 0 0 .6 1.7L18 16Z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </Base>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Base>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h9a6 6 0 0 1 0 12h-1" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 5 7 7-7 7" />
    </Base>
  );
}

export function WifiOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 3l18 18" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0M5.5 12.5a10 10 0 0 1 4-2.3M14.5 10.2a10 10 0 0 1 4 2.3M12 19h.01" />
    </Base>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </Base>
  );
}
