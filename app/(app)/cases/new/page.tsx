import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "../../../../lib/me";
import { requireMe } from "../../../../lib/server-api";
import { ProblemMessage } from "../../../components/ProblemMessage";
import { NewCaseForm } from "./NewCaseForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Yeni itiraz | itiarz" };

export default async function NewCasePage() {
  const result = await requireMe();
  if (!result.ok) return <ProblemMessage problem={result.problem} />;
  if (!result.me.activeTenant) redirect("/select-tenant");
  return (
    <>
      <p className="back"><Link href="/cases">İtiraz listesine dön</Link></p>
      <div className="page-head"><h1>Yeni itiraz</h1></div>
      {can(result.me, "case:write") ? (
        <NewCaseForm />
      ) : (
        <ProblemMessage problem={{ status: 403,
          detail: "Yeni itiraz eklemek için Analist veya üstü bir rol gerekiyor. Şirket yöneticinizden yetki isteyin." }} />
      )}
    </>
  );
}
