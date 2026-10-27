"use client";

import { ShareButton } from "@/components/ui/share-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { useSession } from "@/lib/session";
import { LogOut, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app", label: "Agent" },
  { href: "/app/profile", label: "Profile" },
];

function linkActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (user?.name || "P").charAt(0).toUpperCase();

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  async function signOut() {
    setMenu(false);
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Wordmark href="/app" size="sm" />
        <nav className="hidden items-center gap-0.5 rounded-full border border-border bg-subtle p-0.5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                linkActive(pathname, link.href) ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.hasAgent ? (
            <div className="hidden sm:block">
              <ShareButton handle={user.handle} />
            </div>
          ) : null}
          <ThemeToggle />
          <div className="relative hidden sm:block" ref={menuRef}>
            <button
              type="button"
              aria-expanded={menu}
              aria-haspopup="menu"
              onClick={() => setMenu((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full bg-btn text-[12px] font-semibold text-btn-fg"
            >
              {initial}
            </button>
            {menu ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
              >
                <p className="truncate px-2.5 py-2 text-[13px] font-semibold text-ink">{user?.name}</p>
                <p className="truncate px-2.5 pb-2 text-[12px] text-muted">{user?.email}</p>
                <Link
                  href="/app/settings"
                  role="menuitem"
                  onClick={() => setMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink hover:bg-subtle"
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink hover:bg-subtle"
                  onClick={() => void signOut()}
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="flex flex-col gap-1 border-t border-border bg-surface px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-[14px] font-medium ${
                linkActive(pathname, link.href) ? "bg-subtle text-ink" : "text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink"
          >
            Settings
          </Link>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-left text-[14px] font-medium text-ink"
            onClick={() => void signOut()}
          >
            Log out
          </button>
        </div>
      ) : null}
    </header>
  );
}
