// Start by checking debug mode before logging APIs
chrome.storage.sync.get({ debugMode: false }, ({ debugMode }) => {
  if (debugMode) {
    logAvailableAPIs();
  }
});

async function debugLog(...args) {
  const { debugMode } = await chrome.storage.sync.get({ debugMode: false });
  if (debugMode) {
    const [first, ...rest] = args;
    if (typeof first === 'string' && first.includes('took:')) {
      console.log('PERFORMANCE:', ...args);
    } else {
      const workspace = first.workspaceName ? `[${first.workspaceName}] ` : '';
      console.log('TAB INFO:', workspace + (first.title || first));
    }
  }
}

function logAvailableAPIs() {
  console.log('Available chrome APIs:', Object.keys(chrome));
  if (typeof opera !== 'undefined') {
    console.log('Available opera APIs:', Object.keys(opera));
  }
}

chrome.tabs.onActivated.addListener(async (tab) => {
  const currTab = await chrome.tabs.get(tab.tabId);
  await debugLog(currTab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'debugLog') {
    debugLog(...message.args);
  }
});
