import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Matchmelo — A little more meaningful.',description:'A calmer beginning to a real connection. Meet Matchmelo, explore the experience, and create your private Digital Passport.',icons:{icon:'/assets/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet"/></head><body>{children}</body></html>;}
