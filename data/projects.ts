import type { Content } from "@/lib/content";

export type ProjectVisual = "rag" | "waste" | "tour" | "travelogue" | "rl" | "coverage";

export type ArchitectureLane = {
  title: string;
  steps: { label: string; detail: Content }[];
};

export type Project = {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  visual: ProjectVisual;
  /** Real screenshot in /public (shown instead of the drawn visual when present). */
  image?: { src: string; alt: string };
  /** Hue (0–360) used for the project's accent glow. */
  hue: number;
  year: Content;
  githubUrl: Content;
  /** Omit when there is no public demo. */
  liveUrl?: Content;
  overview: string;
  problem: string;
  solution: string;
  architecture: ArchitectureLane[];
  features: Content[];
  challenges: Content[];
  results: Content[];
};

const GH = "https://github.com/alokekissac";

export const projects: Project[] = [
  {
    slug: "advanced-rag-system",
    title: "Advanced RAG System",
    description:
      "Trustworthy question answering over private documents: hybrid retrieval, cited answers, abstention and prompt-injection guardrails, measured with an evaluation harness.",
    tech: ["Python", "FastAPI", "RAG", "Embeddings", "Vector Search", "BM25", "Gemini", "pytest"],
    visual: "rag",
    image: { src: "/projects/advanced-rag-system.jpg", alt: "Advanced RAG System: a cited answer with the retrieved evidence panel" },
    hue: 228,
    year: "2026",
    githubUrl: `${GH}/Advanced-RAG-System`,
    liveUrl: "https://advanced-rag-system-steel.vercel.app/",
    overview:
      "A retrieval-augmented generation service that answers questions over a private document collection. Every sentence of an answer is cited to a retrieved passage, citations are verified against their source, and the system says so when the documents don't contain the answer.",
    problem:
      "LLMs answer fluently but can't see private documents, and when they don't know something they still produce a confident answer. Documents can also contain instructions aimed at the model. For internal knowledge, an answer is only useful if it can be traced to a source and the system knows when to stay silent.",
    solution:
      "Documents are chunked by heading and indexed twice: BM25 for exact terms and numbers, and dense embeddings for meaning. The two rankings are fused with Reciprocal Rank Fusion and diversified with MMR. Guardrails screen retrieved text for prompt injection and score how well the evidence covers the question; low coverage means abstaining. Answers come from Gemini with a grounded prompt, or from an extractive answerer that quotes sources when no key is set. The whole pipeline sits behind a FastAPI service with a web UI.",
    architecture: [
      {
        title: "Ingestion",
        steps: [
          { label: "Documents", detail: "PDF, Markdown, text" },
          { label: "Chunking", detail: "Heading-aware, with overlap" },
          { label: "Index", detail: "BM25 + dense embeddings" },
          { label: "Vector store", detail: "Cosine similarity" },
        ],
      },
      {
        title: "Query",
        steps: [
          { label: "Question", detail: "FastAPI · optional multi-query rewrite" },
          { label: "Hybrid retrieval", detail: "RRF fusion + MMR" },
          { label: "Guardrails", detail: "Injection screen · confidence gate" },
          { label: "Generation", detail: "Gemini or extractive, cited" },
          { label: "Verification", detail: "Citations checked against sources" },
        ],
      },
    ],
    features: [
      "Hybrid retrieval: BM25 and embeddings fused with Reciprocal Rank Fusion, diversified with MMR",
      "Every answer sentence cited, and each citation verified against the source text",
      "Abstains (\u201cI couldn't find this in the documents\u201d) when evidence doesn't cover the question",
      "Detects and strips prompt-injection text hidden in documents, and warns the user",
      "Works with Gemini (LLM answers, embeddings, query rewriting) or fully offline",
      "Web UI with an evidence panel, retrieval-mode switch and bring-your-own-documents upload",
      "Evaluation harness plus 21 pytest tests",
    ],
    challenges: [
      "Calibrating when to abstain: coverage is IDF-weighted so a question hinging on a word no document contains scores low, and the threshold was chosen on a dev split and reported on a held-out test split.",
      "Paraphrases: local embeddings can't learn that \u201ccomputer\u201d means \u201claptop\u201d from a small corpus, so the system abstains rather than guessing. Gemini embeddings and query rewriting close that gap.",
      "Keeping it deployable on serverless: small dependencies, a fast in-memory index, and graceful fallback to BM25 when the embedding API is unavailable.",
    ],
    results: [
      "95.7% answer accuracy on held-out test questions (extractive mode, no LLM)",
      "100% correct abstentions on questions the documents don't answer",
      "100% of cited sentences supported by their cited source",
      "Prompt-injection test document detected and ignored",
      "About 2 ms per question to retrieve and answer on the demo corpus",
    ],
  },
  {
    slug: "ai-waste-management",
    title: "AI-Powered Landfill Waste Forecasting",
    description:
      "MSc research project: five models compared on 127K EPA records to forecast state-level landfill waste, with the best deployed as a web dashboard.",
    tech: ["Python", "scikit-learn", "XGBoost", "PyTorch", "pandas", "Flask", "Chart.js"],
    visual: "waste",
    image: { src: "/projects/ai-waste-management.jpg", alt: "WasteSight AI forecasting dashboard" },
    hue: 158,
    year: "2026",
    githubUrl: `${GH}/AI-Landfill-Waste-Forecasting`,
    liveUrl: "https://ai-landfill-waste-forecasting.vercel.app/",
    overview:
      "An end-to-end forecasting pipeline for US landfill waste, built as my MSc in Artificial Intelligence applied research project. It goes from raw facility records to a deployed dashboard that forecasts any state's landfilled waste up to 2035.",
    problem:
      "Landfill capacity is finite and new capacity takes years to permit. Under-forecasting means landfills run out of space; over-forecasting wastes money on unneeded expansion. These decisions are made state by state, yet most AI-for-waste research focuses on sorting and collection and reports no comparable error metrics.",
    solution:
      "127,033 EPA records were cleaned and aggregated into state-year series with a log-transformed target, lag features and rolling means. Linear Regression, Random Forest, Gradient Boosting, XGBoost and a two-layer PyTorch LSTM were trained on the same split and compared on RMSE, MAE and R². The winner is served with its encoders and scalers by a Flask API and dashboard.",
    architecture: [
      {
        title: "Pipeline",
        steps: [
          { label: "Raw data", detail: "EPA dataset · 127K rows" },
          { label: "Cleaning", detail: "Artefacts, outliers, log1p" },
          { label: "Features", detail: "Lags 1–3 + rolling mean" },
          { label: "Models", detail: "LR · RF · GB · XGBoost · LSTM" },
          { label: "Forecast", detail: "Flask API + dashboard" },
        ],
      },
    ],
    features: [
      "Cleaning of 127,033 records into 115,940 valid rows across 45 states (1938–2023)",
      "Feature engineering: lagged values and 3-year rolling means of log waste mass",
      "Five model families compared with one shared evaluation function",
      "Flask REST API and Chart.js dashboard with state-level forecasts to 2035",
    ],
    challenges: [
      "State totals differ by more than three orders of magnitude, so the target was log-transformed (skew from 34.35 to −0.47).",
      "Explaining why the simplest model won: with log targets and lag features the relationship is close to linear, and the 716-sample dataset is too small for the LSTM to shine.",
    ],
    results: [
      "Linear Regression: R² 0.9861, RMSE 1.05M tons, MAE 0.58M tons on the held-out test set",
      "About 22% lower RMSE than Random Forest and Gradient Boosting, and 81% lower than the LSTM",
      "Deployed as a live forecasting dashboard",
    ],
  },
  {
    slug: "rl-traffic-signal-control",
    title: "RL Traffic Signal Control",
    description:
      "Q-learning and Monte Carlo agents learn when to switch a traffic light, benchmarked against the exact optimal policy, with a 3D browser simulator.",
    tech: ["Python", "Reinforcement Learning", "Gymnasium", "NumPy", "Flask", "Three.js"],
    visual: "rl",
    image: { src: "/projects/rl-traffic-signal-control.jpg", alt: "3D traffic intersection simulator controlled by a Q-learning agent" },
    hue: 190,
    year: "2026",
    githubUrl: `${GH}/RL-Traffic-Signal-Control`,
    liveUrl: "https://rl-traffic-signal-control.vercel.app/",
    overview:
      "A reinforcement-learning study of a single intersection: at each tick an agent decides which road gets the green. Tabular Q-learning and first-visit Monte Carlo control learn the policy from experience, and both are judged against the mathematically optimal policy.",
    problem:
      "Fixed-time signals switch on a timer whatever the traffic is doing. The question is whether a signal can learn when to switch purely from experience, and how close a learned policy gets to the best possible one.",
    solution:
      "A Gymnasium environment models two queues with random arrivals and departures and a reward of minus the cars waiting. Because the state space is small, the MDP is also solved exactly with value iteration. Agents are trained on 5 seeds and evaluated on 2,000 identical held-out episodes against random, fixed-time and longest-queue baselines.",
    architecture: [
      {
        title: "Study",
        steps: [
          { label: "Environment", detail: "Gymnasium MDP · 24 states" },
          { label: "Agents", detail: "Q-learning · Monte Carlo" },
          { label: "Ground truth", detail: "Value iteration" },
          { label: "Evaluation", detail: "5 seeds · common random numbers" },
          { label: "Simulator", detail: "Three.js 3D + JSON API" },
        ],
      },
    ],
    features: [
      "Custom Gymnasium environment with an exact transition model",
      "Q-learning and first-visit Monte Carlo control, plus the exact optimum by value iteration",
      "Fair evaluation: multiple seeds, held-out episodes, shared random traffic",
      "3D intersection simulator in the browser, with switchable controllers and live Q-values",
      "Flask JSON API with input validation and 18 tests",
    ],
    challenges: [
      "Discovered the reward could be gamed: cars turned away from a full queue cost nothing, so the optimal policy starves the short road. Added an overflow-aware reward that turns away 40% fewer cars.",
    ],
    results: [
      "Q-learning comes within 0.009 cars of the exact optimum",
      "37% fewer cars waiting than fixed-time signals",
      "Q-learning is far more consistent across seeds than Monte Carlo (sd 0.009 vs 0.173)",
    ],
  },
  {
    slug: "covigo",
    title: "Covigo: Coverage Navigator",
    description:
      "Walk every street in an area and miss none: route planning over OpenStreetMap, GPS turn-by-turn guidance and a Gemini voice assistant.",
    tech: ["JavaScript", "Leaflet", "OpenStreetMap", "Gemini", "PWA", "Vercel"],
    visual: "coverage",
    hue: 140,
    year: "2026",
    githubUrl: `${GH}/Covigo`,
    liveUrl: "https://covigo.vercel.app/",
    overview:
      "A web app for canvassers, leaflet distributors and survey teams that need to cover every street in an area. Draw a zone, and Covigo plans a route through every walkable street, guides you with GPS and tracks what you've covered.",
    problem:
      "Ordinary navigation apps route you from A to B. Covering every street in a zone without doubling back or missing any is a different problem, and people doing it usually rely on paper maps and memory.",
    solution:
      "Streets are pulled from the Overpass API and turned into an intersection graph. A greedy planner orders them with a sweep direction and dead-end priority. A bearing-based engine gives turn-by-turn instructions, GPS points mark streets done, and progress is saved offline. A serverless function proxies Gemini so the API key never reaches the browser.",
    architecture: [
      {
        title: "Flow",
        steps: [
          { label: "Draw zone", detail: "Leaflet.Draw" },
          { label: "Streets", detail: "Overpass API" },
          { label: "Route plan", detail: "Graph + greedy heuristic" },
          { label: "Navigation", detail: "GPS · turn-by-turn" },
          { label: "Assistant", detail: "Gemini via serverless proxy" },
        ],
      },
    ],
    features: [
      "Route planning over every walkable street, with sweep direction and dead-end priority",
      "Turn-by-turn guidance and automatic street completion from GPS",
      "Missed-street alerts, live coverage stats and time-left estimates",
      "Offline progress (IndexedDB) and cached map tiles (service worker)",
      "Gemini assistant with voice input that knows your live session",
    ],
    challenges: [
      "Exact coverage routing is the NP-hard Rural Postman Problem, so a fast greedy heuristic keeps planning instant in the browser for hundreds of streets.",
      "Keeping the Gemini key server-side with a same-origin proxy, input limits and escaped output.",
    ],
    results: [
      "Plans routes for hundreds of streets instantly, entirely in the browser",
      "No build step: one HTML file plus a serverless function",
    ],
  },
  {
    slug: "tour-planner",
    title: "AI Tour Planner",
    description:
      "Full-stack tourism platform connecting travellers, tour providers and local guides, with bookings, payments, reviews, an AI chatbot, translation and OCR.",
    tech: ["Python", "Flask", "MySQL", "OpenAI", "OpenCV", "Android (Java)"],
    visual: "tour",
    image: { src: "/projects/tour-planner-home.jpg", alt: "AI Tour Planner home page" },
    hue: 32,
    year: "2025",
    githubUrl: `${GH}/AI-Tour-Planner`,
    liveUrl: "https://ai-tour-planner-7uzv.vercel.app/",
    overview:
      "A tourism platform built during my full-stack internship at Rizz Technologies. Tour providers publish places and packages, admins review them, local guides pin useful spots, and travellers discover, book, pay for and review tours from an Android app.",
    problem:
      "Travellers and local tour operators usually find each other through scattered channels, and language barriers make it harder still.",
    solution:
      "One Flask application with role-based blueprints for admins, providers and guides, plus a REST API for the Android app, all backed by MySQL. AI features help travellers abroad: an OpenAI chatbot, translation into any language, and OCR that reads signs and menus from a photo.",
    architecture: [
      {
        title: "Platform",
        steps: [
          { label: "Android app", detail: "Java · travellers" },
          { label: "Web dashboards", detail: "Admin · provider · guide" },
          { label: "Flask", detail: "Blueprints + REST API" },
          { label: "AI services", detail: "Chatbot · translation · OCR" },
          { label: "MySQL", detail: "Users, tours, bookings" },
        ],
      },
    ],
    features: [
      "Four roles: admin, tour provider, local guide and traveller",
      "Places, packages, bookings, payments, ratings and reviews",
      "AI travel chatbot, translation into any language, and photo-to-text OCR",
      "Guides pin useful spots on a map for travellers",
      "Demo mode with a bundled SQLite database for one-click Vercel deploys",
    ],
    challenges: [
      "Integrating the chatbot, translation layer and database so they shared one consistent user record.",
    ],
    results: ["Deployed with fictional Kerala demo data and demo accounts for each role"],
  },
  {
    slug: "smart-travelogue",
    title: "Smart Travelogue",
    description:
      "Travel-journal platform: write travelogues, share trip photos and videos, and discover places, hotels and packages, from an Android app backed by a Flask API.",
    tech: ["Python", "Flask", "MySQL", "REST API", "Android (Java)"],
    visual: "travelogue",
    image: { src: "/projects/smart-travelogue-home.jpg", alt: "Smart Travelogue home page" },
    hue: 280,
    year: "2025",
    githubUrl: `${GH}/Smart-Travelogue`,
    liveUrl: "https://smart-travelogue.vercel.app/",
    overview:
      "My BCA main project: a home for each trip. Travellers write a travelogue with photos, videos and YouTube links that others can browse for inspiration, and explore places, hotels and packages curated by an admin.",
    problem:
      "Travel memories end up scattered across camera rolls and chat groups, and trip inspiration is spread across many sites.",
    solution:
      "A native Android app talks to a Flask REST API with 27 endpoints backed by MySQL. An admin dashboard manages places (with map locations), hotels, packages and notifications, and moderates travellers' content.",
    architecture: [
      {
        title: "Flow",
        steps: [
          { label: "Android app", detail: "Java · travellers" },
          { label: "Flask REST API", detail: "27 endpoints" },
          { label: "Admin dashboard", detail: "Places, hotels, packages" },
          { label: "MySQL", detail: "Users, travelogues, media" },
        ],
      },
    ],
    features: [
      "Travelogues with photos, videos and YouTube links",
      "Community feed of other travellers' trips",
      "Places, nearby places, hotels and packages, with favourites",
      "Notifications, feedback and complaints",
    ],
    challenges: ["Handling media uploads across the Android app, API and storage."],
    results: ["Deployed with fictional Kerala demo data and demo accounts"],
  },
];
