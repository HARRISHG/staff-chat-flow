import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProposalData } from './types';
import { createEmptyProposal, createSampleProposal } from './data/defaults';
import { proposalFilename, slugify } from './lib/format';
import { parseProposalJson, serialiseProposal } from './lib/storage';
import { proposalWarnings, validateProposal, type ValidationIssue } from './lib/validate';
import { buildDeck } from './slides/build';
import { canvasMeasure } from './slides/measure';
import { SlideView } from './slides/SlideView';
import { ProposalForm } from './components/ProposalForm';
import { Preview } from './components/Preview';

const LOGO_URL = `${import.meta.env.BASE_URL}brand/patientcurve-logo.png`;

type Status = { kind: 'idle' } | { kind: 'busy'; text: string } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  let parent = el.parentElement;
  while (parent) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
    parent = parent.parentElement;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el as HTMLElement).focus({ preventScroll: true });
}

export default function App() {
  const [data, setData] = useState<ProposalData>(() => createEmptyProposal());
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [page, setPage] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const measure = useMemo(() => canvasMeasure(), []);
  const deck = useMemo(() => buildDeck(data, measure), [data, measure]);

  const update = useCallback((recipe: (d: ProposalData) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      return next;
    });
    setStatus((s) => (s.kind === 'ok' || s.kind === 'error' ? { kind: 'idle' } : s));
  }, []);

  const isSample = data.meta.reference.trim().toUpperCase().startsWith('SAMPLE');

  // Live errors only after the founder has tried to export once.
  const liveIssues = useMemo(() => {
    if (!issues.length) return [];
    return [
      ...validateProposal(data),
      ...deck.overflows.map((o) => ({ field: o.field, message: `${o.label} is too long to fit on slide ${o.slide}. Shorten it.` })),
    ];
  }, [issues.length, data, deck.overflows]);
  const errorMap = useMemo(() => Object.fromEntries([...liveIssues].reverse().map((i) => [i.field, i.message])), [liveIssues]);

  const check = (): boolean => {
    const found = [
      ...validateProposal(data),
      ...deck.overflows.map((o) => ({ field: o.field, message: `${o.label} is too long to fit on slide ${o.slide}. Shorten it.` })),
    ];
    setIssues(found);
    if (found.length) {
      setStatus({ kind: 'error', text: `Fix ${found.length === 1 ? '1 item' : `${found.length} items`} before exporting.` });
      focusField(found[0].field);
      return false;
    }
    return true;
  };

  const generate = async () => {
    if (status.kind === 'busy' || !check()) return;
    const fileName = proposalFilename(data.clinic.name, data.meta.date);
    setStatus({ kind: 'busy', text: 'Generating PowerPoint…' });
    try {
      const { exportPptx, loadLogoDataUri } = await import('./slides/exportPptx');
      const logo = await loadLogoDataUri(LOGO_URL);
      await exportPptx(deck, {
        title: `Patient journey automation proposal for ${data.clinic.name.trim()}`,
        author: data.provider.contactName.trim() || data.provider.name.trim(),
        company: data.provider.name.trim(),
        fileName,
        logoDataUri: logo,
      });
      const warnings = proposalWarnings(data);
      setStatus({ kind: 'ok', text: `Downloaded ${fileName}.${warnings.length ? ` Note: ${warnings.join(' ')}` : ''}` });
    } catch (err) {
      setStatus({ kind: 'error', text: `The PowerPoint could not be generated. ${err instanceof Error ? err.message : ''}`.trim() });
    }
  };

  const print = () => {
    if (!check()) return;
    setStatus({ kind: 'idle' });
    window.print();
  };

  const replace = (next: ProposalData, message: string) => {
    setData(next);
    setIssues([]);
    setPage(0);
    setFormKey((k) => k + 1);
    setStatus({ kind: 'ok', text: message });
  };

  const saveJson = () => {
    try {
      const blob = new Blob([serialiseProposal(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Patientcurve-Proposal-${slugify(data.clinic.name)}-${data.meta.date || 'undated'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ kind: 'ok', text: 'Proposal form saved as JSON.' });
    } catch {
      setStatus({ kind: 'error', text: 'The JSON file could not be saved.' });
    }
  };

  const openJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      replace(parseProposalJson(await file.text()), `Loaded ${file.name}.`);
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'That file could not be opened.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const busy = status.kind === 'busy';

  return (
    <>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <img src={LOGO_URL} alt="Patientcurve" height={22} />
            <span className="brand-sub">Proposal generator</span>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => replace(createSampleProposal(), 'Sample proposal loaded. All clinic data is fictional.')}>
              Load Sample Proposal
            </button>
            <button type="button" className="secondary" onClick={() => {
              if (window.confirm('Start a new proposal? Unsaved changes will be lost.')) replace(createEmptyProposal(), 'New proposal started.');
            }}>New</button>
            <button type="button" className="secondary" onClick={saveJson}>Save JSON</button>
            <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>Open JSON</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void openJson(e.target.files?.[0])} />
            <button type="button" className="secondary" onClick={print}>Print Proposal</button>
            <button type="button" className="primary desktop-only" onClick={() => void generate()} disabled={busy}>
              {busy ? 'Generating…' : 'Generate Proposal PPTX'}
            </button>
          </div>
        </header>

        {isSample && (
          <div className="sample-banner" role="note">
            Sample proposal with fictional clinic data. Replace every field before sending it to a real clinic.
          </div>
        )}

        <div className="status-region" aria-live="polite">
          {status.kind !== 'idle' && <p className={`status status-${status.kind}`}>{status.text}</p>}
          {liveIssues.length > 0 && (
            <ul className="issues">
              {liveIssues.map((i, n) => (
                <li key={n}>
                  <button type="button" className="link" onClick={() => focusField(i.field)}>{i.message}</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <main className="layout">
          <div className="pane pane-form">
            <ProposalForm key={formKey} data={data} update={update} errors={errorMap} />
          </div>
          <div className="pane pane-preview">
            <Preview deck={deck} logo={LOGO_URL} page={page} setPage={setPage} />
          </div>
        </main>

        <div className="mobile-generate">
          <button type="button" className="primary" onClick={() => void generate()} disabled={busy}>
            {busy ? 'Generating…' : 'Generate Proposal PPTX'}
          </button>
        </div>
      </div>

      {createPortal(
        <div className="print-root" aria-hidden="true">
          {deck.slides.map((s, i) => (
            <div className="print-page" key={i}>
              <SlideView slide={s} scale={1} logo={LOGO_URL} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
