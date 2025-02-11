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
        console.log('PERFORMANCE:', ...args);
      } else {
        console.log('DEBUG:', ...args);
      }
    } else if (first?.workspaceName) {
      const workspace = `[${first.workspaceName}] `;
      console.log('TAB INFO:', workspace + (first.title || first));
    } else {
      console.log('DEBUG:', ...args);
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
