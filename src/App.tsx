import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatIsTedx from './components/WhatIsTedx';
import AboutTed from './components/AboutTed';
import AboutEvent from './components/AboutEvent';
import Speakers from './components/Speakers';
import Schedule from './components/Schedule';
import Team from './components/Team';
import TicketPromo from './components/TicketPromo';
import CTA from './components/CTA';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import { Scanner } from './components/Scanner';
import { SeatPickerApp } from './components/SeatPickerApp';

export default function App() {
  const tgWebApp = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
  const tgStartParam = tgWebApp?.initDataUnsafe?.start_param || '';

  const href = typeof window !== 'undefined' ? window.location.href : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  const isScannerRoute =
    href.includes('scanner') ||
    path.includes('scanner') ||
    search.includes('scanner') ||
    hash.includes('scanner') ||
    tgStartParam.includes('scanner');

  const isSeatPickerRoute =
    href.includes('seat') ||
    href.includes('picker') ||
    path.includes('seat-picker') ||
    path.includes('tickets') ||
    path.includes('app') ||
    search.includes('seat-picker') ||
    search.includes('tickets') ||
    search.includes('app') ||
    tgStartParam.includes('seat') ||
    tgStartParam.includes('tickets') ||
    tgStartParam.includes('picker');

  if (isScannerRoute) {
    return (
      <ThemeProvider>
        <Scanner />
      </ThemeProvider>
    );
  }

  if (isSeatPickerRoute) {
    return (
      <ThemeProvider>
        <SeatPickerApp />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Navbar />
        <Hero />
        <WhatIsTedx />
        <AboutTed />
        <AboutEvent />
        <Speakers />
        <Schedule />
        <Team />
        <TicketPromo />
        <CTA />
        <Footer />
        <StickyCTA />
      </LanguageProvider>
    </ThemeProvider>
  );
}
