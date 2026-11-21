import { Check } from '../ui/Icons.jsx';

/**
 * A multi-select group of chips: real checkboxes, styled (U01_02 §5). One <fieldset> with a <legend>.
 * Choosing "other" reveals a short text field, required while "other" is chosen.
 *
 *  - name:      field key ('owned' | 'build' | 'cities'); ids are f-<name>-<i>
 *  - legend, help
 *  - options:   [{ value, label }]
 *  - value:     selected values (array)
 *  - onChange:  (nextArray) => void
 *  - other:     { value, onChange, label, placeholder, error } for the "other" text field
 *  - error:     message for the group, or ''
 */
export default function Chips({ name, legend, help, options, value, onChange, other, error }) {
  const helpId = `f-${name}-help`;
  const errId = `f-${name}-err`;
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const otherOn = value.includes('other');
  return (
    <fieldset className="ffield" aria-describedby={[help ? helpId : null, error ? errId : null].filter(Boolean).join(' ') || undefined} data-invalid={error ? true : undefined}>
      <legend className="ffield__label">{legend}</legend>
      {help ? (
        <p id={helpId} className="ffield__help">
          {help}
        </p>
      ) : null}
      <div className="fchips">
        {options.map((o, i) => {
          const on = value.includes(o.value);
          return (
            <label key={o.value} className="fchip" data-on={on || undefined}>
              <input
                id={`f-${name}-${i}`}
                className="fchip__input"
                type="checkbox"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => toggle(o.value)}
                aria-invalid={error ? 'true' : undefined}
              />
              <span className="fchip__label">{o.label}</span>
              <span className="fchip__check" aria-hidden="true">
                <Check />
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errId} className="ffield__error">
          {error}
        </p>
      ) : null}
      {other && otherOn ? (
        <div className="ffield__other">
          <input
            id={`f-${name}-other`}
            className="ftext"
            type="text"
            value={other.value}
            onChange={(e) => other.onChange(e.target.value)}
            placeholder={other.placeholder}
            aria-label={other.label}
            maxLength={other.maxLength ?? 120}
            aria-invalid={other.error ? 'true' : undefined}
            aria-describedby={other.error ? `f-${name}-other-err` : undefined}
          />
          {other.error ? (
            <p id={`f-${name}-other-err`} className="ffield__error">
              {other.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
