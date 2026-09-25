(function(){
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var calm = function(){ return reduceMotion.matches; };
  var $$ = function(sel, ctx){ return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hero name: split into letters for the staggered entrance ---------- */
  var idx = 0;
  $$('.split').forEach(function(el){
    var text = el.textContent;
    el.textContent = '';
    for (var i = 0; i < text.length; i++){
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = text[i];
      s.style.setProperty('--i', idx++);
      el.appendChild(s);
    }
  });

  /* ---------- About statement: split into words that light up as you scroll ---------- */
  function splitWords(el){
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function(node){
      if (node.nodeType === 3){
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function(part){
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1){
        words = words.concat(splitWords(node));
      }
    });
    return words;
  }
  var statement = document.getElementById('statement');
  var statementWords = splitWords(statement);

  // Entrance: the next frame, so the hidden state is painted before transitions start.
  requestAnimationFrame(function(){ root.classList.add('is-ready'); });
  setTimeout(function(){ root.classList.add('is-ready'); }, 120);

  /* ---------- Nav: glass on scroll, hide on scroll down, active section ---------- */
  var nav = document.getElementById('nav');
  var links = document.getElementById('nav-links');
  var toggle = document.getElementById('nav-toggle');
  var ind = links.querySelector('.nav-ind');
  var navAnchors = $$('a', links);
  var progress = nav.querySelector('.progress');
  var lastY = window.scrollY;

  function setMenu(open){
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function(){ setMenu(!links.classList.contains('is-open')); });
  navAnchors.forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });

  function moveIndicator(a){
    if (!a){ ind.style.opacity = '0'; return; }
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    ind.style.opacity = '1';
  }
  function setActive(id){
    var current = null;
    navAnchors.forEach(function(a){
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on){ a.setAttribute('aria-current', 'true'); current = a; } else { a.removeAttribute('aria-current'); }
    });
    moveIndicator(current);
  }
  if ('IntersectionObserver' in window){
    var sectionObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navAnchors.forEach(function(a){
      var s = document.querySelector(a.getAttribute('href'));
      if (s) sectionObs.observe(s);
    });
    sectionObs.observe(document.getElementById('top'));
  }
  window.addEventListener('resize', function(){ moveIndicator(links.querySelector('a.is-active')); });

  /* ---------- Scroll-driven work, batched into one frame ---------- */
  var parallaxEls = $$('[data-parallax]');
  var lastLit = -1;
  var ticking = false;

  function lightStatement(){
    if (calm()){ if (lastLit !== statementWords.length){ statementWords.forEach(function(w){ w.style.opacity = ''; }); lastLit = statementWords.length; } return; }
    var r = statement.getBoundingClientRect();
    var vh = window.innerHeight;
    // fully lit once the paragraph's bottom has risen to ~55% of the viewport
    var p = (vh * 0.9 - r.top) / (r.height + vh * 0.35);
    var lit = Math.max(0, Math.min(1, p)) * (statementWords.length + 2);
    var whole = Math.floor(lit);
    if (whole === lastLit) return;
    lastLit = whole;
    statementWords.forEach(function(w, i){ w.style.opacity = i < whole ? '1' : '0.2'; });
  }

  function onScroll(){
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 12);
    if (!links.classList.contains('is-open')){
      nav.classList.toggle('is-hidden', y > lastY && y > 480);
    }
    lastY = y;
    if (!calm()){
      parallaxEls.forEach(function(el){
        if (y < window.innerHeight * 1.2){
          el.style.translate = '0 ' + (y * parseFloat(el.dataset.parallax)).toFixed(1) + 'px';
        }
      });
    }
    lightStatement();
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking){ ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  function settle(el){
    el.classList.add('is-in');
    // hand the element back to its own hover transitions once the entrance has played
    setTimeout(function(){ el.classList.remove('reveal'); el.style.removeProperty('--rd'); }, calm() ? 0 : 1100);
  }
  if ('IntersectionObserver' in window){
    var revealObs = new IntersectionObserver(function(entries){
      var batch = 0;
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--rd', (batch++ * 0.08) + 's');
        settle(en.target);
        revealObs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function(el){ revealObs.observe(el); });
  } else {
    reveals.forEach(settle);
  }

  /* ---------- Project visuals: draw when seen; RESQ replays its run on hover ---------- */
  var resqVisual = document.getElementById('resq-visual');
  var ambMove = document.getElementById('amb-move');
  var running = false;
  function runResq(){
    if (calm() || running || !ambMove || typeof ambMove.beginElement !== 'function') return;
    running = true;
    resqVisual.classList.remove('is-playing');
    void resqVisual.offsetWidth; // restart the signal transitions
    resqVisual.classList.add('is-playing');
    ambMove.beginElement();
    setTimeout(function(){ running = false; }, 2600);
  }
  if ('IntersectionObserver' in window){
    var visualObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        en.target.classList.add('is-drawn');
        if (en.target === resqVisual) setTimeout(runResq, 700);
        visualObs.unobserve(en.target);
      });
    }, { threshold: 0.45 });
    $$('.case-visual').forEach(function(v){ visualObs.observe(v); });
  } else {
    $$('.case-visual').forEach(function(v){ v.classList.add('is-drawn'); });
  }
  document.getElementById('resq').addEventListener('pointerenter', function(){
    if (resqVisual.classList.contains('is-drawn')) runResq();
  });

  /* ---------- Hero rotating line ---------- */
  var words = $$('.rot-word');
  var w = 0;
  setInterval(function(){
    if (calm() || document.hidden) return;
    var cur = words[w];
    w = (w + 1) % words.length;
    var next = words[w];
    cur.classList.remove('is-on');
    cur.classList.add('is-out');
    next.classList.remove('is-out');
    next.classList.add('is-on');
    setTimeout(function(){ cur.classList.remove('is-out'); }, 480);
  }, 2600);

  /* ---------- Pointer effects (fine pointers only) ---------- */
  if (finePointer.matches){
    var bg = document.querySelector('.bg');
    var hero = document.querySelector('.hero');
    var pending = null;
    var lastEvent = null;

    window.addEventListener('pointermove', function(e){
      lastEvent = e;
      root.classList.add('has-pointer');
      if (pending) return;
      pending = requestAnimationFrame(function(){
        pending = null;
        bg.style.setProperty('--px', lastEvent.clientX + 'px');
        bg.style.setProperty('--py', lastEvent.clientY + 'px');
        // layered depth in the hero: photo and tags drift by their own --z
        if (!calm() && window.scrollY < window.innerHeight){
          hero.style.setProperty('--dx', ((lastEvent.clientX / window.innerWidth) - 0.5).toFixed(3));
          hero.style.setProperty('--dy', ((lastEvent.clientY / window.innerHeight) - 0.5).toFixed(3));
        }
      });
    }, { passive: true });
    document.addEventListener('pointerleave', function(){
      root.classList.remove('has-pointer');
      hero.style.setProperty('--dx', 0);
      hero.style.setProperty('--dy', 0);
    });

    $$('.spot').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // Magnetic buttons: drift a few pixels toward the cursor, spring back on leave.
    $$('.magnetic').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        if (calm()) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function(){ el.style.translate = ''; });
    });
  }

  /* ---------- Copy email ---------- */
  $$('.copy').forEach(function(btn){
    var label = btn.querySelector('.copy-label');
    btn.addEventListener('click', function(){
      var text = btn.dataset.copy;
      var done = function(ok){
        label.textContent = ok ? 'Copied!' : text;
        btn.classList.toggle('is-done', ok);
        setTimeout(function(){ label.textContent = 'Copy email'; btn.classList.remove('is-done'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext){
        navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(false); });
      } else {
        done(false);
      }
    });
  });

  /* ---------- Live Codeforces rating: enhances quietly, says nothing on failure ---------- */
  function cfRankColor(rating){
    if (rating < 1200) return '#A3A9B1';
    if (rating < 1400) return '#77BB55';
    if (rating < 1600) return '#3ABAB4';
    if (rating < 1900) return '#6E9CB8';
    if (rating < 2100) return '#B473C4';
    if (rating < 2300) return '#E8A33D';
    if (rating < 2400) return '#E8862F';
    return '#D9534F';
  }
  fetch('https://codeforces.com/api/user.info?handles=Kailash77')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.status !== 'OK' || !data.result || !data.result[0]) return;
      var u = data.result[0];
      var el = document.getElementById('cf-rating');
      el.textContent = '';
      if (u.rating){
        el.style.setProperty('--rank-color', cfRankColor(u.rating));
        var sw = document.createElement('span'); sw.className = 'swatch';
        var b = document.createElement('b'); b.textContent = u.rating;
        el.append(sw, 'Codeforces rating ', b, (u.rank ? ' · ' + u.rank : '') + ' — live');
      } else {
        el.textContent = 'Codeforces: unrated so far — first contest is the hardest part.';
      }
    })
    .catch(function(){});
})();
