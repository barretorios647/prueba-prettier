<?php
/* =====================================================
   H & L ALIMCERV — API Auth
   POST ?action=supabase_sync | logout | admin_login
   GET  ?action=me
   ===================================================== */

require_once __DIR__ . '/../config.php';

$body   = getBody();
$action = $_GET['action'] ?? $_POST['action'] ?? $body['action'] ?? '';

// DEBUG TEMPORAL — eliminar después
if (isset($_GET['debug'])) {
  jsonResponse([
    'GET'    => $_GET,
    'POST'   => $_POST,
    'body'   => $body,
    'action' => $action,
    'raw'    => file_get_contents('php://input') ?: '(vacío)',
    'method' => $_SERVER['REQUEST_METHOD'],
    'ct'     => $_SERVER['CONTENT_TYPE'] ?? 'no content-type',
  ]);
}

switch ($action) {

  // ── Sync usuario de Supabase con PHP session ───────
  // Llamado después de login/registro exitoso en Supabase
  case 'supabase_sync':
    $supabaseId = trim($body['supabase_id'] ?? '');
    $email      = trim($body['email']       ?? '');
    $name       = trim($body['name']        ?? '');
    $phone      = trim($body['phone']       ?? '');

    if (!$supabaseId || !$email) {
      jsonResponse(['error' => 'Datos de Supabase inválidos.'], 422);
    }

    $db = getDB();

    // Buscar usuario por supabase_id o email
    $stmt = $db->prepare(
      'SELECT * FROM users WHERE supabase_id=? OR email=? LIMIT 1'
    );
    $stmt->execute([$supabaseId, $email]);
    $user = $stmt->fetch();

    if (!$user) {
      // Crear nuevo usuario
      $role = in_array($phone, ADMIN_PHONES) ? 'admin' : 'user';
      $db->prepare(
        'INSERT INTO users (name, phone, email, supabase_id, password_hash, role, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, 1)'
      )->execute([$name ?: 'Usuario', $phone, $email, $supabaseId,
                  password_hash(uniqid('', true), PASSWORD_BCRYPT), $role]);
      $userId = (int)$db->lastInsertId();
    } else {
      $userId = (int)$user['id'];
      $role   = $user['role'];
      // Sincronizar supabase_id y email si faltan
      $db->prepare(
        'UPDATE users SET supabase_id=?, email=?, is_verified=1, last_login=NOW() WHERE id=?'
      )->execute([$supabaseId, $email, $userId]);
      // Actualizar nombre/teléfono si vinieron vacíos
      if ($name && !$user['name']) {
        $db->prepare('UPDATE users SET name=? WHERE id=?')->execute([$name, $userId]);
      }
      if ($phone && !$user['phone']) {
        $db->prepare('UPDATE users SET phone=? WHERE id=?')->execute([$phone, $userId]);
      }
    }

    // Obtener datos actualizados
    $stmt = $db->prepare('SELECT * FROM users WHERE id=? LIMIT 1');
    $stmt->execute([$userId]);
    $userData = $stmt->fetch();

    // Crear sesión PHP
    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = $userData['id'];
    $_SESSION['user_name']  = $userData['name'];
    $_SESSION['user_phone'] = $userData['phone'];
    $_SESSION['user_role']  = $userData['role'];
    $_SESSION['user_email'] = $userData['email'];

    logActivity($userId, 'supabase_login', ['email' => $email]);

    jsonResponse([
      'success' => true,
      'user'    => [
        'id'    => $userData['id'],
        'name'  => $userData['name'],
        'phone' => $userData['phone'],
        'email' => $userData['email'],
        'role'  => $userData['role'],
      ],
    ]);

  // ── Login admin por teléfono (solo admin) ──────────
  case 'admin_login':
    $phone = trim($body['phone']    ?? '');
    $pass  = trim($body['password'] ?? '');

    if (!$phone || !$pass) {
      jsonResponse(['error' => 'Teléfono y contraseña requeridos.'], 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE phone=? AND role="admin" LIMIT 1');
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
      jsonResponse(['error' => 'Credenciales incorrectas.'], 401);
    }

    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_name']  = $user['name'];
    $_SESSION['user_phone'] = $user['phone'];
    $_SESSION['user_role']  = $user['role'];

    $db->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$user['id']]);
    logActivity($user['id'], 'admin_login', ['phone' => $phone]);

    jsonResponse([
      'success' => true,
      'user'    => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'phone' => $user['phone'],
        'email' => $user['email'] ?? '',
        'role'  => $user['role'],
      ],
    ]);

  // ── Cerrar sesión ─────────────────────────────────
  case 'logout':
    $user = getCurrentUser();
    if ($user) logActivity($user['id'], 'logout');
    startSession();
    session_destroy();
    jsonResponse(['success' => true]);

  // ── Usuario actual ────────────────────────────────
  case 'me':
    $user = getCurrentUser();
    jsonResponse(['user' => $user]);

  default:
    jsonResponse(['error' => 'Acción no válida.'], 400);
}
