import React from 'react'
import ReactDOM from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { AvatarProvider } from './contexts/AvatarContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import './index.css'

import enTranslation from './locales/en/translation.json'
import zhTranslation from './locales/zh/translation.json'
import frTranslation from './locales/fr/translation.json'
import jaTranslation from './locales/ja/translation.json'
import koTranslation from './locales/ko/translation.json'
import deTranslation from './locales/de/translation.json'
import esTranslation from './locales/es/translation.json'
import itTranslation from './locales/it/translation.json'

// Detect browser language
const browserLang = navigator.language.split('-')[0];
const supported = ['en', 'zh', 'fr', 'ja', 'ko', 'de', 'es', 'it'];
const detectedLang = supported.includes(browserLang) ? browserLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    zh: { translation: zhTranslation },
    fr: { translation: frTranslation },
    ja: { translation: jaTranslation },
    ko: { translation: koTranslation },
    de: { translation: deTranslation },
    es: { translation: esTranslation },
    it: { translation: itTranslation },
  },
  lng: localStorage.getItem('chroniq-cc-lang') ?? detectedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AvatarProvider>
            <App />
          </AvatarProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
