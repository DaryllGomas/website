/* systems-data.js — the honest inventory behind the Living System Map.
   Generated from the 2026-07-07 systems audit (44 Capital systems,
   statuses labeled truthfully: live / descriptive / experimental).
   Regenerate from BigPic - Capital/_Inbox/daryllgomas-systems-map/. */

export const SYSTEMS_DATA = {
  "brain": {
    "name": "NAMKUZU-DA OS",
    "sub": "Claude Code · 33+ skills · 8 pipelines",
    "desc": "A custom AI-native operating environment: Claude Code as the orchestration brain, voice control, automated pipelines, and agentic AI driving every workflow. Click to see the systems inside."
  },
  "nodes": [
    {
      "id": "voice",
      "side": "in",
      "name": "Voice",
      "desc": "Hands-free by design — voice control drives the OS end-to-end, built for accessibility."
    },
    {
      "id": "market",
      "side": "in",
      "name": "Market Data",
      "desc": "26 RSS feeds, Schwab broker API, and FRED economic data flowing in on automated schedules."
    },
    {
      "id": "web",
      "side": "in",
      "name": "Web & Research",
      "desc": "YouTube transcripts, browser research, and inbox drops — routed through Claude for extraction and integration."
    },
    {
      "id": "cloud",
      "side": "in",
      "name": "Cloud & Network",
      "desc": "The Google Drive vault and LAN service mesh — shared memory and infrastructure for every agent."
    },
    {
      "id": "intel",
      "side": "out",
      "name": "Published Intel",
      "desc": "Market data in, Claude analysis out — institutional-quality reports published autonomously on schedule."
    },
    {
      "id": "kb",
      "side": "out",
      "name": "Knowledge Base",
      "desc": "One-click capture flowing through Claude-powered analysis into a structured, evolving knowledge base."
    },
    {
      "id": "control",
      "side": "out",
      "name": "System Control",
      "desc": "Claude Code as the operating layer — services, pipelines, and machines under agentic control."
    },
    {
      "id": "alerts",
      "side": "out",
      "name": "Alerts & Delivery",
      "desc": "Telegram alerts, tripwires, and scheduled morning briefs delivered where the operator lives."
    }
  ],
  "categories": [
    {
      "id": "market-data-regime",
      "name": "Market Data & Regime"
    },
    {
      "id": "intelligence-signals",
      "name": "Intelligence & Signals"
    },
    {
      "id": "social-content-intelligence",
      "name": "Social / Content Intelligence"
    },
    {
      "id": "valuation-fundamentals",
      "name": "Valuation & Fundamentals"
    },
    {
      "id": "portfolio-execution",
      "name": "Portfolio & Execution"
    },
    {
      "id": "terminals-deep-dives",
      "name": "Terminals & Deep-Dives"
    },
    {
      "id": "delivery-ops-infra",
      "name": "Delivery & Ops/Infra"
    }
  ],
  "systems": [
    {
      "id": "schwab-market-ingestion",
      "name": "Schwab Market Data Ingestion",
      "cat": "market-data-regime",
      "desc": "Batch-quotes 37 tracked symbols plus the VIX term-structure family every cycle via Schwab's OAuth2 REST API.",
      "skills": [
        "OAuth2 refresh-token auth",
        "batch quoting",
        "rate-limited polling"
      ],
      "status": "live"
    },
    {
      "id": "vix-term-structure",
      "name": "VIX Term-Structure Regime Signal",
      "cat": "market-data-regime",
      "desc": "Classifies contango vs backwardation regime from the VIX/VIX9D/VIX3M/VVIX term structure every cycle.",
      "skills": [
        "term-structure math",
        "regime classification"
      ],
      "status": "live"
    },
    {
      "id": "regime-composite",
      "name": "Regime Composite (\"Risk Console\")",
      "cat": "market-data-regime",
      "desc": "14-signal state gauge backtested to confirm it has NO directional edge — only a contrarian risk-off alarm.",
      "skills": [
        "multi-signal fusion",
        "backtest validation",
        "honest null-result reporting"
      ],
      "status": "descriptive"
    },
    {
      "id": "cycle-convergence",
      "name": "Cycle Convergence Engine",
      "cat": "market-data-regime",
      "desc": "Votes CALM/WATCH/CAUTION/DANGER by aligning multiple market cycles, gated so metals never sway the equity read.",
      "skills": [
        "cycle alignment",
        "vote-tally aggregation",
        "cross-asset gating"
      ],
      "status": "descriptive"
    },
    {
      "id": "market-phase-engine",
      "name": "Market-Structure Phase Engine",
      "cat": "market-data-regime",
      "desc": "Classifies Wyckoff accumulation-to-markdown structure; confidence capped after a 30-year backtest found no edge.",
      "skills": [
        "Wyckoff structure analysis",
        "fail-open multi-source fusion",
        "backtest-driven confidence capping"
      ],
      "status": "descriptive"
    },
    {
      "id": "tape-speed",
      "name": "Tape Speed Tachometer",
      "cat": "market-data-regime",
      "desc": "Market-aggregate dollar-volume RVOL built from 1-minute bars, time-of-day normalized so 9:31am never reads like 3:59pm.",
      "skills": [
        "relative volume (RVOL)",
        "minute-bar time normalization"
      ],
      "status": "descriptive"
    },
    {
      "id": "in-house-breadth-proxy",
      "name": "In-House Breadth Proxy",
      "cat": "market-data-regime",
      "desc": "Rebuilt the discontinued Schwab $ADD breadth feed from scratch over ~103 large-caps, validated 5-for-5 on historical SPY bottoms.",
      "skills": [
        "advance-decline construction",
        "backtest validation"
      ],
      "status": "live"
    },
    {
      "id": "intraday-structure-lens",
      "name": "Intraday-Structure Lens",
      "cat": "market-data-regime",
      "desc": "Classifies each session's day-type (trend/range/reversal) and grades its own setups same-day against real minute outcomes.",
      "skills": [
        "intraday pattern classification",
        "same-day outcome harvesting"
      ],
      "status": "descriptive"
    },
    {
      "id": "vol-seasonality",
      "name": "Volatility Seasonal-Path Engine",
      "cat": "market-data-regime",
      "desc": "Reconstructs the classic calm-summer-to-autumn-spike VIX shape from raw daily history via week-of-year averaging.",
      "skills": [
        "seasonal decomposition",
        "historical backfill"
      ],
      "status": "descriptive"
    },
    {
      "id": "measurement-spine",
      "name": "Measurement Spine",
      "cat": "intelligence-signals",
      "desc": "Every signal grades its own forward 1/5/20-day returns against real prices, a self-auditing scorecard not a marketing claim.",
      "skills": [
        "self-grading spine",
        "forward-return harvesting",
        "sample-diversity guard"
      ],
      "status": "live"
    },
    {
      "id": "signal-fusion",
      "name": "Signal Fusion / Conviction Scoring",
      "cat": "intelligence-signals",
      "desc": "Blends regime and directional signals into one conviction score with a persisted history for later validation.",
      "skills": [
        "signal fusion",
        "conviction scoring"
      ],
      "status": "live"
    },
    {
      "id": "divergence-engine",
      "name": "Divergence Scanner",
      "cat": "intelligence-signals",
      "desc": "Scans tracked instruments for price-vs-internals divergences and surfaces them on a dedicated scanner page.",
      "skills": [
        "divergence detection",
        "cross-instrument scanning"
      ],
      "status": "descriptive"
    },
    {
      "id": "narrative-tracker",
      "name": "Narrative / Topic Tracker",
      "cat": "intelligence-signals",
      "desc": "Detects sentiment-shift and topic-velocity inflections by fusing RSS, YouTube, and X into one cross-source signal.",
      "skills": [
        "topic velocity",
        "cross-source sentiment fusion"
      ],
      "status": "descriptive"
    },
    {
      "id": "ticker-radar-social-arb",
      "name": "Ticker Radar (Social-Arb)",
      "cat": "intelligence-signals",
      "desc": "Ranks tickers by mention-surprise against each name's own 14-day baseline, breadth-gated to beat the crowd.",
      "skills": [
        "surprise-vs-baseline scoring",
        "breadth gating"
      ],
      "status": "live"
    },
    {
      "id": "distribution-phase-pump-density",
      "name": "Distribution Phase / Pump Density",
      "cat": "intelligence-signals",
      "desc": "Two-tier pump detector: a fast 4-flag density read plus a high-precision classifier across 7 known pump architectures.",
      "skills": [
        "heuristic density scoring",
        "pattern classification"
      ],
      "status": "experimental"
    },
    {
      "id": "x-scraper-chrome-extension",
      "name": "X/Twitter Chrome Extension Scraper",
      "cat": "social-content-intelligence",
      "desc": "A visible Chrome MV3 extension drives a logged-in X session for chronological capture after Playwright and APIs failed.",
      "skills": [
        "Manifest V3 extension",
        "DOM capture",
        "priority-based list rotation"
      ],
      "status": "live"
    },
    {
      "id": "author-voices-intelligence",
      "name": "Author \"Voices\" Intelligence",
      "cat": "social-content-intelligence",
      "desc": "Grades every X author who posts tickers by their calls' actual forward return vs SPY via Wilson lower-bound.",
      "skills": [
        "Wilson lower-bound",
        "forward-return grading",
        "novelty scoring"
      ],
      "status": "live"
    },
    {
      "id": "trade-ideas-extraction",
      "name": "Trade Ideas Extraction & Outcome Eval",
      "cat": "social-content-intelligence",
      "desc": "Extracts ticker calls from X, grades them against real session highs/lows, and self-fixed a 679-row scoring bug.",
      "skills": [
        "heuristic-to-regex-to-AI extraction",
        "R-multiple outcome evaluation",
        "ticker-collision guarding"
      ],
      "status": "live"
    },
    {
      "id": "statement-tapes-trump-musk",
      "name": "Statement Tapes (Trump/Musk)",
      "cat": "social-content-intelligence",
      "desc": "Classifies Trump/Musk statements by principal, guards against fake-quote bait, and alerts Telegram only on fresh market-moving ones.",
      "skills": [
        "relay-regex gating",
        "hypothetical bait-guard",
        "batched LLM classification"
      ],
      "status": "live"
    },
    {
      "id": "x-intake-desk",
      "name": "X Intake Desk",
      "cat": "social-content-intelligence",
      "desc": "Paste a tweet, verify against live quotes and thesis in one model call, filed isolated from graded signals.",
      "skills": [
        "tiered claim verification",
        "isolation-by-SQL-view",
        "grounded LLM drafting"
      ],
      "status": "live"
    },
    {
      "id": "chat-levels-andy-scorecard",
      "name": "Chat Levels & Trader Scorecard",
      "cat": "social-content-intelligence",
      "desc": "Extracts a trader's posted price levels from live chat, grades each hit or stale against real OHLC.",
      "skills": [
        "NLP level extraction",
        "hit/stale tracking"
      ],
      "status": "live"
    },
    {
      "id": "wallstreet-chat-scraper",
      "name": "WallStreet.io Chat Scraper",
      "cat": "social-content-intelligence",
      "desc": "Playwright DOM-walks a live, market-hours-only chat room into a full-text-searchable (FTS5) message archive.",
      "skills": [
        "Playwright DOM walk",
        "FTS5 full-text search"
      ],
      "status": "live"
    },
    {
      "id": "rss-youtube-content-pipeline",
      "name": "RSS + YouTube Content Pipeline",
      "cat": "social-content-intelligence",
      "desc": "Batches 10 RSS feeds and 17 YouTube channels through per-item AI sentiment, importance, and ticker extraction.",
      "skills": [
        "batched LLM analysis",
        "sentiment/importance scoring"
      ],
      "status": "live"
    },
    {
      "id": "expectations-gap-engine",
      "name": "Expectations-Gap Valuation Engine",
      "cat": "valuation-fundamentals",
      "desc": "Backs out the growth rate priced into a stock via reverse-DCF, cross-checked against a daily peer regression.",
      "skills": [
        "reverse-DCF",
        "ridge-OLS peer regression",
        "firewalled alt-data"
      ],
      "status": "descriptive"
    },
    {
      "id": "sec-edgar-fundamentals",
      "name": "SEC EDGAR Fundamentals Spine",
      "cat": "valuation-fundamentals",
      "desc": "Pulls free SEC XBRL filings via a tag-fallback resolver reconciling inconsistent tagging across companies, deriving TTM Q4.",
      "skills": [
        "SEC EDGAR XBRL",
        "tag-fallback resolution",
        "TTM derivation"
      ],
      "status": "live"
    },
    {
      "id": "valuation-scanner",
      "name": "Valuation Scanner",
      "cat": "valuation-fundamentals",
      "desc": "Screens ~400 names daily on P/E, P/S, PEG, margins, growth, and 52-week range for relative-value setups.",
      "skills": [
        "multi-factor screening",
        "daily fundamentals refresh"
      ],
      "status": "live"
    },
    {
      "id": "supply-events-calendar",
      "name": "Supply Events Calendar",
      "cat": "valuation-fundamentals",
      "desc": "Forward calendar of crypto token unlocks and IPO lock-up expirations, kept deliberately separate from the pump signal.",
      "skills": [
        "schedule aggregation",
        "throttled scraping"
      ],
      "status": "descriptive"
    },
    {
      "id": "fundamentals-quality-scoring",
      "name": "Fundamentals Quality Scoring",
      "cat": "valuation-fundamentals",
      "desc": "Scores statement quality via Piotroski F-score and Altman Z-score, with a Sankey deriving gross profit when omitted.",
      "skills": [
        "Piotroski F-score",
        "Altman Z-score",
        "Sankey visualization"
      ],
      "status": "live"
    },
    {
      "id": "portfolio-recommendation-engine",
      "name": "Portfolio Recommendation Engine",
      "cat": "portfolio-execution",
      "desc": "Precomputes \"what should I do now\" recommendations on a cron so the page never computes cold.",
      "skills": [
        "precompute-cache pattern",
        "LLM-authored rationale"
      ],
      "status": "live"
    },
    {
      "id": "ai-portfolio-l1-l2",
      "name": "AI Portfolio Review (L1/L2)",
      "cat": "portfolio-execution",
      "desc": "Two-tier AI review, fast perception pass plus a deeper thesis review, persisted against a hand-maintained holdings document.",
      "skills": [
        "two-tier LLM review",
        "thesis persistence"
      ],
      "status": "live"
    },
    {
      "id": "portfolio-snapshot-service",
      "name": "Portfolio Snapshot Service",
      "cat": "portfolio-execution",
      "desc": "Joins a hand-maintained holdings file against live prices, serving last-good data rather than zeroing out on timeout.",
      "skills": [
        "last-good fallback",
        "cross-source join"
      ],
      "status": "live"
    },
    {
      "id": "paper-trading-sync",
      "name": "Paper Trading Sync",
      "cat": "portfolio-execution",
      "desc": "Treats a TradingView paper account as source of truth, reconciled with a manual-override overlay and staleness flagging.",
      "skills": [
        "source-of-truth reconciliation",
        "staleness detection"
      ],
      "status": "live"
    },
    {
      "id": "trader-debrief-system",
      "name": "Trader Debrief System",
      "cat": "portfolio-execution",
      "desc": "Captures structured end-of-day trade reviews and tallies recurring failure tags so repeat mistakes surface, not repeat quietly.",
      "skills": [
        "structured journaling",
        "recurring-failure tally"
      ],
      "status": "live"
    },
    {
      "id": "cockpit-decision-screen",
      "name": "Cockpit Decision Screen",
      "cat": "portfolio-execution",
      "desc": "Assembles top setups, price levels, and catalysts from existing engines into one fail-open pre-market screen.",
      "skills": [
        "fail-open composition",
        "endpoint aggregation"
      ],
      "status": "live"
    },
    {
      "id": "terminals-framework",
      "name": "Terminals Framework",
      "cat": "terminals-deep-dives",
      "desc": "Curated single-name cockpit (thesis, lock-up ladder, index-inclusion) blended live with price/options/feed; name #2 is one registry entry.",
      "skills": [
        "curated + live data blend",
        "registry-driven UI"
      ],
      "status": "live"
    },
    {
      "id": "political-positioning-tracker",
      "name": "Admin Positioning Tracker",
      "cat": "terminals-deep-dives",
      "desc": "Tracks federal OGE 278-T financial-disclosure filings for insider positioning — framed explicitly as intel, not copy-trade advice.",
      "skills": [
        "filing parsing",
        "positioning snapshots"
      ],
      "status": "live"
    },
    {
      "id": "options-setup-bridge",
      "name": "Options Setup Bridge",
      "cat": "terminals-deep-dives",
      "desc": "Bridges a symbol-agnostic options-analytics service (gamma walls, IV, VWAP) into every ticker dossier and terminal for execution context.",
      "skills": [
        "gamma-wall detection",
        "cross-service bridging"
      ],
      "status": "live"
    },
    {
      "id": "crypto-liquidation-map",
      "name": "Crypto Liquidation Map",
      "cat": "terminals-deep-dives",
      "desc": "Distance-weighted liquidation ladder and OI heatmap; tested whale fuel-skew for directional edge and honestly found none.",
      "skills": [
        "distance-weighted ladder",
        "OI heatmap",
        "honest null-result reporting"
      ],
      "status": "descriptive"
    },
    {
      "id": "drive-guard-circuit-breaker",
      "name": "DriveGuard Circuit Breaker",
      "cat": "delivery-ops-infra",
      "desc": "Threadpool-aware circuit breaker plus concurrency cap on network-mount reads with a half-open probe, fixed a site-wide freeze.",
      "skills": [
        "circuit-breaker pattern",
        "concurrency semaphore",
        "FUSE-mount threadpool protection"
      ],
      "status": "live"
    },
    {
      "id": "autonomous-scraper-orchestrator",
      "name": "Autonomous Scraper Orchestrator",
      "cat": "delivery-ops-infra",
      "desc": "Runs a continuous 30-phase autonomous data-collection loop guarded by a singleton lock against double-scraping.",
      "skills": [
        "phase orchestration",
        "singleton lock guard"
      ],
      "status": "live"
    },
    {
      "id": "market-pulse-telegram",
      "name": "Market Pulse → Telegram",
      "cat": "delivery-ops-infra",
      "desc": "Pushes a 30-minute state+crowd+action digest to Telegram, throttled off the last delivered send so it never double-fires.",
      "skills": [
        "delta-since-last framing",
        "delivery-keyed throttle"
      ],
      "status": "live"
    },
    {
      "id": "nightly-maintenance-backup",
      "name": "Nightly Maintenance & Backup",
      "cat": "delivery-ops-infra",
      "desc": "Nightly per-database integrity check, conditional VACUUM, and off-site backup, with a systemd watchdog as OOM safety net.",
      "skills": [
        "SQLite VACUUM/integrity_check",
        "watchdog pattern"
      ],
      "status": "live"
    },
    {
      "id": "alert-pipeline-telegram-email",
      "name": "Alert Pipeline (Telegram + Email)",
      "cat": "delivery-ops-infra",
      "desc": "Dual-channel Telegram/email alerting with a 30-minute server-side dedup so app refreshes never spam duplicate alerts.",
      "skills": [
        "server-side dedup",
        "dual-channel delivery"
      ],
      "status": "live"
    },
    {
      "id": "youtube-config-reconciliation",
      "name": "YouTube Config Reconciliation",
      "cat": "delivery-ops-infra",
      "desc": "Enforces a single source of truth: a channel's transcripts exist iff it's enabled in config, self-healing on drift.",
      "skills": [
        "config-driven reconciliation",
        "drift correction"
      ],
      "status": "live"
    }
  ]
};
