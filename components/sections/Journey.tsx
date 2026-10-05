import { SectionHeading } from "@/components/ui/SectionHeading";
import { education, experience } from "@/data/experience";
import { RoadTrip } from "./RoadTrip";

// Oldest first, so the road runs forward in time.
const ORDER = ["softloom", "rizz", "bca", "msc-ai", "corizo"];
const all = [...experience, ...education];
const journey = [
  ...ORDER.map((id) => all.find((e) => e.id === id)).filter((e): e is (typeof all)[number] => !!e),
  ...all.filter((e) => !ORDER.includes(e.id)),
];

export function Journey() {
  return (
    <section id="journey" aria-labelledby="journey-title" className="relative py-24 md:py-32">
      {/* Old anchors keep working */}
      <span id="experience" className="absolute top-0" aria-hidden="true" />
      <span id="education" className="absolute top-0" aria-hidden="true" />
      <div className="container-x">
        <SectionHeading
          id="journey-title"
          index="06"
          label="Experience & Education"
          title={["The road", "so far"]}
          accentWords={["road"]}
          align="center"
          description="Scroll to drive through my internships and degrees, from Kerala to Dublin."
        />
        <RoadTrip entries={journey} />
      </div>
    </section>
  );
}
