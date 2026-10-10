import type { ReactNode } from 'react';

interface Base {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
}

function Wrap({ id, label, hint, required, error, children }: Base & { children: ReactNode }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="error-text" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

const describedBy = (b: Base) => (b.error ? `${b.id}-error` : b.hint ? `${b.id}-hint` : undefined);

export function TextField(p: Base & { value: string; onChange: (v: string) => void; type?: string; maxLength?: number; placeholder?: string }) {
  return (
    <Wrap {...p}>
      <input
        id={p.id}
        type={p.type ?? 'text'}
        value={p.value}
        maxLength={p.maxLength}
        placeholder={p.placeholder}
        required={p.required}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={describedBy(p)}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </Wrap>
  );
}

export function TextArea(p: Base & { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; placeholder?: string }) {
  return (
    <Wrap {...p}>
      <textarea
        id={p.id}
        value={p.value}
        rows={p.rows ?? 3}
        maxLength={p.maxLength}
        placeholder={p.placeholder}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={describedBy(p)}
        onChange={(e) => p.onChange(e.target.value)}
      />
      {p.maxLength && p.value.length > p.maxLength * 0.8 && (
        <p className="count">{p.value.length} / {p.maxLength}</p>
      )}
    </Wrap>
  );
}

/** Numeric input that keeps `null` for an empty field instead of guessing 0. */
export function NumberField(p: Base & { value: number | null; onChange: (v: number | null) => void; prefix?: string; step?: string; min?: number }) {
  return (
    <Wrap {...p}>
      <div className={p.prefix ? 'with-prefix' : undefined}>
        {p.prefix && <span className="prefix" aria-hidden="true">{p.prefix}</span>}
        <input
          id={p.id}
          type="number"
          inputMode="decimal"
          step={p.step ?? 'any'}
          min={p.min}
          value={p.value ?? ''}
          aria-invalid={p.error ? true : undefined}
          aria-describedby={describedBy(p)}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const n = raw === '' ? null : Number(raw);
            p.onChange(n === null || Number.isFinite(n) ? n : null);
          }}
        />
      </div>
    </Wrap>
  );
}

export function Section({ title, id, children, open = true, summary }: { title: string; id: string; children: ReactNode; open?: boolean; summary?: string }) {
  return (
    <details className="section" id={id} open={open}>
      <summary>
        <span>{title}</span>
        {summary && <span className="section-summary">{summary}</span>}
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}
