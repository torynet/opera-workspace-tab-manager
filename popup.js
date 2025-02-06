document.addEventListener("DOMContentLoaded", async () => {
  const windowList = document.getElementById("windowList");
  const windows = await chrome.windows.getAll({ populate: true });
  const currentWindow = await chrome.windows.getCurrent();
  console.log('All windows:', windows);
  console.log('Current window:', currentWindow);

  populateWindowList(windowList, windows, currentWindow);
  addNewWindowOption(windowList, currentWindow);
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

async function moveTabsToWindow(currentWindow, targetWindowId) {
  const currentTabs = await chrome.tabs.query({ windowId: currentWindow.id });
  const tabsToMove = await getTabsToMove(currentTabs);
  if (tabsToMove.length === 0) return;
  if (targetWindowId === 'new') {
    const newWindow = await chrome.windows.create({
      focused: true,
    });
    targetWindowId = newWindow.id;
  }
  const tabIds = tabsToMove.map(tab => tab.id);
  await chrome.tabs.move(tabIds, {
    windowId: targetWindowId,
    index: -1,
  });
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
