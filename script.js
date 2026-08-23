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

  // Manual pinch-zoom scoped to just the map modal image. Kept independent of
  // the page's viewport meta (which stays non-zoomable everywhere else) so it
  // also works in in-app browsers like KakaoTalk's, which ignore native
  // pinch-to-zoom regardless of viewport settings.
  let mapScale = 1;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function distanceBetween(touches){
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }
  function resetMapZoom(){
    mapScale = 1;
    if(mapModalImg) mapModalImg.style.transform = 'scale(1)';
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
    mapModalImg.addEventListener('touchstart', (e) => {
      if(e.touches.length === 2){
        pinchStartDistance = distanceBetween(e.touches);
        pinchStartScale = mapScale;
      }
    }, { passive: true });

    mapModalImg.addEventListener('touchmove', (e) => {
      if(e.touches.length === 2 && pinchStartDistance > 0){
        e.preventDefault();
        const newDistance = distanceBetween(e.touches);
        mapScale = Math.min(Math.max(pinchStartScale * (newDistance / pinchStartDistance), 1), 4);
        mapModalImg.style.transform = 'scale(' + mapScale + ')';
      }
    }, { passive: false });

    mapModalImg.addEventListener('touchend', (e) => {
      if(e.touches.length < 2) pinchStartDistance = 0;
    });
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
