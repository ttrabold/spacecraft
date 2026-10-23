// Anvisierten Block finden: Voxel-Strahl nach Amanatides/Woo. Luft und Wasser zählen nicht.
SC.zielen = function(welt, start, r, reichweite){
  reichweite = reichweite || 6;
  var x = Math.floor(start[0]), y = Math.floor(start[1]), z = Math.floor(start[2]);
  var sx = r[0] > 0 ? 1 : -1, sy = r[1] > 0 ? 1 : -1, sz = r[2] > 0 ? 1 : -1;
  function t0(p, d, s){ if(d === 0) return Infinity; var g = s > 0 ? Math.floor(p) + 1 - p : p - Math.floor(p); return g / Math.abs(d); }
  var tx = t0(start[0], r[0], sx), ty = t0(start[1], r[1], sy), tz = t0(start[2], r[2], sz);
  var dx = r[0] === 0 ? Infinity : 1 / Math.abs(r[0]), dy = r[1] === 0 ? Infinity : 1 / Math.abs(r[1]), dz = r[2] === 0 ? Infinity : 1 / Math.abs(r[2]);
  var nx = 0, ny = 0, nz = 0, t = 0;
  while(t <= reichweite){
    var id = welt.holeBlock(x, y, z);
    if(id !== SC.B.LUFT && id !== SC.B.WASSER && (nx || ny || nz))
      return { x: welt.planet.wickel(x), y: y, z: welt.planet.wickel(z), nx: nx, ny: ny, nz: nz };
    if(tx < ty && tx < tz){ x += sx; t = tx; tx += dx; nx = -sx; ny = 0; nz = 0; }
    else if(ty < tz){ y += sy; t = ty; ty += dy; nx = 0; ny = -sy; nz = 0; }
    else { z += sz; t = tz; tz += dz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
};
