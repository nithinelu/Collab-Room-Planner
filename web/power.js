/* PoE power budget and peripheral distribution for one option.
   reserve = what the power source must allocate (IEEE class: af 15.4 W, class 2 7 W, at 30 W); typ = typical draw.
   src: ds = vendor datasheet, rs = reseller listing, est = planning estimate. */
const POE_STD={af:{label:"PoE 802.3af",max:15.4},at:{label:"PoE+ 802.3at",max:30},bt:{label:"PoE++ 802.3bt",max:60}};
const PERIPH={
  "cisco-nav":{name:"Cisco Room Navigator",std:"af",reserve:15.4,typ:7,src:"est",cisco:1},
  "cisco-quad":{name:"Cisco Quad Camera",std:"at",reserve:30,typ:20,src:"est",cisco:1},
  "cisco-tmp":{name:"Cisco Table Microphone Pro",std:"af",reserve:7,typ:5,src:"ds",cisco:1},
  "cisco-cmp":{name:"Cisco Ceiling Microphone Pro",std:"af",reserve:7,typ:4.5,src:"rs",cisco:1},
  "cisco-ptz":{name:"Cisco Room Vision PTZ",std:"at",reserve:30,typ:12,src:"rs",cisco:1},
  "cisco-csp":{name:"Cisco Ceiling Speaker Pro",std:"at",reserve:30,typ:15,src:"ds",cisco:1},
  "logi-tapip":{name:"Logitech Tap IP",std:"af",reserve:15.4,typ:8,src:"est"},
  "neat-pad":{name:"Neat Pad",std:"af",reserve:15.4,typ:8,src:"est"},
  "neat-center":{name:"Neat Center",std:"at",reserve:30,typ:15,src:"est"},
  "generic-ptz":{name:"Extension PTZ camera",std:"at",reserve:30,typ:15,src:"est"},
  "shure-mxa925":{name:"Shure MXA925",std:"af",reserve:15.4,typ:9,src:"est"},
  "shure-mxn5":{name:"Shure MXN5W-C",std:"at",reserve:30,typ:12,src:"est"},
  "senn-tcc2":{name:"Sennheiser TeamConnect Ceiling 2",std:"af",reserve:15.4,typ:8,src:"est"},
  "senn-tccm":{name:"Sennheiser TeamConnect Ceiling Medium",std:"af",reserve:15.4,typ:7,src:"est"},
  "senn-tccmp":{name:"Sennheiser TeamConnect Ceiling M Plus",std:"af",reserve:15.4,typ:7,src:"est"},
};
/* PoE ports on the endpoint (Cisco datasheets unless noted). only:"nav" = port reserved for the Room Navigator. */
const bt=n=>Array.from({length:n},(_,i)=>({id:`p${i+1}`,label:`PoE++ port ${i+1}`,std:"bt"}));
const POE_HOSTS={
  "cisco-eq":{name:"Codec EQ",ports:bt(4),total:90,src:"ds"},
  "cisco-eqx":{name:"Codec EQ (EQX)",ports:bt(4),total:90,src:"ds"},
  "cisco-pro":{name:"Codec Pro G2",ports:bt(8),total:120,src:"ds"},
  "cisco-barpro":{name:"Room Bar Pro",ports:[{id:"nav",label:"Navigator port",std:"af",only:"nav"},
    {id:"p1",label:"AV-over-IP port 1",std:"af"},{id:"p2",label:"AV-over-IP port 2",std:"af"}],total:46.2,src:"ds"},
  "cisco-board55":{name:"Board Pro G3",ports:[{id:"nav",label:"Navigator port",std:"af",only:"nav"}],total:15.4,src:"rs"},
  "cisco-board75":{name:"Board Pro G3",ports:[{id:"nav",label:"Navigator port",std:"af",only:"nav"}],total:15.4,src:"rs"},
  "cisco-bar":{name:"Room Bar",ports:[{id:"nav",label:"Navigator port",std:"af",only:"nav"}],total:15.4,src:"est"},
};
const SWITCH_TIERS=[[8,60],[8,120],[16,240],[24,370],[48,740]];
const powCfg=c=>Object.assign({mode:"auto",basis:"class",assign:{}},(S.power||[])[c]||{});
const fits=(port,item)=>POE_STD[port.std].max>=item.reserve&&(!port.only||port.only===item.kind);

