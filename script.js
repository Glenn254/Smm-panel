/* ===========================
   Kenya cheapest smm panel - script.js (final)
   - Password: papanast254
   - Manual till: 6975729
   - Services: TikTok & Instagram packages with prices
   - Persistent user ID (KCSP-####) in localStorage
   - Orders & wallet in localStorage
   =========================== */

const CONFIG = {
  PASSWORD: 'papanast254',
  CURRENCY: 'KES',
  TILL_NUMBER: '6975729',
  USER_PREFIX: 'KCSP',
  DEFAULT_SERVICES: [
    // TikTok
    { id: 'tt-follow-1000', name: 'TikTok Followers (1,000)', price: 300, unitLabel: '1,000 followers', desc: 'TikTok followers (1,000)', min:1, max:100000 },
    { id: 'tt-likes-500', name: 'TikTok Likes (500)', price: 100, unitLabel: '500 likes', desc: 'TikTok likes (500)', min:1, max:100000 },
    { id: 'tt-views-1000', name: 'TikTok Views (1,000)', price: 80, unitLabel: '1,000 views', desc: 'TikTok views (1,000)', min:1, max:100000 },
    // Instagram
    { id: 'ig-follow-1000', name: 'Instagram Followers (1,000)', price: 350, unitLabel: '1,000 followers', desc: 'Instagram followers (1,000)', min:1, max:100000 },
    { id: 'ig-likes-500', name: 'Instagram Likes (500)', price: 120, unitLabel: '500 likes', desc: 'Instagram likes (500)', min:1, max:100000 },
    { id: 'ig-views-1000', name: 'Instagram Views (1,000)', price: 150, unitLabel: '1,000 views', desc: 'Instagram views (1,000)', min:1, max:100000 }
  ]
};

