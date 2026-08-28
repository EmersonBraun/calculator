import { FormEvent, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { calculate, localValidation, operations, Operation } from './api';
import './styles.css';

const initialOperands = ['12.50', '4'];

export default function App() {
  const [operation, setOperation] = useState<Operation>('add');
  const [operands, setOperands] = useState(initialOperands);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const definition = useMemo(() => operations.find((item) => item.value === operation)!, [operation]);

  function selectOperation(next: Operation) {
    setOperation(next); setResult(null); setMessage(null);
    const nextDefinition = operations.find((item) => item.value === next)!;
    setOperands((current) => Array.from({ length: nextDefinition.arity }, (_, index) => current[index] || ''));
  }

  function reset() { setOperands(initialOperands); setOperation('add'); setResult(null); setMessage(null); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setResult(null); setMessage(null);
    const validation = localValidation(operation, operands);
    if (validation) { setMessage(validation); return; }
    setBusy(true);
    try { setResult(await calculate(operation, operands)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The calculation could not be completed. Try again.'); }
    finally { setBusy(false); }
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">∑</span><span>Exact</span></div><span className="status"><i /> Local calculator</span></header>
    <section className="hero"><p className="eyebrow">PRECISION, WITHOUT FRICTION</p><h1>Make the numbers<br /><em>make sense.</em></h1><p className="lede">A focused calculator powered by exact decimal arithmetic. Clear inputs, predictable outcomes, no surprises.</p></section>
    <section className="calculator" aria-label="Calculator">
      <aside className="operation-panel"><div className="section-label">Operation</div><div className="operation-list" role="listbox" aria-label="Choose an operation">
        {operations.map((item) => <button key={item.value} className={`operation ${item.value === operation ? 'selected' : ''}`} onClick={() => selectOperation(item.value)} role="option" aria-selected={item.value === operation} type="button"><span className="operation-symbol">{item.symbol}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span><span className="chevron">›</span></button>)}
      </div></aside>
      <form className="work-panel" onSubmit={submit} noValidate><div className="section-heading"><div><div className="section-label">Calculation</div><h2>{definition.label}</h2></div><span className="arity">{definition.arity === 1 ? 'UNARY' : 'BINARY'}</span></div>
        <div className={`inputs ${definition.arity === 1 ? 'single' : ''}`}>
          {operands.map((operand, index) => <label key={index} className="field"><span>{definition.arity === 1 ? 'Value' : index === 0 ? 'First value' : 'Second value'}</span><input inputMode="decimal" value={operand} onChange={(event) => { const next = [...operands]; next[index] = event.target.value; setOperands(next); setResult(null); }} aria-label={definition.arity === 1 ? 'Value' : `${index === 0 ? 'First' : 'Second'} value`} placeholder={index === 0 ? '0.00' : '0'} /></label>)}
        </div>
        <div className="form-actions"><button className="primary" type="submit" disabled={busy}>{busy ? <><span className="spinner" />Calculating</> : <>Calculate <span>→</span></>}</button><button className="reset" type="button" onClick={reset} disabled={busy}>Reset</button></div>
        <div className={`output ${result ? 'has-result' : ''} ${message ? 'has-error' : ''}`} role="status" aria-live="polite">{result ? <><span className="output-label">Result</span><strong>{new Decimal(result).toString()}</strong></> : message ? <><span className="error-icon">!</span><span>{message}</span></> : <span className="empty-output">Your exact result will appear here.</span>}</div>
        <p className="contract-note">Exact decimal output · Human-readable errors · Results from the local API</p>
      </form>
    </section>
    <footer><span>Built for correctness.</span><span>7 operations · 1 calm interface</span></footer>
  </main>;
}
