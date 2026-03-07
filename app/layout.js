export const metadata = {
  title: 'bligo',
  description: 'bligo site',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
