import "./globals.css";

export const metadata = {
  title: "BookWise",
  description: "Scheduling, simplified.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
