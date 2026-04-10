<?php
require_once __DIR__ . '/config.php';
startSession();
$currentUser = getCurrentUser();
$isAdmin     = $currentUser && $currentUser['role'] === 'admin';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>H &amp; L ALIMCERV Group | Alimentos &amp; Bebidas</title>
  <meta name="description" content="H & L ALIMCERV Group. Alimentos, bebidas y productos esenciales de calidad. Pide por WhatsApp." />
  <meta name="theme-color" content="#0a0a0a" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="style.css" />
  <link rel="manifest" href="site.webmanifest" />

  <meta property="og:title" content="H &amp; L ALIMCERV Group" />
  <meta property="og:description" content="Alimentos, bebidas y productos esenciales. Pide por WhatsApp." />
  <meta property="og:type" content="website" />

  <!-- Estado inicial del usuario (inyectado por PHP) -->
  <script>
    window.__INITIAL_USER__ = <?= json_encode($currentUser, JSON_UNESCAPED_UNICODE) ?>;
    window.__IS_ADMIN__ = <?= json_encode($isAdmin) ?>;
  </script>
</head>
<body>

<!-- ▸ Partículas de fondo -->
<div class="bg-particles" id="bg-particles" aria-hidden="true"></div>

<!-- ▸ Skip link -->
<a class="skip-link" href="#contenido">Saltar al contenido</a>

<!-- ══════════════════════════════════════════
     TOPBAR
══════════════════════════════════════════ -->
<header class="topbar" id="topbar">
  <div class="container topbar__inner">

    <a class="brand" href="#" aria-label="Inicio H&L ALIMCERV">
      <div class="brand__logo-wrap">
        <img src="img/img/logo.png.jpeg" alt="" class="brand__img" aria-hidden="true" />
      </div>
      <div class="brand__text">
        <span class="brand__name">H &amp; L ALIMCERV</span>
        <span class="brand__tag">Group &nbsp;·&nbsp; ESTD 2026</span>
      </div>
    </a>

    <!-- Búsqueda desktop -->
    <form class="topbar__search" id="topbar-search-form" role="search" aria-label="Buscar productos">
      <div class="topbar__search-inner">
        <i class="fas fa-search"></i>
        <input id="topbar-q" name="q" type="search" placeholder="Buscar productos..." autocomplete="off" />
      </div>
    </form>

    <nav class="topbar__actions" aria-label="Acciones">
      <!-- Carrito -->
      <button class="icon-btn" id="open-cart" type="button" aria-label="Ver carrito">
        <i class="fas fa-shopping-cart"></i>
        <span class="badge" id="cart-count">0</span>
      </button>

      <!-- Usuario -->
      <div class="user-menu" id="user-menu">
        <button class="icon-btn user-menu__trigger" id="user-menu-btn" type="button" aria-label="Cuenta">
          <i class="fas fa-user-circle"></i>
          <span class="user-menu__name" id="topbar-user-name"></span>
        </button>
        <div class="user-menu__dropdown" id="user-dropdown" aria-hidden="true">
          <div class="user-menu__header" id="user-dropdown-header"></div>
          <hr class="user-menu__sep" />
          <button class="user-menu__item" id="dd-my-orders" type="button">
            <i class="fas fa-receipt"></i> Mis pedidos
          </button>
          <?php if ($isAdmin): ?>
          <button class="user-menu__item user-menu__item--admin" id="dd-admin" type="button">
            <i class="fas fa-shield-halved"></i> Panel Admin
          </button>
          <?php endif; ?>
          <button class="user-menu__item user-menu__item--danger" id="dd-logout" type="button">
            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
          </button>
        </div>
      </div>

      <!-- Guest buttons -->
      <div class="auth-btns" id="auth-btns">
        <button class="btn btn--outline-gold btn--sm" id="btn-login-top" type="button">
          <i class="fas fa-sign-in-alt"></i> <span>Ingresar</span>
        </button>
        <button class="btn btn--gold btn--sm" id="btn-register-top" type="button">
          <i class="fas fa-user-plus"></i> <span>Registro</span>
        </button>
      </div>

      <!-- Hamburguesa -->
      <button class="hamburger" id="open-menu" type="button" aria-label="Abrir menú" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </div>
