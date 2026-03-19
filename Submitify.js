(function () {
  function $(s, r = document) { try { return r.querySelector(s); } catch(e) { return null; } }
  function $all(s, r = document) { try { return Array.from(r.querySelectorAll(s)); } catch(e) { return []; } }

  function getHandle() {
    const el = document.querySelector('.lang-chooser a[href^="/profile/"]');
    return el ? el.innerText.trim() : null;
  }

  function startTracking(btn) {
    const handle = getHandle();
    if(!handle) return;

    let statusDiv = document.getElementById('submity-live-status');
    if(!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'submity-live-status';
      statusDiv.style.marginTop = '12px';
      statusDiv.style.fontWeight = 'bold';
      statusDiv.style.fontSize = '14px';
      statusDiv.style.textAlign = 'center';
      statusDiv.style.padding = '8px';
      statusDiv.style.borderRadius = '4px';
      btn.parentNode.appendChild(statusDiv);
    }

    statusDiv.innerText = "Submitting... Waiting for verdict...";
    statusDiv.style.color = "#005aab";
    statusDiv.style.background = "#e1f5fe";

    setTimeout(() => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1&_=${Date.now()}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.status === "OK" && data.result.length > 0) {
            const sub = data.result[0];
            const verdict = sub.verdict;
            const passCount = sub.passedTestCount;

            if (!verdict || verdict === "TESTING") {
              statusDiv.innerText = `Running on test ${passCount + 1}...`;
              statusDiv.style.color = "#ff8c00";
              statusDiv.style.background = "#fff3e0";
            } else {
              clearInterval(interval);
              if (verdict === "OK") {
                statusDiv.innerText = `Accepted (Passed ${passCount} tests)`;
                statusDiv.style.color = "#00a900";
                statusDiv.style.background = "#e8f5e9";
              } else {
                statusDiv.innerText = `${verdict.replace(/_/g, ' ')} on test ${passCount + 1}`;
                statusDiv.style.color = "white";
                statusDiv.style.background = "#ef5350";
              }
            }
          }
        } catch (e) {
          statusDiv.innerText = "Error tracking verdict!";
          statusDiv.style.color = "white";
          statusDiv.style.background = "#d32f2f";
          clearInterval(interval);
        }
      }, 2000);
    }, 2000);
  }

  function setupHiddenIframe() {
    let iframe = document.getElementById('submity-hidden-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'submity-hidden-frame';
      iframe.name = 'submity-hidden-frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
  }

  function convert() {
    setupHiddenIframe();

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
    if (form) form.setAttribute('target', 'submity-hidden-frame');

    const btn = document.querySelector('.submit, button[type="submit"]');
    if (btn) btn.addEventListener('click', () => { try { t.select(); } catch(e){} });

    return true;
  }

  function notices() {
    const forms = $all('.submit-form, .submitForm');
    forms.forEach(form => {
      form.addEventListener('submit', function () {
        const btns = $all('button[type="submit"], .submit', form);
        btns.forEach(b => {
          b.disabled = true;
          startTracking(b); 
        });
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

/*
  =========================================
  OUTPUT EXPECTATION ON CODEFORCES:
  =========================================
  1. No new tabs will open (submits via iframe).
  2. Live verdict tracker starts immediately below the button.
  3. Displays "Submitting... Waiting for verdict..." (Blue).
  4. Updates to "Running on test X..." (Orange).
  5. Final verdict like "Accepted (Passed X tests)" (Green) or WA (Red).
  =========================================
*/