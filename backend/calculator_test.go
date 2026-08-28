package calculator

import (
	"strings"
	"testing"
)

func TestCalculateExactOperations(t *testing.T) {
	tests := []struct {
		name, operation string
		operands        []string
		want            string
	}{
		{"add", "add", []string{"0.1", "0.2"}, "0.3"},
		{"subtract", "subtract", []string{"10", "3.25"}, "6.75"},
		{"multiply", "multiply", []string{"1.5", "2"}, "3"},
		{"divide", "divide", []string{"1", "4"}, "0.25"},
		{"percentage", "percentage", []string{"15", "200"}, "30"},
		{"power", "power", []string{"2", "-3"}, "0.125"},
		{"sqrt", "sqrt", []string{"4"}, "2"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := calculate(tt.operation, tt.operands)
			if err != nil || got != tt.want {
				t.Fatalf("calculate() = %q, %v; want %q", got, err, tt.want)
			}
		})
	}
}

func TestCalculateRejectsDomainErrors(t *testing.T) {
	tests := []struct {
		name, operation string
		operands        []string
		wantErr         error
	}{
		{"division by zero", "divide", []string{"1", "0"}, errDivisionByZero},
		{"negative square root", "sqrt", []string{"-1"}, errNegativeSquareRoot},
		{"fractional exponent", "power", []string{"2", "0.5"}, errInvalidExponent},
		{"bad grammar", "add", []string{"1e3", "2"}, errInvalidOperand},
		{"wrong arity", "sqrt", []string{"1", "2"}, errInvalidOperandCount},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := calculate(tt.operation, tt.operands)
			if err != tt.wantErr {
				t.Fatalf("calculate() error = %v; want %v", err, tt.wantErr)
			}
		})
	}
}

func TestCalculateSupportsEveryOperation(t *testing.T) {
	tests := []struct {
		operation string
		operands  []string
		want      string
	}{
		{"add", []string{"2", "3"}, "5"},
		{"subtract", []string{"2", "3"}, "-1"},
		{"multiply", []string{"2", "3"}, "6"},
		{"divide", []string{"2", "3"}, "0.6666666666666667"},
		{"power", []string{"2", "3"}, "8"},
		{"percentage", []string{"12.5", "80"}, "10"},
		{"sqrt", []string{"9"}, "3"},
	}
	for _, tt := range tests {
		t.Run(tt.operation, func(t *testing.T) {
			got, err := calculate(tt.operation, tt.operands)
			if err != nil || got != tt.want {
				t.Fatalf("calculate() = %q, %v; want %q", got, err, tt.want)
			}
		})
	}
}

func TestCalculateRejectsEveryUnsupportedArity(t *testing.T) {
	for _, operation := range []string{"add", "subtract", "multiply", "divide", "power", "percentage"} {
		if _, err := calculate(operation, []string{"1"}); err != errInvalidOperandCount {
			t.Errorf("%s with one operand error = %v; want %v", operation, err, errInvalidOperandCount)
		}
	}
	if _, err := calculate("sqrt", []string{"1", "2"}); err != errInvalidOperandCount {
		t.Errorf("sqrt with two operands error = %v; want %v", err, errInvalidOperandCount)
	}
	if _, err := calculate("modulo", []string{"1", "2"}); err != errUnsupportedOperation {
		t.Errorf("unsupported operation error = %v; want %v", err, errUnsupportedOperation)
	}
}

func TestCalculateRejectsOversizedOperandsAndResults(t *testing.T) {
	longOperand := "1" + strings.Repeat("0", maxOperandLength)
	if _, err := calculate("add", []string{longOperand, "1"}); err != errInvalidOperand {
		t.Errorf("oversized operand error = %v; want %v", err, errInvalidOperand)
	}
	if _, err := calculate("power", []string{strings.Repeat("9", maxOperandLength), "100"}); err != errResultTooLarge {
		t.Errorf("oversized result error = %v; want %v", err, errResultTooLarge)
	}
}
