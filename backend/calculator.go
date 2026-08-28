package calculator

import (
	"errors"
	"math/big"
	"regexp"
	"strings"

	"github.com/shopspring/decimal"
)

const (
	maxOperandLength = 128
	maxResultLength  = 256
)

var decimalPattern = regexp.MustCompile(`^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$`)

var (
	errInvalidOperand       = errors.New("invalid operand")
	errInvalidOperandCount  = errors.New("invalid operand count")
	errDivisionByZero       = errors.New("division by zero")
	errNegativeSquareRoot   = errors.New("negative square root")
	errInvalidExponent      = errors.New("invalid exponent")
	errResultTooLarge       = errors.New("result too large")
	errUnsupportedOperation = errors.New("unsupported operation")
)

func calculate(operation string, values []string) (string, error) {
	arities := map[string]int{
		"add": 2, "subtract": 2, "multiply": 2, "divide": 2,
		"power": 2, "percentage": 2, "sqrt": 1,
	}
	arity, ok := arities[operation]
	if !ok {
		return "", errUnsupportedOperation
	}
	if len(values) != arity {
		return "", errInvalidOperandCount
	}

	operands := make([]decimal.Decimal, len(values))
	for i, value := range values {
		parsed, err := parseOperand(value)
		if err != nil {
			return "", errInvalidOperand
		}
		operands[i] = parsed
	}

	var result decimal.Decimal
	switch operation {
	case "add":
		result = operands[0].Add(operands[1])
	case "subtract":
		result = operands[0].Sub(operands[1])
	case "multiply":
		result = operands[0].Mul(operands[1])
	case "divide":
		if operands[1].IsZero() {
			return "", errDivisionByZero
		}
		result = operands[0].Div(operands[1])
	case "power":
		exponent, ok := operands[1].IntPart(), operands[1].Equal(decimal.NewFromInt(operands[1].IntPart()))
		if !ok || exponent < -100 || exponent > 100 {
			return "", errInvalidExponent
		}
		if operands[0].IsZero() && exponent < 0 {
			return "", errDivisionByZero
		}
		result = integerPower(operands[0], exponent)
	case "percentage":
		result = operands[0].Mul(operands[1]).Div(decimal.NewFromInt(100))
	case "sqrt":
		if operands[0].IsNegative() {
			return "", errNegativeSquareRoot
		}
		result = squareRoot(operands[0])
	}

	resultText := result.String()
	if len(resultText) > maxResultLength {
		return "", errResultTooLarge
	}
	return resultText, nil
}

func parseOperand(value string) (decimal.Decimal, error) {
	if len(value) == 0 || len(value) > maxOperandLength || !decimalPattern.MatchString(value) {
		return decimal.Decimal{}, errInvalidOperand
	}
	return decimal.NewFromString(value)
}

func integerPower(base decimal.Decimal, exponent int64) decimal.Decimal {
	if exponent == 0 {
		return decimal.NewFromInt(1)
	}
	if exponent < 0 {
		return decimal.NewFromInt(1).Div(integerPower(base, -exponent))
	}
	result := decimal.NewFromInt(1)
	for exponent > 0 {
		if exponent%2 == 1 {
			result = result.Mul(base)
		}
		base = base.Mul(base)
		exponent /= 2
	}
	return result
}

func squareRoot(value decimal.Decimal) decimal.Decimal {
	if value.IsZero() {
		return decimal.Zero
	}
	input, _, err := big.ParseFloat(value.String(), 10, 512, big.ToNearestEven)
	if err != nil {
		return decimal.Zero
	}
	text := new(big.Float).SetPrec(512).Sqrt(input).Text('f', 64)
	text = strings.TrimRight(strings.TrimRight(text, "0"), ".")
	result, _ := decimal.NewFromString(text)
	return result
}
