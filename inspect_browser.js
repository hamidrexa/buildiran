const { spawn } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chrome = spawn(edgePath, ['--headless', '--remote-debugging-port=9225', 'http://localhost:8081']);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9225/json').then(r => r.json());
    const page = list.find(p => p.url.includes('localhost:8081'));
    if (!page) { console.log('Page not found'); chrome.kill(); return; }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Page.navigate', params: { url: 'http://localhost:8081' } }));
      setTimeout(() => {
        const expr = `
          (() => {
            const canvases = document.querySelectorAll('canvas');
            const mapgl = window.maplibregl || window._map;
            const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
            return {
              canvasCount: canvases.length,
              url: window.location.href,
              bodyText: document.body.innerText.slice(0, 300),
              scriptsCount: scripts.length
            };
          })()
        `;
        ws.send(JSON.stringify({ id: 5, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      }, 7000);
    };
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[LOG]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
      } else if (data.method === 'Runtime.exceptionThrown') {
        console.log('[EXCEPTION]', data.params.exceptionDetails.text, data.params.exceptionDetails.exception?.description);
      } else if (data.id === 5) {
        console.log('[RESULT]', JSON.stringify(data.result));
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
    setTimeout(() => { ws.close(); chrome.kill(); process.exit(0); }, 15000);
  } catch (e) {
    console.log('Error:', e.message);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
