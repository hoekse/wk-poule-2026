/* Diepblauw — opstarten */
(function (DG) {
  'use strict';
  window.addEventListener('error', function (e) {
    if (window.console) console.error('Diepblauw fout:', e.message);
  });
  DG.Save.load();
  DG.Audio.on = DG.Save.data.settings.sound;
  DG.Audio.musicOn = DG.Save.data.settings.music;
  DG.Dive.init(document.getElementById('sea'));
  DG.UI.init();
  DG.UI.go('title');
})(window.DG);
