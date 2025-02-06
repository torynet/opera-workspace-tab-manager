# Workspace Tab Manager

A browser extension for Opera that helps manage tabs across windows and workspaces.

## Why Opera?

While Opera already has excellent workspace management for organizing tabs, this extension solves a specific problem: moving ALL tabs from one window to another with two clicks. This is particularly useful when you want to:

- Move an entire workspace to a different monitor
- Combine multiple workspaces into one window
- Split your workspace across different screens for better organization

## Features

- Move all tabs from current window to another with two clicks (extension icon + destination)
- Quick overview of all available windows and their tabs
- Create a new window with all current tabs
- Hover over window options to preview their tabs
- Optional: Ignore Speed Dial tabs completely when moving tabs

## Usage

1. Click the extension icon in your browser toolbar
2. Click your desired destination window from the list (or "New Window")
3. All tabs from your current window will move to the selected destination
4. Speed Dial tabs (chrome://startpage) can optionally be excluded from the move

## Window Display

- Each window is shown with its tab count
- Workspace names are displayed for easy identification
- Hover over any window to see a list of all its tabs
- Color coding:
  - Blue: Existing windows
  - Green: New window option

## Notes

- Incognito windows are not displayed
- The popup automatically closes after moving tabs
- Error messages will display if tab movement fails
- Speed Dial tabs can be configured to stay behind when moving tabs

## Installation

1. Clone this repository
2. Open Opera and navigate to `opera://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Tips

### Fixing Incorrect Workspace Moves
If you accidentally move tabs to the wrong workspace (because that workspace was active in the target window), you can fix this using Opera's built-in workspace features:
1. Select the misplaced tabs:
   - Hold Shift and click to select a range of tabs, or
   - Hold Ctrl (or Cmd on Mac) and click to select specific tabs
2. Right-click any selected tab
3. Choose "Move to workspace" and select the correct workspace

This is a standard Opera feature that works independently of this extension.
