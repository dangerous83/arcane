'use strict';
(function () {
  const dialog = document.getElementById('expertise-video-dialog');
  const player = document.getElementById('expertise-video-player');
  const closeButton = document.getElementById('expertise-video-close');
  const status = document.getElementById('expertise-video-status');
  const title = document.getElementById('expertise-video-title');
  if (!dialog || !player || !closeButton || !status || !title) return;
  const defaultPoster = player.getAttribute('poster');
  const defaultTitle = title.textContent;
  const defaultLabel = player.getAttribute('aria-label');
  let opener = null;

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  document.querySelectorAll('[data-expertise-video-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (dialog.open) return;
      opener = button;
      const source = button.dataset.videoSrc || player.dataset.src;
      player.poster = button.dataset.videoPoster || defaultPoster;
      title.textContent = button.dataset.videoTitle || defaultTitle;
      player.setAttribute('aria-label', button.dataset.videoLabel || defaultLabel);
      const fallback = player.querySelector('a');
      if (fallback) fallback.href = source;
      showStatus('');
      dialog.showModal();
      document.body.classList.add('expertise-video-open');
      document.getElementById('background-music')?.pause();
      if (player.getAttribute('src') !== source || player.error) player.src = source;
      player.muted = false;
      player.volume = 1;
      if (player.readyState > 0) player.currentTime = 0;
      const playback = player.play();
      playback?.catch(function (error) {
        if (!dialog.open || error.name === 'AbortError') return;
        showStatus(error.name === 'NotAllowedError'
          ? 'Press play in the video controls to start with sound.'
          : 'The video could not start. Please try the play control again.');
      });
    });
  });

  closeButton.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    player.pause();
    if (player.readyState > 0) player.currentTime = 0;
    document.body.classList.remove('expertise-video-open');
    showStatus('');
    if (opener?.getClientRects().length) opener.focus();
    else {
      const menu = opener?.dataset.videoMenu === 'projects-menu' ? 'projects-menu' : 'expertise-menu';
      document.querySelector('[data-menu="' + menu + '"]')?.focus();
    }
  });
  player.addEventListener('playing', function () { showStatus(''); });
  player.addEventListener('error', function () {
    if (dialog.open) showStatus('The video could not load. Please check your connection and try again.');
  });
})();
