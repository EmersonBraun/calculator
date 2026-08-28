# Calculator API contract

Base URL: `http://localhost:8080`

## `GET /healthz`

Returns `200` with:

```json
{"status":"ok"}
```

The endpoint has no external dependency.

## `POST /api/calculate`

Request content type: `application/json`.

```json
{"operation":"add","operands":["0.1","0.2"]}
```

Success response: `200`.

```json
{"result":"0.3"}
```

Supported operations and arity:

| Operation | Arity | Semantics |
| --- | ---: | --- |
| `add` | 2 | first + second |
| `subtract` | 2 | first - second |
| `multiply` | 2 | first × second |
| `divide` | 2 | first ÷ second |
| `power` | 2 | first raised to second; exponent is an integer in `[-100,100]` |
| `percentage` | 2 | first percent of second: `first × second ÷ 100` |
| `sqrt` | 1 | non-negative square root |

Operands are decimal strings. Accepted values use a conventional finite
decimal form with optional sign and fractional part, for example `-12.50` or
`4`. Exponential notation, NaN, Infinity, empty strings, and whitespace-only
strings are rejected. Each operand is at most 128 characters; requests contain
at most two operands. Results are capped at 256 digits including the decimal
point and sign. The service uses decimal arithmetic and returns a canonical
non-exponential decimal string without unnecessary trailing fractional zeroes
(`0` rather than `0.0`).

## Errors

All client errors use this envelope:

```json
{"error":{"code":"INVALID_OPERAND","message":"Enter a valid decimal number."}}
```

The message is safe for display; clients must branch on `code`.

| HTTP | Code | Meaning |
| ---: | --- | --- |
| 400 | `MALFORMED_JSON` | Body is not one JSON object |
| 400 | `INVALID_REQUEST` | Required fields are missing or have the wrong JSON types |
| 400 | `UNSUPPORTED_OPERATION` | Operation is not in the supported set |
| 400 | `INVALID_OPERAND_COUNT` | Operand count does not match operation arity |
| 400 | `INVALID_OPERAND` | Operand is malformed, non-finite, or over the size limit |
| 400 | `DIVISION_BY_ZERO` | Division denominator is zero |
| 400 | `NEGATIVE_SQUARE_ROOT` | Square root operand is negative |
| 400 | `INVALID_EXPONENT` | Power exponent is outside the integer bound |
| 400 | `RESULT_TOO_LARGE` | Exact result exceeds the result bound |
| 405 | `METHOD_NOT_ALLOWED` | HTTP method is not supported on the route |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Request is not JSON |
| 500 | `INTERNAL_ERROR` | Unexpected server failure without implementation details |

Unknown routes return `404` with the same error shape where practical. The
service does not persist requests or results.
