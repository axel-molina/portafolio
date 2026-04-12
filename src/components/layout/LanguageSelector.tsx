'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/client';
import { Globe } from 'lucide-react';
import './LanguageSelector.css';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);

  useEffect(() => {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      const lang = languages.find(l => l.code === stored);
      if (lang) setCurrentLang(lang);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    const lang = languages.find(l => l.code === langCode);
    if (lang) setCurrentLang(lang);
    setIsOpen(false);
  };

  return (
    <div className="language-selector">
      <button 
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe size={18} />
        <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === currentLang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}