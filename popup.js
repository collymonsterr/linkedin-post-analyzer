let posts = [];
let activeTabId = null;
let isScraping = false;
let currentPageType = 'personal'; // 'personal' or 'company'
let currentPageId = '';            // username or company slug

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressEl = document.getElementById('progress');
const postCountEl = document.getElementById('postCount');
const actionBtns = document.getElementById('actionBtns');
const csvBtn = document.getElementById('csvBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const jsonBtn = document.getElementById('jsonBtn');
const errorEl = document.getElementById('error');
const postsLimitRow = document.getElementById('postsLimitRow');
const monthsLimitRow = document.getElementById('monthsLimitRow');
const onboarding = document.getElementById('onboarding');
const cachedDataSection = document.getElementById('cachedDataSection');
const cachedTitle = document.getElementById('cachedTitle');
const cachedMeta = document.getElementById('cachedMeta');
const reanalyzeBtn = document.getElementById('reanalyzeBtn');
const freshScrapeBtn = document.getElementById('freshScrapeBtn');
const pageBadge = document.getElementById('pageBadge');
const subtitleText = document.getElementById('subtitleText');

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' min' + (minutes > 1 ? 's' : '') + ' ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
  return new Date(timestamp).toLocaleDateString();
}

// Detect page type from URL
function detectPageType(url) {
  if (!url) return { pageType: 'personal', pageId: '' };
  const companyMatch = url.match(/linkedin\.com\/company\/([^/?#]+)/);
  if (companyMatch) return { pageType: 'company', pageId: companyMatch[1] };
  const profileMatch = url.match(/linkedin\.com\/in\/([^/?#]+)/);
  if (profileMatch) return { pageType: 'personal', pageId: profileMatch[1] };
  // On LinkedIn activity page directly
  if (url.includes('linkedin.com')) return { pageType: 'personal', pageId: '' };
  return { pageType: 'personal', pageId: '' };
}

// Show page type badge
function showPageBadge(pageType, pageId) {
  if (!pageBadge) return;
  if (pageType === 'company') {
    pageBadge.className = 'page-badge company';
    pageBadge.innerHTML = '&#x1F3E2; Company Page' + (pageId ? ' — ' + pageId.replace(/-/g, ' ') : '');
    pageBadge.classList.remove('hidden');
    if (subtitleText) subtitleText.textContent = 'Scrape posts from this company page.';
  } else if (pageId) {
    pageBadge.className = 'page-badge personal';
    pageBadge.innerHTML = '&#x1F4CB; Personal Profile';
    pageBadge.classList.remove('hidden');
  }
}

// Get storage key based on page type
function getStorageKey() {
  return currentPageType === 'company' ? 'linkedinPosts_company' : 'linkedinPosts';
}

// Radio button toggles for limit inputs
document.querySelectorAll('input[name="limitType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    postsLimitRow.classList.toggle('hidden', radio.value !== 'posts');
    monthsLimitRow.classList.toggle('hidden', radio.value !== 'months');
  });
});

function getConfig() {
  const limitType = document.querySelector('input[name="limitType"]:checked').value;
  let limitValue = 0;
  if (limitType === 'posts') limitValue = parseInt(document.getElementById('postsLimit').value, 10) || 50;
  if (limitType === 'months') limitValue = parseInt(document.getElementById('monthsLimit').value, 10) || 6;
  return { limitType, limitValue, pageType: currentPageType, pageId: currentPageId };
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function clearError() {
  errorEl.style.display = 'none';
}

function updateUI() {
  startBtn.classList.toggle('hidden', isScraping);
  stopBtn.classList.toggle('hidden', !isScraping);
  postCountEl.textContent = posts.length;
  if (posts.length > 0) {
    progressEl.style.display = 'block';
    actionBtns.classList.remove('hidden');
  }
}

// Listen for scraper progress via chrome.storage.onChanged
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.scraperState) return;
  const state = changes.scraperState.newValue;
  if (!state) return;

  if (state.posts && state.posts.length > 0) {
    posts = state.posts;
  }

  if (state.status === 'complete' || state.status === 'error') {
    isScraping = false;
    if (state.status === 'error' && state.error) {
      showError('Error: ' + state.error + (posts.length > 0 ? ' (data collected so far is preserved)' : ''));
    }
  }

  progressEl.style.display = 'block';
  updateUI();
});

// Start scraping
startBtn.addEventListener('click', async () => {
  clearError();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
      showError('Please navigate to a LinkedIn profile or company page first.');
      return;
    }

    // Detect page type from current URL
    const detected = detectPageType(tab.url);
    currentPageType = detected.pageType;
    currentPageId = detected.pageId;

    activeTabId = tab.id;
    posts = [];
    isScraping = true;
    postCountEl.textContent = '0';
    progressEl.style.display = 'block';
    actionBtns.classList.add('hidden');
    cachedDataSection.classList.add('hidden');
    updateUI();

    // 1. Inject config as a global variable (now includes pageType + pageId)
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      func: (cfg) => { window._scraperConfig = cfg; },
      args: [getConfig()]
    });

    // 2. Inject content script — it reads the global and starts immediately
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['content.js']
    });

  } catch (err) {
    isScraping = false;
    updateUI();
    showError('Failed to start: ' + err.message);
  }
});

