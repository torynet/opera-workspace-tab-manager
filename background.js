// Cache debug settings at startup
let debugMode = false;

// Initialize on load
initDebugSettings();
logBasics();

// Listen for settings changes
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
    if (first === 'LogBasics') {
      logBasics();
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
async function initDebugSettings() {
  const { debugMode: mode } = await chrome.storage.sync.get({ debugMode: false });
  debugMode = mode;
}
async function logBasics(){
  if (!debugMode) return;
  logAvailableAPIs();
  logWindowInfo();
}
function logAvailableAPIs() {
  console.log('Available chrome APIs:', Object.keys(chrome));
  if (typeof opera !== 'undefined') {
    console.log('Available opera APIs:', Object.keys(opera));
  }
}
async function logWindowInfo(){
  const currWindow = await chrome.windows.getCurrent();
  debugLog('Current window:', currWindow);
}
