// Chrome storage mock for local preview
// Only activates when chrome.storage is unavailable (i.e., not in extension context)
if (typeof chrome === 'undefined' || !chrome.storage) {
  window.chrome = window.chrome || {};
  window.chrome.storage = {
    local: {
      get: function(key, callback) {
        var result = {};
        if (key === 'linkedinPosts' || (Array.isArray(key) && key.indexOf('linkedinPosts') !== -1)) {
          result.linkedinPosts = window.__PREVIEW_POSTS || [];
        }
        if (typeof callback === 'function') {
          callback(result);
        }
      },
      set: function(data, callback) {
        // no-op for preview
        if (typeof callback === 'function') callback();
      }
    },
    onChanged: {
      addListener: function() {} // no-op
    }
  };
  window.chrome.runtime = window.chrome.runtime || {
    getURL: function(path) { return path; }
  };
}
