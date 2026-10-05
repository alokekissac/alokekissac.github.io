import { Footer } from "@/components/layout/Footer";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { GitHubActivity } from "@/components/sections/GitHubActivity";
import { Hero } from "@/components/sections/Hero";
import { HowIBuild } from "@/components/sections/HowIBuild";
import { Journey } from "@/components/sections/Journey";
import { Lab } from "@/components/sections/Lab";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { site } from "@/data/site";
import { isRealUrl } from "@/lib/content";

// Re-fetch GitHub data at most every 6 hours.
export const revalidate = 21600;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: "AI Engineer & Full Stack Developer",
  url: site.url,
  alumniOf: ["Dublin Business School", "Girideepam Institute of Advanced Learning"],
  sameAs: [site.links.github, site.links.linkedin].filter(isRealUrl),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Lab />
      <HowIBuild />
      <Journey />
      <GitHubActivity />
      <Contact />
      <Footer />
    </>
  );
}
