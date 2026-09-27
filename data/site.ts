import type { Content } from "@/lib/content";

export type NavItem = { id: string; label: string };

export const site = {
  name: "Aloke",
  role: "AI Engineer / Full Stack Developer",
  title: "Aloke — AI Engineer & Full Stack Developer",
  description:
    "Portfolio of Aloke, an AI Engineer and Full Stack Developer building intelligent systems, AI applications, and interactive digital experiences.",
  /** Set NEXT_PUBLIC_SITE_URL in production so OG/canonical URLs are absolute. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  location: "Dublin, Ireland",
  available: true,
  links: {
    email: "alokeissac@gmail.com" as Content,
    github: "https://github.com/alokekissac" as Content,
    linkedin: "https://www.linkedin.com/in/alokekisssac/" as Content,
  },
} as const;

export const navItems: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];
