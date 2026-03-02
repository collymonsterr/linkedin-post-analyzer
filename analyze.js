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

    var qual = posts.filter(function(p) { return p.text && wc(p.text) >= 100; });
    if (qual.length < 5) {
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Not enough substantive posts (100+ words) to build a writing style profile. Found ' + qual.length + ' \u2014 need at least 5.</p>';
      return;
    }

    // ── Shared analysis data ──
    var avgE = qual.reduce(function(s,p){return s+eng(p);},0) / qual.length;
    var topQ = qual.slice().sort(function(a,b){return eng(b)-eng(a);});
    var top10 = topQ.slice(0, Math.max(10, Math.ceil(qual.length * 0.25)));
    var botQ = topQ.slice(Math.floor(qual.length * 0.75));
    var avgWc = Math.round(qual.reduce(function(s,p){return s+wc(p.text);},0) / qual.length);

    // Pronouns, voice traits, hedge/strong counts (used across sections)
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
    var lowerAll = allText.toLowerCase();
    var hedges = 0, strong = 0;
    ['maybe','perhaps','might','could','somewhat','probably','possibly','seems','apparently','arguably'].forEach(function(w) { var m = lowerAll.match(new RegExp('\\b' + w + '\\b', 'gi')); if (m) hedges += m.length; });
    ['never','always','every','must','absolutely','definitely','clearly','obviously','undeniably','guaranteed'].forEach(function(w) { var m = lowerAll.match(new RegExp('\\b' + w + '\\b', 'gi')); if (m) strong += m.length; });

    // Structural analysis (used in multiple sections)
    var lineBreakPosts = qual.filter(function(p) { return p.text.split(/\n/).filter(function(l){return l.trim();}).length >= 5; }).length;
    var listPosts = qual.filter(function(p) { return /^[\s]*[\-\u2022\u25CF\u25CB\u2023\u2043\u25AA\u25A0\u2022\u25CF\u25BA\u25B8]|\d+[.)]\s/m.test(p.text); }).length;
    var dataPosts = qual.filter(function(p) { return /\d{2,}[%$]|\$[\d,]+|\d+x|\d+ ?(percent|million|billion|thousand)/i.test(p.text); });
    var storyPosts = qual.filter(function(p) { return /\b(I |my |when I|years? ago|back in|I remember|true story)/i.test(p.text); });
    var analogyPosts = qual.filter(function(p) { return /\b(like a|it's like|think of it|imagine|same way|just as)\b/i.test(p.text); });
    var rhetoricPosts = qual.filter(function(p) { return (p.text.match(/\?/g) || []).length >= 2; });
    var qClosePosts = qual.filter(function(p) {
      var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
      return lines.length > 0 && /\?\s*$/.test(lines[lines.length-1]);
    }).length;

    // Helper: quote a post excerpt with metrics
    function rq(p, text, note) {
      var h = '<div class="report-quote">\u201C' + esc(text) + '\u201D';
      h += '<span class="rq-metric"> \u2014 ';
      if (hasViews && views(p) > 0) h += fmt(views(p)) + ' views, ';
      h += eng(p) + ' engagement</span>';
      if (note) h += '<span class="rq-note">' + esc(note) + '</span>';
      h += '</div>';
      return h;
    }
    function firstSentences(text, n) {
      var s = text.split(/(?<=[.!?])\s+/).slice(0, n || 2);
      return s.join(' ').substring(0, 250) + (s.join(' ').length > 250 ? '...' : '');
    }

    var html = '<div class="report">';

    // ── Meta header ──
    html += '<div class="report-meta">';
    html += '<strong>' + qual.length + ' posts analysed</strong> (100+ words) out of ' + posts.length + ' total';
    if (hasViews) {
      var medV = median(qual.map(function(p){return views(p);}).filter(function(v){return v>0;}));
      html += ' &middot; Median views: <strong>' + fmt(Math.round(medV)) + '</strong>';
    }
    html += ' &middot; Median engagement: <strong>' + median(qual.map(function(p){return eng(p);})).toFixed(0) + '</strong>';
    html += ' &middot; Avg word count: <strong>' + avgWc + '</strong>';
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 1. OPENING PATTERNS
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>1. How You Open Posts</h3>';

    var openerMap = {};
    qual.forEach(function(p) {
      var t = p._hookType || 'Statement';
      if (!openerMap[t]) openerMap[t] = [];
      openerMap[t].push(p);
    });
    var openerTypes = Object.keys(openerMap).sort(function(a,b){return openerMap[b].length - openerMap[a].length;});

    // Find best/worst openers
    var bestOpener = openerTypes.slice().sort(function(a,b) {
      return (openerMap[b].reduce(function(s,p){return s+eng(p);},0)/openerMap[b].length) -
             (openerMap[a].reduce(function(s,p){return s+eng(p);},0)/openerMap[a].length);
    })[0];
    var worstOpener = openerTypes.slice().sort(function(a,b) {
      return (openerMap[a].reduce(function(s,p){return s+eng(p);},0)/openerMap[a].length) -
             (openerMap[b].reduce(function(s,p){return s+eng(p);},0)/openerMap[b].length);
    })[0];

    html += '<p class="report-prose">Your highest-performing openers follow clear patterns. Across ' + qual.length + ' substantive posts, you open in <strong>' + openerTypes.length + ' distinct ways</strong>. Your strongest opener type is the <strong>' + esc(bestOpener) + '</strong>, which outperforms your average engagement' + (openerTypes.length > 1 ? ', while <strong>' + esc(worstOpener) + '</strong> openers tend to underperform.' : '.') + '</p>';

    openerTypes.forEach(function(type) {
      var op = openerMap[type];
      var avg = op.reduce(function(s,p){return s+eng(p);},0) / op.length;
      var sorted = op.slice().sort(function(a,b){return eng(b)-eng(a);});
      var vsAvg = avgE > 0 ? Math.round((avg - avgE) / avgE * 100) : 0;

      html += '<div class="report-subsection"><h4>The ' + esc(type) + ' Opener</h4>';
      html += '<p class="report-prose">Used in ' + op.length + ' posts (' + Math.round(op.length/qual.length*100) + '% of your writing). Average engagement: ' + avg.toFixed(0) + ' \u2014 <strong>' + (vsAvg > 0 ? '+' : '') + vsAvg + '% vs your overall average</strong>.' + (vsAvg > 15 ? ' This is one of your strongest opening moves.' : vsAvg < -15 ? ' This type tends to underperform for you.' : '') + '</p>';

      var exCount = Math.min(4, sorted.length);
      for (var i = 0; i < exCount; i++) {
        html += rq(sorted[i], firstSentences(sorted[i].text, 2));
      }
      html += '</div>';
    });

    // What weak openers look like
    if (worstOpener !== bestOpener) {
      var worstPosts = openerMap[worstOpener].slice().sort(function(a,b){return eng(a)-eng(b);});
      html += '<div class="report-subsection"><h4>What Your Weakest Openers Look Like</h4>';
      html += '<p class="report-prose">Posts that underperform tend to open with <strong>' + esc(worstOpener).toLowerCase() + '</strong> hooks. These get ' + Math.abs(Math.round(((openerMap[worstOpener].reduce(function(s,p){return s+eng(p);},0)/openerMap[worstOpener].length) - avgE) / avgE * 100)) + '% less engagement than your average. Your audience responds better to ' + esc(bestOpener).toLowerCase() + ' openers.</p>';
      if (worstPosts.length > 0) {
        html += rq(worstPosts[0], firstSentences(worstPosts[0].text, 2), 'One of your lower-performing openers');
      }
      html += '</div>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 2. VOICE AND TONE
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>2. Voice and Tone</h3>';

    // Build voice portrait
    var voiceDesc = '';
    if (iCount > youCount * 2 && exclamPosts > qual.length * 0.4) {
      voiceDesc = 'Your writing voice is that of someone who leads from personal experience and isn\u2019t afraid to show enthusiasm. You write with energy and conviction, drawing readers in through your own perspective rather than abstract analysis.';
    } else if (youCount > iCount && questionPosts > qual.length * 0.4) {
      voiceDesc = 'You write like a coach or mentor \u2014 directly addressing your reader, asking them questions, making them think. Your voice is conversational and reader-focused, creating a sense of dialogue rather than monologue.';
    } else if (strong > hedges * 2) {
      voiceDesc = 'You take clear, assertive positions. Your voice carries authority \u2014 you don\u2019t hedge or equivocate. When you make a claim, you commit to it fully. This gives your writing a decisive, confident feel that stands out.';
    } else if (hedges > strong * 2) {
      voiceDesc = 'Your voice is measured and thoughtful. You acknowledge nuance, consider multiple angles, and avoid absolute claims. This gives your writing credibility with readers who value careful analysis over bold pronouncements.';
    } else {
      voiceDesc = 'Your voice balances personal experience with reader engagement. You mix first-person perspective ("I/my" appears ' + (iCount / totalWords * 100).toFixed(1) + '% of the time) with direct reader address ("you/your" at ' + (youCount / totalWords * 100).toFixed(1) + '%), creating a conversational but authoritative tone.';
    }
    html += '<p class="report-prose">' + voiceDesc + '</p>';

    // Opinionatedness
    html += '<div class="report-subsection"><h4>How Opinionated You Are</h4>';
    if (strong > hedges * 1.5) {
      html += '<p class="report-prose"><strong>Very.</strong> You use strong/absolute language (' + strong + ' instances of words like "never," "always," "clearly," "must") far more than hedge words (' + hedges + ' instances of "maybe," "perhaps," "might"). You take positions and rarely qualify them.</p>';
      // Find a strong-opinion example
      var strongPost = qual.filter(function(p) { return /\b(never|always|must|absolutely|clearly|obviously)\b/i.test(p.text); }).sort(function(a,b){return eng(b)-eng(a);})[0];
      if (strongPost) {
        html += rq(strongPost, firstSentences(strongPost.text, 2), 'Example of your assertive voice');
      }
    } else if (hedges > strong * 1.5) {
      html += '<p class="report-prose">You tend toward measured, nuanced positions. Hedge words (' + hedges + ' instances) outweigh strong/absolute language (' + strong + ' instances). You prefer to acknowledge complexity rather than make sweeping claims.</p>';
    } else {
      html += '<p class="report-prose">Moderately opinionated. You balance conviction (' + strong + ' strong-language instances) with nuance (' + hedges + ' hedge words). You\u2019re willing to take positions but you acknowledge other perspectives.</p>';
    }
    html += '</div>';

    // Signature phrases
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
    var stopPhrases = ['in the','of the','on the','to the','and the','it is','this is','that is','i am','is a','for the','at the','with the','from the','has been','have been','will be','to be','and i','but i','if you','do you','are you','is the','was a','in a','of a','a lot','it was','there is','going to','want to','need to','able to','i think','they are','can be','i was','that the','you can','we are','not a','this was'];
    var sigPhrases = Object.keys(ngramMap)
      .filter(function(k) { return ngramMap[k] >= 3 && stopPhrases.indexOf(k) === -1 && k.split(' ').length >= 2; })
      .sort(function(a,b) { return ngramMap[b] - ngramMap[a]; })
      .slice(0, 15);

    if (sigPhrases.length > 0) {
      html += '<div class="report-subsection"><h4>Signature Phrases and Verbal Fingerprints</h4>';
      html += '<p class="report-prose">These phrases are distinctly yours and appear repeatedly across your posts:</p>';
      html += '<ul class="report-sig-list">';
      sigPhrases.forEach(function(phrase) {
        html += '<li><strong>\u201C' + esc(phrase) + '\u201D</strong> <em>(' + ngramMap[phrase] + ' occurrences)</em></li>';
      });
      html += '</ul></div>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 3. STRUCTURE AND FORMATTING
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>3. Structure and Formatting</h3>';

    // Post architecture
    html += '<div class="report-subsection"><h4>The Architecture of Your Posts</h4>';
    var archSteps = [];
    archSteps.push('<strong>Hook</strong> (1\u20132 sentences) \u2014 ' + esc(bestOpener).toLowerCase() + ' opener');
    if (lineBreakPosts > qual.length * 0.3) archSteps.push('<strong>White space break</strong> for mobile-friendly readability');
    if (iCount > youCount) archSteps.push('<strong>Personal context</strong> \u2014 story, experience, or first-hand observation');
    else archSteps.push('<strong>Setup</strong> \u2014 problem statement or context');
    if (listPosts > qual.length * 0.25) archSteps.push('<strong>Key points</strong> presented as a list or series of bullets');
    else archSteps.push('<strong>Supporting argument</strong> \u2014 narrative prose building the case');
    archSteps.push('<strong>Insight</strong> \u2014 lesson, takeaway, or implication');
    if (qClosePosts > qual.length * 0.3) archSteps.push('<strong>Closing question</strong> to drive comments');
    else archSteps.push('<strong>Closing statement</strong> \u2014 punchy final line or declaration');

    html += '<p class="report-prose"><strong>Typical structure (' + avgWc + ' words):</strong></p>';
    html += '<ol style="padding-left:20px;margin:10px 0 16px;">';
    archSteps.forEach(function(s) { html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;">' + s + '</li>'; });
    html += '</ol>';
    html += '</div>';

    // Paragraph length
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
    var lbPct = Math.round(lineBreakPosts/qual.length*100);
    var listPct = Math.round(listPosts/qual.length*100);

    html += '<div class="report-subsection"><h4>Paragraph Length</h4>';
    html += '<p class="report-prose">' + (parseFloat(sentPerPara) <= 2 ? 'Short. Your paragraphs are almost always 1\u20132 sentences, averaging <strong>' + sentPerPara + ' sentences per paragraph</strong>. You use single-sentence paragraphs frequently for emphasis \u2014 this creates a punchy, mobile-optimised reading experience.' : parseFloat(sentPerPara) <= 3.5 ? 'Moderate. You average <strong>' + sentPerPara + ' sentences per paragraph</strong> \u2014 enough to develop ideas without losing readers in dense blocks of text.' : 'You write in developed paragraphs, averaging <strong>' + sentPerPara + ' sentences per paragraph</strong>. This creates a more analytical, long-form feel.') + '</p>';
    html += '</div>';

    html += '<div class="report-subsection"><h4>White Space and Lists</h4>';
    html += '<p class="report-prose">' + (lbPct > 50 ? 'You\u2019re generous with white space \u2014 <strong>' + lbPct + '%</strong> of your posts use 5+ visible line breaks. Your posts are designed for mobile scrolling, with lots of breathing room between ideas.' : lbPct > 25 ? 'You use moderate white space (' + lbPct + '% of posts with 5+ line breaks). Your formatting balances readability with content density.' : 'You write in denser blocks \u2014 only ' + lbPct + '% of posts use generous line breaks. Your content is compact and substance-heavy.') + '</p>';
    html += '<p class="report-prose">' + (listPct < 15 ? 'You rarely use lists or bullets (<strong>' + listPct + '%</strong> of posts). Your default mode is conversational prose broken into short paragraphs. When you do use lists, they tend to be supporting details, not the main argument.' : listPct < 40 ? 'You use lists in <strong>' + listPct + '%</strong> of posts, typically to present data points or examples. Your primary mode is still prose, with lists as an occasional structural tool.' : 'Lists and bullets appear in <strong>' + listPct + '%</strong> of your posts. You lean heavily on structured formatting to organise your ideas.') + '</p>';
    html += '</div>';

    // Length vs engagement
    html += '<div class="report-subsection"><h4>Word Count and Engagement</h4>';
    var shortPosts = qual.filter(function(p){return wc(p.text) < 150;});
    var longPosts = qual.filter(function(p){return wc(p.text) >= 150;});
    html += '<p class="report-prose">Your average post is <strong>' + avgWc + ' words</strong>. ';
    if (shortPosts.length >= 3 && longPosts.length >= 3) {
      var shortAvg = shortPosts.reduce(function(s,p){return s+eng(p);},0)/shortPosts.length;
      var longAvg = longPosts.reduce(function(s,p){return s+eng(p);},0)/longPosts.length;
      html += (longAvg > shortAvg * 1.15 ? 'Your longer posts (150+ words) outperform shorter ones by <strong>' + Math.round((longAvg-shortAvg)/shortAvg*100) + '%</strong>. Your audience rewards depth and developed arguments.' :
        shortAvg > longAvg * 1.15 ? 'Your shorter posts (<150 words) outperform longer ones by <strong>' + Math.round((shortAvg-longAvg)/longAvg*100) + '%</strong>. Your audience responds best to concise, punchy content.' :
        'Post length doesn\u2019t significantly affect your engagement \u2014 both short and long posts perform similarly. Your sweet spot appears to be around ' + avgWc + ' words.');
    }
    html += '</p></div>';
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 4. ARGUMENT CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>4. How You Build Arguments</h3>';

    var moves = [
      { name: 'Data and Specifics', label: 'data-driven conviction', posts: dataPosts },
      { name: 'Personal Stories', label: 'personal stories and experience', posts: storyPosts },
      { name: 'Analogies and Comparisons', label: 'analogies and reframing', posts: analogyPosts },
      { name: 'Rhetorical Questions', label: 'rhetorical questions', posts: rhetoricPosts }
    ].sort(function(a,b){return b.posts.length - a.posts.length;});

    // Core rhetorical move
    if (moves[0].posts.length > 0) {
      html += '<p class="report-prose">Your core rhetorical move is <strong>' + moves[0].label + '</strong> \u2014 it appears in <strong>' + Math.round(moves[0].posts.length/qual.length*100) + '%</strong> of your posts. ' + (moves[0].posts.length > qual.length * 0.5 ? 'This is clearly your signature approach and gives your content a consistent, recognisable feel.' : 'This is your most common persuasion tool, though you draw on multiple techniques.') + '</p>';
    }

    moves.forEach(function(move) {
      if (move.posts.length < 2) return;
      var sorted = move.posts.slice().sort(function(a,b){return eng(b)-eng(a);});
      html += '<div class="report-subsection"><h4>' + move.name + '</h4>';
      html += '<p class="report-prose">Appears in <strong>' + move.posts.length + ' posts</strong> (' + Math.round(move.posts.length/qual.length*100) + '% of your writing).</p>';
      var exCount = Math.min(3, sorted.length);
      for (var i = 0; i < exCount; i++) {
        html += rq(sorted[i], firstSentences(sorted[i].text, 2));
      }
      html += '</div>';
    });

    // How they handle objections
    var concessionPosts = qual.filter(function(p) { return /\b(but |however|is it perfect|not perfect|not saying|to be fair|on the other hand|yes,? but|sure,? but|granted)\b/i.test(p.text); });
    if (concessionPosts.length >= 2) {
      html += '<div class="report-subsection"><h4>Handling Objections</h4>';
      var cpSorted = concessionPosts.slice().sort(function(a,b){return eng(b)-eng(a);});
      html += '<p class="report-prose">You acknowledge counterarguments in <strong>' + concessionPosts.length + ' posts</strong>. Your pattern: name the objection, concede partially, then pivot to the bigger picture.</p>';
      var exCount2 = Math.min(2, cpSorted.length);
      for (var j = 0; j < exCount2; j++) {
        // Find the concession sentence
        var sents = cpSorted[j].text.split(/(?<=[.!?])\s+/);
        var concSent = '';
        for (var k = 0; k < sents.length; k++) {
          if (/\b(but |however|is it perfect|not perfect|yes,? but|sure,? but|granted)\b/i.test(sents[k])) {
            concSent = sents[k].trim();
            if (k + 1 < sents.length) concSent += ' ' + sents[k+1].trim();
            break;
          }
        }
        if (concSent) html += rq(cpSorted[j], trunc(concSent, 200));
      }
      html += '</div>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 5. CLOSING PATTERNS
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>5. How You Close Posts</h3>';

    var closingTypes = {
      'The Question Close': { posts: [], desc: 'ending with a direct question to the audience' },
      'The Call to Action': { posts: [], desc: 'directing the reader to take a specific action' },
      'The Forward-Looking Declaration': { posts: [], desc: 'a punchy, declarative final line' },
      'The Summary Close': { posts: [], desc: 'wrapping up with a takeaway or reflection' }
    };
    qual.forEach(function(p) {
      var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
      if (lines.length === 0) return;
      var last = lines[lines.length-1].trim();
      var last2 = lines.length > 1 ? lines[lines.length-2].trim() + ' ' + last : last;
      if (/\?\s*$/.test(last)) closingTypes['The Question Close'].posts.push(p);
      else if (/\b(share|comment|follow|tag|let me know|tell me|what do you|drop a|hit me)\b/i.test(last2)) closingTypes['The Call to Action'].posts.push(p);
      else if (/^[A-Z]/.test(last) && last.length < 80 && !/[,;]/.test(last)) closingTypes['The Forward-Looking Declaration'].posts.push(p);
      else closingTypes['The Summary Close'].posts.push(p);
    });

    var closingKeys = Object.keys(closingTypes).filter(function(t){return closingTypes[t].posts.length > 0;}).sort(function(a,b){return closingTypes[b].posts.length - closingTypes[a].posts.length;});

    closingKeys.forEach(function(type) {
      var ct = closingTypes[type];
      var cp = ct.posts;
      var avg = cp.reduce(function(s,p){return s+eng(p);},0) / cp.length;
      var sorted = cp.slice().sort(function(a,b){return eng(b)-eng(a);});

      html += '<div class="report-subsection"><h4>' + type + '</h4>';
      html += '<p class="report-prose">Used in ' + cp.length + ' posts (' + Math.round(cp.length/qual.length*100) + '%) \u2014 ' + ct.desc + '. Average engagement: ' + avg.toFixed(0) + '.</p>';

      var exCount = Math.min(4, sorted.length);
      for (var i = 0; i < exCount; i++) {
        var lines = sorted[i].text.trim().split(/\n/).filter(function(l){return l.trim();});
        var lastLine = lines.length > 0 ? lines[lines.length-1] : '';
        html += rq(sorted[i], trunc(lastLine, 150));
      }
      html += '</div>';
    });

    // What they never do
    var neverClose = Object.keys(closingTypes).filter(function(t){return closingTypes[t].posts.length === 0;});
    if (neverClose.length > 0) {
      html += '<div class="report-subsection"><h4>What You Never Do in Closings</h4>';
      html += '<p class="report-prose">You almost never close with: <strong>' + neverClose.join(', ').replace(/The /g, '').toLowerCase() + '</strong>. ';
      var genericCTA = qual.filter(function(p) { return /\b(follow me for more|share this|repost if you agree|like and share)\b/i.test(p.text); });
      if (genericCTA.length < 2) html += 'You don\u2019t do the engagement-bait format \u2014 your closings feel like the last line of a conversation, not a marketing prompt.';
      html += '</p></div>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 6. SENTENCE RHYTHM
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>6. Sentence Rhythm</h3>';

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

    html += '<p class="report-prose">' + (shortPct > 30 ? 'You have a distinctive cadence: <strong>build with medium sentences, then punch with a short one.</strong> Your average sentence is ' + avgSentLen + ' words, but ' + shortPct + '% of your sentences are 5 words or fewer. This creates urgency and momentum \u2014 your writing has a spoken-word feel.' :
      longPct > 25 ? 'You tend toward longer, more developed sentences (average ' + avgSentLen + ' words, with ' + longPct + '% running 20+ words). This creates a measured, analytical cadence that rewards careful reading.' :
      'You mix short and long sentences effectively (average ' + avgSentLen + ' words). <strong>' + shortPct + '%</strong> of your sentences are short punches (\u22645 words) and <strong>' + longPct + '%</strong> are extended (20+ words). This variation creates natural rhythm.') + '</p>';

    // Quote passages showing rhythm
    html += '<div class="report-subsection"><h4>Your Rhythm in Action</h4>';
    var rhythmExamples = topQ.slice(0, 5);
    var rhythmShown = 0;
    for (var ri = 0; ri < rhythmExamples.length && rhythmShown < 2; ri++) {
      var rSents = rhythmExamples[ri].text.split(/(?<=[.!?])\s+/).slice(0, 5);
      if (rSents.length >= 3) {
        html += rq(rhythmExamples[ri], rSents.join(' ').substring(0, 280) + (rSents.join(' ').length > 280 ? '...' : ''), 'From your #' + (ri+1) + ' post by engagement');
        rhythmShown++;
      }
    }
    html += '</div>';

    // Stylistic tics
    var emDashCount = (allText.match(/\u2014|--/g) || []).length;
    var ellipsisCount = (allText.match(/\.{3}|\u2026/g) || []).length;
    var parenCount = (allText.match(/\(/g) || []).length;
    var exclCount = (allText.match(/!{2,}/g) || []).length;
    var tics = [];
    if (emDashCount >= 3) tics.push({ name: 'Em dashes', count: emDashCount, desc: 'for parenthetical asides and dramatic pauses' });
    if (ellipsisCount >= 3) tics.push({ name: 'Trailing ellipses', count: ellipsisCount, desc: 'creating suspense or trailing off' });
    if (parenCount >= 5) tics.push({ name: 'Parenthetical asides', count: parenCount, desc: 'injecting commentary within sentences' });
    if (exclCount >= 3) tics.push({ name: 'Multiple exclamation marks', count: exclCount, desc: 'for emphasis and energy' });

    if (tics.length > 0) {
      html += '<div class="report-subsection"><h4>Conversational Interruptions</h4>';
      html += '<p class="report-prose">You frequently interrupt your own flow to add colour:</p>';
      html += '<ul class="report-sig-list">';
      tics.forEach(function(t) {
        html += '<li><strong>' + t.name + '</strong> (\u00D7' + t.count + ') \u2014 <em>' + t.desc + '</em></li>';
      });
      html += '</ul>';
      html += '<p class="report-prose">This creates a spoken-word feel. Your posts read like you\u2019re talking, not writing.</p>';
      html += '</div>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 7. WHAT YOU CONSISTENTLY AVOID
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>7. What You Consistently Avoid</h3>';

    var avoids = [];
    var emojiPosts = qual.filter(function(p) { return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(p.text); });
    if (emojiPosts.length < qual.length * 0.2) avoids.push({ title: 'Emoji overload', desc: 'You use emojis sparingly. Your best posts use few or none \u2014 emoji-heavy posts don\u2019t outperform your text-driven content.' });
    var urlPosts = qual.filter(function(p) { return /https?:\/\//.test(p.text); });
    if (urlPosts.length < qual.length * 0.1) avoids.push({ title: 'External links', desc: 'You keep content native to LinkedIn rather than linking out. Only ' + urlPosts.length + ' of ' + qual.length + ' posts contain URLs.' });
    var hashPosts = qual.filter(function(p) { return (p.text.match(/#[a-zA-Z]/g) || []).length > 5; });
    if (hashPosts.length < qual.length * 0.1) avoids.push({ title: 'Hashtag stuffing', desc: 'You use hashtags sparingly if at all. You don\u2019t pad posts with walls of hashtags for algorithmic reach.' });
    if (hedges < 5) avoids.push({ title: 'Hedge words', desc: 'Words like "maybe," "perhaps," and "might" barely appear (' + hedges + ' total). You take firm positions instead of equivocating.' });
    var humbleBrag = qual.filter(function(p) { return /\b(humbled|blessed|grateful to announce|excited to share|thrilled to announce)\b/i.test(p.text); });
    if (humbleBrag.length < 2) avoids.push({ title: 'The humble-brag format', desc: 'You don\u2019t do "Thrilled to announce\u2026" or "Humbled to share\u2026" posts. When you have news, you lead with the substance, not the self-congratulation.' });
    var genericCTA2 = qual.filter(function(p) { return /\b(like and share|follow me for more|repost if you agree|hit the bell|share this with)\b/i.test(p.text); });
    if (genericCTA2.length < 2) avoids.push({ title: 'Generic engagement bait', desc: 'No "Like and share!" or "Repost if you agree \u267B\uFE0F" prompts. Your engagement comes from content quality, not begging for interactions.' });
    if (listPosts < qual.length * 0.15) avoids.push({ title: 'Listicle-style posts', desc: 'You prefer conversational prose over "Top 10 reasons\u2026" formatting. Your arguments flow as narrative, not numbered lists.' });
    var quotePosts = qual.filter(function(p) { return /^[""\u201C]/.test(p.text.trim()); });
    if (quotePosts.length < 2) avoids.push({ title: 'Opening with someone else\u2019s quote', desc: 'You lead with your own voice, not borrowed authority. Quote-led openers are virtually absent from your writing.' });
    var clichePosts = qual.filter(function(p) { return /\b(game changer|move the needle|circle back|deep dive|at the end of the day|low-hanging fruit|leveraging|synergies)\b/i.test(p.text); });
    if (clichePosts.length < 2) avoids.push({ title: 'Corporate jargon and buzzword stacking', desc: 'You never write "leveraging synergies" or "holistic ecosystem approach." Your language is plain and direct.' });
    var gratefulPosts = qual.filter(function(p) { return /\b(i'm grateful|so grateful|grateful for this|thankful for)\b/i.test(p.text); });
    if (gratefulPosts.length < 2) avoids.push({ title: '"I\u2019m grateful" engagement bait', desc: 'No "I\u2019m so grateful for this community" padding. Your posts have substance, not sentiment.' });
    var threadPosts = qual.filter(function(p) { return /^1[\/.)]\s/m.test(p.text.trim()); });
    if (threadPosts.length < 2) avoids.push({ title: 'Thread-style formatting', desc: 'You write single, complete posts \u2014 not "1/ Here\u2019s what no one is talking about\u2026" threads.' });

    if (avoids.length > 0) {
      html += '<ul class="report-avoid-list">';
      avoids.forEach(function(a) {
        html += '<li><strong>' + a.title + '</strong> \u2014 ' + a.desc + '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // 8. ENGAGEMENT CORRELATIONS
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>8. Correlation Between Style Choices and Engagement</h3>';

    // Top posts analysis
    var topAvgWc = Math.round(top10.reduce(function(s,p){return s+wc(p.text);},0) / top10.length);
    var topLineBreaks = top10.filter(function(p){return p.text.split(/\n/).filter(function(l){return l.trim();}).length >= 5;}).length;
    var topQuestions = top10.filter(function(p){return /\?/.test(p.text);}).length;
    var topStories = top10.filter(function(p){return /\b(I |my |when I|years? ago)/i.test(p.text);}).length;
    var topDataP = top10.filter(function(p){return /\d{2,}[%$]|\$[\d,]+|\d+x/i.test(p.text);}).length;

    var topOpeners = {};
    top10.forEach(function(p) { var t = p._hookType || 'Statement'; topOpeners[t] = (topOpeners[t]||0)+1; });
    var topOpenerType = Object.keys(topOpeners).sort(function(a,b){return topOpeners[b]-topOpeners[a];})[0] || bestOpener;

    html += '<div class="report-subsection"><h4>What Your Top ' + top10.length + ' Posts Have in Common</h4>';
    html += '<p class="report-prose">Your highest-performing posts share these characteristics:</p>';
    html += '<ol style="padding-left:20px;margin:10px 0 16px;">';
    html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;"><strong>A ' + esc(topOpenerType).toLowerCase() + ' hook</strong> \u2014 ' + Math.round((topOpeners[topOpenerType]||0)/top10.length*100) + '% open this way</li>';
    if (topDataP > top10.length * 0.3) html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;"><strong>Specific data and numbers</strong> \u2014 ' + Math.round(topDataP/top10.length*100) + '% use concrete figures</li>';
    if (topStories > top10.length * 0.3) html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;"><strong>Personal stories</strong> \u2014 ' + Math.round(topStories/top10.length*100) + '% include first-person experience</li>';
    html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;"><strong>' + topAvgWc + '-word sweet spot</strong>' + (topAvgWc > avgWc * 1.15 ? ' (longer than your average)' : topAvgWc < avgWc * 0.85 ? ' (shorter than your average)' : '') + '</li>';
    if (topLineBreaks > top10.length * 0.4) html += '<li style="font-size:13px;color:#334155;line-height:1.8;margin-bottom:4px;"><strong>Generous white space</strong> \u2014 ' + Math.round(topLineBreaks/top10.length*100) + '% use mobile-friendly formatting</li>';
    html += '</ol></div>';

    // Bottom quartile
    if (botQ.length >= 3) {
      var botAvgWc = Math.round(botQ.reduce(function(s,p){return s+wc(p.text);},0) / botQ.length);
      var botEmoji = botQ.filter(function(p) { return /[\u{1F300}-\u{1F9FF}]/u.test(p.text); }).length;

      html += '<div class="report-subsection"><h4>What Doesn\u2019t Move the Needle</h4>';
      html += '<ul class="report-avoid-list">';
      if (Math.abs(topAvgWc - botAvgWc) < avgWc * 0.15) html += '<li><strong>Word count doesn\u2019t matter much</strong> \u2014 your top and bottom posts average similar lengths (' + topAvgWc + ' vs ' + botAvgWc + ' words)</li>';
      if (botEmoji > botQ.length * 0.3 && emojiPosts.length < qual.length * 0.3) html += '<li><strong>Emojis are neutral to slightly negative</strong> \u2014 your bottom-quartile posts actually use emojis more than your top performers</li>';
      html += '<li><strong>Questions in the opening</strong> \u2014 your strongest openers tend to be ' + esc(bestOpener).toLowerCase() + 's, not questions</li>';
      html += '</ul></div>';
    }

    // Engagement formula
    html += '<div class="report-callout"><h4>Your Engagement Formula</h4>';
    var formulaParts = [];
    formulaParts.push(esc(bestOpener) + ' hook');
    if (moves[0].posts.length > qual.length * 0.3) formulaParts.push('your ' + moves[0].label);
    if (topStories > top10.length * 0.4) formulaParts.push('personal perspective');
    var bestCloser = closingKeys.length > 0 ? closingKeys[0].replace('The ', '').toLowerCase() : 'strong closing';
    formulaParts.push(bestCloser);
    html += '<p>Your best posts follow this pattern: <strong>[' + formulaParts.join('] + [') + ']</strong></p>';
    html += '</div>';
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════
    // WRITING INSTRUCTIONS SUMMARY
    // ═══════════════════════════════════════════════════════════════
    html += '<div class="report-callout" style="margin-top:28px;"><h4>\u270D\uFE0F Writing Instructions Summary</h4>';
    html += '<p style="margin-bottom:10px;">To write in this voice, follow these rules:</p>';
    html += '<ol>';
    html += '<li><strong>Open with a ' + esc(bestOpener).toLowerCase() + ' hook</strong> \u2014 this is your strongest opener style. Never start with throat-clearing.</li>';
    if (shortPct > 30) html += '<li><strong>Write in short paragraphs (1\u20132 sentences)</strong> \u2014 mobile-first, generous white space. Use single-sentence paragraphs for emphasis.</li>';
    else html += '<li><strong>Mix sentence lengths</strong> \u2014 pair longer analytical sentences with short impactful ones for rhythm.</li>';
    if (strong > hedges * 1.5) html += '<li><strong>Take clear positions</strong> \u2014 no hedging, no "time will tell." Commit to your argument.</li>';
    else if (hedges > strong) html += '<li><strong>Acknowledge nuance</strong> \u2014 your measured tone is a strength. Keep showing both sides before drawing conclusions.</li>';
    if (sigPhrases.length >= 3) html += '<li><strong>Use your signature phrases naturally</strong> \u2014 "' + esc(sigPhrases.slice(0,4).join('," "')) + '."</li>';
    if (dataPosts.length > qual.length * 0.3) html += '<li><strong>Include at least one specific number or comparison</strong> to anchor the argument. Do the maths for the reader.</li>';
    if (iCount > youCount * 1.5) html += '<li><strong>Lead from personal experience</strong> \u2014 "I did X, here\u2019s what I learned" is your natural mode.</li>';
    else if (youCount > iCount) html += '<li><strong>Address the reader directly</strong> \u2014 use "you" and "your" frequently. Make them feel spoken to.</li>';
    if (storyPosts.length > qual.length * 0.3) html += '<li><strong>Ground arguments in real stories</strong>, not abstract advice.</li>';
    if (concessionPosts && concessionPosts.length > qual.length * 0.15) html += '<li><strong>Acknowledge objections briefly, then dismiss or reframe</strong> \u2014 concede the point, then pivot to the bigger picture.</li>';
    html += '<li><strong>Target ' + avgWc + ' words</strong> per post (your sweet spot).</li>';
    html += '<li><strong>Close with a ' + bestCloser + '</strong> \u2014 not a generic CTA. Make the last line memorable.</li>';
    if (avoids.length >= 2) html += '<li><strong>Avoid:</strong> ' + avoids.slice(0,4).map(function(a){return a.title.toLowerCase();}).join(', ') + '.</li>';
    html += '</ol></div>';

    html += '</div>'; // close .report
    container.innerHTML = html;
  }

  // ── Growth & Coaching ────────────────────────────────────────────
  function renderCoaching(posts, hasViews) {
    var container = document.getElementById('coachingAnalysis');
    if (!container) return;

    var qual = posts.filter(function(p) { return p.text && wc(p.text) >= 100; });
    if (qual.length < 5) {
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">Not enough substantive posts (100+ words) for coaching analysis. Found ' + qual.length + ' \u2014 need at least 5.</p>';
      return;
    }

    var avgE = qual.reduce(function(s,p){return s+eng(p);},0) / qual.length;
    var topQ = qual.slice().sort(function(a,b){return eng(b)-eng(a);});
    var top25 = topQ.slice(0, Math.max(5, Math.ceil(qual.length * 0.25)));
    var bot25 = topQ.slice(Math.floor(qual.length * 0.75));

    // ── Per-post trait helpers ──
    function getClosingType(p) {
      var lines = (p.text||'').trim().split(/\n/).filter(function(l){return l.trim();});
      if (lines.length === 0) return 'Summary Close';
      var last = lines[lines.length-1].trim();
      var last2 = lines.length > 1 ? lines[lines.length-2].trim() + ' ' + last : last;
      if (/\?\s*$/.test(last)) return 'Question Close';
      if (/\b(share|comment|follow|tag|let me know|tell me|what do you|drop a|hit me)\b/i.test(last2)) return 'Call to Action';
      if (/^[A-Z]/.test(last) && last.length < 80 && !/[,;]/.test(last)) return 'Forward-Looking Declaration';
      return 'Summary Close';
    }
    function getTraits(p) {
      var t = p.text || '';
      return {
        hookType: p._hookType || 'Statement',
        closingType: getClosingType(p),
        categories: p._categories || ['Other'],
        wordCount: wc(t),
        hasLineBreaks: t.split(/\n/).filter(function(l){return l.trim();}).length >= 5,
        hasList: /^[\s]*[\-\u2022\u25CF\u25CB\u2023\u2043\u25AA\u25A0\u25BA\u25B8]|\d+[.)]\s/m.test(t),
        hasData: /\d{2,}[%$]|\$[\d,]+|\d+x|\d+ ?(percent|million|billion|thousand)/i.test(t),
        hasStory: /\b(I |my |when I|years? ago|back in|I remember|true story)/i.test(t),
        hasAnalogy: /\b(like a|it's like|think of it|imagine|same way|just as)\b/i.test(t),
        hasRhetoric: (t.match(/\?/g) || []).length >= 2,
        hasQuestion: /\?/.test(t)
      };
    }

    // Enrich all qualified posts with traits
    var traits = [];
    qual.forEach(function(p) { p._traits = getTraits(p); traits.push(p._traits); });

    // Helper: quote a post with metrics
    function rq(p, text, note) {
      var h = '<div class="report-quote">\u201C' + esc(text) + '\u201D';
      h += '<span class="rq-metric"> \u2014 ';
      if (hasViews && views(p) > 0) h += fmt(views(p)) + ' views, ';
      h += eng(p) + ' engagement</span>';
      if (note) h += '<span class="rq-note">' + esc(note) + '</span>';
      h += '</div>';
      return h;
    }
    function firstSentences(text, n) {
      var s = text.split(/(?<=[.!?])\s+/).slice(0, n || 2);
      return s.join(' ').substring(0, 250) + (s.join(' ').length > 250 ? '...' : '');
    }

    // ── Compute shared analysis data ──

    // Hook analysis
    var hookMap = {};
    qual.forEach(function(p) {
      var t = p._traits.hookType;
      if (!hookMap[t]) hookMap[t] = [];
      hookMap[t].push(p);
    });
    var hookTypes = Object.keys(hookMap);
    var bestHook = hookTypes.slice().sort(function(a,b) {
      return (hookMap[b].reduce(function(s,p){return s+eng(p);},0)/hookMap[b].length) -
             (hookMap[a].reduce(function(s,p){return s+eng(p);},0)/hookMap[a].length);
    })[0] || 'Statement';
    var mostUsedHook = hookTypes.slice().sort(function(a,b) { return hookMap[b].length - hookMap[a].length; })[0] || 'Statement';
    var bestHookAvg = hookMap[bestHook] ? hookMap[bestHook].reduce(function(s,p){return s+eng(p);},0)/hookMap[bestHook].length : avgE;
    var mostUsedHookAvg = hookMap[mostUsedHook] ? hookMap[mostUsedHook].reduce(function(s,p){return s+eng(p);},0)/hookMap[mostUsedHook].length : avgE;

    // Category analysis
    var catMap = {};
    qual.forEach(function(p) {
      (p._categories || ['Other']).forEach(function(c) {
        if (!catMap[c]) catMap[c] = [];
        catMap[c].push(p);
      });
    });
    var catNames = Object.keys(catMap).filter(function(c){return catMap[c].length >= 3;});
    var bestCat = catNames.slice().sort(function(a,b) {
      return (catMap[b].reduce(function(s,p){return s+eng(p);},0)/catMap[b].length) -
             (catMap[a].reduce(function(s,p){return s+eng(p);},0)/catMap[a].length);
    })[0] || 'Other';
    var mostPostedCat = catNames.slice().sort(function(a,b) { return catMap[b].length - catMap[a].length; })[0] || 'Other';

    // Closing analysis
    var closeMap = {};
    qual.forEach(function(p) {
      var ct = p._traits.closingType;
      if (!closeMap[ct]) closeMap[ct] = [];
      closeMap[ct].push(p);
    });
    var closeTypes = Object.keys(closeMap).filter(function(c){return closeMap[c].length >= 2;});
    var bestClose = closeTypes.slice().sort(function(a,b) {
      return (closeMap[b].reduce(function(s,p){return s+eng(p);},0)/closeMap[b].length) -
             (closeMap[a].reduce(function(s,p){return s+eng(p);},0)/closeMap[a].length);
    })[0] || 'Summary Close';
    var mostUsedClose = closeTypes.slice().sort(function(a,b) { return closeMap[b].length - closeMap[a].length; })[0] || 'Summary Close';

    // Length brackets
    var lenBrackets = [
      { label: 'Short', min: 0, max: 150 },
      { label: 'Medium', min: 150, max: 300 },
      { label: 'Long', min: 300, max: 500 },
      { label: 'Very Long', min: 500, max: Infinity }
    ];
    var bestLen = lenBrackets.slice().sort(function(a,b) {
      var aPosts = qual.filter(function(p){var w=wc(p.text);return w>=a.min&&w<a.max;});
      var bPosts = qual.filter(function(p){var w=wc(p.text);return w>=b.min&&w<b.max;});
      var aAvg = aPosts.length>=3 ? aPosts.reduce(function(s,p){return s+eng(p);},0)/aPosts.length : 0;
      var bAvg = bPosts.length>=3 ? bPosts.reduce(function(s,p){return s+eng(p);},0)/bPosts.length : 0;
      return bAvg - aAvg;
    })[0];

    // Frequency
    var monthsArr = qual.map(function(p){return dateToMonths(p.date);});
    var maxM = Math.max.apply(null, monthsArr.concat([1]));
    var pw = maxM > 0 ? (posts.length / maxM) / 4.33 : posts.length;

    // Comment ratio
    var totalLikes = qual.reduce(function(s,p){return s+(p.likes||0);},0);
    var totalComments = qual.reduce(function(s,p){return s+(p.comments||0);},0);
    var commentRatio = totalLikes > 0 ? totalComments / totalLikes : 0;

    var html = '<div class="report">';

    // ── Meta ──
    html += '<div class="report-meta">';
    html += '<strong>' + qual.length + ' posts analysed</strong> (100+ words) out of ' + posts.length + ' total';
    html += ' &middot; Avg engagement: <strong>' + avgE.toFixed(0) + '</strong>';
    html += ' &middot; Top 25%: <strong>' + top25.length + ' posts</strong> averaging ' + Math.round(top25.reduce(function(s,p){return s+eng(p);},0)/top25.length) + ' engagement';
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 1. YOUR BIGGEST LEVER RIGHT NOW
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>1. Your Biggest Lever Right Now</h3>';

    var levers = [];
    // Hook gap
    if (bestHook !== mostUsedHook && mostUsedHookAvg > 0) {
      var hookGap = Math.round((bestHookAvg - mostUsedHookAvg) / mostUsedHookAvg * 100);
      if (hookGap > 5) levers.push({ name: 'hook', gap: hookGap, desc: 'Your best-performing hook type is <strong>' + esc(bestHook) + '</strong> (avg ' + Math.round(bestHookAvg) + ' engagement), but you mostly use <strong>' + esc(mostUsedHook) + '</strong> hooks (avg ' + Math.round(mostUsedHookAvg) + '). If your next 10 posts used ' + esc(bestHook) + ' openers, your data suggests roughly <strong>+' + hookGap + '% more engagement per post</strong>.' });
    }
    // Topic gap
    if (bestCat !== mostPostedCat && catMap[bestCat] && catMap[mostPostedCat]) {
      var bestCatAvg = catMap[bestCat].reduce(function(s,p){return s+eng(p);},0)/catMap[bestCat].length;
      var mostCatAvg = catMap[mostPostedCat].reduce(function(s,p){return s+eng(p);},0)/catMap[mostPostedCat].length;
      var topicGap = mostCatAvg > 0 ? Math.round((bestCatAvg - mostCatAvg) / mostCatAvg * 100) : 0;
      if (topicGap > 10) levers.push({ name: 'topic', gap: topicGap, desc: 'Your <strong>' + esc(bestCat) + '</strong> posts average ' + Math.round(bestCatAvg) + ' engagement, but you post most about <strong>' + esc(mostPostedCat) + '</strong> (avg ' + Math.round(mostCatAvg) + '). Shifting more content toward ' + esc(bestCat) + ' could lift engagement by roughly <strong>+' + topicGap + '%</strong>.' });
    }
    // Closing gap
    if (bestClose !== mostUsedClose && closeMap[bestClose] && closeMap[mostUsedClose]) {
      var bestCloseAvg = closeMap[bestClose].reduce(function(s,p){return s+eng(p);},0)/closeMap[bestClose].length;
      var mostCloseAvg = closeMap[mostUsedClose].reduce(function(s,p){return s+eng(p);},0)/closeMap[mostUsedClose].length;
      var closeGap = mostCloseAvg > 0 ? Math.round((bestCloseAvg - mostCloseAvg) / mostCloseAvg * 100) : 0;
      if (closeGap > 5) levers.push({ name: 'closing', gap: closeGap, desc: 'Your <strong>' + esc(bestClose) + '</strong> endings average ' + Math.round(bestCloseAvg) + ' engagement vs your default <strong>' + esc(mostUsedClose) + '</strong> at ' + Math.round(mostCloseAvg) + '. Switching your closing pattern could add roughly <strong>+' + closeGap + '%</strong>.' });
    }
    // Cadence gap
    if (pw < 3) {
      var cadenceGap = Math.round((3 - pw) / Math.max(pw, 0.1) * 100);
      levers.push({ name: 'cadence', gap: Math.min(cadenceGap, 200), desc: 'You\u2019re posting <strong>' + pw.toFixed(1) + ' times per week</strong>. Top LinkedIn creators post 3\u20135x per week. The algorithm heavily rewards consistency \u2014 increasing to 3x/week could significantly boost your reach and follower growth.' });
    }
    // Comment ratio gap
    if (commentRatio < 0.25 && totalLikes > 50) {
      var crGap = Math.round((0.25 - commentRatio) / Math.max(commentRatio, 0.01) * 100);
      levers.push({ name: 'comments', gap: Math.min(crGap, 150), desc: 'Your comment-to-like ratio is <strong>' + (commentRatio * 100).toFixed(1) + '%</strong>. High-performing LinkedIn creators typically see 25%+. Comments signal quality to the algorithm and drive 3\u201310x more distribution than likes alone.' });
    }

    levers.sort(function(a,b) { return b.gap - a.gap; });

    if (levers.length > 0) {
      html += '<p class="report-prose"><strong>Focus here first.</strong> Of everything in this report, this is the single change most likely to move the needle:</p>';
      html += '<div class="report-callout"><h4>\uD83C\uDFAF ' + esc(levers[0].name.charAt(0).toUpperCase() + levers[0].name.slice(1)) + ' Improvement</h4>';
      html += '<p>' + levers[0].desc + '</p></div>';
      if (levers.length > 1) {
        html += '<p class="report-prose" style="margin-top:16px;">Other high-impact levers to address after:</p>';
        html += '<ul class="report-avoid-list">';
        for (var li = 1; li < Math.min(levers.length, 4); li++) {
          html += '<li>' + levers[li].desc + '</li>';
        }
        html += '</ul>';
      }
    } else {
      html += '<p class="report-prose">Your content is well-optimised across hooks, topics, and structure. The focus should be on experimenting with new formats and increasing posting frequency.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 2. POST AUTOPSIES
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>2. Post Autopsies \u2014 Why Your Bottom Posts Failed</h3>';

    if (bot25.length >= 3) {
      var failGroups = {
        'Weak hook type': [],
        'Low-performing topic': [],
        'Wrong length': [],
        'Missing structure': [],
        'Other factors': []
      };

      // Find the weakest hook types (below average)
      var weakHooks = {};
      hookTypes.forEach(function(ht) {
        var avg = hookMap[ht].reduce(function(s,p){return s+eng(p);},0)/hookMap[ht].length;
        if (avg < avgE * 0.85) weakHooks[ht] = true;
      });

      // Find weakest categories
      var weakCats = {};
      catNames.forEach(function(cn) {
        var avg = catMap[cn].reduce(function(s,p){return s+eng(p);},0)/catMap[cn].length;
        if (avg < avgE * 0.85) weakCats[cn] = true;
      });

      // Optimal length range
      var optLenPosts = qual.filter(function(p){var w=wc(p.text);return w>=bestLen.min&&w<bestLen.max;});
      var optLenAvg = optLenPosts.length>0 ? optLenPosts.reduce(function(s,p){return s+eng(p);},0)/optLenPosts.length : avgE;

      bot25.forEach(function(p) {
        var diagnosed = false;
        if (weakHooks[p._traits.hookType]) { failGroups['Weak hook type'].push(p); diagnosed = true; }
        var pCats = p._categories || ['Other'];
        var inWeakCat = pCats.some(function(c){return weakCats[c];});
        if (inWeakCat && !diagnosed) { failGroups['Low-performing topic'].push(p); diagnosed = true; }
        var w = wc(p.text);
        if ((w < bestLen.min || w >= bestLen.max) && Math.abs(w - (bestLen.min+bestLen.max)/2) > 100 && !diagnosed) { failGroups['Wrong length'].push(p); diagnosed = true; }
        if (!p._traits.hasLineBreaks && !diagnosed) { failGroups['Missing structure'].push(p); diagnosed = true; }
        if (!diagnosed) failGroups['Other factors'].push(p);
      });

      var failKeys = Object.keys(failGroups).filter(function(k){return failGroups[k].length > 0;});
      html += '<p class="report-prose">Your bottom ' + bot25.length + ' posts by engagement share identifiable problems. Here\u2019s what went wrong and why:</p>';

      failKeys.forEach(function(reason) {
        var fp = failGroups[reason];
        if (fp.length === 0) return;
        html += '<div class="report-subsection"><h4>' + reason + ' (' + fp.length + ' posts)</h4>';

        if (reason === 'Weak hook type') {
          html += '<p class="report-prose">These posts opened with hook types that consistently underperform for your audience. Your data shows that <strong>' + esc(bestHook) + '</strong> hooks get the best response, but these used weaker openers:</p>';
        } else if (reason === 'Low-performing topic') {
          html += '<p class="report-prose">These posts cover topics that don\u2019t resonate as strongly with your audience. Your <strong>' + esc(bestCat) + '</strong> content outperforms these topics significantly:</p>';
        } else if (reason === 'Wrong length') {
          html += '<p class="report-prose">These posts missed your optimal length range (' + bestLen.label + ': ' + bestLen.min + '\u2013' + (bestLen.max === Infinity ? '500+' : bestLen.max) + ' words). Your best engagement comes from posts in that sweet spot:</p>';
        } else if (reason === 'Missing structure') {
          html += '<p class="report-prose">These posts lack the visual structure (line breaks, white space) that your top posts use. On mobile, dense text walls get scrolled past:</p>';
        } else {
          html += '<p class="report-prose">These posts didn\u2019t fit a single failure pattern but underperformed nonetheless:</p>';
        }

        var exCount = Math.min(3, fp.length);
        for (var i = 0; i < exCount; i++) {
          var diag = '';
          if (reason === 'Weak hook type') diag = 'Used a ' + fp[i]._traits.hookType + ' hook';
          else if (reason === 'Wrong length') diag = wc(fp[i].text) + ' words (outside your ' + bestLen.label.toLowerCase() + ' sweet spot)';
          else if (reason === 'Missing structure') diag = 'Only ' + fp[i].text.split(/\n/).filter(function(l){return l.trim();}).length + ' visible lines';
          html += rq(fp[i], firstSentences(fp[i].text, 2), diag);
        }
        html += '</div>';
      });
    } else {
      html += '<p class="report-prose">Not enough posts in the bottom quartile for a meaningful autopsy. Keep posting and check back when you have more data.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 3. YOUR UNDERUSED WEAPONS
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>3. Your Underused Weapons</h3>';
    html += '<p class="report-prose">These are techniques that <strong>work well for you but you rarely use</strong>. They\u2019re the easiest wins because you\u2019ve already proven you can do them:</p>';

    var weapons = [];

    // Underused hook types
    hookTypes.forEach(function(ht) {
      var hp = hookMap[ht];
      var pct = hp.length / qual.length * 100;
      var avg = hp.reduce(function(s,p){return s+eng(p);},0)/hp.length;
      if (avg > avgE * 1.1 && pct < 15 && hp.length >= 2) {
        weapons.push({ type: 'hook', name: esc(ht) + ' hooks', pct: Math.round(pct), avgEng: Math.round(avg), lift: Math.round((avg - avgE)/avgE*100), best: hp.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
      }
    });

    // Underused categories
    catNames.forEach(function(cn) {
      var cp = catMap[cn];
      var pct = cp.length / qual.length * 100;
      var avg = cp.reduce(function(s,p){return s+eng(p);},0)/cp.length;
      if (avg > avgE * 1.15 && pct < 12 && cp.length >= 3) {
        weapons.push({ type: 'topic', name: esc(cn) + ' content', pct: Math.round(pct), avgEng: Math.round(avg), lift: Math.round((avg - avgE)/avgE*100), best: cp.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
      }
    });

    // Underused structural patterns
    var structPatterns = [
      { name: 'Data-driven posts', posts: qual.filter(function(p){return p._traits.hasData;}), label: 'posts with specific numbers/data' },
      { name: 'Story-led posts', posts: qual.filter(function(p){return p._traits.hasStory;}), label: 'posts that open with personal experience' },
      { name: 'Analogy posts', posts: qual.filter(function(p){return p._traits.hasAnalogy;}), label: 'posts using analogies and comparisons' },
      { name: 'Rhetorical question posts', posts: qual.filter(function(p){return p._traits.hasRhetoric;}), label: 'posts with multiple rhetorical questions' }
    ];
    structPatterns.forEach(function(sp) {
      var pct = sp.posts.length / qual.length * 100;
      var avg = sp.posts.length>=3 ? sp.posts.reduce(function(s,p){return s+eng(p);},0)/sp.posts.length : 0;
      if (avg > avgE * 1.1 && pct < 20 && sp.posts.length >= 3) {
        weapons.push({ type: 'structure', name: sp.name, pct: Math.round(pct), avgEng: Math.round(avg), lift: Math.round((avg - avgE)/avgE*100), best: sp.posts.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
      }
    });

    // Underused closing types
    closeTypes.forEach(function(ct) {
      var cp = closeMap[ct];
      var pct = cp.length / qual.length * 100;
      var avg = cp.reduce(function(s,p){return s+eng(p);},0)/cp.length;
      if (avg > avgE * 1.1 && pct < 15 && cp.length >= 2) {
        weapons.push({ type: 'closing', name: esc(ct), pct: Math.round(pct), avgEng: Math.round(avg), lift: Math.round((avg - avgE)/avgE*100), best: cp.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
      }
    });

    weapons.sort(function(a,b) { return b.lift - a.lift; });

    if (weapons.length > 0) {
      weapons.slice(0, 6).forEach(function(w) {
        html += '<div class="report-subsection"><h4>' + w.name + '</h4>';
        html += '<p class="report-prose">You only use this in <strong>' + w.pct + '%</strong> of posts, but when you do it averages <strong>' + w.avgEng + ' engagement</strong> \u2014 <strong>+' + w.lift + '% above your average</strong>. This is a proven technique you should use more:</p>';
        if (w.best) html += rq(w.best, firstSentences(w.best.text, 2), 'Your best example of this working');
        html += '</div>';
      });
    } else {
      html += '<p class="report-prose">Your technique usage is well-distributed \u2014 there are no major underused patterns. Focus on consistency and experimentation with new formats instead.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 4. REWRITES
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>4. Rewrites \u2014 Your Weakest Posts, Rebuilt</h3>';
    html += '<p class="report-prose">Here are specific posts from your bottom quartile with concrete suggestions for how they could perform better, using patterns from your own top-performing content:</p>';

    var rewriteCandidates = bot25.filter(function(p) {
      return p._traits.hookType !== bestHook || p._traits.closingType !== bestClose || !p._traits.hasLineBreaks;
    }).slice(0, 5);

    if (rewriteCandidates.length > 0) {
      rewriteCandidates.forEach(function(p, idx) {
        var fixes = [];
        var origHook = firstSentences(p.text, 1);

        // Hook fix
        if (p._traits.hookType !== bestHook && HOOK_TEMPLATES[bestHook]) {
          var templates = HOOK_TEMPLATES[bestHook];
          var templateIdx = idx % templates.length;
          fixes.push({ label: 'Hook', current: 'Uses a ' + p._traits.hookType + ' opener (your weakest type)', suggestion: 'Rewrite as a ' + bestHook + ' hook. Template: <em>\u201C' + esc(templates[templateIdx]) + '\u201D</em>' });
        }

        // Structure fix
        if (!p._traits.hasLineBreaks) {
          var lineCount = p.text.split(/\n/).filter(function(l){return l.trim();}).length;
          fixes.push({ label: 'Structure', current: 'Only ' + lineCount + ' visible lines \u2014 reads as a dense block on mobile', suggestion: 'Break into single-sentence paragraphs with blank lines between. Your top posts average 5+ visible line breaks.' });
        }

        // Closing fix
        if (p._traits.closingType !== bestClose) {
          var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
          var lastLine = lines.length > 0 ? lines[lines.length-1] : '';
          fixes.push({ label: 'Closing', current: 'Ends with a ' + p._traits.closingType + ' (\u201C' + esc(trunc(lastLine, 60)) + '\u201D)', suggestion: 'Your best-performing closing type is <strong>' + esc(bestClose) + '</strong>. ' + (bestClose === 'Question Close' ? 'End with a direct question to the reader that invites them to share their experience.' : bestClose === 'Call to Action' ? 'End with a specific action the reader can take right now.' : bestClose === 'Forward-Looking Declaration' ? 'End with a short, punchy declaration \u2014 one sentence, under 80 characters.' : 'Wrap up with a clear takeaway or reflection.') });
        }

        // Length fix
        var w = wc(p.text);
        if (w < bestLen.min && bestLen.min > 0) {
          fixes.push({ label: 'Length', current: w + ' words (below your optimal range)', suggestion: 'Expand to ' + bestLen.min + '\u2013' + (bestLen.max === Infinity ? '500+' : bestLen.max) + ' words. Add a specific example, a data point, or a personal story to develop the argument.' });
        } else if (w >= bestLen.max && bestLen.max < Infinity) {
          fixes.push({ label: 'Length', current: w + ' words (above your optimal range)', suggestion: 'Trim to ' + bestLen.min + '\u2013' + bestLen.max + ' words. Cut the throat-clearing intro and any repeated points.' });
        }

        if (fixes.length > 0) {
          html += '<div class="report-subsection"><h4>Post #' + (idx + 1) + '</h4>';
          html += rq(p, firstSentences(p.text, 2));
          html += '<table style="width:100%;border-collapse:collapse;margin:12px 0 8px;">';
          fixes.forEach(function(f) {
            html += '<tr style="border-bottom:1px solid #e2e8f0;">';
            html += '<td style="padding:8px 10px;font-weight:700;color:#64748b;font-size:12px;text-transform:uppercase;vertical-align:top;width:70px;">' + f.label + '</td>';
            html += '<td style="padding:8px 0;font-size:13px;color:#dc2626;">\u2718 ' + f.current + '</td>';
            html += '</tr><tr style="border-bottom:1px solid #e2e8f0;">';
            html += '<td style="padding:8px 10px;"></td>';
            html += '<td style="padding:8px 0;font-size:13px;color:#16a34a;">\u2714 ' + f.suggestion + '</td>';
            html += '</tr>';
          });
          html += '</table></div>';
        }
      });
    } else {
      html += '<p class="report-prose">Your bottom posts don\u2019t have obvious structural fixes \u2014 they may be underperforming due to timing or topic choice rather than writing quality.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 5. ENGAGEMENT FLYWHEEL — WHAT COMPOUNDS
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>5. Your Engagement Flywheel \u2014 What Compounds</h3>';
    html += '<p class="report-prose">Individual tactics matter, but <strong>combinations</strong> multiply engagement. Here are the specific recipes that work best for you:</p>';

    var combos = [];
    // Hook x Topic combos
    hookTypes.forEach(function(ht) {
      catNames.forEach(function(cn) {
        var combo = qual.filter(function(p) { return p._traits.hookType === ht && (p._categories||[]).indexOf(cn) !== -1; });
        if (combo.length >= 3) {
          var avg = combo.reduce(function(s,p){return s+eng(p);},0)/combo.length;
          combos.push({ label: esc(ht) + ' hook + ' + esc(cn), count: combo.length, avgEng: avg, lift: Math.round((avg - avgE)/avgE*100), best: combo.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
        }
      });
    });
    // Hook x Closing combos
    hookTypes.forEach(function(ht) {
      closeTypes.forEach(function(ct) {
        var combo = qual.filter(function(p) { return p._traits.hookType === ht && p._traits.closingType === ct; });
        if (combo.length >= 3) {
          var avg = combo.reduce(function(s,p){return s+eng(p);},0)/combo.length;
          combos.push({ label: esc(ht) + ' hook + ' + esc(ct), count: combo.length, avgEng: avg, lift: Math.round((avg - avgE)/avgE*100), best: combo.slice().sort(function(a,b){return eng(b)-eng(a);})[0] });
        }
      });
    });

    combos.sort(function(a,b) { return b.avgEng - a.avgEng; });

    var topCombos = combos.slice(0, 3);
    var botCombos = combos.length > 3 ? combos.slice(-3).reverse() : [];

    if (topCombos.length > 0) {
      html += '<div class="report-subsection"><h4>Your Winning Recipes</h4>';
      topCombos.forEach(function(c) {
        html += '<p class="report-prose"><strong>' + c.label + '</strong> \u2014 ' + c.count + ' posts, avg engagement ' + Math.round(c.avgEng) + ' (<strong>' + (c.lift >= 0 ? '+' : '') + c.lift + '% vs average</strong>).</p>';
        if (c.best) html += rq(c.best, firstSentences(c.best.text, 2));
      });
      html += '</div>';
    }

    if (botCombos.length > 0) {
      html += '<div class="report-subsection"><h4>Combinations to Avoid</h4>';
      html += '<ul class="report-avoid-list">';
      botCombos.forEach(function(c) {
        html += '<li><strong>' + c.label + '</strong> \u2014 ' + c.count + ' posts, avg engagement ' + Math.round(c.avgEng) + ' (' + (c.lift >= 0 ? '+' : '') + c.lift + '% vs average)</li>';
      });
      html += '</ul></div>';
    }

    if (combos.length === 0) {
      html += '<p class="report-prose">Not enough data for combo analysis yet. As you build up more posts across different hook types and topics, patterns will emerge here.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 6. THE COMMENT MULTIPLIER
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>6. The Comment Multiplier</h3>';
    html += '<p class="report-prose">Comments are the highest-value engagement signal on LinkedIn \u2014 they drive 3\u201310x more algorithmic distribution than likes. Here\u2019s how to get more of them:</p>';

    var postsWithComments = qual.filter(function(p){return (p.likes||0) > 0;});
    if (postsWithComments.length >= 10) {
      var medianCR = median(postsWithComments.map(function(p){return (p.comments||0)/(p.likes||1);}));
      var highCR = postsWithComments.filter(function(p){return (p.comments||0)/(p.likes||1) > medianCR;});
      var lowCR = postsWithComments.filter(function(p){return (p.comments||0)/(p.likes||1) <= medianCR;});

      // What high-comment posts do differently
      var highQClose = highCR.filter(function(p){return p._traits.closingType === 'Question Close';}).length;
      var lowQClose = lowCR.filter(function(p){return p._traits.closingType === 'Question Close';}).length;
      var highRhetoric = highCR.filter(function(p){return p._traits.hasRhetoric;}).length;
      var lowRhetoric = lowCR.filter(function(p){return p._traits.hasRhetoric;}).length;
      var highStory = highCR.filter(function(p){return p._traits.hasStory;}).length;
      var lowStory = lowCR.filter(function(p){return p._traits.hasStory;}).length;

      html += '<div class="report-subsection"><h4>What Drives Comments for You</h4>';
      html += '<ul class="report-sig-list">';
      if (highCR.length > 0) {
        var qClosePctHigh = Math.round(highQClose/highCR.length*100);
        var qClosePctLow = Math.round(lowQClose/lowCR.length*100);
        if (qClosePctHigh > qClosePctLow + 10) {
          html += '<li><strong>Question closes</strong> \u2014 ' + qClosePctHigh + '% of your high-comment posts end with a question vs ' + qClosePctLow + '% of low-comment posts</li>';
        }
        var rhetPctHigh = Math.round(highRhetoric/highCR.length*100);
        var rhetPctLow = Math.round(lowRhetoric/lowCR.length*100);
        if (rhetPctHigh > rhetPctLow + 10) {
          html += '<li><strong>Multiple questions throughout</strong> \u2014 ' + rhetPctHigh + '% of high-comment posts use 2+ questions vs ' + rhetPctLow + '% of low-comment posts</li>';
        }
        var storyPctHigh = Math.round(highStory/highCR.length*100);
        var storyPctLow = Math.round(lowStory/lowCR.length*100);
        if (storyPctHigh > storyPctLow + 10) {
          html += '<li><strong>Personal stories</strong> \u2014 ' + storyPctHigh + '% of high-comment posts include personal experience vs ' + storyPctLow + '% of low-comment posts. Stories invite people to share their own.</li>';
        }
      }
      html += '</ul></div>';

      // Best comment-generating closing lines
      var byComments = qual.slice().sort(function(a,b){return (b.comments||0)-(a.comments||0);});
      var topCommentPosts = byComments.slice(0, 3);
      if (topCommentPosts.length > 0) {
        html += '<div class="report-subsection"><h4>Your Best Comment-Generating Closings</h4>';
        html += '<p class="report-prose">Copy these patterns \u2014 these closing lines drove the most discussion:</p>';
        topCommentPosts.forEach(function(p) {
          var lines = p.text.trim().split(/\n/).filter(function(l){return l.trim();});
          var lastLine = lines.length > 0 ? lines[lines.length-1] : '';
          html += rq(p, trunc(lastLine, 150), (p.comments||0) + ' comments, ' + (p.likes||0) + ' likes');
        });
        html += '</div>';
      }
    } else {
      html += '<p class="report-prose">Need more posts with engagement data to analyse comment patterns. Keep posting and check back later.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 7. GROWTH TRAJECTORY
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>7. Growth Trajectory \u2014 What\u2019s Improving, What\u2019s Stalling</h3>';

    if (qual.length >= 20) {
      var midIdx = Math.floor(qual.length / 2);
      // Sort by date (most recent first — assume the array is already date-sorted from scraper)
      var newerHalf = qual.slice(0, midIdx);
      var olderHalf = qual.slice(midIdx);

      var newerAvgEng = newerHalf.reduce(function(s,p){return s+eng(p);},0)/newerHalf.length;
      var olderAvgEng = olderHalf.reduce(function(s,p){return s+eng(p);},0)/olderHalf.length;
      var engChange = olderAvgEng > 0 ? Math.round((newerAvgEng - olderAvgEng)/olderAvgEng*100) : 0;

      var newerAvgWc = Math.round(newerHalf.reduce(function(s,p){return s+wc(p.text);},0)/newerHalf.length);
      var olderAvgWc = Math.round(olderHalf.reduce(function(s,p){return s+wc(p.text);},0)/olderHalf.length);

      var newerCR = newerHalf.reduce(function(s,p){return s+(p.comments||0);},0) / Math.max(newerHalf.reduce(function(s,p){return s+(p.likes||0);},0), 1);
      var olderCR = olderHalf.reduce(function(s,p){return s+(p.comments||0);},0) / Math.max(olderHalf.reduce(function(s,p){return s+(p.likes||0);},0), 1);

      // Hook diversity
      var newerHooks = {};
      newerHalf.forEach(function(p){newerHooks[p._traits.hookType]=true;});
      var olderHooks = {};
      olderHalf.forEach(function(p){olderHooks[p._traits.hookType]=true;});

      html += '<p class="report-prose">Comparing your most recent ' + newerHalf.length + ' posts against your earlier ' + olderHalf.length + ' posts:</p>';

      var improving = [];
      var stalling = [];

      // Engagement
      if (engChange > 10) improving.push('Engagement is <strong>up ' + engChange + '%</strong> (from ' + Math.round(olderAvgEng) + ' to ' + Math.round(newerAvgEng) + ' per post). Your content is resonating more over time.');
      else if (engChange < -10) stalling.push('Engagement has <strong>dropped ' + Math.abs(engChange) + '%</strong> (from ' + Math.round(olderAvgEng) + ' to ' + Math.round(newerAvgEng) + '). This could signal audience fatigue or a shift in content quality.');
      else improving.push('Engagement is <strong>stable</strong> (' + Math.round(olderAvgEng) + ' \u2192 ' + Math.round(newerAvgEng) + '). Consistency is good, but look for ways to push higher.');

      // Views
      if (hasViews) {
        var newerAvgV = newerHalf.reduce(function(s,p){return s+views(p);},0)/newerHalf.length;
        var olderAvgV = olderHalf.reduce(function(s,p){return s+views(p);},0)/olderHalf.length;
        var viewChange = olderAvgV > 0 ? Math.round((newerAvgV - olderAvgV)/olderAvgV*100) : 0;
        if (viewChange > 15) improving.push('Average views are <strong>up ' + viewChange + '%</strong> (' + fmt(Math.round(olderAvgV)) + ' \u2192 ' + fmt(Math.round(newerAvgV)) + '). Your reach is growing.');
        else if (viewChange < -15) stalling.push('Average views have <strong>dropped ' + Math.abs(viewChange) + '%</strong> (' + fmt(Math.round(olderAvgV)) + ' \u2192 ' + fmt(Math.round(newerAvgV)) + '). Consider posting more consistently to maintain algorithmic reach.');
      }

      // Word count evolution
      if (newerAvgWc > olderAvgWc * 1.15) improving.push('Your posts are getting <strong>longer</strong> (' + olderAvgWc + ' \u2192 ' + newerAvgWc + ' words). You\u2019re developing ideas more fully.');
      else if (newerAvgWc < olderAvgWc * 0.85) stalling.push('Your posts are getting <strong>shorter</strong> (' + olderAvgWc + ' \u2192 ' + newerAvgWc + ' words). Make sure you\u2019re not sacrificing depth for speed.');

      // Comment ratio
      if (newerCR > olderCR * 1.15) improving.push('Your comment ratio has <strong>improved</strong> (' + (olderCR*100).toFixed(1) + '% \u2192 ' + (newerCR*100).toFixed(1) + '%). Your content is sparking more discussion.');
      else if (newerCR < olderCR * 0.85) stalling.push('Your comment ratio has <strong>declined</strong> (' + (olderCR*100).toFixed(1) + '% \u2192 ' + (newerCR*100).toFixed(1) + '%). Try ending more posts with questions to invite replies.');

      // Hook diversity
      var newerHookCount = Object.keys(newerHooks).length;
      var olderHookCount = Object.keys(olderHooks).length;
      if (newerHookCount > olderHookCount) improving.push('You\u2019re using <strong>more hook types</strong> (' + olderHookCount + ' \u2192 ' + newerHookCount + ' types). Variety keeps your audience engaged.');
      else if (newerHookCount < olderHookCount) stalling.push('Your hook variety has <strong>narrowed</strong> (' + olderHookCount + ' \u2192 ' + newerHookCount + ' types). Experiment with different openers to avoid predictability.');

      if (improving.length > 0) {
        html += '<div class="report-subsection"><h4>\u2705 What\u2019s Improving</h4><ul class="report-sig-list">';
        improving.forEach(function(item) { html += '<li>' + item + '</li>'; });
        html += '</ul></div>';
      }
      if (stalling.length > 0) {
        html += '<div class="report-subsection"><h4>\u26A0\uFE0F What Needs Attention</h4><ul class="report-avoid-list">';
        stalling.forEach(function(item) { html += '<li>' + item + '</li>'; });
        html += '</ul></div>';
      }
    } else {
      html += '<p class="report-prose">Need at least 20 qualifying posts to track your growth trajectory. You have ' + qual.length + ' \u2014 keep posting and this section will unlock.</p>';
    }
    html += '</div>';

    // ═════════════════════════════════════════════════════════════════
    // 8. YOUR 30-DAY CHALLENGE
    // ═════════════════════════════════════════════════════════════════
    html += '<div class="report-section"><h3>8. Your 30-Day Challenge</h3>';
    html += '<p class="report-prose">A four-week progressive programme to improve your LinkedIn writing, based on the gaps this analysis has identified. Each week focuses on one specific skill:</p>';

    var targetEng = Math.round(avgE * 1.2);
    var targetPW = Math.max(Math.round(pw) + 1, 3);

    // Week 1: Hooks
    html += '<div class="report-callout" style="margin-bottom:16px;"><h4>Week 1: Hook Mastery</h4>';
    html += '<p><strong>Goal:</strong> Write ' + targetPW + ' posts this week, each opening with a <strong>' + esc(bestHook) + '</strong> hook.</p>';
    if (HOOK_TEMPLATES[bestHook]) {
      html += '<p><strong>Templates to use:</strong></p><ul>';
      HOOK_TEMPLATES[bestHook].forEach(function(t) { html += '<li style="font-size:13px;color:#334155;line-height:1.7;"><em>' + esc(t) + '</em></li>'; });
      html += '</ul>';
    }
    html += '<p><strong>Target:</strong> ' + targetEng + '+ engagement per post (20% above your current average of ' + Math.round(avgE) + ').</p>';
    html += '</div>';

    // Week 2: Closings
    html += '<div class="report-callout" style="margin-bottom:16px;"><h4>Week 2: Closing Power</h4>';
    html += '<p><strong>Goal:</strong> Write ' + targetPW + ' posts, each ending with a <strong>' + esc(bestClose) + '</strong>.</p>';
    html += '<p><strong>Why:</strong> ';
    if (bestClose === 'Question Close') html += 'Questions invite replies. Ask something specific that your audience can answer from their own experience. Avoid generic questions like "What do you think?" \u2014 instead, ask "What\u2019s the biggest [X] mistake you\u2019ve made?"';
    else if (bestClose === 'Call to Action') html += 'Direct your reader to take a specific action. "DM me if you want the template" or "Share this with someone who needs to hear it" \u2014 make it concrete.';
    else if (bestClose === 'Forward-Looking Declaration') html += 'End with a punchy, short sentence. Under 80 characters. Make it quotable. The last line is what people remember.';
    else html += 'Wrap up with a clear takeaway. One sentence that captures the entire post\u2019s message. If someone only read the last line, they should get the core idea.';
    html += '</p>';
    html += '<p><strong>Target:</strong> Increase comment ratio by 15% vs your current ' + (commentRatio*100).toFixed(1) + '%.</p>';
    html += '</div>';

    // Week 3: The Combo
    html += '<div class="report-callout" style="margin-bottom:16px;"><h4>Week 3: The Winning Combo</h4>';
    html += '<p><strong>Goal:</strong> Write ' + targetPW + ' posts combining your strongest patterns:</p>';
    html += '<ol style="padding-left:20px;">';
    html += '<li style="font-size:13px;color:#334155;line-height:1.8;">Open with a <strong>' + esc(bestHook) + '</strong> hook</li>';
    if (catMap[bestCat] && bestCat !== 'Other') html += '<li style="font-size:13px;color:#334155;line-height:1.8;">Write about <strong>' + esc(bestCat) + '</strong> (your highest-performing topic)</li>';
    html += '<li style="font-size:13px;color:#334155;line-height:1.8;">Target <strong>' + bestLen.min + '\u2013' + (bestLen.max === Infinity ? '500+' : bestLen.max) + ' words</strong></li>';
    html += '<li style="font-size:13px;color:#334155;line-height:1.8;">Close with a <strong>' + esc(bestClose) + '</strong></li>';
    html += '</ol>';
    html += '<p><strong>Target:</strong> At least one post breaking your top 25% threshold (' + Math.round(eng(top25[top25.length-1])) + '+ engagement).</p>';
    html += '</div>';

    // Week 4: Experiment
    html += '<div class="report-callout" style="margin-bottom:16px;"><h4>Week 4: The Experiment</h4>';
    html += '<p><strong>Goal:</strong> Write ' + targetPW + ' posts, each trying one <strong>underused weapon</strong> from Section 3:</p>';
    if (weapons.length > 0) {
      html += '<ul>';
      weapons.slice(0, 4).forEach(function(w) {
        html += '<li style="font-size:13px;color:#334155;line-height:1.8;">Try a post using <strong>' + w.name.toLowerCase() + '</strong> (has worked at +' + w.lift + '% for you before)</li>';
      });
      html += '</ul>';
    } else {
      html += '<p>Try a hook type you\u2019ve never used, a topic you haven\u2019t covered, or a format (like a numbered list or a thread) that\u2019s outside your comfort zone.</p>';
    }
    html += '<p><strong>Target:</strong> Discover at least one new pattern that outperforms your average.</p>';
    html += '</div>';

    // Success metric
    html += '<div class="report-subsection"><h4>Your Success Metric</h4>';
    html += '<p class="report-prose">After 30 days, compare your average engagement against your current <strong>' + Math.round(avgE) + '</strong>. If the challenge works, you should see a <strong>15\u201325% improvement</strong>. The biggest gains will come from the combo week \u2014 that\u2019s where individual improvements stack.</p>';
    html += '</div>';

    html += '</div>'; // close section 8

    html += '</div>'; // close .report
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
    ['catCharts','hookAnalysis','hashtagAnalysis','structureAnalysis','frequency','insights','recommendations','funnel','timingAnalysis','contentCalendar','shareSummaryText','lengthPerfContent','styleAnalysis','coachingAnalysis'].forEach(function(id){
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
      missingPosts.slice(0, 7).forEach(function(p, i) {
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
      if (missingPosts.length > 7) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align:center;color:#94a3b8;padding:12px;">...and '+(missingPosts.length-7)+' more</td>';
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

    // Growth & Coaching
    renderCoaching(posts, hasViews);

    // Share Summary
    renderShareSummary(posts, hasViews, medViews, avgEng, medEng, totalViews);

    // Build nav, tabs & collapsible after all sections rendered
    setTimeout(function() { buildSectionNav(); initTabs(); initCollapsible(); }, 50);
  }

  // ── Load & go ─────────────────────────────────────────────────────
  var _urlParams = new URLSearchParams(window.location.search);
  var _dataSource = _urlParams.get('source'); // 'company' or null
  var _companyId = _urlParams.get('id') || '';
  var _storageKey = _dataSource === 'company' ? 'linkedinPosts_company' : 'linkedinPosts';

  chrome.storage.local.get(_storageKey, function(result) {
    var posts = result[_storageKey];
    if (!posts || !posts.length) { document.getElementById('loading').textContent = 'No data found. Please scrape some posts first.'; return; }

    // Show data source banner for company pages
    if (_dataSource === 'company') {
      var banner = document.getElementById('dataSourceBanner');
      if (banner) {
        var label = _companyId ? _companyId.replace(/-/g, ' ') : 'Company';
        banner.innerHTML = '<span class="banner-icon">&#x1F3E2;</span> Analysing <strong>' + esc(label) + '</strong> company posts (' + posts.length + ' posts)';
        banner.classList.remove('hidden');
      }
    }

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
