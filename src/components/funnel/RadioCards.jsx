/**
 * Large single-choice rows: a native radio group with a custom circle (U01_02 §4, §6).
 *
 *  - name:       field key; ids are f-<name>-<i>
 *  - legend:     the group's name (visually hidden when the step title already asks the question)
 *  - options:    [{ value, label }]
 *  - value, onChange(value)
 *  - onActivate: optional (value) => void on double-click or Enter: select and continue
 *  - error:      message, or ''
 *  - other:      { value, onChange, label, placeholder, error, maxLength } for "other"
 */
export default function RadioCards({ name, legend, legendHidden = false, describedBy, options, value, onChange, onActivate, error, other }) {
  const errId = `f-${name}-err`;
  const described = [describedBy, error ? errId : null].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className="ffield" aria-describedby={described} data-invalid={error ? true : undefined}>
      <legend className={legendHidden ? 'sr-only' : 'ffield__label'}>{legend}</legend>
      <div className="rcards">
        {options.map((o, i) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className="rcard"
              data-on={on || undefined}
              onDoubleClick={onActivate ? () => onActivate(o.value) : undefined}
            >
              <input
                id={`f-${name}-${i}`}
                className="rcard__input"
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                onKeyDown={
                  onActivate
                    ? (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onActivate(o.value);
                        }
                      }
                    : undefined
                }
                aria-invalid={error ? 'true' : undefined}
              />
              <span className="rcard__dot" aria-hidden="true" />
              <span className="rcard__label">{o.label}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errId} className="ffield__error">
          {error}
        </p>
      ) : null}
      {other && value === 'other' ? (
        <div className="ffield__other">
          <input
            id={`f-${name}-other`}
            className="ftext"
            type="text"
            value={other.value}
            onChange={(e) => other.onChange(e.target.value)}
            placeholder={other.placeholder}
            aria-label={other.label}
            maxLength={other.maxLength ?? 200}
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
