<?php
/* =====================================================
   H & L ALIMCERV Group — Configuración principal
   ===================================================== */

// Suprimir errores/warnings para que no rompan el JSON
error_reporting(0);
ini_set('display_errors', '0');
ob_start();

// ── Base de datos ──────────────────────────────────────
define('DB_HOST', 'sql100.infinityfree.com');
define('DB_USER', 'if0_41631284');
define('DB_PASS', '87vrryT3OlM');
define('DB_NAME', 'if0_41631284_basedatos');

// ── URL del sitio ──────────────────────────────────────
define('SITE_URL', 'https://alimcerv.infinityfreeapp.com');

// ── Administrador ──────────────────────────────────────
define('ADMIN_PHONE', '51500033');

// ── Proveedor SMS ─────────────────────────────────────
// 'demo' = muestra el código en pantalla (para pruebas)
define('SMS_PROVIDER', 'demo');
define('TWILIO_SID',   '');
define('TWILIO_TOKEN', '');
define('TWILIO_FROM',  '');

// ── Sesión ─────────────────────────────────────────────
define('SESSION_LIFETIME', 86400);   // 24 horas
define('OTP_EXPIRY',       600);     // 10 minutos

// ── Uploads ────────────────────────────────────────────
define('MAX_FILE_SIZE',  5 * 1024 * 1024);
define('UPLOAD_DIR',     __DIR__ . '/uploads/');
define('UPLOAD_URL',     SITE_URL . '/uploads/');

// ======================================================
//  FUNCIONES GLOBALES
// ======================================================

function getDB(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [
          PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES   => false,
        ]
      );
    } catch (PDOException $e) {
      jsonResponse(['error' => 'Error de conexión a la base de datos.'], 500);
    }
  }
  return $pdo;
}

function startSession(): void {
  if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
      'lifetime' => SESSION_LIFETIME,
      'path'     => '/',
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
    session_start();
  }
}

function getCurrentUser(): ?array {
  startSession();
  if (!empty($_SESSION['user_id'])) {
    return [
      'id'    => $_SESSION['user_id'],
      'name'  => $_SESSION['user_name'],
      'phone' => $_SESSION['user_phone'],
      'role'  => $_SESSION['user_role'],
    ];
  }
  return null;
}

function requireAuth(): array {
  $user = getCurrentUser();
  if (!$user) {
    jsonResponse(['error' => 'No autenticado.'], 401);
  }
  return $user;
}

function requireAdmin(): array {
  $user = requireAuth();
  if ($user['role'] !== 'admin') {
    jsonResponse(['error' => 'Acceso denegado.'], 403);
  }
  return $user;
}

function jsonResponse(array $data, int $status = 200): void {
  ob_clean();
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function getBody(): array {
  $raw = file_get_contents('php://input');
  return json_decode($raw, true) ?? [];
}

function logActivity($userId, string $action, $details = null): void {
  try {
    $db = getDB();
    $stmt = $db->prepare(
      'INSERT INTO activity_log (user_id, action, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
      $userId,
      $action,
      $details !== null ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
      $_SERVER['REMOTE_ADDR'] ?? null,
      $_SERVER['HTTP_USER_AGENT'] ?? null,
    ]);
  } catch (Exception $e) {
    // silencioso
  }
}

function createOTP(string $phone, string $purpose = 'register'): string {
  $db   = getDB();
  $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $exp  = date('Y-m-d H:i:s', time() + OTP_EXPIRY);
  $db->prepare('UPDATE otp_codes SET used=1 WHERE phone=? AND purpose=? AND used=0')
     ->execute([$phone, $purpose]);
  $db->prepare(
    'INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES (?, ?, ?, ?)'
  )->execute([$phone, $code, $purpose, $exp]);
  return $code;
}

function verifyOTP(string $phone, string $code, string $purpose = 'register'): bool {
  $db   = getDB();
  $stmt = $db->prepare(
    'SELECT id FROM otp_codes
     WHERE phone=? AND code=? AND purpose=? AND used=0 AND expires_at > NOW()
     LIMIT 1'
  );
  $stmt->execute([$phone, $code, $purpose]);
  $row = $stmt->fetch();
  if (!$row) return false;
  $db->prepare('UPDATE otp_codes SET used=1 WHERE id=?')->execute([$row['id']]);
  return true;
}

function sendSMS(string $phone, string $message): array {
  if (SMS_PROVIDER === 'twilio' && TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
    return twilioSend($phone, $message);
  }
  return ['demo' => true];
}

function twilioSend(string $to, string $body): array {
  $url  = 'https://api.twilio.com/2010-04-01/Accounts/' . TWILIO_SID . '/Messages.json';
  $data = http_build_query(['To' => "+$to", 'From' => TWILIO_FROM, 'Body' => $body]);
  $ctx  = stream_context_create([
    'http' => [
      'method'  => 'POST',
      'header'  => "Content-Type: application/x-www-form-urlencoded\r\n"
                 . 'Authorization: Basic ' . base64_encode(TWILIO_SID . ':' . TWILIO_TOKEN) . "\r\n",
      'content' => $data,
      'timeout' => 10,
    ],
  ]);
  $res = @file_get_contents($url, false, $ctx);
  return $res !== false ? ['success' => true] : ['error' => 'SMS no enviado.'];
}

// ── Headers CORS ───────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
