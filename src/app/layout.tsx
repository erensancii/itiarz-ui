import "./style.css";

export const metadata = {
  title: "itiarz",
  description: "Chargeback itiraz dosyalarının ve kanıtlarının şirket bazında takibi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
