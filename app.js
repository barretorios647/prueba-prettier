/* =====================================================
   H & L ALIMCERV Group — Frontend App
   PHP + MySQL backend (InfinityFree)
   ===================================================== */

'use strict';

// ── Constantes ────────────────────────────────────────
const WA_NUMBER = '529621643422';
const API = {
  auth:     'api/auth.php',
  products: 'api/products.php',
  orders:   'api/orders.php',
  admin:    'api/admin.php',
  upload:   'api/upload.php',
};

// ── Estado global ─────────────────────────────────────
const state = {
  user:     window.__INITIAL_USER__ || null,
  cart:     JSON.parse(localStorage.getItem('hl_cart') || '[]'),
  products: [],
  filter:   { category: 'todos', q: '', sort: 'default' },
  adminData:{ users: [], orders: [], activity: [] },
  otpPhone: '',
  otpTimer: null,
};

// ══════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body && typeof options.body === 'object'
      ? JSON.stringify(options.body)
      : options.body,
  });
  const data = await res.json();
  if (!res.ok && data.error) throw new Error(data.error);
  return data;
}

function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle',
                  info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<i class="fas ${icons[type]} toast__icon"></i><span class="toast__msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, duration);
}

function fmt(n) { return '$' + Number(n).toFixed(2); }
function fmtDate(d) {
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.origText = btn.dataset.origText || btn.innerHTML;
  btn.innerHTML = loading
    ? '<i class="fas fa-spinner fa-spin"></i> Espera...'
    : btn.dataset.origText;
}

// ══════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════

function updateAuthUI() {
  const { user } = state;
  const isAdmin = user && user.role === 'admin';

  // Topbar
  const userMenu   = document.getElementById('user-menu');
  const authBtns   = document.getElementById('auth-btns');
  const userNameEl = document.getElementById('topbar-user-name');
  const ddHeader   = document.getElementById('user-dropdown-header');

  if (user) {
    userMenu.style.display = 'flex';
    authBtns.style.display = 'none';
    userNameEl.textContent = user.name.split(' ')[0];
    ddHeader.innerHTML = `<strong>${escHtml(user.name)}</strong><br><small style="color:var(--text-muted)">${escHtml(user.phone)}</small>`;

    // Drawer
    document.getElementById('drawer-user').style.display = 'flex';
    document.getElementById('drawer-auth').style.display = 'none';
    document.getElementById('drawer-auth-logged').style.display = 'flex';
    document.getElementById('drawer-user-name').textContent = user.name;
    document.getElementById('drawer-user-phone').textContent = user.phone;
    document.getElementById('drawer-orders-btn').style.display = 'flex';

    if (isAdmin) {
      document.getElementById('drawer-admin-btn').style.display = 'flex';
      document.getElementById('dd-admin') && (document.getElementById('dd-admin').style.display = 'flex');
    }
  } else {
    userMenu.style.display = 'none';
    authBtns.style.display = 'flex';
    document.getElementById('drawer-user').style.display = 'none';
    document.getElementById('drawer-auth').style.display = 'flex';
    document.getElementById('drawer-auth-logged').style.display = 'none';
    document.getElementById('drawer-orders-btn').style.display = 'none';
    document.getElementById('drawer-admin-btn').style.display = 'none';
  }
}

async function doLogin(phone, password) {
  const btn = document.getElementById('login-submit');
  const err = document.getElementById('login-error');
  setLoading(btn, true); err.textContent = '';
  try {
    const { user } = await apiFetch(`${API.auth}?action=login`, { method: 'POST', body: { phone, password } });
    state.user = user;
    updateAuthUI();
    closeAllModals();
    toast(`¡Bienvenido, ${user.name.split(' ')[0]}!`, 'success');
    if (user.role === 'admin') loadAdminDashboard();
  } catch (e) { err.textContent = e.message; }
  finally { setLoading(btn, false); }
}

async function doRegister(name, phone, password) {
  const btn = document.getElementById('register-submit');
  const err = document.getElementById('register-error');
  setLoading(btn, true); err.textContent = '';
  try {
    const data = await apiFetch(`${API.auth}?action=register`, { method: 'POST', body: { name, phone, password } });
    state.otpPhone = phone;

    // Paso 2: OTP
    document.getElementById('register-step-1').style.display = 'none';
    document.getElementById('register-step-2').style.display = 'block';
    document.getElementById('verify-phone-display').textContent = phone;
    document.getElementById('step-dot-1').classList.remove('step-dot--active');
    document.getElementById('step-dot-1').classList.add('step-dot--done');
    document.getElementById('step-dot-2').classList.add('step-dot--active');
    document.querySelector('.step-dot-1 span') && (document.getElementById('step-dot-1').querySelector('span').innerHTML = '<i class="fas fa-check"></i>');

    if (data.demo_code) {
      document.getElementById('otp-demo-alert').style.display = 'flex';
      document.getElementById('otp-demo-code').textContent = data.demo_code;
    }
    startOtpTimer();
    document.querySelectorAll('.otp-digit')[0]?.focus();
  } catch (e) { err.textContent = e.message; }
  finally { setLoading(btn, false); }
}

