export type SkillCategoryId = "languages" | "frontend" | "backend" | "ai" | "tools";

export type Skill = {
  name: string;
  category: SkillCategoryId;
  /** Short, factual note on how the skill is used. */
  note: string;
};

export type SkillCategory = {
  id: SkillCategoryId;
  label: string;
  description: string;
};

export const skillCategories: SkillCategory[] = [
  { id: "languages", label: "Languages", description: "The core languages I write software in." },
  { id: "frontend", label: "Frontend", description: "Building interfaces for web and mobile." },
  { id: "backend", label: "Backend", description: "APIs, services and server-side logic." },
  { id: "ai", label: "AI / ML", description: "Modelling, language and retrieval systems." },
  { id: "tools", label: "Tools", description: "How I version, ship, design and automate." },
];

export const skills: Skill[] = [
  // Languages
  { name: "Python", category: "languages", note: "Primary language for ML, data work and Flask/FastAPI services." },
  { name: "JavaScript", category: "languages", note: "Interactive front ends and Node.js services." },
  { name: "TypeScript", category: "languages", note: "Typed front ends and tooling — including this site." },
  { name: "Java", category: "languages", note: "Object-oriented programming fundamentals." },
  { name: "C", category: "languages", note: "Systems-level programming fundamentals." },
  { name: "C++", category: "languages", note: "Data structures, algorithms and OOP." },

  // Frontend
  { name: "HTML", category: "frontend", note: "Semantic, accessible markup." },
  { name: "CSS", category: "frontend", note: "Responsive layout, motion and design systems." },
  { name: "React", category: "frontend", note: "Component-driven interfaces." },
  { name: "Next.js", category: "frontend", note: "Server-rendered React applications." },
  { name: "Flutter", category: "frontend", note: "Cross-platform mobile apps — used during my internship." },

  // Backend
  { name: "Flask", category: "backend", note: "Python web applications and APIs." },
  { name: "Node.js", category: "backend", note: "JavaScript services and tooling." },
  { name: "REST APIs", category: "backend", note: "Designing and consuming HTTP APIs." },

  // AI / ML
  { name: "Machine Learning", category: "ai", note: "Supervised modelling, evaluation and feature work." },
  { name: "NLP", category: "ai", note: "Working with and processing natural language." },
  { name: "RAG", category: "ai", note: "Retrieval-augmented generation over private documents." },
  { name: "LLMs", category: "ai", note: "Building applications on large language models." },
  { name: "Scikit-learn", category: "ai", note: "Classical ML models and pipelines." },
  { name: "TensorFlow / PyTorch", category: "ai", note: "Deep learning frameworks." },

  // Tools
  { name: "Git", category: "tools", note: "Version control for every project." },
  { name: "GitHub", category: "tools", note: "Collaboration, reviews and code hosting." },
  { name: "Docker", category: "tools", note: "Reproducible, containerised environments." },
  { name: "Figma", category: "tools", note: "Interface design and prototyping." },
  { name: "n8n", category: "tools", note: "Workflow automation across APIs and services." },
];
