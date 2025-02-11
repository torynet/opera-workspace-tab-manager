const SPEED_DIAL_URL = 'chrome://startpage';
let workspacePreservationTabId = null;
let undoCountdownInterval = null;


// This is loading the popup
document.addEventListener("DOMContentLoaded", async () => {
  // Get settings first
  window.settings = await getSettings();
  debugLog('Settings:', window.settings);
  debugLog('LogBasics');
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

  // Add progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  div.appendChild(progressBar);

  div.addEventListener("click", async () => {
    div.classList.add('loading');
    try {
      await handleTargetWindowSelection(currentWindow, window.id);
    } finally {
      div.classList.remove('loading');
    }
  });
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
  const div = document.createElement("div");
  div.className = "new-window-option";
  div.textContent = "New Window";

  // Add progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  div.appendChild(progressBar);

  div.addEventListener("click", async () => {
    div.classList.add('loading');
    try {
      await handleTargetWindowSelection(currentWindow, 'new');
    } finally {
      div.classList.remove('loading');
    }
  });
  windowList.appendChild(div);
}
function updateUndoRedoButton() {
  const undoSection = document.getElementById('undoSection');
  const undoButton = document.querySelector('.undo-option');
  getLastMove().then(lastMove => {
    if (lastMove) {
      undoSection.style.display = 'block';
      undoButton.classList.remove('disabled');
      startUndoCountdown(lastMove, undoButton);
    } else {
      clearInterval(undoCountdownInterval);
      undoButton.classList.add('disabled');
      undoSection.style.display = 'block';
      undoButton.textContent = 'Undo';
    }
  });
}
async function startUndoCountdown(lastMove, button) {
  clearInterval(undoCountdownInterval);
  const { undoTimeout } = await chrome.storage.sync.get({ undoTimeout: 30 });
  if (!undoTimeout) {
    button.textContent = lastMove.isRedo ? 'Redo' : 'Undo';
    return;
  }
  const updateButtonText = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastMove.timestamp) / 1000);
    const remaining = Math.max(0, undoTimeout - elapsed);

    if (remaining === 0) {
      clearInterval(undoCountdownInterval);
      button.classList.add('disabled');
      button.textContent = 'Expired';
      chrome.storage.session.remove('lastMove');
    } else {
      button.textContent = `${lastMove.isRedo ? 'Redo' : 'Undo'} (${remaining}s)`;
    }
  };
  updateButtonText();
  undoCountdownInterval = setInterval(updateButtonText, 1000);
}


// Primary move handler
async function handleTargetWindowSelection(currentWindow, targetWindowId) {
  try {
    const destinationWindowId = await resolveDestinationWindow(targetWindowId);
    await preserveWorkspaceIfEnabledAndNeeded(currentWindow.id);
    const tabsToMove = await resolveTabsToMove(currentWindow.id);
    await moveTabsToWindow(currentWindow.id, tabsToMove, destinationWindowId);
    await cleanupSpeedDialTabsIfEnabled(currentWindow.id, destinationWindowId);
    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during tab movement:', error);
    alert('Error moving tabs: ' + error.message);
  }
}


// Undo/redo handling
async function handleUndoToggle() {
  const undoButton = document.querySelector('.undo-option');
  const lastMove = await getLastMove();
  if (!lastMove) return;

  try {
    undoButton.classList.add('loading');
    undoButton.textContent = lastMove.isRedo ? 'Redoing...' : 'Undoing...';

    await preserveWorkspaceIfEnabledAndNeeded(lastMove.sourceWindowId);
    await reverseLastMove(lastMove);
    await cleanupSpeedDialTabsIfEnabled(lastMove.sourceWindowId, lastMove.targetWindowId);

    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during move:', error);
    alert(`Error ${lastMove.isRedo ? 'redoing' : 'undoing'} window contents move: ${error.message}`);
    undoButton.classList.remove('loading');
    updateUndoRedoButton();
  }
}
async function reverseLastMove(lastMove) {
  const tabsToMove = await resolveTabsToMove(lastMove.isRedo ? lastMove.sourceWindowId : lastMove.targetWindowId);
  await moveTabsToWindow(
    lastMove.isRedo ? lastMove.sourceWindowId : lastMove.targetWindowId,
    tabsToMove,
    lastMove.isRedo ? lastMove.targetWindowId : lastMove.sourceWindowId
  );
  await chrome.storage.session.set({
    lastMove: {
      ...lastMove,
      isRedo: !lastMove.isRedo,
      timestamp: Date.now()
    }
  });
}


// This is where the real action takes place. Selecting & moving tabs.
async function resolveTabsToMove(sourceWindowId) {
  const sourceTabs = await chrome.tabs.query({ windowId: sourceWindowId });
  return sourceTabs.filter(tab =>
    tab.id !== workspacePreservationTabId
    &&
    (window.settings.ignoreSpeedDials ? !tab.url.startsWith(SPEED_DIAL_URL) : true)
  );
}
async function moveTabsToWindow(sourceWindowId, tabsToMove, targetWindowId) {
  if (tabsToMove.length === 0) return;
  await chrome.tabs.move(tabsToMove.map(t => t.id), {
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


// These are helpers
async function resolveDestinationWindow(targetWindowId) {
  if (targetWindowId === 'new') {
    const newWindow = await chrome.windows.create({ focused: true });
    return newWindow.id;
  }
  return targetWindowId;
}
async function preserveWorkspaceIfEnabledAndNeeded(windowId) {
  if (window.settings.preserveWorkspaces) {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    const hasSpeedDial = tabs.some(tab => tab.url.startsWith(SPEED_DIAL_URL));
    if (!hasSpeedDial) {
      const tab = await chrome.tabs.create({
        url: SPEED_DIAL_URL,
        windowId: windowId
      });
      workspacePreservationTabId = tab.id;
    }
  }
}
async function cleanupSpeedDialTabsIfEnabled(sourceWindowId, targetWindowId) {
  if (window.settings.cleanSpeedDials) {
    const sourceTabs = await chrome.tabs.query({ windowId: sourceWindowId });
    const sourceSpeedDials = sourceTabs.filter(tab =>
      tab.url.startsWith(SPEED_DIAL_URL) &&
      tab.id !== workspacePreservationTabId
    );
    if (sourceSpeedDials.length > 1) {
      const tabsToClose = sourceSpeedDials.slice(1).map(tab => tab.id);
      await chrome.tabs.remove(tabsToClose);
    }
    if (targetWindowId !== 'new') {
      const destTabs = await chrome.tabs.query({ windowId: targetWindowId });
      const destSpeedDials = destTabs.filter(tab =>
        tab.url.startsWith(SPEED_DIAL_URL) &&
        tab.id !== workspacePreservationTabId
      );
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
    ignoreSpeedDials: true,
    cleanSpeedDials: false,
    undoRedoTimeout: 30,
    debugMode: false
  });
  console.log('Settings retrieved:', settings);
  return settings;
}
async function debugLog(...args) {
  if (window.settings.debugMode) {
    chrome.runtime.sendMessage({
      type: 'debugLog',
      args: args
    });
  }
}
