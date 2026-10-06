/**
 * Internacionalização da interface (Tropeiro).
 *
 * O texto original em inglês é a própria chave: `t('Settings')`. Assim o diff
 * com o upstream fica mínimo e, se faltar tradução, aparece o inglês.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_UI_LANGUAGE } from '../../constants/tropeiro'
import ptBR from './locales/pt-BR.json'

i18n.use(initReactI18next).init({
  lng: DEFAULT_UI_LANGUAGE,
  fallbackLng: false,
  resources: {
    'pt-BR': { translation: ptBR },
  },
  // Chaves são frases em inglês, que podem conter ':' e '.'.
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

export default i18n
