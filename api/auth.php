<?php
/* =====================================================
   H & L ALIMCERV — API Auth
   POST ?action=register | verify_otp | login | logout | resend_otp
   GET  ?action=me
   ===================================================== */

require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$body   = getBody();

switch ($action) {

  // ── Registro ──────────────────────────────────────
  case 'register':
    $name  = trim($body['name']  ?? '');
    $phone = trim($body['phone'] ?? '');
    $pass  = trim($body['password'] ?? '');

    if (!$name || !$phone || !$pass) {
      jsonResponse(['error' => 'Todos los campos son requeridos.'], 422);
    }
    if (!preg_match('/^\d{7,15}$/', $phone)) {
      jsonResponse(['error' => 'Número de teléfono inválido (solo dígitos, 7-15).'], 422);
    }
    if (strlen($pass) < 6) {
      jsonResponse(['error' => 'La contraseña debe tener al menos 6 caracteres.'], 422);
    }

    $db = getDB();
    $existing = $db->prepare('SELECT id, is_verified FROM users WHERE phone=? LIMIT 1');
    $existing->execute([$phone]);
    $user = $existing->fetch();

    if ($user && $user['is_verified']) {
      jsonResponse(['error' => 'Este número ya está registrado.'], 409);
    }

    // Crear o actualizar usuario no verificado
    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    if ($user && !$user['is_verified']) {
      $db->prepare('UPDATE users SET name=?, password_hash=? WHERE phone=?')
         ->execute([$name, $hash, $phone]);
    } else {
      $db->prepare('INSERT INTO users (name, phone, password_hash) VALUES (?,?,?)')
         ->execute([$name, $phone, $hash]);
    }

    $code   = createOTP($phone, 'register');
    $smsRes = sendSMS($phone, "Tu código H&L ALIMCERV: $code. Válido 10 min.");
    logActivity(null, 'register_attempt', ['phone' => $phone]);

    $response = ['success' => true, 'message' => 'Código enviado.'];
    if (isset($smsRes['demo'])) {
      $response['demo_code'] = $code; // Solo en modo demo
    }
    jsonResponse($response);

  // ── Verificar OTP ─────────────────────────────────
  case 'verify_otp':
    $phone = trim($body['phone'] ?? '');
    $code  = trim($body['code']  ?? '');

    if (!$phone || !$code) {
      jsonResponse(['error' => 'Teléfono y código son requeridos.'], 422);
    }

    if (!verifyOTP($phone, $code, 'register')) {
      jsonResponse(['error' => 'Código inválido o expirado.'], 400);
    }

    $db   = getDB();
    $stmt = $db->prepare('UPDATE users SET is_verified=1 WHERE phone=?');
    $stmt->execute([$phone]);

    $user = $db->prepare('SELECT id, name, phone, role FROM users WHERE phone=? LIMIT 1');
    $user->execute([$phone]);
    $userData = $user->fetch();

    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = $userData['id'];
    $_SESSION['user_name']  = $userData['name'];
    $_SESSION['user_phone'] = $userData['phone'];
    $_SESSION['user_role']  = $userData['role'];

    $db->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$userData['id']]);
    logActivity($userData['id'], 'verify_otp_success', ['phone' => $phone]);

    jsonResponse([
      'success' => true,
      'user'    => [
        'id'    => $userData['id'],
        'name'  => $userData['name'],
        'phone' => $userData['phone'],
        'role'  => $userData['role'],
      ],
    ]);

  // ── Login ─────────────────────────────────────────
  case 'login':
    $phone = trim($body['phone'] ?? '');
    $pass  = trim($body['password'] ?? '');

    if (!$phone || !$pass) {
      jsonResponse(['error' => 'Teléfono y contraseña requeridos.'], 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE phone=? LIMIT 1');
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
      logActivity(null, 'login_failed', ['phone' => $phone]);
      jsonResponse(['error' => 'Teléfono o contraseña incorrectos.'], 401);
    }
    if (!$user['is_verified']) {
      jsonResponse(['error' => 'Cuenta no verificada. Regístrate para obtener el código.'], 403);
    }

    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_name']  = $user['name'];
    $_SESSION['user_phone'] = $user['phone'];
    $_SESSION['user_role']  = $user['role'];

    $db->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$user['id']]);
    logActivity($user['id'], 'login_success', ['phone' => $phone]);

    jsonResponse([
      'success' => true,
      'user'    => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'phone' => $user['phone'],
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
    if (!$user) jsonResponse(['user' => null]);
    jsonResponse(['user' => $user]);

  // ── Reenviar OTP ──────────────────────────────────
  case 'resend_otp':
    $phone = trim($body['phone'] ?? '');
    if (!$phone) jsonResponse(['error' => 'Teléfono requerido.'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT id FROM users WHERE phone=? AND is_verified=0 LIMIT 1');
    $stmt->execute([$phone]);
    if (!$stmt->fetch()) {
      jsonResponse(['error' => 'Teléfono no encontrado o ya verificado.'], 404);
    }

    $code   = createOTP($phone, 'register');
    $smsRes = sendSMS($phone, "Tu código H&L ALIMCERV: $code. Válido 10 min.");
    logActivity(null, 'resend_otp', ['phone' => $phone]);

    $response = ['success' => true, 'message' => 'Código reenviado.'];
    if (isset($smsRes['demo'])) $response['demo_code'] = $code;
    jsonResponse($response);

  default:
    jsonResponse(['error' => 'Acción no válida.'], 400);
}
