import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n/useT.js';
import { lockScroll, unlockScroll } from '../../lib/scroll/lenis.js';
import { Picture, media } from './Img.jsx';
import Caption from '../ui/Caption.jsx';
import { ArrowLeft, ArrowRight, Close } from '../ui/Icons.jsx';
import './Lightbox.css';

/**
 * Full-screen image viewer: a dialog with previous / next (buttons, arrow keys, swipe), Esc to close,
 * a focus trap, and focus returned to the thumbnail that opened it.
 *  - ids:     the images in order
 *  - index:   which one is open, or null when closed
 *  - onIndex: (nextIndex | null) => void
 */
export default function Lightbox({ ids, index, onIndex }) {
  const { t } = useT();
  const ref = useRef(null);
  const closeRef = useRef(null);
  const opener = useRef(null);
  const touch = useRef(null);
  const open = index !== null && index !== undefined;

  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    lockScroll();
    closeRef.current?.focus();
    return () => {
      unlockScroll();
      opener.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const step = (d) => onIndex((index + d + ids.length) % ids.length);
    const onKey = (e) => {
      if (e.key === 'Escape') onIndex(null);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') {
        const items = ref.current.querySelectorAll('button');
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, ids.length, onIndex]);

  if (!open) return null;
  const id = ids[index];
  const entry = media(id);
  const step = (d) => onIndex((index + d + ids.length) % ids.length);

  return createPortal(
    <div
      ref={ref}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('projects.viewer.label')}
      onClick={(e) => e.target === e.currentTarget && onIndex(null)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lightbox__bar">
        <span className="lightbox__count nums" aria-live="polite">
          {index + 1} / {ids.length}
        </span>
        <button ref={closeRef} type="button" className="lightbox__btn" onClick={() => onIndex(null)}>
          <span className="sr-only">{t('projects.viewer.close')}</span>
          <Close />
        </button>
      </div>
      <figure className="lightbox__figure" key={id}>
        {/* never upscaled: the image is capped at its own pixel width */}
        <Picture
          id={id}
          sizes="(min-width: 821px) 86vw, 100vw"
          className="lightbox__picture"
          style={{ maxWidth: `${entry.width}px`, aspectRatio: `${entry.width} / ${entry.height}` }}
        />
        <Caption id={id} onPhoto className="lightbox__caption" />
      </figure>
      <div className="lightbox__nav">
        <button type="button" className="lightbox__btn" onClick={() => step(-1)}>
          <span className="sr-only">{t('projects.viewer.prev')}</span>
          <ArrowLeft />
        </button>
        <button type="button" className="lightbox__btn" onClick={() => step(1)}>
          <span className="sr-only">{t('projects.viewer.next')}</span>
          <ArrowRight />
        </button>
      </div>
    </div>,
    document.body,
  );
}
