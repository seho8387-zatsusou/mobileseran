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
  const mapModalClose = mapModal ? mapModal.querySelector('.map-modal-close') : null;

  function openMapModal(){
    mapModal.classList.add('open');
  }
  function closeMapModal(){
    mapModal.classList.remove('open');
  }

  if(mapImg && mapModal){
    mapImg.addEventListener('click', openMapModal);
    if(mapModalClose) mapModalClose.addEventListener('click', closeMapModal);
    mapModal.addEventListener('click', closeMapModal);
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
