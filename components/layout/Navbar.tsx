"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { navItems, site } from "@/data/site";
import { scrollToSection, useActiveSection } from "@/lib/hooks";
import { EASE_OUT, cn, pad } from "@/lib/utils";

const sectionIds = navItems.map((item) => item.id);

export function Navbar() {
  const active = useActiveSection(sectionIds);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  const go = useCallback((e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setOpen(false);
    // Wait a frame so the mobile menu's scroll lock is released first.
    requestAnimationFrame(() => scrollToSection(id));
  }, []);

  // Mobile menu: lock scroll, close on Escape, return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const button = menuButtonRef.current;
    const focusables = () => [
      ...(button ? [button] : []),
      ...document.querySelectorAll<HTMLElement>("#mobile-menu a"),
    ];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      // Keep focus cycling between the toggle and the menu links.
      const items = focusables();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
      e.preventDefault();
      items[next]?.focus();
    };
    window.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => document.querySelector<HTMLElement>("#mobile-menu a")?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
      >
        <div className="container-x flex items-center justify-between pt-4 md:pt-5">
          <a
            href="#home"
            onClick={(e) => go(e, "home")}
            className={cn(
              "relative z-[70] rounded-full px-3 py-2 text-lg font-medium tracking-tight transition-colors",
              scrolled && !open && "glass",
            )}
            aria-label={`${site.name} — back to top`}
          >
            {site.name}
            <span className="font-serif text-accent italic">.</span>
          </a>

          {/* Desktop */}
          <nav
            aria-label="Primary"
            className={cn(
              "absolute left-1/2 hidden -translate-x-1/2 rounded-full p-1.5 transition-[background-color,border-color,box-shadow] duration-500 lg:block",
              scrolled ? "glass shadow-[0_8px_40px_-12px_rgb(0_0_0/0.8)]" : "border border-transparent",
            )}
          >
            <ul className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => go(e, item.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative block rounded-full px-4 py-2 text-sm transition-colors duration-300",
                        isActive ? "text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <a
            href="#contact"
            onClick={(e) => go(e, "contact")}
            className="hidden items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-ink transition-shadow duration-300 hover:shadow-[0_0_0_5px_rgb(142_162_255/0.2)] lg:inline-flex"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inset-0 animate-pulse-soft rounded-full bg-emerald-500" />
            </span>
            Let&apos;s talk
          </a>

          {/* Mobile toggle */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "relative z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors lg:hidden",
              scrolled || open ? "glass" : "hairline",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed inset-0 z-40 flex flex-col bg-ink/95 backdrop-blur-xl lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center">
              <ul className="space-y-1">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 + i * 0.05 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => go(e, item.id)}
                      aria-current={active === item.id ? "true" : undefined}
                      className="group flex items-baseline gap-4 py-2"
                    >
                      <span className="font-mono text-xs text-subtle">{pad(i + 1)}</span>
                      <span
                        className={cn(
                          "text-[clamp(2.5rem,11vw,4rem)] leading-none font-medium tracking-tight transition-colors",
                          active === item.id ? "text-fg" : "text-muted group-hover:text-fg",
                        )}
                      >
                        {item.label}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.p
              className="container-x pb-10 eyebrow flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.45 } }}
              exit={{ opacity: 0 }}
            >
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-signal" aria-hidden="true" />
              Available for opportunities
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
