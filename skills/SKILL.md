---
name: scaffold-structure
description: 'Create a consistent directory scaffold (folders and empty files) at a target path by running a script, instead of generating the structure by hand. Use when the user wants to bootstrap/scaffold a new API directory or project skeleton before working in it.'
disable-model-invocation: true
---

# Scaffold a Directory Structure

This skill runs a non-interactive Node script that creates a fixed folder structure
(directories and empty files) defined in `structure.json`. Use it to get consistent
scaffolding before you start working, rather than creating each file by hand.

## Steps

1. Determine the destination path where the structure should be created (the target
   directory). Ask the user if it is unclear.
2. Run the scaffold script from a terminal:

   ```
   node <skill-dir>/scaffold.js --dest <target-path>
   ```

   - Replace `<skill-dir>` with the absolute path to this skill folder and `<target-path>` with the destination from step 1.
   - Add `--dry-run` first if you want to preview what will be created without writing.
   - Add `--force` only if the user wants to overwrite files that already exist (the script refuses to overwrite existing files by default).
3. Confirm the script exited successfully (exit code 0) and review the list of created paths it prints.

## Notes

- The structure is defined in `structure.json` (`directories` and `files` arrays), in this skill's base directory.
