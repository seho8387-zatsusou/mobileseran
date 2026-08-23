// Block native pinch-zoom / double-tap-zoom everywhere on the page,
// including right after load and inside scrollable areas like the
// gallery. The map's own zoom is implemented separately below via
// single-touch tap + drag, so nothing on the page needs a real
// multi-touch gesture — CSS touch-action alone doesn't reliably stop
// Safari/in-app-browser pinch-zoom inside scroll containers or before
// any prior touch has "claimed" the gesture, so cancel it at the event
// level too.
['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
  document.addEventListener(type, (e) => e.preventDefault());
});
document.addEventListener('touchmove', (e) => {
  if(e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Block long-press "save image" on every photo except the map, which
// stays saveable on purpose (guests may want it for directions).
// Neither an <img> nor a CSS background-image is safe: in-app WebView
// browsers (KakaoTalk, etc.) turned out to scan for both when deciding
// whether a long-press target is "an image" worth offering to save.
// The only thing left that has no discoverable image URL anywhere in
// the DOM/CSSOM is a <canvas> painted with the picture's raw pixels, so
// the hero/gallery photos are <canvas class="photo-bg" data-src="...">
// elements (see index.html) that this draws into on load.
function drawPhotoCanvas(canvas, img){
  const fit = canvas.dataset.fit === 'contain' ? 'contain' : 'cover';
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cw = Math.max(1, Math.round(rect.width * dpr));
  const ch = Math.max(1, Math.round(rect.height * dpr));
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if(!iw || !ih) return;
  const canvasRatio = cw / ch, imgRatio = iw / ih;
  ctx.clearRect(0, 0, cw, ch);
  if(fit === 'cover'){
    let sw, sh, sx, sy;
    if(imgRatio > canvasRatio){ sh = ih; sw = ih * canvasRatio; sy = 0; sx = (iw - sw) / 2; }
    else { sw = iw; sh = iw / canvasRatio; sx = 0; sy = (ih - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  } else {
    let dw, dh;
    if(imgRatio > canvasRatio){ dw = cw; dh = cw / imgRatio; }
    else { dh = ch; dw = ch * imgRatio; }
    ctx.drawImage(img, 0, 0, iw, ih, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
}

document.querySelectorAll('canvas.photo-bg').forEach((canvas) => {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  const src = canvas.dataset.src;
  if(!src) return;
  const img = new Image();
  img.onload = () => drawPhotoCanvas(canvas, img);
  img.src = src;
});

const weddingDate = new Date('2026-11-14T12:00:00+09:00');
  const now = new Date();
  const diffTime = weddingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const el = document.getElementById('ddayText');

  function renderDday(n){
    if(diffDays > 0){
      el.innerHTML = '<span class="dday-label">결혼식까지</span> <b>D-' + n + '</b>';
    } else if(diffDays === 0){
      el.innerHTML = '<b>오늘</b>이 바로 그날입니다';
    } else {
      el.innerHTML = '함께한 지 <b>' + n + '</b>일';
    }
  }
  renderDday(0);

  // Counts 0 -> diffDays once the calendar section scrolls into view
  // (triggered from the shared reveal observer below).
  let ddayAnimated = false;
  function animateDday(){
    if(ddayAnimated) return;
    ddayAnimated = true;
    const target = Math.abs(diffDays);
    if(target === 0){ renderDday(0); return; }
    const duration = 2200;
    const start = performance.now();
    function tick(t){
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 2);
      renderDday(Math.round(eased * target));
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const mapImg = document.getElementById('mapImg');
  const mapModal = document.getElementById('mapModal');
  const mapModalImg = document.getElementById('mapModalImg');
  const mapModalClose = mapModal ? mapModal.querySelector('.map-modal-close') : null;

  // Tap-to-zoom + drag-to-pan scoped to just the map modal image. Uses only
  // single-touch events (never two-finger pinch), because two-finger
  // gestures get inconsistently intercepted by OS/in-app-browser gesture
  // recognizers (iOS Safari's accessibility zoom, KakaoTalk's in-app
  // browser, etc.) before page JS ever sees them. Single-touch tap/drag is
  // handled reliably everywhere.
  const MAP_ZOOM = 2.4;
  let mapScale = 1;
  let mapTranslateX = 0;
  let mapTranslateY = 0;
  let isPanning = false;
  let panMoved = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartTranslateX = 0;
  let panStartTranslateY = 0;

  function applyMapTransform(){
    if(mapModalImg) mapModalImg.style.transform =
      'translate(' + mapTranslateX + 'px, ' + mapTranslateY + 'px) scale(' + mapScale + ')';
  }
  function resetMapZoom(){
    mapScale = 1;
    mapTranslateX = 0;
    mapTranslateY = 0;
    applyMapTransform();
  }

  function openMapModal(){
    mapModal.classList.add('open');
  }
  function closeMapModal(){
    mapModal.classList.remove('open');
    resetMapZoom();
  }

  if(mapImg && mapModal){
    mapImg.addEventListener('click', openMapModal);
    if(mapModalClose) mapModalClose.addEventListener('click', closeMapModal);
    mapModal.addEventListener('click', closeMapModal);
  }

  if(mapModalImg){
    mapModalImg.addEventListener('click', (e) => {
      // Handled here instead of bubbling to the modal's close handler, so
      // tapping the map toggles zoom instead of closing.
      e.stopPropagation();
      if(panMoved){ panMoved = false; return; }
      if(mapScale > 1){
        resetMapZoom();
      } else {
        mapScale = MAP_ZOOM;
        applyMapTransform();
      }
    });

    mapModalImg.addEventListener('touchstart', (e) => {
      if(e.touches.length === 1 && mapScale > 1){
        isPanning = true;
        panMoved = false;
        mapModalImg.style.transition = 'none';
        panStartX = e.touches[0].clientX;
        panStartY = e.touches[0].clientY;
        panStartTranslateX = mapTranslateX;
        panStartTranslateY = mapTranslateY;
      }
    }, { passive: true });

    mapModalImg.addEventListener('touchmove', (e) => {
      if(e.touches.length === 1 && isPanning){
        e.preventDefault();
        panMoved = true;
        mapTranslateX = panStartTranslateX + (e.touches[0].clientX - panStartX);
        mapTranslateY = panStartTranslateY + (e.touches[0].clientY - panStartY);
        applyMapTransform();
      }
    }, { passive: false });

    mapModalImg.addEventListener('touchend', () => {
      isPanning = false;
      mapModalImg.style.transition = '';
    });
  }

  // Background music: default is playing, but only while the visitor is
  // actually on this tab/page. Autoplay-with-sound is blocked by most
  // mobile browsers until a user gesture happens, so if the initial
  // play() is rejected we just wait for the visitor's first tap/click
  // anywhere on the page and start it then.
  const bgmAudio = document.getElementById('bgmAudio');
  const bgmToggle = document.getElementById('bgmToggle');

  if(bgmAudio && bgmToggle){
    let userPaused = false;
    let waitingForGesture = false;

    function updateBgmButton(){
      const playing = !bgmAudio.paused;
      bgmToggle.classList.toggle('paused', !playing);
      bgmToggle.setAttribute('aria-pressed', String(playing));
    }

    function tryPlayBgm(){
      const playPromise = bgmAudio.play();
      if(playPromise && playPromise.catch){
        playPromise.catch(() => {
          if(waitingForGesture) return;
          waitingForGesture = true;
          const resume = () => {
            waitingForGesture = false;
            if(!userPaused) tryPlayBgm();
          };
          document.addEventListener('touchstart', resume, { once: true });
          document.addEventListener('click', resume, { once: true });
        });
      }
    }

    bgmAudio.addEventListener('play', updateBgmButton);
    bgmAudio.addEventListener('pause', updateBgmButton);

    bgmToggle.addEventListener('click', () => {
      if(bgmAudio.paused){
        userPaused = false;
        tryPlayBgm();
      } else {
        userPaused = true;
        bgmAudio.pause();
      }
    });

    // Pause when the visitor leaves this tab/page, resume when they come
    // back (unless they had explicitly turned it off themselves).
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){
        bgmAudio.pause();
      } else if(!userPaused){
        tryPlayBgm();
      }
    });

    tryPlayBgm();
  }

  // Ripple: a small circle expands from the tap point and fades out.
  // Used on the copy buttons and the BGM toggle.
  function addRipple(btn){
    if(!btn || !window.PointerEvent) return;
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  document.querySelectorAll('.copy-btn').forEach(btn => {
    addRipple(btn);
    // Capture the real label once, before any click can overwrite it —
    // grabbing it inside the click handler instead let rapid repeat
    // clicks capture "복사됨" as the "original" text and get stuck there.
    const original = btn.textContent;
    let resetTimer = null;
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      navigator.clipboard.writeText(num).then(() => {
        btn.textContent = '복사됨';
        if(resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          btn.textContent = original;
          resetTimer = null;
        }, 1500);
      });
    });
  });
  addRipple(bgmToggle);

  // Scroll-triggered fade-up for sections/dividers marked .reveal (see
  // style.css). The Calendar section also kicks off the D-day count-up
  // the first time it comes into view.
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if(!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        if(entry.target.classList.contains('when')) animateDday();
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    revealEls.forEach((elToWatch) => revealObserver.observe(elToWatch));
  } else {
    // No IntersectionObserver support: just show everything and count up.
    revealEls.forEach((elToShow) => elToShow.classList.add('revealed'));
    animateDday();
  }

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gallery: whichever photo sits closest to the row's horizontal center
  // gets a slight scale-up, like an active carousel card.
  const galleryScroll = document.querySelector('.gallery-scroll');
  if(galleryScroll && !prefersReducedMotion){
    const slots = Array.from(galleryScroll.querySelectorAll('.photo-slot'));
    let galleryTicking = false;
    function updateActiveSlot(){
      const center = galleryScroll.getBoundingClientRect().left + galleryScroll.clientWidth / 2;
      let closest = null, closestDist = Infinity;
      slots.forEach((slot) => {
        const r = slot.getBoundingClientRect();
        const dist = Math.abs((r.left + r.width / 2) - center);
        if(dist < closestDist){ closestDist = dist; closest = slot; }
      });
      slots.forEach((slot) => slot.classList.toggle('active', slot === closest));
      galleryTicking = false;
    }
    galleryScroll.addEventListener('scroll', () => {
      if(!galleryTicking){
        galleryTicking = true;
        requestAnimationFrame(updateActiveSlot);
      }
    }, { passive: true });
    updateActiveSlot();
  }

  // Hero photo: a very subtle parallax lag as the page scrolls, clamped
  // to a small range so it never exposes the overscanned canvas edges
  // (see .hero-photo .photo-bg in style.css).
  const heroPhotoBg = document.querySelector('.hero-photo .photo-bg');
  if(heroPhotoBg && !prefersReducedMotion){
    let heroTicking = false;
    function updateHeroParallax(){
      const shift = Math.max(-10, Math.min(10, window.scrollY * 0.05));
      heroPhotoBg.style.transform = 'translateY(' + shift + 'px)';
      heroTicking = false;
    }
    window.addEventListener('scroll', () => {
      if(!heroTicking){
        heroTicking = true;
        requestAnimationFrame(updateHeroParallax);
      }
    }, { passive: true });
    updateHeroParallax();
  }
