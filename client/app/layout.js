// app/layout.js
import "./globals.css";
import { ClientWrapper } from "./client-wrapper.js";

export const metadata = {
  title: "Think : Social Decision Journal",
  description: "Make better decisions with community insights",
  generator: "v0.app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans bg-[#0d0d0d] text-white antialiased`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}