import './globals.css';
import 'infima/dist/css/default/default.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata = {
  title: 'Overture Maps Explorer (Beta)',
  description: 'Explore Overture Maps Foundation geospatial data',
  icons: {
    icon: `${basePath}/favicon.png`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
