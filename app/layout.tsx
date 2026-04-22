import "./globals.css";
import { AppDataProvider } from "@/components/providers/AppDataProvider";

export const metadata = {
  title: "Ashara",
  description: "Live with the Qur’an",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#ece8e1] text-neutral-900 antialiased">
        <AppDataProvider>
          <div className="flex min-h-screen justify-center">
            <div className="min-h-screen w-full max-w-[430px] bg-[#f7f4ee] shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
              {children}
            </div>
          </div>
        </AppDataProvider>
      </body>
    </html>
  );
}