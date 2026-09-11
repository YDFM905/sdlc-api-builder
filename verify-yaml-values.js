#!/usr/bin/env node
"use strict";

// CLI that checks whether given values are present or absent under a key in a YAML file.
// Exit codes: 0 = all checks satisfied, 1 = one or more checks failed, 2 = usage/IO/parse error.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const DEFAULT_FILE = "deployment_config.yaml";

function usage() {
  return [
    "Usage: node tools/verify-yaml-values.js --key <dot.path> --mode <present|absent> --value <v> [--value <v> ...] [--file <path>]",
    "",
    "Options:",
    "  --file <path>   Path to the YAML file (default: deployment_config.yaml)",
    "  --key <path>    Dot-separated key path, e.g. deploy_scope.mapping_rules",
    "  --mode <mode>   'present' to require the value(s) exist, 'absent' to require they do not",
    "  --value <v>     A value to check; repeat --value to check several. All must satisfy --mode.",
    "  -h, --help      Show this help",
    "",
    "Matching is exact (case- and whitespace-sensitive).",
    "Exit codes: 0 = all checks satisfied, 1 = check failed, 2 = usage/IO/parse error.",
  ].join("\n");
}

function fail(message, code) {
  process.stderr.write(message + "\n");
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { file: DEFAULT_FILE, key: null, mode: null, values: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "--file":
        opts.file = argv[++i];
        break;
      case "--key":
        opts.key = argv[++i];
        break;
      case "--mode":
        opts.mode = argv[++i];
        break;
      case "--value":
        opts.values.push(argv[++i]);
        break;
      default:
        return { error: `Unknown argument: ${arg}` };
    }
  }
  return { opts };
}

function validate(opts) {
  const errors = [];
  if (!opts.key) errors.push("Missing required --key");
  if (opts.mode !== "present" && opts.mode !== "absent") {
    errors.push("Missing or invalid --mode (expected 'present' or 'absent')");
  }
  if (opts.values.length === 0) errors.push("Missing required --value (provide at least one)");
  if (opts.values.some((v) => v === undefined)) errors.push("A --value flag was given without a value");
  return errors;
}

// Walk a dot-separated key path; returns { found, value }.
function resolveKeyPath(root, keyPath) {
  const segments = keyPath.split(".");
  let node = root;
  for (const segment of segments) {
    if (node !== null && typeof node === "object" && !Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, segment)) {
      node = node[segment];
    } else {
      return { found: false, value: undefined };
    }
  }
  return { found: true, value: node };
}

// Normalize the resolved node into a list of scalar strings to compare against.
function toScalarList(value) {
  if (Array.isArray(value)) {
    return value.filter((v) => v === null || typeof v !== "object").map((v) => String(v));
  }
  if (value === null || typeof value !== "object") {
    return [String(value)];
  }
  return []; // an object/map has no scalar members to match against
}

function main() {
  const { opts, error } = parseArgs(process.argv.slice(2));
  if (error) fail(`${error}\n\n${usage()}`, 2);
  if (opts.help) {
    process.stdout.write(usage() + "\n");
    process.exit(0);
  }

  const errors = validate(opts);
  if (errors.length > 0) fail(`${errors.join("\n")}\n\n${usage()}`, 2);

  const filePath = path.resolve(process.cwd(), opts.file);
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    fail(`Error: could not read file '${opts.file}': ${e.message}`, 2);
  }

  let doc;
  try {
    doc = yaml.load(raw);
  } catch (e) {
    fail(`Error: could not parse YAML in '${opts.file}': ${e.message}`, 2);
  }

  const { found, value } = resolveKeyPath(doc, opts.key);
  const scalars = found ? toScalarList(value) : [];
  const membership = new Set(scalars);

  const lines = [];
  let allSatisfied = true;

  if (!found) {
    // Missing path: absent checks pass (value truly absent) with a warning; present checks fail.
    lines.push(`WARNING: key path '${opts.key}' not found in ${opts.file}`);
  }

  for (const v of opts.values) {
    const isPresent = membership.has(v);
    const satisfied = opts.mode === "present" ? isPresent : !isPresent;
    if (!satisfied) allSatisfied = false;
    const status = satisfied ? "PASS" : "FAIL";
    const stateWord = isPresent ? "present" : "absent";
    lines.push(`[${status}] '${v}' is ${stateWord} under '${opts.key}' (mode=${opts.mode})`);
  }

  const summary = allSatisfied
    ? `OK: all ${opts.values.length} value(s) satisfy mode '${opts.mode}' under '${opts.key}'`
    : `FAILED: one or more value(s) did not satisfy mode '${opts.mode}' under '${opts.key}'`;

  process.stdout.write(lines.join("\n") + "\n" + summary + "\n");
  process.exit(allSatisfied ? 0 : 1);
}

main();
