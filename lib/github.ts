/**
 * GitHub data for the "Building in public" section.
 *
 * - Set GITHUB_USERNAME to load real public repositories (REST API, no token needed).
 * - Also set GITHUB_TOKEN (read-only, no scopes) to load the real contribution calendar
 *   via the GraphQL API. The token is only ever used on the server.
 * - With nothing configured, the section renders clearly labelled SAMPLE data.
 */

export type RepoSummary = {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
};

export type LanguageShare = { name: string; share: number };

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type GitHubData = {
  source: "live" | "sample";
  username: string | null;
  profileUrl: string | null;
  publicRepos: number | null;
  repos: RepoSummary[];
  languages: LanguageShare[];
  /** Null when the calendar isn't available (no token). */
  contributions: ContributionDay[] | null;
  totalContributions: number | null;
};

const REVALIDATE_SECONDS = 60 * 60 * 6;

type ApiRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

type ApiUser = { public_repos: number; html_url: string };

type GraphQLCalendar = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
        };
      };
    };
  };
};

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function headers(token?: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "aloke-portfolio",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function computeLanguages(repos: RepoSummary[]): LanguageShare[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, n]) => ({ name, share: n / total }));
}

async function fetchContributions(username: string, token: string) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: username } }),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as GraphQLCalendar;
  const calendar = json.data?.user?.contributionsCollection.contributionCalendar;
  if (!calendar) return null;
  const days = calendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVELS[d.contributionLevel] ?? 0,
    })),
  );
  return { days, total: calendar.totalContributions };
}

export async function getGitHubData(): Promise<GitHubData> {
  const username = process.env.GITHUB_USERNAME?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!username) return getSampleGitHubData();

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: headers(token),
        next: { revalidate: REVALIDATE_SECONDS },
      }),
      fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
        { headers: headers(token), next: { revalidate: REVALIDATE_SECONDS } },
      ),
    ]);
    if (!userRes.ok || !reposRes.ok) throw new Error(`GitHub API ${userRes.status}/${reposRes.status}`);

    const user = (await userRes.json()) as ApiUser;
    const apiRepos = (await reposRes.json()) as ApiRepo[];
    const repos: RepoSummary[] = apiRepos
      .filter((r) => !r.fork && !r.archived)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        pushedAt: r.pushed_at,
      }));

    const calendar = token ? await fetchContributions(username, token).catch(() => null) : null;

    return {
      source: "live",
      username,
      profileUrl: user.html_url,
      publicRepos: user.public_repos,
      repos: repos.slice(0, 4),
      languages: computeLanguages(repos),
      contributions: calendar?.days ?? null,
      totalContributions: calendar?.total ?? null,
    };
  } catch (error) {
    console.warn("[github] Falling back to sample data:", error);
    return getSampleGitHubData();
  }
}

/** Deterministic PRNG so the sample grid renders identically on server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clearly-labelled illustrative data. Never presented as real statistics. */
export function getSampleGitHubData(): GitHubData {
  const rand = mulberry32(20260924);
  const days: ContributionDay[] = [];
  const start = Date.UTC(2025, 8, 28); // a Sunday, 53 weeks of cells
  for (let i = 0; i < 53 * 7; i++) {
    const r = rand();
    const level = (r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.86 ? 2 : r < 0.96 ? 3 : 4) as ContributionDay["level"];
    days.push({ date: new Date(start + i * 86_400_000).toISOString().slice(0, 10), count: level, level });
  }

  return {
    source: "sample",
    username: null,
    profileUrl: null,
    publicRepos: null,
    repos: [
      { name: "advanced-rag-system", description: "Sample entry — connect GitHub to show real repositories.", url: "", language: "Python", stars: 0, forks: 0, pushedAt: "" },
      { name: "waste-forecasting", description: "Sample entry — connect GitHub to show real repositories.", url: "", language: "Jupyter Notebook", stars: 0, forks: 0, pushedAt: "" },
      { name: "tour-planner", description: "Sample entry — connect GitHub to show real repositories.", url: "", language: "Python", stars: 0, forks: 0, pushedAt: "" },
      { name: "portfolio", description: "Sample entry — connect GitHub to show real repositories.", url: "", language: "TypeScript", stars: 0, forks: 0, pushedAt: "" },
    ],
    languages: [
      { name: "Python", share: 0.45 },
      { name: "TypeScript", share: 0.2 },
      { name: "JavaScript", share: 0.15 },
      { name: "Dart", share: 0.1 },
      { name: "Other", share: 0.1 },
    ],
    contributions: days,
    totalContributions: null,
  };
}
