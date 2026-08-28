import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculate, isValidDecimal, localValidation } from './api';

describe('client contract boundary', () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each([
    ['power', ['2', '3']],
    ['percentage', ['12.5', '80']],
    ['sqrt', ['9']]
  ] as const)('sends the optional %s operation with exact string operands', async (operation, operands) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: operation === 'sqrt' ? '3' : '8' }), { status: 200 }));
    await calculate(operation, [...operands]);
    expect(fetchMock).toHaveBeenCalledWith('/api/calculate', expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, operands })
    }));
  });

  it('covers optional-operation validation and rejects malformed decimals locally', () => {
    expect(localValidation('power', ['2', '3.5'])).toMatch(/integer/);
    expect(localValidation('power', ['2', '101'])).toMatch(/integer/);
    expect(localValidation('percentage', ['12.5', '80'])).toBeNull();
    expect(localValidation('sqrt', ['9'])).toBeNull();
    expect(localValidation('sqrt', ['-0.1'])).toMatch(/zero or greater/);
    expect(isValidDecimal('1e3')).toBe(false);
    expect(isValidDecimal('Infinity')).toBe(false);
    expect(isValidDecimal('  ')).toBe(false);
  });

  it.each([
    [new Response(null, { status: 502 }), 'The calculation could not be completed. Try again.'],
    [new Response(JSON.stringify({ error: {} }), { status: 400 }), 'The calculation could not be completed. Try again.']
  ])('uses a safe fallback when the API returns %s', async (response, message) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(calculate('add', ['1', '2'])).rejects.toThrow(message);
  });

  it('uses a safe fallback when the API cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(calculate('add', ['1', '2'])).rejects.toThrow('The calculation could not be completed. Try again.');
  });

  it('preserves a zero result as a valid API response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ result: '0' }), { status: 200 }));
    await expect(calculate('subtract', ['2', '2'])).resolves.toBe('0');
  });
});
