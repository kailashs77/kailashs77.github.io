(function(){
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var calm = function(){ return reduceMotion.matches; };

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Split hero name into letters for the staggered reveal ---------- */
  var idx = 0;
  document.querySelectorAll('.split').forEach(function(el){
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

  /* ---------- Page entry: short loader on the first visit of a session ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem('ks-seen') === '1'; sessionStorage.setItem('ks-seen', '1'); } catch (e) {}

  function start(){
    root.classList.add('is-loaded');
    // next frame so the hidden state is painted before transitions begin
    requestAnimationFrame(function(){ root.classList.add('is-ready'); });
  }
  if (seen || calm()){
    root.classList.add('skip-loader');
    start();
  } else {
    var started = false;
    var go = function(){ if (!started){ started = true; start(); } };
    setTimeout(go, 650);               // let the loader finish its one beat
    setTimeout(go, 2000);              // never hold the page hostage
  }

  /* ---------- Nav: glass on scroll, hide on scroll down, active section ---------- */
  var nav = document.getElementById('nav');
  var links = document.getElementById('nav-links');
  var toggle = document.getElementById('nav-toggle');
  var ind = links.querySelector('.nav-ind');
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a'));
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

  var sections = navAnchors.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window){
    var sectionObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function(s){ if (s) sectionObs.observe(s); });
    sectionObs.observe(document.getElementById('top'));
  }
  window.addEventListener('resize', function(){ moveIndicator(links.querySelector('a.is-active')); });

  /* ---------- Scroll-driven bits, batched into one rAF ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var timeline = document.getElementById('timeline');
  var tlItems = Array.prototype.slice.call(timeline.querySelectorAll('.tl-item'));
  var ticking = false;

  function onScroll(){
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 12);
    if (!links.classList.contains('is-open')){
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;

    if (!calm()){
      parallaxEls.forEach(function(el){
        if (y < window.innerHeight * 1.2){
          el.style.translate = '0 ' + (y * parseFloat(el.dataset.parallax)).toFixed(1) + 'px';
        }
      });
    }

    // Timeline fill: follows a line 60% down the viewport
    var r = timeline.getBoundingClientRect();
    var mark = window.innerHeight * 0.6;
    var p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    timeline.style.setProperty('--progress', p.toFixed(3));
    tlItems.forEach(function(it){
      it.classList.toggle('is-lit', it.getBoundingClientRect().top + 30 < mark);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking){ ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function settle(el){
    el.classList.add('is-in');
    // hand the element back to its own hover transitions once the entrance has played
    setTimeout(function(){ el.classList.remove('reveal'); el.style.removeProperty('--rd'); }, calm() ? 0 : 1300);
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

  /* ---------- Hero rotating line ---------- */
  var words = Array.prototype.slice.call(document.querySelectorAll('.rot-word'));
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
    setTimeout(function(){ cur.classList.remove('is-out'); }, 520);
  }, 2600);

  /* ---------- Pointer effects: grid spotlight, card glow, tilt (fine pointers only) ---------- */
  if (finePointer.matches){
    var bg = document.querySelector('.bg');
    var pending = null;
    window.addEventListener('pointermove', function(e){
      if (pending) return;
      pending = requestAnimationFrame(function(){
        bg.style.setProperty('--px', e.clientX + 'px');
        bg.style.setProperty('--py', e.clientY + 'px');
        pending = null;
      });
      root.classList.add('has-pointer');
    }, { passive: true });
    document.addEventListener('pointerleave', function(){ root.classList.remove('has-pointer'); });

    document.querySelectorAll('.spot, .frame').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    document.querySelectorAll('.tilt').forEach(function(el){
      var max = parseFloat(el.dataset.tilt) || 4;
      el.addEventListener('pointermove', function(e){
        if (calm() || el.classList.contains('reveal')) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .12s ease-out, border-color .3s ease, box-shadow .4s ease';
        el.style.transform = 'perspective(900px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function(){
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), border-color .3s ease, box-shadow .4s ease';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll('.copy').forEach(function(btn){
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
    if (rating < 1200) return '#A0A6AE';
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
      if (u.rating){
        el.style.setProperty('--rank-color', cfRankColor(u.rating));
        el.innerHTML = '<span class="swatch"></span>Rating <b>' + u.rating + '</b>' + (u.rank ? ' &middot; ' + u.rank : '') + ' &mdash; live';
      } else {
        el.textContent = 'Unrated so far — first contest is the hardest part.';
      }
    })
    .catch(function(){});
})();
