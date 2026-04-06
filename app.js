/* =====================================================
   H & L ALIMCERV — App principal
   ===================================================== */

const WHATSAPP_NUMBER = '529621643422';

/* ── Elementos del DOM ── */
const productsGrid     = document.getElementById('productos');
const productCards     = Array.from(document.querySelectorAll('.producto'));
const searchInput      = document.getElementById('q');
const cartModal        = document.getElementById('cart-modal');
const openCartBtn      = document.getElementById('open-cart');
const cartCloseBtn     = document.querySelector('.modal__close');
const cartOverlay      = document.querySelector('.modal__overlay');
const cartItemsEl      = document.getElementById('cart-items');
const cartCountEl      = document.getElementById('cart-count');
const cartTotalEl      = document.getElementById('cart-total');
const checkoutBtn      = document.getElementById('checkout-btn');
const yearEl           = document.getElementById('year');

/* =====================================================
   UTILIDADES
   ===================================================== */
const formatPrice = (v) => `$${Number(v).toFixed(2)}`;

const showToast = (msg, type = 'success') => {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast--${type} toast--show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('toast--show'), 3000);
};

/* =====================================================
   AÑO DINÁMICO
   ===================================================== */
function setYear() {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* =====================================================
   CARRITO — persistencia en localStorage
   ===================================================== */
let cart = JSON.parse(localStorage.getItem('hl_cart') || '[]');

function saveCart() {
  localStorage.setItem('hl_cart', JSON.stringify(cart));
}

function getProductData(card) {
  return {
    name:  card.dataset.producto || 'Producto',
    price: Number(card.dataset.precio || 0),
    img:   card.querySelector('img')?.src || '',
  };
}

function addToCart(name, price, img) {
  const existing = cart.find((i) => i.name === name);
  if (existing) {
    existing.qty += 1;
    showToast(`+1 "${name}" en el carrito`);
  } else {
    cart.push({ name, price, img, qty: 1 });
    showToast(`"${name}" agregado al carrito`);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast('Producto eliminado', 'error');
}

function changeQty(index, type) {
  const item = cart[index];
  if (!item) return;
  if (type === 'plus') {
    item.qty += 1;
  } else {
    item.qty -= 1;
    if (item.qty <= 0) { removeFromCart(index); return; }
  }
  saveCart();
  updateCartUI();
}

function clearCart() {
  if (!cart.length) return;
  if (!confirm('¿Vaciar el carrito?')) return;
  cart = [];
  saveCart();
  updateCartUI();
  showToast('Carrito vaciado', 'error');
}

function updateCartUI() {
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);
  const totalPrice = cart.reduce((a, i) => a + i.qty * i.price, 0);

  if (cartCountEl) cartCountEl.textContent = totalItems;
  if (cartTotalEl) cartTotalEl.textContent = formatPrice(totalPrice);

  if (!cartItemsEl) return;

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <p class="cart-empty">
        <i class="fas fa-shopping-basket"></i>
        Tu carrito está vacío
      </p>`;
    return;
  }

  cartItemsEl.innerHTML = `
    <div class="cart-list">
      ${cart.map((item, i) => `
        <div class="cart-item">
          <img class="cart-item__img" src="${item.img}" alt="${item.name}" />
          <div class="cart-item__info">
            <strong>${item.name}</strong>
            <small>${formatPrice(item.price)} c/u</small>
            <small class="cart-item__subtotal">Subtotal: ${formatPrice(item.qty * item.price)}</small>
          </div>
          <div class="cart-item__actions">
            <button class="qty-btn" data-index="${i}" data-type="minus">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-index="${i}" data-type="plus">+</button>
            <button class="remove-btn" data-index="${i}" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`).join('')}
    </div>
    <button class="btn btn--clear" type="button" id="clear-cart-btn">
      <i class="fas fa-trash-alt"></i> Vaciar carrito
    </button>`;

  document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);
}

/* ── Abrir / cerrar carrito ── */
const openCart  = () => { cartModal?.classList.add('is-open');    cartModal?.setAttribute('aria-hidden','false'); };
const closeCart = () => { cartModal?.classList.remove('is-open'); cartModal?.setAttribute('aria-hidden','true'); };

function setupCartEvents() {
  openCartBtn?.addEventListener('click', openCart);
  cartCloseBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  checkoutBtn?.addEventListener('click', sendCartToWhatsApp);

  cartItemsEl?.addEventListener('click', (e) => {
    const btn   = e.target.closest('button');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (btn.classList.contains('remove-btn')) { removeFromCart(index); return; }
    if (btn.classList.contains('qty-btn'))    { changeQty(index, btn.dataset.type); }
  });
}

/* =====================================================
   WHATSAPP — mensaje con pedido completo
   ===================================================== */
function sendCartToWhatsApp() {
  if (!cart.length) { showToast('Tu carrito está vacío', 'error'); return; }

  const session = JSON.parse(localStorage.getItem('hl_session') || 'null');
  const nombre  = session ? `Cliente: ${session.name}%0A` : '';
  const total   = cart.reduce((a, i) => a + i.qty * i.price, 0);
  const lines   = cart.map((i) => `• ${i.name} x${i.qty} = ${formatPrice(i.qty * i.price)}`);

  const msg = [
    'Hola, H & L ALIMCERV 👋',
    nombre ? decodeURIComponent(nombre.slice(0,-3)) : '',
    'Quiero realizar este pedido:',
    '',
    ...lines,
    '',
    `*Total: ${formatPrice(total)}*`,
  ].filter(Boolean).join('%0A');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(decodeURIComponent(msg))}`, '_blank');
}

