// Each injection increments the generation to cancel any previous scrape
window._scraperGeneration = (window._scraperGeneration || 0) + 1;

(async function() {
  const MY_GEN = window._scraperGeneration;
  const config = window._scraperConfig || { limitType: 'none', limitValue: 0, pageType: 'personal', pageId: '' };

  function alive() { return MY_GEN === window._scraperGeneration; }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function randomDelay() { return 1500 + Math.random() * 1000; }

  function parseCount(str) {
    if (!str) return 0;
    str = str.trim().replace(/,/g, '');
    if (/k$/i.test(str)) return Math.round(parseFloat(str) * 1000);
    if (/m$/i.test(str)) return Math.round(parseFloat(str) * 1000000);
    return parseInt(str, 10) || 0;
  }

  function dateToMonths(dateStr) {
    if (!dateStr) return 0;
    const lower = dateStr.toLowerCase();
    let match;
    if ((match = lower.match(/(\d+)\s*year/))) return parseInt(match[1]) * 12;
    if ((match = lower.match(/(\d+)\s*month/))) return parseInt(match[1]);
    if ((match = lower.match(/(\d+)\s*week/))) return parseInt(match[1]) / 4;
    if ((match = lower.match(/(\d+)\s*day/))) return parseInt(match[1]) / 30;
    return 0;
  }

  function saveProgress(status, posts, error) {
    try {
      var state = { status: status, posts: posts, count: posts.length, error: error || null, pageType: config.pageType, pageId: config.pageId };
      if (status === 'complete') state.scrapedAt = Date.now();
      chrome.storage.local.set({ scraperState: state });
    } catch (e) { /* extension context may be invalidated */ }
  }

  // --- Post container selectors ---
  // LinkedIn uses different DOM structures for personal vs company pages.
  // We try multiple selectors to find post containers.
  const POST_SELECTORS = [
    '[data-urn*="urn:li:activity"]',       // Personal activity feed
    '[data-urn*="urn:li:ugcPost"]',         // UGC posts (company pages)
    '[data-urn*="urn:li:share"]',           // Shared content
    '.occludable-update',                   // Occlusion-managed feed items
    '.feed-shared-update-v2',               // Feed update v2 containers
    '.update-components-update',            // Update component wrapper
    '[data-id*="urn:li:activity"]',         // data-id variant
    '[data-id*="urn:li:ugcPost"]',          // data-id UGC variant
  ];

  // Find all post containers on the page using multiple selectors
  function findPostContainers() {
    // Try the primary selector first (most reliable for personal pages)
    let posts = document.querySelectorAll('[data-urn*="urn:li:activity"]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-urn' };
    }

    // Try other URN-based selectors
    posts = document.querySelectorAll('[data-urn*="urn:li:ugcPost"]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-urn' };
    }

    posts = document.querySelectorAll('[data-urn*="urn:li:share"]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-urn' };
    }

    // Try data-id variants (some LinkedIn pages use data-id instead of data-urn)
    posts = document.querySelectorAll('[data-id*="urn:li:activity"]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-id' };
    }

    posts = document.querySelectorAll('[data-id*="urn:li:ugcPost"]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-id' };
    }

    // Try broader container selectors (no URN, identify by structure)
    // .occludable-update is LinkedIn's lazy-load wrapper for feed items
    posts = document.querySelectorAll('.occludable-update');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: null };
    }

    // Feed shared update v2 — the inner post component
    posts = document.querySelectorAll('.feed-shared-update-v2');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: null };
    }

    // Last resort: any element with a data-urn attribute at all
    posts = document.querySelectorAll('[data-urn]');
    if (posts.length > 0) {
      return { elements: posts, urnAttr: 'data-urn' };
    }

    return { elements: [], urnAttr: null };
  }

  // Extract a unique ID from a post container
  function getPostId(container, urnAttr) {
    if (urnAttr) {
      return container.getAttribute(urnAttr) || '';
    }
    // Fall back: look for data-urn or data-id on the element or its children
    const urn = container.getAttribute('data-urn')
      || container.getAttribute('data-id')
      || '';
    if (urn) return urn;
    // Try finding a child with a URN
    const child = container.querySelector('[data-urn]') || container.querySelector('[data-id]');
    if (child) return child.getAttribute('data-urn') || child.getAttribute('data-id') || '';
    // Use text hash as last resort identifier
    const text = (container.innerText || '').substring(0, 100);
    return 'text-hash-' + text.length + '-' + hashCode(text);
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  async function scrapePost(container, urnAttr) {
    const urn = getPostId(container, urnAttr);

    // Click "see more" to expand truncated content
    const seeMoreBtn = container.querySelector('button.feed-shared-inline-show-more-text')
      || container.querySelector('button[aria-label*="see more"]')
      || container.querySelector('button[aria-label*="See more"]');
    if (seeMoreBtn) {
      seeMoreBtn.click();
      await sleep(300);
    }

    // Post text — try multiple selectors
    const textEl = container.querySelector('.update-components-text')
      || container.querySelector('.feed-shared-update-v2__commentary')
      || container.querySelector('.feed-shared-text')
      || container.querySelector('.break-words');
    const text = textEl ? textEl.innerText.trim() : '';

    // Date — try multiple patterns
    let date = '';
    const dateEl = container.querySelector('.update-components-actor__sub-description')
      || container.querySelector('.feed-shared-actor__sub-description');
    if (dateEl) {
      const hiddenSpan = dateEl.querySelector('span.visually-hidden');
      if (hiddenSpan) {
        let raw = hiddenSpan.innerText || '';
        raw = raw.split('\u2022')[0]; // split on bullet •
        raw = raw.replace(/Edited/gi, '').replace(/Visible/gi, '').replace(/[\n\r]/g, '').trim();
        if (raw.includes('•')) raw = raw.split('•')[0].trim();
        date = raw;
      }
    }
    // Fallback: try looking for time element
    if (!date) {
      const timeEl = container.querySelector('time');
      if (timeEl) {
        date = timeEl.getAttribute('datetime') || timeEl.innerText || '';
      }
    }

    // Likes / reactions
    let likes = 0;
    const likesEl = container.querySelector('.social-details-social-counts__social-proof-fallback-number');
    if (likesEl) {
      likes = parseCount(likesEl.innerText);
    } else {
      const reactionBtn = container.querySelector('button[aria-label*="reaction"]');
      if (reactionBtn) {
        const m = reactionBtn.getAttribute('aria-label').match(/([\d,]+[kKmM]?)/);
        if (m) likes = parseCount(m[1]);
      } else {
        const countVal = container.querySelector('.social-details-social-counts__count-value');
        if (countVal) likes = parseCount(countVal.innerText);
        // Try broader: any element mentioning reactions
        if (likes === 0) {
          const socialCounts = container.querySelector('.social-details-social-counts');
          if (socialCounts) {
            const m = socialCounts.innerText.match(/([\d,]+[kKmM]?)\s*(?:reaction|like)/i);
            if (m) likes = parseCount(m[1]);
          }
        }
      }
    }

    // Comments
    let comments = 0;
    const commentBtn = container.querySelector('button[aria-label*="comment"]');
    if (commentBtn) {
      const m = commentBtn.getAttribute('aria-label').match(/([\d,]+)/);
      if (m) comments = parseInt(m[1].replace(/,/g, ''), 10) || 0;
    } else {
      const socialCounts = container.querySelector('.social-details-social-counts');
      if (socialCounts) {
        const m = socialCounts.innerText.match(/([\d,]+)\s*comment/);
        if (m) comments = parseInt(m[1].replace(/,/g, ''), 10) || 0;
      }
    }

    // Impressions / Views — search inside container, then parent/siblings
    let impressions = -1;
    const impPattern = /([\d,]+[kKmM]?)\s*(?:impression|view|people reached)/i;
    const impSelectors = [
      '.analytics-entry-point',
      '.feed-shared-analytics-entry-point',
      '.update-components-analytics',
      '.update-v2-social-activity',
      '[data-test-id="analytics-entry-point"]',
      '.feed-shared-update-v2__analytics',
      '.social-details-social-activity',
      '.feed-shared-social-action-bar'
    ];

    // Search inside the container
    function searchEl(root) {
      if (impressions > 0 || !root) return;
      for (const sel of impSelectors) {
        const el = root.querySelector(sel);
        if (el) {
          const m = el.innerText.match(impPattern);
          if (m) { impressions = parseCount(m[1]); return; }
          const m2 = el.innerText.match(/^[\s]*([\d,]+[kKmM]?)[\s]*$/);
          if (m2 && parseCount(m2[1]) > 0) { impressions = parseCount(m2[1]); return; }
        }
      }
      // Try buttons/links with aria-labels
      const viewBtn = root.querySelector('button[aria-label*="impression"], button[aria-label*="view"], button[aria-label*="analytic"], a[aria-label*="impression"], a[aria-label*="analytic"]');
      if (viewBtn) {
        const label = viewBtn.getAttribute('aria-label') || '';
        const m = label.match(/([\d,]+[kKmM]?)/);
        if (m && parseCount(m[1]) > 0) { impressions = parseCount(m[1]); return; }
      }
      // Try links with analytics hrefs
      const analyticsLink = root.querySelector('a[href*="analytics"], a[href*="impressions"]');
      if (analyticsLink) {
        const m = analyticsLink.innerText.match(/([\d,]+[kKmM]?)/);
        if (m && parseCount(m[1]) > 0) { impressions = parseCount(m[1]); return; }
      }
    }

    // 1. Search inside the container
    searchEl(container);

    // 2. Search parent wrapper (analytics may be a sibling of the data-urn element)
    if (impressions <= 0 && container.parentElement) {
      searchEl(container.parentElement);
    }

    // 3. Search grandparent (some LinkedIn layouts nest deeper)
    if (impressions <= 0 && container.parentElement && container.parentElement.parentElement) {
      searchEl(container.parentElement.parentElement);
    }

    // 4. Broad text scan on container + parent
    if (impressions <= 0) {
      const scanTargets = [container, container.parentElement];
      for (const target of scanTargets) {
        if (!target || impressions > 0) break;
        const allText = target.innerText || '';
        const m = allText.match(impPattern);
        if (m) impressions = parseCount(m[1]);
      }
    }

    // Store as 0 if nothing found (means no data, not zero views)
    if (impressions < 0) impressions = 0;

    // Construct direct link to post
    let url = '';
    if (urn && urn.startsWith('urn:')) {
      url = 'https://www.linkedin.com/feed/update/' + urn + '/';
    }

    // Diagnostic: capture nearby class names when impressions not found
    let _debug = '';
    if (impressions === 0) {
      const classes = [];
      container.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(/\s+/).forEach(c => {
            if (c && (c.includes('analytic') || c.includes('impression') || c.includes('view') || c.includes('social-activity') || c.includes('social-count')))
              classes.push(c);
          });
        }
      });
      _debug = classes.slice(0, 10).join(', ');
    }

    const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

    return { urn, url, text, date, likes, comments, impressions, wordCount, _debug };
  }

  // --- Wait for page to load posts before starting ---
  async function waitForPosts(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!alive()) return false;
      const result = findPostContainers();
      if (result.elements.length > 0) return true;
      // Try scrolling a bit to trigger lazy loading
      window.scrollBy(0, 300);
      await sleep(800);
    }
    return findPostContainers().elements.length > 0;
  }

  // --- Diagnostic: gather what selectors find on this page ---
  function getDiagnostics() {
    const diag = {};
    POST_SELECTORS.forEach(sel => {
      try { diag[sel] = document.querySelectorAll(sel).length; } catch(e) {}
    });
    diag['[data-urn] (any)'] = document.querySelectorAll('[data-urn]').length;
    diag['[data-id] (any)'] = document.querySelectorAll('[data-id]').length;
    diag['article'] = document.querySelectorAll('article').length;
    diag['.scaffold-finite-scroll__content > *'] = document.querySelectorAll('.scaffold-finite-scroll__content > *').length;

    // Sample some class names from the feed area
    const feedClasses = new Set();
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
    const allDivs = mainContent.querySelectorAll('div[class]');
    for (let i = 0; i < allDivs.length && feedClasses.size < 30; i++) {
      const cl = allDivs[i].className;
      if (typeof cl === 'string' && (cl.includes('feed') || cl.includes('update') || cl.includes('post') || cl.includes('org') || cl.includes('occlu') || cl.includes('content'))) {
        feedClasses.add(cl.split(/\s+/).slice(0, 3).join(' '));
      }
    }
    diag._feedClasses = Array.from(feedClasses).slice(0, 15);

    console.log('[LinkedIn Scraper] DOM diagnostics:', JSON.stringify(diag, null, 2));
    return diag;
  }

  // --- Main scraping loop ---
  const posts = [];
  const seenIds = new Set();
  let noNewCount = 0;
  const maxNoNew = config.limitType === 'none' ? 8 : 5;

  try {
    saveProgress('started', posts);

    // Wait up to 20 seconds for LinkedIn to load at least one post
    // (company pages can be slower to render)
    const postsLoaded = await waitForPosts(20000);
    if (!postsLoaded && alive()) {
      const diag = getDiagnostics();
      const diagSummary = Object.entries(diag)
        .filter(([k, v]) => k !== '_feedClasses' && v > 0)
        .map(([k, v]) => k + ':' + v)
        .join(', ');
      const classesSummary = (diag._feedClasses || []).join(' | ');
      const msg = 'No posts found. Selectors: [' + (diagSummary || 'none matched') + ']. Classes: [' + (classesSummary || 'none') + ']. URL: ' + window.location.href;
      saveProgress('error', posts, msg);
      return;
    }

    // Small extra wait to let more posts render
    await sleep(1500);

    while (alive()) {
      const { elements: allContainers, urnAttr } = findPostContainers();

      // Filter to outermost containers (avoid nested posts)
      const outermost = Array.from(allContainers).filter(el => {
        // Check if any ancestor (up to 5 levels) is also a post container
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          if (parent.matches && POST_SELECTORS.some(sel => { try { return parent.matches(sel); } catch(e) { return false; } })) {
            return false;
          }
          parent = parent.parentElement;
          depth++;
        }
        return true;
      });

      let newFound = 0;

      for (const container of outermost) {
        if (!alive()) break;

        const postId = getPostId(container, urnAttr);
        if (!postId || seenIds.has(postId)) continue;
        seenIds.add(postId);

        // Skip reposts/reshares — look for "reposted" in the header area
        // (Company pages: keep reposts — they're intentional content curation)
        if (config.pageType !== 'company') {
          const headerEl = container.querySelector('.update-components-header')
            || container.querySelector('.feed-shared-header');
          if (headerEl && /reposted/i.test(headerEl.innerText)) continue;
        }

        // Skip empty containers (no text content at all)
        const containerText = container.innerText || '';
        if (containerText.trim().length < 10) continue;

        const post = await scrapePost(container, urnAttr);

        // Skip posts with no meaningful text
        if (!post.text && post.likes === 0 && post.comments === 0) continue;

        posts.push(post);
        newFound++;

        // Check post limit
        if (config.limitType === 'posts' && posts.length >= config.limitValue) {
          saveProgress('complete', posts);
          return;
        }

        // Check date limit
        if (config.limitType === 'months' && dateToMonths(post.date) > config.limitValue) {
          saveProgress('complete', posts);
          return;
        }
      }

      // Progressive save after each scroll cycle
      saveProgress('progress', posts);

      if (!alive()) break;

      if (newFound === 0) {
        noNewCount++;
        if (noNewCount >= maxNoNew) break;
        // Wait longer on each empty cycle to give LinkedIn more time to load
        await sleep(1000 + noNewCount * 500);
      } else {
        noNewCount = 0;
      }

      // Click "load more" pagination button if present
      const loadMoreBtn = document.querySelector('button.scaffold-finite-scroll__load-button')
        || document.querySelector('button[aria-label*="Show more"]')
        || document.querySelector('button[aria-label*="Load more"]');
      if (loadMoreBtn) {
        loadMoreBtn.click();
        await sleep(1500);
      }

      // Scroll to bottom
      window.scrollTo(0, document.documentElement.scrollHeight);
      await sleep(randomDelay());
    }
  } catch (err) {
    getDiagnostics();
    saveProgress('error', posts, err.message);
    return;
  }

  saveProgress('complete', posts);
})();
