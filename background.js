let rules = [];

chrome.runtime.onInstalled.addListener(() => {
  loadRules();
});

chrome.runtime.onStartup.addListener(() => {
  loadRules();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'rulesUpdated') {
    loadRules();
  }
});

function loadRules() {
  chrome.storage.sync.get(['rules'], (result) => {
    rules = result.rules || [];
    console.log('Loaded rules:', rules);
  });
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  
  const url = new URL(details.url);
  
  for (const rule of rules) {
    const fromPattern = normalizeUrl(rule.from);
    const urlHost = normalizeUrl(url.hostname);
    
    if (urlHost.includes(fromPattern) || fromPattern.includes(urlHost)) {
      let redirectUrl;
      
      if (rule.preservePath) {
        const toUrl = normalizeUrl(rule.to);
        redirectUrl = `${url.protocol}//${toUrl}${url.pathname}${url.search}${url.hash}`;
      } else {
        const toUrl = normalizeUrl(rule.to);
        redirectUrl = `${url.protocol}//${toUrl}`;
      }
      
      console.log('Redirecting:', url.href, '->', redirectUrl);
      chrome.tabs.update(details.tabId, { url: redirectUrl });
      break;
    }
  }
});

function normalizeUrl(url) {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
}
