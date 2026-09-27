import { SectionHeading } from "@/components/ui/SectionHeading";
import { experience } from "@/data/experience";
import { Timeline } from "./Timeline";

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          id="experience-title"
          index="05"
          label="Experience"
          title={["Where I've", "worked"]}
          accentWords={["worked"]}
          align="center"
          description="Internships where I've built real products — from mobile apps to machine learning systems."
        />

        <Timeline entries={experience} />
      </div>
    </section>
  );
}
