[Home](../index.md) > [Development](index.md) > Architecture Overview

# Architecture Overview

The Workspace Tab Manager extension is built with a focus on reliable tab movement and workspace management.

## Core Components

- **Popup UI**: User interface for window selection and movement controls
- **Background Service**: Makes logging easier to use for debugging
- **Options Page**: Configuration of all extension options

## Flow Diagrams

See our [detailed flow diagrams](diagrams.md) for a visual representation of:

- Tab Movement Operations
- Window Resolution Process
- State Management

## Key Features

1. **Window Management**
   - Window-to-window tab movement
   - New window creation
   - Window state preservation

2. **Speed Dial Handling**
   - Configurable preservation
   - Automatic cleanup

3. **State Management**
   - Undo/redo functionality
   - Movement history tracking

## Implementation Details

The extension uses:

- Chrome Extension Manifest V3
- Native browser APIs for tab/window management
- Local storage for state persistence
