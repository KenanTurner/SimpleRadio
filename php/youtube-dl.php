<?php
	function error($message,$code=500){
		http_response_code($code);
		exit($message);
	}
	try{
		$track = json_decode(file_get_contents('php://input'), true);
		$url = $track["src"];
	}catch (Exception $e){
		error("Unable to decode JSON!");
	}
	if(empty($url) or filter_var($url, FILTER_VALIDATE_URL) === FALSE) error("Invalid URL!");
	
	$result;
	$args = ["python3 ../python/yt_dlp/__main__.py",$url];
	passthru(join(" ",$args),$result);
	if($result != 0) error("Error: process exited with code ".$result);
?>
