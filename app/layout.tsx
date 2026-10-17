import "./style.css";
export const metadata = {
  title: "itiarz | İtiraz Operasyonu",
  description: "Bağımsız chargeback dosyası ve kanıt takip prototipi"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
