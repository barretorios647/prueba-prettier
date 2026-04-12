<?php
/* =====================================================
   H & L ALIMCERV — API Products
   GET  ?action=list [&category=] [&q=]
   GET  ?action=get&id=
   POST ?action=create  (admin)
   POST ?action=update  (admin)
   POST ?action=delete  (admin)
   ===================================================== */

require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';
$body   = getBody();

switch ($action) {

  // ── Listar productos públicos ──────────────────────
  case 'list':
    $db       = getDB();
    $category = $_GET['category'] ?? '';
    $q        = trim($_GET['q'] ?? '');
    $sql      = 'SELECT * FROM products WHERE is_active=1';
    $params   = [];

    if ($category && $category !== 'todos') {
      $sql    .= ' AND category=?';
      $params[] = $category;
    }
    if ($q) {
      $sql    .= ' AND (name LIKE ? OR description LIKE ?)';
      $params[] = "%$q%";
      $params[] = "%$q%";
    }
    $sql .= ' ORDER BY is_featured DESC, created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['products' => $stmt->fetchAll()]);

  // ── Obtener un producto ────────────────────────────
  case 'get':
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $stmt = getDB()->prepare('SELECT * FROM products WHERE id=? AND is_active=1 LIMIT 1');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) jsonResponse(['error' => 'Producto no encontrado.'], 404);
    jsonResponse(['product' => $product]);

  // ── Crear producto (admin) ─────────────────────────
  case 'create':
    requireAdmin();
    $data = sanitizeProductData($body);
    if (isset($data['error'])) jsonResponse($data, 422);

    $db   = getDB();
    $stmt = $db->prepare(
      'INSERT INTO products (name, description, price, old_price, category, image, badge, stock, is_featured)
       VALUES (:name, :description, :price, :old_price, :category, :image, :badge, :stock, :is_featured)'
    );
    $stmt->execute($data);
    $id = (int)$db->lastInsertId();
    logActivity(getCurrentUser()['id'], 'product_created', ['id' => $id, 'name' => $data['name']]);

    $product = $db->prepare('SELECT * FROM products WHERE id=? LIMIT 1');
    $product->execute([$id]);
    jsonResponse(['success' => true, 'product' => $product->fetch()]);

  // ── Actualizar producto (admin) ────────────────────
  case 'update':
    requireAdmin();
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $data = sanitizeProductData($body);
    if (isset($data['error'])) jsonResponse($data, 422);

    $db   = getDB();
    $stmt = $db->prepare(
      'UPDATE products
       SET name=:name, description=:description, price=:price, old_price=:old_price,
           category=:category, image=:image, badge=:badge, stock=:stock, is_featured=:is_featured
       WHERE id=:id'
    );
    $data['id'] = $id;
    $stmt->execute($data);
    logActivity(getCurrentUser()['id'], 'product_updated', ['id' => $id]);

    $product = $db->prepare('SELECT * FROM products WHERE id=? LIMIT 1');
    $product->execute([$id]);
    jsonResponse(['success' => true, 'product' => $product->fetch()]);

  // ── Eliminar producto (admin) ──────────────────────
  case 'delete':
    requireAdmin();
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $db = getDB();
    $db->prepare('UPDATE products SET is_active=0 WHERE id=?')->execute([$id]);
    logActivity(getCurrentUser()['id'], 'product_deleted', ['id' => $id]);
    jsonResponse(['success' => true]);

  // ── Toggle activo/inactivo (admin) ────────────────
  case 'toggle':
    requireAdmin();
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT is_active FROM products WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $p    = $stmt->fetch();
    if (!$p) jsonResponse(['error' => 'Producto no encontrado.'], 404);

    $new = $p['is_active'] ? 0 : 1;
    $db->prepare('UPDATE products SET is_active=? WHERE id=?')->execute([$new, $id]);
    jsonResponse(['success' => true, 'is_active' => $new]);

  default:
    jsonResponse(['error' => 'Acción no válida.'], 400);
}

// ── Helpers ───────────────────────────────────────────
function sanitizeProductData(array $d): array {
  $name = trim($d['name'] ?? '');
  if (!$name) return ['error' => 'El nombre es requerido.'];

  $price = (float)($d['price'] ?? 0);
  if ($price <= 0) return ['error' => 'El precio debe ser mayor a 0.'];

  $validCategories = ['alimentos', 'bebidas', 'aceites', 'limpieza', 'general'];
  $category = $d['category'] ?? 'general';
  if (!in_array($category, $validCategories)) $category = 'general';

  return [
    'name'        => $name,
    'description' => trim($d['description'] ?? ''),
    'price'       => $price,
    'old_price'   => !empty($d['old_price']) ? (float)$d['old_price'] : null,
    'category'    => $category,
    'image'       => trim($d['image'] ?? 'uploads/default.jpg'),
    'badge'       => trim($d['badge'] ?? '') ?: null,
    'stock'       => max(0, (int)($d['stock'] ?? 0)),
    'is_featured' => (int)!empty($d['is_featured']),
  ];
}
