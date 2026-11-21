// The full portfolio (/portofolio/): the 3D story, the Maxone walkthrough, the padel hall and beyond stays
// (U01_04). Only this page loads those scenes.
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/typography.css';
import './styles/utilities.css';
import SiteShell from './SiteShell.jsx';
import Portfolio from './pages/Portfolio.jsx';
import { ensureDict, initialLang } from './i18n/I18nProvider.jsx';

ensureDict(initialLang())
  .catch(() => undefined)
  .then(() =>
    createRoot(document.getElementById('root')).render(
      <SiteShell page="portfolio">
        <Portfolio />
      </SiteShell>,
    ),
  );
