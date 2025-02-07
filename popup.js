document.addEventListener("DOMContentLoaded", async () => {
  const windowList = document.getElementById("windowList");
  const windows = await chrome.windows.getAll({ populate: true });
  const currentWindow = await chrome.windows.getCurrent();
  console.log('All windows:', windows);
  console.log('Current window:', currentWindow);

  populateWindowList(windowList, windows, currentWindow);
  addNewWindowOption(windowList, currentWindow);

  // Add click handler for undo/redo button
  document.querySelector('.undo-option').addEventListener('click', toggleMove);

  // Show/hide undo button and set correct text
  updateUndoRedoButton();
});

function populateWindowList(windowList, windows, currentWindow) {
  let displayIndex = 0;
  windows.forEach((window) => {
    if (shouldDisplayWindow(window, currentWindow)) {
      const windowOption = createWindowOption(window, currentWindow, ++displayIndex);
      windowList.appendChild(windowOption);
    }
  });
}

function createWindowOption(window, currentWindow, index) {
  const div = document.createElement("div");
  div.className = "window-option";
  div.title = createTabTitlesList(window);
  const tabCount = window.tabs.length;
  div.textContent = `${index}. ${getWindowDisplayName(window)} (${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'})`;
  div.addEventListener("click", () =>
    handleTabMove(currentWindow, window.id)
  );
  return div;
}

async function getTabsToMove(tabs) {
  const { leaveSpeedDial } = await chrome.storage.sync.get({ leaveSpeedDial: true });
  if (leaveSpeedDial) {
    return tabs.filter(tab => !tab.url.startsWith('chrome://startpage'));
  }
  return tabs;
}

async function storeTabState(tabs, targetWindowId) {
  const state = {
    timestamp: Date.now(),
    moves: tabs.map(tab => ({
      tabId: tab.id,
      sourceWindow: tab.windowId,
      sourceIndex: tab.index,
      targetWindow: targetWindowId,
      targetIndex: -1
    })),
    isRedo: false
  };
  await chrome.storage.session.set({ lastMove: state });
}

async function moveTabsToWindow(currentWindow, targetWindowId, tabIds) {
  const start = performance.now();

  // If no tabIds provided, query for tabs to move
  if (!tabIds) {
    const queryStart = performance.now();
    const currentTabs = await chrome.tabs.query({ windowId: currentWindow.id });
    const tabsToMove = await getTabsToMove(currentTabs);
    await debugLog('Query tabs took:', performance.now() - queryStart, 'ms');

    if (tabsToMove.length === 0) return;

    // Check if we need to preserve the workspace
    const { preserveWorkspaces } = await chrome.storage.sync.get({ preserveWorkspaces: false });
    if (preserveWorkspaces && tabsToMove.length === currentTabs.length) {
      // Create a speed dial tab in the source window
      await chrome.tabs.create({
        url: 'chrome://startpage',
        windowId: currentWindow.id
      });
    }

    tabIds = tabsToMove.map(tab => tab.id);

    // Store state for undo/redo in parallel with move
    const storeStart = performance.now();
    storeTabState(tabsToMove, targetWindowId)  // Don't await here
      .then(() => debugLog('Store state took:', performance.now() - storeStart, 'ms'));
  }

  const moveStart = performance.now();
  if (targetWindowId === 'new') {
    const newWindow = await chrome.windows.create({
      focused: true,
    });
    targetWindowId = newWindow.id;
  }

  await chrome.tabs.move(tabIds, {
    windowId: targetWindowId,
    index: -1,
  });
  await debugLog('Move tabs took:', performance.now() - moveStart, 'ms');
  await debugLog('Total operation took:', performance.now() - start, 'ms');
}

async function handleTabMove(currentWindow, targetWindowId) {
  try {
    await moveTabsToWindow(currentWindow, targetWindowId);
    closePopupIfNeeded();
  } catch (error) {
    console.error('Error during tab movement:', error);
    alert('Error moving tabs: ' + error.message);
  }
}

async function cleanupSpeedDialTabs(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const speedDialTabs = tabs.filter(tab => tab.url.startsWith('chrome://startpage'));

  // If there are multiple speed dial tabs, keep only the first one
  if (speedDialTabs.length > 1) {
    const tabsToClose = speedDialTabs.slice(1).map(tab => tab.id);
    await chrome.tabs.remove(tabsToClose);
  }
}

function closePopupIfNeeded() {
  if (window.location.protocol === 'chrome-extension:') {
    window.close();
  }
}

function shouldDisplayWindow(window, currentWindow) {
  return  window.id !== currentWindow.id &&
          window.type === "normal" &&
          !window.incognito;
}

function getWindowDisplayName(window) {
  const firstTab = window.tabs[0];
  return firstTab?.workspaceName
    ? `${firstTab.workspaceName}`
    : `${window.id}`;
}

function createTabTitlesList(window) {
  return window.tabs
    .map(tab => `\u2022 ${tab.title}`)
    .join('\n');
}

function addNewWindowOption(windowList, currentWindow) {
  const newWindowDiv = document.createElement("div");
  newWindowDiv.className = "new-window-option";
  newWindowDiv.textContent = "New Window";
  newWindowDiv.addEventListener("click", () =>
    handleTabMove(currentWindow, 'new')
  );
  windowList.appendChild(newWindowDiv);
}

async function toggleMove() {
  const { lastMove } = await chrome.storage.session.get('lastMove');
  if (!lastMove) return;

  const start = performance.now();
  const getStart = performance.now();
  await debugLog('Get state took:', performance.now() - getStart, 'ms');

  try {
    const tabIds = lastMove.moves.map(move => move.tabId);
    const targetWindowId = lastMove.isRedo ? lastMove.moves[0].targetWindow : lastMove.moves[0].sourceWindow;

    // Use the same move mechanism
    await moveTabsToWindow(null, targetWindowId, tabIds);

    // Update undo/redo state
    const updateStart = performance.now();
    await chrome.storage.session.set({
      lastMove: { ...lastMove, isRedo: !lastMove.isRedo }
    });
    await debugLog('Update storage took:', performance.now() - updateStart, 'ms');

    updateUndoRedoButton();
  } catch (error) {
    console.error('Error during move:', error);
    alert(`Error ${lastMove.isRedo ? 'redoing' : 'undoing'} move: ${error.message}`);
  }
}

function updateUndoRedoButton() {
  chrome.storage.sync.get({ undoTimeout: 30 }, async ({ undoTimeout }) => {
    const { lastMove } = await chrome.storage.session.get('lastMove');
    const undoSection = document.getElementById('undoSection');
    const undoButton = document.querySelector('.undo-option');

    // Check if we have a valid state that hasn't timed out
    const isValid = lastMove && (!undoTimeout || (Date.now() - lastMove.timestamp < undoTimeout * 1000));

    if (isValid) {
      undoSection.style.display = 'block';
      undoButton.classList.remove('disabled');
      undoButton.textContent = lastMove.isRedo ? 'Redo' : 'Undo';
    } else {
      // Clear old state if it exists
      if (lastMove) {
        chrome.storage.session.remove('lastMove');
      }
      undoButton.classList.add('disabled');
      undoSection.style.display = 'block';
      undoButton.textContent = 'Undo';
    }
  });
}

async function debugLog(...args) {
  chrome.runtime.sendMessage({
    type: 'debugLog',
    args: args
  });
}
