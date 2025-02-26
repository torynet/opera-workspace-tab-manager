[Home](../index.md) > [Development](index.md) > Publishing Guide

# Publishing to Opera Add-ons

This document outlines the steps to publish updates to the Workspace Tab Manager extension.

## Version Updates

1. Download the release package:
    - Option 1: Releases page
        - Go to the [GitHub releases page](https://github.com/torynet/opera-workspace-tab-manager/releases)
        - Click the version you want to update to
        - Download the `.zip` file under "Assets"
    - Option 2: Direct download
        - Use URL format: `https://github.com/torynet/opera-workspace-tab-manager/releases/download/VERSION/workspace-tab-manager-VERSION.zip`
        - Replace VERSION with the tag (e.g., v1.0.0)

2. Submit the update:
    - Log into the [Developer Dashboard](https://addons.opera.com/developer/)
    - Find "Workspace Tab Manager" in your extensions list
    - Click "Upload New Version"
    - Upload the downloaded `.zip` file
    - Add release notes from metadata.json
    - Submit for review

3. Wait for the update review:
    - Update reviews are typically faster than initial submissions
    - You'll receive an email when the update is approved

## Creating a Release

1. Option 1: GitHub UI
    - Create and push a tag:

     ```bash
     git tag v1.0.0  # Use v1.0.0-beta for pre-releases
     git push origin v1.0.0
     ```

    - Go to [Releases page](https://github.com/torynet/opera-workspace-tab-manager/releases)
    - Click "Create release from tag"
    - Fill in release details from metadata.json
    - For pre-releases (v1.0.0-beta), check "Set as pre-release"
    - Click "Publish release"

2. Option 2: GitHub CLI
    ```bash
    # Create and push tag
    git tag v1.0.0  # Use v1.0.0-beta for pre-releases
    git push origin v1.0.0

    # Create release
    gh release create v1.0.0 \
      --title "Version 1.0.0" \
    --notes "$(jq -r '.release_notes["1.0.0"].changes[]' metadata.json | sed 's/^/- /')" \
      --prerelease  # Only for beta/RC releases
    ```

The release workflow will automatically:

1. Build the extension package
2. Upload it to the release
3. Mark as pre-release if version contains hyphen
