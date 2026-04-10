<?php
// Archivo de diagnóstico — ELIMINAR después de usarlo
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/config.php';

echo '<h2>Test de conexión</h2>';

try {
  $db = getDB();
  echo '<p style="color:green">✅ Conexión a base de datos OK</p>';

  $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
  echo '<p>Tablas encontradas: ' . implode(', ', $tables) . '</p>';

  if (in_array('products', $tables)) {
    $count = $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
    echo '<p style="color:green">✅ Tabla products existe — ' . $count . ' productos</p>';
  } else {
    echo '<p style="color:red">❌ Tabla products NO existe — necesitas correr setup.php</p>';
  }

  if (in_array('users', $tables)) {
    $count = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo '<p style="color:green">✅ Tabla users existe — ' . $count . ' usuarios</p>';
  } else {
    echo '<p style="color:red">❌ Tabla users NO existe</p>';
  }

} catch (Exception $e) {
  echo '<p style="color:red">❌ Error: ' . $e->getMessage() . '</p>';
}

echo '<br><a href="setup.php">Ir a setup.php</a>';
