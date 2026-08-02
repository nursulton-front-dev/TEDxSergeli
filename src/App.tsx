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

export default function App() {
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
