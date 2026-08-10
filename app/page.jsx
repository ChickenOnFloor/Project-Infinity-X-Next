"use client";

import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Check,
  Zap,
  Shield,
  Clock,
  Crown,
  Gamepad2,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  Cog,
  ArrowUpCircle,
  KeyRound,
  Rocket,
  Package,
  Share2,
  Star,
  MoreHorizontal,
  Settings as SettingsIcon,
  Minus,
  ChevronDown,
  ArrowUp,
  Lock,
} from "lucide-react";

const DISCORD_INVITE = "https://discord.gg/88gR5XUpkC";

// Same-origin now — no cross-domain fetch, no CORS config needed at all.
const STOCK_ENDPOINT = "/api/stock";

const GAMES = [
  { name: "99 Nights in the Forest", exec: "Xeno" },
  { name: "Evade", exec: "Xeno" },
  { name: "MM2", exec: "Xeno" },
  { name: "Pet Simulator 99", exec: null },
  { name: "Be A Lucky Block", exec: "Xeno" },
  { name: "Bite By Night", exec: "Xeno" },
  { name: "Fish It", exec: null },
  { name: "Slime RNG", exec: null },
];

const PLANS = [
  {
    id: "week",
    label: "Weekly",
    price: "5",
    period: "/ 7 days",
    icon: Clock,
    tagline: "Try the hub, no commitment",
    features: [
      "Full access — all 8 games",
      "Key delivered instantly",
      "Update patches included",
      "Discord support channel",
    ],
    featured: false,
    gumroad: "https://jawwad3.gumroad.com/l/ffwptz",
  },
  {
    id: "month",
    label: "Monthly",
    price: "10",
    period: "/ 30 days",
    icon: Zap,
    tagline: "Best balance of price and length",
    features: [
      "Full access — all 8 games",
      "Key delivered instantly",
      "Update patches included",
      "Priority Discord support",
      "Early access to new games",
    ],
    featured: false,
    gumroad: "https://jawwad3.gumroad.com/l/ylkirn",
  },
  {
    id: "life",
    label: "Lifetime",
    price: "20",
    period: "one-time",
    icon: Crown,
    tagline: "Pay once, own it forever",
    features: [
      "Full access — all 8 games",
      "Key delivered instantly",
      "All future games included",
      "Priority Discord support",
      "Early access to new games",
      "Locked-in price, forever",
    ],
    featured: true,
    gumroad: "https://jawwad3.gumroad.com/l/pziswz",
  },
];

const TERMINAL_LINES = [
  "> booting infinity_x core...",
  "> target executor: xeno  [OK]",
  "> mounting universal script layer...",
  "> loading 8/8 game modules...  [OK]",
  "> integrity check...  [OK]",
  "> ready. drop key to continue_",
];

const PANEL_SIDEBAR = [
  { label: "Machines", icon: Cog },
  { label: "Upgrades", icon: ArrowUpCircle },
  { label: "Keys", icon: KeyRound },
  { label: "Boosts", icon: Rocket },
  { label: "Items", icon: Package },
  { label: "Webhook", icon: Share2 },
  { label: "Event", icon: Star, active: true },
  { label: "Misc", icon: MoreHorizontal },
  { label: "Settings", icon: SettingsIcon },
];

const PANEL_TOGGLES_TOP = [
  { label: "Auto Complete Maze/Collect Rewards", on: true },
  { label: "Auto Challenge Pinata Boss", on: false },
  { label: "Leave Maze On Completion", on: true, highlight: true },
];

const LOW_STOCK_THRESHOLD = 5;

