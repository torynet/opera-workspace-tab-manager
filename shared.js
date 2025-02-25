export const SPEED_DIAL_URL = 'chrome://startpage';

export async function getSpeedDialTabs(windowId) {
  const tabs = await chrome.tabs.query({ windowId: windowId });
  return tabs.filter(tab => tab.url.startsWith(SPEED_DIAL_URL));
}
