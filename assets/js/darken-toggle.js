(function(){
  var btn = document.getElementById('darkToggle');
  if(!btn) return;

  function setPressedState() {
    btn.setAttribute('aria-pressed', document.body.classList.contains('dark'));
  }

  btn.addEventListener('click', function(){
    document.body.classList.toggle('dark');
    setPressedState();
    try { localStorage.setItem('dark', document.body.classList.contains('dark')); } catch(e) {}
  });

  // Restore preference
  try {
    if(localStorage.getItem('dark') === 'true') {
      document.body.classList.add('dark');
    }
  } catch(e) {}

  setPressedState();
})();
