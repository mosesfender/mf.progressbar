<?php

$num = 100;
$fine = rand(0, 100) < 20 ? $_GET['ci'] + 1 : $_GET['ci'];
//$fine += rand(0, 2);
//$fine = $_GET['ci']+1;
if ($fine > $num)
    $fine = $num;
echo json_encode(array($num, $fine));
