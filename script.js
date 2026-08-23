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

const weddingDate = new Date('2026-11-14T12:00:00+09:00');
  const now = new Date();
  const diffTime = weddingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const el = document.getElementById('ddayText');
  if(diffDays > 0){
    el.innerHTML = '<span class="dday-label">결혼식까지</span> <b>D-' + diffDays + '</b>';
  } else if(diffDays === 0){
    el.innerHTML = '<b>오늘</b>이 바로 그날입니다';
  } else {
    el.innerHTML = '함께한 지 <b>' + Math.abs(diffDays) + '</b>일';
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

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      navigator.clipboard.writeText(num).then(() => {
        const original = btn.textContent;
        btn.textContent = '복사됨';
        setTimeout(() => { btn.textContent = original; }, 1500);
      });
    });
  });
