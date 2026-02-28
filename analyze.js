(function() {
  // ── Category definitions ──────────────────────────────────────────
  var CATEGORIES = [
    { name: 'AI & Tech',        color: '#0a66c2', bg: '#dbeafe', keywords: ['ai','artificial intelligence','machine learning','gpt','chatgpt','claude','llm','deep learning','neural','automation','algorithm','tech','technology','software','coding','programming','developer','api','data science','cloud','saas','open source','python','javascript'] },
    { name: 'Crypto & Web3',    color: '#ea580c', bg: '#ffedd5', keywords: ['bitcoin','btc','crypto','cryptocurrency','ethereum','eth','blockchain','web3','defi','nft','token','mining','wallet','decentralized','solana','altcoin'] },
    { name: 'Cars & EVs',       color: '#dc2626', bg: '#fee2e2', keywords: ['tesla','ev','electric vehicle','car','cars','driving','autonomous','self-driving','automotive','model 3','model y','model s','model x','cybertruck','rivian','lucid'] },
    { name: 'Business',         color: '#1e40af', bg: '#dbeafe', keywords: ['business','startup','entrepreneur','revenue','growth','strategy','marketing','sales','customer','product','market','company','founder','ceo','investor','investment','funding','profit','roi','b2b','b2c','acquisition','ipo','valuation'] },
    { name: 'Career',           color: '#7c3aed', bg: '#ede9fe', keywords: ['career','leadership','management','hiring','job','interview','resume','team','culture','mentor','promotion','workplace','remote work','wfh','layoff','salary','negotiate'] },
    { name: 'Personal Growth',  color: '#059669', bg: '#d1fae5', keywords: ['personal','life','motivation','inspire','lesson','learn','grateful','journey','mindset','habit','success','fail','failure','story','experience','mental health','wellness','balance'] },
    { name: 'Finance',          color: '#0d9488', bg: '#ccfbf1', keywords: ['finance','stock','market','trading','economy','inflation','interest rate','fed','bank','money','wealth','portfolio','s&p','dow','nasdaq','recession'] },
    { name: 'Content & Social', color: '#db2777', bg: '#fce7f3', keywords: ['linkedin','twitter','content','audience','followers','engagement','creator','brand','viral','social media','personal brand','newsletter','podcast','youtube'] }
  ];

  // ── Hook type definitions ─────────────────────────────────────────
  var HOOK_TYPES = [
    { name: 'Question',    emoji: '\u2753', color: '#0a66c2', test: function(h) { return /\?/.test(h.split(/[.!]/)[0]) || /^(what|why|how|when|where|who|which|do you|have you|did you|can you|would you|is it|are you|ever wonder)/i.test(h); } },
    { name: 'List / Number',  emoji: '\uD83D\uDCCB', color: '#7c3aed', test: function(h) { return /^\d+\s+(things|reasons|ways|tips|lessons|mistakes|steps|habits|rules|signs|ideas|facts)/i.test(h) || /^(here are|here\'s)\s+\d+/i.test(h); } },
    { name: 'How-to',     emoji: '\uD83D\uDEE0', color: '#059669', test: function(h) { return /^(how (to|i)|here'?s how|the (exact |simple )?(way|method|framework|process|system|strategy|step))/i.test(h); } },
    { name: 'Bold Statement', emoji: '\uD83D\uDCA5', color: '#dc2626', test: function(h) { return /^(stop|don'?t|never|quit|enough|the truth|the real|most people|nobody|everyone|let'?s be honest|wake up|this is why|harsh truth)/i.test(h); } },
    { name: 'Story / Personal', emoji: '\uD83D\uDCD6', color: '#ea580c', test: function(h) { return /^(i |my |when i|last (week|month|year)|years? ago|\d+ years? ago|back in|in \d{4}|true story|i remember|i used to|i was |i got |i lost |i made |i quit |i left )/i.test(h); } },
    { name: 'Contrarian', emoji: '\uD83D\uDD25', color: '#db2777', test: function(h) { return /^(unpopular opinion|hot take|controversial|i disagree|against the grain|i don'?t care what|the opposite|everyone says)/i.test(h); } },
    { name: 'Stat / Data', emoji: '\uD83D\uDCCA', color: '#0d9488', test: function(h) { return /^(\d[\d,.]*[%xX]|\d[\d,.]*\s*(million|billion|people|users|companies|percent|of ))/i.test(h) || /^\$[\d,.]+/i.test(h); } }
  ];

  // ── Utilities ─────────────────────────────────────────────────────
  function dateToMonths(d) {
    if (!d) return 0; var s = d.toLowerCase(), m;
    if ((m = s.match(/(\d+)\s*year/))) return parseInt(m[1]) * 12;
    if ((m = s.match(/(\d+)\s*month/))) return parseInt(m[1]);
    if ((m = s.match(/(\d+)\s*week/))) return parseInt(m[1]) / 4;
    if ((m = s.match(/(\d+)\s*day/))) return parseInt(m[1]) / 30;
    return 0;
  }
  function eng(p) { return (p.likes||0) + (p.comments||0); }
  function views(p) { return p.impressions||0; }
  function engRate(p) { return views(p) > 0 ? (eng(p)/views(p)*100) : 0; }
  function median(arr) {
    if (!arr.length) return 0;
    var s = arr.slice().sort(function(a,b){return a-b;});
    var mid = Math.floor(s.length/2);
    return s.length%2 ? s[mid] : (s[mid-1]+s[mid])/2;
  }
  function fmt(n) {
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return String(n);
  }
  function wc(s) { return (!s)?0: s.trim().split(/\s+/).filter(Boolean).length; }
  function trunc(s, n) { return (!s)?'': s.length>n ? s.slice(0,n)+'...': s; }
  function firstLine(s) { return (!s)?'': trunc(s.split(/[\n\r]/)[0].trim(), 120); }
  function esc(s) { var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

  // ── Auto-categorize a post ────────────────────────────────────────
  function categorize(text) {
    if (!text) return ['Other'];
    var lower = ' ' + text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
    var matched = [];
    CATEGORIES.forEach(function(cat) {
      for (var i = 0; i < cat.keywords.length; i++) {
        if (lower.indexOf(' ' + cat.keywords[i] + ' ') !== -1 ||
            lower.indexOf(' ' + cat.keywords[i] + 's ') !== -1) {
          matched.push(cat.name);
          return;
        }
      }
    });
    return matched.length > 0 ? matched.slice(0, 2) : ['Other'];
  }

  // ── Extract one-sentence summary ──────────────────────────────────
  function summarize(text) {
    if (!text) return '';
    var clean = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length <= 100) return clean;
    var m = clean.match(/^(.+?[.!?])\s/);
    if (m && m[1].length >= 20 && m[1].length <= 150) return m[1];
    var cut = clean.slice(0, 100);
    var lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '...';
  }

  // ── Get category object by name ───────────────────────────────────
  function getCat(name) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].name === name) return CATEGORIES[i];
    }
    return { name: 'Other', color: '#94a3b8', bg: '#f1f5f9' };
  }

  // ── Detect hook type ──────────────────────────────────────────────
  function detectHookType(text) {
    if (!text) return 'Other';
    var hook = text.split(/[\n\r]/)[0].trim();
    for (var i = 0; i < HOOK_TYPES.length; i++) {
      if (HOOK_TYPES[i].test(hook)) return HOOK_TYPES[i].name;
    }
    return 'Statement';
  }

  // ── Canvas helpers ────────────────────────────────────────────────
  function setupCanvas(c, w, h) {
    var dpr = window.devicePixelRatio||1;
    c.width=w*dpr; c.height=h*dpr;
    c.style.width=w+'px'; c.style.height=h+'px';
    var ctx=c.getContext('2d'); ctx.scale(dpr,dpr); return ctx;
  }

  function drawBarChart(el, labels, values, opts) {
    opts=opts||{};
    var w=el.parentElement.clientWidth||400, h=opts.height||280;
    var ctx=setupCanvas(el,w,h);
    var pad={top:20,right:20,bottom:56,left:48};
    var cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
    var maxVal=Math.max.apply(null,values.concat([1]));
    var barW=(cw/labels.length)*0.6, gap=(cw/labels.length)*0.4;
    var color=opts.color||'#0a66c2';

    for(var i=0;i<=5;i++){
      var y=pad.top+ch-(ch*i/5);
      ctx.strokeStyle='#f1f5f9'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke();
      ctx.fillStyle='#94a3b8'; ctx.font='11px -apple-system,sans-serif'; ctx.textAlign='right';
      var v=maxVal*i/5;
      ctx.fillText(Number.isInteger(v)?v:v.toFixed(1), pad.left-8, y+4);
    }
    values.forEach(function(val,i){
      var barH=(val/maxVal)*ch;
      var x=pad.left+i*(cw/labels.length)+gap/2, y=pad.top+ch-barH;
      if(barH>0){
        var r=Math.min(6,barH/2);
        var grad=ctx.createLinearGradient(x,y,x,y+barH);
        grad.addColorStop(0,color); grad.addColorStop(1,color+'cc');
        ctx.fillStyle=grad; ctx.beginPath();
        ctx.moveTo(x+r,y); ctx.lineTo(x+barW-r,y);
        ctx.quadraticCurveTo(x+barW,y,x+barW,y+r);
        ctx.lineTo(x+barW,y+barH); ctx.lineTo(x,y+barH);
        ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
        ctx.fill();
      }
      ctx.fillStyle='#0f172a'; ctx.font='bold 12px -apple-system,sans-serif'; ctx.textAlign='center';
      ctx.fillText(Number.isInteger(val)?val:val.toFixed(1), x+barW/2, y-6);
      ctx.fillStyle='#64748b'; ctx.font='11px -apple-system,sans-serif';
      labels[i].split('\n').forEach(function(ln,li){
        ctx.fillText(ln, x+barW/2, h-pad.bottom+14+li*13);
      });
    });
  }

  function drawScatter(el, points, opts) {
    opts=opts||{};
    var w=el.parentElement.clientWidth||400, h=opts.height||320;
    var ctx=setupCanvas(el,w,h);
    var pad={top:20,right:20,bottom:50,left:55};
    var cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
    var maxX=Math.max.apply(null,points.map(function(p){return p.x;}).concat([100]));
    var maxY=Math.max.apply(null,points.map(function(p){return p.y;}).concat([1]));
    for(var i=0;i<=5;i++){
      var y=pad.top+ch-(ch*i/5);
      ctx.strokeStyle='#f1f5f9'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke();
      ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='right';
      ctx.fillText(opts.fmtY?opts.fmtY(maxY*i/5):Math.round(maxY*i/5), pad.left-8, y+4);
    }
    for(var i=0;i<=5;i++){
      var x=pad.left+(cw*i/5);
      ctx.strokeStyle='#f1f5f9';
      ctx.beginPath(); ctx.moveTo(x,pad.top); ctx.lineTo(x,pad.top+ch); ctx.stroke();
      ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(opts.fmtX?opts.fmtX(maxX*i/5):Math.round(maxX*i/5), x, h-pad.bottom+16);
    }
    if(opts.xLabel){ctx.fillStyle='#64748b';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(opts.xLabel,pad.left+cw/2,h-4);}
    if(opts.yLabel){ctx.save();ctx.translate(14,pad.top+ch/2);ctx.rotate(-Math.PI/2);ctx.fillStyle='#64748b';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(opts.yLabel,0,0);ctx.restore();}

    var dotColor=opts.dotColor||'rgba(10,102,194,0.5)';
    var dotStroke=opts.dotStroke||'rgba(10,102,194,0.7)';
    var positions=[];
    points.forEach(function(p){
      var cx=pad.left+(p.x/maxX)*cw, cy=pad.top+ch-(p.y/maxY)*ch;
      ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2);
      ctx.fillStyle=dotColor; ctx.fill();
      ctx.strokeStyle=dotStroke; ctx.lineWidth=1.5; ctx.stroke();
      positions.push({cx:cx,cy:cy,data:p});
    });
    var tooltip=document.getElementById(opts.tooltipId||'scatter-tooltip');
    if(tooltip){
      el.addEventListener('mousemove',function(e){
        var rect=el.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
        var mx=(e.clientX-rect.left)*(el.width/el.clientWidth)/dpr;
        var my=(e.clientY-rect.top)*(el.height/el.clientHeight)/dpr;
        var found=false;
        for(var j=0;j<positions.length;j++){
          var dp=positions[j],dx=mx-dp.cx,dy=my-dp.cy;
          if(dx*dx+dy*dy<120){
            tooltip.style.display='block';
            tooltip.style.left=(e.clientX+12)+'px';
            tooltip.style.top=(e.clientY+12)+'px';
            tooltip.innerHTML=dp.data.tip||'';
            found=true; break;
          }
        }
        if(!found) tooltip.style.display='none';
      });
      el.addEventListener('mouseleave',function(){tooltip.style.display='none';});
    }
  }

  // ── Table renderer with summary + categories ──────────────────────
  function renderPostTable(id, items, cols) {
    var tbody = document.querySelector('#'+id+' tbody');
    items.forEach(function(p, i) {
      var tr = document.createElement('tr');
      var rankCls = i===0?'gold':i===1?'silver':i===2?'bronze':'';
      var html = '<td><span class="rank '+rankCls+'">'+(i+1)+'</span></td>';
      var summary = esc(p._summary || trunc(p.text, 80));
      var cats = p._categories || ['Other'];
      var pills = cats.map(function(c) {
        var cat = getCat(c);
        return '<span class="cat-pill" style="background:'+cat.bg+';color:'+cat.color+';">'+esc(c)+'</span>';
      }).join('');
      if (p.url) {
        html += '<td class="post-cell"><div class="post-summary"><a href="'+esc(p.url)+'" target="_blank" title="'+esc(p.text)+'">'+summary+'</a></div><div class="cat-pills">'+pills+'</div></td>';
      } else {
        html += '<td class="post-cell"><div class="post-summary" title="'+esc(p.text)+'">'+summary+'</div><div class="cat-pills">'+pills+'</div></td>';
      }
      html += '<td style="white-space:nowrap;">'+esc(p.date||'-')+'</td>';
      cols.forEach(function(col){
        if(col==='views') html+='<td class="num">'+fmt(views(p))+'</td>';
        if(col==='likes') html+='<td class="num">'+(p.likes||0)+'</td>';
        if(col==='comments') html+='<td class="num">'+(p.comments||0)+'</td>';
        if(col==='eng') html+='<td class="num"><strong>'+eng(p)+'</strong></td>';
        if(col==='engrate') html+='<td class="num">'+(views(p)>0?engRate(p).toFixed(1)+'%':'-')+'</td>';
      });
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  // ── Enrich posts ──────────────────────────────────────────────────
  function enrichPosts(posts) {
    posts.forEach(function(p) {
      p._categories = categorize(p.text);
      p._summary = summarize(p.text);
      p._hookType = detectHookType(p.text);
    });
  }

  // ── Unified Top Posts (sortable + paginated) ─────────────────────
  var _topPostsState = { sortBy: 'views', page: 1, PAGE_SIZE: 10 };

  function renderUnifiedTopPosts(posts, hasViews) {
    var sortBar = document.getElementById('topPostsSortBar');
    var showMore = document.getElementById('topPostsShowMore');
    if (!sortBar) return;

    // Default sort to views if available, else engagement
    if (!hasViews && _topPostsState.sortBy === 'views') _topPostsState.sortBy = 'eng';

    // Build sort buttons
    var sortOptions = [];
    if (hasViews) sortOptions.push({ key: 'views', label: 'Views' });
    sortOptions.push({ key: 'likes', label: 'Likes' });
    sortOptions.push({ key: 'comments', label: 'Comments' });
    sortOptions.push({ key: 'eng', label: 'Engagement' });
    if (hasViews) sortOptions.push({ key: 'engrate', label: 'Eng. Rate' });

    var barHtml = '<span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-right:4px;">Sort by:</span>';
    sortOptions.forEach(function(opt) {
      barHtml += '<button class="sort-btn' + (opt.key === _topPostsState.sortBy ? ' active' : '') + '" data-sort="' + opt.key + '">' + opt.label + '</button>';
    });
    sortBar.innerHTML = barHtml;

    // Sort posts
    var sorted = posts.slice().sort(function(a, b) {
      switch (_topPostsState.sortBy) {
        case 'views': return views(b) - views(a);
        case 'likes': return (b.likes||0) - (a.likes||0);
        case 'comments': return (b.comments||0) - (a.comments||0);
        case 'eng': return eng(b) - eng(a);
        case 'engrate': return engRate(b) - engRate(a);
        default: return eng(b) - eng(a);
      }
    });

    // Update header for the sort column
    var headerTh = document.getElementById('topPostsSortHeader');
    if (headerTh) {
      var headerMap = { views: 'Views', likes: 'Likes', comments: 'Comments', eng: 'Eng.', engrate: 'Eng. Rate' };
      headerTh.textContent = headerMap[_topPostsState.sortBy] || 'Eng.';
    }

    // Determine visible count
    var visibleCount = _topPostsState.page * _topPostsState.PAGE_SIZE;
    var visible = sorted.slice(0, visibleCount);

    // Render table body
    var tbody = document.querySelector('#topPostsTable tbody');
    tbody.innerHTML = '';
    visible.forEach(function(p, i) {
      var tr = document.createElement('tr');
      var rankCls = i===0?'gold':i===1?'silver':i===2?'bronze':'';
      var html = '<td><span class="rank '+rankCls+'">'+(i+1)+'</span></td>';
      var summary = esc(p._summary || trunc(p.text, 80));
      var cats = p._categories || ['Other'];
      var pills = cats.map(function(c) {
        var cat = getCat(c);
        return '<span class="cat-pill" style="background:'+cat.bg+';color:'+cat.color+';">'+esc(c)+'</span>';
      }).join('');
      if (p.url) {
        html += '<td class="post-cell"><div class="post-summary"><a href="'+esc(p.url)+'" target="_blank" title="'+esc(p.text)+'">'+summary+'</a></div><div class="cat-pills">'+pills+'</div></td>';
      } else {
        html += '<td class="post-cell"><div class="post-summary" title="'+esc(p.text)+'">'+summary+'</div><div class="cat-pills">'+pills+'</div></td>';
      }
      html += '<td style="white-space:nowrap;">'+esc(p.date||'-')+'</td>';
      html += '<td class="num">'+fmt(views(p))+'</td>';
      html += '<td class="num">'+(p.likes||0)+'</td>';
      html += '<td class="num">'+(p.comments||0)+'</td>';

      // Dynamic last column based on sort
      if (_topPostsState.sortBy === 'engrate') {
        html += '<td class="num">'+(views(p)>0?engRate(p).toFixed(1)+'%':'-')+'</td>';
      } else {
        html += '<td class="num"><strong>'+eng(p)+'</strong></td>';
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });

    // Show/hide show-more button
    if (showMore) {
      showMore.style.display = visibleCount >= sorted.length ? 'none' : 'block';
      showMore.textContent = 'Show next 10 \u25BC (' + visibleCount + ' of ' + sorted.length + ')';
    }

    // Event listeners (re-attach by cloning sort bar + show more)
    sortBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.sort-btn');
      if (!btn) return;
      _topPostsState.sortBy = btn.getAttribute('data-sort');
      _topPostsState.page = 1;
      renderUnifiedTopPosts(posts, hasViews);
    });

    if (showMore) {
      var newShowMore = showMore.cloneNode(true);
      showMore.parentNode.replaceChild(newShowMore, showMore);
      newShowMore.addEventListener('click', function() {
        _topPostsState.page++;
        renderUnifiedTopPosts(posts, hasViews);
      });
    }
  }

  // ── Content Length Performance cards ──────────────────────────────
  function renderLengthPerformance(posts, hasViews) {
    var container = document.getElementById('lengthPerfContent');
    if (!container) return;

    var buckets = [
      { label: 'Short', range: '1-49 words', min: 1, max: 49, icon: '\u26A1' },
      { label: 'Medium', range: '50-150 words', min: 50, max: 150, icon: '\uD83D\uDCDD' },
      { label: 'Long', range: '151-350 words', min: 151, max: 350, icon: '\uD83D\uDCDA' },
      { label: 'Very Long', range: '350+ words', min: 351, max: Infinity, icon: '\uD83D\uDCD6' }
    ];

    var results = buckets.map(function(b) {
      var inB = posts.filter(function(p) { var w = wc(p.text); return w >= b.min && w <= b.max; });
      var avgE = inB.length > 0 ? inB.reduce(function(s,p){return s+eng(p);},0) / inB.length : 0;
      var avgV = hasViews && inB.length > 0 ? Math.round(inB.reduce(function(s,p){return s+views(p);},0) / inB.length) : 0;
      return { label: b.label, range: b.range, icon: b.icon, count: inB.length, avgEng: avgE, avgViews: avgV, posts: inB };
    });

    // Find best bucket (by engagement, must have at least 2 posts)
    var bestIdx = -1, bestAvg = 0;
    results.forEach(function(r, i) {
      if (r.count >= 2 && r.avgEng > bestAvg) { bestAvg = r.avgEng; bestIdx = i; }
    });

    var html = '<div class="length-perf-grid">';
    results.forEach(function(r, i) {
      var isBest = i === bestIdx;
      html += '<div class="length-perf-card' + (isBest ? ' best' : '') + '">';
      if (isBest) html += '<div class="lp-badge">\u2B50 Best</div>';
      html += '<div class="lp-label">' + r.icon + ' ' + esc(r.label) + '</div>';
      html += '<div class="lp-value">' + r.avgEng.toFixed(1) + '</div>';
      html += '<div class="lp-sub">avg engagement</div>';
      if (hasViews && r.avgViews > 0) {
        html += '<div class="lp-sub">' + fmt(r.avgViews) + ' avg views</div>';
      }
      html += '<div class="lp-sub" style="margin-top:6px;font-weight:600;color:#0f172a;">' + r.count + ' post' + (r.count!==1?'s':'') + '</div>';
      html += '<div class="lp-sub">' + esc(r.range) + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Summary recommendation
    if (bestIdx >= 0) {
      var best = results[bestIdx];
      var bestPost = best.posts.slice().sort(function(a,b){return eng(b)-eng(a);})[0];
      html += '<div class="hook-summary" style="margin-top:16px;"><h3>\uD83C\uDFAF Length Recommendation</h3><p>';
      html += '<strong>' + esc(best.label) + ' posts (' + esc(best.range) + ')</strong> perform best for you, averaging ' + best.avgEng.toFixed(1) + ' engagement';
      if (hasViews && best.avgViews > 0) html += ' and ' + fmt(best.avgViews) + ' views';
      html += ' per post. ';
      if (bestPost) {
        html += 'Your top post in this range: \u201C' + esc(firstLine(bestPost.text)) + '\u201D with ' + eng(bestPost) + ' engagement. ';
      }
      html += 'On LinkedIn, the first two lines are visible before "see more." Regardless of length, invest most of your effort in the opening hook.</p></div>';
    }

    container.innerHTML = html;
  }

  // ── Category breakdown (with sort toggle) ──────────────────────────
  var _catState = { sortBy: 'frequency' };

  function renderCategories(posts, hasViews) {
    var container = document.getElementById('catCharts');
    var sortBar = document.getElementById('catSortBar');
    var catMap = {};
    posts.forEach(function(p) {
      (p._categories || ['Other']).forEach(function(c) {
        if (!catMap[c]) catMap[c] = { posts: [], name: c };
        catMap[c].posts.push(p);
      });
    });

    // Build sort bar
    if (sortBar) {
      var barHtml = '<span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-right:4px;">Sort by:</span>';
      barHtml += '<button class="sort-btn' + (_catState.sortBy === 'frequency' ? ' active' : '') + '" data-cat-sort="frequency">Frequency</button>';
      if (hasViews) barHtml += '<button class="sort-btn' + (_catState.sortBy === 'views' ? ' active' : '') + '" data-cat-sort="views">Avg Views</button>';
      barHtml += '<button class="sort-btn' + (_catState.sortBy === 'engagement' ? ' active' : '') + '" data-cat-sort="engagement">Avg Engagement</button>';
      sortBar.innerHTML = barHtml;

      sortBar.addEventListener('click', function(e) {
        var btn = e.target.closest('.sort-btn');
        if (!btn) return;
        _catState.sortBy = btn.getAttribute('data-cat-sort');
        renderCategories(posts, hasViews);
      });
    }

    var catArr = Object.values(catMap);

    // Sort by selected metric
    if (_catState.sortBy === 'views' && hasViews) {
      catArr.sort(function(a,b) {
        var avgA = a.posts.reduce(function(s,p){return s+views(p);},0)/a.posts.length;
        var avgB = b.posts.reduce(function(s,p){return s+views(p);},0)/b.posts.length;
        return avgB - avgA;
      });
    } else if (_catState.sortBy === 'engagement') {
      catArr.sort(function(a,b) {
        var avgA = a.posts.reduce(function(s,p){return s+eng(p);},0)/a.posts.length;
        var avgB = b.posts.reduce(function(s,p){return s+eng(p);},0)/b.posts.length;
        return avgB - avgA;
      });
    } else {
      catArr.sort(function(a,b){return b.posts.length - a.posts.length;});
    }

    // Get max value for bar sizing
    var maxVal = 1;
    catArr.forEach(function(cat) {
      if (_catState.sortBy === 'views' && hasViews) {
        var v = cat.posts.reduce(function(s,p){return s+views(p);},0)/cat.posts.length;
        if (v > maxVal) maxVal = v;
      } else if (_catState.sortBy === 'engagement') {
        var e = cat.posts.reduce(function(s,p){return s+eng(p);},0)/cat.posts.length;
        if (e > maxVal) maxVal = e;
      } else {
        if (cat.posts.length > maxVal) maxVal = cat.posts.length;
      }
    });

    var html = '';
    catArr.forEach(function(cat) {
      var c = getCat(cat.name);
      var count = cat.posts.length;
      var avgE = (cat.posts.reduce(function(s,p){return s+eng(p);},0)/count).toFixed(1);
      var avgV = hasViews ? Math.round(cat.posts.reduce(function(s,p){return s+views(p);},0)/count) : 0;

      var barValue, barPct;
      if (_catState.sortBy === 'views' && hasViews) {
        barValue = fmt(avgV);
        barPct = Math.round(avgV / maxVal * 100);
      } else if (_catState.sortBy === 'engagement') {
        barValue = avgE;
        barPct = Math.round(parseFloat(avgE) / maxVal * 100);
      } else {
        barValue = count;
        barPct = Math.round(count / maxVal * 100);
      }

      var viewsStr = hasViews ? ' \u00B7 ' + fmt(avgV) + ' avg views' : '';
      html += '<div class="cat-chart-row">' +
        '<div class="cat-chart-label" style="color:'+c.color+';">'+esc(cat.name)+'</div>' +
        '<div class="cat-chart-bar-bg"><div class="cat-chart-bar" style="width:'+barPct+'%;background:'+c.color+';">'+barValue+'</div></div>' +
        '<div class="cat-chart-stats">'+count+' posts \u00B7 '+avgE+' avg eng.'+viewsStr+'</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  // ── Hook Pattern Analysis (redesigned) ───────────────────────────
  var HOOK_TEMPLATES = {
    'Question': [
      'What if [common belief] was completely wrong?',
      'Have you ever wondered why [surprising observation]?',
      'What would change if you could [desirable outcome] in half the time?'
    ],
    'List / Number': [
      '[Number] [things/lessons/mistakes] I learned from [experience]',
      'Here are [number] [tips/rules/habits] that changed my [area]:',
      '[Number] signs you\'re [positive/negative outcome] (and don\'t know it)'
    ],
    'How-to': [
      'How to [achieve result] without [common pain point]',
      'The exact [framework/system/process] I used to [specific outcome]',
      'Here\'s how I [achieved goal] in [short timeframe]:'
    ],
    'Bold Statement': [
      'Stop [common action]. It\'s [ruining/killing/destroying] your [area].',
      'The truth about [topic] that nobody talks about:',
      'Most people [common mistake]. Here\'s what [successful people] do instead.'
    ],
    'Story / Personal': [
      'In [year], I [dramatic event]. It changed everything.',
      '[Time period] ago, I was [difficult situation]. Here\'s what happened next:',
      'I [unexpected action] and it was the best decision of my career.'
    ],
    'Contrarian': [
      'Unpopular opinion: [widely held belief] is completely overrated.',
      'Everyone says [common advice]. I disagree. Here\'s why:',
      'Hot take: [industry norm] is making you [negative outcome].'
    ],
    'Stat / Data': [
      '[Specific %] of [group] [surprising behaviour]. Here\'s what it means:',
      '[Large number] [people/companies] are [doing thing]. The data shows why:',
      'The numbers don\'t lie: [stat] proves [insight].'
    ],
    'Statement': [
      'The biggest lesson I learned this year:',
      '[Topic] is changing. And most people aren\'t ready.',
      'The gap between [A] and [B] is wider than you think.'
    ]
  };

  function renderHookAnalysis(posts, hasViews) {
    var container = document.getElementById('hookAnalysis');
    var typeMap = {};
    var avgEng = posts.reduce(function(s,p){return s+eng(p);},0) / posts.length;

    posts.forEach(function(p) {
      var t = p._hookType || 'Statement';
      if (!typeMap[t]) typeMap[t] = { posts: [], name: t };
      typeMap[t].posts.push(p);
    });

    var types = Object.values(typeMap).sort(function(a,b){return b.posts.length - a.posts.length;});
    var maxCount = types.length ? types[0].posts.length : 1;

    var html = '';
    types.forEach(function(type) {
      var count = type.posts.length;
      var avg = type.posts.reduce(function(s,p){return s+eng(p);},0) / count;
      var topPosts = type.posts.slice().sort(function(a,b){return eng(b)-eng(a);});
      var pct = Math.round(count / maxCount * 100);
      var hookDef = null;
      for (var i = 0; i < HOOK_TYPES.length; i++) {
        if (HOOK_TYPES[i].name === type.name) { hookDef = HOOK_TYPES[i]; break; }
      }
      var emoji = hookDef ? hookDef.emoji : '\uD83D\uDCDD';
      var color = hookDef ? hookDef.color : '#64748b';
      var vsAvg = avgEng > 0 ? Math.round((avg - avgEng) / avgEng * 100) : 0;
      var vsLabel = vsAvg > 0 ? '<span style="color:#059669;font-weight:700;">+' + vsAvg + '% vs avg</span>' :
                    vsAvg < 0 ? '<span style="color:#dc2626;font-weight:700;">' + vsAvg + '% vs avg</span>' :
                    '<span style="color:#64748b;">at average</span>';
      var viewsStr = '';
      if (hasViews) {
        var avgV = Math.round(type.posts.reduce(function(s,p){return s+views(p);},0)/count);
        viewsStr = ' &middot; ' + fmt(avgV) + ' avg views';
      }

      html += '<div class="hook-type" style="border-left-color:'+color+';">' +
        '<div class="hook-type-header">' +
          '<div class="hook-type-name">' + emoji + ' ' + esc(type.name) + ' <span style="font-weight:400;color:#64748b;font-size:12px;">(' + count + ' post' + (count!==1?'s':'') + ')</span></div>' +
          '<div class="hook-type-stats">' + avg.toFixed(1) + ' avg eng. ' + vsLabel + viewsStr + '</div>' +
        '</div>' +
        '<div class="hook-type-bar"><div class="hook-type-bar-fill" style="width:'+pct+'%;background:'+color+';"></div></div>';

      // Show top 2-3 examples
      var exCount = Math.min(3, topPosts.length);
      if (exCount > 0) {
        html += '<div style="margin-bottom:10px;">';
        html += '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Top Examples</div>';
        for (var ei = 0; ei < exCount; ei++) {
          var ep = topPosts[ei];
          html += '<div class="hook-type-example" style="margin-bottom:4px;">\u201C' + esc(firstLine(ep.text)) + '\u201D <span style="font-style:normal;color:#94a3b8;font-size:11px;">\u2014 ' + eng(ep) + ' eng.' + (hasViews && views(ep) > 0 ? ', ' + fmt(views(ep)) + ' views' : '') + '</span></div>';
        }
        html += '</div>';
      }

      // Hook templates
      var templates = HOOK_TEMPLATES[type.name] || HOOK_TEMPLATES['Statement'];
      html += '<div style="background:#f1f5f9;border-radius:8px;padding:10px 14px;font-size:12px;color:#475569;">' +
        '<div style="font-weight:700;margin-bottom:4px;color:#64748b;font-size:11px;">TEMPLATES TO TRY</div>';
      templates.forEach(function(t) {
        html += '<div style="margin-bottom:2px;">\u2022 ' + esc(t) + '</div>';
      });
      html += '</div>';

      html += '</div>';
    });

    // Extended strategy recommendation
    var bestType = types.slice().sort(function(a,b){
      var avgA = a.posts.reduce(function(s,p){return s+eng(p);},0)/a.posts.length;
      var avgB = b.posts.reduce(function(s,p){return s+eng(p);},0)/b.posts.length;
      return avgB - avgA;
    })[0];
    var worstType = types.slice().sort(function(a,b){
      var avgA = a.posts.reduce(function(s,p){return s+eng(p);},0)/a.posts.length;
      var avgB = b.posts.reduce(function(s,p){return s+eng(p);},0)/b.posts.length;
      return avgA - avgB;
    })[0];

    if (bestType && types.length > 1) {
      var bestAvg = bestType.posts.reduce(function(s,p){return s+eng(p);},0)/bestType.posts.length;
      var worstAvg = worstType ? worstType.posts.reduce(function(s,p){return s+eng(p);},0)/worstType.posts.length : 0;

      html += '<div class="hook-summary">' +
        '<h3>\uD83C\uDFAF Hook Strategy Recommendation</h3>';

      // Section 1: Your strongest hook type
      html += '<p style="margin-bottom:12px;"><strong>Your Strongest Hook Type</strong><br>' +
        'Your <strong>' + esc(bestType.name) + '</strong> hooks perform best, averaging ' + bestAvg.toFixed(1) + ' engagement per post (' + bestType.posts.length + ' posts). ';
      if (hasViews) {
        var bv = Math.round(bestType.posts.reduce(function(s,p){return s+views(p);},0)/bestType.posts.length);
        html += 'These posts also average ' + fmt(bv) + ' views. ';
      }
      html += 'Aim to use this hook style for at least 30-40% of your posts.</p>';

      // Section 2: Techniques for stronger hooks
      html += '<p style="margin-bottom:12px;"><strong>Techniques for Stronger Hooks</strong><br>' +
        '\u2022 <strong>Open loops:</strong> Start a story but don\'t close it ("I lost everything. Then something unexpected happened.")<br>' +
        '\u2022 <strong>Use specific numbers:</strong> "3 lessons" beats "lessons I learned" every time<br>' +
        '\u2022 <strong>Address the reader directly:</strong> Use "you" in your first line<br>' +
        '\u2022 <strong>Avoid weak generic openers:</strong> Never start with "I\'m excited to announce" or "Great article!"</p>';

      // Section 3: Strong vs weak examples
      html += '<p style="margin-bottom:12px;"><strong>Strong vs Weak Hooks</strong><br>' +
        '<span style="color:#dc2626;">\u2717 Weak:</span> "Sharing some thoughts on leadership today."<br>' +
        '<span style="color:#059669;">\u2713 Strong:</span> "The worst manager I ever had taught me the most important leadership lesson."<br>' +
        '<span style="color:#dc2626;">\u2717 Weak:</span> "Here are some tips for productivity."<br>' +
        '<span style="color:#059669;">\u2713 Strong:</span> "I deleted every app on my phone. My productivity tripled."</p>';

      // Section 4: What to improve
      if (worstType && worstType.name !== bestType.name) {
        html += '<p style="margin-bottom:12px;"><strong>Area for Improvement</strong><br>' +
          'Your <strong>' + esc(worstType.name) + '</strong> hooks underperform at ' + worstAvg.toFixed(1) + ' avg engagement. ';
        if (HOOK_TEMPLATES[worstType.name]) {
          html += 'Try these stronger formulas: "' + esc(HOOK_TEMPLATES[worstType.name][0]) + '" or "' + esc(HOOK_TEMPLATES[worstType.name][1]) + '".</p>';
        } else {
          html += 'Consider reworking these openings using the templates above.</p>';
        }
      }

      // Section 5: Weekly hook rotation
      html += '<p><strong>Suggested Weekly Hook Rotation</strong><br>' +
        '\u2022 <strong>Monday:</strong> Bold statement or contrarian take (high energy start)<br>' +
        '\u2022 <strong>Tuesday/Wednesday:</strong> How-to or list post (educational, high save rate)<br>' +
        '\u2022 <strong>Thursday:</strong> Story or personal experience (builds connection)<br>' +
        '\u2022 <strong>Friday:</strong> Question hook (drives comments, ends week with engagement)</p>';

      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ── Hashtag Analysis ─────────────────────────────────────────────
  function renderHashtagAnalysis(posts, hasViews) {
    var container = document.getElementById('hashtagAnalysis');
    if (!container) return;
    var tagMap = {};
    posts.forEach(function(p) {
      if (!p.text) return;
      var tags = p.text.match(/#[a-zA-Z]\w{1,49}/g) || [];
      var seen = {};
      tags.forEach(function(t) {
        var lower = t.toLowerCase();
        if (seen[lower]) return;
        seen[lower] = true;
        if (!tagMap[lower]) tagMap[lower] = { tag: t, posts: [] };
        tagMap[lower].posts.push(p);
      });
    });

    var tagArr = Object.values(tagMap).filter(function(t) { return t.posts.length >= 2; })
      .sort(function(a,b) { return b.posts.length - a.posts.length; });

    if (tagArr.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">No hashtags found (or none used more than once). Try adding 2-3 relevant hashtags to each post for better discoverability.</p>';
      return;
    }

    var avgEng = posts.reduce(function(s,p){return s+eng(p);},0) / posts.length;
    var maxCount = tagArr[0].posts.length;
    var html = '';

    tagArr.slice(0, 15).forEach(function(tag) {
      var count = tag.posts.length;
      var avg = tag.posts.reduce(function(s,p){return s+eng(p);},0) / count;
      var pct = Math.round(count / maxCount * 100);
      var vsAvg = avgEng > 0 ? Math.round((avg - avgEng) / avgEng * 100) : 0;
      var vsLabel = vsAvg > 0 ? '<span style="color:#059669;font-weight:700;">+' + vsAvg + '%</span>' :
                    vsAvg < 0 ? '<span style="color:#dc2626;font-weight:700;">' + vsAvg + '%</span>' :
                    '<span style="color:#64748b;">avg</span>';
      var viewsStr = '';
      if (hasViews) {
        var avgV = Math.round(tag.posts.reduce(function(s,p){return s+views(p);},0)/count);
        viewsStr = ' · ' + fmt(avgV) + ' avg views';
      }
      html += '<div class="cat-chart-row">' +
        '<div class="cat-chart-label" style="color:#0a66c2;">' + esc(tag.tag) + '</div>' +
        '<div class="cat-chart-bar-bg"><div class="cat-chart-bar" style="width:'+pct+'%;background:#0a66c2;">' + count + '</div></div>' +
        '<div class="cat-chart-stats">' + avg.toFixed(1) + ' avg eng. ' + vsLabel + viewsStr + '</div>' +
        '</div>';
    });

    // Summary
    var bestTag = tagArr.slice().sort(function(a,b) {
      var avgA = a.posts.reduce(function(s,p){return s+eng(p);},0)/a.posts.length;
      var avgB = b.posts.reduce(function(s,p){return s+eng(p);},0)/b.posts.length;
      return avgB - avgA;
    })[0];

    if (bestTag) {
      var bestAvg = bestTag.posts.reduce(function(s,p){return s+eng(p);},0)/bestTag.posts.length;
      var postsWithTags = posts.filter(function(p){return p.text && /#[a-zA-Z]/.test(p.text);}).length;
      var postsWithout = posts.length - postsWithTags;
      var taggedAvgEng = postsWithTags > 0 ? posts.filter(function(p){return p.text && /#[a-zA-Z]/.test(p.text);}).reduce(function(s,p){return s+eng(p);},0)/postsWithTags : 0;
      var untaggedAvgEng = postsWithout > 0 ? posts.filter(function(p){return !p.text || !/#[a-zA-Z]/.test(p.text);}).reduce(function(s,p){return s+eng(p);},0)/postsWithout : 0;

      html += '<div class="hook-summary" style="margin-top:18px;">' +
        '<h3>\uD83C\uDFAF Hashtag Recommendation</h3>' +
        '<p>Your best-performing hashtag is <strong>' + esc(bestTag.tag) + '</strong> with ' + bestAvg.toFixed(1) + ' avg engagement across ' + bestTag.posts.length + ' posts. ';
      if (postsWithout > 2 && postsWithTags > 2) {
        html += 'Posts with hashtags average ' + taggedAvgEng.toFixed(1) + ' engagement vs ' + untaggedAvgEng.toFixed(1) + ' without. ';
      }
      html += 'LinkedIn recommends 3-5 hashtags per post. Mix broad hashtags (50K+ followers) with niche ones for maximum reach.</p></div>';
    }

    container.innerHTML = html;
  }

  // ── Post Structure Analysis ─────────────────────────────────────
  function renderStructureAnalysis(posts, hasViews) {
    var container = document.getElementById('structureAnalysis');
    if (!container) return;
    var avgEng = posts.reduce(function(s,p){return s+eng(p);},0) / posts.length;

    // Structure traits to detect
    var traits = [
      { name: 'Uses emojis', icon: '\uD83D\uDE00', test: function(t) { return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(t); } },
      { name: 'Uses hashtags', icon: '#️⃣', test: function(t) { return /#[a-zA-Z]\w/.test(t); } },
      { name: 'Contains URL', icon: '\uD83D\uDD17', test: function(t) { return /https?:\/\//.test(t); } },
      { name: 'Ends with question', icon: '\u2753', test: function(t) { var lines = t.trim().split(/\n/).filter(Boolean); return lines.length > 0 && /\?\s*$/.test(lines[lines.length-1]); } },
      { name: 'Uses line breaks (5+ lines)', icon: '\u21B5', test: function(t) { return t.split(/\n/).filter(function(l){return l.trim();}).length >= 5; } },
      { name: 'Uses bullet points / lists', icon: '\uD83D\uDCCB', test: function(t) { return /^[\s]*[\-\u2022\u25CF\u25CB\u2023\u2043\u25AA\u25A0•●►▸]|\d+[.)]\s/m.test(t); } },
      { name: 'Short punchy lines (<8 words avg)', icon: '\u26A1', test: function(t) {
        var lines = t.split(/\n/).filter(function(l){return l.trim();});
        if (lines.length < 3) return false;
        var totalWords = lines.reduce(function(s,l){return s+l.trim().split(/\s+/).length;},0);
        return totalWords / lines.length < 8;
      }}
    ];

    var results = traits.map(function(trait) {
      var withTrait = posts.filter(function(p){return p.text && trait.test(p.text);});
      var withoutTrait = posts.filter(function(p){return !p.text || !trait.test(p.text);});
      var avgWith = withTrait.length > 0 ? withTrait.reduce(function(s,p){return s+eng(p);},0)/withTrait.length : 0;
      var avgWithout = withoutTrait.length > 0 ? withoutTrait.reduce(function(s,p){return s+eng(p);},0)/withoutTrait.length : 0;
      var vsAvg = avgEng > 0 ? Math.round((avgWith - avgEng) / avgEng * 100) : 0;
      var viewsWith = 0, viewsWithout = 0;
      if (hasViews) {
        viewsWith = withTrait.length > 0 ? Math.round(withTrait.reduce(function(s,p){return s+views(p);},0)/withTrait.length) : 0;
        viewsWithout = withoutTrait.length > 0 ? Math.round(withoutTrait.reduce(function(s,p){return s+views(p);},0)/withoutTrait.length) : 0;
      }
      return {
        name: trait.name, icon: trait.icon,
        count: withTrait.length, total: posts.length,
        avgWith: avgWith, avgWithout: avgWithout, vsAvg: vsAvg,
        viewsWith: viewsWith, viewsWithout: viewsWithout
      };
    });

    var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    results.forEach(function(r) {
      if (r.count === 0) return;
      var pctUsed = Math.round(r.count / r.total * 100);
      var barColor = r.vsAvg > 10 ? '#059669' : r.vsAvg < -10 ? '#dc2626' : '#0a66c2';
      var vsLabel = r.vsAvg > 0 ? '+' + r.vsAvg + '% vs avg' : r.vsAvg < 0 ? r.vsAvg + '% vs avg' : 'at avg';
      var vsColor = r.vsAvg > 10 ? '#059669' : r.vsAvg < -10 ? '#dc2626' : '#64748b';

      html += '<div style="padding:14px 16px;border-radius:10px;background:#f8fafc;border-left:4px solid '+barColor+';">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<div style="font-weight:700;font-size:13px;">' + r.icon + ' ' + esc(r.name) + ' <span style="font-weight:400;color:#64748b;font-size:12px;">(' + r.count + ' of ' + r.total + ' posts, ' + pctUsed + '%)</span></div>' +
          '<div style="font-size:12px;font-weight:700;color:'+vsColor+';">' + vsLabel + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:20px;font-size:12px;color:#475569;">' +
          '<span>With: <strong>' + r.avgWith.toFixed(1) + '</strong> avg eng.</span>' +
          '<span>Without: <strong>' + r.avgWithout.toFixed(1) + '</strong> avg eng.</span>';
      if (hasViews && r.viewsWith > 0) {
        html += '<span>With: <strong>' + fmt(r.viewsWith) + '</strong> avg views</span>' +
                '<span>Without: <strong>' + fmt(r.viewsWithout) + '</strong> avg views</span>';
      }
      html += '</div></div>';
    });
    html += '</div>';

    // Summary
    var winners = results.filter(function(r){return r.count >= 2 && r.vsAvg > 10;})
      .sort(function(a,b){return b.vsAvg - a.vsAvg;});
    var losers = results.filter(function(r){return r.count >= 2 && r.vsAvg < -10;})
      .sort(function(a,b){return a.vsAvg - b.vsAvg;});

    if (winners.length > 0 || losers.length > 0) {
      html += '<div class="hook-summary" style="margin-top:14px;"><h3>\uD83C\uDFAF Structure Recommendation</h3><p>';
      if (winners.length > 0) {
        html += 'Posts that <strong>' + winners.map(function(w){return w.name.toLowerCase();}).join('</strong> and <strong>') + '</strong> perform above average. ';
      }
      if (losers.length > 0) {
        html += 'Posts with <strong>' + losers.map(function(l){return l.name.toLowerCase();}).join('</strong> and <strong>') + '</strong> tend to underperform. ';
      }
      html += 'Use these formatting patterns deliberately to maximise your reach.</p></div>';
    }

    container.innerHTML = html;
  }

  // ── Writing Style Profile ────────────────────────────────────────
  function renderStyleProfile(posts, hasViews) {
    var container = document.getElementById('styleAnalysis');
    if (!container) return;

    // Filter to substantive posts (100+ words)
    var qual = posts.filter(function(p) { return p.text && wc(p.text) >= 100; });
    if (qual.length < 5) {
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Not enough substantive posts (100+ words) to build a writing style profile. Found ' + qual.length + ' — need at least 5.</p>';
      return;
    }

    var avgE = qual.reduce(function(s,p){return s+eng(p);},0) / qual.length;
    var topQ = qual.slice().sort(function(a,b){return eng(b)-eng(a);});
    var top10 = topQ.slice(0, Math.max(10, Math.ceil(qual.length * 0.25)));
    var botQ = topQ.slice(Math.floor(qual.length * 0.75));

    var html = '';
    html += '<div style="background:var(--blue-light);border-radius:10px;padding:14px 18px;margin-bottom:18px;font-size:13px;">';
    html += '<strong>' + qual.length + ' posts analysed</strong> (100+ words) out of ' + posts.length + ' total';
    if (hasViews) {
      var medV = median(qual.map(function(p){return views(p);}).filter(function(v){return v>0;}));
      html += ' &middot; Median views: ' + fmt(Math.round(medV));
    }
    html += ' &middot; Median engagement: ' + median(qual.map(function(p){return eng(p);})).toFixed(0);
    html += '</div>';

    // ─── 1. Opening Patterns ───
    html += '<div class="insight" style="margin-bottom:16px;"><h3>\uD83C\uDFA3 1. Opening Patterns</h3>';
    var openerMap = {};
    qual.forEach(function(p) {
      var t = p._hookType || 'Statement';
      if (!openerMap[t]) openerMap[t] = [];
      openerMap[t].push(p);
    });
    var openerTypes = Object.keys(openerMap).sort(function(a,b){return openerMap[b].length - openerMap[a].length;});
    html += '<p style="margin-bottom:10px;">Your posts open in ' + openerTypes.length + ' distinct patterns:</p>';
    openerTypes.forEach(function(type) {
      var op = openerMap[type];
      var avg = op.reduce(function(s,p){return s+eng(p);},0) / op.length;
      var sorted = op.slice().sort(function(a,b){return eng(b)-eng(a);});
      var vsAvg = avgE > 0 ? Math.round((avg - avgE) / avgE * 100) : 0;
      var vsColor = vsAvg > 10 ? '#059669' : vsAvg < -10 ? '#dc2626' : '#64748b';
      html += '<div style="margin:10px 0 14px;padding-left:14px;border-left:3px solid ' + vsColor + ';">';
      html += '<strong>' + esc(type) + '</strong> (' + op.length + ' posts, ' + avg.toFixed(1) + ' avg eng. <span style="color:' + vsColor + ';">' + (vsAvg > 0 ? '+' : '') + vsAvg + '% vs avg</span>)<br>';
      var exCount = Math.min(3, sorted.length);
      for (var i = 0; i < exCount; i++) {
        var ep = sorted[i];
        html += '<span style="font-style:italic;color:#475569;">\u201C' + esc(firstLine(ep.text)) + '\u201D</span> <span style="font-size:11px;color:#94a3b8;">\u2014 ' + eng(ep) + ' eng.' + (hasViews && views(ep) > 0 ? ', ' + fmt(views(ep)) + ' views' : '') + '</span><br>';
      }
      html += '</div>';
    });
    // Best/worst openers
    var bestOpener = openerTypes.slice().sort(function(a,b) {
      return (openerMap[b].reduce(function(s,p){return s+eng(p);},0)/openerMap[b].length) -
             (openerMap[a].reduce(function(s,p){return s+eng(p);},0)/openerMap[a].length);
    })[0];
    var worstOpener = openerTypes.slice().sort(function(a,b) {
      return (openerMap[a].reduce(function(s,p){return s+eng(p);},0)/openerMap[a].length) -
             (openerMap[b].reduce(function(s,p){return s+eng(p);},0)/openerMap[b].length);
    })[0];
    html += '<p><strong>Strongest opener:</strong> ' + esc(bestOpener) + '. <strong>Weakest:</strong> ' + esc(worstOpener) + '.</p>';
    html += '</div>';

    // ─── 2. Voice & Tone ───
    html += '<div class="insight purple" style="margin-bottom:16px;"><h3>\uD83C\uDFA4 2. Voice &amp; Tone</h3>';

    // Pronouns
    var iCount = 0, youCount = 0, weCount = 0, totalWords = 0;
    var questionPosts = 0, exclamPosts = 0;
    var allText = '';
    qual.forEach(function(p) {
      var t = p.text || '';
      allText += ' ' + t;
      var words = t.toLowerCase().split(/\s+/);
      totalWords += words.length;
      words.forEach(function(w) {
        var clean = w.replace(/[^a-z']/g, '');
        if (clean === 'i' || clean === "i'm" || clean === "i've" || clean === "i'll" || clean === 'my' || clean === 'me') iCount++;
        if (clean === 'you' || clean === "you're" || clean === "you'll" || clean === 'your') youCount++;
        if (clean === 'we' || clean === "we're" || clean === 'our') weCount++;
      });
      if (/\?/.test(t)) questionPosts++;
      if (/!/.test(t)) exclamPosts++;
    });
    var iPct = (iCount / totalWords * 100).toFixed(1);
    var youPct = (youCount / totalWords * 100).toFixed(1);

    // Determine voice character
    var voiceTraits = [];
    if (iCount > youCount * 1.5) voiceTraits.push('personal and experience-driven');
    else if (youCount > iCount) voiceTraits.push('reader-focused and direct');
    else voiceTraits.push('balanced between personal and reader-focused');

    if (questionPosts > qual.length * 0.5) voiceTraits.push('conversational (questions in ' + Math.round(questionPosts/qual.length*100) + '% of posts)');
    if (exclamPosts > qual.length * 0.4) voiceTraits.push('energetic');

    // Hedge words vs strong words
    var hedges = 0, strong = 0;
    var hedgeWords = ['maybe','perhaps','might','could','somewhat','probably','possibly','seems','apparently','arguably'];
    var strongWords = ['never','always','every','must','absolutely','definitely','clearly','obviously','undeniably','guaranteed'];
    var lowerAll = allText.toLowerCase();
    hedgeWords.forEach(function(w) { var re = new RegExp('\\b' + w + '\\b', 'gi'); var m = lowerAll.match(re); if (m) hedges += m.length; });
    strongWords.forEach(function(w) { var re = new RegExp('\\b' + w + '\\b', 'gi'); var m = lowerAll.match(re); if (m) strong += m.length; });

    if (strong > hedges * 2) voiceTraits.push('assertive and opinionated');
    else if (hedges > strong * 2) voiceTraits.push('measured and nuanced');
    else voiceTraits.push('moderately opinionated');

    html += '<p style="margin-bottom:10px;">Your voice is <strong>' + voiceTraits.join(', ') + '</strong>.</p>';
    html += '<p style="margin-bottom:10px;">Pronoun balance: <strong>"I/my/me"</strong> appears ' + iPct + '% of words, <strong>"you/your"</strong> ' + youPct + '%. ' +
      (iCount > youCount * 1.5 ? 'You lead with personal experience — this builds authenticity but consider adding more "you" to increase reader connection.' :
       youCount > iCount ? 'You speak directly to the reader — great for engagement. Your audience feels addressed, not lectured at.' :
       'Good balance of personal and reader-directed language.') + '</p>';

    // Signature phrases (2-3 word n-grams that appear 3+ times)
    var ngramMap = {};
    qual.forEach(function(p) {
      var words = (p.text || '').toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length - 1; i++) {
        var bi = words[i] + ' ' + words[i+1];
        ngramMap[bi] = (ngramMap[bi] || 0) + 1;
        if (i < words.length - 2) {
          var tri = bi + ' ' + words[i+2];
          ngramMap[tri] = (ngramMap[tri] || 0) + 1;
        }
      }
    });
    // Filter out generic phrases
    var stopPhrases = ['in the','of the','on the','to the','and the','it is','this is','that is','i am','is a','for the','at the','with the','from the','has been','have been','will be','to be','and i','but i','if you','do you','are you','is the','was a','in a','of a'];
    var sigPhrases = Object.keys(ngramMap)
      .filter(function(k) { return ngramMap[k] >= 3 && stopPhrases.indexOf(k) === -1 && k.split(' ').length >= 2; })
      .sort(function(a,b) { return ngramMap[b] - ngramMap[a]; })
      .slice(0, 15);

    if (sigPhrases.length > 0) {
      html += '<p style="margin-bottom:6px;"><strong>Signature phrases</strong> (your verbal fingerprints):</p>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">';
      sigPhrases.forEach(function(phrase) {
        html += '<span style="background:#ede9fe;color:#7c3aed;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">"' + esc(phrase) + '" \u00D7' + ngramMap[phrase] + '</span>';
      });
      html += '</div>';
    }
    html += '</div>';

    // ─── 3. Structure & Formatting ───
    html += '<div class="insight green" style="margin-bottom:16px;"><h3>\uD83D\uDCC0 3. Structure &amp; Formatting</h3>';
    var avgWc = Math.round(qual.reduce(function(s,p){return s+wc(p.text);},0) / qual.length);
    var lineBreakPosts = qual.filter(function(p) { return p.text.split(/\n/).filter(function(l){return l.trim();}).length >= 5; }).length;
    var listPosts = qual.filter(function(p) { return /^[\s]*[\-\u2022\u25CF\u25CB\u2023\u2043\u25AA\u25A0•●►▸]|\d+[.)]\s/m.test(p.text); }).length;
    var shortLinePosts = qual.filter(function(p) {
      var lines = p.text.split(/\n/).filter(function(l){return l.trim();});
      if (lines.length < 3) return false;
      return lines.reduce(function(s,l){return s+l.trim().split(/\s+/).length;},0) / lines.length < 8;
    }).length;

    // Average sentences per paragraph
    var totalSentences = 0, totalParas = 0;
    qual.forEach(function(p) {
      var paras = p.text.split(/\n\n+/).filter(function(pa){return pa.trim();});
      totalParas += paras.length;
      paras.forEach(function(pa) {
        var sents = pa.split(/[.!?]+/).filter(function(s){return s.trim().length > 5;});
        totalSentences += sents.length;
      });
    });
    var sentPerPara = totalParas > 0 ? (totalSentences / totalParas).toFixed(1) : '?';

    html += '<p style="margin-bottom:8px;"><strong>Average post length:</strong> ' + avgWc + ' words</p>';
    html += '<p style="margin-bottom:8px;"><strong>Avg sentences per paragraph:</strong> ' + sentPerPara + '</p>';
    html += '<p style="margin-bottom:8px;"><strong>Uses generous line breaks:</strong> ' + Math.round(lineBreakPosts/qual.length*100) + '% of posts (5+ visible lines)</p>';
    html += '<p style="margin-bottom:8px;"><strong>Uses lists/bullets:</strong> ' + Math.round(listPosts/qual.length*100) + '% of posts</p>';
    html += '<p style="margin-bottom:8px;"><strong>Short punchy lines (&lt;8 words avg):</strong> ' + Math.round(shortLinePosts/qual.length*100) + '% of posts</p>';

    // Typical post skeleton
    html += '<p style="margin-bottom:6px;"><strong>Typical post architecture:</strong></p><ol style="padding-left:20px;font-size:13px;color:#475569;margin-bottom:10px;">';
    html += '<li>Hook / opening line (attention grab)</li>';
    if (lineBreakPosts > qual.length * 0.3) html += '<li>White space break for readability</li>';
    if (iCount > youCount) html += '<li>Personal story, experience, or context</li>';
    else html += '<li>Problem statement or setup</li>';
    if (listPosts > qual.length * 0.25) html += '<li>Key points as a list or bullets</li>';
    else html += '<li>Supporting argument or narrative</li>';
    html += '<li>Insight, lesson, or takeaway</li>';
    var qClosePosts = qual.filter(function(p) {
      var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
      return lines.length > 0 && /\?\s*$/.test(lines[lines.length-1]);
    }).length;
    if (qClosePosts > qual.length * 0.3) html += '<li>Closing question to drive comments</li>';
    else html += '<li>Closing statement or call to action</li>';
    html += '</ol>';

    // Does length correlate with engagement?
    var shortPosts = qual.filter(function(p){return wc(p.text) < 150;});
    var longPosts = qual.filter(function(p){return wc(p.text) >= 150;});
    if (shortPosts.length >= 3 && longPosts.length >= 3) {
      var shortAvg = shortPosts.reduce(function(s,p){return s+eng(p);},0)/shortPosts.length;
      var longAvg = longPosts.reduce(function(s,p){return s+eng(p);},0)/longPosts.length;
      html += '<p>' + (longAvg > shortAvg * 1.15 ? 'Your longer posts (150+ words) outperform shorter ones by ' + Math.round((longAvg-shortAvg)/shortAvg*100) + '%. Your audience rewards depth.' :
        shortAvg > longAvg * 1.15 ? 'Your shorter posts (<150 words) outperform longer ones by ' + Math.round((shortAvg-longAvg)/longAvg*100) + '%. Your audience prefers conciseness.' :
        'Post length doesn\u2019t significantly affect your engagement \u2014 both short and long posts perform similarly.') + '</p>';
    }
    html += '</div>';

    // ─── 4. Argument Construction ───
    html += '<div class="insight orange" style="margin-bottom:16px;"><h3>\uD83E\uDDE0 4. Argument Construction</h3>';
    var dataPosts = qual.filter(function(p) { return /\d{2,}[%$]|\$[\d,]+|\d+x|\d+ ?(percent|million|billion|thousand)/i.test(p.text); });
    var storyPosts = qual.filter(function(p) { return /\b(I |my |when I|years? ago|back in|I remember|true story)/i.test(p.text); });
    var analogyPosts = qual.filter(function(p) { return /\b(like a|it's like|think of it|imagine|same way|just as)\b/i.test(p.text); });
    var rhetoricPosts = qual.filter(function(p) { return (p.text.match(/\?/g) || []).length >= 2; });

    html += '<p style="margin-bottom:8px;">Your primary persuasion tools:</p><ul style="padding-left:20px;font-size:13px;color:#475569;margin-bottom:10px;">';
    if (dataPosts.length > 0) html += '<li><strong>Data &amp; numbers:</strong> ' + Math.round(dataPosts.length/qual.length*100) + '% of posts use specific figures</li>';
    if (storyPosts.length > 0) html += '<li><strong>Personal stories:</strong> ' + Math.round(storyPosts.length/qual.length*100) + '% of posts lead with experience</li>';
    if (analogyPosts.length > 0) html += '<li><strong>Analogies &amp; comparisons:</strong> ' + Math.round(analogyPosts.length/qual.length*100) + '% of posts</li>';
    if (rhetoricPosts.length > 0) html += '<li><strong>Rhetorical questions:</strong> ' + Math.round(rhetoricPosts.length/qual.length*100) + '% of posts use 2+ questions</li>';
    html += '</ul>';

    // Core rhetorical move
    var moves = [
      { name: 'data and specifics', count: dataPosts.length },
      { name: 'personal stories and experience', count: storyPosts.length },
      { name: 'analogies and reframing', count: analogyPosts.length },
      { name: 'rhetorical questions', count: rhetoricPosts.length }
    ].sort(function(a,b){return b.count - a.count;});
    if (moves[0].count > 0) {
      html += '<p><strong>Core rhetorical move:</strong> You rely most on <strong>' + moves[0].name + '</strong> (' + Math.round(moves[0].count/qual.length*100) + '% of posts). ';
      if (moves[0].count > qual.length * 0.5) {
        html += 'This is clearly your signature approach \u2014 it gives your content a consistent analytical feel.';
      }
      html += '</p>';
    }
    html += '</div>';

    // ─── 5. Closing Patterns ───
    html += '<div class="insight" style="margin-bottom:16px;"><h3>\uD83C\uDFC1 5. Closing Patterns</h3>';
    var closingTypes = { 'Question': [], 'Call to Action': [], 'Bold Statement': [], 'Summary / Takeaway': [] };
    qual.forEach(function(p) {
      var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
      if (lines.length === 0) return;
      var last = lines[lines.length-1].trim();
      var last2 = lines.length > 1 ? lines[lines.length-2].trim() + ' ' + last : last;
      if (/\?\s*$/.test(last)) closingTypes['Question'].push(p);
      else if (/\b(share|comment|follow|tag|let me know|tell me|what do you|drop a|hit me)\b/i.test(last2)) closingTypes['Call to Action'].push(p);
      else if (/^[A-Z]/.test(last) && last.length < 80 && !/[,;]/.test(last)) closingTypes['Bold Statement'].push(p);
      else closingTypes['Summary / Takeaway'].push(p);
    });

    Object.keys(closingTypes).forEach(function(type) {
      var cp = closingTypes[type];
      if (cp.length === 0) return;
      var avg = cp.reduce(function(s,p){return s+eng(p);},0) / cp.length;
      var sorted = cp.slice().sort(function(a,b){return eng(b)-eng(a);});
      html += '<div style="margin:8px 0 12px;padding-left:14px;border-left:3px solid var(--blue);">';
      html += '<strong>' + esc(type) + '</strong> (' + cp.length + ' posts, ' + avg.toFixed(1) + ' avg eng.)<br>';
      var exCount = Math.min(2, sorted.length);
      for (var i = 0; i < exCount; i++) {
        var lines = sorted[i].text.trim().split(/\n/).filter(function(l){return l.trim();});
        var lastLine = lines.length > 0 ? lines[lines.length-1] : '';
        html += '<span style="font-style:italic;color:#475569;font-size:12px;">\u201C' + esc(trunc(lastLine, 100)) + '\u201D</span> <span style="font-size:11px;color:#94a3b8;">\u2014 ' + eng(sorted[i]) + ' eng.</span><br>';
      }
      html += '</div>';
    });
    // What they never do
    var neverClose = Object.keys(closingTypes).filter(function(t){return closingTypes[t].length === 0;});
    if (neverClose.length > 0) {
      html += '<p>You <strong>never</strong> close with: ' + neverClose.join(', ').toLowerCase() + '.</p>';
    }
    html += '</div>';

    // ─── 6. Sentence Rhythm ───
    html += '<div class="insight purple" style="margin-bottom:16px;"><h3>\uD83C\uDFB5 6. Sentence Rhythm</h3>';
    var allSentLengths = [];
    qual.forEach(function(p) {
      var sents = p.text.split(/(?<=[.!?])\s+/).filter(function(s){return s.trim().length > 3;});
      sents.forEach(function(s) { allSentLengths.push(s.trim().split(/\s+/).length); });
    });
    var avgSentLen = allSentLengths.length > 0 ? (allSentLengths.reduce(function(a,b){return a+b;},0) / allSentLengths.length).toFixed(1) : '?';
    var shortSents = allSentLengths.filter(function(l){return l <= 5;}).length;
    var longSents = allSentLengths.filter(function(l){return l >= 20;}).length;
    var shortPct = allSentLengths.length > 0 ? Math.round(shortSents/allSentLengths.length*100) : 0;
    var longPct = allSentLengths.length > 0 ? Math.round(longSents/allSentLengths.length*100) : 0;

    html += '<p style="margin-bottom:8px;"><strong>Average sentence length:</strong> ' + avgSentLen + ' words</p>';
    html += '<p style="margin-bottom:8px;"><strong>Short punchy sentences (\u22645 words):</strong> ' + shortPct + '% &middot; <strong>Long sentences (20+ words):</strong> ' + longPct + '%</p>';
    html += '<p style="margin-bottom:8px;">' + (shortPct > 30 ? 'You favour short, punchy sentences. This creates urgency and momentum.' :
      longPct > 25 ? 'You tend toward longer, more developed sentences. This creates a more measured, analytical feel.' :
      'You mix short and long sentences effectively, creating natural rhythm.') + '</p>';

    // Stylistic tics
    var emDashCount = (allText.match(/\u2014|--/g) || []).length;
    var ellipsisCount = (allText.match(/\.{3}|\u2026/g) || []).length;
    var parenCount = (allText.match(/\(/g) || []).length;
    var tics = [];
    if (emDashCount >= 3) tics.push('em dashes (\u00D7' + emDashCount + ')');
    if (ellipsisCount >= 3) tics.push('ellipses (\u00D7' + ellipsisCount + ')');
    if (parenCount >= 5) tics.push('parenthetical asides (\u00D7' + parenCount + ')');
    if (tics.length > 0) {
      html += '<p><strong>Stylistic habits:</strong> ' + tics.join(', ') + '</p>';
    }

    // Quote a passage showing their rhythm
    var rhythmPost = topQ[0];
    if (rhythmPost) {
      var sents = rhythmPost.text.split(/(?<=[.!?])\s+/).slice(0, 4);
      if (sents.length >= 2) {
        html += '<div style="margin-top:8px;padding:10px 14px;background:#f8fafc;border-radius:8px;font-style:italic;font-size:12px;color:#475569;border-left:3px solid #7c3aed;">';
        html += '<div style="font-style:normal;font-weight:700;font-size:11px;color:#7c3aed;margin-bottom:4px;">EXAMPLE RHYTHM (from your top post)</div>';
        html += esc(sents.join(' ').substring(0, 300)) + (sents.join(' ').length > 300 ? '...' : '');
        html += '</div>';
      }
    }
    html += '</div>';

    // ─── 7. What You Consistently Avoid ───
    html += '<div class="insight green" style="margin-bottom:16px;"><h3>\uD83D\uDEAB 7. What You Consistently Avoid</h3>';
    var avoids = [];
    var emojiPosts = qual.filter(function(p) { return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(p.text); });
    if (emojiPosts.length < qual.length * 0.15) avoids.push('Heavy emoji use \u2014 your posts stay clean and professional');
    var urlPosts = qual.filter(function(p) { return /https?:\/\//.test(p.text); });
    if (urlPosts.length < qual.length * 0.1) avoids.push('External links \u2014 you keep content native to LinkedIn');
    var hashPosts = qual.filter(function(p) { return (p.text.match(/#[a-zA-Z]/g) || []).length > 5; });
    if (hashPosts.length < qual.length * 0.1) avoids.push('Hashtag stuffing \u2014 you use hashtags sparingly if at all');
    if (hedges < 5) avoids.push('Hedge words (maybe, perhaps, might) \u2014 you take firm positions');
    var humbleBrag = qual.filter(function(p) { return /\b(humbled|blessed|grateful to announce|excited to share|thrilled to announce)\b/i.test(p.text); });
    if (humbleBrag.length < 2) avoids.push('"Humblebragging" language (humbled, blessed, thrilled to announce)');
    var genericCTA = qual.filter(function(p) { return /\b(like and share|follow me for more|repost if you agree|hit the bell)\b/i.test(p.text); });
    if (genericCTA.length < 2) avoids.push('Generic engagement bait ("like and share", "repost if you agree")');
    if (listPosts.length < qual.length * 0.15) avoids.push('Listicle-style posts \u2014 you prefer prose over bullet points');
    else if (listPosts.length > qual.length * 0.7) avoids.push('Long unbroken prose \u2014 you structure with lists and bullets');
    var quotePosts = qual.filter(function(p) { return /^[""\u201C]/.test(p.text.trim()); });
    if (quotePosts.length < 2) avoids.push('Opening with someone else\u2019s quote');
    var clichePosts = qual.filter(function(p) { return /\b(game changer|move the needle|circle back|deep dive|at the end of the day|low-hanging fruit)\b/i.test(p.text); });
    if (clichePosts.length < 2) avoids.push('Business clich\u00E9s (game changer, move the needle, deep dive)');

    if (avoids.length > 0) {
      html += '<ul style="padding-left:20px;font-size:13px;color:#475569;">';
      avoids.forEach(function(a) { html += '<li style="margin-bottom:4px;">' + a + '</li>'; });
      html += '</ul>';
    } else {
      html += '<p style="color:#94a3b8;">Not enough data to identify consistent avoidance patterns.</p>';
    }
    html += '</div>';

    // ─── 8. Engagement Correlations ───
    html += '<div class="insight orange" style="margin-bottom:16px;"><h3>\uD83D\uDCC8 8. Engagement Correlations</h3>';
    html += '<p style="margin-bottom:6px;"><strong>What your top ' + top10.length + ' posts have in common:</strong></p><ul style="padding-left:20px;font-size:13px;color:#475569;margin-bottom:10px;">';

    // Analyze top posts for patterns
    var topAvgWc = Math.round(top10.reduce(function(s,p){return s+wc(p.text);},0) / top10.length);
    html += '<li>Average length: ' + topAvgWc + ' words' + (topAvgWc > avgWc * 1.15 ? ' (longer than your average)' : topAvgWc < avgWc * 0.85 ? ' (shorter than your average)' : '') + '</li>';

    var topLineBreaks = top10.filter(function(p){return p.text.split(/\n/).filter(function(l){return l.trim();}).length >= 5;}).length;
    html += '<li>' + Math.round(topLineBreaks/top10.length*100) + '% use generous white space</li>';

    var topQuestions = top10.filter(function(p){return /\?/.test(p.text);}).length;
    html += '<li>' + Math.round(topQuestions/top10.length*100) + '% contain questions</li>';

    var topStories = top10.filter(function(p){return /\b(I |my |when I|years? ago)/i.test(p.text);}).length;
    html += '<li>' + Math.round(topStories/top10.length*100) + '% include personal stories</li>';

    var topData = top10.filter(function(p){return /\d{2,}[%$]|\$[\d,]+|\d+x/i.test(p.text);}).length;
    html += '<li>' + Math.round(topData/top10.length*100) + '% use specific numbers or data</li>';
    html += '</ul>';

    // Bottom quartile patterns
    if (botQ.length >= 3) {
      var botAvgWc = Math.round(botQ.reduce(function(s,p){return s+wc(p.text);},0) / botQ.length);
      html += '<p style="margin-bottom:6px;"><strong>Bottom quartile patterns:</strong></p><ul style="padding-left:20px;font-size:13px;color:#475569;margin-bottom:10px;">';
      html += '<li>Average length: ' + botAvgWc + ' words</li>';
      var botStories = botQ.filter(function(p){return /\b(I |my |when I)/i.test(p.text);}).length;
      html += '<li>' + Math.round(botStories/botQ.length*100) + '% include personal stories</li>';
      var botQuestions = botQ.filter(function(p){return /\?/.test(p.text);}).length;
      html += '<li>' + Math.round(botQuestions/botQ.length*100) + '% contain questions</li>';
      html += '</ul>';
    }

    // Engagement formula
    html += '<div class="hook-summary" style="margin-top:12px;"><h3>\uD83C\uDFAF Your Engagement Formula</h3><p>';
    var formula = [];
    if (topAvgWc > avgWc * 1.1) formula.push('write longer (' + topAvgWc + '+ words)');
    else if (topAvgWc < avgWc * 0.9) formula.push('keep it concise (' + topAvgWc + ' words)');
    if (topStories > top10.length * 0.5) formula.push('lead with personal stories');
    if (topData > top10.length * 0.4) formula.push('include specific numbers');
    if (topQuestions > top10.length * 0.5) formula.push('ask questions');
    if (topLineBreaks > top10.length * 0.6) formula.push('use generous white space');
    formula.push('open with a ' + esc(bestOpener).toLowerCase() + ' hook');
    html += 'Your best posts tend to: <strong>' + formula.join(', ') + '</strong>.';
    html += '</p></div>';
    html += '</div>';

    // ─── Writing Instructions Summary ───
    html += '<div class="hook-summary" style="margin-top:16px;"><h3>\u270D\uFE0F Writing Instructions Summary</h3>';
    html += '<p style="margin-bottom:8px;">To write in this voice, follow these rules:</p><ol style="padding-left:20px;font-size:13px;color:#475569;line-height:1.8;">';
    html += '<li>Open with a <strong>' + esc(bestOpener).toLowerCase() + '</strong> hook \u2014 this is your strongest opener style.</li>';
    if (shortPct > 30) html += '<li>Use short, punchy sentences (many under 5 words). Create rhythm and urgency.</li>';
    else html += '<li>Mix sentence lengths \u2014 pair longer analytical sentences with short impactful ones.</li>';
    if (iCount > youCount * 1.5) html += '<li>Lead with personal experience and first-person perspective ("I did X, here\'s what I learned").</li>';
    else if (youCount > iCount) html += '<li>Address the reader directly. Use "you" and "your" frequently.</li>';
    if (lineBreakPosts > qual.length * 0.4) html += '<li>Use generous white space. One idea per line. Let the post breathe.</li>';
    if (dataPosts.length > qual.length * 0.3) html += '<li>Include specific numbers and data points to back up claims.</li>';
    if (storyPosts.length > qual.length * 0.3) html += '<li>Ground arguments in real stories and personal experience, not abstract advice.</li>';
    if (strong > hedges * 1.5) html += '<li>Take strong positions. Avoid hedging with "maybe" or "perhaps." Be direct.</li>';
    else if (hedges > strong) html += '<li>Keep a measured, nuanced tone. Acknowledge complexity rather than oversimplifying.</li>';
    html += '<li>Target ' + avgWc + ' words per post (your sweet spot).</li>';
    if (qClosePosts > qual.length * 0.3) html += '<li>End with a specific question to drive comments.</li>';
    if (sigPhrases.length >= 3) html += '<li>Incorporate signature phrases: "' + esc(sigPhrases.slice(0,3).join('", "')) + '".</li>';
    if (avoids.length >= 2) html += '<li>Avoid: ' + avoids.slice(0,3).map(function(a){return a.split(' \u2014 ')[0].toLowerCase();}).join(', ') + '.</li>';
    html += '<li>Match the overall tone: ' + voiceTraits.slice(0,2).join(', ') + '.</li>';
    html += '</ol></div>';

    container.innerHTML = html;
  }

  // ── Enhanced Posting Frequency ────────────────────────────────────
  function renderFrequency(posts) {
    var container = document.getElementById('frequency');
    var monthsArr = posts.map(function(p){return dateToMonths(p.date);});
    var maxM = Math.max.apply(null, monthsArr.concat([1]));
    var tLabel = maxM >= 12 ? (maxM/12).toFixed(1)+' years' : Math.round(maxM)+' months';
    var pm = maxM > 0 ? posts.length/maxM : posts.length;
    var pw = pm / 4.33;

    // Time period buckets
    var periods = [
      { label: 'Last 7 days', min: 0, max: 7/30 },
      { label: 'Last 30 days', min: 0, max: 1 },
      { label: '1\u20133 months ago', min: 1, max: 3 },
      { label: '3\u20136 months ago', min: 3, max: 6 },
      { label: '6\u201312 months ago', min: 6, max: 12 },
      { label: '1+ year ago', min: 12, max: Infinity }
    ];
    var periodCounts = periods.map(function(pd) {
      return posts.filter(function(p) {
        var m = dateToMonths(p.date);
        return m >= pd.min && m < pd.max;
      }).length;
    });

    // Trend: compare last 3 months vs 3-6 months
    var recent3 = posts.filter(function(p){return dateToMonths(p.date)<3;}).length;
    var older3 = posts.filter(function(p){var m=dateToMonths(p.date);return m>=3&&m<6;}).length;
    var trendPct = older3 > 0 ? Math.round((recent3 - older3) / older3 * 100) : 0;
    var trendLabel = trendPct > 20 ? 'Your posting frequency has increased significantly recently \u2014 great momentum! Keep it up.' :
                     trendPct > 0 ? 'Your posting frequency has slightly increased recently. Consistency is key to building audience.' :
                     trendPct > -20 ? 'Your posting frequency has been relatively stable. Consistency is one of the most important factors for LinkedIn growth.' :
                     'Your posting frequency has dropped recently. The LinkedIn algorithm rewards consistent posters \u2014 try to get back to a regular cadence.';

    // Cadence recommendation
    var cadenceRec = pw >= 5 ? 'You\'re posting very frequently (' + pw.toFixed(1) + ' posts/week). This is great for growth but make sure quality isn\'t suffering. Consider batching content creation.' :
                     pw >= 3 ? 'You\'re posting ' + pw.toFixed(1) + ' times per week \u2014 this is an excellent cadence for LinkedIn growth. Most successful LinkedIn creators post 3-5 times per week.' :
                     pw >= 1 ? 'At ' + pw.toFixed(1) + ' posts per week, you have room to increase. Top LinkedIn creators typically post 3-5 times per week. Even increasing by one extra post per week can significantly boost your reach.' :
                     'At ' + pw.toFixed(1) + ' posts per week, you\'re posting infrequently. The LinkedIn algorithm strongly favours consistent creators. Aim for at least 2-3 posts per week to build meaningful momentum.';

    var html = '';
    html += ins('\uD83D\uDCC6 Overall Cadence', posts.length + ' posts over ~' + tLabel + ', averaging ' + pm.toFixed(1) + ' posts/month (' + pw.toFixed(1) + ' posts/week). ' + cadenceRec, '');

    // Period breakdown
    var periodHtml = '<strong>Posting breakdown by time period:</strong><br><br>';
    periods.forEach(function(pd, idx) {
      if (periodCounts[idx] > 0 || idx < 4) {
        periodHtml += '\u2022 <strong>' + pd.label + ':</strong> ' + periodCounts[idx] + ' post' + (periodCounts[idx]!==1?'s':'') + '<br>';
      }
    });
    html += ins('\uD83D\uDCCA Period Breakdown', periodHtml, '');
    html += ins('\uD83D\uDCC8 Trend', trendLabel + ' (Last 3 months: ' + recent3 + ' posts vs previous 3 months: ' + older3 + ' posts' + (trendPct !== 0 ? ', ' + (trendPct > 0 ? '+' : '') + trendPct + '%' : '') + '.)', trendPct > 0 ? 'green' : trendPct < -20 ? 'orange' : '');

    container.innerHTML = html;
  }

  // ── Content & Post Insights (verbose, single column) ──────────────
  function generateInsights(posts, sorted, byViews, hasViews) {
    var container = document.getElementById('insights');
    var engValues = posts.map(function(p){return eng(p);});
    var avgEng = engValues.reduce(function(a,b){return a+b;},0) / posts.length;
    var medEng = median(engValues);
    var best = sorted[0];
    var totalLikes = posts.reduce(function(s,p){return s+(p.likes||0);},0);
    var totalComments = posts.reduce(function(s,p){return s+(p.comments||0);},0);
    var html = '';

    // Best post analysis
    if (best) {
      var pct = avgEng > 0 ? Math.round(((eng(best) - avgEng) / avgEng) * 100) : 0;
      html += ins('Top Post Performance',
        'Your best post achieved ' + eng(best) + ' total engagement ('+best.likes+' likes, '+best.comments+' comments), which is ' + pct + '% above your average of ' + avgEng.toFixed(1) + '. ' +
        'This suggests your audience responds strongly when you hit the right combination of topic and hook. Study what made this post resonate \u2014 was it the topic, the format, or the timing? Try to replicate those elements in future posts.', '');
    }

    // Best category
    var catMap = {};
    posts.forEach(function(p){(p._categories||[]).forEach(function(c){if(!catMap[c])catMap[c]={sum:0,count:0,vSum:0};catMap[c].sum+=eng(p);catMap[c].count++;catMap[c].vSum+=views(p);});});
    var bestCat = null, bestCatAvg = 0;
    Object.keys(catMap).forEach(function(c) {
      if (catMap[c].count >= 2) { var avg = catMap[c].sum / catMap[c].count; if (avg > bestCatAvg) { bestCatAvg = avg; bestCat = c; } }
    });
    if (bestCat) {
      var catCount = catMap[bestCat].count;
      var catPct = Math.round(catCount / posts.length * 100);
      html += ins('Strongest Topic: ' + bestCat,
        'Your "' + bestCat + '" posts consistently outperform, averaging ' + bestCatAvg.toFixed(1) + ' engagement across ' + catCount + ' posts (' + catPct + '% of your content). ' +
        (hasViews ? 'They average ' + fmt(Math.round(catMap[bestCat].vSum / catCount)) + ' views per post. ' : '') +
        'This is clearly your strongest content pillar. Consider making it a larger share of your content mix, and experiment with different angles within this topic to keep it fresh.', 'purple');
    }

    // Content length analysis
    var lBuckets = [{label:'Short (<50 words)',min:0,max:49},{label:'Medium (50-150 words)',min:50,max:150},{label:'Long (151-350 words)',min:151,max:350},{label:'Very long (350+ words)',min:351,max:Infinity}];
    var bestB = null, bestBA = 0, bucketData = [];
    lBuckets.forEach(function(b) {
      var inB = posts.filter(function(p){return wc(p.text) >= b.min && wc(p.text) <= b.max;});
      var avg = inB.length >= 2 ? inB.reduce(function(s,p){return s+eng(p);},0)/inB.length : 0;
      bucketData.push({ label: b.label, count: inB.length, avg: avg });
      if (inB.length >= 2 && avg > bestBA) { bestBA = avg; bestB = b; }
    });
    if (bestB) {
      var detail = bucketData.map(function(bd) { return bd.count > 0 ? '\u2022 ' + bd.label + ': ' + bd.count + ' posts, ' + bd.avg.toFixed(1) + ' avg engagement' : ''; }).filter(Boolean).join('<br>');
      html += ins('Optimal Content Length',
        bestB.label + ' posts perform best for you, averaging ' + bestBA.toFixed(1) + ' engagement. Here\'s the full breakdown:<br><br>' + detail + '<br><br>' +
        'On LinkedIn, the algorithm tends to reward posts that keep people reading. Longer posts often signal depth and expertise, but only if the content is genuinely valuable. Don\'t pad for length \u2014 aim for the sweet spot that matches your best-performing range.', '');
    }

    // Engagement consistency
    var cR = avgEng > 0 ? medEng / avgEng : 1;
    var consistencyAdvice = cR < 0.5 ?
      'Your engagement is quite inconsistent \u2014 a few viral posts are pulling your average up significantly while many posts underperform. This is common and not necessarily bad, but it means your reach is unpredictable. Try to identify what made your breakout posts different and apply those patterns more consistently.' :
      cR > 0.8 ?
      'Your engagement is very consistent across posts \u2014 your audience reliably engages with your content. This is a strong signal of product-market fit with your audience. To level up, try experimenting with hooks and topics that could produce breakout posts while maintaining your baseline.' :
      'Your engagement is fairly consistent with some natural variation. This is healthy. Focus on gradually raising your baseline engagement by refining your hooks and posting at optimal times.';
    html += ins('Engagement Consistency',
      'Your median engagement is ' + medEng.toFixed(1) + ' vs a mean of ' + avgEng.toFixed(1) + '. ' + consistencyAdvice, '');

    // Comment-to-like ratio
    if (totalLikes > 0) {
      var r = totalComments / totalLikes;
      var ratioAdvice = r < 0.05 ?
        'Your comment-to-like ratio is low at ' + r.toFixed(2) + ' comments per like. This means people are passively appreciating your content but not feeling compelled to join the conversation. Try ending posts with a direct question, sharing a controversial opinion, or asking your audience to share their own experiences. Comments are weighted heavily by the LinkedIn algorithm \u2014 even a small increase can significantly boost reach.' :
        r < 0.15 ?
        'At ' + r.toFixed(2) + ' comments per like, your comment ratio is decent. Your audience engages in conversation on some posts. To improve further, try asking specific questions rather than generic ones, share strong opinions that invite debate, and always reply to comments quickly to keep the thread alive.' :
        'At ' + r.toFixed(2) + ' comments per like, you have an excellent comment-to-like ratio. Your audience is actively engaging in conversation, which is the strongest signal to the LinkedIn algorithm. Keep doing what you\'re doing \u2014 this is a major competitive advantage.';
      html += ins('Comment-to-Like Ratio', ratioAdvice, r >= 0.15 ? 'green' : '');
    }

    // Zero engagement posts
    var zp = posts.filter(function(p){return eng(p)===0;}).length;
    if (zp > 0) {
      html += ins('Zero-Engagement Posts',
        zp + ' of ' + posts.length + ' posts (' + Math.round(zp/posts.length*100) + '%) received zero engagement. This can happen when posting at low-traffic times, using weak hooks, or when the topic doesn\'t resonate. Review these posts to identify patterns \u2014 were they posted at odd hours? Were the opening lines compelling? Consider deleting or reworking the worst performers, as low-engagement posts can drag down your profile\'s algorithmic score.', 'orange');
    }

    // Views-specific insights
    if (hasViews) {
      var vv = posts.map(function(p){return views(p);}).filter(function(v){return v>0;});
      if (vv.length > 0) {
        var avgV = vv.reduce(function(a,b){return a+b;},0) / vv.length;

        // Viral posts
        var viral = posts.filter(function(p){return views(p) > avgV*3;});
        if (viral.length > 0) {
          html += ins('Viral Posts',
            viral.length + ' post' + (viral.length!==1?'s':'') + ' achieved 3x+ your average views of ' + fmt(Math.round(avgV)) + '. Your most viral post hit ' + fmt(views(byViews[0])) + ' views. ' +
            'Viral posts on LinkedIn often share a pattern: a strong emotional hook, a relatable story or surprising insight, and content that makes people want to tag others. Study your viral posts closely and try to reverse-engineer what triggered the breakout.', 'green');
        }

        // Best engagement rate
        var pwv = posts.filter(function(p){return views(p)>0;});
        if (pwv.length > 0) {
          var br = pwv.slice().sort(function(a,b){return engRate(b)-engRate(a);})[0];
          html += ins('Best Engagement Rate',
            'Your top-converting post achieved a ' + engRate(br).toFixed(1) + '% engagement rate (' + eng(br) + ' engagements from ' + fmt(views(br)) + ' views). A high engagement rate means the content resonated deeply with those who saw it, even if the reach was limited. Posts with high engagement rates are your best candidates for boosting or repurposing, as the content itself is proven to resonate.', 'purple');
        }

        // Views consistency
        var vR = avgV > 0 ? median(vv) / avgV : 1;
        html += ins('Reach Consistency',
          'Your median views are ' + fmt(Math.round(median(vv))) + ' vs a mean of ' + fmt(Math.round(avgV)) + '. ' +
          (vR < 0.5 ? 'Your reach is very spiky \u2014 some posts break out while others barely get seen. This is typical of accounts that haven\'t yet built a consistent readership base. Focus on posting consistently at the same times to train your audience to expect your content.' :
           vR > 0.8 ? 'Your reach is remarkably consistent. Your audience reliably sees your content, which suggests strong follower engagement and good algorithmic standing. This is an excellent foundation for growth.' :
           'Your reach has moderate variation, which is normal. Some posts naturally get more distribution than others based on topic, timing, and hook quality.'), 'green');

        // Best category for views
        var catVMap = {};
        posts.forEach(function(p){if(views(p)>0)(p._categories||[]).forEach(function(c){if(!catVMap[c])catVMap[c]={sum:0,count:0};catVMap[c].sum+=views(p);catVMap[c].count++;});});
        var bestVC = null, bestVCA = 0;
        Object.keys(catVMap).forEach(function(c){if(catVMap[c].count>=2){var avg=catVMap[c].sum/catVMap[c].count;if(avg>bestVCA){bestVCA=avg;bestVC=c;}}});
        if (bestVC) {
          html += ins('Highest-Reach Topic',
            'Your "' + bestVC + '" posts attract the most eyeballs, averaging ' + fmt(Math.round(bestVCA)) + ' views per post. ' +
            (bestVC === bestCat ? 'This is also your best engagement topic \u2014 a powerful combination. Double down on this topic.' :
            'Interestingly, this differs from your best engagement topic' + (bestCat ? ' ("' + bestCat + '")' : '') + '. High views but lower engagement might mean this topic attracts a broader audience but resonates less deeply. Consider how to make these posts more engaging with stronger CTAs or questions.'), 'green');
        }
      }
    }

    container.innerHTML = html;
  }

  // ── Expert Recommendations ────────────────────────────────────────
  function generateRecommendations(posts, byEng, byViews, hasViews) {
    var container = document.getElementById('recommendations');
    var recs = [];
    var avgEng = posts.reduce(function(s,p){return s+eng(p);},0) / posts.length;
    var totalLikes = posts.reduce(function(s,p){return s+(p.likes||0);},0);
    var totalComments = posts.reduce(function(s,p){return s+(p.comments||0);},0);
    var monthsArr = posts.map(function(p){return dateToMonths(p.date);});
    var maxM = Math.max.apply(null, monthsArr.concat([1]));
    var pw = maxM > 0 ? posts.length / maxM / 4.33 : posts.length;

    // 1. Content length
    var lBuckets = [{label:'short (<50 words)',min:0,max:49},{label:'medium (50-150 words)',min:50,max:150},{label:'long (151-350 words)',min:151,max:350},{label:'very long (350+ words)',min:351,max:Infinity}];
    var bestB = null, bestBA = 0;
    lBuckets.forEach(function(b){
      var inB = posts.filter(function(p){return wc(p.text) >= b.min && wc(p.text) <= b.max;});
      if(inB.length >= 2){var avg = inB.reduce(function(s,p){return s+eng(p);},0)/inB.length; if(avg > bestBA){bestBA = avg; bestB = b;}}
    });
    if (bestB) {
      recs.push({ title: 'Optimise Your Post Length', text: 'Your data shows that ' + bestB.label + ' posts perform best with ' + bestBA.toFixed(1) + ' avg engagement. Aim to write within this range more often. LinkedIn\'s max is about 3,000 characters (~500 words). If you want to experiment with longer posts, make sure the first two lines are incredibly compelling \u2014 LinkedIn truncates after about 35 words on mobile.' });
    }

    // 2. Posting cadence
    if (pw < 3) {
      recs.push({ title: 'Increase Your Posting Frequency', text: 'You\'re currently averaging ' + pw.toFixed(1) + ' posts per week. The sweet spot for LinkedIn growth is 3-5 posts per week. Even adding one extra post per week can increase your total impressions by 30-50% due to compounding algorithmic benefits. Try batching content creation on weekends.' });
    } else if (pw >= 5) {
      recs.push({ title: 'Quality Over Quantity', text: 'At ' + pw.toFixed(1) + ' posts per week, you\'re very active. Make sure each post earns its place \u2014 one great post outperforms three mediocre ones. Consider reducing slightly and investing more time in crafting strong hooks and valuable insights.' });
    } else {
      recs.push({ title: 'Maintain Your Cadence', text: 'Your posting frequency of ' + pw.toFixed(1) + ' posts per week is in the ideal range. Consistency is one of the biggest factors in LinkedIn growth. Keep this rhythm going and focus on incrementally improving content quality.' });
    }

    // 3. Hook strategy
    var hookMap = {};
    posts.forEach(function(p){var t = p._hookType||'Statement';if(!hookMap[t])hookMap[t]={sum:0,count:0};hookMap[t].sum+=eng(p);hookMap[t].count++;});
    var bestHook = null, bestHA = 0;
    Object.keys(hookMap).forEach(function(h){if(hookMap[h].count>=2){var avg=hookMap[h].sum/hookMap[h].count;if(avg>bestHA){bestHA=avg;bestHook=h;}}});
    if (bestHook) {
      recs.push({ title: 'Lead With ' + bestHook + ' Hooks', text: 'Your ' + bestHook.toLowerCase() + '-style opening lines generate ' + bestHA.toFixed(1) + ' avg engagement, outperforming your overall average. The first line of your post is the single most important factor in whether someone stops scrolling. Craft your hooks deliberately \u2014 write 3-5 options for each post and pick the strongest one.' });
    }

    // 4. Topic focus
    var catMap = {};
    posts.forEach(function(p){(p._categories||[]).forEach(function(c){if(!catMap[c])catMap[c]={sum:0,count:0};catMap[c].sum+=eng(p);catMap[c].count++;});});
    var bestCat = null, bestCA = 0, worstCat = null, worstCA = Infinity;
    Object.keys(catMap).forEach(function(c){
      if(catMap[c].count>=2){
        var avg=catMap[c].sum/catMap[c].count;
        if(avg>bestCA){bestCA=avg;bestCat=c;}
        if(avg<worstCA){worstCA=avg;worstCat=c;}
      }
    });
    if (bestCat) {
      recs.push({ title: 'Double Down on ' + bestCat, text: 'Your "' + bestCat + '" content averages ' + bestCA.toFixed(1) + ' engagement per post. Make this your primary content pillar (aim for 40-50% of your posts). Create a content series around this topic to build authority and give your audience a reason to follow you specifically.' });
    }
    if (worstCat && worstCat !== bestCat) {
      recs.push({ title: 'Reconsider ' + worstCat + ' Content', text: 'Your "' + worstCat + '" posts average only ' + worstCA.toFixed(1) + ' engagement. Either find a new angle that resonates better, tie it to your stronger topics, or reduce how often you post about it. Not every topic works on LinkedIn \u2014 it\'s OK to cut what doesn\'t perform.' });
    }

    // 5. Comment strategy
    if (totalLikes > 0) {
      var cRatio = totalComments / totalLikes;
      if (cRatio < 0.1) {
        recs.push({ title: 'Boost Your Comments', text: 'Your comment-to-like ratio of ' + cRatio.toFixed(2) + ' is below average. Comments are the highest-value engagement signal on LinkedIn \u2014 they drive far more algorithmic distribution than likes. End every post with a specific, easy-to-answer question. Instead of "What do you think?", try "What\'s the one tool you couldn\'t live without?" Specificity drives responses.' });
      }
    }

    // 6. Views-specific
    if (hasViews) {
      var avgV = posts.reduce(function(s,p){return s+views(p);},0) / posts.length;
      var avgRate = avgV > 0 ? (avgEng / avgV * 100) : 0;
      if (avgRate < 3) {
        recs.push({ title: 'Improve Your Engagement Rate', text: 'Your average engagement rate of ' + avgRate.toFixed(1) + '% means most viewers scroll past without interacting. Focus on making your content more interactive: ask questions, use polls, share controversial opinions, or include practical takeaways people want to save. A good LinkedIn engagement rate is 3-5%.' });
      } else if (avgRate > 5) {
        recs.push({ title: 'Leverage Your High Engagement Rate', text: 'Your ' + avgRate.toFixed(1) + '% engagement rate is excellent. Your content clearly resonates with your audience. Now focus on expanding reach: engage with larger accounts in your niche, use relevant hashtags (2-3 per post), and post during peak hours (Tues-Thurs, 7-9am local time).' });
      }
    }

    // 7. First line
    recs.push({ title: 'Perfect Your First Line', text: 'LinkedIn shows only the first ~210 characters before the "see more" button on mobile. Your first line must create enough curiosity or value to earn the click. Techniques that work: open loops ("I lost everything in 2023. Here\'s what I learned."), surprising stats, direct challenges to conventional wisdom, or personal vulnerability.' });

    // 8. Engagement habits
    recs.push({ title: 'Engage Before and After Posting', text: 'Spend 15-20 minutes engaging with other people\'s content both before and after you publish. Comment thoughtfully on 5-10 posts in your niche. This primes the algorithm to show your content to a warm audience and signals that you\'re an active community member, not just a broadcaster.' });

    // 9. Content formats
    var avgWords = posts.reduce(function(s,p){return s+wc(p.text);},0) / posts.length;
    recs.push({ title: 'Experiment With Formats', text: 'Your average post is ' + Math.round(avgWords) + ' words. Try mixing in different formats: carousel documents (PDF uploads get 2-3x more reach), short punchy posts under 50 words for quick wins, and long-form storytelling (300-500 words) for building deep connection. Variety keeps your audience engaged and helps you discover new performance patterns.' });

    // 10. Repurpose
    var oldHighPerf = byEng.filter(function(p){return dateToMonths(p.date)>=3;}).slice(0,3);
    if (oldHighPerf.length > 0) {
      recs.push({ title: 'Repurpose Your Greatest Hits', text: 'You have ' + oldHighPerf.length + ' high-performing posts from 3+ months ago. Most of your followers never saw them the first time. Rewrite them with a fresh angle, update the data, or present the same insight in a new format. Successful LinkedIn creators repurpose their best content every 3-6 months.' });
    }

    // 11. Consistency signal
    recs.push({ title: 'Build a Content Series', text: 'Create a recurring content series (e.g., "Monday Market Takes" or "Friday Failures"). Series build anticipation, train your audience to expect content from you, and give you a reliable content framework that reduces creative friction. Some of the biggest LinkedIn creators built their following with a single recurring series.' });

    // Render
    var html = '';
    recs.forEach(function(rec, i) {
      html += '<div class="rec-item">' +
        '<div class="rec-num">' + (i+1) + '</div>' +
        '<div class="rec-body"><h4>' + esc(rec.title) + '</h4><p>' + rec.text + '</p></div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  // ── Repurpose table ───────────────────────────────────────────────
  function renderRepurpose(items) {
    var tbody = document.querySelector('#repurposeTable tbody');
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">No posts older than 2 months found.</td></tr>'; return; }
    items.forEach(function(p, i) {
      var tr = document.createElement('tr');
      var summary = esc(p._summary || trunc(p.text, 80));
      var cats = (p._categories||[]).map(function(c){var ct=getCat(c);return '<span class="cat-pill" style="background:'+ct.bg+';color:'+ct.color+';">'+c+'</span>';}).join('');
      var cell = p.url ? '<td class="post-cell"><div class="post-summary"><a href="'+esc(p.url)+'" target="_blank">'+summary+'</a></div><div class="cat-pills">'+cats+'</div></td>'
        : '<td class="post-cell"><div class="post-summary">'+summary+'</div><div class="cat-pills">'+cats+'</div></td>';
      tr.innerHTML = '<td><span class="rank">'+(i+1)+'</span></td>' + cell +
        '<td style="white-space:nowrap;">'+esc(p.date||'-')+'</td>' +
        '<td class="num">'+fmt(views(p))+'</td>' +
        '<td class="num"><strong>'+eng(p)+'</strong></td>';
      tbody.appendChild(tr);
    });
  }

  function ins(title, text, cls) {
    return '<div class="insight '+(cls||'')+'"><h3>'+title+'</h3><p>'+text+'</p></div>';
  }

  // ── Main render ───────────────────────────────────────────────────
  var _allPosts = null; // store all posts for re-filtering

  function render(posts) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Enrich only once (on first load)
    if (!_allPosts) {
      enrichPosts(posts);
      _allPosts = posts;
    }

    // Clear all dynamic content for re-render
    ['topPostsTable','bottomTable','repurposeTable','missingViewsTable'].forEach(function(id){
      var tb = document.querySelector('#'+id+' tbody');
      if (tb) tb.innerHTML = '';
    });
    ['catCharts','hookAnalysis','hashtagAnalysis','structureAnalysis','frequency','insights','recommendations','funnel','timingAnalysis','contentCalendar','shareSummaryText','lengthPerfContent','styleAnalysis'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    // Reset canvases by replacing them with fresh ones
    ['trendChart','viewsDistChart','engRateChart','engDistChart','lenEngChart','lenViewsChart','viewsEngScatter'].forEach(function(id){
      var old = document.getElementById(id);
      if (old) {
        var fresh = document.createElement('canvas');
        fresh.id = id;
        old.parentNode.replaceChild(fresh, old);
      }
    });
    // Remove old scatter tooltip listeners by replacing tooltip
    var oldTip = document.getElementById('scatter-tooltip');
    if (oldTip) {
      var newTip = oldTip.cloneNode(true);
      oldTip.parentNode.replaceChild(newTip, oldTip);
    }
    var mvCard = document.getElementById('missingViewsCard');
    if (mvCard) mvCard.style.display = 'none';

    var hasViews = posts.some(function(p){return views(p)>0;});
    var byEng = posts.slice().sort(function(a,b){return eng(b)-eng(a);});
    var byViews = posts.slice().sort(function(a,b){return views(b)-views(a);});
    var totalViews = posts.reduce(function(s,p){return s+views(p);},0);
    var totalEng = posts.reduce(function(s,p){return s+eng(p);},0);
    var totalLikes = posts.reduce(function(s,p){return s+(p.likes||0);},0);
    var totalComments = posts.reduce(function(s,p){return s+(p.comments||0);},0);
    var avgViews = totalViews/posts.length;
    var avgEng = totalEng/posts.length;
    var avgRate = hasViews?(totalEng/totalViews*100):0;

    // Median calculations
    var medViews = median(posts.map(function(p){return views(p);}).filter(function(v){return v>0;}));
    var medEng = median(posts.map(function(p){return eng(p);}));

    document.getElementById('headerSub').textContent = posts.length+' posts analyzed'+(hasViews?' \u00B7 '+fmt(totalViews)+' total views':'');

    // Update filter count
    var filterCount = document.getElementById('filterCount');
    if (filterCount) filterCount.textContent = posts.length + ' of ' + _allPosts.length + ' posts';

    // Stat cards — 8 cards in 4x2 grid
    var monthsArr = posts.map(function(p){return dateToMonths(p.date);});
    var maxM = Math.max.apply(null, monthsArr.concat([1]));
    var pw = maxM > 0 ? posts.length / maxM / 4.33 : posts.length;
    var ch = '';
    ch += sc('\uD83D\uDCDD',posts.length,'Total Posts','');
    ch += sc('\u2764\uFE0F',(totalLikes/posts.length).toFixed(1),'Avg Likes','');
    ch += sc('\uD83D\uDCAC',(totalComments/posts.length).toFixed(1),'Avg Comments','');
    if(hasViews){
      ch += sc('\uD83D\uDC41',fmt(totalViews),'Total Views','green');
      ch += sc('\uD83D\uDCCA',fmt(Math.round(medViews)),'Median Views','green');
      ch += sc('\uD83D\uDCC8',fmt(Math.round(avgViews)),'Avg Views','green');
      ch += sc('\u26A1',avgRate.toFixed(1)+'%','Avg Eng. Rate','purple');
    } else {
      ch += sc('\uD83D\uDD25',totalEng,'Total Engagement','orange');
      ch += sc('\uD83D\uDCCA',medEng.toFixed(1),'Median Eng.','orange');
      ch += sc('\uD83D\uDCC8',avgEng.toFixed(1),'Avg Engagement','orange');
      ch += sc('\uD83D\uDDE8',totalLikes > 0 ? (totalComments/totalLikes).toFixed(2) : '0','Comment/Like Ratio','purple');
    }
    ch += sc('\uD83D\uDCC5',pw.toFixed(1),'Posts / Week','');
    document.getElementById('statCards').innerHTML = ch;
    function sc(icon,val,label,cls){
      return '<div class="stat-card '+cls+'"><div class="icon">'+icon+'</div><div class="value">'+val+'</div><div class="label">'+label+'</div></div>';
    }

    // Unified Top Posts (sortable + paginated)
    renderUnifiedTopPosts(posts, hasViews);

    // Views charts
    if(hasViews){
      var noDataCount = posts.filter(function(p){return views(p)===0;}).length;
      var vBuckets=[{label:'0-500',min:0,max:500},{label:'500-2K',min:501,max:2000},{label:'2K-5K',min:2001,max:5000},{label:'5K-10K',min:5001,max:10000},{label:'10K-50K',min:10001,max:50000},{label:'50K+',min:50001,max:Infinity}];
      var vLabels = vBuckets.map(function(b){return b.label;});
      var vValues = vBuckets.map(function(b){return posts.filter(function(p){var v=views(p);return v>=b.min&&v<=b.max;}).length;});
      if (noDataCount > 0) { vLabels.push('No data'); vValues.push(noDataCount); }
      drawBarChart(document.getElementById('viewsDistChart'), vLabels, vValues, {color:'#059669'});
      var pwv=posts.filter(function(p){return views(p)>0;});
      var rBuckets=[{label:'0-1%',min:0,max:1},{label:'1-3%',min:1.01,max:3},{label:'3-5%',min:3.01,max:5},{label:'5-10%',min:5.01,max:10},{label:'10%+',min:10.01,max:Infinity}];
      drawBarChart(document.getElementById('engRateChart'),
        rBuckets.map(function(b){return b.label;}),
        rBuckets.map(function(b){return pwv.filter(function(p){var r=engRate(p);return r>=b.min&&r<=b.max;}).length;}),
        {color:'#7c3aed'});
    } else { document.getElementById('viewsChartsRow').style.display='none'; }

    // Missing views diagnostic table
    var missingPosts = posts.filter(function(p){return views(p)===0;});
    if (missingPosts.length > 0) {
      document.getElementById('missingViewsCard').style.display = '';
      var hasDebug = missingPosts.some(function(p){return p._debug;});
      if (hasDebug) document.getElementById('missingDebugHint').style.display = '';
      var mvBody = document.querySelector('#missingViewsTable tbody');
      missingPosts.slice(0, 20).forEach(function(p, i) {
        var tr = document.createElement('tr');
        var summary = esc(p._summary || trunc(p.text, 80));
        var link = p.url ? '<a href="'+esc(p.url)+'" target="_blank">'+summary+'</a>' : summary;
        tr.innerHTML = '<td>'+(i+1)+'</td>' +
          '<td class="post-cell"><div class="post-summary">'+link+'</div></td>' +
          '<td style="white-space:nowrap;">'+esc(p.date||'-')+'</td>' +
          '<td class="num">'+(p.likes||0)+'</td>' +
          '<td class="num">'+(p.comments||0)+'</td>' +
          '<td style="font-size:11px;color:#94a3b8;max-width:200px;overflow:hidden;text-overflow:ellipsis;">'+esc(p._debug||'none found')+'</td>';
        mvBody.appendChild(tr);
      });
      if (missingPosts.length > 20) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align:center;color:#94a3b8;padding:12px;">...and '+(missingPosts.length-20)+' more</td>';
        mvBody.appendChild(tr);
      }
    }

    // Engagement distribution
    var eBuckets=[{label:'0-15',min:0,max:15},{label:'16-30',min:16,max:30},{label:'31-50',min:31,max:50},{label:'51-100',min:51,max:100},{label:'101-250',min:101,max:250},{label:'250+',min:251,max:Infinity}];
    drawBarChart(document.getElementById('engDistChart'),
      eBuckets.map(function(b){return b.label;}),
      eBuckets.map(function(b){return posts.filter(function(p){var e=eng(p);return e>=b.min&&e<=b.max;}).length;}),
      {color:'#0a66c2'});

    // Length vs engagement (word count)
    var lBuckets=[{label:'Short\n(<50 words)',min:0,max:49},{label:'Medium\n(50-150)',min:50,max:150},{label:'Long\n(151-350)',min:151,max:350},{label:'Very Long\n(350+)',min:351,max:Infinity}];
    drawBarChart(document.getElementById('lenEngChart'),
      lBuckets.map(function(b){return b.label;}),
      lBuckets.map(function(b){
        var inB=posts.filter(function(p){var l=wc(p.text);return l>=b.min&&l<=b.max;});
        return inB.length?+(inB.reduce(function(s,p){return s+eng(p);},0)/inB.length).toFixed(1):0;
      }),{color:'#0a66c2'});

    // Length vs views + scatter
    if(hasViews){
      drawBarChart(document.getElementById('lenViewsChart'),
        lBuckets.map(function(b){return b.label;}),
        lBuckets.map(function(b){
          var inB=posts.filter(function(p){var l=wc(p.text);return l>=b.min&&l<=b.max;});
          return inB.length?Math.round(inB.reduce(function(s,p){return s+views(p);},0)/inB.length):0;
        }),{color:'#059669'});
      drawScatter(document.getElementById('viewsEngScatter'),
        posts.filter(function(p){return views(p)>0;}).map(function(p){
          return {x:views(p),y:eng(p),tip:'<strong>'+fmt(views(p))+' views</strong><br>Engagement: '+eng(p)+' ('+engRate(p).toFixed(1)+'%)<br><em>'+esc(trunc(p._summary||firstLine(p.text),70))+'</em>'};
        }),{xLabel:'Views',yLabel:'Engagement',tooltipId:'scatter-tooltip',dotColor:'rgba(5,150,105,0.5)',dotStroke:'rgba(5,150,105,0.7)',fmtX:function(v){return fmt(Math.round(v));},fmtY:function(v){return Math.round(v);}});
    } else { document.getElementById('lenViewsRow').style.display='none'; }

    // Funnel
    if(hasViews&&totalViews>0){
      var fe=document.getElementById('funnel');
      fe.innerHTML=
        '<div class="funnel-step" style="width:85%;background:linear-gradient(135deg,#059669,#047857);">'+fmt(totalViews)+' Views</div>'+
        '<div class="funnel-arrow">\u25BC</div><div class="funnel-pct">'+(totalLikes/totalViews*100).toFixed(2)+'% liked</div>'+
        '<div class="funnel-step" style="width:55%;background:linear-gradient(135deg,#0a66c2,#1e40af);">'+fmt(totalLikes)+' Likes</div>'+
        '<div class="funnel-arrow">\u25BC</div><div class="funnel-pct">'+(totalComments/totalViews*100).toFixed(2)+'% commented</div>'+
        '<div class="funnel-step" style="width:35%;background:linear-gradient(135deg,#7c3aed,#5b21b6);">'+fmt(totalComments)+' Comments</div>';
    } else { document.getElementById('funnelCard').style.display='none'; }

    // Categories (after funnel)
    renderCategories(posts, hasViews);

    // Hook Pattern Analysis
    renderHookAnalysis(posts, hasViews);

    // Content Length Performance cards
    renderLengthPerformance(posts, hasViews);

    // Bottom 5
    renderPostTable('bottomTable', byEng.slice().reverse().slice(0,5), ['views','likes','comments','eng']);

    // Frequency
    renderFrequency(posts);

    // Insights
    generateInsights(posts, byEng, byViews, hasViews);

    // Recommendations
    generateRecommendations(posts, byEng, byViews, hasViews);

    // Repurpose
    renderRepurpose(byEng.filter(function(p){return dateToMonths(p.date)>=2;}).slice(0,10));

    // Hashtag Analysis
    renderHashtagAnalysis(posts, hasViews);

    // Post Structure Analysis
    renderStructureAnalysis(posts, hasViews);

    // Engagement Trends Chart
    renderTrendChart(posts, hasViews);

    // Best Time to Post
    renderTimingAnalysis(posts, hasViews);

    // Content Calendar
    renderContentCalendar(posts, hasViews);

    // Writing Style Profile
    renderStyleProfile(posts, hasViews);

    // Share Summary
    renderShareSummary(posts, hasViews, medViews, avgEng, medEng, totalViews);

    // Build nav, tabs & collapsible after all sections rendered
    setTimeout(function() { buildSectionNav(); initTabs(); initCollapsible(); }, 50);
  }

  // ── Load & go ─────────────────────────────────────────────────────
  chrome.storage.local.get('linkedinPosts', function(result) {
    var posts = result.linkedinPosts;
    if (!posts || !posts.length) { document.getElementById('loading').textContent = 'No data found. Please scrape some posts first.'; return; }
    render(posts);
    initFilter();
  });

  // ── Show/restore all tabs for export ─────────────────────────────
  function showAllTabs() {
    var panels = document.querySelectorAll('.tab-panel');
    panels.forEach(function(p) { p.classList.add('active'); });
    var tabBar = document.getElementById('tabBar');
    if (tabBar) tabBar.style.display = 'none';
  }
  function restoreTabs() {
    var tabBar = document.getElementById('tabBar');
    if (tabBar) tabBar.style.display = '';
    var activeTab = tabBar ? tabBar.querySelector('.tab-btn.active') : null;
    var activeId = activeTab ? activeTab.getAttribute('data-tab') : 'overview';
    document.querySelectorAll('.tab-panel').forEach(function(p) {
      p.classList.toggle('active', p.getAttribute('data-tab') === activeId);
    });
  }

  // ── Print / PDF ───────────────────────────────────────────────────
  document.getElementById('printBtn').addEventListener('click', function() {
    showAllTabs();
    setTimeout(function() {
      window.print();
      restoreTabs();
    }, 50);
  });

  // ── Download self-contained HTML report ───────────────────────────
  document.getElementById('downloadHtmlBtn').addEventListener('click', function() {
    // Show all tabs so report includes everything
    showAllTabs();

    var canvases = document.querySelectorAll('canvas');
    var originals = [];
    canvases.forEach(function(c) {
      var img = document.createElement('img');
      img.src = c.toDataURL('image/png');
      img.style.cssText = c.style.cssText;
      img.style.width = c.style.width || c.clientWidth + 'px';
      originals.push({ canvas: c, parent: c.parentNode, next: c.nextSibling });
      c.parentNode.replaceChild(img, c);
    });

    var actionBar = document.querySelector('.action-bar');
    var tooltip = document.getElementById('scatter-tooltip');
    if (actionBar) actionBar.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';

    var html = '<!DOCTYPE html>\n<html lang="en">\n' + document.documentElement.innerHTML + '\n</html>';
    html = html.replace(/<script[^>]*src="analyze\.js"[^>]*><\/script>/gi, '');
    html = html.replace(/<div id="loading"[^>]*>.*?<\/div>/gi, '');

    originals.forEach(function(o) {
      var img = o.next ? o.next.previousSibling : o.parent.lastChild;
      o.parent.replaceChild(o.canvas, img);
    });
    if (actionBar) actionBar.style.display = '';
    if (tooltip) tooltip.style.display = '';

    // Restore tab state
    restoreTabs();

    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'linkedin-analytics-' + new Date().toISOString().slice(0,10) + '.html';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── Engagement Trends Chart ─────────────────────────────────────
  function renderTrendChart(posts, hasViews) {
    var el = document.getElementById('trendChart');
    if (!el || posts.length < 3) return;

    // Sort by date descending (newest first in data, but we plot oldest→newest)
    var sorted = posts.slice().sort(function(a,b){ return dateToMonths(b.date) - dateToMonths(a.date); });

    var w = el.parentElement.clientWidth || 600, h = 300;
    var ctx = setupCanvas(el, w, h);
    var pad = { top: 30, right: 20, bottom: 50, left: 55 };
    var cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom;
    var n = sorted.length;

    // Calculate rolling average (window of 5)
    var engArr = sorted.map(function(p){return eng(p);});
    var viewArr = sorted.map(function(p){return views(p);});
    var window5 = Math.min(5, Math.floor(n/3));
    if (window5 < 2) window5 = 2;

    function rollingAvg(arr, win) {
      var result = [];
      for (var i = 0; i < arr.length; i++) {
        var start = Math.max(0, i - Math.floor(win/2));
        var end = Math.min(arr.length, i + Math.ceil(win/2));
        var sum = 0;
        for (var j = start; j < end; j++) sum += arr[j];
        result.push(sum / (end - start));
      }
      return result;
    }

    var engRolling = rollingAvg(engArr, window5);
    var maxEng = Math.max.apply(null, engArr.concat([1]));

    // Grid
    for (var i = 0; i <= 5; i++) {
      var y = pad.top + ch - (ch * i / 5);
      ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxEng * i / 5), pad.left - 8, y + 4);
    }

    // X-axis labels
    var labelStep = Math.max(1, Math.floor(n / 8));
    for (var i = 0; i < n; i += labelStep) {
      var x = pad.left + (i / (n - 1)) * cw;
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
      var label = sorted[i].date || '';
      ctx.fillText(label.length > 10 ? label.slice(0, 10) : label, x, h - pad.bottom + 16);
    }

    // Raw dots (faded)
    engArr.forEach(function(val, i) {
      var x = pad.left + (i / (n - 1)) * cw;
      var y = pad.top + ch - (val / maxEng) * ch;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10,102,194,0.2)'; ctx.fill();
    });

    // Rolling average line (engagement)
    ctx.beginPath();
    ctx.strokeStyle = '#0a66c2'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    engRolling.forEach(function(val, i) {
      var x = pad.left + (i / (n - 1)) * cw;
      var y = pad.top + ch - (val / maxEng) * ch;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Views rolling average if available
    if (hasViews) {
      var maxV = Math.max.apply(null, viewArr.concat([1]));
      var viewRolling = rollingAvg(viewArr, window5);
      ctx.beginPath();
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
      viewRolling.forEach(function(val, i) {
        var x = pad.left + (i / (n - 1)) * cw;
        var y = pad.top + ch - (val / maxV) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Legend
    ctx.fillStyle = '#0a66c2'; ctx.font = 'bold 11px -apple-system,sans-serif';
    ctx.fillText('\u2014 Engagement', pad.left + 10, pad.top - 10);
    if (hasViews) {
      ctx.fillStyle = '#059669';
      ctx.fillText('--- Views (scaled)', pad.left + 120, pad.top - 10);
    }

    // Arrow label
    ctx.fillStyle = '#64748b'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('\u2190 Oldest', pad.left + 40, h - 4);
    ctx.fillText('Newest \u2192', pad.left + cw - 40, h - 4);
  }

  // ── Best Time to Post ──────────────────────────────────────────
  function renderTimingAnalysis(posts, hasViews) {
    var container = document.getElementById('timingAnalysis');
    if (!container) return;

    // Try to extract day-of-week from recent posts with "X days ago" dates
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var dayMap = {};
    dayNames.forEach(function(d){ dayMap[d] = { posts: [], eng: 0, views: 0 }; });
    var today = new Date();
    var mapped = 0;

    posts.forEach(function(p) {
      if (!p.date) return;
      var d = p.date.toLowerCase();
      var daysAgo = 0;
      var m;
      if ((m = d.match(/(\d+)\s*day/))) daysAgo = parseInt(m[1]);
      else if ((m = d.match(/(\d+)\s*week/))) daysAgo = parseInt(m[1]) * 7;
      else if ((m = d.match(/(\d+)\s*hour/))) daysAgo = 0;
      else if (d.indexOf('yesterday') !== -1) daysAgo = 1;
      else if (d.indexOf('today') !== -1 || d.indexOf('just now') !== -1) daysAgo = 0;
      else return; // Can't determine day for "X months ago"

      var postDate = new Date(today);
      postDate.setDate(postDate.getDate() - daysAgo);
      var dayName = dayNames[postDate.getDay()];
      dayMap[dayName].posts.push(p);
      dayMap[dayName].eng += eng(p);
      if (hasViews) dayMap[dayName].views += views(p);
      mapped++;
    });

    var html = '';

    if (mapped >= 5) {
      // We have enough data to show day-of-week analysis
      var maxAvg = 0;
      var dayResults = dayNames.map(function(day) {
        var d = dayMap[day];
        var avg = d.posts.length > 0 ? d.eng / d.posts.length : 0;
        if (avg > maxAvg) maxAvg = avg;
        return { name: day, count: d.posts.length, avgEng: avg, avgViews: d.posts.length > 0 ? d.views / d.posts.length : 0 };
      });

      html += '<div style="margin-bottom:16px;">';
      dayResults.forEach(function(d) {
        var pct = maxAvg > 0 ? Math.round(d.avgEng / maxAvg * 100) : 0;
        var barColor = pct >= 80 ? '#059669' : pct >= 50 ? '#0a66c2' : '#94a3b8';
        html += '<div class="cat-chart-row">' +
          '<div class="cat-chart-label" style="color:' + barColor + ';">' + d.name.slice(0,3) + '</div>' +
          '<div class="cat-chart-bar-bg"><div class="cat-chart-bar" style="width:' + Math.max(pct, 5) + '%;background:' + barColor + ';">' + (d.count > 0 ? d.avgEng.toFixed(1) : '-') + '</div></div>' +
          '<div class="cat-chart-stats">' + d.count + ' post' + (d.count!==1?'s':'') + (hasViews && d.avgViews > 0 ? ' · ' + fmt(Math.round(d.avgViews)) + ' avg views' : '') + '</div></div>';
      });
      html += '</div>';

      var bestDay = dayResults.slice().sort(function(a,b){return b.avgEng - a.avgEng;})[0];
      if (bestDay && bestDay.count > 0) {
        html += ins('\uD83C\uDFAF Your Best Day', 'Based on ' + mapped + ' recent posts, <strong>' + bestDay.name + '</strong> is your strongest day with ' + bestDay.avgEng.toFixed(1) + ' avg engagement. ' +
          (hasViews && bestDay.avgViews > 0 ? 'Posts on this day also average ' + fmt(Math.round(bestDay.avgViews)) + ' views. ' : '') +
          'Try to make this a consistent posting day in your weekly routine.', 'green');
      }
    } else {
      html += ins('\u2139\uFE0F Limited Timing Data', 'We can only determine posting day for recent posts (those with "X days/weeks ago" dates). ' +
        'Only ' + mapped + ' posts had enough date precision. Scrape more recent posts for day-of-week analysis.', '');
    }

    // General best practices
    html += ins('\uD83D\uDCCB LinkedIn Timing Best Practices',
      '<strong>Best days:</strong> Tuesday, Wednesday, Thursday consistently perform best across LinkedIn.<br>' +
      '<strong>Best times:</strong> 7\u20139am (commute), 12\u20131pm (lunch), 5\u20136pm (end of work).<br>' +
      '<strong>Worst times:</strong> Weekends and late evenings (below 50% of peak performance).<br>' +
      '<strong>Pro tip:</strong> Post at the same time consistently — your followers learn when to expect your content. The LinkedIn algorithm rewards predictable posting patterns.', '');

    container.innerHTML = html;
  }

  // ── Content Calendar Suggestions ───────────────────────────────
  function renderContentCalendar(posts, hasViews) {
    var container = document.getElementById('contentCalendar');
    if (!container) return;
    var avgEng = posts.reduce(function(s,p){return s+eng(p);},0) / posts.length;

    // Find top 3 categories
    var catMap = {};
    posts.forEach(function(p){(p._categories||[]).forEach(function(c){if(!catMap[c])catMap[c]={sum:0,count:0};catMap[c].sum+=eng(p);catMap[c].count++;});});
    var topCats = Object.keys(catMap).map(function(c){return {name:c,avg:catMap[c].sum/catMap[c].count,count:catMap[c].count};})
      .filter(function(c){return c.count >= 2;})
      .sort(function(a,b){return b.avg - a.avg;}).slice(0, 4);
    if (topCats.length === 0) topCats = [{name:'Your Expertise',avg:0,count:0}];

    // Find best hook type
    var hookMap = {};
    posts.forEach(function(p){var t=p._hookType||'Statement';if(!hookMap[t])hookMap[t]={sum:0,count:0};hookMap[t].sum+=eng(p);hookMap[t].count++;});
    var bestHook = Object.keys(hookMap).map(function(h){return {name:h,avg:hookMap[h].sum/hookMap[h].count,count:hookMap[h].count};})
      .filter(function(h){return h.count >= 2;})
      .sort(function(a,b){return b.avg - a.avg;})[0];
    var hookAdvice = bestHook ? bestHook.name : 'Question';

    // Calculate ideal cadence
    var monthsArr = posts.map(function(p){return dateToMonths(p.date);});
    var maxM = Math.max.apply(null, monthsArr.concat([1]));
    var pw = maxM > 0 ? posts.length / maxM / 4.33 : posts.length;
    var targetDays = pw >= 4 ? 5 : pw >= 2 ? 4 : 3;

    var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    var plan = [];
    var catIdx = 0;

    days.forEach(function(day, i) {
      if (i < targetDays) {
        var cat = topCats[catIdx % topCats.length];
        var hookNote = '';
        if (i === 0) hookNote = hookAdvice + ' hook';
        else if (i === 1) hookNote = 'Story hook';
        else if (i === 2) hookNote = 'List hook';
        else if (i === 3) hookNote = 'Bold hook';
        else hookNote = 'Question hook';
        plan.push({ day: day, topic: cat.name, hook: hookNote, active: true });
        catIdx++;
      } else if (i === 5 || i === 6) {
        plan.push({ day: day, topic: 'Rest / batch create', hook: '', active: false });
      } else {
        plan.push({ day: day, topic: 'Engage only', hook: 'Comment on others', active: false });
      }
    });

    var html = '<div class="calendar-grid">';
    plan.forEach(function(d) {
      var cls = d.active ? 'highlight' : 'rest';
      var cat = getCat(d.topic);
      html += '<div class="cal-day ' + cls + '">' +
        '<div class="cal-day-name">' + d.day.slice(0,3) + '</div>';
      if (d.active) {
        html += '<div class="cal-day-topic" style="color:' + cat.color + ';">' + esc(d.topic) + '</div>' +
          '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">' + esc(d.hook) + '</div>';
      } else {
        html += '<div class="cal-day-topic" style="color:#94a3b8;">' + esc(d.topic) + '</div>';
        if (d.hook) html += '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">' + esc(d.hook) + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    // Explanation
    html += '<div class="hook-summary" style="margin-top:16px;"><h3>\uD83D\uDCA1 How to Use This Calendar</h3><p>' +
      'This plan targets <strong>' + targetDays + ' posts per week</strong> based on your current cadence of ' + pw.toFixed(1) + '/week. ' +
      'Topics rotate through your best-performing categories' + (topCats.length > 1 ? ' (' + topCats.map(function(c){return c.name;}).join(', ') + ')' : '') + '. ' +
      'Each day suggests a different hook style to keep content varied. ' +
      'Use non-posting days to engage with other creators\' content and batch-create upcoming posts. ' +
      'Consistency matters more than perfection — stick to the schedule even if some posts feel imperfect.</p></div>';

    container.innerHTML = html;
  }

  // ── Share Summary ──────────────────────────────────────────────
  function renderShareSummary(posts, hasViews, medViews, avgEng, medEng, totalViews) {
    var container = document.getElementById('shareSummaryText');
    if (!container) return;

    var totalEng = posts.reduce(function(s,p){return s+eng(p);},0);
    var totalLikes = posts.reduce(function(s,p){return s+(p.likes||0);},0);
    var totalComments = posts.reduce(function(s,p){return s+(p.comments||0);},0);

    // Find top category
    var catMap = {};
    posts.forEach(function(p){(p._categories||[]).forEach(function(c){if(!catMap[c])catMap[c]={sum:0,count:0};catMap[c].sum+=eng(p);catMap[c].count++;});});
    var topCat = Object.keys(catMap).sort(function(a,b){return catMap[b].sum/catMap[b].count - catMap[a].sum/catMap[a].count;})[0] || 'Various';

    // Build summary text
    var lines = [];
    lines.push('\uD83D\uDCCA I just analyzed my LinkedIn posting data. Here are the results:\n');
    lines.push('\uD83D\uDCDD ' + posts.length + ' posts analyzed');
    if (hasViews) {
      lines.push('\uD83D\uDC41 ' + fmt(totalViews) + ' total views (' + fmt(Math.round(medViews)) + ' median per post)');
    }
    lines.push('\u2764\uFE0F ' + fmt(totalLikes) + ' total likes');
    lines.push('\uD83D\uDCAC ' + fmt(totalComments) + ' total comments');
    if (hasViews && totalViews > 0) {
      lines.push('\u26A1 ' + (totalEng/totalViews*100).toFixed(1) + '% engagement rate');
    }
    lines.push('\uD83C\uDFAF Best topic: ' + topCat);

    // Best hook
    var hookMap = {};
    posts.forEach(function(p){var t=p._hookType||'Statement';if(!hookMap[t])hookMap[t]={sum:0,count:0};hookMap[t].sum+=eng(p);hookMap[t].count++;});
    var bestHook = Object.keys(hookMap).filter(function(h){return hookMap[h].count>=2;}).sort(function(a,b){return hookMap[b].sum/hookMap[b].count - hookMap[a].sum/hookMap[a].count;})[0];
    if (bestHook) lines.push('\uD83C\uDFA3 Best hook style: ' + bestHook);

    lines.push('\n\uD83D\uDCA1 Key takeaway: ' + (medViews > 1000 ? 'Consistency and strong hooks drive reach.' : 'Focus on quality hooks and engaging topics.'));
    lines.push('\nAnalyzed with LinkedIn Post Analyzer \uD83D\uDD0D');

    var summaryText = lines.join('\n');
    container.textContent = summaryText;

    // Copy button
    var copyBtn = document.getElementById('copyShareBtn');
    var copiedMsg = document.getElementById('copiedMsg');
    if (copyBtn) {
      // Remove old listeners by replacing
      var newBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newBtn, copyBtn);
      newBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(summaryText).then(function() {
          copiedMsg.style.display = 'inline';
          setTimeout(function(){ copiedMsg.style.display = 'none'; }, 2000);
        });
      });
    }

    // LinkedIn share button
    var shareBtn = document.getElementById('shareLinkedInBtn');
    if (shareBtn) {
      var newShare = shareBtn.cloneNode(true);
      shareBtn.parentNode.replaceChild(newShare, shareBtn);
      newShare.addEventListener('click', function() {
        // Copy text first, then open LinkedIn new post
        navigator.clipboard.writeText(summaryText).then(function() {
          copiedMsg.style.display = 'inline';
          copiedMsg.textContent = '\u2705 Copied! Paste into LinkedIn.';
          setTimeout(function(){ copiedMsg.style.display = 'none'; copiedMsg.textContent = '\u2705 Copied!'; }, 3000);
          window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
        });
      });
    }
  }

  // ── Time Frame Filter ───────────────────────────────────────────
  function initFilter() {
    var filterBar = document.getElementById('filterBar');
    if (!filterBar || !_allPosts) return;
    filterBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var range = btn.getAttribute('data-range');
      var filtered;
      if (range === 'all') {
        filtered = _allPosts;
      } else {
        var maxMonths = parseFloat(range);
        filtered = _allPosts.filter(function(p) {
          return dateToMonths(p.date) < maxMonths;
        });
      }
      if (filtered.length === 0) {
        alert('No posts found in this time range. Showing all posts instead.');
        filterBar.querySelector('[data-range="all"]').classList.add('active');
        btn.classList.remove('active');
        filtered = _allPosts;
      }
      render(filtered);
    });
  }

  // ── Section Navigator ───────────────────────────────────────────
  var _navObserver = null;
  function buildSectionNav() {
    var nav = document.getElementById('sectionNav');
    if (!nav) return;

    // Disconnect previous observer
    if (_navObserver) { _navObserver.disconnect(); _navObserver = null; }

    // Only show nav items from the active tab panel
    var activePanel = document.querySelector('.tab-panel.active');
    var sections = activePanel ? activePanel.querySelectorAll('[data-nav]') : document.querySelectorAll('[data-nav]');
    var html = '';
    sections.forEach(function(el) {
      if (el.style.display === 'none') return;
      var id = el.id || '';
      var icon = el.getAttribute('data-nav') || '';
      var label = el.getAttribute('data-nav-label') || '';
      if (id) {
        html += '<a href="#'+id+'" data-target="'+id+'">' +
          '<span class="nav-icon">'+icon+'</span>' +
          '<span class="nav-label">'+label+'</span></a>';
      }
    });
    nav.innerHTML = html;

    // Smooth scroll
    nav.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      var target = document.getElementById(a.getAttribute('data-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Scroll spy
    _navObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var id = entry.target.id;
        var link = nav.querySelector('[data-target="'+id+'"]');
        if (link) {
          if (entry.isIntersecting) link.classList.add('active');
          else link.classList.remove('active');
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px' });

    sections.forEach(function(el) {
      if (el.id && el.style.display !== 'none') _navObserver.observe(el);
    });
  }

  // ── Tab Switching ──────────────────────────────────────────────
  var _tabsInited = false;
  function initTabs() {
    if (_tabsInited) return;
    _tabsInited = true;
    var tabBar = document.getElementById('tabBar');
    if (!tabBar) return;
    tabBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      var tabId = btn.getAttribute('data-tab');

      // Update active tab button
      tabBar.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Switch panel
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.querySelector('.tab-panel[data-tab="'+tabId+'"]');
      if (panel) panel.classList.add('active');

      // Rebuild section nav for this tab
      buildSectionNav();

      // Scroll to top of container
      var container = document.querySelector('.container');
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── Collapsible Sections ───────────────────────────────────────
  function initCollapsible() {
    document.querySelectorAll('.card h2').forEach(function(h2) {
      h2.addEventListener('click', function(e) {
        // Don't collapse if clicking a link inside h2
        if (e.target.tagName === 'A') return;
        var card = h2.closest('.card');
        if (card) card.classList.toggle('collapsed');
      });
    });
  }

  window.addEventListener('resize', function() {
    clearTimeout(window._rt);
    window._rt = setTimeout(function(){ location.reload(); }, 300);
  });
})();
