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

// Restores preferences from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    debugMode: false,
    preserveWorkspaces: false,
    ignoreSpeedDials: true,
    cleanSpeedDials: false,
    focusDestination: true,
    undoTimeout: null
  }, (items) => {
    document.getElementById('debugMode').checked = items.debugMode;
    document.getElementById('preserveWorkspaces').checked = items.preserveWorkspaces;
    document.getElementById('ignoreSpeedDials').checked = items.ignoreSpeedDials;
    document.getElementById('cleanSpeedDials').checked = items.cleanSpeedDials;
    document.getElementById('focusDestination').checked = items.focusDestination;
    document.getElementById('undoTimeout').value = items.undoTimeout ?? '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get({
    debugMode: false,
    preserveWorkspaces: false,
    ignoreSpeedDials: true,
    cleanSpeedDials: false,
    focusDestination: true,
    undoTimeout: null
  }, (settings) => {
    document.getElementById('debugMode').checked = settings.debugMode;
    document.getElementById('preserveWorkspaces').checked = settings.preserveWorkspaces;
    document.getElementById('ignoreSpeedDials').checked = settings.ignoreSpeedDials;
    document.getElementById('cleanSpeedDials').checked = settings.cleanSpeedDials;
    document.getElementById('focusDestination').checked = settings.focusDestination;
    document.getElementById('undoTimeout').value = settings.undoTimeout ?? '';
  });

  // Add change handlers
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveOptions);
  });
});
