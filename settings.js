document.addEventListener('DOMContentLoaded', () => {
  const fandomToggle = document.getElementById('fandomToggle');
  const fandomContent = document.getElementById('fandomContent');
  const fandomInstance = document.getElementById('fandomInstance');
  const backBtn = document.getElementById('backBtn');

  // Load settings
  loadFandomSettings();

  // Event listeners
  fandomToggle.addEventListener('click', toggleFandom);
  fandomInstance.addEventListener('input', saveFandomSettings);
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  function loadFandomSettings() {
    chrome.storage.sync.get(['fandomRedirect'], (result) => {
      const settings = result.fandomRedirect || { enabled: false, instance: 'phantom.crnbg.org' };
      
      if (settings.enabled) {
        fandomToggle.classList.add('active');
        fandomContent.style.display = 'flex';
      } else {
        fandomToggle.classList.remove('active');
        fandomContent.style.display = 'none';
      }
      
      fandomInstance.value = settings.instance;
    });
  }

  function toggleFandom() {
    chrome.storage.sync.get(['fandomRedirect'], (result) => {
      const settings = result.fandomRedirect || { enabled: false, instance: 'phantom.crnbg.org' };
      settings.enabled = !settings.enabled;
      
      chrome.storage.sync.set({ fandomRedirect: settings }, () => {
        loadFandomSettings();
        showNotification(`fandom redirect ${settings.enabled ? 'enabled' : 'disabled'}`);
      });
    });
  }

  function saveFandomSettings() {
    chrome.storage.sync.get(['fandomRedirect'], (result) => {
      const settings = result.fandomRedirect || { enabled: false, instance: 'phantom.crnbg.org' };
      settings.instance = fandomInstance.value.trim() || 'phantom.crnbg.org';
      
      chrome.storage.sync.set({ fandomRedirect: settings }, () => {
        showNotification('settings saved');
      });
    });
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
});
