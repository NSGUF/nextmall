import "@/styles/globals.css";

import { type Metadata } from "next";
import { Provider } from "./provider";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: process.env.TITLE,
  description: process.env.DESCRIPTION,
  icons: [{ rel: "icon", url: "/logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // 这里是为了解决chakra-ui的color-scheme问题 请勿删
    <html lang="en" style={{ colorScheme: "light" }} className="light">
      <body>
        <Provider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Provider>
      </body>
    </html>
  );
}
