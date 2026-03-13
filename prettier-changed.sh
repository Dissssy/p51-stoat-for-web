#!/bin/bash

# This script runs Prettier on all recently changed files in the git repository.
# git status --porcelain | cut -c 4- lists changed files, ignoring deleted ones.
# We then filter for files with specific extensions and run Prettier on them. (npx prettier -w)

# Get the list of changed files (added, modified, renamed) and ignore deleted files
changed_files=$(git status --porcelain | cut -c 4- | grep -E '\.(ts|tsx|js|jsx|css|scss|html|json)$')
if [ -z "$changed_files" ]; then
  echo "No changed files to format."
  exit 0
fi
# Run Prettier on the changed files
echo "$changed_files" | xargs npx prettier -w