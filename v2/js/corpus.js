// corpus.js — "Ask the Mandala" knowledge corpus
// Faithfully extracted from the live daryllgomas.com index.html (root, v1).
// Each chunk: { id, section, text, link? }
// Consumed by concierge.js — embedded on-device via transformers.js, never sent to a server.

export const CORPUS = [

  // ---------- About ----------
  {
    id: "about-intro",
    section: "About",
    text: `Daryll Gomas is a cybersecurity professional, technology enthusiast, and lifelong learner. He built this portfolio to give a comprehensive display of his skills and what he's learning and doing in the tech industry and in life.`
  },
  {
    id: "about-story",
    section: "About",
    text: `Daryll has always existed at the cross section of soul and technology. His father worked as a Sr Engineer at IBM since the 1970s (and is now a reverend) and brought home cutting-edge technology before it went to market, giving Daryll a head start into the world of tech.`
  },
  {
    id: "about-mission",
    section: "About",
    text: `Even at 51, Daryll remains excited and hopeful about the world to come and tries to help bring everyone there together. In his words: "Some call me an optimist, some call me a dreamer, but in the words of John Lennon — I know I'm not the only one."`
  },

  // ---------- Passions ----------
  {
    id: "passion-creative",
    section: "Passions",
    text: `"Being Creative" — Daryll believes putting things together, even when it doesn't make sense to or you're told not to do it, can lead to the most rewarding experiences and outcomes.`
  },
  {
    id: "passion-learning",
    section: "Passions",
    text: `"Life Learning" — Daryll feels the goal in life should be to never stop learning and improving. It keeps you sharp, and there's little point if you're not always growing.`
  },
  {
    id: "passion-balance",
    section: "Passions",
    text: `"Keeping Balance" — as the world speeds up, Daryll believes in not forgetting to slow down: taking a walk, hiking a mountain, balancing rocks, or just breathing can make all the difference.`
  },

  // ---------- Skills ----------
  {
    id: "skill-networking",
    section: "Skills",
    text: `Networking — 85%, Architecture Capable. SonicWall firewall configuration and management, VLAN design and network segmentation strategy, DNS architecture including Synology as backup DNS, MSP multi-site network awareness, and a security-first network design philosophy.`
  },
  {
    id: "skill-cybersecurity",
    section: "Skills",
    text: `CyberSecurity — 75%, Strong Defensive Mindset. 2FA enforcement across M365 and Authenticator, firewall upgrades for security posture, vulnerability scanning VM architecture, SIEM implementation, zero-cloud AI inference for data control, and an incident response mindset from dealing with real attacks.`
  },
  {
    id: "skill-virtualization",
    section: "Skills",
    text: `Virtualization — 80%, Infrastructure Fluent. Hyper-V including performance troubleshooting, Linux VM deployment and management, Synology VM environments, multi-GPU LLM servers in Docker, and cross-platform Mac/Windows virtualization.`
  },
  {
    id: "skill-cloud",
    section: "Skills",
    text: `Cloud — 70%, Hybrid-Heavy Strength. Microsoft 365 tenant management, Entra integration concepts, multi-tenant management strategy, authentication models and identity sync, and hybrid cloud architecture planning.`
  },
  {
    id: "skill-syseng",
    section: "Skills",
    text: `Systems Engineering — 88%, Core Competency, 25+ years of cross-platform systems work. Windows, macOS, and Linux administration; DNS and domain consolidation planning; infrastructure modernization strategy; RAID decisions and storage architecture; identity architecture and access management.`
  },
  {
    id: "skill-blockchain",
    section: "Skills",
    text: `Blockchain — 65%, Investor + Systems Awareness. Understands distributed ledgers, consensus, and immutability; Bitcoin-style monetary chains vs. smart contract platforms; market cycles and volatility mechanics; token economics; Layer 1 vs Layer 2 concepts; and custody risk (self-custody vs exchange risk).`
  },
  {
    id: "skill-ai",
    section: "Skills",
    text: `Artificial Intelligence — 75%, Builder + Deployer. LLM deployment on local infrastructure, multi-GPU server builds for AI inference, AI-assisted automation and workflow design, secure on-prem AI for data sovereignty, and strategic understanding of where the AI landscape is heading.`
  },

  // ---------- Achievements ----------
  {
    id: "achievements-certs",
    section: "Achievements",
    text: `Daryll's verified certifications include CompTIA Network+ (Udemy), SOC Core Skills, Addigy certification, a Pre-Security certification, a Linux certification, a TryHackMe PenTest certificate, a Cyber Defense certificate, and Apple Certified Support Professional.`
  },

  // ---------- Projects: Namkuzu-da OS ----------
  {
    id: "proj-namkuzu-da-os",
    section: "Projects — Namkuzu-da OS",
    text: `Namkuzu-da OS is a custom AI-native operating system built on Ubuntu 24.04 LTS with Claude Code as the orchestration brain — hands-free voice control, 8 automated cron pipelines, RTX 3070 Ti CUDA inference, and a 4-monitor workstation. Private repository (Shell).`
  },
  {
    id: "proj-nkd-orchestration",
    section: "Projects — Namkuzu-da OS",
    text: `Agentic Business Orchestration is a directory-as-agent architecture: Google Drive directories become autonomous AI-managed business units, each with a CLAUDE.md that auto-loads context — cd into a folder and Claude assumes that division's role, coordinated across Capital, Technology, and CyberCab.`
  },
  {
    id: "proj-nkd-thesis",
    section: "Projects — Namkuzu-da OS",
    text: `The Living Thesis Pipeline is a two-stage Claude Code pipeline that downloads YouTube transcripts and extracts key claims (Stage 1), then incorporates them into a topic-organized knowledge base (Stage 2), feeding the morning brief and research report pipelines.`
  },
  {
    id: "proj-nkd-pipelines",
    section: "Projects — Namkuzu-da OS",
    text: `Published Intelligence runs on 8 automated cron jobs with zero human intervention: a 4:30 AM Morning Brief (26 RSS feeds + Schwab API → Claude analysis → HTML publish), Trading Prep, and a Sunday "Eagle Eye" weekly macro cycle report.`
  },
  {
    id: "proj-nkd-marketdata",
    section: "Projects — Namkuzu-da OS",
    text: `The Market Data pipeline feeds the brain via a Schwab API proxy, 26 RSS feeds spanning financial news and macro analysis, and FRED economic data — tracking 33 symbols, collected automatically by cron at 4:30 AM on weekdays.`
  },

  // ---------- Projects: Trading Ecosystem ----------
  {
    id: "proj-signal-engine",
    section: "Projects — Trading Ecosystem",
    text: `trade-signal-backend (Signal Engine) is an algorithmic trading engine running 15+ strategies (ORB, Golden Setup, VWAP Reversion, Mean Reversion, and more) with Claude AI integration for trade vetting, paper trading with slippage modeling, and real-time alerts via SSE, Discord, and Telegram. Private repository (JavaScript).`
  },
  {
    id: "proj-wingman",
    section: "Projects — Trading Ecosystem",
    text: `Wingman is an AI-assisted trading workstation — a full dashboard combining strategy views, a VWAP + Divergence integrated system, built-in backtesting tools, an earnings scanner, and structured daily pre-market/EOD workflow pages. Private repository (JavaScript).`
  },
  {
    id: "proj-options-calc",
    section: "Projects — Trading Ecosystem",
    text: `Options-Calc is a Schwab Trading Dashboard for gamma exposure (GEX) analysis — dealer positioning, call/put walls and gamma flip detection, 0DTE expected move calculations, and AI-powered (Claude) trade setup suggestions. Private repository (Python).`
  },
  {
    id: "proj-divergence-scanner",
    section: "Projects — Trading Ecosystem",
    text: `Divergance-Scanner is a real-time inter-market divergence detector — relative strength shift identification, correlation breakdown alerts, sector rotation heatmaps, and a 3-tier alert system with SQLite persistence. Python.`,
    link: "https://github.com/Namkuzu-da-OS/Divergance-Scanner"
  },
  {
    id: "proj-scout-win",
    section: "Projects — Trading Ecosystem",
    text: `Scout-Win is an automated market reconnaissance tool that scrapes X/Twitter for sentiment, YouTube for analyst commentary, and RSS feeds for financial news into a consolidated dashboard for morning prep. Private repository (HTML).`
  },
  {
    id: "proj-trading-prep",
    section: "Projects — Trading Ecosystem",
    text: `trading-prep automatically generates pre-market and end-of-day research reports, powered by Claude Code with custom prompt templates and scheduled shell scripts. HTML.`,
    link: "https://github.com/Namkuzu-da-OS/trading-prep"
  },
  {
    id: "proj-buyback-analyzer",
    section: "Projects — Trading Ecosystem",
    text: `buyback-blackout-analyzer identifies trading opportunities during corporate buyback blackout periods — the windows when companies halt share repurchases before earnings — by analyzing historical price data and quantifying the resulting edge. Python.`,
    link: "https://github.com/Namkuzu-da-OS/buyback-blackout-analyzer"
  },
  {
    id: "proj-fibonacci-backtester",
    section: "Projects — Trading Ecosystem",
    text: `fibonacci-backtester validates DiNapoli Fibonacci Levels methodology against real Schwab API market data — Fibnodes, Confluence, and Agreement analysis with objective profit points and win-rate performance metrics. HTML.`,
    link: "https://github.com/Namkuzu-da-OS/fibonacci-backtester"
  },
  {
    id: "proj-mrcrabs",
    section: "Projects — Trading Ecosystem",
    text: `MrCrabs is a single-page investment research dashboard showing real-time market sentiment cards for equities, crypto, liquidity, and macro, backed by a YAML-based master plan. HTML.`,
    link: "https://github.com/DaryllGomas/MrCrabs"
  },
  {
    id: "proj-terminus",
    section: "Projects — Trading Ecosystem",
    text: `TERMINUS is a multi-source price level confluence engine — a Python system aggregating 11 independent data sources (gamma, open interest, VWAP, pivots, Gann Square of Nine, volume profile, and more) into confluence-scored institutional price levels feeding the HERMES trading agent. Private repository.`
  },
  {
    id: "proj-convergence-engine",
    section: "Projects — Trading Ecosystem",
    text: `The Convergence Scoring Engine is a 7-dimension capital-deployment scoring system — thesis conviction, strategy edge, technical setup, cyclical alignment, catalyst proximity, risk/reward, and position sizing — designed to replace gut-feel with quantitative decision science. Private repository.`
  },
  {
    id: "proj-prediction-scanner",
    section: "Projects — Trading Ecosystem",
    text: `The Prediction Market Scanner is an async Python system that scans Polymarket, tracks whale wallets, aggregates news sentiment, and uses Claude AI for probability estimation, delivering only high-confidence alerts to Telegram. Private repository.`
  },

  // ---------- Projects: BigPic Solutions ----------
  {
    id: "proj-bigpic-parent",
    section: "Projects — BigPic Solutions",
    text: `BigPic Solutions is an AI-native R&D company powered by agentic systems — Claude AI agents, custom skill frameworks, and automated pipelines drive three divisions: BigPic Capital (investment research and trading), BigPic Technology (IT consulting and security), and BigPic CyberCab (autonomous fleet, in development).`,
    link: "https://bigpicsolutions.com/"
  },
  {
    id: "proj-bigpic-capital",
    section: "Projects — BigPic Solutions",
    text: `BigPic Capital is an AI-native investment operating system replicating a full institutional team — research, macro strategy, quant analysis, risk management, and execution — via AI agents. It includes the HERMES trading agent, the TERMINUS price-level engine, and 9 completed sector investment theses published at markets.bigpicsolutions.com.`
  },
  {
    id: "proj-bigpic-technology",
    section: "Projects — BigPic Solutions",
    text: `BigPic Technology offers remote IT consulting and automation specializing in AI-augmented infrastructure, cloud advisory, and productized security assessments for the SMB market, including the BigPic Pentester automated security platform with PCI DSS and HIPAA compliance mapping.`,
    link: "https://bigpicsolutions.com/"
  },
  {
    id: "proj-bigpic-cybercab",
    section: "Projects — BigPic Solutions",
    text: `BigPic CyberCab is a venture in research and planning for autonomous vehicle fleet ownership, building financial models for Tesla CyberCab deployment — unit economics modeling and revenue projections of $36K–$78K gross per vehicle per year.`
  },
  {
    id: "proj-invoicing-platform",
    section: "Projects — BigPic Solutions",
    text: `The Invoicing Platform is a production Flask + Stripe invoicing system for BigPic Technology's consulting business — client management, ReportLab PDF generation with QR payment links, and lead-pipeline tracking with CSV export. Private repository (Python).`
  },

  // ---------- Projects: Cybersecurity ----------
  {
    id: "proj-cyberdefense-cc",
    section: "Projects — Cybersecurity",
    text: `Cyber Defense Command Center is a distributed security platform: Python scanning agents (network scanner, vulnerability scanner, DNS monitor, connection tracker, metrics collector), a Node.js/Express REST API, and a React/Vite dashboard with TLS encryption, rate limiting, and CIDR network discovery. Private repository (Python).`
  },
  {
    id: "proj-pentester-platform",
    section: "Projects — Cybersecurity",
    text: `The Pentester Platform is a 4-tool CLI suite for automated network security assessments — bigpic-engage, bigpic-scan (Nmap/Masscan/Nuclei/Nikto), bigpic-report (branded PDF/DOCX), and bigpic-remediate (Ansible playbooks) — with compliance mapping for PCI DSS v4.0, HIPAA, and cyber insurance. Private repository (Python).`
  },
  {
    id: "proj-cybersectools",
    section: "Projects — Cybersecurity",
    text: `CyberSec Tools is a collection of 8 hand-written Python offensive security tools built from scratch: a port scanner, network/CIDR scanner, SSH brute forcer, multi-algorithm hash cracker, WiFi WPA/WPA2 cracker, subdomain enumerator, directory enumerator, and file downloader.`,
    link: "https://github.com/DaryllGomas/Coding"
  },

  // ---------- Projects: AI & Voice Tools ----------
  {
    id: "proj-wm-voice",
    section: "Projects — AI & Voice Tools",
    text: `WM-Voice is a hands-free Linux voice assistant using the Claude Agent SDK, Faster-Whisper (large-v3-turbo) speech-to-text with Silero VAD, and Kokoro TTS in Docker for natural voice output, accelerated by an RTX 3070 Ti — designed accessibility-first. Private repository (Python).`
  },
  {
    id: "proj-videototext",
    section: "Projects — AI & Voice Tools",
    text: `VideoToText is a Windows GUI and CLI tool that downloads videos from X/Twitter and transcribes them to text using OpenAI Whisper, with batch scripts for installation and GPU support. Python.`,
    link: "https://github.com/DaryllGomas/VideoToText"
  },
  {
    id: "proj-swarmai",
    section: "Projects — AI & Voice Tools",
    text: `Swarm-AI is an architectural blueprint for a vibe-coding freelancer collective — a Service DAO combining human freelancers with autonomous AI agent swarms, modeled on Raid Guild and Vector DAO precedents, with 85% of revenue flowing to developers. HTML.`,
    link: "https://github.com/Namkuzu-da-OS/Swarm-AI"
  },

  // ---------- Projects: Interactive Experiences ----------
  {
    id: "proj-book",
    section: "Projects — Interactive Experiences",
    text: `Book, "Enter Zen From There," is a WebGL-powered portal serving as the hub for three interconnected interactive experiences — Zen, Ancients, and BreakTheCode — featuring cosmic backgrounds and 3D sacred geometry. JavaScript.`,
    link: "https://github.com/DaryllGomas/Book"
  },
  {
    id: "proj-zen",
    section: "Projects — Interactive Experiences",
    text: `Zen is an immersive interactive meditation experience presenting the story "Enter Zen From There" — guided breathing exercises, an interactive zen garden with raking and koi fish, a meditation timer, falling leaves, and water ripple effects. HTML.`,
    link: "https://github.com/DaryllGomas/Zen"
  },
  {
    id: "proj-ancients",
    section: "Projects — Interactive Experiences",
    text: `Ancients is an interactive web-based history timeline spanning prehistoric to modern eras, exploring alternative theories about pre-cataclysm advanced civilizations through a WebGL cosmic portal built with Three.js. JavaScript.`,
    link: "https://github.com/DaryllGomas/Ancients"
  },
  {
    id: "proj-breakthecode",
    section: "Projects — Interactive Experiences",
    text: `BreakTheCode, "Breaking Your Genetic Code," is an immersive interactive digital book on consciousness expansion and personal transformation, with an animated DNA helix and starfield across 6 chapters, built in pure HTML/CSS/JS with no frameworks.`,
    link: "https://github.com/DaryllGomas/BreakTheCode"
  },

  // ---------- Projects: Research & Analysis ----------
  {
    id: "proj-twitteralgo",
    section: "Projects — Research & Analysis",
    text: `twitter-algorithm-analysis is a deep decompilation of X's open-sourced "For You" feed algorithm, breaking down the scoring formula and weight mapping into actionable posting rules for maximizing reach. Built with Rust.`,
    link: "https://github.com/Namkuzu-da-OS/twitter-algorithm-analysis"
  },
  {
    id: "proj-zolseason",
    section: "Projects — Research & Analysis",
    text: `ZOLSEASON is a set of research and vision documents proposing a privacy-preserving bridge between Zcash and Solana, combining Zcash's shielded transactions with Solana's speed — currently at the conceptual/whitepaper stage.`,
    link: "https://github.com/Namkuzu-da-OS/ZOLSEASON"
  },
  {
    id: "proj-quant-lab",
    section: "Projects — Research & Analysis",
    text: `The Quantitative Research Lab is a 31,000-line Python platform covering a 39-ticker universe with regime detection and Newey-West-corrected signal discovery — a 48-signal cross-sectional sweep found 5 confirmed, statistically significant signals. Private repository.`
  },
  {
    id: "proj-breadth-signal",
    section: "Projects — Research & Analysis",
    text: `Breadth-Exhaustion-Signal tests market breadth exhaustion signals against 27 years of NYSE Advance-Decline data, confirmed with p<0.05 statistical significance via Monte Carlo null hypothesis testing. Private repository (Python).`
  },
  {
    id: "proj-gann",
    section: "Projects — Research & Analysis",
    text: `The Gann Square of Nine Backtester is a 56KB Python tool formalizing 6 W.D. Gann techniques and stress-testing them against 33 years of S&P 500 data — Square of Nine support/resistance scored z=+9.51 (p=0.0000) and feeds the TERMINUS confluence engine. Private repository.`
  },
  {
    id: "proj-mean-reversion",
    section: "Projects — Research & Analysis",
    text: `The Mean Reversion Strategy Lab spans a full development lifecycle — a 20,736-combination Python parameter sweep and walk-forward validation achieving an 81.2% in-sample win rate across 203 trades and 84.3% out-of-sample. Private repository.`
  },

  // ---------- Learning Resources ----------
  {
    id: "learning-fundamentals",
    section: "Learning Resources",
    text: `Fundamentals training completed: Professor Messer's N10-008 Network+ and SY0-601 Security+ courses, the AZ-900 Azure Fundamentals certification course, and "Become an Ethical Hacker for $0" — each paired with Daryll's own documentation notes as practice.`
  },
  {
    id: "learning-cyberdefense",
    section: "Learning Resources",
    text: `CyberSecurity training completed: SIEM with live attacks (Azure Sentinel), vulnerability management with Nessus, building a home cybersecurity lab, and cybersecurity detection & monitoring labs.`
  },
  {
    id: "learning-cloud-net",
    section: "Learning Resources",
    text: `Cloud, virtualization, networking, and Linux training completed: Docker fundamentals, a Linux lab in Azure, virtualizing macOS, setting up Active Directory with PowerShell, hosting a website on Windows Server, and TryHackMe's Active Directory Basics room.`
  },

  // ---------- Contact ----------
  {
    id: "contact-channels",
    section: "Contact",
    text: `Daryll Gomas can be reached by email at daryll.gomas@gmail.com, on X/Twitter as @DaryllGomas, on LinkedIn at linkedin.com/in/daryll-gomas, and on GitHub as DaryllGomas.`,
    link: "mailto:daryll.gomas@gmail.com"
  },
  {
    id: "contact-external",
    section: "Contact",
    text: `Beyond this portfolio, Daryll's work is published at BigPic Solutions (bigpicsolutions.com) and his interactive book project lives at justsomedude.org.`,
    link: "https://bigpicsolutions.com/"
  }

];
