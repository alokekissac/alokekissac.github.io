export type PipelineStep = {
  id: string;
  label: string;
  question: string;
  description: string;
  outputs: string[];
};

/** "How I Build" — the engineering process, stage by stage. */
export const pipeline: PipelineStep[] = [
  {
    id: "idea",
    label: "Idea",
    question: "What problem, for whom — and how will we know it worked?",
    description:
      "Start from the user and the problem, not the technology. Define what success looks like before writing any code.",
    outputs: ["Problem statement", "Success criteria", "Scope"],
  },
  {
    id: "architecture",
    label: "Architecture",
    question: "What are the moving parts, and where can they fail?",
    description:
      "Sketch components, data flow and boundaries. Choose the simplest design that meets the requirements and leaves room to change.",
    outputs: ["System diagram", "Interfaces", "Trade-offs"],
  },
  {
    id: "data",
    label: "Data",
    question: "Where does the data come from, and can it be trusted?",
    description:
      "Understand sources, quality and privacy. Clean and version the data, and set aside evaluation sets before any modelling starts.",
    outputs: ["Schema", "Cleaning steps", "Evaluation set"],
  },
  {
    id: "ai-logic",
    label: "AI / Logic",
    question: "Does a model beat a simple baseline?",
    description:
      "Begin with rules or a simple baseline, then add ML or LLM components only where they measurably improve the outcome.",
    outputs: ["Baseline", "Model / prompts", "Metrics"],
  },
  {
    id: "api",
    label: "API",
    question: "How do other parts of the system talk to it?",
    description:
      "Wrap the logic in a small, typed, validated API with clear errors — so the interface, tests and other services can rely on it.",
    outputs: ["Endpoints", "Validation", "Error handling"],
  },
  {
    id: "interface",
    label: "Interface",
    question: "Is it fast, accessible and honest about its state?",
    description:
      "Design the experience around real use: loading, empty and error states, keyboard access, and feedback people can understand.",
    outputs: ["UI components", "States", "Accessibility"],
  },
  {
    id: "deployment",
    label: "Deployment",
    question: "Can it run reliably somewhere other than my laptop?",
    description:
      "Containerise, automate builds and configuration, keep secrets out of code, and watch how it behaves once people use it.",
    outputs: ["Container", "CI / config", "Monitoring"],
  },
];
