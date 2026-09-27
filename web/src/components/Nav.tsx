import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

export function Nav({
  profile,
  pathname,
}: {
  profile: Profile | null;
  pathname?: string;
}) {
  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "active" : undefined}>
      {label}
    </Link>
  );

  return (
    <header className="topbar">
      <Link href="/browse" className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="logo-img"
          src="/logo-64.png"
          alt="RenoSwap logo"
          width={32}
          height={32}
        />
        <div>
          <h1>RenoSwap</h1>
          <span>Texas leftovers · swap first</span>
        </div>
      </Link>
      <nav className="nav">
        {link("/browse", "Browse")}
        {link("/post", "Post")}
        {profile ? link("/my-listings", "My listings") : null}
        {profile ? link("/inbox", "Inbox") : null}
        {profile ? link("/billing", "Billing") : null}
        {profile?.is_admin ? link("/admin", "Admin") : null}
        {profile ? (
          <Link
            href="/account"
            className={`nav-account${pathname === "/account" ? " active" : ""}`}
            aria-label="Account"
          >
            <Avatar url={profile.avatar_url} name={profile.display_name} size="sm" />
            <span>Account</span>
          </Link>
        ) : (
          link("/auth", "Sign in")
        )}
      </nav>
    </header>
  );
}