function powerItems(d,A){
  const items=[];
  const add=(key,pid,kind,label,extra={})=>{const p=PERIPH[pid]; if(p) items.push({key,pid,kind,label:label||p.name,...p,...extra});};
  if(d.kit.some(k=>/navigator/i.test(k))) add("ctl","cisco-nav","nav");
  else if(d.kit.some(k=>/tap ip/i.test(k))) add("ctl","logi-tapip","ctl");
  else if(d.kit.some(k=>/neat pad/i.test(k))) add("ctl","neat-pad","ctl");
  if(d.codec) add("quad","cisco-quad","cam","Cisco Quad Camera (main)",{fixed:"ep"});
  const micPid=A.ad.ext?A.ad.ext.id:/cisco table microphone pro/i.test(A.ad.name)?"cisco-tmp":/cisco ceiling microphone pro/i.test(A.ad.name)?"cisco-cmp":null;
  A.mics.forEach((m,i)=>add(`mic${i}`,micPid,"mic",`${PERIPH[micPid]?.name||""} ${i+1}`));
  A.cams.filter(k=>!k.main).forEach((k,i)=>add(`cam${i}`,k.ext.id,"cam",`C${i+2} ${PERIPH[k.ext.id]?.name||k.name}`));
  if(A.au&&A.au.spk) A.au.spk.pts.forEach((p,i)=>add(`spk${i}`,A.au.spk.id,"spk",`${PERIPH[A.au.spk.id]?.name||""} S${i+1}`));
  return items;
}

function powerPlan(d,A,c){
  const cfg=powCfg(c), host=POE_HOSTS[d.id], items=powerItems(d,A), W=it=>cfg.basis==="typ"?it.typ:it.reserve;
  const ports=host?host.ports:[], used={}, at={}, warn=[];  // port id -> item key, item key -> host ref
  let epLoad=0;
  const place=(it,pid)=>{used[pid]=it.key; at[it.key]="ep:"+pid; epLoad+=W(it);};
  const free=it=>ports.find(p=>!used[p.id]&&fits(p,{...it,kind:it.kind})&&(host.total==null||epLoad+W(it)<=host.total+1e-6));
  // 1) fixed and manual choices first
  items.forEach(it=>{
    const m=cfg.mode==="manual"?cfg.assign[it.key]:null;
    if(it.fixed==="ep"){const p=free(it)||ports.find(p=>!used[p.id]); if(p) place(it,p.id); else at[it.key]="switch";}
    else if(m&&m.startsWith("ep:")){
      const pid=m.slice(3), p=ports.find(q=>q.id===pid);
      if(p&&!used[pid]) place(it,pid);
      else{at[it.key]="switch"; if(p){const other=items.find(x=>x.key===used[pid]); warn.push(`${host.name} ${p.label} is already used by ${other?other.label:"another device"}: ${it.label} moved to the PoE switch.`);}}
    }
    else if(m==="switch"||m==="inj") at[it.key]=m;
  });
  // 2) automatic: Navigator to its port, then Cisco peripherals by power (largest first) while ports and budget last
  if(cfg.mode!=="switch"){
    const todo=items.filter(it=>!at[it.key]).sort((a,b)=>(b.kind==="nav")-(a.kind==="nav")||W(b)-W(a));
    todo.forEach(it=>{
      if(cfg.mode==="manual"&&cfg.assign[it.key]) return;
      const p=it.cisco&&host?free(it):null;
      if(p) place(it,p.id); else at[it.key]="switch";
    });
  }
  items.forEach(it=>{if(!at[it.key]) at[it.key]="switch";});

  items.forEach(it=>{
    const a=at[it.key];
    if(a.startsWith("ep:")){
      const p=ports.find(q=>"ep:"+q.id===a);
      if(!fits(p,it)) warn.push(`${it.label} needs ${POE_STD[it.std].label} (${it.reserve} W) but ${host.name} ${p.label} is ${POE_STD[p.std].label}.`);
      if(!it.cisco) warn.push(`${it.label} is third-party: confirm the ${host.name} port supports it, or move it to the switch.`);
    }
  });
  if(host&&host.total!=null&&epLoad>host.total+1e-6) warn.push(`${host.name} PoE load ${epLoad.toFixed(1)} W exceeds its ${host.total} W budget.`);
  const onSw=items.filter(it=>at[it.key]==="switch"), onInj=items.filter(it=>at[it.key]==="inj");
  const swLoad=onSw.reduce((s,it)=>s+W(it),0), swPorts=onSw.length;
  const needAt=onSw.some(it=>it.std!=="af");
  let rec=null;
  if(swPorts){
    const need=swLoad*1.2, tier=SWITCH_TIERS.find(([p,w])=>p>=swPorts+1&&w>=need)||[Math.ceil((swPorts+1)/8)*8,Math.ceil(need/10)*10];
    rec={ports:tier[0],budget:tier[1],std:needAt?"PoE+":"PoE",need};
  }
  const boq=[];
  if(rec) boq.push([`${rec.std} network switch, ≥${rec.ports} ports, ≥${rec.budget} W PoE budget (e.g. Cisco Catalyst 1200/1300)`,1,
    `${swPorts} PoE device(s), ${swLoad.toFixed(1)} W ${cfg.basis==="typ"?"typical":"class"} load + 20% headroom; confirm model budget`]);
  if(onInj.length) boq.push(["Cisco PoE+ Injector 30W (CS-PWR-INJ-30W)",onInj.length,onInj.map(it=>it.label).join(", ")]);
  return {cfg,host,items,at,ports,epLoad,swLoad,swPorts,rec,onInj,warn,boq,W};
}