</header>

<!-- ══════════════════════════════════════════
     HERO
══════════════════════════════════════════ -->
<section class="hero" role="banner">
  <div class="hero__bg"></div>
  <div class="hero__overlay"></div>

  <div class="container hero__inner">
    <div class="hero__content">
      <p class="hero__eyebrow">Tu proveedor de confianza</p>
      <h1 class="hero__title">
        Calidad Premium<br />
        <span class="hero__title--accent">en cada producto</span>
      </h1>
      <p class="hero__subtitle">Alimentos, bebidas y más. Pedidos por WhatsApp.</p>

      <form class="hero__search" id="hero-search-form" role="search" aria-label="Buscar productos">
        <div class="hero__search-wrap">
          <i class="fas fa-search"></i>
          <input id="hero-q" name="q" type="search" inputmode="search" autocomplete="off"
            placeholder="¿Qué estás buscando hoy?" />
          <button type="submit" class="btn btn--gold">Buscar</button>
        </div>
      </form>

      <div class="hero__chips">
        <button class="chip chip--active" data-cat="todos">Todos</button>
        <button class="chip" data-cat="alimentos">Alimentos</button>
        <button class="chip" data-cat="bebidas">Bebidas</button>
        <button class="chip" data-cat="aceites">Aceites</button>
        <button class="chip" data-cat="limpieza">Limpieza</button>
      </div>
    </div>

    <div class="hero__image-wrap" aria-hidden="true">
      <div class="hero__float-card hero__float-card--1">
        <i class="fas fa-shield-alt"></i>
        <span>Compra segura</span>
      </div>
      <div class="hero__float-card hero__float-card--2">
        <i class="fab fa-whatsapp"></i>
        <span>WhatsApp directo</span>
      </div>
    </div>
  </div>

  <div class="hero__wave" aria-hidden="true">
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#0f0f0f" />
    </svg>
  </div>
</section>

<!-- ══════════════════════════════════════════
     MAIN CONTENT
══════════════════════════════════════════ -->
<main id="contenido" class="main">

  <!-- Stats bar -->
  <section class="stats-bar">
    <div class="container stats-bar__inner">
      <div class="stat-item">
        <i class="fas fa-shield-alt"></i>
        <div><strong>Compra Segura</strong><span>Datos protegidos</span></div>
      </div>
      <div class="stat-item">
        <i class="fab fa-whatsapp"></i>
        <div><strong>WhatsApp</strong><span>Pedido inmediato</span></div>
      </div>
      <div class="stat-item">
        <i class="fas fa-star"></i>
        <div><strong>Calidad</strong><span>Productos seleccionados</span></div>
      </div>
      <div class="stat-item">
        <i class="fas fa-headset"></i>
        <div><strong>Soporte 24/7</strong><span>Siempre disponible</span></div>
      </div>
    </div>
  </section>

  <!-- Productos -->
  <section class="section" id="productos-section" aria-labelledby="titulo-productos">
    <div class="container">
      <div class="section__head">
        <div>
          <p class="section__eyebrow">Catálogo</p>
          <h2 class="section__title" id="titulo-productos">
            <i class="fas fa-store"></i> Nuestros Productos
          </h2>
        </div>
        <div class="section__filters" id="desktop-filters">
          <select class="filter-select" id="filter-category">
            <option value="todos">Todas las categorías</option>
            <option value="alimentos">Alimentos</option>
            <option value="bebidas">Bebidas</option>
            <option value="aceites">Aceites</option>
            <option value="limpieza">Limpieza</option>
            <option value="general">General</option>
          </select>
          <select class="filter-select" id="filter-sort">
            <option value="default">Ordenar por</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      <!-- Skeleton / Grid de productos -->
      <div class="grid" id="productos" aria-live="polite">
        <!-- Se llena dinámicamente -->
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>

      <div class="no-results" id="no-results" style="display:none;">
        <i class="fas fa-search"></i>
        <p>No se encontraron productos</p>
        <button class="btn btn--outline-gold" id="clear-search-btn">Ver todos los productos</button>
      </div>
    </div>
  </section>

  <!-- Banner CTA -->
  <section class="cta-banner">
    <div class="container cta-banner__inner">
      <div>
        <h2 class="cta-banner__title">¿Prefieres pedir por WhatsApp?</h2>
        <p class="cta-banner__sub">Escríbenos y te atendemos al instante</p>
      </div>
      <a href="https://wa.me/529621643422" target="_blank" rel="noopener"
         class="btn btn--whatsapp btn--lg">
        <i class="fab fa-whatsapp"></i>
        Chatear ahora
      </a>
    </div>
  </section>

