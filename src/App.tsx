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
  const isScannerRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/scanner' || window.location.search.includes('scanner'));

  const isSeatPickerRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/seat-picker' || window.location.search.includes('seat-picker'));

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