function powerHtml(P,d,c){
  if(!P.items.length) return `<h3>PoE power budget</h3><p class="n">No PoE peripherals in this design.</p>`;
  const H=P.host, opts=it=>{
    const o=[...(H?P.ports.map(p=>[`ep:${p.id}`,`${H.name} · ${p.label}`]):[]),["switch","PoE switch"],["inj","PoE+ injector"]];
    return `<select data-pk="${it.key}" data-c="${c}" ${P.cfg.mode!=="manual"||it.fixed?"disabled":""}>${o.map(([v,t])=>`<option value="${v}"${P.at[it.key]===v?" selected":""}>${esc(t)}</option>`).join("")}</select>`;
  };
  const srcTag=s=>s==="ds"?'<span class="src ds">datasheet</span>':s==="rs"?'<span class="src">reseller</span>':'<span class="src">est.</span>';
  const budget=H?`${P.epLoad.toFixed(1)} / ${H.total} W · ${Object.values(P.at).filter(a=>a.startsWith("ep:")).length}/${P.ports.length} ports`:"no PoE ports";
  return `<h3>PoE power budget <span class="hint">peripherals ${P.items.length} · basis: ${P.cfg.basis==="typ"?"typical draw":"PoE class allocation"}</span></h3>
  <div class="row prow">
    <label class="hint">Distribution <select data-pmode="${c}">
      <option value="auto"${P.cfg.mode==="auto"?" selected":""}>Auto: endpoint ports first, rest on switch</option>
      <option value="switch"${P.cfg.mode==="switch"?" selected":""}>Everything on the PoE switch</option>
      <option value="manual"${P.cfg.mode==="manual"?" selected":""}>Manual: choose per peripheral</option></select></label>
    <label class="hint">Budget basis <select data-pbasis="${c}">
      <option value="class"${P.cfg.basis!=="typ"?" selected":""}>PoE class allocation (safe)</option>
      <option value="typ"${P.cfg.basis==="typ"?" selected":""}>Typical draw (LLDP power negotiation)</option></select></label>
  </div>
  <div class="tbl"><table><thead><tr><th>Peripheral</th><th>PoE</th><th style="text-align:right">Class W</th><th style="text-align:right">Typ. W</th><th>Powered from</th></tr></thead><tbody>
  ${P.items.map(it=>`<tr><td>${esc(it.label)} ${srcTag(it.src)}</td><td class="n">${POE_STD[it.std].label}</td><td class="q">${it.reserve}</td><td class="q">${it.typ}</td><td>${opts(it)}</td></tr>`).join("")}
  </tbody></table></div>
  <div class="verdict">
    <span class="pill ${H&&P.epLoad>H.total?"bad":"info"}">${esc(H?H.name:d.name)}: ${budget}${H?` (${H.src==="ds"?"datasheet":H.src==="rs"?"reseller":"est."})`:""}</span>
    <span class="pill info">PoE switch: ${P.swPorts} device(s), ${P.swLoad.toFixed(1)} W${P.rec?` → ≥${P.rec.ports}-port ${P.rec.std}, ≥${P.rec.budget} W`:""}</span>
    ${P.onInj.length?`<span class="pill info">${P.onInj.length} PoE+ injector(s)</span>`:""}
  </div>
  ${P.warn.length?`<ul class="notes">${P.warn.map(w=>`<li class="bad">${esc(w)}</li>`).join("")}</ul>`:""}`;
}
