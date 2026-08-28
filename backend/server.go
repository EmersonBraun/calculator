package calculator

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

type calculateRequest struct {
	Operation string   `json:"operation"`
	Operands  []string `json:"operands"`
}

type responseEnvelope struct {
	Result string    `json:"result,omitempty"`
	Error  *apiError `json:"error,omitempty"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthHandler)
	mux.HandleFunc("/api/calculate", calculateHandler)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		setCORS(w, r)
		if r.URL.Path != "/healthz" && r.URL.Path != "/api/calculate" {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "The requested route was not found.")
			return
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})
}

func setCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Vary", "Origin")
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "This method is not supported.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "This method is not supported.")
		return
	}
	if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
		writeError(w, http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE", "Send a JSON request body.")
		return
	}

	var request calculateRequest
	decoder := json.NewDecoder(io.LimitReader(r.Body, 4096))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if isMalformedJSON(err) {
			writeError(w, http.StatusBadRequest, "MALFORMED_JSON", "Send one valid JSON object.")
		} else {
			writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Operation and operands are required.")
		}
		return
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		writeError(w, http.StatusBadRequest, "MALFORMED_JSON", "Send one valid JSON object.")
		return
	}
	if request.Operation == "" || request.Operands == nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Operation and operands are required.")
		return
	}

	result, err := calculate(request.Operation, request.Operands)
	if err != nil {
		status, code, message := mapCalculationError(err)
		writeError(w, status, code, message)
		return
	}
	writeJSON(w, http.StatusOK, responseEnvelope{Result: result})
}

func isMalformedJSON(err error) bool {
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	var typeErr *json.UnmarshalTypeError
	if errors.As(err, &typeErr) || strings.Contains(err.Error(), "unknown field") {
		return false
	}
	var syntaxErr *json.SyntaxError
	return errors.As(err, &syntaxErr)
}

func mapCalculationError(err error) (int, string, string) {
	switch {
	case errors.Is(err, errUnsupportedOperation):
		return http.StatusBadRequest, "UNSUPPORTED_OPERATION", "Choose a supported operation."
	case errors.Is(err, errInvalidOperandCount):
		return http.StatusBadRequest, "INVALID_OPERAND_COUNT", "The operation received the wrong number of operands."
	case errors.Is(err, errInvalidOperand):
		return http.StatusBadRequest, "INVALID_OPERAND", "Enter a valid decimal number."
	case errors.Is(err, errDivisionByZero):
		return http.StatusBadRequest, "DIVISION_BY_ZERO", "The denominator must not be zero."
	case errors.Is(err, errNegativeSquareRoot):
		return http.StatusBadRequest, "NEGATIVE_SQUARE_ROOT", "Square root requires a non-negative number."
	case errors.Is(err, errInvalidExponent):
		return http.StatusBadRequest, "INVALID_EXPONENT", "The exponent must be an integer from -100 to 100."
	case errors.Is(err, errResultTooLarge):
		return http.StatusBadRequest, "RESULT_TOO_LARGE", "The exact result is too large."
	default:
		return http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred."
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, responseEnvelope{Error: &apiError{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
