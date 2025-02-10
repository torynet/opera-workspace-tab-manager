// Saves options to chrome.storage
function saveOptions() {
  const undoTimeout = document.getElementById('undoTimeout').value;
  chrome.storage.sync.set({
    debugMode: document.getElementById('debugMode').checked,
    preserveWorkspaces: document.getElementById('preserveWorkspaces').checked,
    cleanSpeedDials: document.getElementById('cleanSpeedDials').checked,
    undoTimeout: undoTimeout === '' ? null : parseInt(undoTimeout)
  });
}

// Restores preferences from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    debugMode: false,
    leaveSpeedDial: true,
    preserveWorkspaces: false,
    cleanSourceSpeedDial: false,
    cleanDestSpeedDial: false,
    undoTimeout: null
  }, (items) => {
    document.getElementById('debugMode').checked = items.debugMode;
    document.getElementById('leaveSpeedDial').checked = items.leaveSpeedDial;
    document.getElementById('preserveWorkspaces').checked = items.preserveWorkspaces;
    document.getElementById('cleanSourceSpeedDial').checked = items.cleanSourceSpeedDial;
    document.getElementById('cleanDestSpeedDial').checked = items.cleanDestSpeedDial;
    document.getElementById('undoTimeout').value = items.undoTimeout ?? '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get({
    debugMode: false,
    preserveWorkspaces: false,
    cleanSpeedDials: false,
    undoTimeout: null
  }, (settings) => {
    document.getElementById('debugMode').checked = settings.debugMode;
    document.getElementById('preserveWorkspaces').checked = settings.preserveWorkspaces;
    document.getElementById('cleanSpeedDials').checked = settings.cleanSpeedDials;
    document.getElementById('undoTimeout').value = settings.undoTimeout ?? '';
  });

  // Add change handlers
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', saveOptions);
  });
});
