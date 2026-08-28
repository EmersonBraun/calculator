import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('traditional calculator', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('evaluates a two-part operation and chains from the result', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '5' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '20' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Clear calculator' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('5'));
    await user.click(screen.getByRole('button', { name: 'Multiply' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('20'));
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'add', operands: ['2', '3'] }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'multiply', operands: ['5', '4'] }) }));
  });

  it('evaluates consecutive operations with immediate calculator semantics', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '5' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '20' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    for (const key of ['2', 'Add', '3', 'Multiply', '4', 'Equals']) await user.click(screen.getByRole('button', { name: key }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('20'));
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'add', operands: ['2', '3'] }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'multiply', operands: ['5', '4'] }) }));
  });

  it('replaces a pending operator and repeats the last operation on equals', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '8' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '11' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    for (const key of ['5', 'Add', 'Multiply', '3', 'Equals', 'Equals']) await user.click(screen.getByRole('button', { name: key }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('11'));
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'multiply', operands: ['5', '3'] }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'multiply', operands: ['8', '3'] }) }));
  });

  it('supports keyboard digits, operators, enter, backspace, escape and sign toggle', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: '-2' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('12');
    await user.keyboard('{Backspace}');
    await user.keyboard('-');
    await user.keyboard('3');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('-2'));
    expect(fetchMock).toHaveBeenCalledWith('/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'subtract', operands: ['1', '3'] }) }));
    await user.keyboard('4');
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('4');
    await user.click(screen.getByRole('button', { name: 'Toggle sign' }));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('-4');
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('0');
  });

  it('sends square root through the optional scientific control on equals', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: '3' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: 'Square root' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('3'));
    expect(fetchMock).toHaveBeenCalledWith('/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'sqrt', operands: ['9'] }) }));
    await user.click(screen.getByRole('button', { name: 'Clear calculator' }));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('0');
  });

  it('uses the base value for a contextual percentage', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '20' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '220' }), { status: 200 }));
    const user = userEvent.setup();
    render(<App />);
    for (const key of ['2', '0', '0', 'Add', '1', '0']) await user.click(screen.getByRole('button', { name: key }));
    await user.click(screen.getByRole('button', { name: 'Percentage' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    await waitFor(() => expect(screen.getByLabelText('Calculator display')).toHaveTextContent('220'));
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'percentage', operands: ['10', '200'] }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/calculate', expect.objectContaining({ body: JSON.stringify({ operation: 'add', operands: ['200', '20'] }) }));
  });

  it('shows inline API errors and preserves the display', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Equals' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be completed/i));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('3');
  });

  it('exposes accessible names for the keypad and scientific controls', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'Traditional calculator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decimal point' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Power' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Percentage' })).toHaveLength(1);
  });
});
