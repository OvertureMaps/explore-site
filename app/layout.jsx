import './globals.css';

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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=bug_report,docs,download_for_offline,find_replace,frame_inspect,globe_asia,my_location,zoom_in,zoom_out&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
