document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.point-btn');

  function closeElement(small, button) {
    small.classList.remove('open');
    small.style.maxHeight = null;
    small.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
  }

  function openElement(small, button) {
    small.classList.add('open');
    small.style.maxHeight = small.scrollHeight + 'px';
    small.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
  }

  buttons.forEach(btn => {
    const targetId = btn.getAttribute('aria-controls');
    const small = targetId ? document.getElementById(targetId) : btn.nextElementSibling;
    if (!small) return;

    closeElement(small, btn);

    btn.addEventListener('click', function () {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeElement(small, btn);
      } else {
        openElement(small, btn);
      }
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        btn.click();
      }
    });

    small.addEventListener('transitionend', function () {
      if (!small.classList.contains('open')) {
        small.style.maxHeight = null;
      }
    });
  });
});