</main>

<!-- ══════════════════════════════════════════
     FOOTER
══════════════════════════════════════════ -->
<footer class="footer" role="contentinfo" id="contacto">
  <div class="footer__ornament" aria-hidden="true">
    <span class="ornament-line"></span>
    <i class="fas fa-star"></i>
    <span class="ornament-line"></span>
  </div>

  <div class="container footer__grid">
    <div class="footer__col">
      <h3 class="footer__brand">H &amp; L ALIMCERV</h3>
      <p class="footer__sub">Group · ESTD 2026</p>
      <p class="footer__desc">Tu proveedor de confianza en productos de calidad para el hogar y negocio.</p>
      <div class="footer__social">
        <a href="#" class="social-btn" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" class="social-btn" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="https://wa.me/529621643422" target="_blank" rel="noopener" class="social-btn social-btn--wa" aria-label="WhatsApp">
          <i class="fab fa-whatsapp"></i>
        </a>
      </div>
    </div>

    <div class="footer__col">
      <h4 class="footer__heading">Contacto</h4>
      <p><i class="fas fa-phone"></i> +52 962 164 3422</p>
      <p><i class="fas fa-envelope"></i> info@hlalimcerv.com</p>
      <p><i class="fas fa-map-marker-alt"></i> Chiapas, México</p>
    </div>

    <div class="footer__col">
      <h4 class="footer__heading">Horario</h4>
      <p><i class="fas fa-clock"></i> Lunes — Domingo</p>
      <p><i class="fas fa-sun"></i> 8:00 AM – 10:00 PM</p>
      <h4 class="footer__heading" style="margin-top:1rem">Navegación</h4>
      <p><a href="#productos-section">Productos</a></p>
      <p><a href="#contacto">Contacto</a></p>
    </div>
  </div>

  <div class="footer__bottom">
    <p>© <span id="year"></span> H &amp; L ALIMCERV Group. Todos los derechos reservados.</p>
  </div>
</footer>

<!-- Botón flotante WhatsApp -->
<a href="https://wa.me/529621643422" target="_blank" rel="noopener"
   class="fab-whatsapp" aria-label="WhatsApp">
  <i class="fab fa-whatsapp"></i>
</a>

<!-- Botón scroll top -->
<button class="scroll-top" id="scroll-top-btn" aria-label="Volver arriba">
  <i class="fas fa-chevron-up"></i>
</button>

<!-- ══════════════════════════════════════════
     DRAWER (Menú lateral)
