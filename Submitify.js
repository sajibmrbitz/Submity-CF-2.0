(function () {
  function $(s, r = document) { try { return r.querySelector(s); } catch(e) { return null; } }
  function $all(s, r = document) { try { return Array.from(r.querySelectorAll(s)); } catch(e) { return []; } }

  function convert() {
    const input = document.querySelector('input[name="sourceFile"]');
    if (!input) return false;
    if (document.querySelector('textarea[name="sourceFile"]')) return true;

    const t = document.createElement('textarea');
    for (const a of Array.from(input.attributes)) {
      if (a.name !== 'type') t.setAttribute(a.name, a.value);
    }

    t.style.minHeight = '150px';
    t.style.width = '100%';
    t.style.padding = '10px';
    t.style.borderRadius = '6px';
    // t.style.border = '1px solid #555';
    // t.style.background = '#2b2b2b';
    // t.style.color = '#e3e3e3';
    t.style.boxSizing = 'border-box';
    t.style.resize = 'vertical';
    t.style.outline = 'none';
    t.style.fontFamily = 'monospace';
    t.style.fontSize = '14px';
    t.style.transition = '0.15s border';

    t.addEventListener('focus', () => { t.style.border = '1px solid #999'; });
    t.addEventListener('blur',  () => { t.style.border = '1px solid #555'; });

    input.parentNode.replaceChild(t, input);

    const f = document.querySelectorAll('.field');
    if (f.length > 1) f[1].innerText = 'Put Code Here:';

    const form = document.querySelector('.submitForm, form.submitForm');
    if (form) form.setAttribute('target', '_blank');

    const btn = document.querySelector('.submit, button[type="submit"]');
    if (btn) btn.addEventListener('click', () => { try { t.select(); } catch(e){} });

    return true;
  }

  function notices() {
    function adj(id) {
      const n = document.querySelector('.programTypeNotice');
      if (!n) return;
      n.textContent = '';
      if (id === 7 || id === 31) n.textContent = 'Almost always, if you send a solution on PyPy, it works much faster';
    }

    adj(54);

    const sel = document.querySelector("select[name='programTypeId']");
    if (sel) sel.addEventListener('change', function () { adj(parseInt(this.value || '0', 10)); });

    const forms = $all('.submit-form, .submitForm');
    forms.forEach(form => {
      form.addEventListener('submit', function () {
        try {
          const ftaa = form.querySelector("textarea[name='ftaa']");
          const bfaa = form.querySelector("textarea[name='bfaa']");
          if (window._ftaa && window._bfaa) {
            if (ftaa) ftaa.value = window._ftaa;
            if (bfaa) bfaa.value = window._bfaa;
          }
        } catch(e){}

        try {
          if (form.getAttribute('enctype') === 'multipart/form-data') {
            const sf = form.querySelector(".table-form textarea[name=sourceFile]");
            if (sf && (!sf.files || sf.files.length === 0)) form.removeAttribute('enctype');
          }
        } catch(e){}

        const btns = $all('button[type="submit"], .submit', form);
        btns.forEach(b => b.disabled = true);
        setTimeout(() => btns.forEach(b => b.disabled = false), 1500);
        return true;
      });
    });
  }

  function init() { convert(); notices(); }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
    window.addEventListener('load', init, { once: true });
  }

  const obs = new MutationObserver(() => {
    if (document.querySelector('input[name="sourceFile"]')) {
      convert();
      notices();
    }
  });

  obs.observe(document.documentElement || document.body, { childList: true, subtree: true });

  const retry = setInterval(() => {
    if (convert()) { notices(); clearInterval(retry); }
  }, 500);
  setTimeout(() => clearInterval(retry), 10000);
})();