const STOCK_KEY_BY_PLAN_ID = {
  week: "weekly",
  month: "monthly",
  life: "lifetime",
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useStock() {
  const [stock, setStock] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStock() {
      try {
        // The timestamp also avoids a stale CDN/browser response if one was
        // cached before the API's no-store headers are applied.
        const res = await fetch(`${STOCK_ENDPOINT}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        if (!cancelled) {
          setStock(data);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      }
    }

    fetchStock();
    const interval = setInterval(fetchStock, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stock, error };
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ---------------------------------------------------------------------------
// Terminal hero animation
// ---------------------------------------------------------------------------

function TerminalWindow() {
  const [visibleLines, setVisibleLines] = useState([]);
  const [charIndex, setCharIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex >= TERMINAL_LINES.length) return;
    const current = TERMINAL_LINES[lineIndex];

    if (charIndex <= current.length) {
      const t = setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev];
          next[lineIndex] = current.slice(0, charIndex);
          return next;
        });
        setCharIndex((c) => c + 1);
      }, 16 + Math.random() * 22);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLineIndex((l) => l + 1);
        setCharIndex(0);
      }, 260);
      return () => clearTimeout(t);
    }
  }, [charIndex, lineIndex]);

  return (
    <div className="term-window">
      <div className="term-titlebar">
        <div className="term-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <span className="term-title">infinity_x — universal.sh</span>
      </div>
      <div className="term-body">
        {visibleLines.map((line, i) => (
          <div key={i} className="term-line">
            {line}
            {i === lineIndex && <span className="term-cursor">▌</span>}
          </div>
        ))}
        {lineIndex >= TERMINAL_LINES.length && (
          <div className="term-line term-line-final">
            <span className="term-cursor">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel preview mockup
// ---------------------------------------------------------------------------

function Toggle({ on }) {
  return (
    <div className={`pv-toggle ${on ? "pv-toggle-on" : ""}`}>
      <div className="pv-toggle-thumb" />
    </div>
  );
}

function PanelPreview() {
  const [sectionRef, inView] = useInView(0.2);
  const [startRaid, setStartRaid] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setStartRaid((v) => !v), 2600);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <section id="preview" className="section" ref={sectionRef}>
      <div className="section-head">
        <span className="section-kicker">// live_panel_preview</span>
        <h2>The actual in-game panel</h2>
        <p className="section-sub">
          What you get after redeeming a key — a clean, organized UI with
          full control over every feature, per game.
        </p>
      </div>

      <div className={`panel-mock ${inView ? "panel-mock-visible" : ""}`}>
        <div className="panel-glow" aria-hidden="true" />

        <div className="panel-window">
          <div className="panel-topbar">
            <div className="panel-brand">
              <span className="panel-brand-dot" />
              Project Infinity X | Pet Simulator 99
            </div>
            <div className="panel-topbar-right">
              <span className="panel-keybind">[ RightControl ]</span>
              <Minus size={14} />
            </div>
          </div>

          <div className="panel-body">
            <div className="panel-sidebar">
              {PANEL_SIDEBAR.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`panel-nav-item ${item.active ? "panel-nav-active" : ""}`}
                    style={{ transitionDelay: `${i * 45}ms` }}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="panel-content">
              {PANEL_TOGGLES_TOP.map((row) => (
                <div
                  key={row.label}
                  className={`panel-row ${row.highlight ? "panel-row-highlight" : ""}`}
                >
                  <span className="panel-row-label">
                    <ArrowUp size={11} className="panel-row-icon" />
                    {row.label}
                  </span>
                  <Toggle on={row.on} />
                </div>
              ))}

              <div className="panel-divider">
                <span>Auto Raid</span>
              </div>

              <div className="panel-row">
                <span className="panel-row-label">
                  <ArrowUp size={11} className="panel-row-icon" />
                  Raid Difficulty : Custom
                </span>
                <ChevronDown size={15} className="panel-chevron" />
              </div>

              <div className="panel-row">
                <span className="panel-row-label">
                  <ArrowUp size={11} className="panel-row-icon" />
                  Raid Difficulty (Custom)
                </span>
                <span className="panel-input">2000</span>
              </div>

              <div className="panel-row">
                <span className="panel-row-label">
                  <ArrowUp size={11} className="panel-row-icon" />
                  Start Raid
                </span>
                <Toggle on={startRaid} />
              </div>

              <div className="panel-row panel-row-locked">
                <span className="panel-row-label">
                  <ArrowUp size={11} className="panel-row-icon" />
                  Claim Leprechaun Chest (Need Key)
                  <Lock size={11} className="panel-lock" />
                </span>
                <Toggle on={false} />
              </div>
            </div>
          </div>
        </div>

        <p className="panel-caption">
          Live preview — actual panel shown after redeeming a Project
          Infinity X key
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">
          <Terminal size={18} strokeWidth={2.4} />
          <span>
            PROJECT <span className="brand-accent">INFINITY X</span>
          </span>
        </div>
        <nav className="nav-links">
          <a href="#preview">Preview</a>
          <a href="#games">Games</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <a className="nav-discord" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} />
            <span>Discord</span>
          </a>
          <a className="nav-cta" href="#pricing">
            Get a key <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot-live" />
            8 GAMES · XENO COMPATIBLE
          </div>
          <h1>
            One hub.
            <br />
            Every game you play.
          </h1>
          <p className="hero-sub">
            Project Infinity X is a universal script hub built for Xeno. Pick a
            plan, get your key, drop it in and play — across every supported
            title, on one subscription.
          </p>
          <div className="hero-actions">
            <a href="#pricing" className="btn btn-primary">
              View plans <ChevronRight size={16} />
            </a>
            <a href="#games" className="btn btn-ghost">
              See supported games
            </a>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <MessageCircle size={16} />
              Join Discord
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>8</strong>
              <span>games supported</span>
            </div>
            <div>
              <strong>$5</strong>
              <span>starting price</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>key delivery</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <TerminalWindow />
        </div>
      </div>
    </section>
  );
}

function Games() {
  return (
    <section id="games" className="section">
      <div className="section-head">
        <span className="section-kicker">// supported_games</span>
        <h2>Built for the games you already have open</h2>
        <p className="section-sub">
          Every title below runs on the same key, same panel, same hub — no
          separate purchases per game.
        </p>
      </div>
      <div className="games-grid">
        {GAMES.map((g) => (
          <div className="game-card" key={g.name}>
            <div className="game-icon">
              <Gamepad2 size={18} />
            </div>
            <div className="game-name">{g.name}</div>
            {g.exec && (
              <div className="game-badge">
                <Shield size={11} />
                {g.exec} Supported
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StockBadge({ count, error }) {
  if (error) {
    return <div className="stock-badge stock-out">Stock unavailable</div>;
  }
  if (count === null || count === undefined) {
    return <div className="stock-badge stock-loading">Checking stock…</div>;
  }
  if (count <= 0) {
    return <div className="stock-badge stock-out">Sold out</div>;
  }
  if (count <= LOW_STOCK_THRESHOLD) {
    return <div className="stock-badge stock-low">Only {count} left</div>;
  }
  return <div className="stock-badge stock-ok">{count} in stock</div>;
}

function Pricing() {
  const { stock, error } = useStock();

  return (
    <section id="pricing" className="section section-alt">
      <div className="section-head">
        <span className="section-kicker">// choose_plan</span>
        <h2>Simple pricing. No per-game upcharges.</h2>
        <p className="section-sub">
          Checkout is handled securely through Gumroad. Your key arrives on
          the confirmation screen and by email.
        </p>
      </div>
      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const stockKey = STOCK_KEY_BY_PLAN_ID[plan.id];
          const count = stock ? stock[stockKey] : null;
          const soldOut = count !== null && count !== undefined && count <= 0;

          return (
            <div key={plan.id} className={`plan-card ${plan.featured ? "plan-featured" : ""}`}>
              {plan.featured && <div className="plan-ribbon">Most popular</div>}
              <div className="plan-icon">
                <Icon size={20} />
              </div>
              <div className="plan-label">{plan.label}</div>
              <div className="plan-price">
                <span className="plan-currency">$</span>
                {plan.price}
                <span className="plan-period">{plan.period}</span>
              </div>
              <p className="plan-tagline">{plan.tagline}</p>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} />
                    {f}
                  </li>
                ))}
              </ul>
              <StockBadge count={count} error={error} />
              {soldOut ? (
                <span className="btn btn-outline plan-btn plan-btn-disabled">Sold out</span>
              ) : (
                <a
                  href={plan.gumroad}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn ${plan.featured ? "btn-primary" : "btn-outline"} plan-btn`}
                >
                  Buy on Gumroad <ExternalLink size={14} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How do I get my key after paying?",
      a: "Gumroad shows your key immediately on the receipt page and sends it to your email. Paste it into the panel to activate your plan.",
    },
    {
      q: "Does one key work on every game?",
      a: "Yes. A single key unlocks all 8 supported games — you're not buying access per title.",
    },
    {
      q: "What executor do I need?",
      a: "All modules are built and tested for Xeno. Support for additional executors may be added later.",
    },
    {
      q: "Can I switch from weekly to monthly or lifetime later?",
      a: "Keys aren't upgraded — each plan is its own purchase. If you want a longer plan, just buy that plan separately; your existing key keeps working until it expires.",
    },
  ];
  return (
    <section id="faq" className="section">
      <div className="section-head">
        <span className="section-kicker">// faq</span>
        <h2>Good to know</h2>
      </div>
      <div className="faq-list">
        {items.map((it) => (
          <details className="faq-item" key={it.q}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="brand brand-sm">
          <Terminal size={15} />
          <span>
            PROJECT <span className="brand-accent">INFINITY X</span>
          </span>
        </div>
        <p>
          Scripts are provided for use on your own Roblox account. Use is
          subject to Roblox&apos;s Terms of Service.
        </p>
        <a className="footer-discord" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={14} />
          Join our Discord
        </a>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="page">
      <Nav />
      <Hero />
      <PanelPreview />
      <Games />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
