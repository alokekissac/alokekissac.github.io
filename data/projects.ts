import { placeholder, type Content } from "@/lib/content";

export type ProjectVisual = "rag" | "waste" | "tour" | "travelogue";

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

/*
 * NOTE: Overview / problem / solution / architecture text is drafted from the
 * one-line project descriptions. Review each for accuracy. Anything that would
 * need real numbers or specifics (results, challenges, dates, links) is a
 * placeholder on purpose.
 */
export const projects: Project[] = [
  {
    slug: "advanced-rag-system",
    title: "Advanced RAG System",
    description:
      "Production-oriented Retrieval-Augmented Generation system designed for trustworthy question answering over private documents.",
    tech: ["Python", "LLMs", "RAG", "Vector Database", "Embeddings", "FastAPI"],
    visual: "rag",
    hue: 228,
    year: placeholder("Year"),
    githubUrl: placeholder("GitHub repository URL"),
    liveUrl: placeholder("Live demo URL (remove if none)"),
    overview:
      "A retrieval-augmented generation service that answers questions over a private document collection, grounding each answer in passages retrieved from those documents rather than in the model's general knowledge.",
    problem:
      "Large language models answer fluently but can't see private documents, and when they don't know something they may still produce a confident answer. For internal knowledge, an answer is only useful if it can be traced back to a source.",
    solution:
      "Documents are ingested, split into chunks and embedded into a vector database. At question time the most relevant chunks are retrieved and passed to the LLM as context, and the whole pipeline is exposed through a FastAPI service so it can sit behind any interface.",
    architecture: [
      {
        title: "Ingestion",
        steps: [
          { label: "Documents", detail: "Private source files" },
          { label: "Chunking", detail: "Split into passages" },
          { label: "Embeddings", detail: "Vectorise each chunk" },
          { label: "Vector DB", detail: "Index for similarity search" },
        ],
      },
      {
        title: "Query",
        steps: [
          { label: "Question", detail: "Request via FastAPI" },
          { label: "Retrieval", detail: "Top-k relevant chunks" },
          { label: "LLM", detail: "Answer from retrieved context" },
          { label: "Response", detail: "Grounded answer" },
        ],
      },
    ],
    features: [
      "Document ingestion and chunking pipeline",
      "Embedding-based semantic search over a vector database",
      "Answers generated from retrieved context",
      "FastAPI service layer",
      placeholder("Add any extra features — e.g. source citations, re-ranking, evaluation"),
    ],
    challenges: [placeholder("Describe the main technical challenges and how you approached them")],
    results: [placeholder("Add real, measured results (accuracy, latency, evaluation scores) — or remove")],
  },
  {
    slug: "ai-waste-management",
    title: "AI-Powered Waste Management",
    description: "Predictive modelling system for sustainable landfill waste forecasting.",
    tech: ["Python", "Machine Learning", "Data Analysis", "Predictive Modelling"],
    visual: "waste",
    hue: 158,
    year: placeholder("Year"),
    githubUrl: placeholder("GitHub repository URL"),
    liveUrl: "https://ai-landfill-waste-forecasting.vercel.app/",
    overview:
      "A machine-learning project that forecasts landfill waste so that planning decisions can be based on expected volumes rather than on past totals alone.",
    problem:
      "Landfill capacity and waste-handling resources are planned in advance. Without a reasonable forecast of future waste, planning tends to be reactive, which makes sustainable waste management harder.",
    solution:
      "Historical waste data is explored and prepared, then used to train predictive models that estimate future landfill waste. The results are analysed and visualised to support planning.",
    architecture: [
      {
        title: "Pipeline",
        steps: [
          { label: "Raw data", detail: placeholder("Dataset source") },
          { label: "Analysis", detail: "Cleaning & exploration" },
          { label: "Features", detail: "Model-ready inputs" },
          { label: "Model", detail: "Predictive modelling" },
          { label: "Forecast", detail: "Waste estimates" },
        ],
      },
    ],
    features: [
      "Exploratory data analysis of historical waste data",
      "Data preparation and feature engineering",
      "Predictive models for waste forecasting",
      "Visualisation of forecasts for planning",
    ],
    challenges: [placeholder("Describe data or modelling challenges")],
    results: [placeholder("Add real model evaluation results — or remove")],
  },
  {
    slug: "tour-planner",
    title: "Tour Planner",
    description:
      "Full-stack intelligent tourism platform connecting travellers, tour providers, bookings, payments, reviews, multilingual content and AI-powered features.",
    tech: ["Python", "Flask", "JavaScript", "Machine Learning", "MySQL"],
    visual: "tour",
    hue: 32,
    year: placeholder("Year"),
    githubUrl: placeholder("GitHub repository URL"),
    liveUrl: placeholder("Live demo URL (remove if none)"),
    overview:
      "A full-stack tourism platform where travellers discover and book tours, providers manage their offerings, and machine learning adds intelligent features on top of the core marketplace.",
    problem:
      "Travellers and local tour providers often connect through fragmented channels, which makes discovering, comparing, booking and reviewing tours harder than it needs to be — especially across languages.",
    solution:
      "A single Flask application backed by MySQL handles traveller and provider accounts, tour listings, bookings, payments and reviews, with multilingual content and ML-powered features integrated into the experience.",
    architecture: [
      {
        title: "Platform",
        steps: [
          { label: "Web client", detail: "HTML, CSS, JavaScript" },
          { label: "Flask app", detail: "Routing & business logic" },
          { label: "ML module", detail: "AI-powered features" },
          { label: "MySQL", detail: "Users, tours, bookings" },
        ],
      },
    ],
    features: [
      "Traveller and tour-provider roles",
      "Tour listings and bookings",
      "Payments flow",
      "Reviews",
      "Multilingual content",
      placeholder("Name the specific AI-powered features (e.g. recommendations)"),
    ],
    challenges: [placeholder("Describe the main challenges")],
    results: [placeholder("Add real outcomes — or remove")],
  },
  {
    slug: "smart-travelogue",
    title: "Smart Travelogue",
    description:
      "AI-assisted travel platform designed to make trip planning more personalized and intelligent.",
    tech: ["Python", "AI", "Web Development"],
    visual: "travelogue",
    hue: 280,
    year: placeholder("Year"),
    githubUrl: placeholder("GitHub repository URL"),
    overview:
      "An AI-assisted travel platform that helps people plan trips around their own preferences instead of generic itineraries.",
    problem:
      "Trip planning usually means piecing together information from many sources, and most suggestions aren't tailored to the individual traveller.",
    solution:
      "A web platform built in Python that uses AI to personalise trip planning based on what the traveller is looking for.",
    architecture: [
      {
        title: "Flow",
        steps: [
          { label: "Preferences", detail: "Traveller input" },
          { label: "Web app", detail: "Python back end" },
          { label: "AI layer", detail: "Personalisation" },
          { label: "Plan", detail: "Tailored suggestions" },
        ],
      },
    ],
    features: [
      "AI-assisted, personalised trip planning",
      "Web-based interface",
      placeholder("Add the platform's specific features"),
    ],
    challenges: [placeholder("Describe the main challenges")],
    results: [placeholder("Add real outcomes — or remove")],
  },
];
