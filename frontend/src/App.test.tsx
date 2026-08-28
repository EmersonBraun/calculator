import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('calculator', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('shows only the required operands and sends the API contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: '16.5' }), { status: 200 }));
    render(<App />);
    fireEvent.change(screen.getByLabelText('First value'), { target: { value: '12.5' } });
    fireEvent.change(screen.getByLabelText('Second value'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    await waitFor(() => expect(screen.getByText('16.5')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/calculate', expect.objectContaining({ method: 'POST', body: JSON.stringify({ operation: 'add', operands: ['12.5', '4'] }) }));
  });

  it('switches to unary square root and validates before a request', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    render(<App />);
    fireEvent.click(screen.getAllByRole('option')[6]);
    expect(screen.getByLabelText('Value')).toBeInTheDocument();
    expect(screen.queryByLabelText('Second value')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    expect(screen.getByText(/zero or greater/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps entered values after a server error and can reset', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Try again later.' } }), { status: 500 }));
    render(<App />);
    fireEvent.change(screen.getByLabelText('First value'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    await waitFor(() => expect(screen.getByText('Try again later.')).toBeInTheDocument());
    expect(screen.getByLabelText('First value')).toHaveValue('99');
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByLabelText('First value')).toHaveValue('12.50');
  });

  it('resets a completed square-root calculation back to the binary default', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: '3' }), { status: 200 }));
    render(<App />);
    fireEvent.click(screen.getAllByRole('option')[6]);
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByRole('option', { name: /add combine two values/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('First value')).toHaveValue('12.50');
    expect(screen.getByLabelText('Second value')).toHaveValue('4');
  });

  it('exposes named controls and supports keyboard focus order', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('main')).toHaveAccessibleName('');
    expect(screen.getByRole('button', { name: /calculate/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /reset/i })).toBeEnabled();
    await user.tab();
    expect(screen.getByRole('option', { name: /add combine two values/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('option', { name: /subtract find the difference/i })).toHaveFocus();
  });
});
