import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[100svh] flex-col items-start justify-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-[clamp(2.5rem,8vw,6rem)] leading-none font-medium tracking-[-0.04em]">
        Nothing <span className="font-serif font-normal text-accent italic">here</span>.
      </h1>
      <p className="mt-6 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink"
      >
        Back home
      </Link>
    </section>
  );
}
