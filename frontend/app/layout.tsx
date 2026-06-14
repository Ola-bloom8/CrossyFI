import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postcard — Cross-Chain Payments",
  description: "Send USDC across chains and mint a generative NFT postcard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1b23",
                color: "#f4f4f8",
                border: "1px solid #2a2b36",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
