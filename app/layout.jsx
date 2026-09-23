import './globals.css';

export const metadata = {
  title: 'peard 🍐 - Find Your Pear-fect Match',
  description: 'Speed dating scavenger hunt app',
  manifest: '/manifest.json',
  themeColor: '#ef6c82',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  icons: {
    icon: '🍐'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#ef6c82" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="peard" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `tailwind.config = {
            theme: {
              extend: {
                fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
                colors: {
                  'app-bg': '#f8f7f5', 'app-card': '#ffffff',
                  'app-pink': '#ef6c82', 'app-pink-hover': '#d95369',
                  'app-yellow': '#fef0b3', 'app-yellow-dark': '#d4a017',
                  'app-text': '#1d1d1f', 'app-muted': '#6e6e73',
                },
                boxShadow: {
                  'soft': '0 10px 30px rgba(0,0,0,0.05)',
                  'glow': '0 4px 20px rgba(239,108,130,0.25)',
                }
              }
            }
          }` }} />
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* Font Awesome */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
        
        <style>{`
          body {
            background-color: #f8f7f5;
            color: #1d1d1f;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-image: 
              radial-gradient(circle at 15% 15%, rgba(254, 240, 179, 0.35) 0%, transparent 45%),
              radial-gradient(circle at 85% 75%, rgba(239, 108, 130, 0.18) 0%, transparent 45%);
            background-attachment: fixed;
            -webkit-tap-highlight-color: transparent;
          }
          * {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
