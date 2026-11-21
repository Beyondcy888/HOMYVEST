// Mounts the funnel panel. The panel's code is a separate chunk, fetched when the phone field is first focused
// (or on "Continue"), so it never weighs on the first load. Once opened it stays mounted, so it can animate out.
import { Suspense, lazy, useEffect, useState } from 'react';
import { useFunnel } from './useFunnelStore.js';

let panelPromise = null;
export const loadPanel = () => {
  panelPromise ??= import('./FunnelPanel.jsx').catch((e) => {
    panelPromise = null;
    throw e;
  });
  return panelPromise;
};
const FunnelPanel = lazy(loadPanel);

export default function FunnelHost() {
  const open = useFunnel((s) => s.open);
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <FunnelPanel />
    </Suspense>
  );
}
