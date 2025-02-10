// This is loading the popup
document.addEventListener("DOMContentLoaded", async () => {
  // Get settings first
  window.settings = await getSettings();
  const windowList = document.getElementById("windowList");
  const windows = await chrome.windows.getAll({ populate: true });
  const currentWindow = await chrome.windows.getCurrent();
  debugLog('All windows:', windows);
  debugLog('Current window:', currentWindow);
  populateWindowList(windowList, windows, currentWindow);
  addNewWindowOption(windowList, currentWindow);
  // Add click handler for undo/redo button
  document.querySelector('.undo-option').addEventListener('click', handleUndoToggle);
  // Show/hide undo button and set correct text
  updateUndoRedoButton();
});


// This is all setup and initialization.
function populateWindowList(windowList, windows, currentWindow) {
  let displayIndex = 0;
  windows.forEach((window) => {
    if (shouldDisplayWindow(window, currentWindow)) {
      const windowOption = createWindowOption(window, currentWindow, ++displayIndex);
      windowList.appendChild(windowOption);
    }
  });
}
function shouldDisplayWindow(window, currentWindow) {
  return  window.id !== currentWindow.id &&
          window.type === "normal" &&
          !window.incognito;
}
function createWindowOption(window, currentWindow, index) {
  const div = document.createElement("div");
  div.className = "window-option";
  div.title = createTabTitlesList(window);
  const tabCount = window.tabs.length;
  div.textContent = `${index}. ${getWindowDisplayName(window)} (${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'})`;
  div.addEventListener("click", () =>
    handleTargetWindowSelection(currentWindow, window.id)
  );
  return div;
}
function createTabTitlesList(window) {
  return window.tabs
    .map(tab => `\u2022 ${tab.title}`)
    .join('\n');
}
function getWindowDisplayName(window) {
  const firstTab = window.tabs[0];
  return firstTab?.workspaceName
    ? `${firstTab.workspaceName}`
    : `${window.id}`;
}
function addNewWindowOption(windowList, currentWindow) {
  const newWindowDiv = document.createElement("div");
  newWindowDiv.className = "new-window-option";
  newWindowDiv.textContent = "New Window";
  newWindowDiv.addEventListener("click", () =>
    handleTargetWindowSelection(currentWindow, 'new')
  );
  windowList.appendChild(newWindowDiv);
}
function updateUndoRedoButton() {
  const undoSection = document.getElementById('undoSection');
  const undoButton = document.querySelector('.undo-option');
  getLastMove().then(lastMove => {
    if (lastMove) {
      undoSection.style.display = 'block';
      undoButton.classList.remove('disabled');
      undoButton.textContent = lastMove.isRedo ? 'Redo' : 'Undo';
    } else {
      undoButton.classList.add('disabled');
      undoSection.style.display = 'block';
      undoButton.textContent = 'Undo';
    }
  });
}


// Primary move handler
async function handleTargetWindowSelection(currentWindow, targetWindowId) {
  try {
    const destinationWindowId = await resolveDestinationWindow(targetWindowId);
    await moveTabsToWindow(currentWindow.id, destinationWindowId);
    await preserveWorkspaceIfEnabled(currentWindow.id);
    await cleanupSpeedDialTabsIfEnabled(currentWindow.id, destinationWindowId);
    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during tab movement:', error);
    alert('Error moving tabs: ' + error.message);
  }
}


// Undo/redo handling
async function handleUndoToggle() {
  const lastMove = await getLastMove();
  if (!lastMove) return;
  try {
    if (lastMove.isRedo) {
      await redoLastMove(lastMove);
    } else {
      await undoLastMove(lastMove);
    }
    await preserveWorkspaceIfEnabled(lastMove.sourceWindowId);
    await cleanupSpeedDialTabsIfEnabled(lastMove.sourceWindowId, lastMove.targetWindowId);
    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during move:', error);
    alert(`Error ${lastMove.isRedo ? 'redoing' : 'undoing'} window contents move: ${error.message}`);
  }
}
async function undoLastMove(lastMove) {
  await moveTabsToWindow(lastMove.targetWindowId, lastMove.sourceWindowId);
  await markMoveAsRedone(lastMove);
}
async function redoLastMove(lastMove) {
  await moveTabsToWindow(lastMove.sourceWindowId, lastMove.targetWindowId);
  await markMoveAsUndone(lastMove);
}

