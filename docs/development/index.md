[Home](../index.md) > Development Guide

# Development Guide

[![Version](https://img.shields.io/github/v/release/torynet/opera-workspace-tab-manager?include_prereleases&label=version)](https://github.com/torynet/opera-workspace-tab-manager/releases)

## Overview

This extension is built using vanilla JavaScript and Chrome Extension APIs, making it lightweight and maintainable.

## Build Instructions

### Environment Requirements

- Operating System: Any modern OS (Windows 10+, macOS 10.15+, or Linux)
- No build tools required (vanilla JavaScript)
- Optional: Python 3.x and pip for documentation development

### Building the Extension

1. Clone the repository:
   ```bash
   git clone https://github.com/torynet/opera-workspace-tab-manager.git
   cd opera-workspace-tab-manager
   ```

2. The extension can be loaded directly from the source directory - no build step is required.

3. Optional: Build documentation site
   ```bash
   # Install mkdocs-material
   pip install mkdocs-material

   # Build the docs
   mkdocs build

   # Or serve locally
   mkdocs serve
   ```

### Loading in Opera

1. Open Opera and navigate to `opera://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension directory

## Project Structure

```tree
├── manifest.json        # Extension manifest
├── popup.html/js        # Extension popup UI
├── background.js        # Background service worker
├── options.html/js      # Options page
└── icons/              # Extension icons
```

## Development Workflow

1. Make changes in a feature branch
2. Test thoroughly
3. Update documentation as needed
4. Submit a pull request

## Getting Started with Development

Before making changes:
1. Review the [architecture documentation](architecture.md) to understand the extension's design
2. Check our [contribution guidelines](contributing.md) for code standards and process
3. Look through existing [issues](https://github.com/torynet/opera-workspace-tab-manager/issues) for known bugs or planned features

## Resources

- [Architecture Overview](architecture.md)
  - [Flow Diagrams](diagrams.md)
- [Contribution Guidelines](contributing.md)
- [Maintenance Guide](maintenance.md)
- [Publishing Process](publishing.md)
- [Opera Extensions Documentation](https://dev.opera.com/extensions/)
