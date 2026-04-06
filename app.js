/* =====================================================
   H & L ALIMCERV — App con Supabase
   ===================================================== */

const WHATSAPP_NUMBER = '529621643422';

/* ── Elementos del DOM ── */
const productsGrid   = document.getElementById('productos');
const searchInput    = document.getElementById('q');
const cartModal      = document.getElementById('cart-modal');
const openCartBtn    = document.getElementById('open-cart');
const cartCloseBtn   = document.querySelector('.modal__close');
const cartOverlay    = document.querySelector('.modal__overlay');
const cartItemsEl    = document.getElementById('cart-items');
const cartCountEl    = document.getElementById('cart-count');
const cartTotalEl    = document.getElementById('cart-total');
const checkoutBtn    = document.getElementById('checkout-btn');
const yearEl         = document.getElementById('year');

let productCards = [];
let cart = JSON.parse(localStorage.getItem('hl_cart') || '[]');
let currentUser = null;

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
  toast._t = setTimeout(() => toast.classList.remove('toast--show'), 3200);
};

function setYear() {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* =====================================================
   PRODUCTOS — carga dinámica desde Supabase
   ===================================================== */
async function loadProducts() {
  const { data, error } = await db
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    /* Usa los productos hardcodeados del HTML como fallback */
    productCards = Array.from(document.querySelectorAll('.producto'));
    setupProductActions();
    loadFavorites();
    return;
  }

  /* Renderiza productos desde Supabase */
  productsGrid.innerHTML = data.map((p) => `
    <article
      class="producto"
      data-producto="${p.nombre}"
      data-precio="${p.precio}"
      data-categoria="${p.categoria || 'general'}"
      data-id="${p.id}"
    >
      ${p.destacado ? '<div class="producto__badge">Nuevo</div>' : ''}
      <img
        src="${p.imagen_url || 'img/img/arroz.jpg'}"
        alt="${p.nombre}"
        loading="lazy"
        decoding="async"
        width="800" height="600"
      />
      <div class="producto__body">
        <div class="producto__header">
          <h3 class="producto__title">${p.nombre}</h3>
          <button class="producto__fav" type="button" aria-label="Agregar a favoritos">
            <i class="far fa-heart"></i>
          </button>
        </div>
        <p class="producto__desc">${p.descripcion || ''}</p>
        <div class="producto__footer">
          <p class="precio" aria-label="Precio">
            <span class="precio__currency">$</span>
            <span class="precio__amount">${Number(p.precio).toFixed(0)}</span>
          </p>
          <div class="producto__actions">
            <button class="btn btn--secondary" type="button" data-action="agregar-carrito" aria-label="Agregar al carrito">
              <i class="fas fa-cart-plus"></i>
            </button>
            <button class="btn btn--primary" type="button" data-action="comprar">
              <i class="fab fa-whatsapp"></i> Comprar
            </button>
          </div>
        </div>
      </div>
    </article>`).join('');

  productCards = Array.from(document.querySelectorAll('.producto'));
  setupProductActions();
  loadFavorites();
}

/* =====================================================
   CARRITO — persistencia localStorage + Supabase
   ===================================================== */
function saveCart() {
  localStorage.setItem('hl_cart', JSON.stringify(cart));
}

function getProductData(card) {
  return {
    id:    card.dataset.id || null,
    name:  card.dataset.producto || 'Producto',
    price: Number(card.dataset.precio || 0),
    img:   card.querySelector('img')?.src || '',
  };
}

function addToCart(name, price, img, id = null) {
  const existing = cart.find((i) => i.name === name);
  if (existing) {
    existing.qty += 1;
    showToast(`+1 "${name}" en el carrito`);
  } else {
    cart.push({ id, name, price, img, qty: 1 });
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

const openCart  = () => { cartModal?.classList.add('is-open');    cartModal?.setAttribute('aria-hidden','false'); };
const closeCart = () => { cartModal?.classList.remove('is-open'); cartModal?.setAttribute('aria-hidden','true'); };

function setupCartEvents() {
  openCartBtn?.addEventListener('click', openCart);
  cartCloseBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  checkoutBtn?.addEventListener('click', sendCartToWhatsApp);

  cartItemsEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (btn.classList.contains('remove-btn')) { removeFromCart(index); return; }
    if (btn.classList.contains('qty-btn'))    { changeQty(index, btn.dataset.type); }
  });
}