══════════════════════════════════════════ -->
<div class="drawer" id="drawer" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Menú">
  <div class="drawer__overlay" id="drawer-overlay"></div>
  <div class="drawer__panel">
    <div class="drawer__header">
      <span class="drawer__brand">H &amp; L ALIMCERV</span>
      <button class="icon-btn" id="close-menu" type="button" aria-label="Cerrar menú">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- User info (logged in) -->
    <div class="drawer__user" id="drawer-user" style="display:none;">
      <div class="drawer__avatar"><i class="fas fa-user-circle"></i></div>
      <div>
        <p class="drawer__user-name" id="drawer-user-name"></p>
        <p class="drawer__user-phone" id="drawer-user-phone"></p>
      </div>
    </div>

    <nav class="drawer__nav">
      <a class="drawer__link" href="#productos-section" id="nav-productos">
        <i class="fas fa-store"></i> Productos
      </a>
      <a class="drawer__link" href="#contacto">
        <i class="fas fa-phone"></i> Contacto
      </a>
      <a class="drawer__link" href="https://wa.me/529621643422" target="_blank" rel="noopener">
        <i class="fab fa-whatsapp"></i> WhatsApp
      </a>
      <button class="drawer__link" id="drawer-orders-btn" type="button" style="display:none;">
        <i class="fas fa-receipt"></i> Mis Pedidos
      </button>
      <button class="drawer__link drawer__link--admin" id="drawer-admin-btn" type="button" style="display:none;">
        <i class="fas fa-shield-halved"></i> Panel Admin
      </button>
    </nav>

    <div class="drawer__auth" id="drawer-auth">
      <button class="btn btn--outline-gold btn--block" id="drawer-login-btn" type="button">
        <i class="fas fa-sign-in-alt"></i> Iniciar sesión
      </button>
      <button class="btn btn--gold btn--block" id="drawer-register-btn" type="button">
        <i class="fas fa-user-plus"></i> Registrarse
      </button>
    </div>

    <div class="drawer__auth-logged" id="drawer-auth-logged" style="display:none;">
      <button class="btn btn--ghost btn--block" id="drawer-logout-btn" type="button">
        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
      </button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: CARRITO
══════════════════════════════════════════ -->
<div class="modal" id="cart-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Carrito">
  <div class="modal__overlay"></div>
  <div class="modal__content">
    <div class="modal__header">
      <h2 class="modal__title"><i class="fas fa-shopping-cart"></i> Tu Carrito</h2>
      <button class="icon-btn modal__close" id="cart-close" type="button" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal__body" id="cart-items">
      <div class="cart-empty">
        <i class="fas fa-shopping-basket"></i>
        <p>Tu carrito está vacío</p>
      </div>
    </div>
    <div class="modal__footer" id="cart-footer" style="display:none;">
      <div class="cart-total">
        <span>Total:</span>
        <span class="cart-total__amount" id="cart-total">$0</span>
      </div>
      <button class="btn btn--whatsapp btn--block" id="checkout-btn" type="button">
        <i class="fab fa-whatsapp"></i> Ordenar por WhatsApp
      </button>
      <button class="btn btn--gold btn--block" id="checkout-save-btn" type="button">
        <i class="fas fa-save"></i> Guardar pedido
      </button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: MIS PEDIDOS
══════════════════════════════════════════ -->
<div class="modal" id="orders-modal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="modal__overlay"></div>
  <div class="modal__content modal__content--wide">
    <div class="modal__header">
      <h2 class="modal__title"><i class="fas fa-receipt"></i> Mis Pedidos</h2>
      <button class="icon-btn modal__close" id="orders-close" type="button" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal__body" id="orders-list">
      <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: LOGIN
══════════════════════════════════════════ -->
<div class="modal" id="login-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Iniciar sesión">
  <div class="modal__overlay"></div>
  <div class="modal__content modal__content--auth">
    <div class="modal__header">
      <h2 class="modal__title"><i class="fas fa-user"></i> Iniciar Sesión</h2>
      <button class="icon-btn modal__close" id="login-close" type="button" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal__body">
      <form class="auth-form" id="login-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="login-phone">Número de teléfono</label>
          <div class="input-wrap">
            <i class="fas fa-phone"></i>
            <input id="login-phone" type="tel" inputmode="numeric" placeholder="Ej: 9621234567"
              autocomplete="tel" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Contraseña</label>
          <div class="input-wrap">
            <i class="fas fa-lock"></i>
            <input id="login-password" type="password" placeholder="••••••••"
              autocomplete="current-password" required />
            <button class="input-eye" type="button" aria-label="Ver contraseña">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="form-error" id="login-error" role="alert"></div>
        <button class="btn btn--gold btn--block" type="submit" id="login-submit">
          <i class="fas fa-sign-in-alt"></i> Entrar
        </button>
        <p class="auth-switch">
          ¿No tienes cuenta?
          <button type="button" class="auth-link" id="go-register">Regístrate aquí</button>
        </p>
      </form>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: REGISTRO
