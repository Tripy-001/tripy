'use client';

import React from 'react';

type LinkItem = { href: string; label: string };

interface ScrollSpyTabsProps {
  links: LinkItem[];
}

export default function ScrollSpyTabs({ links }: ScrollSpyTabsProps) {
  const [active, setActive] = React.useState<string>(links[0]?.href || '');
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    const sectionIds = links.map(l => l.href.replace('#', ''));
    const sections = sectionIds
      .map(id => (typeof document !== 'undefined' ? document.getElementById(id) : null))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Choose the most visible section
        let topEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!topEntry || entry.intersectionRatio > topEntry.intersectionRatio) {
            topEntry = entry;
          }
        }
        const id = topEntry?.target?.id;
        if (id) setActive(`#${id}`);
      },
      {
        root: null,
        // Trigger when section is near middle of viewport
        rootMargin: '-40% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [links]);

  return (
    <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar-x text-sm">
      {links.map((item, i) => {
        const isActive = active === item.href || (!active && i === 0);
        return (
          <a
            key={i}
            href={item.href}
            className={`px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white dark:bg-card text-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}


