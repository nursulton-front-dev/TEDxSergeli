import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatIsTedx from './components/WhatIsTedx';
import AboutEvent from './components/AboutEvent';
import Speakers from './components/Speakers';
import Schedule from './components/Schedule';
import Team from './components/Team';
import Sponsors from './components/Sponsors';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <LanguageProvider>
      <Navbar />
      <Hero />
      <WhatIsTedx />
      <AboutEvent />
      <Speakers />
      <Schedule />
      <Team />
      <Sponsors />
      <CTA />
      <Footer />
    </LanguageProvider>
  );
}