// Stop scraping — increment generation to cancel the running scraper
stopBtn.addEventListener('click', async () => {
  if (activeTabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: () => { window._scraperGeneration = (window._scraperGeneration || 0) + 1; }
      });
    } catch (e) { /* tab may have closed */ }
  }
  isScraping = false;
  updateUI();
});

// CSV export
csvBtn.addEventListener('click', () => {
  if (posts.length === 0) return;
  const headers = ['Date', 'Likes', 'Comments', 'Impressions', 'Words', 'Text', 'URN'];
  const rows = posts.map(p => [
    escapeCSV(p.date),
    p.likes,
    p.comments,
    p.impressions,
    p.wordCount || (p.text ? p.text.trim().split(/\s+/).filter(Boolean).length : 0),
    escapeCSV(p.text),
    escapeCSV(p.urn)
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const prefix = currentPageType === 'company' ? 'company-posts-' : 'linkedin-posts-';
  a.download = prefix + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
});

function escapeCSV(str) {
  if (str == null) return '""';
  str = String(str);
  return '"' + str.replace(/"/g, '""') + '"';
}

// JSON export
jsonBtn.addEventListener('click', () => {
  if (posts.length === 0) return;
  const json = JSON.stringify(posts, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const prefix = currentPageType === 'company' ? 'company-posts-' : 'linkedin-posts-';
  a.download = prefix + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Analyze — store data and open dashboard
analyzeBtn.addEventListener('click', () => {
  if (posts.length === 0) return;
  const storageKey = getStorageKey();
  const data = {};
  data[storageKey] = posts;
  chrome.storage.local.set(data, () => {
    let url = chrome.runtime.getURL('analyze.html');
    if (currentPageType === 'company') {
      url += '?source=company&id=' + encodeURIComponent(currentPageId);
    }
    chrome.tabs.create({ url });
  });
});

// Re-analyze — use cached data, store and open dashboard
reanalyzeBtn.addEventListener('click', () => {
  if (posts.length === 0) return;
  const storageKey = getStorageKey();
  const data = {};
  data[storageKey] = posts;
  chrome.storage.local.set(data, () => {
    let url = chrome.runtime.getURL('analyze.html');
    if (currentPageType === 'company') {
      url += '?source=company&id=' + encodeURIComponent(currentPageId);
    }
    chrome.tabs.create({ url });
  });
});

// Fresh scrape — hide cached section, show scraping controls
freshScrapeBtn.addEventListener('click', () => {
  cachedDataSection.classList.add('hidden');
});

// On popup open, check for cached data from previous scrapes (personal + company)
chrome.storage.local.get(['scraperState', 'linkedinPosts', 'linkedinPosts_company'], (result) => {
  const scraperData = result.scraperState;
  const personalData = result.linkedinPosts;
  const companyData = result.linkedinPosts_company;

  // Determine which cached data to show based on what's available
  // Priority: scraper state (most recent) > analyzed data
  let cachedPosts = null;
  let cachedTimestamp = null;
  let cachedPageType = 'personal';

  if (scraperData && scraperData.posts && scraperData.posts.length > 0) {
    cachedPosts = scraperData.posts;
    cachedTimestamp = scraperData.scrapedAt || null;
    cachedPageType = scraperData.pageType || 'personal';
  } else if (companyData && companyData.length > 0) {
    cachedPosts = companyData;
    cachedPageType = 'company';
  } else if (personalData && personalData.length > 0) {
    cachedPosts = personalData;
    cachedPageType = 'personal';
  }

  if (cachedPosts && cachedPosts.length > 0 && !isScraping) {
    // Show the cached data section
    cachedDataSection.classList.remove('hidden');
    const typeLabel = cachedPageType === 'company' ? ' company posts available' : ' posts available';
    cachedTitle.textContent = cachedPosts.length + typeLabel;
    cachedMeta.textContent = cachedTimestamp ? 'Scraped ' + timeAgo(cachedTimestamp) : 'Previously scraped data';

    // Set page type so analyze/reanalyze buttons route correctly
    currentPageType = cachedPageType;

    // Restore posts for CSV/JSON/Analyze export
    posts = cachedPosts;
    progressEl.style.display = 'block';
    updateUI();
  } else if (scraperData && scraperData.posts && scraperData.posts.length > 0) {
    // Fallback: restore posts even without showing cached section
    posts = scraperData.posts;
    currentPageType = scraperData.pageType || 'personal';
    progressEl.style.display = 'block';
    updateUI();
  }
});

// Onboarding — detect if user is on LinkedIn and auto-redirect if on profile/company page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
    onboarding.classList.remove('hidden');
    return;
  }

  // Detect page type and show badge
  const detected = detectPageType(tab.url);
  currentPageType = detected.pageType;
  currentPageId = detected.pageId;
  showPageBadge(currentPageType, currentPageId);

  // --- Company page handling ---
  const companyMatch = tab.url.match(/linkedin\.com\/company\/([^/?#]+)/);
  if (companyMatch) {
    const slug = companyMatch[1];
    // Check if already on posts page
    if (tab.url.includes('/posts/') || tab.url.includes('/posts?')) {
      // Ready to scrape — no onboarding needed
      return;
    }
    // On company page but not on posts — offer redirect
    const postsUrl = 'https://www.linkedin.com/company/' + slug + '/posts/';
    onboarding.classList.remove('hidden');
    onboarding.querySelector('.onboard-hint').innerHTML =
      'You\'re on a company page but not the posts feed.<br><br>' +
      '<button id="goPostsBtn" style="background:#92400e;color:#fff;border:none;border-radius:16px;padding:7px 18px;font-size:12px;font-weight:600;cursor:pointer;">Go to Company Posts →</button>';
    setTimeout(() => {
      const goBtn = document.getElementById('goPostsBtn');
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          chrome.tabs.update(tab.id, { url: postsUrl }).then(() => {
            window.close();
          });
        });
      }
    }, 0);
    return;
  }

  // --- Personal profile handling ---
  if (tab.url.includes('/recent-activity/') || tab.url.includes('/detail/recent-activity/')) {
    // Already on activity page — ready to scrape
    return;
  }

  const profileMatch = tab.url.match(/linkedin\.com\/in\/([^/?#]+)/);
  if (profileMatch) {
    const activityUrl = 'https://www.linkedin.com/in/' + profileMatch[1] + '/recent-activity/all/';
    onboarding.classList.remove('hidden');
    onboarding.querySelector('.onboard-hint').innerHTML =
      'You\'re on a profile page but not the activity feed.<br><br>' +
      '<button id="goActivityBtn" style="background:#0a66c2;color:#fff;border:none;border-radius:16px;padding:7px 18px;font-size:12px;font-weight:600;cursor:pointer;">Go to Activity Page →</button>';
    setTimeout(() => {
      const goBtn = document.getElementById('goActivityBtn');
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          chrome.tabs.update(tab.id, { url: activityUrl }).then(() => {
            window.close();
          });
        });
      }
    }, 0);
  } else {
    onboarding.classList.remove('hidden');
    onboarding.querySelector('.onboard-hint').textContent =
      'Tip: Navigate to a profile\'s Activity → Posts section or a company page for best results.';
  }
});