══════════════════════════════════════════ -->
<div class="modal" id="register-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Crear cuenta">
  <div class="modal__overlay"></div>
  <div class="modal__content modal__content--auth">
    <div class="modal__header">
      <h2 class="modal__title" id="register-modal-title">
        <i class="fas fa-user-plus"></i> Crear Cuenta
      </h2>
      <button class="icon-btn modal__close" id="register-close" type="button" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Indicador de pasos -->
    <div class="step-indicator">
      <div class="step-dot step-dot--active" id="step-dot-1">
        <span>1</span>
        <p>Datos</p>
      </div>
      <div class="step-line"></div>
      <div class="step-dot" id="step-dot-2">
        <span>2</span>
        <p>Verificar</p>
      </div>
    </div>

    <!-- Paso 1 -->
    <div class="modal__body" id="register-step-1">
      <form class="auth-form" id="register-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="reg-name">Nombre completo</label>
          <div class="input-wrap">
            <i class="fas fa-user"></i>
            <input id="reg-name" type="text" placeholder="Tu nombre completo"
              autocomplete="name" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-phone">Número de teléfono</label>
          <div class="input-wrap">
            <i class="fas fa-phone"></i>
            <input id="reg-phone" type="tel" inputmode="numeric" placeholder="Ej: 9621234567"
              autocomplete="tel" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Contraseña</label>
          <div class="input-wrap">
            <i class="fas fa-lock"></i>
            <input id="reg-password" type="password" placeholder="Mínimo 6 caracteres"
              autocomplete="new-password" required />
            <button class="input-eye" type="button" aria-label="Ver contraseña">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="form-error" id="register-error" role="alert"></div>
        <button class="btn btn--gold btn--block" type="submit" id="register-submit">
          <i class="fas fa-paper-plane"></i> Enviar código de verificación
        </button>
        <p class="auth-switch">
          ¿Ya tienes cuenta?
          <button type="button" class="auth-link" id="go-login">Inicia sesión</button>
        </p>
      </form>
    </div>

    <!-- Paso 2: Verificación OTP -->
    <div class="modal__body" id="register-step-2" style="display:none;">
      <div class="otp-box">
        <div class="otp-box__icon"><i class="fas fa-mobile-alt"></i></div>
        <h3 class="otp-box__title">Verifica tu número</h3>
        <p class="otp-box__desc">
          Enviamos un código de <strong>6 dígitos</strong> al número<br />
          <span id="verify-phone-display" class="otp-box__phone"></span>
        </p>

        <!-- Demo mode banner -->
        <div class="otp-demo-alert" id="otp-demo-alert" style="display:none;">
          <i class="fas fa-info-circle"></i>
          Modo demo — Código: <strong id="otp-demo-code"></strong>
        </div>

        <form class="auth-form" id="verify-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="verify-code">Código de 6 dígitos</label>
            <div class="otp-inputs" id="otp-inputs">
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
              <input type="text" inputmode="numeric" maxlength="1" class="otp-digit" />
            </div>
            <input type="hidden" id="verify-code" />
          </div>
          <div class="form-error" id="verify-error" role="alert"></div>
          <button class="btn btn--gold btn--block" type="submit" id="verify-submit">
            <i class="fas fa-check-circle"></i> Verificar cuenta
          </button>
        </form>

        <div class="otp-actions">
          <button type="button" class="auth-link" id="resend-code-btn">
            <i class="fas fa-redo"></i> Reenviar código
          </button>
          <span class="otp-timer" id="otp-timer">Reenviar en <span id="otp-countdown">60</span>s</span>
          <button type="button" class="auth-link" id="back-to-register">
            <i class="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     PANEL ADMINISTRACIÓN
