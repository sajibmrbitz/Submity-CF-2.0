(function () {
  function $all(s, r = document) { try { return Array.from(r.querySelectorAll(s)); } catch(e) { return []; } }

  function startTracking(handle, lastSubId) {
    let statusDiv = document.getElementById('submity-status') || document.createElement('div');
    statusDiv.id = 'submity-status';
    statusDiv.style.cssText = "margin-top:10px; font-weight:bold; text-align:center; padding:10px; border-radius:5px; background:#f0f0f0;";
    document.querySelector('.submit, button[type="submit"]').parentNode.appendChild(statusDiv);

    const interval = setInterval(async () => {
      const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=2&_=${Date.now()}`);
      const data = await res.json();
      const newSub = data.result.find(s => s.id > lastSubId);
      
      if (!newSub) { statusDiv.innerText = "Submitting..."; return; }
      
      if (!newSub.verdict || newSub.verdict === "TESTING") {
        statusDiv.innerText = `Running on test ${newSub.passedTestCount + 1}...`;
        statusDiv.style.color = "orange";
      } else {
        clearInterval(interval);
        statusDiv.innerText = (newSub.verdict === "OK" ? "Accepted ✨" : newSub.verdict.replace(/_/g, ' ')) + ` (Test ${newSub.passedTestCount + (newSub.verdict==="OK"?0:1)})`;
        statusDiv.style.color = (newSub.verdict === "OK" ? "green" : "red");
      }
    }, 2000);
  }

  function getCommentPrefix() {
    const langSelect = document.querySelector('select[name="programTypeId"]');
    if (!langSelect) return '// ';
    const langText = langSelect.options[langSelect.selectedIndex].text.toLowerCase();
    
    if (langText.includes('python') || langText.includes('pypy') || langText.includes('ruby')) return '# ';
    if (langText.includes('haskell')) return '-- ';
    return '// ';
  }

  function init() {
    const input = document.querySelector('input[name="sourceFile"]');
    if (!input || document.querySelector('textarea[name="sourceFile"]')) return;

    const t = document.createElement('textarea');
    t.name = "sourceFile";
    t.id = "submity-editor";
    t.style.cssText = "width:100%; min-height:200px; font-family:monospace; margin-bottom:10px; padding:10px; border-radius:5px;";
    input.parentNode.replaceChild(t, input);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.cpp,.c,.py,.java,.js,.txt';
    fileInput.style.cssText = "display:block; margin-bottom:10px; font-size:13px; cursor:pointer;";
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { t.value = ev.target.result; };
      reader.readAsText(file);
    });
    t.parentNode.insertBefore(fileInput, t); 

    if (!document.getElementById('sub-frame')) {
      const frame = document.createElement('iframe');
      frame.name = 'sub-frame'; frame.id = 'sub-frame'; frame.style.display = 'none';
      document.body.appendChild(frame);
    }

    const form = t.closest('form');
    form.setAttribute('target', 'sub-frame');

    form.addEventListener('submit', async () => {
      const handle = document.querySelector('.lang-chooser a[href^="/profile/"]').innerText.trim();
      
      const originalCode = t.value;
      t.value += `\n\n${getCommentPrefix()}ID:${Date.now()}`;

      const r = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1`);
      const d = await r.json();
      startTracking(handle, d.result[0] ? d.result[0].id : -1);

      setTimeout(() => { t.value = originalCode; }, 1000);
    });
  }

  const obs = new MutationObserver(init);
  obs.observe(document.body, { childList: true, subtree: true });
  init();
})();
