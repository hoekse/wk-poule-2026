# Tv-dashboard (fase 2)

Nog niet gebouwd: fase 2 start pas als Dennis fase 1 (de scan-app) heeft getest en goedgekeurd.

Wat er al klaarstaat:

- **Ontwerp**: `../../loods-3d-preview.html` (goedgekeurd). Vervang alleen de voorbeelddata door live data.
- **Data**: de views `onderweg` en `artikel_overzicht`, de tabel `zones` (geometrie uit de preview) en Realtime op `bewegingen` en `verfrestanten`.
- **Gedeeld pakket** `@loods/shared`: huisstijlkleuren, `meterKleur()` voor de "ladder-sporten", `statusKleuren` en de loodsmaten.
- **Hardware**: zie `../../docs/RASPBERRY-PI.md`.

Plan op hoofdlijnen: Vite + TypeScript + Three.js (r128-API), `InstancedMesh`, max. 30 fps, pixelratio 1, rendering op pauze
als er niets verandert, herladen bij verbindingsverlies, eigen tv-login die alleen mag lezen.
