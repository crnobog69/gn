document.addEventListener('DOMContentLoaded', () => {
  const fromUrlInput = document.getElementById('fromUrl');
  const toUrlInput = document.getElementById('toUrl');
  const preservePathCheckbox = document.getElementById('preservePath');
  const addBtn = document.getElementById('addBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const rulesList = document.getElementById('rulesList');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const toggleBtn = document.getElementById('toggleBtn');
  const rulesHeader = document.getElementById('rulesHeader');
  const rulesCount = document.getElementById('rulesCount');
  const rulesSection = document.querySelector('.rules-section');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const statsBtn = document.getElementById('statsBtn');
  const statsModal = document.getElementById('statsModal');
  const closeStats = document.getElementById('closeStats');
  const statsContent = document.getElementById('statsContent');
  const bulkToolbar = document.getElementById('bulkToolbar');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const bulkEnableBtn = document.getElementById('bulkEnableBtn');
  const bulkDisableBtn = document.getElementById('bulkDisableBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const templatesBtn = document.getElementById('templatesBtn');
  const templatesModal = document.getElementById('templatesModal');
  const closeTemplates = document.getElementById('closeTemplates');
  const templatesContent = document.getElementById('templatesContent');
  
  let editingRuleId = null;
  let collapsedRules = new Set();
  let sectionCollapsed = false;
  let currentSearchTerm = '';
  let selectedRules = new Set();

  const ruleTemplates = [
    {
      title: 'YouTube → Invidious',
      description: 'Privacy-focused YouTube alternative',
      example: 'youtube.com → invidious.snopyta.org',
      from: 'youtube.com',
      to: 'invidious.snopyta.org',
      category: 'social',
      preservePath: true
    },
    {
      title: 'Twitter → Nitter',
      description: 'Privacy-focused Twitter alternative',
      example: 'twitter.com → nitter.net',
      from: 'twitter.com',
      to: 'nitter.net',
      category: 'social',
      preservePath: true
    },
    {
      title: 'Reddit → Libreddit',
      description: 'Privacy-focused Reddit alternative',
      example: 'reddit.com → libreddit.de',
      from: 'reddit.com',
      to: 'libreddit.de',
      category: 'social',
      preservePath: true
    },
    {
      title: 'Instagram → Bibliogram',
      description: 'Privacy-focused Instagram alternative',
      example: 'instagram.com → bibliogram.art',
      from: 'instagram.com',
      to: 'bibliogram.art',
      category: 'social',
      preservePath: true
    },
    {
      title: 'Google → DuckDuckGo',
      description: 'Privacy-focused search engine',
      example: 'google.com → duckduckgo.com',
      from: 'google.com',
      to: 'duckduckgo.com',
      category: 'other',
      preservePath: false
    },
    {
      title: 'Medium → Scribe',
      description: 'Privacy-focused Medium alternative',
      example: 'medium.com → scribe.rip',
      from: 'medium.com',
      to: 'scribe.rip',
      category: 'news',
      preservePath: true
    }
  ];

  loadRules();
  loadCollapsedState();

  addBtn.addEventListener('click', () => {
    if (editingRuleId !== null) {
      updateRule();
    } else {
      addRule();
    }
  });

  cancelBtn.addEventListener('click', cancelEdit);
  exportBtn.addEventListener('click', exportRules);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importRules);
  rulesHeader.addEventListener('click', toggleSection);
  searchInput.addEventListener('input', handleSearch);
  statsBtn.addEventListener('click', showStats);
  closeStats.addEventListener('click', hideStats);
  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) hideStats();
  });
  selectAllCheckbox.addEventListener('change', toggleSelectAll);
  bulkEnableBtn.addEventListener('click', () => bulkToggleRules(true));
  bulkDisableBtn.addEventListener('click', () => bulkToggleRules(false));
  bulkDeleteBtn.addEventListener('click', bulkDeleteRules);
  templatesBtn.addEventListener('click', showTemplates);
  closeTemplates.addEventListener('click', hideTemplates);
  templatesModal.addEventListener('click', (e) => {
    if (e.target === templatesModal) hideTemplates();
  });

  // Add double-click on rules header to clear all
  rulesHeader.addEventListener('dblclick', (e) => {
    if (confirm('Delete all rules? This cannot be undone.')) {
      chrome.storage.sync.set({ rules: [] }, () => {
        collapsedRules.clear();
        saveCollapsedState();
        loadRules();
        notifyBackgroundScript();
        showNotification('all rules deleted');
      });
    }
  });

  function addRule() {
    const from = fromUrlInput.value.trim();
    const to = toUrlInput.value.trim();
    const preservePath = preservePathCheckbox.checked;
    const category = categorySelect.value;

    if (!from || !to) {
      alert('Please fill in both URLs');
      return;
    }

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      rules.push({ from, to, preservePath, enabled: true, category, id: Date.now() });
      
      chrome.storage.sync.set({ rules }, () => {
        resetForm();
        loadRules();
        notifyBackgroundScript();
      });
    });
  }

  function updateRule() {
    const from = fromUrlInput.value.trim();
    const to = toUrlInput.value.trim();
    const preservePath = preservePathCheckbox.checked;
    const category = categorySelect.value;

    if (!from || !to) {
      alert('Please fill in both URLs');
      return;
    }

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.map(rule => 
        rule.id === editingRuleId 
          ? { ...rule, from, to, preservePath, category }
          : rule
      );
      
      chrome.storage.sync.set({ rules }, () => {
        resetForm();
        loadRules();
        notifyBackgroundScript();
      });
    });
  }

  function editRule(id) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rule = result.rules.find(r => r.id === id);
      if (rule) {
        editingRuleId = id;
        fromUrlInput.value = rule.from;
        toUrlInput.value = rule.to;
        preservePathCheckbox.checked = rule.preservePath;
        categorySelect.value = rule.category || '';
        addBtn.textContent = 'update';
        cancelBtn.style.display = 'block';
        fromUrlInput.focus();
      }
    });
  }

  function cancelEdit() {
    resetForm();
  }

  function resetForm() {
    editingRuleId = null;
    fromUrlInput.value = '';
    toUrlInput.value = '';
    preservePathCheckbox.checked = false;
    categorySelect.value = '';
    addBtn.textContent = 'add';
    cancelBtn.style.display = 'none';
  }

  function copyRule(id) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rule = result.rules.find(r => r.id === id);
      if (rule) {
        const ruleData = JSON.stringify({
          from: rule.from,
          to: rule.to,
          preservePath: rule.preservePath
        });
        navigator.clipboard.writeText(ruleData).then(() => {
          showNotification('rule copied');
        });
      }
    });
  }

  function pasteRule() {
    navigator.clipboard.readText().then(text => {
      try {
        const rule = JSON.parse(text);
        if (rule.from && rule.to) {
          fromUrlInput.value = rule.from;
          toUrlInput.value = rule.to;
          preservePathCheckbox.checked = rule.preservePath || false;
          fromUrlInput.focus();
          showNotification('rule pasted');
        } else {
          showNotification('invalid format');
        }
      } catch (e) {
        showNotification('invalid clipboard');
      }
    });
  }

  function exportRules() {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      const dataStr = JSON.stringify(rules, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gn-rules-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('exported');
    });
  }

  function importRules(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedRules = JSON.parse(e.target.result);
        if (!Array.isArray(importedRules)) {
          showNotification('invalid file');
          return;
        }

        chrome.storage.sync.get(['rules'], (result) => {
          const existingRules = result.rules || [];
          const timestamp = Date.now();
          const newRules = importedRules.map((rule, index) => ({
            from: rule.from,
            to: rule.to,
            preservePath: rule.preservePath || false,
            enabled: rule.enabled !== false,
            id: timestamp + index
          }));
          const allRules = [...existingRules, ...newRules];
          
          chrome.storage.sync.set({ rules: allRules }, () => {
            loadRules();
            notifyBackgroundScript();
            showNotification(`imported ${newRules.length} rule(s)`);
          });
        });
      } catch (e) {
        showNotification('error reading file');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  }

  function toggleSection() {
    sectionCollapsed = !sectionCollapsed;
    if (sectionCollapsed) {
      rulesSection.classList.add('collapsed');
    } else {
      rulesSection.classList.remove('collapsed');
    }
    chrome.storage.local.set({ sectionCollapsed });
  }

  function toggleCollapse(id) {
    if (collapsedRules.has(id)) {
      collapsedRules.delete(id);
    } else {
      collapsedRules.add(id);
    }
    saveCollapsedState();
    loadRules();
  }

  function toggleRuleEnabled(id) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.map(rule => 
        rule.id === id 
          ? { ...rule, enabled: !rule.enabled }
          : rule
      );
      
      chrome.storage.sync.set({ rules }, () => {
        loadRules();
        notifyBackgroundScript();
        const rule = rules.find(r => r.id === id);
        showNotification(rule.enabled ? 'rule enabled' : 'rule disabled');
      });
    });
  }

  function saveCollapsedState() {
    chrome.storage.local.set({ 
      collapsedRules: Array.from(collapsedRules),
      sectionCollapsed
    });
  }

  function loadCollapsedState() {
    chrome.storage.local.get(['collapsedRules', 'sectionCollapsed'], (result) => {
      collapsedRules = new Set(result.collapsedRules || []);
      sectionCollapsed = result.sectionCollapsed || false;
      if (sectionCollapsed) {
        rulesSection.classList.add('collapsed');
      }
    });
  }

  function handleSearch() {
    currentSearchTerm = searchInput.value.toLowerCase();
    loadRules();
  }

  function matchesSearch(rule) {
    if (!currentSearchTerm) return true;
    return rule.from.toLowerCase().includes(currentSearchTerm) ||
           rule.to.toLowerCase().includes(currentSearchTerm);
  }

  function loadRules() {
    chrome.storage.sync.get(['rules'], (result) => {
      const allRules = result.rules || [];
      const filteredRules = allRules.filter(matchesSearch);
      
      // Update count to show filtered/total
      rulesCount.textContent = currentSearchTerm ? 
        `${filteredRules.length}/${allRules.length}` : 
        allRules.length;
      
      if (filteredRules.length === 0) {
        const message = currentSearchTerm ? 'no matching rules' : 'no rules yet';
        rulesList.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
      }

      rulesList.innerHTML = filteredRules.map(rule => {
        const isCollapsed = collapsedRules.has(rule.id);
        const isEnabled = rule.enabled !== false;
        return `
        <div class="rule-item ${isCollapsed ? 'collapsed' : ''} ${!isEnabled ? 'disabled' : ''}" data-id="${rule.id}">
          <div class="rule-header" data-id="${rule.id}">
            <div class="rule-title">
              <label class="checkbox-label rule-checkbox">
                <input type="checkbox" class="rule-select" data-id="${rule.id}" ${selectedRules.has(rule.id) ? 'checked' : ''} />
                <span class="checkbox-custom"></span>
              </label>
              <span class="collapse-icon">▼</span>
              <span class="rule-from">${escapeHtml(rule.from)}</span>
              <span class="rule-arrow">→</span>
              <span class="rule-to">${escapeHtml(rule.to)}</span>
              ${rule.category ? `<span class="category-tag category-${rule.category}">${rule.category}</span>` : ''}
            </div>
            <div class="rule-toggle ${isEnabled ? 'active' : ''}" data-id="${rule.id}"></div>
          </div>
          <div class="rule-content">
            ${rule.preservePath ? '<span class="rule-badge">path</span>' : '<span></span>'}
            <div class="rule-actions">
              <button class="copy-btn" data-id="${rule.id}">copy</button>
              <button class="edit-btn" data-id="${rule.id}">edit</button>
              <button class="delete-btn" data-id="${rule.id}">del</button>
            </div>
          </div>
        </div>
      `}).join('');

      document.querySelectorAll('.rule-header').forEach(header => {
        header.addEventListener('click', (e) => {
          if (!e.target.classList.contains('rule-toggle')) {
            const id = parseInt(e.currentTarget.dataset.id);
            toggleCollapse(id);
          }
        });
      });

      document.querySelectorAll('.rule-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(e.target.dataset.id);
          toggleRuleEnabled(id);
        });
      });

      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(e.target.dataset.id);
          copyRule(id);
        });
      });

      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(e.target.dataset.id);
          editRule(id);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(e.target.dataset.id);
          deleteRule(id);
        });
      });

      document.querySelectorAll('.rule-select').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          const id = parseInt(e.target.dataset.id);
          if (e.target.checked) {
            selectedRules.add(id);
          } else {
            selectedRules.delete(id);
          }
          updateBulkToolbar();
        });
      });
      
      updateBulkToolbar();
    });
  }

  function updateBulkToolbar() {
    const hasSelected = selectedRules.size > 0;
    bulkToolbar.style.display = hasSelected ? 'flex' : 'none';
    selectAllCheckbox.checked = selectedRules.size > 0;
  }

  function toggleSelectAll() {
    chrome.storage.sync.get(['rules'], (result) => {
      const allRules = result.rules || [];
      const filteredRules = allRules.filter(matchesSearch);
      
      if (selectAllCheckbox.checked) {
        filteredRules.forEach(rule => selectedRules.add(rule.id));
      } else {
        selectedRules.clear();
      }
      loadRules();
    });
  }

  function bulkToggleRules(enable) {
    if (selectedRules.size === 0) return;
    
    const count = selectedRules.size;
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.map(rule => 
        selectedRules.has(rule.id) 
          ? { ...rule, enabled: enable }
          : rule
      );
      
      chrome.storage.sync.set({ rules }, () => {
        selectedRules.clear();
        loadRules();
        notifyBackgroundScript();
        showNotification(`${count} rules ${enable ? 'enabled' : 'disabled'}`);
      });
    });
  }

  function bulkDeleteRules() {
    if (selectedRules.size === 0) return;
    
    const count = selectedRules.size;
    if (confirm(`Delete ${count} selected rules? This cannot be undone.`)) {
      chrome.storage.sync.get(['rules'], (result) => {
        const rules = result.rules.filter(rule => !selectedRules.has(rule.id));
        chrome.storage.sync.set({ rules }, () => {
          selectedRules.forEach(id => collapsedRules.delete(id));
          selectedRules.clear();
          saveCollapsedState();
          loadRules();
          notifyBackgroundScript();
          showNotification(`${count} rules deleted`);
        });
      });
    }
  }

  function deleteRule(id) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.filter(rule => rule.id !== id);
      chrome.storage.sync.set({ rules }, () => {
        if (editingRuleId === id) {
          resetForm();
        }
        collapsedRules.delete(id);
        selectedRules.delete(id);
        loadRules();
        notifyBackgroundScript();
        showNotification('rule deleted');
      });
    });
  }

  function notifyBackgroundScript() {
    chrome.runtime.sendMessage({ action: 'rulesUpdated' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showStats() {
    Promise.all([
      new Promise(resolve => chrome.storage.sync.get(['rules'], resolve)),
      new Promise(resolve => chrome.storage.local.get(['ruleStats'], resolve))
    ]).then(([rulesResult, statsResult]) => {
      const rules = rulesResult.rules || [];
      const stats = statsResult.ruleStats || {};
      
      const ruleMap = rules.reduce((map, rule) => {
        map[rule.id] = rule;
        return map;
      }, {});
      
      const sortedStats = Object.entries(stats)
        .filter(([ruleId]) => ruleMap[ruleId]) // Only show stats for existing rules
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10); // Top 10
      
      if (sortedStats.length === 0) {
        statsContent.innerHTML = '<div class="empty-state">no usage data yet</div>';
      } else {
        statsContent.innerHTML = sortedStats.map(([ruleId, stat]) => {
          const rule = ruleMap[ruleId];
          return `
            <div class="stat-item">
              <div class="stat-rule">
                <div>${escapeHtml(rule.from)} → ${escapeHtml(rule.to)}</div>
                <div class="stat-last-used">last used: ${stat.lastUsed}</div>
              </div>
              <div class="stat-count">${stat.count}</div>
            </div>
          `;
        }).join('');
      }
      
      statsModal.style.display = 'flex';
    });
  }

  function hideStats() {
    statsModal.style.display = 'none';
  }

  function showTemplates() {
    templatesContent.innerHTML = ruleTemplates.map(template => `
      <div class="template-item" data-template='${JSON.stringify(template)}'>
        <div class="template-title">${template.title}</div>
        <div class="template-description">${template.description}</div>
        <div class="template-example">${template.example}</div>
      </div>
    `).join('');

    // Add click handlers for templates
    document.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', () => {
        const template = JSON.parse(item.dataset.template);
        applyTemplate(template);
        hideTemplates();
      });
    });

    templatesModal.style.display = 'flex';
  }

  function hideTemplates() {
    templatesModal.style.display = 'none';
  }

  function applyTemplate(template) {
    fromUrlInput.value = template.from;
    toUrlInput.value = template.to;
    categorySelect.value = template.category;
    preservePathCheckbox.checked = template.preservePath;
    fromUrlInput.focus();
    showNotification(`template applied: ${template.title}`);
  }

  function showNotification(message) {
    let notification = document.querySelector('.notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+N: New rule (focus first input)
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      fromUrlInput.focus();
      fromUrlInput.select();
    }
    
    // Ctrl+F: Focus search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    
    // Escape: Clear form or close modals
    if (e.key === 'Escape') {
      if (statsModal.style.display === 'flex') {
        hideStats();
      } else if (editingRuleId !== null) {
        cancelEdit();
      } else {
        resetForm();
      }
    }
    
    // Ctrl+Enter: Add/Update rule
    if (e.ctrlKey && e.key === 'Enter') {
      if (editingRuleId !== null) {
        updateRule();
      } else {
        addRule();
      }
    }
    
    // Ctrl+A: Select all rules (when search is focused)
    if (e.ctrlKey && e.key === 'a' && document.activeElement === searchInput) {
      e.preventDefault();
      selectAllCheckbox.checked = true;
      toggleSelectAll();
    }
  });

  // Listen for paste command - allow normal paste, but also try to parse rule format
  document.addEventListener('paste', (e) => {
    if (document.activeElement === fromUrlInput || document.activeElement === toUrlInput) {
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData('text');
      
      // Try to parse as a rule JSON
      try {
        const rule = JSON.parse(pastedText);
        if (rule.from && rule.to) {
          e.preventDefault();
          fromUrlInput.value = rule.from;
          toUrlInput.value = rule.to;
          preservePathCheckbox.checked = rule.preservePath || false;
          showNotification('rule pasted');
        }
        // If it's not a valid rule JSON, let the default paste happen
      } catch (err) {
        // Not JSON, let default paste behavior happen
      }
    }
  });
});