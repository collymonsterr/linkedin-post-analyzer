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

  async function scrapePost(container) {
    const urn = container.getAttribute('data-urn');

    // Click "see more" to expand truncated content
    const seeMoreBtn = container.querySelector('button.feed-shared-inline-show-more-text')
      || container.querySelector('button[aria-label*="see more"]');
    if (seeMoreBtn) {
      seeMoreBtn.click();
      await sleep(300);
    }

    // Post text
    const textEl = container.querySelector('.update-components-text')
      || container.querySelector('.feed-shared-update-v2__commentary');
    const text = textEl ? textEl.innerText.trim() : '';

    // Date
    let date = '';
    const dateEl = container.querySelector('.update-components-actor__sub-description');
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

    // 1. Search inside the data-urn container
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
    const url = urn ? 'https://www.linkedin.com/feed/update/' + urn + '/' : '';

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
      const found = document.querySelectorAll('[data-urn*="urn:li:activity"]');
      if (found.length > 0) return true;
      // Try scrolling a bit to trigger lazy loading
      window.scrollBy(0, 300);
      await sleep(800);
    }
    return document.querySelectorAll('[data-urn*="urn:li:activity"]').length > 0;
  }

  // --- Main scraping loop ---
  const posts = [];
  const seenUrns = new Set();
  let noNewCount = 0;
  const maxNoNew = config.limitType === 'none' ? 8 : 5;

  try {
    saveProgress('started', posts);

    // Wait up to 15 seconds for LinkedIn to load at least one post
    const postsLoaded = await waitForPosts(15000);
    if (!postsLoaded && alive()) {
      saveProgress('error', posts, 'No posts found on this page. Make sure you are on a LinkedIn activity/posts page and the posts have loaded.');
      return;
    }

    // Small extra wait to let more posts render
    await sleep(1500);

    while (alive()) {
      // Find outermost post containers (not nested inside another activity)
      const all = document.querySelectorAll('[data-urn*="urn:li:activity"]');
      const outermost = Array.from(all).filter(el =>
        !el.parentElement.closest('[data-urn*="urn:li:activity"]')
      );

      let newFound = 0;

      for (const container of outermost) {
        if (!alive()) break;

        const urn = container.getAttribute('data-urn');
        if (seenUrns.has(urn)) continue;
        seenUrns.add(urn);

        // Skip reposts/reshares — look for "reposted" in the header area
        // (Company pages: keep reposts — they're intentional content curation)
        if (config.pageType !== 'company') {
          const headerEl = container.querySelector('.update-components-header')
            || container.querySelector('.feed-shared-header');
          if (headerEl && /reposted/i.test(headerEl.innerText)) continue;
        }

        const post = await scrapePost(container);
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
        || document.querySelector('button[aria-label*="Show more"]');
      if (loadMoreBtn) {
        loadMoreBtn.click();
        await sleep(1500);
      }

      // Scroll to bottom
      window.scrollTo(0, document.documentElement.scrollHeight);
      await sleep(randomDelay());
    }
  } catch (err) {
    saveProgress('error', posts, err.message);
    return;
  }

  saveProgress('complete', posts);
})();
