import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="itiarz ana sayfa">
      <span className="brand-mark" aria-hidden="true">i</span>
      <span className="brand-name">itiarz</span>
    </Link>
  );
}

export function LogoutButton() {
  return (
    <form method="post" action="/auth/logout">
      <button type="submit" className="btn btn-quiet">Çıkış yap</button>
    </form>
  );
}
