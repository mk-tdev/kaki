import Image from "next/image";

export function HeroCommunityBloom() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg
        className="absolute inset-0 z-[15] size-full overflow-visible"
        viewBox="0 0 590 590"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          className="hero-link-path"
          d="M175 226 C112 244 44 268 -25 286"
          stroke="url(#hero-link-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="hero-link-gradient" x1="175" y1="226" x2="-25" y2="286" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6D55D9" />
            <stop offset=".52" stopColor="#F46F5F" />
            <stop offset="1" stopColor="#238968" />
          </linearGradient>
        </defs>
      </svg>

      <div className="hero-bloom-hub absolute -left-[10%] top-[43%] z-30 grid size-14 place-items-center sm:size-16">
        <span className="hero-bloom-icon relative block size-full overflow-hidden rounded-[19px] shadow-[0_12px_30px_rgba(79,55,189,.28)]">
          <Image src="/icons/icon-192.png" alt="" fill sizes="64px" className="object-cover" />
        </span>
        <span className="hero-petal hero-petal-a" />
        <span className="hero-petal hero-petal-b" />
        <span className="hero-petal hero-petal-c" />
      </div>
    </div>
  );
}
