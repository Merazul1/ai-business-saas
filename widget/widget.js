(function () {
  const currentScript = document.currentScript;
  const tenantId = (currentScript && currentScript.getAttribute('data-tenant-id')) || 'tenant_default_demo';
  const apiBase = (currentScript && currentScript.getAttribute('data-api-base')) || 'http://localhost:5000/api';

  let isOpen = false;
  let conversationId = null;
  let config = {
    botName: 'AI Assistant',
    greetingMessage: 'Hi there! How can we help you today?',
    themeColor: '#4f46e5',
    companyName: 'Support'
  };

  // Inject Styles
  const style = document.createElement('style');
  style.innerHTML = `
    .aura-widget-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #4f46e5;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .aura-widget-bubble:hover {
      transform: scale(1.08);
    }
    .aura-widget-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.18);
      border: 1px solid #e2e8f0;
      display: none;
      flex-direction: column;
      z-index: 999999;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .aura-widget-header {
      background: #4f46e5;
      color: #ffffff;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .aura-widget-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .aura-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
    }
    .aura-msg-bot {
      align-self: flex-start;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-top-left-radius: 4px;
    }
    .aura-msg-user {
      align-self: flex-end;
      background: #4f46e5;
      color: #ffffff;
      border-top-right-radius: 4px;
    }
    .aura-widget-footer {
      padding: 12px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .aura-widget-input {
      flex: 1;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 13px;
      outline: none;
    }
    .aura-widget-input:focus {
      border-color: #4f46e5;
    }
    .aura-widget-send {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0 14px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  // Widget Container
  const container = document.createElement('div');
  container.innerHTML = `
    <div id="aura-bubble" class="aura-widget-bubble">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>

    <div id="aura-window" class="aura-widget-window">
      <div id="aura-header" class="aura-widget-header">
        <div>
          <div style="font-weight: 700; font-size: 14px;" id="aura-title">AI Assistant</div>
          <div style="font-size: 11px; opacity: 0.85;" id="aura-subtitle">Online • Automated Support</div>
        </div>
        <button id="aura-close" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <div id="aura-messages" class="aura-widget-messages"></div>

      <form id="aura-form" class="aura-widget-footer">
        <input id="aura-input" class="aura-widget-input" type="text" placeholder="Ask a question..." autocomplete="off" />
        <button id="aura-send" class="aura-widget-send" type="submit">Send</button>
      </form>
    </div>
  `;
  document.body.appendChild(container);

  const bubble = document.getElementById('aura-bubble');
  const win = document.getElementById('aura-window');
  const closeBtn = document.getElementById('aura-close');
  const messagesBox = document.getElementById('aura-messages');
  const form = document.getElementById('aura-form');
  const input = document.getElementById('aura-input');

  function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `aura-msg ${sender === 'user' ? 'aura-msg-user' : 'aura-msg-bot'}`;
    div.innerText = text;
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  // Load Config
  fetch(`${apiBase}/chat/config?tenantId=${tenantId}`)
    .then((r) => r.json())
    .then((data) => {
      config = data;
      document.getElementById('aura-title').innerText = config.botName || 'AI Assistant';
      document.getElementById('aura-subtitle').innerText = `${config.companyName || 'Business'} • Online`;
      if (config.themeColor) {
        bubble.style.background = config.themeColor;
        document.getElementById('aura-header').style.background = config.themeColor;
        document.getElementById('aura-send').style.background = config.themeColor;
      }
      appendMessage('bot', config.greetingMessage);
    })
    .catch(() => {
      appendMessage('bot', config.greetingMessage);
    });

  bubble.onclick = () => {
    isOpen = !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) input.focus();
  };

  closeBtn.onclick = () => {
    isOpen = false;
    win.style.display = 'none';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    try {
      const res = await fetch(`${apiBase}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          conversationId,
          message: text
        })
      });
      const data = await res.json();
      if (data.conversationId) conversationId = data.conversationId;
      appendMessage('bot', data.reply);
    } catch (err) {
      appendMessage('bot', 'Sorry, I am currently unable to reach the automation server.');
    }
  };

  // Expose global controller for page buttons
  window.AuraWidget = {
    open: function (prefill) {
      isOpen = true;
      win.style.display = 'flex';
      if (prefill) {
        input.value = prefill;
      }
      input.focus();
    },
    close: function () {
      isOpen = false;
      win.style.display = 'none';
    },
    send: function (text) {
      this.open();
      if (text) {
        input.value = text;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  };
})();
