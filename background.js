// Log available APIs when extension starts
logAvailableAPIs();

async function debugLog(...args) {
  const { debugMode } = await chrome.storage.sync.get({ debugMode: false });
  if (debugMode) {
    console.log(...args);
  }
}

function logAvailableAPIs() {
  console.log('Available chrome APIs:', Object.keys(chrome));
  if (typeof opera !== 'undefined') {
    console.log('Available opera APIs:', Object.keys(opera));
  }
}

chrome.tabs.onActivated.addListener(async (tab) => {
    const currTab = await chrome.tabs.get(tab.tabId)
    await debugLog({
        windowId: currTab.windowId,
        workspaceId: currTab.workspaceId,
        workspaceName: currTab.workspaceName,
        tabId: currTab.id,
        tabTitle: currTab.title,
        tabUrl: currTab.url,
        tabIndex: currTab.index,
    });
    await debugLog('Full tab object:', currTab);
    chrome.windows.onFocusChanged.addListener((windowId) => {
        if (windowId !== chrome.windows.WINDOW_ID_NONE) {
            debugLog('Window focus changed:', windowId);
            chrome.windows.get(windowId, { populate: true }, (window) => {
                debugLog('Focused window details:', window);
                debugLog('Window properties:', Object.keys(window));
            });
        }
    });
});
