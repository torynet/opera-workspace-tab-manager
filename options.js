// Saves options to chrome.storage
function saveOptions() {
  const debugMode = document.getElementById('debugMode').checked;
  const leaveSpeedDial = document.getElementById('leaveSpeedDial').checked;
  const preserveWorkspaces = document.getElementById('preserveWorkspaces').checked;
  const cleanSourceSpeedDial = document.getElementById('cleanSourceSpeedDial').checked;
  const cleanDestSpeedDial = document.getElementById('cleanDestSpeedDial').checked;
  const undoTimeout = document.getElementById('undoTimeout').value;

  chrome.storage.sync.set({
    debugMode,
    leaveSpeedDial,
    preserveWorkspaces,
    cleanSourceSpeedDial,
    cleanDestSpeedDial,
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

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('debugMode').addEventListener('change', saveOptions);
document.getElementById('leaveSpeedDial').addEventListener('change', saveOptions);
document.getElementById('preserveWorkspaces').addEventListener('change', saveOptions);
document.getElementById('cleanSourceSpeedDial').addEventListener('change', saveOptions);
document.getElementById('cleanDestSpeedDial').addEventListener('change', saveOptions);
