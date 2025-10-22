/* ===========================
   Kenya cheapest smm panel - script.js
   - Single-password auth (papanast254)
   - localStorage persistence
   - Manual till payment confirmation
   =========================== */

const CONFIG = {
  PASSWORD: 'papanast254', // <-- your chosen password (DO NOT change here unless you want another)
  CURRENCY_SYMBOL: 'KES',
  TILL_NUMBER: '123456', // <-- Change this to your real till number
  DEFAULT_SERVICES: [
    { id: 'wa-subs', name: 'WhatsApp Channel Subscribers', price: 25, min:10, max:100000, desc: 'Add subscribers to your WhatsApp channel' },
    { id: 'tt-follow', name: 'TikTok Followers', price: 40, min:10, max:100000, desc: 'Boost your TikTok followers (drip delivery)' },
    { id: 'tg-subs', name: 'Telegram Subscribers', price: 20, min:10, max:100000, desc: 'Grow your Telegram channel' },
    { id: 'ig-follow', name: 'Instagram Followers', price: 60, min:10, max:100000, desc: 'Instagram followers / profile visits' },
    { id: 'fb-likes', name: 'Facebook Page Likes', price: 30, min:10, max:100000, desc: 'Increase your Facebook page likes' },
    { id: 'yt-subs', name: 'YouTube Subscribers', price: 80, min:10, max:100000, desc: 'YouTube subscribers & views' }
  ]
};

