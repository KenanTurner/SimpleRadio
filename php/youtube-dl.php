<?php
    function error($message,$code=500){
		http_response_code($code);
		exit($message);
	}
	$url = explode(",", $_GET["url"]);
    if(empty($url)) error("URL search parameter is required!");
    if(filter_var($url, FILTER_VALIDATE_URL) === FALSE) {
        error('Not a valid URL');
    }
	
	$result;
	$args = array_merge(["python3","./yt-dlp","-j","-f 'bestaudio'","2>/dev/null"], $url);
	passthru(join(" ",$args),$result);
	if($result != 0) error("Error: process exited with code ".$result);
?>
