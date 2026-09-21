import Link from "next/link";
import type { Profile } from "@/lib/types";

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
        <div className="logo">RS</div>
        <div>
          <h1>RenoSwap</h1>
          <span>Texas leftovers · swap first</span>
        </div>
      </Link>
      <nav className="nav">
        {link("/browse", "Browse")}
        {link("/post", "Post")}
        {profile ? link("/my-listings", "My listings") : null}
        {profile?.is_admin ? link("/admin", "Admin") : null}
        {profile ? link("/account", "Account") : link("/auth", "Sign in")}
      </nav>
    </header>
  );
}
