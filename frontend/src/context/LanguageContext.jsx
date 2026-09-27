import { createContext, useContext, useState } from 'react'
import { DICTIONARY } from '../lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('preferredLanguage') || 'en')

  function changeLanguage(code) {
    setLang(code)
    localStorage.setItem('preferredLanguage', code)
  }

  function t(key) {
    return DICTIONARY[lang]?.[key] ?? DICTIONARY.en[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