async function doVerifyOtp(code) {
  const btn = document.getElementById('verify-submit');
  const err = document.getElementById('verify-error');
  setLoading(btn, true); err.textContent = '';
  try {
    const { user } = await apiFetch(`${API.auth}?action=verify_otp`, {
      method: 'POST', body: { phone: state.otpPhone, code },
    });
    state.user = user;
    updateAuthUI();
    closeAllModals();
    toast('¡Cuenta verificada! Bienvenido.', 'success');
  } catch (e) { err.textContent = e.message; }
  finally { setLoading(btn, false); }
}

async function doLogout() {
  await apiFetch(`${API.auth}?action=logout`, { method: 'POST' }).catch(() => {});
  state.user = null;
  updateAuthUI();
  closeAdmin();
  toast('Sesión cerrada.', 'info');
}

function startOtpTimer() {
  if (state.otpTimer) clearInterval(state.otpTimer);
  let seconds = 60;
  const timerEl    = document.getElementById('otp-timer');
  const countEl    = document.getElementById('otp-countdown');
  const resendBtn  = document.getElementById('resend-code-btn');
  timerEl.style.display = 'inline'; resendBtn.style.display = 'none';
  state.otpTimer = setInterval(() => {
    seconds--;
    if (countEl) countEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(state.otpTimer);
      timerEl.style.display = 'none';
      resendBtn.style.display = 'inline';
    }
  }, 1000);
}

// OTP digit inputs
function initOtpInputs() {
  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      inp.classList.toggle('filled', inp.value !== '');
      if (inp.value && i < digits.length - 1) digits[i + 1].focus();
      const code = [...digits].map(d => d.value).join('');
      document.getElementById('verify-code').value = code;
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) digits[i - 1].focus();
    });
    inp.addEventListener('paste', (e) => {
      const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      paste.split('').forEach((ch, j) => { if (digits[j]) { digits[j].value = ch; digits[j].classList.add('filled'); } });
      document.getElementById('verify-code').value = paste;
      e.preventDefault();
    });
  });
}

// Toggle password visibility
function initPasswordToggles() {
  document.querySelectorAll('.input-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = btn.closest('.input-wrap').querySelector('input[type="password"], input[type="text"]');
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('i').className = `fas fa-eye${show ? '-slash' : ''}`;
    });
  });
}

// ══════════════════════════════════════════
//  CART
// ══════════════════════════════════════════

function saveCart() { localStorage.setItem('hl_cart', JSON.stringify(state.cart)); }

function addToCart(product) {
  const existing = state.cart.find(i => i.id === product.id);
  if (existing) { existing.quantity++; } else {
    state.cart.push({ id: product.id, name: product.name, price: parseFloat(product.price),
      image: product.image, quantity: 1 });
  }
  saveCart();
  updateCartBadge();
  toast(`${product.name} agregado al carrito.`, 'success', 2000);
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart(); updateCartBadge(); renderCart();
}

function changeQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  if (item.quantity === 0) { removeFromCart(id); return; }
  saveCart(); updateCartBadge(); renderCart();
}

function updateCartBadge() {
  const total = state.cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cart-count').textContent = total;
}

function renderCart() {
  const el     = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  if (state.cart.length === 0) {
    el.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-basket"></i><p>Tu carrito está vacío</p></div>`;
    footer.style.display = 'none'; return;
  }
  footer.style.display = 'flex';
  const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  el.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img class="cart-item__img" src="${escHtml(item.image)}" alt="${escHtml(item.name)}"
        onerror="this.src='img/arroz.jpg'" />
      <div class="cart-item__info">
        <p class="cart-item__name">${escHtml(item.name)}</p>
        <p class="cart-item__price">${fmt(item.price)}</p>
      </div>
      <div class="cart-item__qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
  document.getElementById('cart-total').textContent = fmt(total);
}

function buildWhatsAppMsg() {
  const lines = state.cart.map(i => `• ${i.name} x${i.quantity} = ${fmt(i.price * i.quantity)}`);
  const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const user  = state.user;
  const header = user ? `Cliente: ${user.name} (${user.phone})` : 'Cliente: Invitado';
  return encodeURIComponent(`Hola H&L ALIMCERV, quiero hacer un pedido:\n${header}\n\n${lines.join('\n')}\n\nTotal: ${fmt(total)}`);
}

