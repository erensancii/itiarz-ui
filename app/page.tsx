"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Evidence = { id: string; kind: string; note: string; createdUtc: string };
type Case = {
  id: string; provider: string; providerCaseId: string; orderId: string;
  reason: string; amount: number; currency: string; deadlineUtc: string;
  status: string; missing: string[]; evidence: Evidence[]
};
const reasonLabels: Record<string,string> = {
  NotReceived: "Ürün ulaşmadı", Fraud: "Yetkisiz işlem", Duplicate: "Mükerrer işlem",
  Cancelled: "İptal itirazı", Other: "Diğer"
};
const evidenceLabels: Record<string,string> = {
  PaymentRecord: "Ödeme dekontu", OrderConfirmation: "Sipariş onayı",
  DeliveryProof: "Teslimat kanıtı", "3DSRecord": "3D Secure kaydı",
  CustomerCommunication: "Müşteri yazışması", RefundRecord: "İade kaydı",
  CancellationPolicy: "İptal koşulları"
};
const allKinds = Object.keys(evidenceLabels);

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newCase, setNewCase] = useState(false);
  const [kind, setKind] = useState("PaymentRecord");
  const [note, setNote] = useState("");
  const active = useMemo(() => cases.find(c => c.id === selected), [cases,selected]);
  const money = (v:number,c:string) => new Intl.NumberFormat("tr-TR", { style:"currency", currency:c }).format(v);
  async function refresh() {
    const r = await fetch(`/api/proxy/cases`, {cache:"no-store"});
    if (!r.ok) throw new Error("API yanıt vermedi");
    const list:Case[] = await r.json(); setCases(list);
    setSelected(prev => list.some(x => x.id === prev) ? prev : (list[0]?.id ?? ""));
  }
  useEffect(() => { refresh().catch(e=>setError(String(e))); },[]);
  async function mutate(url:string, method:string, body:unknown): Promise<boolean> {
    setBusy(true);setError("");
    try {
      const r = await fetch(`${url}`, { method,
        headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error ?? `${r.status} hata`); }
      await refresh();
      return true;
    } catch(e) { setError(e instanceof Error ? e.message:String(e)); return false; }
    finally {setBusy(false);}
  }
  async function createCase(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = new Date(String(fd.get("deadline")));
    const ok = await mutate("/api/proxy/cases","POST", {
      provider:fd.get("provider"),providerCaseId:fd.get("providerCaseId"),
      orderId:fd.get("orderId"),reason:fd.get("reason"),
      amount:Number(fd.get("amount")),currency:"TRY",deadlineUtc:date.toISOString()
    });
    if (ok) setNewCase(false);
  }
  const urgent = cases.filter(x=> !["Submitted","Won","Lost"].includes(x.status) && new Date(x.deadlineUtc).getTime() < Date.now() + 2*86400000).length;
  const unresolved = cases.filter(x=>!["Won","Lost"].includes(x.status)).length;
  return <main className="layout">
    <aside className="sidebar">
      <div className="brand"><span className="brandlogo">D</span><div>itiarz<small>Merchant Operations</small></div></div>
      <div className="nav activeNav">İtiraz dosyaları <span>{cases.length}</span></div>
      <div className="nav">Kanıt kontrolü (dosya içinde)</div><div className="nav">Analitik (sonraki sürüm)</div>
      <div className="asidefoot">YEREL DEMO<br/><b>Gerçek banka entegrasyonu yok</b></div>
    </aside>
    <div className="content">
      <header className="top"><div><div className="eyebrow">OPERASYON / CHARGEBACK</div><h1>İtiraz kontrol merkezi</h1><p>Farklı sağlayıcıların itirazları, tek ekranda.</p></div><button onClick={()=>setNewCase(true)}>+ Yeni itiraz</button></header>
      {error && <p className="alert">{error}</p>}
      <section className="metrics">
        <div className="metric"><div>Açık / devam eden</div><strong>{unresolved}</strong><small>Toplam aktif dosya</small></div>
        <div className="metric"><div>48 saat içinde son tarih</div><strong>{urgent}</strong><small>Takip gerektiren dosya</small></div>
        <div className="metric"><div>İtiraz edilen toplam</div><strong>{money(cases.reduce((s,c)=>s+(c.currency==="TRY"?c.amount:0),0),"TRY")}</strong><small>Yalnızca TRY toplamı</small></div>
      </section>
      <section className="workspace">
        <div className="caseList"><div className="panelhead">İtiraz kuyruğu <span>En yakın son tarih önce</span></div>
          {cases.map(c=><button key={c.id} className={`caseitem ${selected===c.id?"chosen":""}`} onClick={()=>setSelected(c.id)}>
            <div className="casetop"><b>{c.providerCaseId}</b><span className="status">{c.status}</span></div>
            <div className="subtitle">{c.provider} • {c.orderId}</div>
            <div className="casebottom"><span>{reasonLabels[c.reason]}</span><strong>{money(c.amount,c.currency)}</strong></div>
            <div className="date">Son: {new Date(c.deadlineUtc).toLocaleString("tr-TR")}</div>
          </button>)}
        </div>
        <div className="details">
          {!active ? <div>Henüz itiraz yok.</div>:<>
            <div className="panelhead">Dosya: {active.providerCaseId} <span>{active.status}</span></div>
            <div className="detailline"><span>Sağlayıcı</span><b>{active.provider}</b></div>
            <div className="detailline"><span>Sipariş</span><b>{active.orderId}</b></div>
            <div className="detailline"><span>İtiraz gerekçesi</span><b>{reasonLabels[active.reason]}</b></div>
            <div className="detailline"><span>Son tarih (sağlayıcı beyanı)</span><b>{new Date(active.deadlineUtc).toLocaleString("tr-TR")}</b></div>
            <h3>Gerekli kanıt kontrolü</h3>
            <p className="muted">Bu kontrol listesi demo amaçlıdır. Gerçek delil koşulları sağlayıcıya ve reason code&apos;a göre doğrulanmalıdır.</p>
            {[...new Set([...active.missing,...active.evidence.map(x=>x.kind)])].map(e=><div className="proof" key={e}><span className={active.missing.includes(e)?"pending":"complete"}>{active.missing.includes(e)?"○":"✓"}</span>{evidenceLabels[e] ?? e}</div>)}
            <h3>Kanıt kaydı ekle</h3><div className="evidenceform">
              <select value={kind} onChange={e=>setKind(e.target.value)}>{allKinds.map(k=><option value={k} key={k}>{evidenceLabels[k]}</option>)}</select>
              <input placeholder="Kanıtın referans kodu (kişisel veri yazmayın)" value={note} onChange={e=>setNote(e.target.value)} maxLength={500}/>
              <button disabled={busy || ["Submitted","Won","Lost"].includes(active.status)} onClick={async ()=>{if (await mutate(`/api/proxy/cases/${active.id}/evidence`,"POST",{kind,note})) setNote("");}}>Kaydet</button>
            </div>
            <div className="actions">
              <button className="ghost" disabled={busy||active.missing.length>0||!["Open","InProgress"].includes(active.status)} onClick={()=>mutate(`/api/proxy/cases/${active.id}/status`,"PATCH",{status:"Ready"})}>Kanıtlar hazır</button>
              <button disabled={busy||active.status!=="Ready"} onClick={()=>mutate(`/api/proxy/cases/${active.id}/status`,"PATCH",{status:"Submitted"})}>Dışarı gönderildi olarak işaretle</button>
            </div>
          </>}
        </div>
      </section>
    </div>
    {newCase && <div className="overlay"><form className="modal" onSubmit={createCase}>
      <div className="panelhead">Yeni itiraz <button className="close" type="button" onClick={()=>setNewCase(false)}>×</button></div>
      <label>Ödeme sağlayıcısı<input name="provider" required maxLength={80} placeholder="Örn. Banka A"/></label>
      <label>İtiraz numarası<input name="providerCaseId" required maxLength={80} placeholder="CB-..."/></label>
      <label>Sipariş numarası<input name="orderId" required maxLength={80}/></label>
      <label>İtiraz türü<select name="reason">{Object.entries(reasonLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>Tutar (TL)<input name="amount" type="number" min="0.01" step="0.01" required/></label>
      <label>Sağlayıcının bildirdiği son tarih<input name="deadline" type="datetime-local" required/></label>
      <button type="submit" disabled={busy}>İtiraz oluştur</button>
    </form></div>}
  </main>;
}
