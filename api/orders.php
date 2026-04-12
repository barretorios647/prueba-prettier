<?php
/* =====================================================
   H & L ALIMCERV — API Orders
   POST ?action=create
   GET  ?action=my_orders
   GET  ?action=admin_list   (admin)
   POST ?action=update_status (admin)
   ===================================================== */

require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';
$body   = getBody();

switch ($action) {

  // ── Crear pedido ──────────────────────────────────
  case 'create':
    $user  = getCurrentUser();
    $items = $body['items'] ?? [];
    $notes = trim($body['notes'] ?? '');

    if (empty($items)) jsonResponse(['error' => 'El carrito está vacío.'], 422);

    $db    = getDB();
    $total = 0;
    $orderItems = [];

    foreach ($items as $item) {
      $productId = (int)($item['id'] ?? 0);
      $qty       = max(1, (int)($item['quantity'] ?? 1));

      if (!$productId) continue;

      $stmt = $db->prepare('SELECT id, name, price, is_active FROM products WHERE id=? LIMIT 1');
      $stmt->execute([$productId]);
      $product = $stmt->fetch();
      if (!$product || !$product['is_active']) continue;

      $subtotal     = round($product['price'] * $qty, 2);
      $total       += $subtotal;
      $orderItems[] = [
        'product_id'   => $product['id'],
        'product_name' => $product['name'],
        'quantity'     => $qty,
        'unit_price'   => $product['price'],
        'subtotal'     => $subtotal,
      ];
    }

    if (empty($orderItems)) jsonResponse(['error' => 'No hay productos válidos.'], 422);

    // Insertar pedido
    $stmt = $db->prepare(
      'INSERT INTO orders (user_id, user_name, user_phone, total, notes)
       VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
      $user['id']    ?? null,
      $user['name']  ?? ($body['guest_name']  ?? 'Invitado'),
      $user['phone'] ?? ($body['guest_phone'] ?? ''),
      $total,
      $notes ?: null,
    ]);
    $orderId = (int)$db->lastInsertId();

    // Insertar ítems
    $ins = $db->prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)'
    );
    foreach ($orderItems as $oi) {
      $ins->execute([$orderId, $oi['product_id'], $oi['product_name'], $oi['quantity'], $oi['unit_price'], $oi['subtotal']]);
    }

    logActivity($user['id'] ?? null, 'order_created', ['order_id' => $orderId, 'total' => $total]);
    jsonResponse(['success' => true, 'order_id' => $orderId, 'total' => $total]);

  // ── Mis pedidos ───────────────────────────────────
  case 'my_orders':
    $user = requireAuth();
    $db   = getDB();

    $stmt = $db->prepare(
      'SELECT o.*, GROUP_CONCAT(oi.product_name, " x", oi.quantity SEPARATOR ", ") AS items_summary
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id=?
       GROUP BY o.id
       ORDER BY o.created_at DESC'
    );
    $stmt->execute([$user['id']]);
    jsonResponse(['orders' => $stmt->fetchAll()]);

  // ── Lista admin ───────────────────────────────────
  case 'admin_list':
    requireAdmin();
    $db   = getDB();
    $stmt = $db->query(
      'SELECT o.*, u.name AS user_full_name,
              GROUP_CONCAT(oi.product_name, " x", oi.quantity SEPARATOR " | ") AS items_summary
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC'
    );
    jsonResponse(['orders' => $stmt->fetchAll()]);

  // ── Detalle de pedido ─────────────────────────────
  case 'detail':
    $admin = getCurrentUser();
    $id    = (int)($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM orders WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) jsonResponse(['error' => 'Pedido no encontrado.'], 404);

    // Solo admin o dueño del pedido
    if (!$admin || ($admin['role'] !== 'admin' && $order['user_id'] != $admin['id'])) {
      jsonResponse(['error' => 'Acceso denegado.'], 403);
    }

    $stmt2 = $db->prepare('SELECT * FROM order_items WHERE order_id=?');
    $stmt2->execute([$id]);
    $order['items'] = $stmt2->fetchAll();
    jsonResponse(['order' => $order]);

  // ── Actualizar estado (admin) ─────────────────────
  case 'update_status':
    requireAdmin();
    $id     = (int)($body['id'] ?? 0);
    $status = $body['status'] ?? '';
    $valid  = ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'];
    if (!$id || !in_array($status, $valid)) {
      jsonResponse(['error' => 'Datos inválidos.'], 422);
    }

    $db = getDB();
    $db->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status, $id]);
    logActivity(getCurrentUser()['id'], 'order_status_changed', ['order_id' => $id, 'status' => $status]);
    jsonResponse(['success' => true]);

  default:
    jsonResponse(['error' => 'Acción no válida.'], 400);
}
