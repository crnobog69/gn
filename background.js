// Service worker lifecycle - no persistent memory
chrome.runtime.onInstalled.addListener(() => {
  updateDynamicRules();
});

chrome.runtime.onStartup.addListener(() => {
  updateDynamicRules();
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.rules || changes.fandomRedirect)) {
    updateDynamicRules();
  }
});

// Update declarativeNetRequest rules based on storage
async function updateDynamicRules() {
  const result = await chrome.storage.sync.get(['rules', 'fandomRedirect']);
  const rules = result.rules || [];
  const fandomSettings = result.fandomRedirect || { enabled: false, instance: 'phantom.crnbg.org' };
  
  const dynamicRules = [];
  let ruleId = 1;
  
  // Add Fandom redirect rule if enabled
  if (fandomSettings.enabled) {
    const cleanInstance = fandomSettings.instance.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    
    dynamicRules.push({
      id: ruleId++,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          regexSubstitution: `https://${cleanInstance}/\\1\\2`
        }
      },
      condition: {
        regexFilter: '^https?://([^/]+)\\.fandom\\.com(/.*)?$',
        resourceTypes: ['main_frame']
      }
    });
  }
  
  // Add regular rules
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    
    // Skip preservePath rules - they're handled by webNavigation.onBeforeNavigate
    if (rule.preservePath) continue;
    
    const fromPattern = normalizeUrl(rule.from);
    const toUrl = normalizeUrl(rule.to);
    
    // Handle wildcards
    let regexFilter, regexSubstitution;
    if (fromPattern.includes('*')) {
      // Wildcard pattern
      regexFilter = `^https?://${fromPattern.replace(/\./g, '\\.').replace(/\*/g, '[^/]+')}(/.*)?$`;
      regexSubstitution = rule.preservePath ? 'https://' + toUrl + '\\1' : `https://${toUrl}`;
    } else {
      // Regular pattern - use non-capturing group for www
      regexFilter = `^https?://(?:www\\.)?${fromPattern.replace(/\./g, '\\.')}(/.*)?$`;
      // Use string concatenation to ensure proper backslash handling
      regexSubstitution = rule.preservePath ? 'https://' + toUrl + '\\1' : `https://${toUrl}`;
    }
    
    const redirectRule = {
      id: ruleId++,
      priority: 2,
      action: {
        type: 'redirect',
        redirect: rule.preservePath 
          ? { regexSubstitution: regexSubstitution }
          : { url: `https://${toUrl}` }
      },
      condition: {
        regexFilter: regexFilter,
        resourceTypes: ['main_frame', 'sub_frame']
      }
    };
    
    dynamicRules.push(redirectRule);
  }
  
  // Remove all existing dynamic rules and add new ones
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(r => r.id);
  
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: dynamicRules
  });
}

// Helper function to normalize URLs
function normalizeUrl(url) {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
}

// Simple redirect handler using webNavigation (backup for complex cases)
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const url = details.url;
  const { rules = [] } = await chrome.storage.sync.get('rules');
  
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!rule.preservePath) continue; // Only handle preservePath rules here
    
    try {
      const urlObj = new URL(url);
      const urlDomain = urlObj.hostname.replace(/^www\./, '');
      const fromDomain = normalizeUrl(rule.from);
      const toDomain = normalizeUrl(rule.to);
      
      if (urlDomain === fromDomain) {
        // Simple domain replacement - keep path, query, hash
        const newUrl = url.replace(urlObj.hostname, toDomain);
        chrome.tabs.update(details.tabId, { url: newUrl });
        trackRuleUsage(rule.from, rule.to);
        return; // Stop processing
      }
    } catch (e) {
      // Silent error handling
    }
  }
});

// Track redirects using webNavigation for statistics
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const result = await chrome.storage.sync.get(['rules', 'fandomRedirect']);
  const rules = result.rules || [];
  const fandomSettings = result.fandomRedirect || { enabled: false, instance: 'phantom.crnbg.org' };
  
  let url;
  try {
    url = new URL(details.url);
  } catch (e) {
    return;
  }
  
  // Check if this is a fandom redirect result
  if (fandomSettings.enabled) {
    const cleanInstance = fandomSettings.instance.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    if (url.hostname === cleanInstance && url.pathname.match(/^\/[^/]+\//)) {
      trackFandomUsage();
      return;
    }
  }
  
  // Check if this matches any rule for tracking
  const urlHost = normalizeUrl(url.hostname);
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const toPattern = normalizeUrl(rule.to);
    if (urlHost === toPattern || urlHost.includes(toPattern)) {
      trackRuleUsage(rule.id);
      break;
    }
  }
});

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

function trackFandomUsage() {
  chrome.storage.local.get(['fandomStats'], (result) => {
    const stats = result.fandomStats || { count: 0, lastUsed: null };
    const today = new Date().toDateString();
    
    stats.count++;
    stats.lastUsed = today;
    
    chrome.storage.local.set({ fandomStats: stats });
  });
}
