import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatIsTedx from './components/WhatIsTedx';
import AboutEvent from './components/AboutEvent';
import Speakers from './components/Speakers';
import Schedule from './components/Schedule';
import Team from './components/Team';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Navbar />
        <Hero />
        <WhatIsTedx />
        <AboutEvent />
        <Speakers />
        <Schedule />
        <Team />
        <CTA />
        <Footer />
      </LanguageProvider>
    </ThemeProvider>
  );
}
