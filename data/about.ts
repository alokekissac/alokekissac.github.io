export type FocusIconName = "brain" | "code" | "globe" | "workflow" | "sparkles";

export type FocusArea = {
  id: string;
  title: string;
  icon: FocusIconName;
  summary: string;
  detail: string;
};

export const aboutIntro = {
  eyebrow: "About",
  statement:
    "I'm a full stack developer moving deeper into artificial intelligence — building systems that are useful, understandable and dependable.",
  paragraphs: [
    "I hold a Bachelor of Computer Applications (BCA) and an MSc in Artificial Intelligence from Dublin Business School.",
    "My background is in software development: I've built web applications end to end, from data models and APIs to the interfaces people actually touch. Today I focus on machine learning, retrieval-augmented generation and automation — and on the engineering that makes them hold up outside a notebook.",
  ],
  facts: [
    { label: "Graduated", value: "MSc Artificial Intelligence", sub: "Dublin Business School" },
    { label: "Undergraduate", value: "BCA", sub: "Girideepam Institute of Advanced Learning" },
    { label: "Based in", value: "Dublin, Ireland", sub: "Open to opportunities" },
  ],
};

export const focusAreas: FocusArea[] = [
  {
    id: "ai-ml",
    title: "AI / Machine Learning",
    icon: "brain",
    summary: "Models that solve a defined problem.",
    detail:
      "Predictive modelling, NLP and retrieval-augmented generation — starting from a baseline, then measuring whether complexity actually helps.",
  },
  {
    id: "software-engineering",
    title: "Software Engineering",
    icon: "code",
    summary: "Clean, typed, maintainable code.",
    detail:
      "Clear module boundaries, typed interfaces and code that is easy for the next person to read, test and extend.",
  },
  {
    id: "web-development",
    title: "Web Development",
    icon: "globe",
    summary: "Full-stack web applications.",
    detail:
      "From Flask and Node.js back ends with relational databases to React / Next.js and Flutter front ends.",
  },
  {
    id: "automation",
    title: "Automation",
    icon: "workflow",
    summary: "Removing repetitive work.",
    detail:
      "Workflow automation with tools like n8n and scripted pipelines that connect APIs, data and models.",
  },
  {
    id: "creative-technology",
    title: "Creative Technology",
    icon: "sparkles",
    summary: "Interfaces that feel considered.",
    detail:
      "Interaction design, motion and visual detail used in service of clarity — never at the cost of performance or accessibility.",
  },
];
