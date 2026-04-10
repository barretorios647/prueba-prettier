<?php
/* =====================================================
   H & L ALIMCERV — API Upload (admin only)
   POST multipart/form-data con campo "image"
   ===================================================== */

require_once __DIR__ . '/../config.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(['error' => 'Método no permitido.'], 405);
}

$file = $_FILES['image'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
  jsonResponse(['error' => 'No se recibió ningún archivo o hubo un error al subir.'], 422);
}

// Validar tamaño
if ($file['size'] > MAX_FILE_SIZE) {
  jsonResponse(['error' => 'El archivo supera el tamaño máximo (5 MB).'], 422);
}

// Validar tipo MIME real
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (!in_array($mimeType, $allowed)) {
  jsonResponse(['error' => 'Solo se permiten imágenes JPEG, PNG, WEBP o GIF.'], 422);
}

// Generar nombre único
$ext      = match($mimeType) {
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/gif'  => 'gif',
  default      => 'jpg',
};
$filename = 'prod_' . bin2hex(random_bytes(8)) . '.' . $ext;

if (!is_dir(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, 0755, true);
}

$dest = UPLOAD_DIR . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
  jsonResponse(['error' => 'Error al guardar el archivo.'], 500);
}

logActivity(getCurrentUser()['id'], 'image_uploaded', ['filename' => $filename]);
jsonResponse([
  'success'  => true,
  'filename' => $filename,
  'url'      => 'uploads/' . $filename,
]);
