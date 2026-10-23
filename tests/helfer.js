// Mini-Testrahmen: test(name, fn), gleich, wahr, wirft; Ausgabe als ✅/❌-Zeilen
(function(){
  var liste=[];
  function Pruefung(text){ this.message=text; }
  window.test=function(name,fn){ liste.push({name:name,fn:fn}); };
  window.gleich=function(ist,soll,text){ if(ist!==soll) throw new Pruefung((text?text+": ":"")+"erwartet "+JSON.stringify(soll)+", war "+JSON.stringify(ist)); };
  window.wahr=function(bed,text){ if(!bed) throw new Pruefung(text||"Bedingung nicht erfüllt"); };
  window.wirft=function(fn,typ){ try{ fn(); }catch(f){ if(typ&&!(f instanceof typ)) throw new Pruefung("falscher Fehlertyp: "+f); return; } throw new Pruefung("kein Fehler geworfen"); };
  function zeile(text,klasse){ var d=document.createElement("div"); d.className=klasse; d.textContent=text; document.getElementById("ausgabe").appendChild(d); }
  window.testsStarten=function(){
    var ok=0,fehl=0,i=0;
    function weiter(){
      if(i>=liste.length){ zeile("Fertig: "+ok+" ok, "+fehl+" fehlgeschlagen","ende"); document.title=fehl?"❌ Tests":"✅ Tests"; return; }
      var t=liste[i++],r;
      function gut(){ ok++; zeile("✅ "+t.name,"ok"); weiter(); }
      function schlecht(f){ fehl++; zeile("❌ "+t.name+": "+(f&&f.message||f),"fehl"); weiter(); }
      try{ r=t.fn(); }catch(f){ schlecht(f); return; }
      if(r&&typeof r.then==="function") r.then(gut,schlecht); else gut();
    }
    weiter();
  };
  window.addEventListener("error",function(e){ zeile("❌ Ladefehler: "+e.message+" ("+(e.filename||"").split("/").pop()+":"+e.lineno+")","fehl"); });
})();
