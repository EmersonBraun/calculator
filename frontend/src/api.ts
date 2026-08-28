import Decimal from 'decimal.js';

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage' | 'sqrt';
export type ApiErrorCode = 'MALFORMED_JSON' | 'INVALID_REQUEST' | 'UNSUPPORTED_OPERATION' | 'INVALID_OPERAND_COUNT' | 'INVALID_OPERAND' | 'DIVISION_BY_ZERO' | 'NEGATIVE_SQUARE_ROOT' | 'INVALID_EXPONENT' | 'RESULT_TOO_LARGE' | 'METHOD_NOT_ALLOWED' | 'UNSUPPORTED_MEDIA_TYPE' | 'INTERNAL_ERROR';

export const operations: Array<{ value: Operation; label: string; symbol: string; hint: string; arity: 1 | 2 }> = [
  { value: 'add', label: 'Add', symbol: '+', hint: 'Combine two values', arity: 2 },
  { value: 'subtract', label: 'Subtract', symbol: '−', hint: 'Find the difference', arity: 2 },
  { value: 'multiply', label: 'Multiply', symbol: '×', hint: 'Scale a value', arity: 2 },
  { value: 'divide', label: 'Divide', symbol: '÷', hint: 'Split a value', arity: 2 },
  { value: 'power', label: 'Power', symbol: 'xʸ', hint: 'Raise to an integer power', arity: 2 },
  { value: 'percentage', label: 'Percentage', symbol: '%', hint: 'First value percent of second', arity: 2 },
  { value: 'sqrt', label: 'Square root', symbol: '√', hint: 'Find the positive root', arity: 1 }
];

export const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export function isValidDecimal(value: string): boolean {
  if (!value.trim() || value.length > 128 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return false;
  try { return new Decimal(value).isFinite(); } catch { return false; }
}

export function localValidation(operation: Operation, operands: string[]): string | null {
  const definition = operations.find((item) => item.value === operation);
  if (!definition || operands.length !== definition.arity) return 'Choose an operation and enter the required values.';
  if (operands.some((operand) => !isValidDecimal(operand))) return 'Enter valid decimal numbers using digits and an optional decimal point.';
  if (operation === 'divide' && new Decimal(operands[1]).isZero()) return 'A value cannot be divided by zero.';
  if (operation === 'sqrt' && new Decimal(operands[0]).isNegative()) return 'Square root needs a value of zero or greater.';
  if (operation === 'power' && (!new Decimal(operands[1]).isInteger() || new Decimal(operands[1]).lt(-100) || new Decimal(operands[1]).gt(100))) return 'Power exponent must be an integer from −100 to 100.';
  return null;
}

export async function calculate(operation: Operation, operands: string[], signal?: AbortSignal): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${defaultApiBaseUrl}/api/calculate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ operation, operands })
    });
  } catch {
    throw new Error('The calculation could not be completed. Try again.');
  }
  const body = await response.json().catch(() => null) as { result?: string; error?: { code?: ApiErrorCode; message?: string } } | null;
  if (!response.ok || !body?.result) throw new Error(body?.error?.message || 'The calculation could not be completed. Try again.');
  return body.result;
}
