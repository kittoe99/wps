import type { SiteFile } from "./types";

type SiteKind =
  "portfolio" | "restaurant" | "saas" | "agency" | "cafe" | "landing";

interface Theme {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  surface: string;
  fontDisplay: string;
  fontBody: string;
  atmosphere: string;
}

const THEMES: Record<SiteKind, Theme> = {
  portfolio: {
    bg: "#0f1419",
    fg: "#f4f1ea",
    muted: "#9aa4b2",
    accent: "#e8ff47",
    accentSoft: "rgba(232,255,71,0.12)",
    surface: "#1a222c",
    fontDisplay: "Syne",
    fontBody: "Manrope",
    atmosphere:
      "radial-gradient(ellipse 80% 60% at 70% 10%, rgba(232,255,71,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(56,189,248,0.12), transparent 50%)",
  },
  restaurant: {
    bg: "#1a1210",
    fg: "#f7efe6",
    muted: "#b9a89a",
    accent: "#f0a05a",
    accentSoft: "rgba(240,160,90,0.14)",
    surface: "#261c18",
    fontDisplay: "Fraunces",
    fontBody: "Source Sans 3",
    atmosphere:
      "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(240,160,90,0.22), transparent 55%), linear-gradient(180deg, #1a1210 0%, #120d0b 100%)",
  },
  saas: {
    bg: "#07131f",
    fg: "#eef6ff",
    muted: "#8aa0b8",
    accent: "#3de0c6",
    accentSoft: "rgba(61,224,198,0.14)",
    surface: "#0d1c2b",
    fontDisplay: "Space Grotesk",
    fontBody: "IBM Plex Sans",
    atmosphere:
      "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(61,224,198,0.16), transparent 50%), radial-gradient(ellipse 50% 40% at 90% 70%, rgba(59,130,246,0.18), transparent 45%)",
  },
  agency: {
    bg: "#101010",
    fg: "#f5f5f0",
    muted: "#a3a39a",
    accent: "#ff5c35",
    accentSoft: "rgba(255,92,53,0.14)",
    surface: "#1b1b1b",
    fontDisplay: "Archivo Black",
    fontBody: "DM Sans",
    atmosphere:
      "linear-gradient(135deg, rgba(255,92,53,0.16) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.06), transparent 35%)",
  },
  cafe: {
    bg: "#1c1714",
    fg: "#f6efe7",
    muted: "#b7a79a",
    accent: "#c9a26a",
    accentSoft: "rgba(201,162,106,0.16)",
    surface: "#2a221c",
    fontDisplay: "Playfair Display",
    fontBody: "Karla",
    atmosphere:
      "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,162,106,0.2), transparent 55%)",
  },
  landing: {
    bg: "#0b1220",
    fg: "#f3f6fb",
    muted: "#93a4bc",
    accent: "#6ee7ff",
    accentSoft: "rgba(110,231,255,0.14)",
    surface: "#121b2c",
    fontDisplay: "Outfit",
    fontBody: "Figtree",
    atmosphere:
      "radial-gradient(ellipse 70% 55% at 60% 0%, rgba(110,231,255,0.18), transparent 55%), radial-gradient(ellipse 40% 35% at 10% 90%, rgba(167,139,250,0.1), transparent 50%)",
  },
};

function detectKind(prompt: string): SiteKind {
  const p = prompt.toLowerCase();
  if (/portfolio|photographer|designer|artist|creative/.test(p))
    return "portfolio";
  if (/restaurant|bistro|dining|chef|menu/.test(p)) return "restaurant";
  if (/saas|software|platform|dashboard|api|product/.test(p)) return "saas";
  if (/agency|studio|marketing|branding/.test(p)) return "agency";
  if (/cafe|coffee|bakery|tea/.test(p)) return "cafe";
  return "landing";
}

