# NextBuild Formatting Specification

This document defines the formatting rules and conventions for the NextBuild language, as described by the `nextbuild.tmLanguage.json` grammar. The goal is to ensure consistent, readable, and idiomatic code formatting for all NextBuild source files.

---

## 1. Keywords

- **Uppercase** all language keywords (e.g., `FOR`, `NEXT`, `IF`, `THEN`, `ELSE`, `END`).
- Keywords should be separated by a single space from adjacent tokens.
- Control flow keywords (`IF`, `ELSE`, `FOR`, `WHILE`, `DO`, ``) should nest by 4 spaces until its end keyword (`ENDIF`,`ELSE`,`)
- Functions names should be PascalCase eg LayerText("HELLO")

## 2. Operators

- Surround all operators (`+`, `-`, `*`, `/`, `=`, `<>`, `<`, `>`, `AND`, `OR`, etc.) with a single space on each side.
- No space before or after unary operators (e.g., `-5`).
- No Space between `<>`, `<=` or `>+`

## 3. Functions and Types

- Function names (e.g., `ABS`, `SIN`, `USR`) should be uppercase.
- Type names (`BYTE`, `INTEGER`, `STRING`, etc.) should be uppercase.
- Function calls should not have a space before the opening parenthesis: `PRINT("Hello")`.

## 4. Variables

- Variable names are case-insensitive but should be written in `camelCase` for user-defined variables.
- Suffixes like `$` for strings should be attached directly to the variable name (e.g., `name$`).

## 5. Numbers and Constants

- Decimal, hexadecimal (`$FF`), and binary (`@1010`) numbers are supported.
- No leading zeros for decimal numbers unless required for alignment.

## 6. Strings

- Strings are enclosed in double quotes: `"Hello, world!"`.
- Escape sequences use a backslash: `"Line 1\nLine 2"`.

## 7. Comments

- Single-line comments start with `REM`, `'`, or `;` and extend to the end of the line.
- Block comments are enclosed with `/' ... '/`.

## 8. Indentation and Spacing

- Use 2 spaces per indentation level.
- No tabs.
- Blank lines may be used to separate logical sections.

## 9. Example

```nextbuild
REM This is a sample NextBuild program
FOR i = 1 TO 10
  PRINT "Value: "; i
NEXT i

IF x > 0 THEN
  PRINT "Positive"
ELSE
  PRINT "Non-positive"
END IF
```

---

## 10. Special Cases

- Inline assembly (`ASM ... END ASM`) should be indented and formatted as a block.
- Multi-statement lines are discouraged; prefer one statement per line.

---

*This document is a living specification. Please update as the language or style evolves.*