// Default options
const DEFAULT_OPTIONS = {
  preserveWorkspaces: true,
  ignoreSpeedDials: true,
  cleanSpeedDials: true,
  undoTimeout: 30,
  focusDestination: true,
  debugMode: false
};

// Saves options to chrome.storage
function saveOptions() {
  const undoTimeout = document.getElementById('undoTimeout').value;
  chrome.storage.sync.set({
    debugMode: document.getElementById('debugMode').checked,
    preserveWorkspaces: document.getElementById('preserveWorkspaces').checked,
    ignoreSpeedDials: document.getElementById('ignoreSpeedDials').checked,
    cleanSpeedDials: document.getElementById('cleanSpeedDials').checked,
    focusDestination: document.getElementById('focusDestination').checked,
    undoTimeout: undoTimeout === '' ? null : parseInt(undoTimeout)
  });
}

// Restores options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
    document.getElementById('preserveWorkspaces').checked = items.preserveWorkspaces;
    document.getElementById('ignoreSpeedDials').checked = items.ignoreSpeedDials;
    document.getElementById('cleanSpeedDials').checked = items.cleanSpeedDials;
    document.getElementById('undoTimeout').value = items.undoTimeout ?? '';
    document.getElementById('focusDestination').checked = items.focusDestination;
    document.getElementById('debugMode').checked = items.debugMode;
  });
}

// Option change handlers
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();  // Restore saved options first
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveOptions);  // Then set up save handlers
  });
});
