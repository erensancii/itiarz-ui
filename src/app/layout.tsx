import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";
import { ThemeRegistry } from "@/shared/theme/ThemeRegistry";

export const metadata = {
  title: "itiarz",
  description: "Chargeback itiraz dosyalarının ve kanıtlarının şirket bazında takibi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
