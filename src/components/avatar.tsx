import type { AvatarConfig } from "@/lib/avatar";
import { avatarOptionColor } from "@/lib/avatar";

const SKIN_FALLBACK = "#e6b98f";
const HAIR_FALLBACK = "#5a3a25";
const OUTFIT_FALLBACK = "#4f6b4a";

export function Avatar({
  config,
  className = "",
  title,
}: {
  config: AvatarConfig;
  className?: string;
  title?: string;
}) {
  const skin = avatarOptionColor("skin", config.skin) ?? SKIN_FALLBACK;
  const hair = avatarOptionColor("hairColor", config.hairColor) ?? HAIR_FALLBACK;
  const outfit = avatarOptionColor("outfitColor", config.outfitColor) ?? OUTFIT_FALLBACK;
  const shade = "rgba(22, 36, 29, 0.16)";
  const light = "rgba(255, 255, 255, 0.35)";

  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ borderRadius: "9999px", overflow: "hidden" }}
    >
      <defs>
        <clipPath id="funtodo-avatar-clip">
          <circle cx="60" cy="70" r="60" />
        </clipPath>
      </defs>

      <circle cx="60" cy="70" r="60" fill="#e7ebe1" />
      <circle cx="60" cy="70" r="59" fill="none" stroke="#c9d1c3" strokeWidth="1.5" />

      <g clipPath="url(#funtodo-avatar-clip)">
      {(config.hair === "lang" || config.hair === "staart") && (
        <g fill={hair}>
          {config.hair === "lang" && (
            <path d="M28 62c0-23 14-35 32-35s32 12 32 35v52c-7 3-13 0-14-7l-1-18H43l-1 18c-1 7-7 10-14 7Z" />
          )}
          {config.hair === "staart" && (
            <g>
              <ellipse cx="91" cy="72" rx="9" ry="21" />
              <circle cx="88" cy="58" r="6" />
            </g>
          )}
        </g>
      )}

      <rect x="53" y="80" width="14" height="16" rx="6" fill={skin} />
      <rect x="53" y="80" width="14" height="7" fill={shade} opacity="0.5" />

      {config.outfit === "poncho" ? (
        <g>
          <path d="M16 135l16-33c9-8 47-8 56 0l16 33Z" fill={outfit} />
          <path d="M30 106h60" stroke={shade} strokeWidth="2" />
          <path d="M26 120h68" stroke={light} strokeWidth="2" />
          <path d="M25 135v-8M34 135v-8M43 135v-8M52 135v-8M61 135v-8M70 135v-8M79 135v-8M88 135v-8M97 135v-8" stroke={shade} strokeWidth="1.4" />
        </g>
      ) : config.outfit === "trui" ? (
        <g>
          <path d="M29 135c0-25 13-38 31-38s31 13 31 38Z" fill={outfit} />
          <path d="M45 99c4 6 9 9 15 9s11-3 15-9" fill="none" stroke={shade} strokeWidth="2.4" />
          <path d="M31 126h58" stroke={shade} strokeWidth="2" />
        </g>
      ) : config.outfit === "reisjas" ? (
        <g>
          <path d="M28 135c0-26 13-39 32-39s32 13 32 39Z" fill={outfit} />
          <path d="M60 98v37" stroke={shade} strokeWidth="2" />
          <path d="M43 98l17 15 17-15" fill="none" stroke={shade} strokeWidth="2.4" />
          <rect x="27" y="118" width="66" height="5" rx="2.5" fill={shade} />
        </g>
      ) : (
        <g>
          <path d="M32 135c0-26 10-39 28-39s28 13 28 39Z" fill={outfit} />
          <path d="M52 97l8 9 8-9" fill="none" stroke={shade} strokeWidth="2.4" />
          <rect x="34" y="118" width="52" height="5" rx="2.5" fill={shade} />
        </g>
      )}

      <circle cx="34" cy="62" r="5" fill={skin} />
      <circle cx="86" cy="62" r="5" fill={skin} />
      <circle cx="60" cy="60" r="27" fill={skin} />
      <path d="M60 33a27 27 0 0 1 27 27c0 4-1 7-2 10-9 4-40 5-50-2-1-3-2-5-2-8a27 27 0 0 1 27-27Z" fill={light} opacity="0.25" />

      {config.hair === "kort" && (
        <path d="M33 59c0-17 12-27 27-27s27 10 27 27c-4-9-10-14-18-15-6 4-15 5-24 3-5 1-9 5-12 12Z" fill={hair} />
      )}
      {config.hair === "krullen" && (
        <g fill={hair}>
          <circle cx="42" cy="42" r="10" />
          <circle cx="57" cy="35" r="11" />
          <circle cx="73" cy="39" r="10" />
          <circle cx="84" cy="51" r="8" />
          <circle cx="36" cy="54" r="8" />
          <circle cx="47" cy="34" r="8" />
          <circle cx="67" cy="31" r="8" />
        </g>
      )}
      {config.hair === "knot" && (
        <g fill={hair}>
          <path d="M33 59c0-17 12-27 27-27s27 10 27 27c-4-9-10-14-18-15-6 4-15 5-24 3-5 1-9 5-12 12Z" />
          <circle cx="60" cy="26" r="9" />
        </g>
      )}
      {config.hair === "lang" && (
        <g fill={hair}>
          <path d="M33 59c0-17 12-27 27-27s27 10 27 27c-4-9-10-14-18-15-6 4-15 5-24 3-5 1-9 5-12 12Z" />
          <path d="M33 52c-2 12-2 22 0 31l7-2-1-26Z" />
          <path d="M87 52c2 12 2 22 0 31l-7-2 1-26Z" />
        </g>
      )}
      {config.hair === "staart" && (
        <path d="M33 59c0-17 12-27 27-27s27 10 27 27c-4-9-10-14-18-15-6 4-15 5-24 3-5 1-9 5-12 12Z" fill={hair} />
      )}

      <g fill="#2b322c">
        <circle cx="51" cy="61" r="2.3" />
        <circle cx="69" cy="61" r="2.3" />
      </g>
      <circle cx="45" cy="68" r="3.2" fill="#d9552a" opacity="0.16" />
      <circle cx="75" cy="68" r="3.2" fill="#d9552a" opacity="0.16" />
      <path d="M55 70c2.5 3 7.5 3 10 0" fill="none" stroke="#2b322c" strokeWidth="1.8" strokeLinecap="round" />

      {config.accessory === "bril" && (
        <g fill="none" stroke="#2b322c" strokeWidth="1.8">
          <circle cx="50" cy="61" r="7.5" />
          <circle cx="70" cy="61" r="7.5" />
          <path d="M57.5 61h5M42.5 60l-6-1M77.5 60l6-1" strokeLinecap="round" />
        </g>
      )}
      {config.accessory === "sjaal" && (
        <g fill="#c14f2a">
          <rect x="40" y="86" width="40" height="11" rx="5.5" />
          <path d="M70 94h9v20l-4.5-4-4.5 4Z" />
        </g>
      )}
      {config.accessory === "muts" && (
        <g>
          <path d="M36 50c1-17 11-26 24-26s23 9 24 26Z" fill="#c14f2a" />
          <rect x="32" y="45" width="56" height="10" rx="5" fill="#a33f22" />
          <circle cx="60" cy="23" r="6" fill="#f7f4ea" />
        </g>
      )}
      {config.accessory === "bloem" && (
        <g>
          <circle cx="86" cy="43" r="3.4" fill="#f7f4ea" />
          <circle cx="92" cy="47" r="3.4" fill="#f7f4ea" />
          <circle cx="90" cy="54" r="3.4" fill="#f7f4ea" />
          <circle cx="82" cy="54" r="3.4" fill="#f7f4ea" />
          <circle cx="80" cy="47" r="3.4" fill="#f7f4ea" />
          <circle cx="86" cy="48" r="3" fill="#c69a46" />
        </g>
      )}
      {config.accessory === "ster" && (
        <path
          d="M88 34l2.7 5.4 6 .9-4.3 4.2 1 5.9-5.4-2.9-5.4 2.9 1-5.9-4.3-4.2 6-.9Z"
          fill="#c69a46"
          stroke="#a37c2f"
          strokeWidth="1"
        />
      )}
      </g>
    </svg>
  );
}