function directBuy(name, price) {
  const msg = `Hola, quiero comprar:%0A• ${name} — ${formatPrice(price)}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

/* =====================================================
   PRODUCTOS — acciones + modal de detalle
   ===================================================== */
function setupProductActions() {
  if (!productsGrid) return;

  productsGrid.addEventListener('click', (e) => {
    const btn  = e.target.closest('button');
    const card = e.target.closest('.producto');
    if (!card) return;

    const { name, price, img } = getProductData(card);

    if (btn?.dataset.action === 'agregar-carrito') {
      addToCart(name, price, img);
      openCart();
      return;
    }

    if (btn?.dataset.action === 'comprar') {
      directBuy(name, price);
      return;
    }

    /* Favoritos */
    if (btn?.classList.contains('producto__fav')) {
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      icon.classList.toggle('far');
      icon.classList.toggle('fas');
      showToast(btn.classList.contains('active') ? `"${name}" en favoritos ❤️` : `"${name}" eliminado de favoritos`);
      saveFavorites();
      return;
    }

    /* Click en imagen o título → modal de detalle */
    if (e.target.closest('img') || e.target.closest('.producto__title')) {
      openProductModal(card);
    }
  });
}

/* ── Modal de detalle de producto ── */
function openProductModal(card) {
  const { name, price } = getProductData(card);
  const img  = card.querySelector('img')?.src || '';
  const desc = card.querySelector('.producto__desc')?.textContent || '';

  let modal = document.getElementById('product-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-detail-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal__overlay" id="pd-overlay"></div>
    <div class="modal__content">
      <div class="modal__header">
        <h2 class="modal__title"><i class="fas fa-box-open"></i> Detalle del producto</h2>
        <button class="modal__close" id="pd-close" type="button"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal__body pd-body">
        <img class="pd-img" src="${img}" alt="${name}" />
        <h3 class="pd-name">${name}</h3>
        <p class="pd-desc">${desc}</p>
        <p class="pd-price">${formatPrice(price)}</p>
      </div>
      <div class="modal__footer" style="flex-direction:row; gap:10px;">
        <button class="btn btn--secondary pd-add" type="button" style="flex:1">
          <i class="fas fa-cart-plus"></i> Al carrito
        </button>
        <button class="btn btn--primary pd-buy" type="button" style="flex:1">
          <i class="fab fa-whatsapp"></i> Comprar
        </button>
      </div>
    </div>`;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  const close = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); };
  modal.querySelector('#pd-close').addEventListener('click', close);
  modal.querySelector('#pd-overlay').addEventListener('click', close);
  modal.querySelector('.pd-add').addEventListener('click', () => { addToCart(name, price, img); close(); openCart(); });
  modal.querySelector('.pd-buy').addEventListener('click', () => { directBuy(name, price); close(); });
}

