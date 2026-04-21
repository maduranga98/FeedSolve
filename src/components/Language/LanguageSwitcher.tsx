import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { applyTextDirection } from '../../lib/rtl';

type Language = 'en' | 'si' | 'ta' | 'ar' | 'hi';

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === (i18n.language as Language));

  const handleLanguageChange = (langCode: Language) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('feedsolve_language', langCode);
    applyTextDirection(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <span>{currentLang?.flag}</span>
        <span>{currentLang?.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-48 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                currentLang?.code === lang.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang?.code === lang.code && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
