(() => {
  if (window.__highStyleMotionPresetHook) return;
  window.__highStyleMotionPresetHook = true;

  const load = document.getElementById('loadHighStyle');
  if (!load) return;

  function apply(){
    const entrance = document.getElementById('animationEntrance');
    const buttons = document.getElementById('animationButtons');
    const accent = document.getElementById('animationAccent');
    if (!entrance || !buttons || !accent) return;
    entrance.value = 'reveal';
    buttons.value = 'wave';
    accent.value = 'halo';
    entrance.dispatchEvent(new Event('change', {bubbles:true}));
  }

  load.addEventListener('click', () => setTimeout(apply, 60));
})();
