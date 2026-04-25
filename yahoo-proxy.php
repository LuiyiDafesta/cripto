<?php
// Permisos CORS para que tu frontend en React pueda consultarlo sin bloqueos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejo de la pre-petición OPTIONS de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtenemos los parámetros de la URL
$path = isset($_GET['path']) ? $_GET['path'] : '';
$params = isset($_GET['params']) ? $_GET['params'] : '';

if (empty($path)) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el parametro 'path'"]);
    exit();
}

// Construimos la URL real de Yahoo Finance
$yahooUrl = "https://query1.finance.yahoo.com" . $path . $params;

// Inicializamos cURL para hacer la petición HTTP desde el servidor (Ferozo)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $yahooUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

// Nos hacemos pasar por un navegador Chrome normal para que Yahoo no bloquee la petición
$headers = [
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Accept: application/json"
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Ejecutamos la petición
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
