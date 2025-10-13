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
  
  let editingRuleId = null;
  let collapsedRules = new Set();
  let sectionCollapsed = false;

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

    if (!from || !to) {
      alert('Please fill in both URLs');
      return;
    }

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      rules.push({ from, to, preservePath, id: Date.now() });
      
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

    if (!from || !to) {
      alert('Please fill in both URLs');
      return;
    }

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.map(rule => 
        rule.id === editingRuleId 
          ? { ...rule, from, to, preservePath }
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

  function loadRules() {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      
      // Update count
      rulesCount.textContent = rules.length;
      
      if (rules.length === 0) {
        rulesList.innerHTML = '<div class="empty-state">no rules yet</div>';
        return;
      }

      rulesList.innerHTML = rules.map(rule => {
        const isCollapsed = collapsedRules.has(rule.id);
        return `
        <div class="rule-item ${isCollapsed ? 'collapsed' : ''}" data-id="${rule.id}">
          <div class="rule-header" data-id="${rule.id}">
            <div class="rule-title">
              <span class="collapse-icon">▼</span>
              <span class="rule-from">${escapeHtml(rule.from)}</span>
              <span class="rule-arrow">→</span>
              <span class="rule-to">${escapeHtml(rule.to)}</span>
            </div>
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
          const id = parseInt(e.currentTarget.dataset.id);
          toggleCollapse(id);
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
    });
  }

  function deleteRule(id) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules.filter(rule => rule.id !== id);
      chrome.storage.sync.set({ rules }, () => {
        if (editingRuleId === id) {
          resetForm();
        }
        collapsedRules.delete(id);
        loadRules();
        notifyBackgroundScript();
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