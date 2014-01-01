<?php
/*
Plugin Name: Ultra Simple Audio Player 
Description: Plays a specified audio file (whatever SoundManager2 supports) using a simple audio player that shows progress with stadard behavior for seek, pause, play. The audio player should be compatible with all major browsers and devices (Android, iPhone).
Version: 0.1 
Author: Ultrasaurus
Author URI: http://github.com/ultrasaurus/ultra-simple-audio
License: MIT  
*/

define('ULTRA_AUDIO_PLUGIN_VERSION', '0.1');

add_action('init', 'ultra_audio_init');
function ultra_audio_init()
{
	if (!is_admin()){
    wp_enqueue_style('ultra_audio',
                    plugins_url('/css/ultra-simple-audio.css', __FILE__),
                    ULTRA_AUDIO_PLUGIN_VERSION
    );
  
		wp_enqueue_script('soundmanager2',
                    plugins_url('/js/soundmanager2-nodebug-jsmin.js', __FILE__)
    );
		wp_enqueue_script('ultra_audio',
                    plugins_url('/js/ultra-simple-audio.js', __FILE__),
                    array( 'jquery', 'soundmanager2'),
                    ULTRA_AUDIO_PLUGIN_VERSION
    );

    $params = array(
      'swf_path' => plugins_url('/swf', __FILE__)
    );
    wp_localize_script( 'ultra_audio', 'UltraSimplePlayerContext', $params );

	}
}

// [ultra-audio url="http://something.mp3" title="Something Is Nice"]
function ultra_audio_shortcode_handler( $atts ) {
	extract( shortcode_atts( array(
		'url' => '',
		'title' => '',
	), $atts ) );

	//return "url = {$url}";
  $output = <<<EOS
<div class='audio' url='{$url}'
                   title='{$title}'/> 
</div>
EOS;

  return $output;
}
add_shortcode( 'ultra-audio', 'ultra_audio_shortcode_handler' );


