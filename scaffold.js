#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'reference/structure.json');

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function loadManifest() {
  let raw;
  try {
    raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  } catch (err) {
    fail(`Could not read manifest at ${MANIFEST_PATH}: ${err.message}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    fail(`Manifest is not valid JSON: ${err.message}`);
  }
  const directories = Array.isArray(manifest.directories) ? manifest.directories : [];
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  return { directories, files };
}

function main() {
  const destArg = process.argv[2] === '--dest' ? process.argv[3] : null;
  if (!destArg) {
    fail('--dest <path> is required');
  }

  const destRoot = path.resolve(destArg);
  const { directories, files } = loadManifest();
  const created = [];

  for (const dir of directories) {
    const target = path.join(destRoot, dir);
    fs.mkdirSync(target, { recursive: true });
    created.push(`dir  ${target}`);
  }

  for (const file of files) {
    const target = path.join(destRoot, file);
    if (fs.existsSync(target)) {
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '');
    created.push(`file ${target}`);
  }

  console.log(`Created ${created.length} item(s) under ${destRoot}:`);
  for (const line of created) {
    console.log(`  ${line}`);
  }
}

main();
