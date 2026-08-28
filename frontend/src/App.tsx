import { useEffect, useState } from 'react';
import Decimal from 'decimal.js';
import { calculate, localValidation, Operation } from './api';
import './styles.css';

const BINARY_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide', 'power'];
const symbols: Record<Operation, string> = { add: '+', subtract: '−', multiply: '×', divide: '÷', percentage: '%', power: 'xʸ', sqrt: '√' };
const labels: Record<Operation, string> = { add: 'Add', subtract: 'Subtract', multiply: 'Multiply', divide: 'Divide', percentage: 'Percentage', power: 'Power', sqrt: 'Square root' };

function formatDisplay(value: string) {
  try { return new Decimal(value).toFixed().replace(/\.0+$/, ''); } catch { return value; }
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<string | null>(null);
  const [pending, setPending] = useState<Operation | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function clear() { setDisplay('0'); setStored(null); setPending(null); setWaiting(false); setEvaluated(false); setMessage(null); }
  function clearMessage() { if (message) setMessage(null); }
  function inputDigit(digit: string) { clearMessage(); if (waiting || evaluated) { setDisplay(digit); setWaiting(false); setEvaluated(false); return; } setDisplay((value) => value === '0' ? digit : value.length < 128 ? value + digit : value); }
  function inputDecimal() { clearMessage(); if (waiting || evaluated) { setDisplay('0.'); setWaiting(false); setEvaluated(false); return; } setDisplay((value) => value.includes('.') ? value : `${value}.`); }
  function toggleSign() { clearMessage(); if (display === '0' || display === '0.') return; setDisplay((value) => value.startsWith('-') ? value.slice(1) : `-${value}`); }
  function backspace() { clearMessage(); if (waiting || evaluated) return; setDisplay((value) => value.length <= 1 || (value.length === 2 && value.startsWith('-')) ? '0' : value.slice(0, -1)); }
  function chooseOperation(operation: Operation) { clearMessage(); if (operation === 'sqrt') { setStored(null); setPending('sqrt'); setWaiting(false); setEvaluated(false); return; } if (!BINARY_OPERATIONS.includes(operation)) return; setStored(display); setPending(operation); setWaiting(true); setEvaluated(false); }

  async function equals() {
    if (!pending || busy) return;
    const operands = pending === 'sqrt' ? [display] : [stored || '0', display];
    const validation = localValidation(pending, operands);
    if (validation) { setMessage(validation); return; }
    setBusy(true); setMessage(null);
    try { const value = await calculate(pending, operands); setDisplay(formatDisplay(value)); setStored(null); setPending(null); setWaiting(false); setEvaluated(true); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The calculation could not be completed. Try again.'); }
    finally { setBusy(false); }
  }

  async function applyPercentage() {
    if (busy) return;
    const operands = stored && pending && pending !== 'percentage' ? [display, stored] : ['1', display];
    const validation = localValidation('percentage', operands);
    if (validation) { setMessage(validation); return; }
    setBusy(true); setMessage(null);
    try {
      const value = await calculate('percentage', operands);
      setDisplay(formatDisplay(value));
      if (stored && pending && pending !== 'percentage') setWaiting(true);
      else { setStored(null); setPending(null); setEvaluated(true); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The calculation could not be completed. Try again.'); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) { event.preventDefault(); inputDigit(event.key); return; }
      if (event.key === '.') { event.preventDefault(); inputDecimal(); return; }
      if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); void equals(); return; }
      if (event.key === 'Escape') { event.preventDefault(); clear(); return; }
      if (event.key === 'Backspace') { event.preventDefault(); backspace(); return; }
      if (event.key === '%') { event.preventDefault(); void applyPercentage(); return; }
      const operation: Partial<Record<string, Operation>> = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
      if (operation[event.key]) { event.preventDefault(); chooseOperation(operation[event.key]!); }
    }
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  });

  const activeOperation = pending ? `${stored ?? ''} ${symbols[pending]}${waiting ? '' : ` ${display}`}` : '';
  const displayScale = display.length > 40 ? 'ultra-long' : display.length > 24 ? 'very-long' : display.length > 17 ? 'long' : display.length > 12 ? 'medium' : '';
  const button = (text: string, onClick: () => void, className = '', ariaLabel = text) => <button key={`${ariaLabel}-${text}`} type="button" className={`key ${className}`} onClick={onClick} aria-label={ariaLabel} disabled={busy}>{text}</button>;

  return <main className="calculator-page" aria-label="Traditional calculator">
    <section className="calculator-wrap" aria-label="Calculator work surface">
      <div className="display-panel"><div className="expression" aria-hidden="true">{activeOperation || 'Ready'}</div><output className={`display ${displayScale}`} aria-label="Calculator display" aria-live="polite">{display}</output></div>
      <div className="keypad" aria-label="Calculator keypad">
        {button('⌫', backspace, 'utility backspace', 'Backspace')}{button('C', clear, 'utility', 'Clear calculator')}{button('%', () => void applyPercentage(), 'utility operator', 'Percentage')}{button('÷', () => chooseOperation('divide'), 'operator', 'Divide')}
        {button('7', () => inputDigit('7'))}{button('8', () => inputDigit('8'))}{button('9', () => inputDigit('9'))}{button('×', () => chooseOperation('multiply'), 'operator', 'Multiply')}
        {button('4', () => inputDigit('4'))}{button('5', () => inputDigit('5'))}{button('6', () => inputDigit('6'))}{button('−', () => chooseOperation('subtract'), 'operator', 'Subtract')}
        {button('1', () => inputDigit('1'))}{button('2', () => inputDigit('2'))}{button('3', () => inputDigit('3'))}{button('+', () => chooseOperation('add'), 'operator', 'Add')}
        {button('±', toggleSign, 'utility', 'Toggle sign')}{button('0', () => inputDigit('0'))}{button('.', inputDecimal, 'decimal', 'Decimal point')}{button(busy ? '…' : '=', () => void equals(), 'equals', 'Equals')}
      </div>
      <div className="scientific" aria-label="Additional operations"><div className="scientific-keys">{(['power', 'sqrt'] as Operation[]).map((operation) => button(symbols[operation], () => chooseOperation(operation), 'scientific-key', labels[operation]))}</div></div>
      <div className={`feedback ${message ? 'visible' : ''}`} role="alert" aria-live="assertive">{message && <><span>!</span>{message}</>}</div>
    </section>
  </main>;
}
