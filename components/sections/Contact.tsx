import { Mail } from "lucide-react";
import { SplitText } from "@/components/animations/SplitText";
import { Reveal } from "@/components/animations/Reveal";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import { ContactForm } from "@/components/sections/ContactForm";
import { site } from "@/data/site";
import { isPlaceholder } from "@/lib/content";

export function Contact() {
  const { email, linkedin, github } = site.links;
  const mailHref = isPlaceholder(email) ? email : `mailto:${email}`;

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[80%] bg-[radial-gradient(60%_60%_at_50%_100%,rgb(142_162_255/0.14),transparent_70%)]"
      />
      <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <Reveal y={12}>
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">08</span>
              <span className="h-px w-8 bg-line-strong" aria-hidden="true" />
              Contact
            </p>
          </Reveal>
          <h2
            id="contact-title"
            className="mt-6 text-[clamp(2.75rem,7vw,6.25rem)] leading-[0.95] font-medium tracking-[-0.045em] text-balance"
          >
            <SplitText lines={["Have an idea", "worth building?"]} accentWords={["worth"]} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 text-xl text-muted md:text-2xl">Let&apos;s turn it into something real.</p>
          </Reveal>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={mailHref} variant="primary" icon={<Mail size={17} />}>
              Email Me
            </ButtonLink>
            <ButtonLink href={linkedin} external icon={<LinkedInIcon size={16} />}>
              LinkedIn
            </ButtonLink>
            <ButtonLink href={github} external icon={<GitHubIcon size={16} />}>
              GitHub
            </ButtonLink>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="mt-10 flex items-center gap-2 text-sm text-subtle">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-signal" aria-hidden="true" />
              Currently open to AI / software engineering roles and collaborations.
            </p>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-6" delay={0.15}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
