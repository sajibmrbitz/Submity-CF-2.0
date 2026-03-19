(function () {
  function $(s, r = document) { try { return r.querySelector(s); } catch(e) { return null; } }
  function $all(s, r = document) { try { return Array.from(r.querySelectorAll(s)); } catch(e) { return []; } }

  function getHandle() {
    const el = document.querySelector('.lang-chooser a[href^="/profile/"]');
    return el ? el.innerText.trim() : null;
  }

  // ম্যাজিক ট্রিক: অদৃশ্য ফ্রেম তৈরি করা হচ্ছে
  function setupHiddenIframe() {
    let iframe = document.getElementById('submity-hidden-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'submity-hidden-frame';
      iframe.name = 'submity-hidden-frame';
      iframe.style.display = 'none'; // একদম অদৃশ্য
      document.body.appendChild(iframe);
    }
  }

  function startTracking(btn, handle, lastSubId) {
    let statusDiv = document.getElementById('submity-live-status');
    if(!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'submity-live-status';
      statusDiv.style.marginTop = '12px';
      statusDiv.style.fontWeight = 'bold';
      statusDiv.style.fontSize = '14px';
      statusDiv.style.textAlign = 'center';
      btn.parentNode.appendChild(statusDiv);
    }

    statusDiv.innerText = "Submitting... Waiting for verdict...";
    statusDiv.style.color = "#005aab";

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=2`);
        const data = await res.json();
        
        if (data.status === "OK" && data.result.length > 0) {
          // আগের সাবমিশনের আইডির চেয়ে বড় আইডি খুঁজছি (Race Condition ফিক্স)
          const newSub = data.result.find(sub => sub.id > lastSubId);
          
          if (!newSub) return; // সার্ভারে আপডেট না হওয়া পর্যন্ত ওয়েট করবে

          const verdict = newSub.verdict;
          const passCount = newSub.passedTestCount;

          if (!verdict || verdict === "TESTING") {
            statusDiv.innerText = `Running on test ${passCount + 1}...`;
            statusDiv.style.color = "#ff8c00";
          } else {
            clearInterval(interval);
            if (verdict === "OK") {
              statusDiv.innerText = `Accepted (Passed ${passCount} tests)`; // ইমোজি সরানো হয়েছে
              statusDiv.style.color = "#00a900";
            } else {
              statusDiv.innerText = `${verdict.replace(/_/g, ' ')} on test ${passCount + 1}`;
              statusDiv.style.color = "red";
            }
          }
        }
      } catch (e) {
        statusDiv.innerText = "Error tracking verdict!";
        statusDiv.style.color = "red";
        clearInterval(interval);
      }
    }, 2000);
  }

  function convert() {
    setupHiddenIframe(); // ফ্রেম কল করা হলো

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
    // টার্গেট '_blank' এর বদলে আমাদের অদৃশ্য ফ্রেমে সেট করা হলো!
    if (form) form.setAttribute('target', 'submity-hidden-frame');

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
      form.addEventListener('submit', async function () {
        
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

        // সাবমিট করার ঠিক আগের সাবমিশন আইডিটা বের করে নিচ্ছি
        const handle = getHandle();
        let lastSubId = -1;
        if (handle) {
          try {
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1`);
            const data = await res.json();
            if(data.status === "OK" && data.result.length > 0) {
              lastSubId = data.result[0].id;
            }
          } catch(e) {}
        }

        const btns = $all('button[type="submit"], .submit', form);
        btns.forEach(b => {
          b.disabled = true;
          startTracking(b, handle, lastSubId); 
        });
        
        setTimeout(() => btns.forEach(b => b.disabled = false), 1500);
        
        return true; // ফর্ম নরমালি সাবমিট হতে দিলাম (অদৃশ্য ফ্রেমে)
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