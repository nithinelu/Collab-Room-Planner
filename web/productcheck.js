/* Vendor product check: every app start, the desktop app opens each product's official page in a hidden browser
   window (catalog_check.py) and reports whether it is still listed, now shows a newer model, or is end-of-sale.
   PAGES: key -> official page, words that must appear, and an optional model token that must be in the title/URL. */
const PAGES={
  "cisco-room-bar":{v:"Cisco",name:"Room Bar",url:"https://www.webex.com/us/en/devices/room-series/cisco-room-bar.html",kw:["Room Bar"]},
  "cisco-room-bar-pro":{v:"Cisco",name:"Room Bar Pro",url:"https://www.webex.com/us/en/devices/room-series/cisco-room-bar-pro.html",kw:["Room Bar Pro"]},
  "cisco-board-pro":{v:"Cisco",name:"Board Pro G3",url:"https://www.webex.com/us/en/devices/board-series/cisco-board-pro.html",kw:["Board Pro"],model:"G3"},
  "cisco-room-kit-eq":{v:"Cisco",name:"Room Kit EQ",url:"https://www.webex.com/us/en/devices/room-series/cisco-room-kit-eq.html",kw:["Room Kit EQ"]},
  "cisco-room-kit-eqx":{v:"Cisco",name:"Room Kit EQX",url:"https://www.webex.com/us/en/devices/room-series/cisco-room-kit-eqx.html",kw:["EQX"]},
  "cisco-room-kit-pro":{v:"Cisco",name:"Room Kit Pro G2",url:"https://www.webex.com/us/en/devices/room-series/cisco-room-kit-pro.html",kw:["Room Kit Pro"],model:"G2"},
  "cisco-desk-pro":{v:"Cisco",name:"Desk Pro",url:"https://www.webex.com/us/en/devices/desk-series/cisco-desk-pro.html",kw:["Desk Pro"]},
  "cisco-ptz":{v:"Cisco",name:"Room Vision PTZ",url:"https://www.webex.com/us/en/devices/cameras/cisco-room-vision-ptz-camera.html",kw:["Room Vision PTZ"]},
  "cisco-quad":{v:"Cisco",name:"Quad Camera",url:"https://www.webex.com/us/en/devices/cameras/cisco-quad-camera.html",kw:["Quad Camera"]},
  "cisco-cmp":{v:"Cisco",name:"Ceiling Microphone Pro",url:"https://www.webex.com/us/en/devices/accessories/cisco-ceiling-microphone-pro.html",kw:["Ceiling Microphone Pro"]},
  "cisco-csp":{v:"Cisco",name:"Ceiling Speaker Pro",url:"https://www.webex.com/us/en/devices/accessories/cisco-ceiling-speaker-pro.html",kw:["Ceiling Speaker Pro"]},
  "logi-meetup2":{v:"Logitech",name:"MeetUp 2",url:"https://www.logitech.com/en-us/business/shop/p/meetup2-conferencecam.960-001691",kw:["MeetUp 2"]},
  "logi-huddle":{v:"Logitech",name:"Rally Bar Huddle",url:"https://www.logitech.com/en-us/business/shop/p/rallybarhuddle.960-001485",kw:["Rally Bar Huddle"]},
  "logi-mini":{v:"Logitech",name:"Rally Bar Mini",url:"https://www.logitech.com/en-us/business/shop/p/rallybarmini.960-001336",kw:["Rally Bar Mini"]},
  "logi-bar2":{v:"Logitech",name:"Rally Bar 2",url:"https://www.logitech.com/en-us/business/shop/p/rally-bar-2.960-001804",kw:["Rally Bar 2"]},
  "logi-bar":{v:"Logitech",name:"Rally Bar",url:"https://www.logitech.com/en-us/business/shop/p/rallybar.960-001308",kw:["Rally Bar"]},
  "logi-plus":{v:"Logitech",name:"Rally Plus",url:"https://www.logitech.com/en-us/business/shop/p/rally-ultra-hd-conferencecam",kw:["Rally Plus"]},
  "logi-sight":{v:"Logitech",name:"Sight",url:"https://www.logitech.com/en-us/business/shop/p/sight.960-001510",kw:["Sight"]},
  "maxhub-u50":{v:"MAXHUB",name:"XBar U50",url:"https://www.maxhub.com/en/xbar_u50/",kw:["U50"]},
  "maxhub-v50":{v:"MAXHUB",name:"XBar V50",url:"https://www.maxhub.com/en/xbar_v50/",kw:["V50"]},
  "maxhub-v70":{v:"MAXHUB",name:"XBar V70",url:"https://www.maxhub.com/en/xbar_v70/",kw:["V70"]},
  "maxhub-w70":{v:"MAXHUB",name:"XBar W70",url:"https://www.maxhub.com/en/xbar_w70/",kw:["W70"]},
  "huawei-es3":{v:"Huawei",name:"IdeaHub ES3",url:"https://e.huawei.com/en/products/enterprise-collaboration/ideahub/ideahub-es3",kw:["IdeaHub ES3"]},
  "huawei-es2plus":{v:"Huawei",name:"IdeaHub ES2 Plus",url:"https://e.huawei.com/en/products/enterprise-collaboration/ideahub/ideahub-es2-plus",kw:["IdeaHub ES2 Plus"]},
  "huawei-es2":{v:"Huawei",name:"IdeaHub ES2",url:"https://e.huawei.com/en/products/enterprise-collaboration/ideahub/ideahub-es2",kw:["IdeaHub ES2"]},
  "huawei-s2":{v:"Huawei",name:"IdeaHub S2",url:"https://e.huawei.com/en/products/enterprise-collaboration/ideahub/ideahub-s2",kw:["IdeaHub S2"]},
  "huawei-b3":{v:"Huawei",name:"IdeaHub B3",url:"https://e.huawei.com/en/products/enterprise-collaboration/ideahub/ideahub-b3",kw:["IdeaHub B3"]},
  "neat-bar2":{v:"Neat",name:"Bar Gen 2",url:"https://neat.no/bar-2/",kw:["Neat Bar"]},
  "neat-barpro":{v:"Neat",name:"Bar Pro",url:"https://neat.no/bar-pro/",kw:["Neat Bar Pro"]},
  "neat-board50":{v:"Neat",name:"Board 50",url:"https://neat.no/board-50/",kw:["Board 50"]},
  "neat-boardpro":{v:"Neat",name:"Board Pro",url:"https://neat.no/board-pro/",kw:["Board Pro"]},
  "neat-center":{v:"Neat",name:"Center",url:"https://neat.no/center/",kw:["Neat Center"]},
  "shure-mxn5":{v:"Shure",name:"MXN5W-C",url:"https://www.shure.com/en-US/products/loudspeakers/mxn5",kw:["MXN5"]},
  "shure-mxa925":{v:"Shure",name:"MXA925",url:"https://www.shure.com/en-US/products/microphones/mxa925",kw:["MXA925"],model:"MXA925"},
  "shure-p300":{v:"Shure",name:"IntelliMix P300",url:"https://www.shure.com/en-US/products/mixers/p300",kw:["P300"]},
  "shure-imx":{v:"Shure",name:"IntelliMix Room",url:"https://www.shure.com/en-US/products/software/intellimix_room",kw:["IntelliMix Room"]},
  "senn-tcc2":{v:"Sennheiser",name:"TeamConnect Ceiling 2",url:"https://www.sennheiser.com/en-se/catalog/products/meeting-and-conference-systems/teamconnect-ceiling-2",kw:["TeamConnect Ceiling 2"]},
  "senn-tccm":{v:"Sennheiser",name:"TeamConnect Ceiling Medium",url:"https://www.sennheiser.com/en-se/catalog/products/meeting-and-conference-systems/teamconnect-ceiling-medium/teamconnect-ceiling-medium-f-w-700170",kw:["TeamConnect Ceiling Medium"]},
  "senn-tccmp":{v:"Sennheiser",name:"TeamConnect Ceiling M Plus",url:"https://www.sennheiser.com/en-se/catalog/products/meeting-and-conference-systems/teamconnect-ceiling-m-plus-5378e",kw:["TeamConnect Ceiling M Plus"]},
  "biamp-fx":{v:"Biamp",name:"TesiraFORTÉ X",url:"https://www.biamp.com/products/families/tesira/tesiraforte-x",kw:["TesiraFORT"]},
  "qsc-nano":{v:"QSC",name:"Q-SYS Core Nano",url:"https://www.qsys.com/products-solutions/q-sys/processing/core-nano/",kw:["Core Nano"]},
};
// app product id -> page key (several catalog sizes share one page)
const PAGE_OF=id=>({"cisco-bar":"cisco-room-bar","cisco-barpro":"cisco-room-bar-pro","cisco-board55":"cisco-board-pro","cisco-board75":"cisco-board-pro",
  "cisco-eq":"cisco-room-kit-eq","cisco-eqx":"cisco-room-kit-eqx","cisco-pro":"cisco-room-kit-pro","cisco-deskpro":"cisco-desk-pro"}[id]
  ||(id.match(/^huawei-(es3|es2plus|es2|s2|b3)-/)||[])[0]?.replace(/-$/,"")||(PAGES[id]?id:null));

