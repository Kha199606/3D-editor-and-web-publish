<?php
header('Content-Type: application/json');

$con = new mysqli("127.0.0.1", "root", "", "demo");
if ($con->connect_errno) {
    echo json_encode(['error' => "Failed to connect to MySQL: (" . $con->connect_errno . ") " . $con->connect_error]);
    exit;
}
 //Your Website URL Goes Here
 $url="http://localhost/";


 //Set Blog Activation Bonus Here (It must be only Number)
 $blog_bonus ="10";
 //Set Article Activation Bonus Here (It must be only Number)
 $art_bonus="10";
 //Set Daily Login Bonus Here (It must be only Number)
 $login_bonus="10";
 //Set Currency Symbol for daily login bonus Here
 $money="$";


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
     $action = $_POST['action'] ?? '';

     if ($action === 'saveCameraView') {
         $name = $_POST['name'] ?? '';
         $position = $_POST['position'] ?? '';
         $rotation = $_POST['rotation'] ?? '';

         $stmt = $con->prepare("INSERT INTO camera_views (name, position, rotation) VALUES (?, ?, ?)");
         $stmt->bind_param("sss", $name, $position, $rotation);

         if ($stmt->execute()) {
             echo json_encode(['success' => true, 'message' => 'Camera view saved successfully']);
         } else {
              echo json_encode(['success' => false, 'message' => 'Failed to save camera view: ' . $stmt->error]);
         }

          $stmt->close();
     } else {
         echo json_encode(['error' => 'Invalid action']);
     }
 }
 elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

     if ($action === 'getCameraViews') {
         $result = $con->query("SELECT id, name, position, rotation FROM camera_views");
         $views = [];
         if ($result->num_rows > 0) {
             while ($row = $result->fetch_assoc()) {
                 $views[] = $row;
             }
         }
         echo json_encode($views);
     }else {
         echo json_encode(['error' => 'Invalid action']);
     }
 }
 $con->close();
 ?>