/* =====================================================
   WHATSAPP + GUARDAR PEDIDO EN SUPABASE
   ===================================================== */
async function sendCartToWhatsApp() {
  if (!cart.length) { showToast('Tu carrito está vacío', 'error'); return; }

  const total = cart.reduce((a, i) => a + i.qty * i.price, 0);
  const lines = cart.map((i) => `• ${i.name} x${i.qty} = ${formatPrice(i.qty * i.price)}`);

  const nombreCliente = currentUser?.user_metadata?.name
    ? `Cliente: ${currentUser.user_metadata.name}\n`
    : '';

  const msg = [
    'Hola, H & L ALIMCERV 👋',
    nombreCliente,
    'Quiero realizar este pedido:',
    '',
    ...lines,
    '',
    `*Total: ${formatPrice(total)}*`,
  ].filter(Boolean).join('\n');

  /* Guardar pedido en Supabase si está logueado */
  if (currentUser) {
    const { error } = await db.from('pedidos').insert({
      usuario_id: currentUser.id,
      items: cart,
      total,
      estado: 'pendiente',
    });
    if (!error) showToast('Pedido guardado en tu historial ✓');
  }

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function directBuy(name, price) {
  const msg = `Hola, quiero comprar:\n• ${name} — ${formatPrice(price)}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
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

    const { id, name, price, img } = getProductData(card);

    if (btn?.dataset.action === 'agregar-carrito') {
      addToCart(name, price, img, id);
      openCart();
      return;
    }

    if (btn?.dataset.action === 'comprar') {
      directBuy(name, price);
      return;
    }

    if (btn?.classList.contains('producto__fav')) {
      toggleFavorite(card, btn);
      return;
    }

    if (e.target.closest('img') || e.target.closest('.producto__title')) {
      openProductModal(card);
    }
  });
}

function openProductModal(card) {
  const { name, price } = getProductData(card);
  const img  = card.querySelector('img')?.src || '';
  const desc = card.querySelector('.producto__desc')?.textContent || '';
  const id   = card.dataset.id || null;

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
  modal.querySelector('.pd-add').addEventListener('click', () => { addToCart(name, price, img, id); close(); openCart(); });
  modal.querySelector('.pd-buy').addEventListener('click', () => { directBuy(name, price); close(); });
}

/* =====================================================
   BUSCADOR
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

  let noResult = document.getElementById('no-results');
  if (!visible && term) {
    if (!noResult) {
      noResult = document.createElement('p');
      noResult.id = 'no-results';
      noResult.className = 'cart-empty';
      productsGrid?.after(noResult);
    }
    noResult.innerHTML = `<i class="fas fa-search"></i> Sin resultados para "<strong>${term}</strong>"`;
    noResult.style.display = '';
  } else if (noResult) {
    noResult.style.display = 'none';
  }
}

function setupSearch() {
  if (!searchInput) return;
  searchInput.addEventListener('input', applySearch);
  searchInput.closest('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    applySearch();
    document.getElementById('productos-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* =====================================================
   FAVORITOS — sincronizados con Supabase
   ===================================================== */
async function toggleFavorite(card, btn) {
  const id   = card.dataset.id;
  const name = card.dataset.producto;
  const icon = btn.querySelector('i');
  const isActive = btn.classList.contains('active');

  btn.classList.toggle('active');
  icon.classList.toggle('far', isActive);
  icon.classList.toggle('fas', !isActive);

  showToast(!isActive ? `"${name}" en favoritos ❤️` : `"${name}" eliminado de favoritos`);

  if (!currentUser || !id) {
    saveFavoritesLocal();
    return;
  }

  if (!isActive) {
    await db.from('favoritos').insert({ usuario_id: currentUser.id, producto_id: id });
  } else {
    await db.from('favoritos').delete()
      .eq('usuario_id', currentUser.id)
      .eq('producto_id', id);
  }
}

function saveFavoritesLocal() {
  const favs = productCards
    .filter((c) => c.querySelector('.producto__fav')?.classList.contains('active'))
    .map((c) => c.dataset.producto);
  localStorage.setItem('hl_favs', JSON.stringify(favs));
}

async function loadFavorites() {
  if (currentUser) {
    const { data } = await db
      .from('favoritos')
      .select('producto_id')
      .eq('usuario_id', currentUser.id);

    const favIds = (data || []).map((f) => f.producto_id);

    productCards.forEach((card) => {
      if (favIds.includes(card.dataset.id)) {
        const btn  = card.querySelector('.producto__fav');
        const icon = btn?.querySelector('i');
        btn?.classList.add('active');
        icon?.classList.replace('far', 'fas');
      }
    });
  } else {
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
}

/* =====================================================
   AUTENTICACIÓN — Supabase Auth
   ===================================================== */
function setupAuthModals() {
  const loginModal    = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');

  const openModal  = (m) => { m?.classList.add('is-open');    m?.setAttribute('aria-hidden','false'); };
  const closeModal = (m) => { m?.classList.remove('is-open'); m?.setAttribute('aria-hidden','true'); };

  document.getElementById('login-close')?.addEventListener('click',    () => closeModal(loginModal));
  document.getElementById('register-close')?.addEventListener('click', () => closeModal(registerModal));
  document.getElementById('login-overlay')?.addEventListener('click',    () => closeModal(loginModal));
  document.getElementById('register-overlay')?.addEventListener('click', () => closeModal(registerModal));
  document.getElementById('go-register')?.addEventListener('click', () => { closeModal(loginModal); openModal(registerModal); });
  document.getElementById('go-login')?.addEventListener('click',    () => { closeModal(registerModal); openModal(loginModal); });

  /* ── Registro ── */
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';

    if (error) { showToast(error.message, 'error'); return; }

    showToast(`¡Bienvenido, ${name}! Revisa tu correo para confirmar tu cuenta.`);
    closeModal(registerModal);

    if (data.user) {
      currentUser = data.user;
      renderUserMenu(data.user);
    }
  });

  /* ── Inicio de sesión ── */
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';

    if (error) { showToast('Correo o contraseña incorrectos', 'error'); return; }

    currentUser = data.user;
    showToast(`¡Bienvenido de vuelta, ${data.user.user_metadata?.name || email}!`);
    closeModal(loginModal);
    renderUserMenu(data.user);
    loadFavorites();
  });

  /* ── Escuchar cambios de sesión ── */
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      renderUserMenu(session.user);
    }
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      document.getElementById('user-menu')?.remove();
    }
  });

  /* ── Restaurar sesión activa ── */
  db.auth.getUser().then(({ data }) => {
    if (data?.user) {
      currentUser = data.user;
      renderUserMenu(data.user);
    }
  });
}

async function logout() {
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('user-menu')?.remove();
  showToast('Sesión cerrada');
}

function renderUserMenu(user) {
  if (document.getElementById('user-menu')) return;

  const name  = user.user_metadata?.name || user.email;
  const nav   = document.querySelector('.topbar__actions');
  const menu  = document.createElement('div');
  menu.id     = 'user-menu';
  menu.className = 'user-menu';
  menu.innerHTML = `
    <button class="user-menu__btn" type="button">
      <i class="fas fa-user-circle"></i>
      <span>${name.split(' ')[0]}</span>
      <i class="fas fa-chevron-down" style="font-size:0.7rem"></i>
    </button>
    <div class="user-menu__dropdown">
      <p class="user-menu__email">${user.email}</p>
      <button class="user-menu__item" id="logout-btn" type="button">
        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
      </button>
    </div>`;

  nav?.insertBefore(menu, nav.firstChild);

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

  document.getElementById('drawer-login-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
    const m = document.getElementById('login-modal');
    m?.classList.add('is-open');
    m?.setAttribute('aria-hidden', 'false');
  });

  document.getElementById('drawer-register-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
    const m = document.getElementById('register-modal');
    m?.classList.add('is-open');
    m?.setAttribute('aria-hidden', 'false');
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
document.addEventListener('DOMContentLoaded', async () => {
  setYear();
  updateCartUI();
  setupCartEvents();
  setupSearch();
  setupDrawer();
  setupFilters();
  setupAuthModals();
  await loadProducts();
  applySearch();
});
