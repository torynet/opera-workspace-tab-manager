// Saves options to chrome.storage
function saveOptions() {
  const debugMode = document.getElementById('debugMode').checked;
  const leaveSpeedDial = document.getElementById('leaveSpeedDial').checked;
  chrome.storage.sync.set(
    {
      debugMode: debugMode,
      leaveSpeedDial: leaveSpeedDial
    }
  );
}

// Restores preferences from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(
    {
      debugMode: false,
      leaveSpeedDial: true
    },
    (items) => {
      document.getElementById('debugMode').checked = items.debugMode;
      document.getElementById('leaveSpeedDial').checked = items.leaveSpeedDial;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('debugMode').addEventListener('change', saveOptions);
document.getElementById('leaveSpeedDial').addEventListener('change', saveOptions);
