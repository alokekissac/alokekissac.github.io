import { placeholder, type Content } from "@/lib/content";

export type TimelineKind = "work" | "education";

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  title: Content;
  organisation: Content;
  period: Content;
  location?: Content;
  summary: Content;
  highlights?: Content[];
  current?: boolean;
};

export const experience: TimelineEntry[] = [
  {
    id: "corizo",
    kind: "work",
    title: "Machine Learning Intern",
    organisation: "Corizo (IIT Bombay Mood Indigo)",
    period: "Jul 2026 — Sep 2026",
    location: "Remote",
    summary:
      "Remote machine learning internship focused on applying the end-to-end ML workflow to guided project work.",
    highlights: [
      "Prepared and explored datasets, then trained and evaluated supervised learning models in Python.",
      placeholder("Add the specific project, dataset or models you worked on"),
    ],
  },
  {
    id: "rizz",
    kind: "work",
    title: "Full-Stack Developer Intern",
    organisation: "Rizz Technologies",
    period: "Dec 2024 — Jun 2025",
    location: "India",
    summary:
      "Owned the backend, recommendation model and database of an AI-powered tour-planning platform end to end, in a small team without senior engineers.",
    highlights: [
      "Built booking flows, an AI chatbot and role-based access for admins, tour providers and customers on a Python, Flask and SQL stack.",
      "Replaced static listings with a machine learning recommendation engine that suggests trips from each user's history.",
      "Resolved integration issues so the chatbot, translation layer and database shared one consistent user record.",
      "Worked in a build, test and review loop with nightly builds, adapting to changing requirements and turning early-user feedback into fixes.",
    ],
  },
  {
    id: "softloom",
    kind: "work",
    title: "Flutter Developer Intern",
    organisation: "SoftLoom IT Solutions",
    period: "Feb 2024 — Aug 2024",
    location: "India",
    summary:
      "Built a working Android app prototype in Flutter and Dart independently, from project setup to a finished, device-tested app.",
    highlights: [
      "Developed the login flow, navigation drawer and bottom navigation bar using Material Design widgets.",
      "Learned Flutter's stateless and stateful widget model by building, testing on device and refining real layouts in Android Studio.",
      "Reworked layouts and navigation after on-device testing, keeping notes that became the app's working documentation.",
    ],
  },
];

export const education: TimelineEntry[] = [
  {
    id: "msc-ai",
    kind: "education",
    title: "MSc in Artificial Intelligence (Computer Science)",
    organisation: "Dublin Business School",
    period: "2026",
    location: "Dublin, Ireland",
    summary:
      "Postgraduate study covering machine learning and predictive modelling, deep learning, NLP, reinforcement learning, generative and agentic AI, and retrieval-augmented generation.",
    highlights: [
      "MSc project: built a full-stack landfill waste forecasting platform, from raw records to a deployed web app.",
      "Normalised raw waste records into indexed SQL tables and served them through a Flask REST API.",
      "Trained and compared five model families on a held-out validation set before choosing one for deployment.",
      "Added request-latency and error monitoring, and traced post-launch defects across the frontend, API and database.",
    ],
  },
  {
    id: "bca",
    kind: "education",
    title: "Bachelor of Computer Applications (BCA)",
    organisation: "Girideepam Institute of Advanced Learning",
    period: "2025",
    location: "Kottayam, Kerala, India",
    summary:
      "Undergraduate degree covering data structures and algorithms, object-oriented programming, database management and SQL, web and Android development, cloud computing, and AI and machine learning fundamentals.",
  },
];
