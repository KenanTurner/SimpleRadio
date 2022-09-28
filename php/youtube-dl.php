<?php
    function error($message,$code=500){
		http_response_code($code);
		exit($message);
	}
	$url = explode(",", $_GET["url"]);
    if(empty($url)) error("URL search parameter is required!");
	
	$result;
	$args = array_merge(["./yt-dlp_linux","-j","-f 'bestaudio'"], $url);
	passthru(join(" ",$args),$result);
	if($result != 0) error("Error: process exited with code ".$result);
?>
