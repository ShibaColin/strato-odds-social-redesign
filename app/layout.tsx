import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'STRATO Newsdesk — Markets, Metals & Global News',description:'A live financial news terminal. Crypto, stocks, commodities and geopolitics, connected to the STRATO hard asset economy.',icons:{icon:'/strato-mark.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" data-theme="dark"><body>{children}</body></html>}