// This is where the real action takes place. Moving tabs.
async function moveTabsToWindow(sourceWindowId, targetWindowId) {
  const start = performance.now();
  // Get all tabs from source window
  const sourceTabs = await chrome.tabs.query({ windowId: sourceWindowId });
  if (sourceTabs.length === 0) return;
  // Move all tabs
  await chrome.tabs.move(sourceTabs.map(t => t.id), {
    windowId: targetWindowId,
    index: -1
  });
  await storeMove(sourceWindowId, targetWindowId);
}


// Last move state management
async function getLastMove() {
  const { lastMove } = await chrome.storage.session.get('lastMove');
  if (!lastMove) return null;

  // Check if move has timed out
  const { undoTimeout } = await chrome.storage.sync.get({ undoTimeout: 30 });
  if (undoTimeout && Date.now() - lastMove.timestamp >= undoTimeout * 1000) {
    await chrome.storage.session.remove('lastMove');
    return null;
  }

  return lastMove;
}
async function storeMove(sourceWindowId, targetWindowId) {
  await chrome.storage.session.set({
    lastMove: {
      timestamp: Date.now(),
      sourceWindowId,
      targetWindowId,
      isRedo: false
    }
  });
}
async function markMoveAsRedone(lastMove) {
  await chrome.storage.session.set({
    lastMove: { ...lastMove, isRedo: true }
  });
}
async function markMoveAsUndone(lastMove) {
  await chrome.storage.session.set({
    lastMove: { ...lastMove, isRedo: false }
  });
}


// These are helpers
async function resolveDestinationWindow(targetWindowId) {
  if (targetWindowId === 'new') {
    const newWindow = await chrome.windows.create({ focused: true });
    return newWindow.id;
  }
  return targetWindowId;
}
async function preserveWorkspaceIfEnabled(windowId) {
  if (window.settings.preserveWorkspaces) {
    await chrome.tabs.create({
      url: 'chrome://startpage',
      windowId: windowId
    });
  }
}
async function cleanupSpeedDialTabsIfEnabled(sourceWindowId, targetWindowId) {
  if (window.settings.cleanSpeedDials) {
    // Clean source window
    const sourceTabs = await chrome.tabs.query({ windowId: sourceWindowId });
    const sourceSpeedDials = sourceTabs.filter(tab => tab.url.startsWith('chrome://startpage'));
    if (sourceSpeedDials.length > 1) {
      const tabsToClose = sourceSpeedDials.slice(1).map(tab => tab.id);
      await chrome.tabs.remove(tabsToClose);
    }
    // Clean target window if it exists
    if (targetWindowId !== 'new') {
      const destTabs = await chrome.tabs.query({ windowId: targetWindowId });
      const destSpeedDials = destTabs.filter(tab => tab.url.startsWith('chrome://startpage'));
      if (destSpeedDials.length > 1) {
        const tabsToClose = destSpeedDials.slice(1).map(tab => tab.id);
        await chrome.tabs.remove(tabsToClose);
      }
    }
  }
}
function closePopupIfNeeded() {
  if (window.location.protocol === 'chrome-extension:') {
    window.close();
  }
}
async function getSettings() {
  const settings = await chrome.storage.sync.get({
    preserveWorkspaces: false,
    cleanSpeedDials: false,
    undoRedoTimeout: 30,
    enableDebugLogging: false
  });
  if (settings.enableDebugLogging) {
    debugLog('Settings retrieved:', settings);
  }
  return settings;
}
async function debugLog(...args) {
  if (window.settings.enableDebugLogging) {
    chrome.runtime.sendMessage({
      type: 'debugLog',
      args: args
    });
  }
}
