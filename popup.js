import { SPEED_DIAL_URL, getSpeedDialTabs } from './shared.js';
let workspacePreservationTabId = null;
let undoCountdownInterval = null;


// This is loading the popup
document.addEventListener("DOMContentLoaded", async () => {
  // Get options first
  window.options = await getOptions();
  debugLog('Options:', window.options);
  debugLog('LogWindowInfo');
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


// UI Updates
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
    await focusDestinationIfEnabled(destinationWindowId);
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
    const { sourceWindowId, destinationWindowId } = determineUndoRedoSourceAndDestinationWindowIds(lastMove);
    await preserveWorkspaceIfEnabledAndNeeded(sourceWindowId);
    await reverseLastMove(lastMove);
    await focusDestinationIfEnabled(destinationWindowId);
    await cleanupSpeedDialTabsIfEnabled(sourceWindowId, destinationWindowId);
    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during move:', error);
    alert(`Error ${lastMove.isRedo ? 'redoing' : 'undoing'} window contents move: ${error.message}`);
    undoButton.classList.remove('loading');
    updateUndoRedoButton();
  }
}
function determineUndoRedoSourceAndDestinationWindowIds(lastMove) {
  return {
    sourceWindowId: lastMove.isRedo ? lastMove.sourceWindowId : lastMove.targetWindowId,
    destinationWindowId: lastMove.isRedo ? lastMove.targetWindowId : lastMove.sourceWindowId
  };
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
  try {
    const sourceTabs = await chrome.tabs.query({ windowId: sourceWindowId });
    return sourceTabs.filter(tab =>
      tab.id !== workspacePreservationTabId
      &&
      (window.options.ignoreSpeedDials ? !tab.url.startsWith(SPEED_DIAL_URL) : true)
    );
  } catch (error) {
    debugLog('Error in resolveTabsToMove:', error);
    debugLog('Could not resolve tabs to move.');
    throw error;
  }
}
async function moveTabsToWindow(sourceWindowId, tabsToMove, targetWindowId) {
  try {
    debugLog('Moving tabs to window:', tabsToMove);
    if (tabsToMove.length === 0) return;
    await chrome.tabs.move(tabsToMove.map(t => t.id), {
      windowId: targetWindowId,
      index: -1
    });
    await storeMove(sourceWindowId, targetWindowId);
    debugLog('Moved tabs to window:', tabsToMove);
    return;
  } catch (error) {
    debugLog('Error in moveTabsToWindow:', error);
    debugLog('Tabs not moved.');
    throw error;
  }
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
  debugLog('Store move:', { sourceWindowId, targetWindowId });
  try {
    const moveData = {
      lastMove: {
        timestamp: Date.now(),
        sourceWindowId,
        targetWindowId,
        isRedo: false
      }
    };
    await chrome.storage.session.set(moveData);
    debugLog('Move stored.');
  } catch (error) {
    debugLog('Error in storeMove:', error);
    debugLog('Failed to store move data.');
    throw error;
  }
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
  try {
    debugLog('Preserve workspace?');
    if (!await shouldCreatePreservationTab(windowId)) return;
    await createPreservationTab(windowId);
  } catch (error) {
    debugLog('Error in preserveWorkspaceIfEnabledAndNeeded:', error);
    debugLog('Workspace preservation tab creation failed.');
    throw error;
  }
}
async function shouldCreatePreservationTab(windowId) {
  if (!window.options.preserveWorkspaces) return false;
  // If there is no existing speed dial, create a preservation tab.
  if (!await hasSpeedDial(windowId)) return true;
  // If we're not ignoring speed dials, create a preservation tab.
  return !window.options.ignoreSpeedDials;
}
function hasSpeedDial(windowId) {
  return getSpeedDialTabs(windowId).then(hasTabs);
}
function hasTabs(tabs) {
  return tabs.length > 0;
}
async function createPreservationTab(windowId) {
  const tab = await chrome.tabs.create({
    url: SPEED_DIAL_URL,
    windowId: windowId,
    active: false
  });
  workspacePreservationTabId = tab.id;
  debugLog('Created preservation tab:', tab.id);
}
async function cleanupSpeedDialTabsIfEnabled(sourceWindowId, destinationWindowId) {
    if (!window.options.cleanSpeedDials) return;
    const success = await chrome.runtime.sendMessage({
      type: 'cleanupSpeedDials',
      sourceWindowId,
      destinationWindowId,
      options: window.options
    });
}
function closePopupIfNeeded() {
  try {
    if (window.location.protocol === 'chrome-extension:') {
      debugLog('Closing popup');
      window.close();
    }
  } catch (error) {
    debugLog('Error in closePopupIfNeeded:', error);
    debugLog('Popup not closed.');
    throw error;
  }
}
async function focusDestinationIfEnabled(windowId) {
  try {
    if (window.options.focusDestination) {
        debugLog('Focusing destination');
        await chrome.windows.update(windowId, { focused: true });
    }
  } catch (error) {
    debugLog('Error in focusDestinationIfEnabled:', error);
    debugLog('Destination window not focused.');
    throw error;
  }
}
async function getOptions() {
  const options = await chrome.storage.sync.get({
    preserveWorkspaces: false,
    ignoreSpeedDials: true,
    cleanSpeedDials: false,
    focusDestination: true,
    undoRedoTimeout: 30,
    debugMode: false
  });
  console.log('Options retrieved:', options);
  return options;
}
function debugLog(...args) {
  if (window.options.debugMode) {
    chrome.runtime.sendMessage({
      type: 'debugLog',
      args: args
    });
  }
}
