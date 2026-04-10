<?php
/* =====================================================
   H & L ALIMCERV — API Admin
   GET  ?action=stats
   GET  ?action=users
   GET  ?action=user_detail&id=
   POST ?action=delete_user
   POST ?action=update_user_role
   GET  ?action=activity
   ===================================================== */

require_once __DIR__ . '/../config.php';

requireAdmin();
$action = $_GET['action'] ?? '';
$body   = getBody();

switch ($action) {

  // ── Dashboard stats ───────────────────────────────
  case 'stats':
    $db = getDB();

    $totalUsers   = (int)$db->query('SELECT COUNT(*) FROM users WHERE role="user"')->fetchColumn();
    $totalOrders  = (int)$db->query('SELECT COUNT(*) FROM orders')->fetchColumn();
    $totalRevenue = (float)$db->query('SELECT COALESCE(SUM(total),0) FROM orders WHERE status != "cancelado"')->fetchColumn();
    $totalProducts= (int)$db->query('SELECT COUNT(*) FROM products WHERE is_active=1')->fetchColumn();

    $recentOrders = $db->query(
      'SELECT o.id, o.user_name, o.user_phone, o.total, o.status, o.created_at
       FROM orders o ORDER BY o.created_at DESC LIMIT 5'
    )->fetchAll();

    $salesByStatus = $db->query(
      'SELECT status, COUNT(*) as count, COALESCE(SUM(total),0) as revenue
       FROM orders GROUP BY status'
    )->fetchAll();

    $topProducts = $db->query(
      'SELECT oi.product_name, SUM(oi.quantity) as sold, SUM(oi.subtotal) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.status != "cancelado"
       GROUP BY oi.product_name
       ORDER BY sold DESC LIMIT 5'
    )->fetchAll();

    jsonResponse([
      'stats' => [
        'total_users'    => $totalUsers,
        'total_orders'   => $totalOrders,
        'total_revenue'  => $totalRevenue,
        'total_products' => $totalProducts,
      ],
      'recent_orders'  => $recentOrders,
      'sales_by_status'=> $salesByStatus,
      'top_products'   => $topProducts,
    ]);

  // ── Lista de usuarios ─────────────────────────────
  case 'users':
    $db   = getDB();
    $stmt = $db->query(
      'SELECT u.id, u.name, u.phone, u.role, u.is_verified,
              u.created_at, u.last_login,
              COUNT(DISTINCT o.id) as total_orders,
              COALESCE(SUM(o.total),0) as total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id AND o.status != "cancelado"
       GROUP BY u.id
       ORDER BY u.created_at DESC'
    );
    jsonResponse(['users' => $stmt->fetchAll()]);

  // ── Detalle de usuario ────────────────────────────
  case 'user_detail':
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $db   = getDB();
    $stmt = $db->prepare(
      'SELECT id, name, phone, role, is_verified, created_at, last_login FROM users WHERE id=? LIMIT 1'
    );
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) jsonResponse(['error' => 'Usuario no encontrado.'], 404);

    // Pedidos del usuario
    $stmt2 = $db->prepare(
      'SELECT o.*,
              GROUP_CONCAT(oi.product_name, " x", oi.quantity SEPARATOR " | ") AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id=?
       GROUP BY o.id
       ORDER BY o.created_at DESC'
    );
    $stmt2->execute([$id]);
    $user['orders'] = $stmt2->fetchAll();

    // Actividad del usuario
    $stmt3 = $db->prepare(
      'SELECT action, details, ip_address, created_at
       FROM activity_log WHERE user_id=?
       ORDER BY created_at DESC LIMIT 50'
    );
    $stmt3->execute([$id]);
    $user['activity'] = $stmt3->fetchAll();

    // Estadísticas
    $stats = $db->prepare(
      'SELECT COUNT(*) as total_orders,
              COALESCE(SUM(total),0) as total_spent,
              COALESCE(AVG(total),0) as avg_order
       FROM orders WHERE user_id=? AND status != "cancelado"'
    );
    $stats->execute([$id]);
    $user['stats'] = $stats->fetch();

    jsonResponse(['user' => $user]);

  // ── Eliminar usuario ──────────────────────────────
  case 'delete_user':
    $id = (int)($body['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'ID requerido.'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT role FROM users WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $u    = $stmt->fetch();
    if (!$u) jsonResponse(['error' => 'Usuario no encontrado.'], 404);
    if ($u['role'] === 'admin') jsonResponse(['error' => 'No puedes eliminar un admin.'], 403);

    $db->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
    logActivity(getCurrentUser()['id'], 'user_deleted', ['deleted_user_id' => $id]);
    jsonResponse(['success' => true]);

  // ── Cambiar rol ───────────────────────────────────
  case 'update_user_role':
    $id   = (int)($body['id'] ?? 0);
    $role = $body['role'] ?? '';
    if (!$id || !in_array($role, ['user', 'admin'])) {
      jsonResponse(['error' => 'Datos inválidos.'], 422);
    }

    $db = getDB();
    $db->prepare('UPDATE users SET role=? WHERE id=?')->execute([$role, $id]);
    logActivity(getCurrentUser()['id'], 'user_role_changed', ['user_id' => $id, 'new_role' => $role]);
    jsonResponse(['success' => true]);

  // ── Log de actividad ──────────────────────────────
  case 'activity':
    $db   = getDB();
    $limit= min((int)($_GET['limit'] ?? 100), 500);
    $stmt = $db->prepare(
      'SELECT al.*, u.name as user_name, u.phone as user_phone
       FROM activity_log al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT ?'
    );
    $stmt->execute([$limit]);
    jsonResponse(['activity' => $stmt->fetchAll()]);

  default:
    jsonResponse(['error' => 'Acción no válida.'], 400);
}
