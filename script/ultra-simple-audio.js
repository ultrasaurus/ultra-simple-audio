
var player = null;

function UltraSimplePlayer(elm) {
  var self = this;
  this.element = elm;
  this.sound = null;
  var $audio = $(elm); // jQuery object for the '.audio' element

  // store this instance in the static players array
  this.index = UltraSimplePlayer.players.length;
  UltraSimplePlayer.players[this.index] = this;

  // reference the index from the .audio element data
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
  this.updateTime = function() {
    $(self.element).find('.now').text(this.ms2time(self.sound.position));
    $(self.element).find('.duration').text(this.ms2time(self.sound.duration));
  }
  
  this.events = {
    onfinish: function() {
      $(self.element).removeClass('playing'); 
      $(self.sound.element).find('.progress').width('0%');
      self.updateTime();
    }
  }
  this.whileplaying = function() {
    var percent_done = self.sound.position / self.sound.duration * 100;
    $(self.sound.element).find('.progress').width(percent_done + '%');
    self.updateTime();
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







