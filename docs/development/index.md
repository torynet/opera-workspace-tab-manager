[Home](../index.md) > Development Guide

# Development Guide

[![Version](https://img.shields.io/github/v/release/torynet/opera-workspace-tab-manager?include_prereleases&label=version)](https://github.com/torynet/opera-workspace-tab-manager/releases)

## Overview

This extension is built using vanilla JavaScript and Chrome Extension APIs, making it lightweight and maintainable.

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/torynet/opera-workspace-tab-manager.git
   ```
2. Review the [architecture documentation](architecture.md)
3. Follow our [contribution guidelines](contributing.md)

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

## Resources

- [Architecture Overview](architecture.md)
- [Contributing Guidelines](contributing.md)
- [Maintenance Guide](maintenance.md)
- [Publishing Process](publishing.md)
- [Opera Extensions Documentation](https://dev.opera.com/extensions/)
