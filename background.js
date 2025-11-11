// Service worker lifecycle - no persistent memory
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started');
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  // Always load rules fresh from storage to handle service worker sleep/wake cycles
  const result = await chrome.storage.sync.get(['rules']);
  const rules = result.rules || [];
  
  if (rules.length === 0) return;
  
  const url = new URL(details.url);
  
  for (const rule of rules) {
    // Skip disabled rules
    if (rule.enabled === false) continue;
    
    const fromPattern = normalizeUrl(rule.from);
    const urlHost = normalizeUrl(url.hostname);
    
    if (matchesPattern(urlHost, fromPattern)) {
      let redirectUrl;
      
      if (rule.preservePath) {
        const toUrl = normalizeUrl(rule.to);
        redirectUrl = `${url.protocol}//${toUrl}${url.pathname}${url.search}${url.hash}`;
      } else {
        const toUrl = normalizeUrl(rule.to);
        redirectUrl = `${url.protocol}//${toUrl}`;
      }
      
      console.log('Redirecting:', url.href, '->', redirectUrl);
      
      // Track usage statistics
      trackRuleUsage(rule.id);
      
      chrome.tabs.update(details.tabId, { url: redirectUrl });
      break;
    }
  }
});

function normalizeUrl(url) {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
}

function matchesPattern(url, pattern) {
  // Convert wildcard pattern to regex
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    return new RegExp('^' + regexPattern + '$').test(url);
  }
  
  // Fallback to original matching logic
  return url.includes(pattern) || pattern.includes(url);
}

function trackRuleUsage(ruleId) {
  chrome.storage.local.get(['ruleStats'], (result) => {
    const stats = result.ruleStats || {};
    const today = new Date().toDateString();
    
    if (!stats[ruleId]) {
      stats[ruleId] = { count: 0, lastUsed: today };
    }
    
    stats[ruleId].count++;
    stats[ruleId].lastUsed = today;
    
    chrome.storage.local.set({ ruleStats: stats });
  });
}
