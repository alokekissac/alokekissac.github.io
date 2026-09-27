import { ArrowUpRight, GitFork, Info, Star } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { GitHubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/data/site";
import { getGitHubData, type ContributionDay, type GitHubData } from "@/lib/github";
import { cn } from "@/lib/utils";

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#6f9cff",
  TypeScript: "#7fb4ff",
  JavaScript: "#f2d86b",
  Dart: "#5ee6d0",
  Java: "#f0a35e",
  "Jupyter Notebook": "#f28c5e",
  HTML: "#ef7a5c",
  CSS: "#b69cff",
  "C++": "#f07aa8",
  C: "#a0a0b0",
};
const colorFor = (lang: string | null) => (lang && LANGUAGE_COLORS[lang]) || "#74748a";

const LEVEL_CLASSES = ["bg-white/[0.04]", "bg-accent/25", "bg-accent/45", "bg-accent/70", "bg-accent"];

function relativeDate(iso: string) {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

function SampleBadge() {
  return (
    <span className="rounded-full border border-dashed border-amber-300/50 bg-amber-300/[0.07] px-2 py-0.5 font-mono text-[10px] tracking-wider text-amber-200 uppercase">
      Sample data
    </span>
  );
}

function ContributionGrid({ days, sample }: { days: ContributionDay[]; sample: boolean }) {
  // Group into weeks (columns of 7).
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="mask-fade-x -mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
      <div
        className="grid w-max grid-flow-col gap-[3px] md:w-full"
        style={{ gridTemplateRows: "repeat(7, auto)", gridAutoColumns: "minmax(11px, 1fr)" }}
        role="img"
        aria-label={sample ? "Illustrative contribution pattern (sample data)" : "Contribution calendar for the past year"}
      >
        {weeks.flatMap((week) =>
          week.map((day) => (
            <span
              key={day.date}
              title={sample ? undefined : `${day.count} contributions on ${day.date}`}
              className={cn("block aspect-square w-[11px] rounded-[3px] md:w-full", LEVEL_CLASSES[day.level])}
            />
          )),
        )}
      </div>
    </div>
  );
}

function View({ data }: { data: GitHubData }) {
  const sample = data.source === "sample";
  const profileHref = data.profileUrl ?? site.links.github;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6 [&>*]:min-w-0">
      {sample && (
        <Reveal className="md:col-span-6">
          <p className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-300/30 bg-amber-300/[0.04] px-5 py-4 text-sm text-amber-100/80">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              This section is showing <strong className="font-medium text-amber-100">sample data</strong>, not real
              GitHub statistics. Set <code className="font-mono text-xs">GITHUB_USERNAME</code> (and optionally{" "}
              <code className="font-mono text-xs">GITHUB_TOKEN</code>) to show live activity.
            </span>
          </p>
        </Reveal>
      )}

      {/* Contributions */}
      <Reveal className="md:col-span-6">
        <div className="rounded-3xl border border-line bg-ink-2 p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium tracking-tight">Contribution activity</h3>
              {sample && <SampleBadge />}
            </div>
            <p className="font-mono text-xs text-subtle">
              {data.totalContributions !== null
                ? `${data.totalContributions.toLocaleString("en-IE")} contributions in the last year`
                : sample
                  ? "Illustrative pattern"
                  : "Add GITHUB_TOKEN to show the calendar"}
            </p>
          </div>
          {data.contributions ? (
            <ContributionGrid days={data.contributions} sample={sample} />
          ) : (
            <p className="text-sm text-muted">Contribution calendar unavailable.</p>
          )}
          <div className="mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] text-subtle" aria-hidden="true">
            Less
            {LEVEL_CLASSES.map((c) => (
              <span key={c} className={cn("h-2.5 w-2.5 rounded-[3px]", c)} />
            ))}
            More
          </div>
        </div>
      </Reveal>

      {/* Repositories */}
      <Reveal className="md:col-span-4" delay={0.05}>
        <div className="h-full rounded-3xl border border-line bg-ink-2 p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="text-lg font-medium tracking-tight">Recent repositories</h3>
            {sample && <SampleBadge />}
          </div>
          <ul className="divide-y divide-line">
            {data.repos.map((repo) => {
              const inner = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-mono text-sm text-fg">
                      {repo.name}
                      {repo.url && (
                        <ArrowUpRight size={14} className="text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      )}
                    </span>
                    {repo.description && <span className="mt-1 block truncate text-sm text-subtle">{repo.description}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-4 font-mono text-xs text-subtle">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: colorFor(repo.language) }} aria-hidden="true" />
                        {repo.language}
                      </span>
                    )}
                    {!sample && (
                      <>
                        <span className="hidden items-center gap-1 sm:flex" aria-label={`${repo.stars} stars`}>
                          <Star size={12} aria-hidden="true" /> {repo.stars}
                        </span>
                        <span className="hidden items-center gap-1 sm:flex" aria-label={`${repo.forks} forks`}>
                          <GitFork size={12} aria-hidden="true" /> {repo.forks}
                        </span>
                        <span className="hidden md:inline">{relativeDate(repo.pushedAt)}</span>
                      </>
                    )}
                  </span>
                </>
              );
              return (
                <li key={repo.name}>
                  {repo.url ? (
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4">
                      {inner}
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>

      {/* Languages + profile */}
      <Reveal className="md:col-span-2" delay={0.1}>
        <div className="flex h-full flex-col rounded-3xl border border-line bg-ink-2 p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="text-lg font-medium tracking-tight">Languages</h3>
            {sample && <SampleBadge />}
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/5" aria-hidden="true">
            {data.languages.map((l) => (
              <span key={l.name} style={{ width: `${l.share * 100}%`, background: colorFor(l.name) }} />
            ))}
          </div>
          <ul className="mt-5 space-y-2.5">
            {data.languages.map((l) => (
              <li key={l.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: colorFor(l.name) }} aria-hidden="true" />
                  {l.name}
                </span>
                <span className="font-mono text-xs text-subtle">{Math.round(l.share * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-subtle">
            {sample ? "Illustrative split." : "Share of public repositories by primary language."}
          </p>
          <div className="mt-auto pt-8">
            {data.publicRepos !== null && (
              <p className="mb-4 text-sm text-muted">
                <span className="text-2xl font-medium text-fg">{data.publicRepos}</span> public repositories
              </p>
            )}
            <ButtonLink href={profileHref} external icon={<GitHubIcon size={16} />} className="w-full">
              View GitHub
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export async function GitHubActivity() {
  const data = await getGitHubData();
  return (
    <section id="github" aria-labelledby="github-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          id="github-title"
          index="07"
          label="Code"
          title={["Building in", "public."]}
          accentWords={["public."]}
          description="Repositories, languages and activity — pulled from GitHub once connected."
        />
        <View data={data} />
      </div>
    </section>
  );
}
