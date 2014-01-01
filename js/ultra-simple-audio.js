jQuery(document).ready(function ($) {
// allow for jQuery in "no conflict" mode, but inside this block I can use $ shortcut
// This prevent compatibility problems with other javascript libraries
// required for WordPress plugin, seems like a good idea in general

  var player = null;

  function UltraSimplePlayer(elm) {
    var self = this;
    this.element = elm;
    this.sound = null;
    var $audio = $(elm); // jQuery object for the '.audio' element

    // we need a static players array, so we can stop/update other players
    // when we interact with another player on the page, just as pause/play
    this.index = UltraSimplePlayer.players.length;
    UltraSimplePlayer.players[this.index] = this;

    // Keep track of this player's index for easy reference from interactive events
    $audio.data('audio_index', this.index);

    $audio.append( UltraSimplePlayer.innerTemplate );

    var url = $audio.attr('url');
    var title = $audio.attr('title');
    var ga = $audio.attr('ga');
    var ga_increment = 0;
    if (typeof(ga) == 'undefined') {
      ga = [];
    } else {
      ga = ga.split(",");
      console.log("====> ga=" + ga.join(','));
      ga_increment = ga[ga.length-1];  // repeat progress by last time
    }

    $audio.find('p').text(title);

    $audio.find('.play-pause').click(function(e) {
      var oldSound = UltraSimplePlayer.stop();

      // if this sound was the the one that was stopped, we're done
      // otherwise, we need to play this sound
      if ((self.sound == null) || (oldSound != self.sound)) {
        self.play();
      }
    });

    // click anywhere on the meter to set the time of the sound to that point
    $audio.find('.meter').click(function(e) {
      console.log($audio);
      var offset = e.offsetX,
          width = $(this).width();
      self.setTimeFraction(offset/width);
    });

    //----------------------- methods ---------------------
    this.send_analytics_event = function(name, param1, param2) {
      if (typeof(_gaq) == 'undefined') {
        console.log("looks like you don't have google analytics set up on this page")
      } else {
        _gaq.push(['_trackEvent', 'ultra-audio', name, param1, param2]);
      }
    }
    this.analytics = function(event_name) {
      console.log('analytics event===> '+event_name)
      this.send_analytics_event(event_name, title, this.sound.position);
    }
    this.analytics_progress = function() {
      var time = Number(ga[0]);          // this is in minutes
      check = time * 1000 * 60;  // now it's in milliseconds

      if (this.sound.position > check) {
        console.log('analytics TIME===> '+ time + "    " + title); 
        this.send_analytics_event('time', title, time);
        ga.shift();
        //console.log('ga='+ga.join(','));
        
        if (ga.length == 0) {
          ga[0] = check + ga_increment; 
        }
      }
    }

    // create sound object
    this.createSound = function() {
      if (self.sound == null) {
        self.sound = soundManager.createSound({url: url,
              id: String(self.index),
              onfinish: self.events.onfinish,
              whileplaying: self.whileplaying});
        self.sound.element = self.element;
      }
    }
    this.play = function() {
      if (self.sound == null) {
        // create the sound when we play it the first time
        self.createSound();
      }
      UltraSimplePlayer.currentSound = self.sound;
      self.sound.play();
      $(self.element).addClass('playing');
      if (this.sound.position == 0) {
        this.analytics('start');
      } else {
        this.analytics('play');
      }
    }
    // millisecond to time string conversion
    this.ms2time = function(ms) {
      var seconds = 0;
      var total_seconds = Math.round( ms / 1000 );
      var minutes = Math.round ( total_seconds / 60 );
      if (minutes == 0) seconds = total_seconds;
      else seconds = total_seconds % 60;
      if (seconds < 10) seconds = '0' + seconds;
      return minutes + ":" + seconds
    }
    this.updateTimeDisplay = function() {
      $(self.element).find('.now').text(this.ms2time(self.sound.position));
      $(self.element).find('.duration').text(this.ms2time(self.sound.duration));
    }
    this.setTimeMilliseconds = function(ms) {
      this.analytics('seek');      
      this.sound.setPosition(ms);
    }
    this.setTimeFraction = function(fraction) {
      this.setTimeMilliseconds(fraction * self.sound.duration);
    }

    this.events = {
      onfinish: function() {
        $(self.element).removeClass('playing');
        $(self.sound.element).find('.progress').width('0%');
        self.updateTimeDisplay();
        this.analytics('finish');              
      }
    }
    this.whileplaying = function() {
      var percent_done = self.sound.position / self.sound.duration * 100;
      $(self.sound.element).find('.progress').width(percent_done + '%');
      self.updateTimeDisplay();
      self.analytics_progress();                    
    }

  }


  UltraSimplePlayer.innerTemplate = [
      "<div class='audio-inner'>",
      "  <div class='play-pause'></div>",
      "  <div class='meter'>",
      "    <div class='progress'></div>",
      "  </div>",
      "  <div class='time'>",
      "     <span class='now'>--</span>",
      "      / ",
      "     <span class='duration'>--</span>",
      "  </div>",
      "</div>",
      "<p>text</p>"
    ].join("\n");

  // stop the sound that was playing
  // if a sound was stopped, return it
  UltraSimplePlayer.stop = function() {
    var oldSound = null;
    if (this.currentSound && this.currentSound.playState == 1) {
      this.currentSound.pause();
      $(this.currentSound.element).removeClass('playing');
      //$('.audio .play-pause').eq(Number(this.currentSound.id)).removeClass('playing');
      oldSound = this.currentSound;
      this.currentSound = null;
    }
    return oldSound;
  }

  UltraSimplePlayer.setup = function() {
    UltraSimplePlayer.players = [];
    UltraSimplePlayer.currentSound = null;
    $('.audio').each(function(index, elm) {
      new UltraSimplePlayer(elm);
    });
  }

  var swf_path = '';
  if (typeof(UltraSimplePlayerContext) != 'undefined') {
    swf_path = UltraSimplePlayerContext['swf_path'];
  }
  if (typeof(swf_path) == 'undefined') swf_path = 'swf';

  soundManager.setup({
    // where to find flash audio SWFs, as needed
    url: swf_path,
    // optional: prefer HTML5 over Flash for MP3/MP4
    preferFlash: false,
    onready: function() {
      // SM2 is ready to play audio!
      UltraSimplePlayer.setup();
    }
  });


});




