// The main page (/): hero and lead funnel, what HOMYVEST is, how it works, Behomy, projects, the land check,
// what happens next and the FAQ (U01_01 §2).
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/typography.css';
import './styles/utilities.css';
import SiteShell from './SiteShell.jsx';
import Home from './pages/Home.jsx';
import { ensureDict, initialLang } from './i18n/I18nProvider.jsx';

// English is in this bundle; Indonesian is fetched first when it is the visitor's language.
ensureDict(initialLang())
  .catch(() => undefined)
  .then(() =>
    createRoot(document.getElementById('root')).render(
      <SiteShell page="home">
        <Home />
      </SiteShell>,
    ),
  );
