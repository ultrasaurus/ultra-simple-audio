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
    var ga_frequency = 0;
    var last_time = 0;
    var timer_start = 0;
    var incremental_milliseconds = 0;
    if (typeof(ga) != 'undefined') {
      ga_frequency = 1;
    }
    var next_time = ga_frequency; 

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
        _gaq.push(['_trackEvent', 'audio', name, param1, param2]);
      }
    }

    this.send_delta_progress = function() {
        // note: google adds all values for same event, so we report deltas
        incremental_milliseconds = Math.round(this.sound.position - timer_start);
        //console.log('analytics incremental_milliseconds ===> '+incremental_milliseconds);
        this.send_analytics_event('total_milliseconds', title, incremental_milliseconds);
        timer_start = this.sound.position;
    }

    this.analytics = function(event_name) {
      if (event_name == 'start' || event_name == 'play') {
        timer_start = this.sound.position;
      } else {
        this.send_delta_progress();
      } 
      console.log('analytics event===> '+event_name)
      this.send_analytics_event(event_name, title, this.sound.position);
    }

    this.analytics_progress = function() {
      if (ga_frequency > 0) {
        var time = next_time;          // this is in minutes
        check = time * 1000 * 60;      // now it's in milliseconds
        if (this.sound.position > check) {
          //console.log('check => '+check);
          this.send_delta_progress();     
          var current_minute = Math.floor(this.sound.position / 60000);
          var additional_time = current_minute - last_time;
          //console.log('analytics LONGEST TIME===> '+ current_minute + "    " + additional_time); 
          this.send_analytics_event('longest_time', title, additional_time);
          last_time = current_minute;
          next_time = current_minute + ga_frequency;

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
      var minutes = Math.floor ( total_seconds / 60 );
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
      if (this.sound.playState == 1) {
        // simulate a stop / start so that we can track duration of play
        this.analytics('stop');       
      }
      this.analytics('seek'); 
      this.sound.setPosition(ms);
      if (this.sound.playState == 1) this.analytics('play');       
      
    }
    this.setTimeFraction = function(fraction) {
      this.setTimeMilliseconds(fraction * self.sound.duration);
    }

    this.events = {
      onfinish: function() {
        $(self.element).removeClass('playing');
        $(self.sound.element).find('.progress').width('0%');
        self.updateTimeDisplay();
        self.analytics('finish');
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

      oldSound = this.currentSound;

      oldPlayer = UltraSimplePlayer.players[Number(oldSound.id)];
      oldPlayer.analytics('stop');
      
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




