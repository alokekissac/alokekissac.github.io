import { SectionHeading } from "@/components/ui/SectionHeading";
import { education } from "@/data/experience";
import { Timeline } from "./Timeline";

export function Education() {
  return (
    <section id="education" aria-labelledby="education-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          id="education-title"
          index="06"
          label="Education"
          title={["What I've", "studied"]}
          accentWords={["studied"]}
          align="center"
          description="Degrees in computer applications and artificial intelligence."
        />

        <Timeline entries={education} />
      </div>
    </section>
  );
}
