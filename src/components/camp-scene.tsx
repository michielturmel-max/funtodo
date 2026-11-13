export function CampScene({
  level = 1,
  items = [],
  className = "",
}: {
  level?: number;
  items?: string[];
  className?: string;
}) {
  const has = (id: string) => items.includes(id);
  const fireflies = Array.from({ length: Math.min(7, 2 + level) }, (_, index) => ({
    x: 150 + ((index * 97) % 330),
    y: 128 + ((index * 41) % 58),
    r: index % 2 === 0 ? 2.2 : 1.5,
  }));

  return (
    <svg
      viewBox="0 0 640 260"
      className={className}
      role="img"
      aria-label="Je kamp in de heuvels"
    >
      <defs>
        <linearGradient id="camp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8e6e0" />
          <stop offset="55%" stopColor="#e8eddd" />
          <stop offset="100%" stopColor="#f6efda" />
        </linearGradient>
        <radialGradient id="camp-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf3cf" />
          <stop offset="70%" stopColor="#f4e2ad" />
          <stop offset="100%" stopColor="#efd996" />
        </radialGradient>
        <radialGradient id="camp-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f7e7bb" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f7e7bb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="camp-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6d4c0" />
          <stop offset="100%" stopColor="#b3c4ae" />
        </linearGradient>
        <linearGradient id="camp-hillA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9bda2" />
          <stop offset="100%" stopColor="#87a282" />
        </linearGradient>
        <linearGradient id="camp-hillB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#74916c" />
          <stop offset="100%" stopColor="#4f6b52" />
        </linearGradient>
        <radialGradient id="camp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2a95f" stopOpacity="0.62" />
          <stop offset="55%" stopColor="#f0a45c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f0a45c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="260" fill="url(#camp-sky)" />

      <circle cx="505" cy="58" r="66" fill="url(#camp-halo)" />
      <circle cx="505" cy="58" r="29" fill="url(#camp-sun)" />

      <g fill="#f7f4ea">
        <path d="M84 78c4-11 16-16 28-11 6-10 20-12 28-4 9-3 18 3 19 12 9 0 14 4 14 8H78c-5-2-2-5 6-5Z" opacity="0.55" />
        <path d="M404 42c3-8 12-12 20-8 4-7 14-8 20-3 7-2 13 2 13 8 6 0 10 3 10 6H399c-3-1-1-3 5-3Z" opacity="0.4" />
        <path d="M218 54c2-6 9-9 15-6 3-5 10-6 15-2 5-1 9 2 9 6 4 0 7 2 7 4h-50c-2-1 0-2 4-2Z" opacity="0.35" />
      </g>

      <path
        d="M0 178c58-26 108-24 158-8 56 18 100 12 146-4 52-18 96-20 148-4 46 14 78 16 118 6 28-7 52-8 70-2v94H0Z"
        fill="url(#camp-ridge)"
      />
      <path
        d="M0 198c76-22 138-16 196 2 60 18 112 10 166-6 52-16 102-14 152 2 46 15 84 15 126 4v60H0Z"
        fill="url(#camp-hillA)"
      />
      <path
        d="M0 226c88-24 152-14 222-4 70 10 118 0 176-8 56-8 100-2 146 6 34 6 66 6 96 2v38H0Z"
        fill="url(#camp-hillB)"
      />

      <g fill="#3f5b3c">
        <path d="M96 162l17 32H79Z" />
        <path d="M96 178l21 30H75Z" fill="#46664a" />
        <path d="M96 194l24 28H72Z" />
        <rect x="93.5" y="216" width="5" height="12" rx="2" />
      </g>
      <g fill="#3f5b3c">
        <path d="M556 174l13 25h-26Z" />
        <path d="M556 187l16 24h-32Z" fill="#46664a" />
        <path d="M556 200l18 22h-36Z" />
        <rect x="554" y="218" width="4" height="10" rx="2" />
      </g>
      <g fill="#4f6b4a" opacity="0.85">
        <path d="M510 198l9 17h-18Z" />
        <path d="M510 208l11 16h-22Z" />
        <path d="M512 221l12 15h-24Z" />
      </g>

      <g fill="#4f6b4a">
        <ellipse cx="188" cy="214" rx="17" ry="9" />
        <ellipse cx="203" cy="211" rx="13" ry="8" />
        <ellipse cx="175" cy="211" rx="11" ry="7" />
        <ellipse cx="470" cy="216" rx="19" ry="9" />
        <ellipse cx="487" cy="213" rx="13" ry="8" />
        <ellipse cx="455" cy="213" rx="11" ry="7" />
      </g>

      <path
        d="M126 258c40-16 86-28 132-36 40-7 76-12 112-14l14 10c-40 4-78 11-118 20-46 10-90 18-134 22Z"
        fill="#cdbf9c"
        opacity="0.85"
      />
      <g fill="#b6a681">
        <ellipse cx="192" cy="244" rx="4.5" ry="2.4" />
        <ellipse cx="244" cy="230" rx="4" ry="2.2" />
        <ellipse cx="302" cy="220" rx="3.6" ry="2" />
      </g>

      <ellipse cx="300" cy="214" rx="66" ry="10" fill="#3f5b3c" opacity="0.16" />

      <g stroke="#b9aa8a" strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M302 152l-56 66" />
        <path d="M302 152l58 64" />
        <path d="M246 218v6M360 216v6" strokeWidth="2.2" />
      </g>

      <g>
        <path d="M302 150l-52 58h52Z" fill="#dfd2b5" />
        <path d="M302 150l50 58h-50Z" fill="#f2e8d2" />
        <path d="M302 150v58" stroke="#bcae90" strokeWidth="2" />
        <path d="M250 208h104" stroke="#a99b7d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M302 208v-30c11 6 19 17 24 30Z" fill="#8a5a37" />
        <path d="M302 208v-23c7 5 12 13 15 23Z" fill="#b5703f" opacity="0.5" />
        <path d="M278 178l24 30M328 186l-26 22" stroke="#c9b995" strokeWidth="1" opacity="0.55" />
      </g>

      {has("vlaggenlijn") && (
        <g>
          <path
            d="M302 152c-40 12-78 14-118 10-30-3-58 0-88 6"
            fill="none"
            stroke="#a99b7d"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
          {[
            { x: 278, y: 158, color: "#d9552a" },
            { x: 246, y: 161, color: "#e8b04a" },
            { x: 214, y: 163, color: "#4f6b4a" },
            { x: 182, y: 164, color: "#5f8899" },
            { x: 150, y: 163, color: "#d9552a" },
            { x: 120, y: 161, color: "#e8b04a" },
          ].map((flag, index) => (
            <path
              key={index}
              d={`M${flag.x} ${flag.y}l12 1-6 10Z`}
              fill={flag.color}
            />
          ))}
        </g>
      )}

      {has("lantaarn") && (
        <g>
          <circle cx="236" cy="192" r="26" fill="url(#camp-glow)" opacity="0.9" />
          <path d="M236 226v-32" stroke="#7b6a4d" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M228 196h16l-3-12h-10Z" fill="#f2c56f" stroke="#a97a4f" strokeWidth="1.4" />
          <path d="M229 194h14" stroke="#a97a4f" strokeWidth="1.2" />
          <circle cx="236" cy="201" r="2.4" fill="#fdf3cf" />
        </g>
      )}

      {has("brug") && (
        <g>
          <path
            d="M246 226c18-10 38-10 56-2"
            fill="none"
            stroke="#8a5f3c"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M250 221v7M266 217v8M282 218v8M298 222v7" stroke="#755031" strokeWidth="2.2" />
          <path d="M246 216c18-9 38-9 56-1" fill="none" stroke="#a97a4f" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {level >= 2 && (
        <g>
          <path d="M302 150v-18" stroke="#8a7c5f" strokeWidth="2" strokeLinecap="round" />
          <path d="M302 132l26 7-26 8Z" fill="#d9552a" />
        </g>
      )}

      {level >= 3 && (
        <g>
          <ellipse cx="228" cy="214" rx="16" ry="4" fill="#3f5b3c" opacity="0.25" />
          <rect x="216" y="200" width="26" height="6" rx="3" fill="#8a5f3c" />
          <rect x="217" y="206" width="25" height="6" rx="3" fill="#755031" />
          <circle cx="222" cy="203" r="3" fill="#a97a4f" />
        </g>
      )}

      <circle cx="398" cy="198" r="52" fill="url(#camp-glow)" />

      <g fill="#9aa18f">
        <ellipse cx="378" cy="212" rx="5" ry="3" />
        <ellipse cx="388" cy="216" rx="5.5" ry="3.2" />
        <ellipse cx="399" cy="218" rx="6" ry="3.4" />
        <ellipse cx="410" cy="216" rx="5.5" ry="3.2" />
        <ellipse cx="419" cy="211" rx="5" ry="3" />
        <ellipse cx="373" cy="207" rx="3.6" ry="2.2" />
      </g>

      <g strokeLinecap="round">
        <path d="M387 216l24 3" stroke="#a97a4f" strokeWidth="4.2" />
        <path d="M388 220l22-4" stroke="#b98a5d" strokeWidth="3.8" />
        <circle cx="386" cy="215.5" r="2.3" fill="#c99c6d" stroke="none" />
        <circle cx="412" cy="219.5" r="2.3" fill="#c99c6d" stroke="none" />
        <circle cx="387" cy="220.5" r="2.1" fill="#c99c6d" stroke="none" />
        <circle cx="410" cy="215.5" r="2.1" fill="#c99c6d" stroke="none" />
      </g>

      <g className="animate-flame" style={{ transformBox: "fill-box", transformOrigin: "50% 92%" }}>
        <path
          d="M398 212c-6-9 1-15-1-26 7 6 10 9 11 15 3-5 4-9 3-13 7 8 10 15 9 22-1 8-9 12-18 10-7-1-11-5-9-10 1-5 4-8 6-12-1 7-3 10-1 14Z"
          fill="#d9552a"
        />
        <path
          d="M398 214c-3-6 1-9-1-15 4 3 6 6 6 10 2-3 3-5 2-8 5 5 7 10 6 14-1 5-6 7-11 6-4-1-6-3-6-6 0-3 2-5 4-8-1 4-1 6 0 7Z"
          fill="#e8b04a"
        />
        <path d="M397 214c-1-3 2-5 1-8 2 2 4 4 4 6 0 2-2 4-5 3Z" fill="#f7d488" />
      </g>

      <g fill="#e8b04a">
        <circle cx="392" cy="176" r="1.7" opacity="0.85" />
        <circle cx="405" cy="167" r="1.3" opacity="0.65" />
        <circle cx="399" cy="158" r="1.1" opacity="0.45" />
      </g>

      <g fill="none" stroke="#f7f4ea" strokeLinecap="round" opacity="0.35">
        <path d="M400 150c4-8-3-13 1-20" strokeWidth="2" />
        <path d="M408 158c5-7-1-12 3-18" strokeWidth="1.4" />
      </g>

      <g fill="#5e7a58">
        <path d="M348 226l3-9 3 9M357 228l2-7 3 7M442 224l3-10 3 10M452 227l2-7 2 7M166 226l3-9 3 9M156 228l2-7 3 7" />
      </g>

      <g>
        <circle cx="268" cy="232" r="2.6" fill="#f7f4ea" />
        <circle cx="268" cy="232" r="1.1" fill="#c69a46" />
        <circle cx="330" cy="238" r="2.2" fill="#f7f4ea" />
        <circle cx="330" cy="238" r="0.9" fill="#c69a46" />
        <circle cx="434" cy="236" r="2.4" fill="#f7f4ea" />
        <circle cx="434" cy="236" r="1" fill="#c69a46" />
      </g>

      {has("houtstapel") && (
        <g>
          <ellipse cx="352" cy="236" rx="19" ry="4" fill="#3f5b3c" opacity="0.22" />
          <rect x="335" y="226" width="34" height="6" rx="3" fill="#8a5f3c" />
          <rect x="338" y="220" width="28" height="6" rx="3" fill="#a97a4f" />
          <rect x="341" y="214" width="20" height="6" rx="3" fill="#b5834f" />
          <circle cx="336" cy="229" r="2.6" fill="#c99c6d" />
          <circle cx="339" cy="223" r="2.3" fill="#c99c6d" />
          <circle cx="342" cy="217" r="2" fill="#c99c6d" />
        </g>
      )}

      {has("bankje") && (
        <g>
          <ellipse cx="462" cy="234" rx="24" ry="4" fill="#3f5b3c" opacity="0.2" />
          <rect x="440" y="222" width="44" height="5" rx="2.5" fill="#a97a4f" />
          <rect x="444" y="214" width="36" height="4" rx="2" fill="#b98a5d" />
          <path d="M446 227v9M478 227v9" stroke="#755031" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M446 214v-4M478 214v-4" stroke="#755031" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {has("bloementuin") && (
        <g>
          {[
            { x: 492, y: 246, color: "#d9552a" },
            { x: 508, y: 250, color: "#e8b04a" },
            { x: 524, y: 244, color: "#5f8899" },
            { x: 540, y: 249, color: "#d9552a" },
            { x: 556, y: 245, color: "#e8b04a" },
          ].map((flower, index) => (
            <g key={index}>
              <path d={`M${flower.x} ${flower.y + 6}v-8`} stroke="#5e7a58" strokeWidth="1.2" />
              <circle cx={flower.x} cy={flower.y} r="3" fill={flower.color} />
              <circle cx={flower.x} cy={flower.y} r="1" fill="#f7f4ea" />
            </g>
          ))}
        </g>
      )}

      {has("vogelhuisje") && (
        <g>
          <path d="M548 196v-14" stroke="#8a7c5f" strokeWidth="2" strokeLinecap="round" />
          <path d="M540 182h18v14h-18Z" fill="#e9dfc6" stroke="#a99b7d" strokeWidth="1.2" />
          <path d="M538 182l11-9 11 9Z" fill="#d9552a" />
          <circle cx="549" cy="188" r="2.4" fill="#4f6b4a" />
        </g>
      )}

      <g fill="#f4d187">
        {fireflies.map((fly, index) => (
          <circle key={index} cx={fly.x} cy={fly.y} r={fly.r} opacity={0.55 + (index % 3) * 0.12} />
        ))}
      </g>
    </svg>
  );
}
