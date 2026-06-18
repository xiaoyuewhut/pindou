// ===== 首页逻辑 =====
(function () {
  'use strict';

  function init() {
    const landing = document.getElementById('landing');
    const appMain = document.getElementById('app-main');
    const btnStart = document.getElementById('btn-start');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        landing.classList.add('hidden');
        appMain.classList.remove('hidden');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
