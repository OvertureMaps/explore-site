import './globals.css';
import 'infima/dist/css/default/default.css';

export const metadata = {
  title: 'Overture Maps Explorer (Beta)',
  description: 'Explore Overture Maps Foundation geospatial data',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
