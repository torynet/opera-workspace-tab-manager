import { SPEED_DIAL_URL, getSpeedDialTabs } from './shared.js';
// Cache debug options at startup
let debugMode = false;

// Initialize on load
initDebugOption();
logWindowInfo();

// Listen for options changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.debugMode) {
    debugMode = changes.debugMode.newValue;
  }
});

// Listen for events
chrome.tabs.onActivated.addListener(async (tab) => {
  const currTab = await chrome.tabs.get(tab.tabId);
  await debugLog(currTab);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'debugLog') {
    debugLog(...message.args);
  }
  if (message.type === 'cleanupSpeedDials') {
    cleanupSpeedDials(message.sourceWindowId, message.destinationWindowId, message.options)
      .then(() => sendResponse(true))
      .catch(error => {
        console.error('Cleanup error:', error);
        sendResponse(false);
      });
    return true; // Keep message channel open for async response
  }
});

// Actually log
async function debugLog(...args) {
  if (debugMode) {
    const [first, ...rest] = args;

    // Handle special commands first
    if (first === 'LogWindowInfo') {
      logWindowInfo();
      return;
    }

    // Handle different types of logs
    if (typeof first === 'string') {
      if (first.includes('took:')) {
        console.log('PERFORMANCE:', first, ...rest);
      } else {
        console.log('DEBUG:', first, ...rest);
      }
    } else if (first?.workspaceName) {
      const workspace = `[${first.workspaceName}] `;
      console.log('TAB INFO:', workspace + (first.title || first));
    } else {
      console.log('DEBUG:', first, ...rest);
    }
  }
}

// Helpers
async function initDebugOption() {
  const { debugMode: mode } = await chrome.storage.sync.get({ debugMode: false });
  debugMode = mode;
}
async function logWindowInfo(){
  if (!debugMode) return;
  const currWindow = await chrome.windows.getCurrent();
  debugLog('Current window:', currWindow);
}

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'wtm-docs',
    title: 'Documentation',
    contexts: ['action'],  // 'action' means extension icon context menu
    type: 'normal'
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'wtm-docs') {
    // Open the user guide in a new tab
    chrome.tabs.create({
      url: 'https://torynet.github.io/opera-workspace-tab-manager/usage/'
    });
  }
});

async function cleanupSpeedDials(sourceWindowId, destinationWindowId, options) {
  try {
    if (!options.cleanSpeedDials) return;
    debugLog('Cleanup Speed-Dial Tabs');
    const sourceSpeedDials = await getSpeedDialTabs(sourceWindowId);
    const destSpeedDials = await getSpeedDialTabs(destinationWindowId);
    const tabIdsToClose = [
      ...sourceSpeedDials.slice(1),
      ...destSpeedDials.slice(1)
    ].map(tab => tab.id);
    debugLog('Cleanup: Tab IDs to close:', tabIdsToClose);
    if (tabIdsToClose.length > 0) {
      await chrome.tabs.remove(tabIdsToClose);
      debugLog('Cleanup: Tabs closed');
    } else {
      debugLog('Cleanup: No tabs to close');
    }
  } catch (error) {
    debugLog('Error in cleanupSpeedDials:', error);
    debugLog('Cleanup failed.');
    throw error;
  }
}
