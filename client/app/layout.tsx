"use client";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { SessionProvider } from "next-auth/react";
import { Cedarville_Cursive, Josefin_Sans, Poppins } from "next/font/google";
import React, { FC, ReactNode, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import socketIO from "socket.io-client";
import Loader from "./components/Loader/Loader";
import "./globals.css";
import { Providers } from "./Provider";
import { ThemeProvider } from "./utils/theme-provider";
const ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_SERVER_URI || "";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-Poppins",
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-Josefin",
});

const cursive = Cedarville_Cursive({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-Cursive",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${josefin.variable} ${cursive.variable} !bg-white bg-no-repeat dark:bg-gradient-to-b dark:from-gray-900 dark:to-black duration-300`}
      >
        <Providers>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Custom>{children}</Custom>
              <Toaster position="top-center" reverseOrder={false} />
            </ThemeProvider>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}

const Custom: FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoading } = useLoadUserQuery({});

  useEffect(() => {
    if (!ENDPOINT) return;
    // create socket only when ENDPOINT is provided
    const socket = socketIO(ENDPOINT, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      // optional: console.debug("socket connected:", socket.id);
    });

    // example: listen for server notifications if you need
    socket.on("newNotification", (data) => {
      // handle notification (optional)
    });

    return () => {
      socket.off("connect");
      socket.off("newNotification");
      socket.disconnect();
    };
  }, []);

  return <>{isLoading ? <Loader /> : <>{children}</>}</>;
};
