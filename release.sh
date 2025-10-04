#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# 1. Ensure the Git repository is clean
if ! git diff-index --quiet HEAD --; then
    echo "Git repository is not clean. Please commit or stash your changes."
    exit 1
fi

# 2. Check for version argument
if [ -z "$1" ]; then
    echo "Usage: $0 <major|minor|patch>"
    exit 1
fi

VERSION_TYPE=$1

# 3. Update package version
echo "Updating package version..."
npm version $VERSION_TYPE

# 4. Release backend
echo "Releasing backend..."
npx supabase db push

# 5. Deploy Trigger
echo "Deploying Trigger..."
npx trigger.dev@latest deploy

# 6. Push changes
echo "Pushing changes to Git..."
git push --follow-tags

echo "Release complete!"
