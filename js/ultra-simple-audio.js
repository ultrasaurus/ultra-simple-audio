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

    }
    // millisecond to time string conversion
    this.ms2time = function(ms) {
      var seconds = 0;
      var total_seconds = Math.round( ms / 1000 );
      var minutes = Math.round ( total_seconds / 60 );
      if (minutes == 0) seconds = total_seconds;
      else seconds = total_seconds % minutes;
      if (seconds < 10) seconds = '0' + seconds;
      return minutes + ":" + seconds
    }
    this.updateTimeDisplay = function() {
      $(self.element).find('.now').text(this.ms2time(self.sound.position));
      $(self.element).find('.duration').text(this.ms2time(self.sound.duration));
    }
    this.setTimeMilliseconds = function(ms) {
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
      }
    }
    this.whileplaying = function() {
      var percent_done = self.sound.position / self.sound.duration * 100;
      $(self.sound.element).find('.progress').width(percent_done + '%');
      self.updateTimeDisplay();
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

  soundManager.setup({
    // where to find flash audio SWFs, as needed
    url: 'swf',
    // optional: prefer HTML5 over Flash for MP3/MP4
    preferFlash: false,
    onready: function() {
      // SM2 is ready to play audio!
      UltraSimplePlayer.setup();
    }
  });


});




