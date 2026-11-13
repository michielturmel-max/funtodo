function pointOnTrail(progress: number): { x: number; y: number } {
  const t = Math.max(0, Math.min(1, progress));
  const mt = 1 - t;
  const [x0, y0] = [96, 268];
  const [x1, y1] = [168, 206];
  const [x2, y2] = [226, 124];
  const [x3, y3] = [314, 84];
  return {
    x: mt ** 3 * x0 + 3 * mt ** 2 * t * x1 + 3 * mt * t ** 2 * x2 + t ** 3 * x3,
    y: mt ** 3 * y0 + 3 * mt ** 2 * t * y1 + 3 * mt * t ** 2 * y2 + t ** 3 * y3,
  };
}

export function ExpeditionScene({
  progress,
  defeated,
  className = "",
}: {
  progress: number;
  defeated: boolean;
  className?: string;
}) {
  const marker = pointOnTrail(progress);

  return (
    <svg
      viewBox="0 0 640 300"
      className={className}
      role="img"
      aria-label={defeated ? "De top is bereikt en de yeti verslagen" : "De berg met de yeti op de top"}
    >
      <defs>
        <linearGradient id="exp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8e6e0" />
          <stop offset="60%" stopColor="#e9eedd" />
          <stop offset="100%" stopColor="#f6efda" />
        </linearGradient>
        <linearGradient id="exp-mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9db397" />
          <stop offset="55%" stopColor="#728e6d" />
          <stop offset="100%" stopColor="#4f6b52" />
        </linearGradient>
        <linearGradient id="exp-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5f7a5c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#425c47" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect width="640" height="300" fill="url(#exp-sky)" />
      <circle cx="112" cy="56" r="25" fill="#f5e6bd" />
      <circle cx="112" cy="56" r="44" fill="#f7e7bb" opacity="0.35" />

      <path d="M0 214c80-24 140-18 200 0 66 20 120 12 178-4 56-16 108-12 156 2 38 10 72 10 106 4v84H0Z" fill="url(#exp-shadow)" />

      <path d="M24 282L318 62l296 220Z" fill="url(#exp-mountain)" />
      <path d="M318 62l296 220H318Z" fill="#3f5b3c" opacity="0.18" />
      <path d="M120 240l198-152 198 152" fill="none" stroke="#dbe4d6" strokeWidth="2" opacity="0.4" />

      <path
        d="M280 112l38-50 40 50c-12 8-24 4-39 10-14-6-27-2-39-10Z"
        fill="#f7f4ea"
      />

      <path
        d="M96 268c16-14 34-36 54-56 24-24 52-58 76-92 22-32 44-44 88-36"
        fill="none"
        stroke="#f7f4ea"
        strokeWidth="2.4"
        strokeDasharray="4 9"
        strokeLinecap="round"
        opacity="0.8"
      />

      <g transform="translate(318 66)">
        <ellipse cx="0" cy="30" rx="20" ry="5" fill="#16241d" opacity="0.18" />
        {defeated ? (
          <g>
            <path d="M-4 30V-16" stroke="#6b5638" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M-3-16l30 9-30 10Z" fill="#d9552a" />
            <circle cx="-4" cy="-16" r="2.4" fill="#c69a46" />
          </g>
        ) : (
          <g>
            <ellipse cx="0" cy="8" rx="17" ry="22" fill="#eef2ec" stroke="#c3cfc4" strokeWidth="1.6" />
            <path d="M-15 2c-8 4-12 10-13 16M15 2c8 4 12 10 13 16" fill="none" stroke="#eef2ec" strokeWidth="6" strokeLinecap="round" />
            <circle cx="0" cy="-16" r="14" fill="#f4f7f2" stroke="#c3cfc4" strokeWidth="1.6" />
            <ellipse cx="0" cy="-11" rx="9" ry="8" fill="#bcd3d8" />
            <circle cx="-3.4" cy="-13" r="1.6" fill="#1d2a25" />
            <circle cx="3.4" cy="-13" r="1.6" fill="#1d2a25" />
            <path d="M-3-7c2 2 4 2 6 0" fill="none" stroke="#1d2a25" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="-14" cy="-20" r="4" fill="#eef2ec" stroke="#c3cfc4" strokeWidth="1.2" />
            <circle cx="14" cy="-20" r="4" fill="#eef2ec" stroke="#c3cfc4" strokeWidth="1.2" />
          </g>
        )}
      </g>

      <g transform="translate(168 268)">
        <path d="M-22 0l22-30 22 30Z" fill="#e9dfc6" />
        <path d="M0-30v30" stroke="#b9aa8a" strokeWidth="1.4" />
        <path d="M-22 0h44" stroke="#a99b7d" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g fill="#3f5b3c">
        <path d="M520 262l14-28 14 28Z" />
        <path d="M534 268v-14" stroke="#3f5b3c" strokeWidth="4" />
        <path d="M470 274l10-20 10 20Z" />
        <path d="M480 278v-12" stroke="#3f5b3c" strokeWidth="3.4" />
      </g>

      <g transform={`translate(${marker.x} ${marker.y})`}>
        <circle r="9" fill="#c69a46" opacity="0.25" />
        <circle r="5" fill="#c69a46" stroke="#f7f4ea" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
