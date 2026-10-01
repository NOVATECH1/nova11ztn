import type { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Header } from './components/header';

const font = DM_Sans({ subsets: ['latin'], display: 'swap' });
const themeScript = "try{var t=localStorage.getItem('ztn-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}";

export const metadata = {
  title: 'ZTN Store & Marketplace',
  description: 'BUY • SELL • DISCOVER • GROW',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={font.className}>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <div><strong>ZTN Store & Marketplace</strong><div className="muted">BUY • SELL • DISCOVER • GROW</div></div>
            <div className="muted">© ZTN</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