function extractTitle(prompt: string, kind: SiteKind): string {
  const quoted = prompt.match(/["“](.+?)["”]/);
  if (quoted?.[1]) return quoted[1].trim();

  const named = prompt.match(
    /(?:called|named|for|brand)\s+([A-Z][\w&'’\- ]{1,40})/,
  );
  if (named?.[1]) return named[1].trim();

  const defaults: Record<SiteKind, string> = {
    portfolio: "Northline Studio",
    restaurant: "Hearth & Grain",
    saas: "Signalboard",
    agency: "Fieldwork",
    cafe: "Copper Bean",
    landing: "Lumen",
  };
  return defaults[kind];
}

function headlineFor(kind: SiteKind, title: string): { h: string; s: string } {
  switch (kind) {
    case "portfolio":
      return {
        h: "Work that holds attention.",
        s: `${title} builds visual systems and digital experiences with clarity and craft.`,
      };
    case "restaurant":
      return {
        h: "Fire, flour, and patience.",
        s: `${title} serves seasonal plates in a room built for lingering.`,
      };
    case "saas":
      return {
        h: "Ship clarity, not clutter.",
        s: `${title} helps teams see what matters and act before it slips.`,
      };
    case "agency":
      return {
        h: "Brands with a pulse.",
        s: `${title} designs identity, product, and campaigns that feel inevitable.`,
      };
    case "cafe":
      return {
        h: "Slow pours. Warm light.",
        s: `${title} is a neighborhood room for coffee, pastry, and quiet mornings.`,
      };
    default:
      return {
        h: "Build something people feel.",
        s: `${title} turns a sharp idea into a site that moves.`,
      };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildLocalSite(prompt: string): {
  title: string;
  summary: string;
  files: SiteFile[];
} {
  const kind = detectKind(prompt);
  const theme = THEMES[kind];
  const title = extractTitle(prompt, kind);
  const { h, s } = headlineFor(kind, title);
  const safeTitle = escapeHtml(title);
  const safeHeadline = escapeHtml(h);
  const safeSupport = escapeHtml(s);
  const safePrompt = escapeHtml(prompt.trim());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontDisplay).replace(/%20/g, "+")}:wght@500;700;800&family=${encodeURIComponent(theme.fontBody).replace(/%20/g, "+")}:wght@400;500;600&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            ink: "${theme.bg}",
            paper: "${theme.fg}",
            mute: "${theme.muted}",
            accent: "${theme.accent}",
            panel: "${theme.surface}",
          },
          fontFamily: {
            display: ["${theme.fontDisplay}", "system-ui", "sans-serif"],
            body: ["${theme.fontBody}", "system-ui", "sans-serif"],
          },
        },
      },
    };
  </script>
  <style>
    :root { color-scheme: dark; }
    body {
      background: ${theme.bg};
      background-image: ${theme.atmosphere};
      background-attachment: fixed;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes drift {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .anim-rise { animation: rise 0.9s ease both; }
    .anim-rise-delay { animation: rise 0.9s ease 0.15s both; }
    .anim-rise-late { animation: rise 0.9s ease 0.3s both; }
    .anim-drift { animation: drift 7s ease-in-out infinite; }
  </style>
</head>
<body class="min-h-screen text-paper font-body antialiased">
  <header class="relative overflow-hidden">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <a href="#top" class="font-display text-2xl tracking-tight">${safeTitle}</a>
      <div class="hidden items-center gap-8 text-sm text-mute md:flex">
        <a class="hover:text-paper transition" href="#work">Work</a>
        <a class="hover:text-paper transition" href="#about">About</a>
        <a class="hover:text-paper transition" href="#contact">Contact</a>
      </div>
      <a href="#contact" class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110">Get started</a>
    </nav>

    <section id="top" class="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pb-28 md:pt-16">
      <div>
        <p class="anim-rise mb-4 text-sm uppercase tracking-[0.22em] text-accent">${safeTitle}</p>
        <h1 class="anim-rise-delay font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">${safeHeadline}</h1>
        <p class="anim-rise-late mt-6 max-w-xl text-lg text-mute">${safeSupport}</p>
        <div class="anim-rise-late mt-10 flex flex-wrap gap-4">
          <a href="#contact" class="rounded-full bg-accent px-6 py-3 font-semibold text-ink transition hover:brightness-110">Start a project</a>
          <a href="#work" class="rounded-full border border-white/15 px-6 py-3 text-paper transition hover:border-accent/60">See the work</a>
        </div>
      </div>
      <div class="anim-drift relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-panel md:min-h-[420px]">
        <div class="absolute inset-0" style="background: linear-gradient(145deg, ${theme.accentSoft}, transparent 55%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12), transparent 40%);"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p class="text-sm uppercase tracking-[0.18em] text-mute">Brief</p>
          <p class="mt-3 max-w-md text-base leading-relaxed text-paper/90">${safePrompt || "A modern site shaped from your brief."}</p>
        </div>
      </div>
    </section>
  </header>

  <section id="work" class="mx-auto max-w-6xl px-6 py-20">
    <h2 class="font-display text-3xl tracking-tight md:text-4xl">Selected pieces</h2>
    <p class="mt-3 max-w-2xl text-mute">One idea per section. Built with modern HTML and Tailwind utility classes.</p>
    <div class="mt-12 grid gap-8 md:grid-cols-3">
      ${["Signal", "Form", "Motion"]
        .map(
          (name, i) => `
      <article class="border-t border-white/10 pt-6">
        <p class="text-sm text-accent">0${i + 1}</p>
        <h3 class="mt-3 font-display text-2xl">${name}</h3>
        <p class="mt-3 text-mute">A focused module that supports the story without competing with the brand.</p>
      </article>`,
        )
        .join("")}
    </div>
  </section>

  <section id="about" class="mx-auto max-w-6xl px-6 py-20">
    <div class="grid gap-10 md:grid-cols-2 md:items-center">
      <div>
        <h2 class="font-display text-3xl tracking-tight md:text-4xl">Made for the scroll, tuned for the glance.</h2>
        <p class="mt-5 text-mute leading-relaxed">This page was generated locally by Atelier. Swap in OpenCode (or another coding agent) when you wire a model — the output format stays the same: clean HTML + Tailwind.</p>
      </div>
      <div class="rounded-[1.5rem] border border-white/10 bg-panel/80 p-8">
        <ul class="space-y-4 text-sm">
          <li class="flex justify-between border-b border-white/10 pb-3"><span class="text-mute">Stack</span><span>HTML + Tailwind CDN</span></li>
          <li class="flex justify-between border-b border-white/10 pb-3"><span class="text-mute">Motion</span><span>CSS keyframes</span></li>
          <li class="flex justify-between"><span class="text-mute">Agent</span><span>Local builder</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section id="contact" class="mx-auto max-w-6xl px-6 py-20">
    <div class="rounded-[2rem] border border-white/10 bg-panel px-8 py-12 md:px-12">
      <h2 class="font-display text-3xl tracking-tight md:text-5xl">Ready when you are.</h2>
      <p class="mt-4 max-w-xl text-mute">Tell us what to build next. Iterate in the studio, preview instantly, export the files.</p>
      <a href="mailto:hello@${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com" class="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-ink transition hover:brightness-110">hello@${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "") || "atelier"}.com</a>
    </div>
  </section>

  <footer class="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 text-sm text-mute">
    <span>${safeTitle}</span>
    <span>Built with Atelier</span>
  </footer>
</body>
</html>
`;

  return {
    title,
    summary: `Generated a ${kind} site for "${title}" using the local HTML+Tailwind builder.`,
    files: [{ path: "index.html", content: html }],
  };
}