const PC={status:null,timer:null};
const PC_LABEL={ok:["✓","ok","Current"],changed:["!","warn","Page shows a newer model"],eol:["✕","bad","End-of-sale / discontinued"],
  missing:["?","bad","Page or product not found"],error:["·","info","Couldn't check"]};
function pcResult(id){const k=PAGE_OF(id), r=PC.status&&k&&PC.status.results[k]; return r||null;}
function pcFlag(id){const r=pcResult(id); return r&&r.status!=="ok"&&r.status!=="error"?" ⚠":"";}

function pcSummary(st){
  const res=Object.values(st.results||{}), n=s=>res.filter(r=>r.status===s).length;
  return {n:res.length,ok:n("ok"),changed:n("changed"),eol:n("eol"),missing:n("missing"),error:n("error")};
}
function pcRender(){
  const st=PC.status, badge=$("checkBadge"), body=$("checkBody"); if(!st||!badge) return;
  badge.hidden=false;
  const s=pcSummary(st), bad=s.changed+s.eol+s.missing;
  if(st.running){badge.textContent=`Checking vendor products… ${st.done}/${st.total}`; badge.className="btn ghost";}
  else{
    badge.textContent=bad?`Product check: ${bad} need attention`:s.error===s.n?"Product check: offline":`Product check: ${s.ok}/${s.n} current`;
    badge.className="btn ghost "+(bad?"warnb":"okb");
  }
  const rows=Object.entries(PAGES).map(([k,p])=>{
    const r=st.results[k], L=r?PC_LABEL[r.status]:["…","info","Checking"];
    return `<tr><td>${esc(p.v)}</td><td>${esc(p.name)}</td><td><span class="pill ${L[1]}">${L[0]} ${L[2]}</span></td>
      <td class="n">${esc(r?r.note:"")}</td><td><button class="mini" data-url="${esc(p.url)}">Open page</button></td></tr>`;
  }).join("");
  const when=st.finished?`Checked ${st.finished.replace("T"," ")}`:`Started ${String(st.started||"").replace("T"," ")}`;
  body.innerHTML=`<p class="n">${when} · ${s.n}/${Object.keys(PAGES).length} pages: ${s.ok} current, ${s.changed} newer model shown, ${s.eol} end-of-sale, ${s.missing} not found, ${s.error} couldn't check.
    The check runs every time the app starts, using each vendor's official product page.</p>
    <div class="tbl"><table><thead><tr><th>Vendor</th><th>Product</th><th>Status</th><th>What the page says</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function pcNote(c){
  const el=$("pc"+c); if(!el) return;
  const id=S.dev[c], r=pcResult(id);
  if(!r||r.status==="ok"||r.status==="error"){el.textContent="";el.className="pcnote";return;}
  el.className="pcnote "+PC_LABEL[r.status][1];
  el.textContent=`Product check: ${PC_LABEL[r.status][2]}. ${r.note}. Verify before quoting.`;
}
async function pcPoll(){
  try{PC.status=await Host.api.catalog_status();}catch(e){return;}
  pcRender();
  if(PC.status.running) PC.timer=setTimeout(pcPoll,3000);
  else{buildPlans(); render();}
}
async function startProductCheck(){
  if(!Host.api||!Host.api.start_catalog_check) return;
  const products=Object.entries(PAGES).map(([id,p])=>({id,name:`${p.v} ${p.name}`,url:p.url,kw:p.kw,model:p.model||null}));
  try{await Host.api.start_catalog_check(products);}catch(e){return;}
  pcPoll();
}
