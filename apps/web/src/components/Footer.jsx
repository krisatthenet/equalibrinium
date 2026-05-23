import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook } from 'lucide-react';
const Footer = () => {
  const {
    t
  } = useTranslation();
  return <footer className="bg-card border-t border-border mt-auto flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.svg" alt="WorkBee Logo" className="h-10 w-10" />
              <span className="text-xl md:text-2xl font-bold text-primary leading-tight">WorkBee</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {t('home.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { src: '/team-tadas.jpeg', name: 'Tadas', role: 'Co-founder' },
                { src: '/team-kristupas.jpg', name: 'Kristupas', role: 'Co-founder' },
                { src: '/team-olek.jpeg', name: 'Olek Suchodolski', role: 'Mentor' },
                { src: '/team-brigita.jpeg', name: 'Brigita Suchodolska', role: 'Mentor' },
              ].map(({ src, name, role }) => (
                <div key={name} className="flex items-center gap-2">
                  <img src={src} alt={name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="font-semibold text-foreground mb-4 block">{t('footer.quick_links')}</span>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('header.home')}
              </Link>
              <Link to="/contractors" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('header.explore')}
              </Link>
              <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('header.register')}
              </Link>
            </nav>
          </div>

          <div>
            <span className="font-semibold text-foreground mb-4 block">{t('footer.legal')}</span>
            <nav className="flex flex-col gap-2">
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('footer.privacy')}
              </Link>
              <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                Cookie Policy
              </Link>
              <Link to="/gdpr" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                GDPR Policy
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
                {t('footer.contact')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} WorkBee. {t('footer.rights')}
          </p>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">{t('footer.follow_us')}</span>
            <a href="https://www.facebook.com/profile.php?id=61579670221542" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      
      <a href="https://www.globalgiving.org/projects/ukraine-crisis-relief-fund/" target="_blank" rel="noopener noreferrer" className="w-full bg-[#0057B8] text-[#FFD700] text-center py-2.5 text-sm font-medium hover:bg-[#004a9e] hover:underline transition-all duration-200">
        🇺🇦 Slava Ukraini
      </a>
    </footer>;
};
export default Footer;