# Workspace Tab Manager

A browser extension for Opera that lets you quickly move all tabs from one window to another, making it easier to reorganize entire workspaces across different screens or windows.

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
