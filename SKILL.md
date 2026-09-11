---
name: verify-yaml-values
description: 'Verify whether specific values are present or absent under keys in a YAML config file. Use when the user asks to check, confirm, validate, or assert that entries like authenticators, mapping rules, API clients, or policies exist or do not exist under a YAML key. Parses the values/keys/mode from the prompt and runs the verify-yaml-values CLI.'
argument-hint: '<what to check> e.g. "is Test_Analyze under deploy_scope.mapping_rules"'
---

# Verify YAML Values

Check whether one or more values are **present** or **absent** under a key path in a YAML file, using the verify-yaml-values.js file. Matching is exact (case- and whitespace-sensitive).

## When to Use

- The user asks to confirm a value exists (or does not exist) under a YAML key.
- Examples of triggers: "check that `Test_Analyze` is in `deploy_scope.mapping_rules`", "make sure `test_client` is NOT under `api_protection_clients`", "Check below mapping rules are available with the @version: - Test_Analyze v1.1_2026_Aug_28 - Test_Mapping v1.1_2026_Aug_27".

## Procedure

1. **Parse the request** into these arguments:
   - `key` — the dot-separated key path (e.g. `deploy_scope.mapping_rules`). Ask the user if it is ambiguous.
   - `mode` — `present` if the user wants the value(s) to exist, `absent` if they must NOT exist.
   - `value` — one or more exact values to check. Preserve exact casing and whitespace.
   - `file` — optional; defaults to `deployment_config.yaml` if the user does not name a file.

2. **Run the tool** from the workspace root, repeating `--value` for each value:

   ```
   node tools/verify-yaml-values.js --key <dot.path> --mode <present|absent> --value <v1> [--value <v2> ...] [--file <path>]
   ```

3. **Interpret the exit code**:
   - `0` — all values satisfy the requested mode. Report success and echo the per-value PASS lines.
   - `1` — one or more checks failed. Report which values failed (the `[FAIL]` lines name them).
   - `2` — usage, file-read, or YAML-parse error. Fix the arguments (bad `--mode`, missing file, malformed key) and retry; do not treat this as a check failure.

4. **Report** the result to the user in plain language, including any `WARNING:` line (e.g. a key path that was not found).

## Notes

- In `present` mode with several values, **all** must exist for exit `0`.
- A missing key path counts as "absent": `absent` checks pass (with a warning), `present` checks fail.
- The tool prints per-value `[PASS]`/`[FAIL]` lines plus a summary; surface these to the user rather than re-deriving them.

## Example

Request: "Confirm `Test_Analyze` and `Test_Mapping` are both under `deploy_scope.mapping_rules`."

```
node .github/skills/verify-yaml-values.js --key deploy_scope.mapping_rules --mode present --value Test_Analyze --value Test_Mapping
```
