"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/events", label: "Events", icon: IconToday },
  { href: "/todo", label: "To-Do", icon: IconTodo },
  { href: "/content", label: "Content", icon: IconContent },
  { href: "/clients", label: "Clients", icon: IconClients },
  { href: "/fitness", label: "Fitness", icon: IconFitness },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-line bg-surface/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium"
              >
                <Icon
                  className={active ? "text-accent" : "text-ink-soft"}
                  filled={active}
                />
                <span className={active ? "text-accent" : "text-ink-soft"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { className?: string; filled?: boolean };

function IconToday({ className }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 3V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8.2" cy="13.2" r="1.15" fill="currentColor" />
      <circle cx="12" cy="13.2" r="1.15" fill="currentColor" />
      <circle cx="8.2" cy="17" r="1.15" fill="currentColor" />
    </svg>
  );
}

function IconTodo({ className }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 6.8L6.2 8.5L9.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 13.8L6.2 15.5L9.5 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4.5" y="19" width="5" height="1.9" rx="0.6" fill="currentColor" opacity="0.35" />
      <path d="M12.5 6.5H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.5 13.5H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.5 19.5H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function IconContent({ className }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 9.3L14.2 12L10 14.7V9.3Z" fill="currentColor" />
    </svg>
  );
}

function IconClients({ className }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8.3" r="2.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 19c0-3 2.3-5.2 5.2-5.2s5.2 2.2 5.2 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.8" cy="8.8" r="2.1" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
      <path d="M14.9 19c0-2.4 1.7-4.3 3.9-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IconFitness({ className }: IconProps) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12H21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="5" y="9" width="2.6" height="6" rx="0.9" fill="currentColor" />
      <rect x="16.4" y="9" width="2.6" height="6" rx="0.9" fill="currentColor" />
      <rect x="1.5" y="10.2" width="1.8" height="3.6" rx="0.7" fill="currentColor" opacity="0.6" />
      <rect x="20.7" y="10.2" width="1.8" height="3.6" rx="0.7" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