async function saveOrder() {
  if (!state.user) { toast('Inicia sesión para guardar tu pedido.', 'warning'); openModal('login-modal'); return; }
  if (state.cart.length === 0) return;
  const btn = document.getElementById('checkout-save-btn');
  setLoading(btn, true);
  try {
    await apiFetch(`${API.orders}?action=create`, {
      method: 'POST',
      body: { items: state.cart.map(i => ({ id: i.id, quantity: i.quantity })) },
    });
    state.cart = []; saveCart(); updateCartBadge(); renderCart();
    closeAllModals();
    toast('Pedido guardado correctamente.', 'success');
  } catch (e) { toast(e.message, 'error'); }
  finally { setLoading(btn, false); }
}

// ══════════════════════════════════════════
//  PRODUCTOS
// ══════════════════════════════════════════

async function loadProducts() {
  try {
    const params = new URLSearchParams({ action: 'list' });
    if (state.filter.category !== 'todos') params.set('category', state.filter.category);
    if (state.filter.q) params.set('q', state.filter.q);
    const { products } = await apiFetch(`${API.products}?${params}`);
    state.products = products || [];
    renderProducts();
  } catch {
    toast('Error al cargar los productos.', 'error');
  }
}

function renderProducts() {
  const grid     = document.getElementById('productos');
  const noResult = document.getElementById('no-results');
  let list = [...state.products];

  if (state.filter.sort === 'price_asc')  list.sort((a, b) => a.price - b.price);
  if (state.filter.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  if (state.filter.sort === 'name')       list.sort((a, b) => a.name.localeCompare(b.name));

  if (list.length === 0) {
    grid.innerHTML = '';
    noResult.style.display = 'block'; return;
  }
  noResult.style.display = 'none';

  grid.innerHTML = list.map(p => {
    const badgeClass = p.badge?.toLowerCase() === 'oferta' ? 'producto__badge--sale'
      : p.badge?.toLowerCase() === 'popular' ? 'producto__badge--popular' : '';
    return `
    <article class="producto" data-id="${p.id}">
      <div class="producto__img-wrap">
        ${p.badge ? `<span class="producto__badge ${badgeClass}">${escHtml(p.badge)}</span>` : ''}
        <img src="${escHtml(p.image)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.src='img/arroz.jpg'" />
        <button class="producto__fav" type="button" aria-label="Favorito" onclick="toggleFav(this)">
          <i class="far fa-heart"></i>
        </button>
      </div>
      <div class="producto__body">
        <div class="producto__header">
          <h3 class="producto__title">${escHtml(p.name)}</h3>
        </div>
        <span class="producto__category">${escHtml(p.category)}</span>
        <p class="producto__desc">${escHtml(p.description || '')}</p>
        <div class="producto__footer">
          <p class="precio">
            ${p.old_price ? `<span class="precio__old">${fmt(p.old_price)}</span>` : ''}
            <span class="precio__currency">$</span>
            <span class="precio__amount">${Number(p.price).toFixed(2)}</span>
          </p>
          <div class="producto__actions">
            <button class="btn btn--icon btn--ghost" type="button"
              onclick="addToCart(${JSON.stringify({id:p.id, name:p.name, price:p.price, image:p.image}).replace(/"/g,'&quot;')})"
              aria-label="Agregar al carrito">
              <i class="fas fa-cart-plus"></i>
            </button>
            <button class="btn btn--primary btn--whatsapp btn--sm" type="button"
              onclick="buyNow(${JSON.stringify({name:p.name, price:p.price}).replace(/"/g,'&quot;')})">
              <i class="fab fa-whatsapp"></i> Comprar
            </button>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

function buyNow(product) {
  const msg = encodeURIComponent(`Hola H&L ALIMCERV, me interesa comprar:\n• ${product.name} — ${fmt(product.price)}`);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

function toggleFav(btn) {
  btn.classList.toggle('active');
  const icon = btn.querySelector('i');
  icon.className = btn.classList.contains('active') ? 'fas fa-heart' : 'far fa-heart';
}

// ══════════════════════════════════════════
//  MODALES
// ══════════════════════════════════════════

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal.open, .admin-overlay.open')) {
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.open').forEach(m => closeModal(m.id));
}

function openAdmin() {
  if (!state.user || state.user.role !== 'admin') return;
  const el = document.getElementById('admin-modal');
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  loadAdminDashboard();
}

function closeAdmin() {
  const el = document.getElementById('admin-modal');
  el.classList.remove('open');
  if (!document.querySelector('.modal.open')) document.body.style.overflow = '';
}

// ══════════════════════════════════════════
//  DRAWER
// ══════════════════════════════════════════

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  document.getElementById('open-menu').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
  document.getElementById('open-menu').classList.remove('open');
  if (!document.querySelector('.modal.open, .admin-overlay.open')) {
    document.body.style.overflow = '';
  }
}

// ══════════════════════════════════════════
//  MIS PEDIDOS
// ══════════════════════════════════════════

async function loadMyOrders() {
  openModal('orders-modal');
  const el = document.getElementById('orders-list');
  el.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
  try {
    const { orders } = await apiFetch(`${API.orders}?action=my_orders`);
    if (!orders.length) { el.innerHTML = '<p class="loading-text">No tienes pedidos aún.</p>'; return; }
    el.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card__header">
          <span class="order-card__id">Pedido #${o.id}</span>
          <span class="${statusClass(o.status)}">${statusLabel(o.status)}</span>
        </div>
        <p class="order-card__items">${escHtml(o.items_summary || '')}</p>
        <div class="order-card__footer">
          <span class="order-card__total">${fmt(o.total)}</span>
          <span class="order-card__date">${fmtDate(o.created_at)}</span>
        </div>
      </div>`).join('');
  } catch (e) { el.innerHTML = `<p class="loading-text" style="color:var(--red)">${e.message}</p>`; }
}

// ══════════════════════════════════════════
//  ADMIN — Dashboard
// ══════════════════════════════════════════

async function loadAdminDashboard() {
  try {
    const data = await apiFetch(`${API.admin}?action=stats`);
    const { stats, recent_orders, top_products } = data;
    document.getElementById('stat-users').textContent    = stats.total_users;
    document.getElementById('stat-orders').textContent   = stats.total_orders;
    document.getElementById('stat-revenue').textContent  = fmt(stats.total_revenue);
    document.getElementById('stat-products').textContent = stats.total_products;

    // Pedidos recientes
    const rEl = document.getElementById('admin-recent-orders');
    rEl.innerHTML = recent_orders.length ? `<table class="admin-table" style="min-width:unset">
      <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>${recent_orders.map(o => `<tr>
        <td>#${o.id}</td>
        <td>${escHtml(o.user_name)}</td>
        <td>${fmt(o.total)}</td>
        <td><span class="${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
      </tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);font-size:.85rem">Sin pedidos aún.</p>';

    // Top productos
    const tEl = document.getElementById('admin-top-products');
    tEl.innerHTML = top_products.length ? top_products.map((p, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid var(--border)">
        <span style="font-size:.85rem"><strong>#${i+1}</strong> ${escHtml(p.product_name)}</span>
        <span style="color:var(--gold);font-size:.82rem">${p.sold} vendidos</span>
      </div>`).join('') : '<p style="color:var(--text-muted);font-size:.85rem">Sin datos.</p>';

    // Pedidos pendientes badge
    const pending = recent_orders.filter(o => o.status === 'pendiente').length;
    const badge = document.getElementById('admin-orders-badge');
    if (pending > 0) { badge.textContent = pending; badge.classList.add('show'); }
  } catch (e) { console.error('Dashboard error:', e); }
}

// ── Admin: Productos ──────────────────────────────────
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-productos-body');
  tbody.innerHTML = '<tr><td colspan="7" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
  try {
    const { products } = await apiFetch(`${API.products}?action=list&show_all=1`);
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="7" class="admin-loading">No hay productos.</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `<tr>
      <td><img src="${escHtml(p.image)}" alt="" onerror="this.src='img/arroz.jpg'" /></td>
      <td><strong>${escHtml(p.name)}</strong><br><small style="color:var(--text-muted)">${escHtml(p.description||'').slice(0,50)}</small></td>
      <td>${fmt(p.price)}</td>
      <td><span class="producto__category">${escHtml(p.category)}</span></td>
      <td>${p.stock}</td>
      <td><span class="status-badge ${p.is_active ? 'status--entregado' : 'status--cancelado'}">${p.is_active ? 'Activo' : 'Inactivo'}</span></td>
      <td class="admin-actions">
        <button class="btn btn--sm btn--ghost" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn--sm btn--ghost" onclick="toggleProduct(${p.id},${p.is_active})" title="Cambiar estado"><i class="fas fa-toggle-${p.is_active?'on':'off'}"></i></button>
        <button class="btn btn--sm btn--danger" onclick="deleteProduct(${p.id},'${escHtml(p.name)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" class="admin-loading" style="color:var(--red)">${e.message}</td></tr>`; }
}

function showProductForm(product = null) {
  document.getElementById('producto-form-box').style.display = 'block';
  document.getElementById('producto-form-title').textContent = product ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('producto-id').value    = product?.id || '';
  document.getElementById('p-nombre').value       = product?.name || '';
  document.getElementById('p-precio').value       = product?.price || '';
  document.getElementById('p-precio-old').value   = product?.old_price || '';
  document.getElementById('p-categoria').value    = product?.category || 'alimentos';
  document.getElementById('p-stock').value        = product?.stock || 0;
  document.getElementById('p-badge').value        = product?.badge || '';
  document.getElementById('p-descripcion').value  = product?.description || '';
  document.getElementById('p-imagen').value       = product?.image || '';
  document.getElementById('p-destacado').checked  = !!product?.is_featured;

  const preview = document.getElementById('image-preview');
  if (product?.image) {
    preview.innerHTML = `<img src="${escHtml(product.image)}" alt="" style="max-height:120px;border-radius:8px" onerror="this.src='img/arroz.jpg'" />`;
  } else {
    preview.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p>Arrastra o haz clic</p><small>JPEG, PNG, WEBP — máx. 5 MB</small>`;
  }
  document.getElementById('producto-form-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function editProduct(id) {
  try {
    const { product } = await apiFetch(`${API.products}?action=get&id=${id}`);
    showProductForm(product);
  } catch (e) { toast(e.message, 'error'); }
}

async function toggleProduct(id, current) {
  try {
    await apiFetch(`${API.products}?action=toggle`, { method: 'POST', body: { id } });
    toast(`Producto ${current ? 'desactivado' : 'activado'}.`, 'info');
    loadAdminProducts();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteProduct(id, name) {
  if (!confirm(`¿Eliminar "${name}"?`)) return;
  try {
    await apiFetch(`${API.products}?action=delete`, { method: 'POST', body: { id } });
    toast('Producto eliminado.', 'success');
    loadAdminProducts();
    loadProducts();
  } catch (e) { toast(e.message, 'error'); }
}

async function submitProductForm(e) {
  e.preventDefault();
  const id  = document.getElementById('producto-id').value;
  const btn = e.target.querySelector('[type="submit"]');
  const payload = {
    name:        document.getElementById('p-nombre').value,
    price:       document.getElementById('p-precio').value,
    old_price:   document.getElementById('p-precio-old').value,
    category:    document.getElementById('p-categoria').value,
    stock:       document.getElementById('p-stock').value,
    badge:       document.getElementById('p-badge').value,
    description: document.getElementById('p-descripcion').value,
    image:       document.getElementById('p-imagen').value || 'img/arroz.jpg',
    is_featured: document.getElementById('p-destacado').checked,
  };
  if (id) payload.id = id;
  setLoading(btn, true);
  try {
    await apiFetch(`${API.products}?action=${id ? 'update' : 'create'}`, { method: 'POST', body: payload });
    toast(`Producto ${id ? 'actualizado' : 'creado'} correctamente.`, 'success');
    document.getElementById('producto-form-box').style.display = 'none';
    document.getElementById('producto-form').reset();
    loadAdminProducts();
    loadProducts();
  } catch (e) { toast(e.message, 'error'); }
  finally { setLoading(btn, false); }
}

// Image upload
async function uploadProductImage(file) {
  const area    = document.getElementById('image-upload-area');
  const preview = document.getElementById('image-preview');
  area.style.opacity = '.5';
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res  = await fetch(API.upload, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al subir imagen.');
    document.getElementById('p-imagen').value = data.url;
    preview.innerHTML = `<img src="${escHtml(data.url)}" alt="" style="max-height:120px;border-radius:8px" />`;
    toast('Imagen subida.', 'success');
  } catch (e) { toast(e.message, 'error'); }
  finally { area.style.opacity = '1'; }
}

// ── Admin: Pedidos ────────────────────────────────────
async function loadAdminOrders(filterStatus = '') {
  const tbody = document.getElementById('admin-pedidos-body');
  tbody.innerHTML = '<tr><td colspan="8" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
  try {
    const { orders } = await apiFetch(`${API.orders}?action=admin_list`);
    const filtered   = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">No hay pedidos.</td></tr>'; return; }
    tbody.innerHTML = filtered.map(o => `<tr>
      <td><strong>#${o.id}</strong></td>
      <td>${fmtDate(o.created_at)}</td>
      <td>${escHtml(o.user_name)}</td>
      <td>${escHtml(o.user_phone)}</td>
      <td style="max-width:200px;font-size:.78rem">${escHtml(o.items_summary || '')}</td>
      <td><strong>${fmt(o.total)}</strong></td>
      <td><span class="${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
      <td>
        <select class="filter-select" style="font-size:.75rem;min-width:120px" onchange="updateOrderStatus(${o.id}, this.value)">
          ${['pendiente','confirmado','en_camino','entregado','cancelado'].map(s =>
            `<option value="${s}" ${s===o.status?'selected':''}>${statusLabel(s)}</option>`
          ).join('')}
        </select>
      </td>
    </tr>`).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="8" class="admin-loading" style="color:var(--red)">${e.message}</td></tr>`; }
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`${API.orders}?action=update_status`, { method: 'POST', body: { id, status } });
    toast('Estado actualizado.', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ── Admin: Usuarios ───────────────────────────────────
async function loadAdminUsers() {
  const tbody = document.getElementById('admin-usuarios-body');
  tbody.innerHTML = '<tr><td colspan="10" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
  try {
    const { users } = await apiFetch(`${API.admin}?action=users`);
    state.adminData.users = users;
    renderAdminUsers(users);
  } catch (e) { tbody.innerHTML = `<tr><td colspan="10" class="admin-loading" style="color:var(--red)">${e.message}</td></tr>`; }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-usuarios-body');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="10" class="admin-loading">No hay usuarios.</td></tr>'; return; }
  tbody.innerHTML = users.map(u => `<tr>
    <td>${u.id}</td>
    <td><strong>${escHtml(u.name)}</strong></td>
    <td>${escHtml(u.phone)}</td>
    <td>
      <span class="pw-hidden" id="pw-${u.id}">••••••••</span>
      <span class="pw-toggle" onclick="togglePw(${u.id})" title="Ver/ocultar">👁</span>
    </td>
    <td><span class="status-badge ${u.role==='admin'?'status--confirmado':'status--pendiente'}">${u.role}</span></td>
    <td><span class="status-badge ${u.is_verified?'status--entregado':'status--cancelado'}">${u.is_verified?'Sí':'No'}</span></td>
    <td>${fmtDate(u.created_at)}</td>
    <td>${u.total_orders}</td>
    <td>${fmt(u.total_spent)}</td>
    <td class="admin-actions">
      <button class="btn btn--sm btn--ghost" onclick="viewUserDetail(${u.id})" title="Ver detalle"><i class="fas fa-eye"></i></button>
      ${u.role !== 'admin' ? `<button class="btn btn--sm btn--danger" onclick="deleteUser(${u.id},'${escHtml(u.name)}')" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
    </td>
  </tr>`).join('');
}

// Contraseñas visibles (muestra hash, no real – aviso de seguridad)
const pwVisible = {};
function togglePw(id) {
  const el = document.getElementById(`pw-${id}`);
  if (!el) return;
  pwVisible[id] = !pwVisible[id];
  el.textContent = pwVisible[id] ? '[hash bcrypt]' : '••••••••';
}

async function viewUserDetail(id) {
  openModal('user-detail-modal');
  const body = document.getElementById('user-detail-body');
  body.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';
  try {
    const { user } = await apiFetch(`${API.admin}?action=user_detail&id=${id}`);
    body.innerHTML = `
      <div class="user-detail-grid">
        <div class="user-detail-info"><label>Nombre</label><p>${escHtml(user.name)}</p></div>
        <div class="user-detail-info"><label>Teléfono</label><p>${escHtml(user.phone)}</p></div>
        <div class="user-detail-info"><label>Rol</label><p>${escHtml(user.role)}</p></div>
        <div class="user-detail-info"><label>Verificado</label><p>${user.is_verified?'Sí':'No'}</p></div>
        <div class="user-detail-info"><label>Registro</label><p>${fmtDate(user.created_at)}</p></div>
        <div class="user-detail-info"><label>Último acceso</label><p>${user.last_login?fmtDate(user.last_login):'—'}</p></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div class="user-detail-info"><label>Total pedidos</label><p>${user.stats?.total_orders||0}</p></div>
        <div class="user-detail-info"><label>Total gastado</label><p>${fmt(user.stats?.total_spent||0)}</p></div>
        <div class="user-detail-info"><label>Promedio</label><p>${fmt(user.stats?.avg_order||0)}</p></div>
      </div>
      <div class="user-detail-section">
        <h4>Pedidos</h4>
        ${user.orders.length ? `<table class="admin-table" style="min-width:unset"><thead><tr><th>#</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>${user.orders.map(o=>`<tr><td>#${o.id}</td><td>${fmtDate(o.created_at)}</td><td style="font-size:.78rem">${escHtml(o.items||'')}</td><td>${fmt(o.total)}</td><td><span class="${statusClass(o.status)}">${statusLabel(o.status)}</span></td></tr>`).join('')}</tbody></table>`
        : '<p style="color:var(--text-muted);font-size:.85rem">Sin pedidos.</p>'}
      </div>
      <div class="user-detail-section">
        <h4>Actividad reciente</h4>
        ${user.activity.slice(0,15).map(a=>`
          <div style="display:flex;gap:1rem;align-items:flex-start;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.78rem">
            <span style="color:var(--text-muted);flex-shrink:0">${fmtDate(a.created_at)}</span>
            <span style="color:var(--gold);flex-shrink:0">${escHtml(a.action)}</span>
            <span style="color:var(--text-secondary)">${escHtml(a.details||'')}</span>
          </div>`).join('') || '<p style="color:var(--text-muted);font-size:.85rem">Sin actividad.</p>'}
      </div>`;
  } catch (e) { body.innerHTML = `<p class="loading-text" style="color:var(--red)">${e.message}</p>`; }
}

async function deleteUser(id, name) {
  if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
  try {
    await apiFetch(`${API.admin}?action=delete_user`, { method: 'POST', body: { id } });
    toast('Usuario eliminado.', 'success');
    loadAdminUsers();
  } catch (e) { toast(e.message, 'error'); }
}

// ── Admin: Actividad ──────────────────────────────────
async function loadAdminActivity() {
  const tbody = document.getElementById('admin-actividad-body');
  tbody.innerHTML = '<tr><td colspan="5" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
  try {
    const { activity } = await apiFetch(`${API.admin}?action=activity&limit=100`);
    if (!activity.length) { tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Sin actividad.</td></tr>'; return; }
    tbody.innerHTML = activity.map(a => `<tr>
      <td style="white-space:nowrap">${fmtDate(a.created_at)}</td>
      <td>${a.user_name ? `${escHtml(a.user_name)} <small style="color:var(--text-muted)">(${escHtml(a.user_phone||'')})</small>` : '<span style="color:var(--text-muted)">Anónimo</span>'}</td>
      <td><code style="color:var(--gold);font-size:.78rem">${escHtml(a.action)}</code></td>
      <td style="font-size:.75rem;color:var(--text-muted)">${escHtml(a.details||'')}</td>
      <td style="font-size:.75rem;color:var(--text-muted)">${escHtml(a.ip_address||'')}</td>
    </tr>`).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="5" class="admin-loading" style="color:var(--red)">${e.message}</td></tr>`; }
}

// ══════════════════════════════════════════
//  STATUS HELPERS
// ══════════════════════════════════════════

function statusClass(s) { return `status-badge status--${s}`; }
function statusLabel(s) {
  return { pendiente:'Pendiente', confirmado:'Confirmado', en_camino:'En camino',
           entregado:'Entregado', cancelado:'Cancelado' }[s] || s;
}

// ══════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // Año en footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Cargar productos y estado inicial
  loadProducts();
  updateCartBadge();
  updateAuthUI();
  initOtpInputs();
  initPasswordToggles();

  // ── Topbar scroll ─────────────────────────────────
  window.addEventListener('scroll', () => {
    document.getElementById('topbar').classList.toggle('scrolled', window.scrollY > 20);
    document.getElementById('scroll-top-btn').classList.toggle('visible', window.scrollY > 400);
  });
  document.getElementById('scroll-top-btn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── Búsqueda ──────────────────────────────────────
  ['hero-search-form', 'topbar-search-form'].forEach(id => {
    document.getElementById(id)?.addEventListener('submit', e => {
      e.preventDefault();
      const q = (document.getElementById('hero-q') || document.getElementById('topbar-q')).value.trim();
      state.filter.q = q; loadProducts();
      document.getElementById('productos-section').scrollIntoView({ behavior: 'smooth' });
    });
  });
  document.getElementById('topbar-q')?.addEventListener('input', e => {
    state.filter.q = e.target.value; loadProducts();
  });
  document.getElementById('clear-search-btn')?.addEventListener('click', () => {
    state.filter.q = ''; state.filter.category = 'todos';
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip--active', c.dataset.cat === 'todos'));
    loadProducts();
  });

  // ── Chips de categoría ────────────────────────────
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      state.filter.category = chip.dataset.cat;
      document.getElementById('filter-category').value = chip.dataset.cat;
      loadProducts();
    });
  });

  document.getElementById('filter-category')?.addEventListener('change', e => {
    state.filter.category = e.target.value;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip--active', c.dataset.cat === e.target.value));
    loadProducts();
  });
  document.getElementById('filter-sort')?.addEventListener('change', e => {
    state.filter.sort = e.target.value; renderProducts();
  });

  // ── Drawer ────────────────────────────────────────
  document.getElementById('open-menu').addEventListener('click', openDrawer);
  document.getElementById('close-menu').addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
  document.getElementById('drawer').querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', closeDrawer);
  });

  // ── Carrito ───────────────────────────────────────
  document.getElementById('open-cart').addEventListener('click', () => { renderCart(); openModal('cart-modal'); });
  document.getElementById('cart-close').addEventListener('click', () => closeModal('cart-modal'));
  document.querySelector('#cart-modal .modal__overlay').addEventListener('click', () => closeModal('cart-modal'));
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (!state.cart.length) return;
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMsg()}`, '_blank');
  });
  document.getElementById('checkout-save-btn').addEventListener('click', saveOrder);

  // ── Auth buttons ──────────────────────────────────
  ['btn-login-top', 'drawer-login-btn'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => { closeDrawer(); openModal('login-modal'); }));
  ['btn-register-top', 'drawer-register-btn'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => { closeDrawer(); openModal('register-modal'); }));
  document.getElementById('go-register').addEventListener('click', () => { closeModal('login-modal'); openModal('register-modal'); });
  document.getElementById('go-login').addEventListener('click', () => { closeModal('register-modal'); openModal('login-modal'); });

  // Cerrar modales auth
  document.getElementById('login-close').addEventListener('click', () => closeModal('login-modal'));
  document.getElementById('register-close').addEventListener('click', () => closeModal('register-modal'));
  document.querySelector('#login-modal .modal__overlay').addEventListener('click', () => closeModal('login-modal'));
  document.querySelector('#register-modal .modal__overlay').addEventListener('click', () => closeModal('register-modal'));

  // ── Login form ────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    doLogin(document.getElementById('login-phone').value.trim(), document.getElementById('login-password').value);
  });

  // ── Register form ─────────────────────────────────
  document.getElementById('register-form').addEventListener('submit', e => {
    e.preventDefault();
    doRegister(
      document.getElementById('reg-name').value.trim(),
      document.getElementById('reg-phone').value.trim(),
      document.getElementById('reg-password').value,
    );
  });

  // ── Verify OTP form ───────────────────────────────
  document.getElementById('verify-form').addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('verify-code').value;
    if (code.length !== 6) { document.getElementById('verify-error').textContent = 'Ingresa los 6 dígitos.'; return; }
    doVerifyOtp(code);
  });
  document.getElementById('back-to-register').addEventListener('click', () => {
    document.getElementById('register-step-2').style.display = 'none';
    document.getElementById('register-step-1').style.display = 'block';
    document.getElementById('step-dot-2').classList.remove('step-dot--active');
    document.getElementById('step-dot-1').classList.remove('step-dot--done');
    document.getElementById('step-dot-1').classList.add('step-dot--active');
  });
  document.getElementById('resend-code-btn').addEventListener('click', async () => {
    if (!state.otpPhone) return;
    try {
      const data = await apiFetch(`${API.auth}?action=resend_otp`, { method: 'POST', body: { phone: state.otpPhone } });
      if (data.demo_code) {
        document.getElementById('otp-demo-alert').style.display = 'flex';
        document.getElementById('otp-demo-code').textContent = data.demo_code;
      }
      startOtpTimer();
      toast('Código reenviado.', 'info');
    } catch (e) { toast(e.message, 'error'); }
  });

  // ── User menu dropdown ────────────────────────────
  document.getElementById('user-menu-btn')?.addEventListener('click', () => {
    document.getElementById('user-dropdown').classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#user-menu')) {
      document.getElementById('user-dropdown')?.classList.remove('open');
    }
  });

  // ── Logout ────────────────────────────────────────
  ['dd-logout', 'drawer-logout-btn'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', doLogout));

  // ── Mis pedidos ───────────────────────────────────
  ['dd-my-orders', 'drawer-orders-btn'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => { closeDrawer(); loadMyOrders(); }));
  document.getElementById('orders-close').addEventListener('click', () => closeModal('orders-modal'));
  document.querySelector('#orders-modal .modal__overlay').addEventListener('click', () => closeModal('orders-modal'));

  // ── Admin panel ───────────────────────────────────
  ['dd-admin', 'drawer-admin-btn'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => { closeDrawer(); openAdmin(); }));
  document.getElementById('admin-close').addEventListener('click', closeAdmin);

  // Admin nav tabs
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById(`tab-${btn.dataset.tab}`);
      tab?.classList.add('active');
      switch (btn.dataset.tab) {
        case 'dashboard': loadAdminDashboard(); break;
        case 'productos': loadAdminProducts(); break;
        case 'pedidos':   loadAdminOrders(); break;
        case 'usuarios':  loadAdminUsers(); break;
        case 'actividad': loadAdminActivity(); break;
      }
    });
  });

  // Admin productos form
  document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
    showProductForm(null);
  });
  document.getElementById('cancelar-producto').addEventListener('click', () => {
    document.getElementById('producto-form-box').style.display = 'none';
    document.getElementById('producto-form').reset();
  });
  document.getElementById('producto-form').addEventListener('submit', submitProductForm);

  // Image upload
  const uploadArea = document.getElementById('image-upload-area');
  const fileInput  = document.getElementById('p-imagen-file');
  uploadArea?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => { if (fileInput.files[0]) uploadProductImage(fileInput.files[0]); });
  uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea?.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) uploadProductImage(e.dataTransfer.files[0]);
  });

  // Admin orders filter
  document.getElementById('admin-orders-filter')?.addEventListener('change', e => loadAdminOrders(e.target.value));

  // Admin users search
  document.getElementById('admin-users-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = state.adminData.users.filter(u =>
      u.name.toLowerCase().includes(q) || u.phone.includes(q));
    renderAdminUsers(filtered);
  });

  // Refresh activity
  document.getElementById('refresh-activity')?.addEventListener('click', loadAdminActivity);

  // User detail close
  document.getElementById('user-detail-close').addEventListener('click', () => closeModal('user-detail-modal'));
  document.querySelector('#user-detail-modal .modal__overlay').addEventListener('click', () => closeModal('user-detail-modal'));

  // ── Escape key ────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllModals();
      closeDrawer();
    }
  });
});
