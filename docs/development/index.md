# Development Guide

## Overview

This extension is built using vanilla JavaScript and Chrome Extension APIs, making it lightweight and maintainable.

## Quick Start

1. [Set up your development environment](setup.md)
2. Review the [architecture documentation](architecture.md)
3. Follow our [testing guidelines](testing.md)

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
2. Test thoroughly using the [testing guidelines](testing.md)
3. Update documentation as needed
4. Submit a pull request

## Resources

- [Architecture Overview](architecture.md)
- [Contributing Guidelines](contributing.md)
- [Maintenance Guide](maintenance.md)
- [Publishing Process](publishing.md)
- [Opera Extensions Documentation](https://dev.opera.com/extensions/)