/* =====================================================
   BUSCADOR — filtrado en tiempo real
   ===================================================== */
function applySearch() {
  const term = (searchInput?.value || '').trim().toLowerCase();
  let visible = 0;

  productCards.forEach((card) => {
    const name = (card.dataset.producto || '').toLowerCase();
    const desc = (card.querySelector('.producto__desc')?.textContent || '').toLowerCase();
    const cat  = (card.dataset.categoria || '').toLowerCase();
    const show = !term || name.includes(term) || desc.includes(term) || cat.includes(term);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  /* Mensaje si no hay resultados */
  let noResult = document.getElementById('no-results');
  if (!visible && term) {
    if (!noResult) {
      noResult = document.createElement('p');
      noResult.id = 'no-results';
      noResult.className = 'cart-empty';
      noResult.innerHTML = `<i class="fas fa-search"></i> Sin resultados para "<strong>${term}</strong>"`;
      productsGrid?.after(noResult);
    }
    noResult.querySelector('strong').textContent = term;
    noResult.style.display = '';
  } else if (noResult) {
    noResult.style.display = 'none';
  }
}

function setupSearch() {
  if (!searchInput) return;
  searchInput.addEventListener('input', applySearch);

  /* Buscar al hacer submit del form */
  searchInput.closest('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    applySearch();
    document.getElementById('productos-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* =====================================================
   FAVORITOS — persistencia
   ===================================================== */
function saveFavorites() {
  const favs = [];
  productCards.forEach((card) => {
    const btn = card.querySelector('.producto__fav');
    if (btn?.classList.contains('active')) favs.push(card.dataset.producto);
  });
  localStorage.setItem('hl_favs', JSON.stringify(favs));
}

function loadFavorites() {
  const favs = JSON.parse(localStorage.getItem('hl_favs') || '[]');
  productCards.forEach((card) => {
    if (favs.includes(card.dataset.producto)) {
      const btn  = card.querySelector('.producto__fav');
      const icon = btn?.querySelector('i');
      btn?.classList.add('active');
      icon?.classList.replace('far', 'fas');
    }
  });
}

/* =====================================================
   AUTENTICACIÓN — localStorage
   ===================================================== */
function setupAuthModals() {
  const loginModal    = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');

  const openModal  = (m) => { m?.classList.add('is-open');    m?.setAttribute('aria-hidden','false'); };
  const closeModal = (m) => { m?.classList.remove('is-open'); m?.setAttribute('aria-hidden','true'); };

  document.getElementById('btn-login')?.addEventListener('click',    () => openModal(loginModal));
  document.getElementById('btn-register')?.addEventListener('click', () => openModal(registerModal));
  document.getElementById('login-close')?.addEventListener('click',  () => closeModal(loginModal));
  document.getElementById('register-close')?.addEventListener('click', () => closeModal(registerModal));
  document.getElementById('login-overlay')?.addEventListener('click',    () => closeModal(loginModal));
  document.getElementById('register-overlay')?.addEventListener('click', () => closeModal(registerModal));
  document.getElementById('go-register')?.addEventListener('click', () => { closeModal(loginModal); openModal(registerModal); });
  document.getElementById('go-login')?.addEventListener('click',    () => { closeModal(registerModal); openModal(loginModal); });

  /* Registro */
  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

    const users = JSON.parse(localStorage.getItem('hl_users') || '[]');
    if (users.find((u) => u.email === email)) { showToast('Este correo ya está registrado', 'error'); return; }

    users.push({ name, email, password });
    localStorage.setItem('hl_users', JSON.stringify(users));
    showToast(`¡Bienvenido, ${name}! Cuenta creada`);
    closeModal(registerModal);
    loginSession({ name, email });
  });

  /* Inicio de sesión */
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const users    = JSON.parse(localStorage.getItem('hl_users') || '[]');
    const user     = users.find((u) => u.email === email && u.password === password);

    if (!user) { showToast('Correo o contraseña incorrectos', 'error'); return; }

    loginSession(user);
    closeModal(loginModal);
    showToast(`¡Bienvenido de vuelta, ${user.name}!`);
  });

  /* Restaurar sesión */
  const session = JSON.parse(localStorage.getItem('hl_session') || 'null');
  if (session) renderUserMenu(session);
}

function loginSession(user) {
  localStorage.setItem('hl_session', JSON.stringify(user));
  renderUserMenu(user);
}

function logout() {
  localStorage.removeItem('hl_session');
  const userMenu = document.getElementById('user-menu');
  if (userMenu) userMenu.remove();
  showToast('Sesión cerrada');
}

function renderUserMenu(user) {
  /* Ocultar botones de auth */
  document.getElementById('btn-login')?.remove();
  document.getElementById('btn-register')?.remove();

  /* Crear menú de usuario si no existe */
  if (document.getElementById('user-menu')) return;

  const nav = document.querySelector('.topbar__actions');
  const menu = document.createElement('div');
  menu.id = 'user-menu';
  menu.className = 'user-menu';
  menu.innerHTML = `
    <button class="user-menu__btn" type="button">
      <i class="fas fa-user-circle"></i>
      <span>${user.name.split(' ')[0]}</span>
      <i class="fas fa-chevron-down" style="font-size:0.7rem"></i>
    </button>
    <div class="user-menu__dropdown">
      <p class="user-menu__email">${user.email}</p>
      <button class="user-menu__item" id="logout-btn" type="button">
        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
      </button>
    </div>`;

  nav.insertBefore(menu, nav.firstChild);

  menu.querySelector('.user-menu__btn').addEventListener('click', () => {
    menu.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) menu.classList.remove('is-open');
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

/* =====================================================
   MENÚ LATERAL (DRAWER)
   ===================================================== */
function setupDrawer() {
  const drawer  = document.getElementById('drawer');
  const overlay = document.getElementById('drawer-overlay');

  const open  = () => { drawer?.classList.add('is-open');    drawer?.setAttribute('aria-hidden','false'); };
  const close = () => { drawer?.classList.remove('is-open'); drawer?.setAttribute('aria-hidden','true'); };

  document.getElementById('open-menu')?.addEventListener('click', open);
  document.getElementById('close-menu')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  drawer?.querySelectorAll('.drawer__link').forEach((link) => link.addEventListener('click', close));

  document.getElementById('drawer-login-btn')?.addEventListener('click', () => {
    close();
    setTimeout(() => document.getElementById('btn-login')?.click(), 250);
  });

  document.getElementById('drawer-register-btn')?.addEventListener('click', () => {
    close();
    setTimeout(() => document.getElementById('btn-register')?.click(), 250);
  });
}

/* =====================================================
   FILTROS
   ===================================================== */
function setupFilters() {
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter || 'todos';
      productCards.forEach((card) => {
        card.style.display = filter === 'todos' || card.dataset.categoria === filter ? '' : 'none';
      });
    });
  });
}

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  updateCartUI();
  loadFavorites();
  setupCartEvents();
  setupProductActions();
  setupSearch();
  setupDrawer();
  setupAuthModals();
  setupFilters();
  applySearch();
});