/* ---------- localStorage helpers ---------- */
function storageGet(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function storageSet(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

/* initialize */
function boot() {
  if (!storageGet('smm_services')) storageSet('smm_services', CONFIG.DEFAULT_SERVICES);
  if (!storageGet('smm_orders')) storageSet('smm_orders', []);
  if (!storageGet('smm_wallet')) storageSet('smm_wallet', { balance: 0 });
}
boot();

/* ---------- auth ---------- */
function initLoginPage() {
  const loginBtn = document.getElementById('loginBtn');
  const passInput = document.getElementById('password');
  const msg = document.getElementById('loginMsg');

  loginBtn.addEventListener('click', () => {
    const v = passInput.value || '';
    if (v === CONFIG.PASSWORD) {
      sessionStorage.setItem('smm_auth', '1');
      location.href = 'dashboard.html';
    } else {
      msg.textContent = 'Invalid password';
      msg.style.color = 'var(--danger)';
    }
  });

  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

function requireAuthOrRedirect() {
  const ok = sessionStorage.getItem('smm_auth') === '1';
  if (!ok) {
    location.href = 'index.html';
    throw new Error('Unauthorized');
  } else {
    document.querySelectorAll('#logoutBtn').forEach(b => {
      b.addEventListener('click', () => {
        sessionStorage.removeItem('smm_auth');
        location.href = 'index.html';
      });
    });
  }
}

/* ---------- services ---------- */
function getServices() {
  return storageGet('smm_services', CONFIG.DEFAULT_SERVICES);
}
function renderServicesPage() {
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';
  getServices().forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h4>${s.name}</h4>
      <p class="muted">${s.desc}</p>
      <p style="margin-top:8px;font-weight:700">${CONFIG.CURRENCY_SYMBOL} ${s.price} / unit</p>
      <p class="small muted">Min: ${s.min} • Max: ${s.max}</p>
      <div style="margin-top:10px"><a class="btn primary" href="new-order.html" onclick="saveSelectedService('${s.id}')">Order Now</a></div>`;
    grid.appendChild(card);
  });
}
function saveSelectedService(id) { sessionStorage.setItem('smm_selected_service', id); }

/* ---------- new order ---------- */
function populateServices() {
  const sel = document.getElementById('serviceSelect');
  if (!sel) return;
  sel.innerHTML = '';
  getServices().forEach(s => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = `${s.name} — ${CONFIG.CURRENCY_SYMBOL} ${s.price}`;
    sel.appendChild(o);
  });
  const saved = sessionStorage.getItem('smm_selected_service');
  if (saved) { sel.value = saved; sessionStorage.removeItem('smm_selected_service'); }
}

function placeOrderFromUI() {
  const svcId = document.getElementById('serviceSelect').value;
  const qty = parseInt(document.getElementById('orderQty').value) || 0;
  const target = document.getElementById('orderTarget').value || '';
  const msg = document.getElementById('orderMsg');

  if (!qty || qty <= 0) { msg.textContent = 'Enter a valid quantity'; msg.style.color = 'var(--danger)'; return; }
  const service = getServices().find(s => s.id === svcId);
  if (!service) return;

  if (qty < service.min || qty > service.max) {
    msg.textContent = `Quantity must be between ${service.min} and ${service.max}`;
    msg.style.color = 'var(--danger)';
    return;
  }

  const cost = service.price * qty;
  const wallet = storageGet('smm_wallet', {balance:0});
  if (wallet.balance < cost) {
    msg.textContent = `Insufficient wallet balance. Need ${CONFIG.CURRENCY_SYMBOL} ${cost}`;
    msg.style.color = 'var(--danger)';
    return;
  }

  wallet.balance -= cost;
  storageSet('smm_wallet', wallet);

  const orders = storageGet('smm_orders', []);
  const order = {
    id: 'ORD' + Date.now().toString().slice(-7),
    serviceId: svcId,
    serviceName: service.name,
    qty, target,
    cost,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  storageSet('smm_orders', orders);

  msg.textContent = `Order placed. ID: ${order.id}`;
  msg.style.color = 'var(--brand)';
  renderDashboard();
  setTimeout(() => simulateDelivery(order.id), 4000);
}

/* ---------- simulate delivery ---------- */
function simulateDelivery(orderId) {
  const orders = storageGet('smm_orders', []);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  orders[idx].status = Math.random() < 0.96 ? 'Completed' : 'Failed';
  storageSet('smm_orders', orders);
  if (document.location.pathname.endsWith('orders.html')) renderOrdersPage();
  if (document.location.pathname.endsWith('dashboard.html')) renderDashboard();
}

/* ---------- manual payment (Add Funds) ---------- */
function getTillNumber() { return CONFIG.TILL_NUMBER; }

function confirmManualPayment() {
  const amt = parseFloat(document.getElementById('fundsAmount').value) || 0;
  const phone = (document.getElementById('fundsPhone').value || '').trim();
  const msg = document.getElementById('payMsg');

  if (amt < 10) { msg.textContent = 'Minimum KES 10'; msg.style.color='var(--danger)'; return; }

  // In manual mode we show instructions and then allow confirmation
  // This simulates verifying the till payment manually.
  const confirm = confirm(`Confirm crediting KES ${amt} to wallet for phone ${phone}? (You must verify you received the money on your till ${CONFIG.TILL_NUMBER})`);
  if (!confirm) return;

  const wallet = storageGet('smm_wallet', {balance:0});
  wallet.balance += amt;
  storageSet('smm_wallet', wallet);
  msg.textContent = `Wallet credited ${CONFIG.CURRENCY_SYMBOL} ${amt}`;
  msg.style.color = 'var(--success)';
  renderWalletAmounts();
  renderDashboard();
}

/* ---------- orders rendering ---------- */
function renderOrdersPage() {
  const orders = storageGet('smm_orders', []);
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id}</td><td>${o.serviceName}</td><td>${o.target}</td><td>${o.qty}</td><td>${statusPill(o.status)}</td>`;
    tbody.appendChild(tr);
  });
}

function statusPill(status) {
  const cls = status === 'Pending' ? 'status-pending' : (status === 'Completed' ? 'status-completed' : 'status-failed');
  return `<span class="status-pill ${cls}">${status}</span>`;
}

/* ---------- dashboard rendering ---------- */
function renderDashboard() {
  const orders = storageGet('smm_orders', []);
  const wallet = storageGet('smm_wallet', {balance:0});
  const total = orders.length;
  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Completed').length;

  const recentTbody = document.querySelector('#recentOrdersTable tbody');
  if (recentTbody) {
    recentTbody.innerHTML = '';
    orders.slice(0,6).forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.id}</td><td>${o.serviceName}</td><td>${o.qty}</td><td>${statusPill(o.status)}</td>`;
      recentTbody.appendChild(tr);
    });
  }

  const totalEl = document.getElementById('statTotalOrders'); if (totalEl) totalEl.textContent = total;
  const pendingEl = document.getElementById('statPendingOrders'); if (pendingEl) pendingEl.textContent = pending;
  const completedEl = document.getElementById('statCompletedOrders'); if (completedEl) completedEl.textContent = completed;
  const walletEl = document.getElementById('statWallet'); if (walletEl) walletEl.textContent = `${CONFIG.CURRENCY_SYMBOL} ${wallet.balance}`;

  renderWalletAmounts();
}

/* update wallet amounts in topbars */
function renderWalletAmounts() {
  const wallet = storageGet('smm_wallet', {balance:0});
  document.querySelectorAll('#walletAmount, #walletAmount2').forEach(el => {
    if (el) el.textContent = `${CONFIG.CURRENCY_SYMBOL} ${wallet.balance}`;
  });
}

/* ---------- expose functions ---------- */
window.initLoginPage = initLoginPage;
window.requireAuthOrRedirect = requireAuthOrRedirect;
window.populateServices = populateServices;
window.placeOrderFromUI = placeOrderFromUI;
window.renderDashboard = renderDashboard;
window.renderOrdersPage = renderOrdersPage;
window.renderServicesPage = renderServicesPage;
window.confirmManualPayment = confirmManualPayment;
window.getTillNumber = getTillNumber;
