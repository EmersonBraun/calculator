package calculator

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	Routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK || recorder.Body.String() != "{\"status\":\"ok\"}\n" {
		t.Fatalf("health response = %d %q", recorder.Code, recorder.Body.String())
	}
}

func TestRoutesRejectUnsupportedMethodsAndUnknownPaths(t *testing.T) {
	tests := []struct {
		name, method, path string
		status             int
		code               string
	}{
		{"health method", http.MethodPost, "/healthz", http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED"},
		{"calculate method", http.MethodGet, "/api/calculate", http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED"},
		{"not found", http.MethodGet, "/missing", http.StatusNotFound, "NOT_FOUND"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			Routes().ServeHTTP(recorder, httptest.NewRequest(tt.method, tt.path, nil))
			if recorder.Code != tt.status || !strings.Contains(recorder.Body.String(), tt.code) {
				t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestRoutesHandleLocalCORSPreflight(t *testing.T) {
	request := httptest.NewRequest(http.MethodOptions, "/api/calculate", nil)
	request.Header.Set("Origin", "http://127.0.0.1:5173")
	request.Header.Set("Access-Control-Request-Method", http.MethodPost)
	recorder := httptest.NewRecorder()

	Routes().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent || recorder.Header().Get("Access-Control-Allow-Origin") != "http://127.0.0.1:5173" {
		t.Fatalf("preflight response = %d %q", recorder.Code, recorder.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCalculateHandlerSuccessAndErrors(t *testing.T) {
	tests := []struct {
		name, body, contentType, want string
		status                        int
	}{
		{"success", `{"operation":"add","operands":["0.1","0.2"]}`, "application/json", `{"result":"0.3"}`, http.StatusOK},
		{"zero", `{"operation":"divide","operands":["1","0"]}`, "application/json", `{"error":{"code":"DIVISION_BY_ZERO","message":"The denominator must not be zero."}}`, http.StatusBadRequest},
		{"media type", `{"operation":"add","operands":["1","2"]}`, "text/plain", `{"error":{"code":"UNSUPPORTED_MEDIA_TYPE","message":"Send a JSON request body."}}`, http.StatusUnsupportedMediaType},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(tt.body))
			request.Header.Set("Content-Type", tt.contentType)
			Routes().ServeHTTP(recorder, request)
			if recorder.Code != tt.status || strings.TrimSpace(recorder.Body.String()) != tt.want {
				t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestCalculateHandlerRejectsTrailingJSON(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(`{"operation":"add","operands":["1","2"]}{}`))
	request.Header.Set("Content-Type", "application/json")
	Routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "MALFORMED_JSON") {
		t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
	}
}

func TestCalculateHandlerRejectsInvalidRequestShapes(t *testing.T) {
	tests := []struct {
		name, body, wantCode string
	}{
		{"malformed", `{"operation":"add",`, "MALFORMED_JSON"},
		{"missing operation", `{"operands":["1","2"]}`, "INVALID_REQUEST"},
		{"missing operands", `{"operation":"add"}`, "INVALID_REQUEST"},
		{"unknown field", `{"operation":"add","operands":["1","2"],"extra":true}`, "INVALID_REQUEST"},
		{"wrong types", `{"operation":1,"operands":["1","2"]}`, "INVALID_REQUEST"},
		{"unsupported operation", `{"operation":"modulo","operands":["1","2"]}`, "UNSUPPORTED_OPERATION"},
		{"invalid operand", `{"operation":"add","operands":["1e3","2"]}`, "INVALID_OPERAND"},
		{"negative sqrt", `{"operation":"sqrt","operands":["-1"]}`, "NEGATIVE_SQUARE_ROOT"},
		{"invalid exponent", `{"operation":"power","operands":["2","0.5"]}`, "INVALID_EXPONENT"},
		{"wrong arity", `{"operation":"sqrt","operands":["1","2"]}`, "INVALID_OPERAND_COUNT"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(tt.body))
			request.Header.Set("Content-Type", "application/json")
			Routes().ServeHTTP(recorder, request)
			if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), tt.wantCode) {
				t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestCalculateHandlerRejectsOversizedRequest(t *testing.T) {
	body := `{"operation":"add","operands":["` + strings.Repeat("1", 128) + `0","1"]}`
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	Routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "INVALID_OPERAND") {
		t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
	}
}
