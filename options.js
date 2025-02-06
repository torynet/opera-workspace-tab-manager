// Saves options to chrome.storage
function saveOptions() {
  const debugMode = document.getElementById('debugMode').checked;
  const leaveSpeedDial = document.getElementById('leaveSpeedDial').checked;
  const cleanSourceSpeedDial = document.getElementById('cleanSourceSpeedDial').checked;
  const cleanDestSpeedDial = document.getElementById('cleanDestSpeedDial').checked;

  chrome.storage.sync.set({
    debugMode,
    leaveSpeedDial,
    cleanSourceSpeedDial,
    cleanDestSpeedDial
  });
}

// Restores preferences from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    debugMode: false,
    leaveSpeedDial: true,
    cleanSourceSpeedDial: false,
    cleanDestSpeedDial: false
  }, (items) => {
    document.getElementById('debugMode').checked = items.debugMode;
    document.getElementById('leaveSpeedDial').checked = items.leaveSpeedDial;
    document.getElementById('cleanSourceSpeedDial').checked = items.cleanSourceSpeedDial;
    document.getElementById('cleanDestSpeedDial').checked = items.cleanDestSpeedDial;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('debugMode').addEventListener('change', saveOptions);
document.getElementById('leaveSpeedDial').addEventListener('change', saveOptions);
document.getElementById('cleanSourceSpeedDial').addEventListener('change', saveOptions);
document.getElementById('cleanDestSpeedDial').addEventListener('change', saveOptions);
