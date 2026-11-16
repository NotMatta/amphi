"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Home, LogOut, Settings, Shield, Users } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = user?.role === "ADMIN"
    ? [...baseNavItems, { href: "/admin", label: "Admin", icon: Shield, exact: false }]
    : baseNavItems;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="text-base">Amphi</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <Link href="/settings" className="hidden items-center gap-2 rounded-md border bg-card px-3 py-1.5 transition-colors hover:bg-accent/50 sm:flex" aria-label="Open settings">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{user.role}</p>
                </div>
              </Link>
              <Button variant="outline" size="icon" className="sm:hidden" asChild aria-label="Settings">
                <Link href="/settings"><Settings className="h-4 w-4" /></Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => { logout(); router.push("/"); router.refresh(); }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
              <Button size="sm" asChild><Link href="/register">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
      <nav
        aria-label="Primary mobile"
        className={cn(
          "grid gap-1 border-t px-2 py-2 md:hidden",
          navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:flex-row sm:text-sm",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
