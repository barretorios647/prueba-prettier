<?php
/* =====================================================
   H & L ALIMCERV — Setup Script
   Ejecuta este archivo UNA SOLA VEZ en el navegador.
   Después de ejecutarlo, ELIMÍNALO del servidor.
   ===================================================== */

require_once __DIR__ . '/config.php';

$db = getDB();

// ── Crear tablas ──────────────────────────────────────
$sql = file_get_contents(__DIR__ . '/database.sql');
// Ejecutar bloque a bloque
$statements = array_filter(
  array_map('trim', explode(';', $sql)),
  fn($s) => strlen($s) > 5
);

$errors = [];
foreach ($statements as $stmt) {
  try { $db->exec($stmt); } catch (PDOException $e) {
    if (!str_contains($e->getMessage(), 'already exists')) {
      $errors[] = $e->getMessage();
    }
  }
}

// ── Crear usuario administrador ───────────────────────
$adminPhone = ADMIN_PHONE;          // 51500033
$adminPass  = 'Caleb08';
$adminHash  = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);

try {
  $stmt = $db->prepare(
    'INSERT INTO users (name, phone, password_hash, role, is_verified)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE password_hash=?, role=?'
  );
  $stmt->execute(['Administrador', $adminPhone, $adminHash, 'admin', $adminHash, 'admin']);
  $adminCreated = true;
} catch (PDOException $e) {
  $adminCreated = false;
  $errors[] = 'Admin: ' . $e->getMessage();
}

// ── Crear carpeta uploads ─────────────────────────────
if (!is_dir(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, 0755, true);
}
file_put_contents(UPLOAD_DIR . '.htaccess', "Options -Indexes\n");

?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Setup — H & L ALIMCERV</title>
<style>
  body{font-family:monospace;background:#0a0a0a;color:#e0e0e0;padding:2rem;max-width:700px;margin:auto}
  h1{color:#c9a96e}
  .ok{color:#4caf50} .err{color:#f44336}
  pre{background:#1a1a1a;padding:1rem;border-radius:8px;overflow:auto}
  .warn{background:#ff980020;border:1px solid #ff9800;padding:1rem;border-radius:8px;margin-top:2rem}
</style>
</head>
<body>
<h1>⚙ H & L ALIMCERV — Setup</h1>

<?php if (empty($errors)): ?>
  <p class="ok">✅ Tablas creadas correctamente.</p>
<?php else: ?>
  <p class="err">⚠ Algunos errores (pueden ser normales si las tablas ya existen):</p>
  <pre><?= implode("\n", array_map('htmlspecialchars', $errors)) ?></pre>
<?php endif; ?>

<?php if ($adminCreated): ?>
  <p class="ok">✅ Administrador creado/actualizado:</p>
  <pre>Teléfono: <?= htmlspecialchars($adminPhone) ?>
Contraseña: <?= htmlspecialchars($adminPass) ?>
Hash: <?= htmlspecialchars($adminHash) ?></pre>
<?php else: ?>
  <p class="err">❌ Error creando admin.</p>
<?php endif; ?>

<div class="warn">
  <strong>⚠ IMPORTANTE:</strong><br>
  Elimina este archivo (<code>setup.php</code>) del servidor inmediatamente después de ejecutarlo.
  Dejarlo accesible es un riesgo de seguridad.
</div>
</body>
</html>
