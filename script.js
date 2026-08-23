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

  function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older mobile browsers (e.g. iOS Safari < 13.4)
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try{
        document.execCommand('copy') ? resolve() : reject();
      }catch(err){
        reject(err);
      }finally{
        document.body.removeChild(ta);
      }
    });
  }

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      const original = btn.textContent;
      copyText(num).then(() => {
        btn.textContent = '복사됨';
        setTimeout(() => { btn.textContent = original; }, 1500);
      }).catch(() => {
        btn.textContent = '복사 실패';
        setTimeout(() => { btn.textContent = original; }, 1500);
      });
    });
  });
