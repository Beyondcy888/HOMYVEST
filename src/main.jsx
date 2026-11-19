import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/typography.css';
import './styles/utilities.css';
import App from './App.jsx';
import { ensureDict, initialLang } from './i18n/I18nProvider.jsx';

// English is in this bundle; Indonesian is fetched first when it is the visitor's language.
ensureDict(initialLang())
  .catch(() => undefined)
  .then(() => createRoot(document.getElementById('root')).render(<App />));