══════════════════════════════════════════ -->
<div class="admin-overlay" id="admin-modal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="admin-panel">

    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <i class="fas fa-shield-halved"></i>
        <span>Admin Panel</span>
      </div>

      <nav class="admin-sidebar__nav">
        <button class="admin-nav-btn active" data-tab="dashboard" type="button">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </button>
        <button class="admin-nav-btn" data-tab="productos" type="button">
          <i class="fas fa-box"></i>
          <span>Productos</span>
        </button>
        <button class="admin-nav-btn" data-tab="pedidos" type="button">
          <i class="fas fa-receipt"></i>
          <span>Pedidos</span>
          <span class="admin-badge" id="admin-orders-badge"></span>
        </button>
        <button class="admin-nav-btn" data-tab="usuarios" type="button">
          <i class="fas fa-users"></i>
          <span>Usuarios</span>
        </button>
        <button class="admin-nav-btn" data-tab="actividad" type="button">
          <i class="fas fa-history"></i>
          <span>Actividad</span>
        </button>
      </nav>

      <button class="admin-sidebar__close" id="admin-close" type="button">
        <i class="fas fa-times"></i> Cerrar
      </button>
    </aside>

    <!-- Contenido -->
    <main class="admin-content">

      <!-- ── Tab: Dashboard ── -->
      <div class="admin-tab active" id="tab-dashboard">
        <div class="admin-content__header">
          <h2><i class="fas fa-chart-line"></i> Dashboard</h2>
        </div>
        <div class="admin-stats-grid" id="admin-stats-grid">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue"><i class="fas fa-users"></i></div>
            <div class="stat-card__info">
              <p class="stat-card__label">Usuarios</p>
              <p class="stat-card__value" id="stat-users">—</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--gold"><i class="fas fa-receipt"></i></div>
            <div class="stat-card__info">
              <p class="stat-card__label">Pedidos</p>
              <p class="stat-card__value" id="stat-orders">—</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-card__info">
              <p class="stat-card__label">Ingresos</p>
              <p class="stat-card__value" id="stat-revenue">—</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--purple"><i class="fas fa-box"></i></div>
            <div class="stat-card__info">
              <p class="stat-card__label">Productos</p>
              <p class="stat-card__value" id="stat-products">—</p>
            </div>
          </div>
        </div>

        <div class="admin-two-col">
          <div class="admin-card">
            <h3 class="admin-card__title"><i class="fas fa-clock"></i> Pedidos recientes</h3>
            <div id="admin-recent-orders"></div>
          </div>
          <div class="admin-card">
            <h3 class="admin-card__title"><i class="fas fa-fire"></i> Top productos</h3>
            <div id="admin-top-products"></div>
          </div>
        </div>
      </div>

      <!-- ── Tab: Productos ── -->
      <div class="admin-tab" id="tab-productos">
        <div class="admin-content__header">
          <h2><i class="fas fa-box"></i> Productos</h2>
          <button class="btn btn--gold" id="btn-nuevo-producto" type="button">
            <i class="fas fa-plus"></i> Nuevo producto
          </button>
        </div>

        <!-- Formulario producto -->
        <div class="admin-form-box" id="producto-form-box" style="display:none;">
          <h3 id="producto-form-title">Nuevo Producto</h3>
          <form id="producto-form">
            <input type="hidden" id="producto-id" />
            <div class="admin-form-grid">
              <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input id="p-nombre" type="text" placeholder="Nombre del producto" required />
              </div>
              <div class="form-group">
                <label class="form-label">Precio ($) *</label>
                <input id="p-precio" type="number" placeholder="0.00" step="0.01" min="0" required />
              </div>
              <div class="form-group">
                <label class="form-label">Precio anterior ($)</label>
                <input id="p-precio-old" type="number" placeholder="0.00 (opcional)" step="0.01" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <select id="p-categoria">
                  <option value="alimentos">Alimentos</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="aceites">Aceites</option>
                  <option value="limpieza">Limpieza</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Stock</label>
                <input id="p-stock" type="number" placeholder="0" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Badge (etiqueta)</label>
                <input id="p-badge" type="text" placeholder="Ej: Nuevo, Oferta, Popular" />
              </div>
              <div class="form-group form-group--full">
                <label class="form-label">Descripción</label>
                <textarea id="p-descripcion" rows="3" placeholder="Descripción del producto"></textarea>
              </div>
              <div class="form-group form-group--full">
                <label class="form-label">Imagen del producto</label>
                <div class="image-upload-area" id="image-upload-area">
                  <div class="image-preview" id="image-preview">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Arrastra aquí o haz clic para subir</p>
                    <small>JPEG, PNG, WEBP — máx. 5 MB</small>
                  </div>
                  <input type="file" id="p-imagen-file" accept="image/*" style="display:none;" />
                  <input type="hidden" id="p-imagen" />
                </div>
              </div>
              <div class="form-group">
                <label class="admin-check">
                  <input id="p-destacado" type="checkbox" />
                  <span>Producto destacado</span>
                </label>
              </div>
            </div>
            <div class="admin-form-actions">
              <button class="btn btn--gold" type="submit">
                <i class="fas fa-save"></i> Guardar
              </button>
              <button class="btn btn--ghost" type="button" id="cancelar-producto">
                <i class="fas fa-times"></i> Cancelar
              </button>
            </div>
          </form>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table" id="admin-productos-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="admin-productos-body">
              <tr><td colspan="7" class="admin-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Tab: Pedidos ── -->
      <div class="admin-tab" id="tab-pedidos">
        <div class="admin-content__header">
          <h2><i class="fas fa-receipt"></i> Pedidos</h2>
          <select class="filter-select" id="admin-orders-filter">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_camino">En camino</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="admin-pedidos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody id="admin-pedidos-body">
              <tr><td colspan="8" class="admin-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Tab: Usuarios ── -->
      <div class="admin-tab" id="tab-usuarios">
        <div class="admin-content__header">
          <h2><i class="fas fa-users"></i> Usuarios</h2>
          <input class="filter-input" type="search" id="admin-users-search" placeholder="Buscar usuario..." />
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table" id="admin-usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Contraseña</th>
                <th>Rol</th>
                <th>Verificado</th>
                <th>Registro</th>
                <th>Pedidos</th>
                <th>Total Gastado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="admin-usuarios-body">
              <tr><td colspan="10" class="admin-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Tab: Actividad ── -->
      <div class="admin-tab" id="tab-actividad">
        <div class="admin-content__header">
          <h2><i class="fas fa-history"></i> Registro de Actividad</h2>
          <button class="btn btn--ghost btn--sm" id="refresh-activity" type="button">
            <i class="fas fa-sync"></i> Actualizar
          </button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalles</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody id="admin-actividad-body">
              <tr><td colspan="5" class="admin-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- ══════════════════════════════════════════
     MODAL: DETALLE USUARIO (Admin)
══════════════════════════════════════════ -->
<div class="modal" id="user-detail-modal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="modal__overlay"></div>
  <div class="modal__content modal__content--wide">
    <div class="modal__header">
      <h2 class="modal__title"><i class="fas fa-user-circle"></i> Detalle de Usuario</h2>
      <button class="icon-btn modal__close" id="user-detail-close" type="button">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal__body" id="user-detail-body">
      <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════
     TOAST CONTAINER
══════════════════════════════════════════ -->
<div class="toast-container" id="toast-container" aria-live="polite" aria-atomic="false"></div>

<script src="app.js" defer></script>
</body>
</html>