/* storage helpers */
function storageGet(k, fallback){ const v = localStorage.getItem(k); if (!v) return fallback; try{ return JSON.parse(v);}catch{ return fallback; } }
function storageSet(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

/* boot */
function boot(){
  if (!storageGet('smm_services')) storageSet('smm_services', CONFIG.DEFAULT_SERVICES);
  if (!storageGet('smm_orders')) storageSet('smm_orders', []);
  if (!storageGet('smm_wallet')) storageSet('smm_wallet', { balance: 0 });
}
boot();

/* user id */
function generateUserId(){ return `${CONFIG.USER_PREFIX}-${Math.floor(1000 + Math.random()*9000)}`; }
function ensureUserId(){
  let uid = storageGet('smm_userid', null);
  if (!uid){ uid = generateUserId(); storageSet('smm_userid', uid); }
  const el = document.getElementById('userIdDisplay'); if (el) el.textContent = uid;
  const s = document.getElementById('userIdSmall'); if (s) s.textContent = uid;
  const t = document.getElementById('userIdTop'); if (t) t.textContent = uid;
}
function getUserId(){ return storageGet('smm_userid', generateUserId()); }

/* auth */
function initLoginPage(){
  boot();
  const loginBtn = document.getElementById('loginBtn');
  const passInput = document.getElementById('password');
  const msg = document.getElementById('loginMsg');

  loginBtn.addEventListener('click', ()=>{
    const v = (passInput.value||'').trim();
    if (v === CONFIG.PASSWORD){
      sessionStorage.setItem('smm_auth','1');
      if (!storageGet('smm_userid')) storageSet('smm_userid', generateUserId());
      location.href = 'dashboard.html';
    } else {
      msg.textContent = 'Invalid password';
      msg.style.color = 'var(--danger)';
    }
  });
  passInput.addEventListener('keydown',(e)=>{ if (e.key==='Enter') loginBtn.click(); });
}

function requireAuthOrRedirect(){
  const ok = sessionStorage.getItem('smm_auth')==='1';
  if (!ok){ location.href='index.html'; throw new Error('Unauthorized'); }
  document.querySelectorAll('#logoutBtn').forEach(b=>{ b.addEventListener('click', ()=>{ sessionStorage.removeItem('smm_auth'); location.href='index.html'; }); });
}

/* services */
function getServices(){ return storageGet('smm_services', CONFIG.DEFAULT_SERVICES); }

function renderServicesPage(){
  const grid = document.getElementById('servicesGrid'); if (!grid) return;
  grid.innerHTML = '';
  getServices().forEach(s=>{
    const card = document.createElement('div'); card.className='service-card';
    card.innerHTML = `<div class="service-title">${s.name}</div>
                      <div class="service-desc muted">${s.desc}</div>
                      <div class="service-price">${CONFIG.CURRENCY} ${s.price} / ${s.unitLabel}</div>
                      <div class="service-min small muted">Min: ${s.min} • Max: ${s.max}</div>
                      <div style="margin-top:10px"><a class="btn primary" href="new-order.html" onclick="saveSelectedService('${s.id}')">Order Now</a></div>`;
    grid.appendChild(card);
  });
}
function saveSelectedService(id){ sessionStorage.setItem('smm_selected_service', id); }

/* new order */
function populateServices(){
  const sel = document.getElementById('serviceSelect'); if (!sel) return;
  sel.innerHTML = '';
  getServices().forEach(s=>{
    const o = document.createElement('option'); o.value = s.id;
    o.textContent = `${s.name} — ${CONFIG.CURRENCY} ${s.price}`;
    sel.appendChild(o);
  });
  const saved = sessionStorage.getItem('smm_selected_service');
  if (saved){ sel.value = saved; sessionStorage.removeItem('smm_selected_service'); }
}

function placeOrderFromUI(){
  const svcId = document.getElementById('serviceSelect').value;
  const qty = parseInt(document.getElementById('orderQty').value)||0;
  const target = document.getElementById('orderTarget').value||'';
  const msg = document.getElementById('orderMsg');
  if (!qty || qty<=0){ msg.textContent='Enter a valid quantity'; msg.style.color='var(--danger)'; return; }
  const service = getServices().find(x=>x.id===svcId); if (!service) return;
  if (qty < service.min || qty > service.max){ msg.textContent=`Quantity must be between ${service.min} and ${service.max}`; msg.style.color='var(--danger)'; return; }
  const cost = service.price * qty;
  const wallet = storageGet('smm_wallet',{balance:0});
  if (wallet.balance < cost){ msg.textContent=`Insufficient wallet balance. Need ${CONFIG.CURRENCY} ${cost}`; msg.style.color='var(--danger)'; return; }

  wallet.balance -= cost; storageSet('smm_wallet', wallet);

  const orders = storageGet('smm_orders',[]);
  const order = {
    id: 'ORD' + Date.now().toString().slice(-7),
    serviceId: svcId,
    serviceName: service.name,
    qty, target, cost,
    status: 'Pending',
    userId: getUserId(),
    createdAt: new Date().toISOString()
  };
  orders.unshift(order); storageSet('smm_orders', orders);

  msg.textContent = `Order placed. ID: ${order.id}`; msg.style.color='var(--accent)';
  renderDashboard();
  setTimeout(()=>simulateDelivery(order.id),4000);
}

/* simulate */
function simulateDelivery(orderId){
  const orders = storageGet('smm_orders',[]);
  const idx = orders.findIndex(o=>o.id===orderId); if (idx===-1) return;
  orders[idx].status = Math.random() < 0.96 ? 'Completed' : 'Failed';
  storageSet('smm_orders', orders);
  if (document.location.pathname.endsWith('orders.html')) renderOrdersPage();
  if (document.location.pathname.endsWith('dashboard.html')) renderDashboard();
}

/* add funds (manual) */
function getTillNumber(){ return CONFIG.TILL_NUMBER; }
function confirmManualPayment(){
  const amt = parseFloat(document.getElementById('fundsAmount').value)||0;
  const phone = (document.getElementById('fundsPhone').value||'').trim();
  const msg = document.getElementById('payMsg');
  const uid = getUserId();
  if (amt < 10){ msg.textContent='Minimum KES 10'; msg.style.color='var(--danger)'; return; }
  const confirmed = confirm(`User ${uid} requests crediting ${CONFIG.CURRENCY} ${amt}. Click OK only after you verify payment in till ${CONFIG.TILL_NUMBER}.`);
  if (!confirmed) return;
  const wallet = storageGet('smm_wallet',{balance:0}); wallet.balance += amt; storageSet('smm_wallet', wallet);
  const topups = storageGet('smm_topups',[]); topups.unshift({ id:'TP'+Date.now().toString().slice(-7), userId: uid, phone, amount: amt, createdAt: new Date().toISOString() }); storageSet('smm_topups', topups);
  msg.textContent = `Wallet credited ${CONFIG.CURRENCY} ${amt}`; msg.style.color='var(--success)'; renderWalletAmounts(); renderDashboard();
}

/* render orders */
function renderOrdersPage(){
  const orders = storageGet('smm_orders',[]);
  const tbody = document.querySelector('#ordersTable tbody'); if (!tbody) return;
  tbody.innerHTML = '';
  orders.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id}</td><td>${o.serviceName}</td><td>${o.target}</td><td>${o.qty}</td><td>${statusPill(o.status)}</td>`;
    tbody.appendChild(tr);
  });
}
function statusPill(status){ const cls = status==='Pending'?'status-pending':(status==='Completed'?'status-completed':'status-failed'); return `<span class="status-pill ${cls}">${status}</span>`; }

/* dashboard */
function renderDashboard(){
  const orders = storageGet('smm_orders',[]);
  const wallet = storageGet('smm_wallet',{balance:0});
  const total = orders.length;
  const pending = orders.filter(o=>o.status==='Pending').length;
  const completed = orders.filter(o=>o.status==='Completed').length;
  const recentTbody = document.querySelector('#recentOrdersTable tbody');
  if (recentTbody){
    recentTbody.innerHTML = '';
    orders.slice(0,6).forEach(o=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.id}</td><td>${o.serviceName}</td><td>${o.qty}</td><td>${statusPill(o.status)}</td>`;
      recentTbody.appendChild(tr);
    });
  }
  const totalEl = document.getElementById('statTotalOrders'); if (totalEl) totalEl.textContent = total;
  const pendingEl = document.getElementById('statPendingOrders'); if (pendingEl) pendingEl.textContent = pending;
  const completedEl = document.getElementById('statCompletedOrders'); if (completedEl) completedEl.textContent = completed;
  const walletEl = document.getElementById('statWallet'); if (walletEl) walletEl.textContent = `${CONFIG.CURRENCY} ${wallet.balance}`;
  renderWalletAmounts();
  const uidEl = document.getElementById('userIdDisplay'); if (uidEl) uidEl.textContent = getUserId();
  const uidSmall = document.getElementById('userIdSmall'); if (uidSmall) uidSmall.textContent = getUserId();
}

/* wallet amounts */
function renderWalletAmounts(){
  const wallet = storageGet('smm_wallet',{balance:0});
  document.querySelectorAll('#walletAmount, #walletAmount2').forEach(el=>{ if (el) el.textContent = `${CONFIG.CURRENCY} ${wallet.balance}`; });
}

/* expose */
window.initLoginPage = initLoginPage;
window.requireAuthOrRedirect = requireAuthOrRedirect;
window.ensureUserId = ensureUserId;
window.getUserId = getUserId;
window.getTillNumber = getTillNumber;
window.populateServices = populateServices;
window.placeOrderFromUI = placeOrderFromUI;
window.renderDashboard = renderDashboard;
window.renderOrdersPage = renderOrdersPage;
window.renderServicesPage = renderServicesPage;
window.confirmManualPayment = confirmManualPayment;
window.saveSelectedService = saveSelectedService;
