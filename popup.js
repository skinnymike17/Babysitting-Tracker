const KEY = 'bst_v4';
const TODAY = new Date();
let yr = TODAY.getFullYear(), mo = TODAY.getMonth();
let db = {};

function load(){try{const s=localStorage.getItem(KEY);if(s)db=JSON.parse(s);}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){}}
function dk(y,m,d){return`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function mk(y,m){return`meta_${y}_${m}`;}
function cycle(s){return{none:'boy',boy:'girl',girl:'both',both:'none'}[s]||'none';}
function fmt(n){return'$'+n.toFixed(2);}
function mname(y,m){return new Date(y,m).toLocaleString('default',{month:'long'})+' '+y;}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return(s[(v-20)%10]||s[v]||s[0]);}

function pay(dd){
  if(dd.status==='boy')  return{boy:(dd.hours||0)*22,girl:0};
  if(dd.status==='girl') return{boy:0,girl:(dd.hours||0)*22};
  if(dd.status==='both'){
    const hb=dd.hoursB||0,hg=dd.hoursG||0;
    const overlap=Math.min(hb,hg);
    return{boy:overlap*15+(hb-overlap)*22, girl:overlap*15+(hg-overlap)*22};
  }
  return{boy:0,girl:0};
}

function periodTotals(s,e){
  let boy=0,girl=0,hBoy=0,hGirl=0;
  for(let d=s;d<=e;d++){
    const dd=db[dk(yr,mo,d)];
    if(!dd||dd.status==='none')continue;
    const p=pay(dd);boy+=p.boy;girl+=p.girl;
    if(dd.status==='boy')  hBoy+=dd.hours||0;
    if(dd.status==='girl') hGirl+=dd.hours||0;
    if(dd.status==='both'){hBoy+=dd.hoursB||0;hGirl+=dd.hoursG||0;}
  }
  return{boy,girl,hBoy,hGirl};
}

function renderCal(){
  const grid=document.getElementById('calGrid');
  grid.innerHTML='';
  const first=new Date(yr,mo,1).getDay();
  const days=new Date(yr,mo+1,0).getDate();

  for(let i=0;i<first;i++){const e=document.createElement('div');e.className='day empty';grid.appendChild(e);}

  for(let d=1;d<=days;d++){
    const key=dk(yr,mo,d);
    const dd=db[key]||{status:'none',hours:0,hoursB:0,hoursG:0};
    const isToday=yr===TODAY.getFullYear()&&mo===TODAY.getMonth()&&d===TODAY.getDate();
    const cell=document.createElement('div');cell.className='day';

    const circ=document.createElement('div');circ.className=`circle ${dd.status}`;
    if(dd.status==='none'&&isToday){
      const tc=document.createElement('div');tc.className='today-circle';tc.textContent=d;circ.appendChild(tc);
    } else {circ.textContent=d;}
    cell.appendChild(circ);

    if(dd.status==='both'){
      const wrap=document.createElement('div');wrap.className='both-hrs';
      ['b','g'].forEach(kid=>{
        const row=document.createElement('div');row.className='both-row';
        const dot=document.createElement('span');dot.className=`kid-dot ${kid}`;
        const inp=document.createElement('input');
        inp.type='number';inp.min='0';inp.max='24';inp.step='0.5';
        inp.className=`both-input ${kid}i`;
        inp.placeholder='0';
        inp.value=(kid==='b'?(dd.hoursB||''):(dd.hoursG||''));
        inp.title=kid==='b'?'Boy hours':'Girl hours';
        inp.addEventListener('click',e=>e.stopPropagation());
        inp.addEventListener('input',e=>{
          e.stopPropagation();
          if(!db[key])db[key]={status:'both',hours:0,hoursB:0,hoursG:0};
          if(kid==='b')db[key].hoursB=parseFloat(e.target.value)||0;
          else db[key].hoursG=parseFloat(e.target.value)||0;
          save();renderPay();
        });
        const lbl=document.createElement('span');lbl.className='both-lbl';
        lbl.textContent=kid==='b'?'bo':'gi';
        row.appendChild(dot);row.appendChild(inp);row.appendChild(lbl);
        wrap.appendChild(row);
      });
      cell.appendChild(wrap);
      const clr=document.createElement('button');clr.className='clear-btn';clr.textContent='✕ clear';
      clr.addEventListener('click',e=>{e.stopPropagation();if(!db[key])return;db[key].hoursB=0;db[key].hoursG=0;save();renderCal();renderPay();});
      cell.appendChild(clr);

    } else if(dd.status!=='none'){
      const wrap=document.createElement('div');wrap.className='hrs-wrap';
      const inp=document.createElement('input');
      inp.type='number';inp.min='0';inp.max='24';inp.step='0.5';
      inp.className='hrs-input';inp.value=dd.hours||'';inp.placeholder='0';
      inp.addEventListener('click',e=>e.stopPropagation());
      inp.addEventListener('input',e=>{
        e.stopPropagation();
        if(!db[key])db[key]={status:'none',hours:0};
        db[key].hours=parseFloat(e.target.value)||0;
        save();renderPay();
      });
      const lbl=document.createElement('span');lbl.className='hrs-lbl';lbl.textContent='hrs';
      wrap.appendChild(inp);wrap.appendChild(lbl);cell.appendChild(wrap);
      const clr=document.createElement('button');clr.className='clear-btn';clr.textContent='✕ clear';
      clr.addEventListener('click',e=>{e.stopPropagation();if(!db[key])return;db[key].hours=0;save();renderCal();renderPay();});
      cell.appendChild(clr);
    }

    cell.addEventListener('click',()=>{
      if(!db[key])db[key]={status:'none',hours:0,hoursB:0,hoursG:0};
      db[key].status=cycle(db[key].status);
      if(db[key].status==='none'){db[key].hours=0;db[key].hoursB=0;db[key].hoursG=0;}
      save();renderCal();renderPay();
    });
    grid.appendChild(cell);
  }
}

function renderPay(){
  const days=new Date(yr,mo+1,0).getDate();
  const mn=new Date(yr,mo).toLocaleString('default',{month:'long'});
  const metaKey=mk(yr,mo);
  if(!db[metaKey])db[metaKey]={paid1:'',paid2:''};
  const meta=db[metaKey];

  const periods=[
    {label:'Period 1',range:`${mn} 1–15`,payday:'Paid on the 15th',s:1,e:15,paidKey:'paid1'},
    {label:'Period 2',range:`${mn} 16–${days}`,payday:`Paid on the ${days}${ordinal(days)}`,s:16,e:days,paidKey:'paid2'}
  ];

  const container=document.getElementById('paySummary');
  container.innerHTML='';
  const title=document.createElement('div');title.className='section-title';title.textContent='📊 Pay Period Summary';
  container.appendChild(title);

  let grandBoy=0,grandGirl=0,grandActual=0;

  periods.forEach(p=>{
    const t=periodTotals(p.s,p.e);
    const owed=t.boy+t.girl;
    grandBoy+=t.boy;grandGirl+=t.girl;
    const actualVal=parseFloat(meta[p.paidKey])||0;
    const diff=actualVal-owed;
    grandActual+=actualVal;

    let badgeHTML='';
    if(actualVal>0){
      if(diff>0.009)       badgeHTML=`<span class="diff-badge over">+${fmt(diff)} tip 🎉</span>`;
      else if(diff<-0.009) badgeHTML=`<span class="diff-badge under">${fmt(diff)} short</span>`;
      else                  badgeHTML=`<span class="diff-badge exact">Exact ✓</span>`;
    }

    const totalHrs=t.hBoy+t.hGirl;
    const hrsLine=totalHrs>0
      ? `${totalHrs.toFixed(1)} hrs total — 🔵 Boy: ${t.hBoy.toFixed(1)} hrs · 🩷 Girl: ${t.hGirl.toFixed(1)} hrs`
      : 'No hours logged yet';

    const block=document.createElement('div');block.className='period-block';
    block.innerHTML=`
      <div class="period-header">
        <div><div class="period-name">${p.label} · ${p.range}</div></div>
        <div class="period-payday">${p.payday}</div>
      </div>
      <div style="font-size:11.5px;color:#718096;background:#f9fafb;border-radius:9px;padding:7px 10px;margin-bottom:11px;">${hrsLine}</div>
      <div class="period-rows">
        <div>
          <div class="fam-row">
            <span class="fam-label"><span class="fam-dot" style="background:#4A8EE8"></span>Boy's Family</span>
            <span class="fam-amt">${fmt(t.boy)}</span>
          </div>
          <div class="period-sub">${t.hBoy>0?t.hBoy.toFixed(1)+' hrs':''}</div>
        </div>
        <div>
          <div class="fam-row">
            <span class="fam-label"><span class="fam-dot" style="background:#F06BA0"></span>Girl's Family</span>
            <span class="fam-amt">${fmt(t.girl)}</span>
          </div>
          <div class="period-sub">${t.hGirl>0?t.hGirl.toFixed(1)+' hrs':''}</div>
        </div>
      </div>
      <div class="period-divider"></div>
      <div class="period-owed"><span>Total owed this period</span><strong>${fmt(owed)}</strong></div>
      <div class="actual-row">
        <div class="actual-label">💵 Actual amount received</div>
        <div class="actual-input-wrap">
          ${badgeHTML}
          <span class="dollar-sign">$</span>
          <input class="actual-input" type="number" min="0" step="0.01" placeholder="0.00" value="${meta[p.paidKey]||''}" data-key="${p.paidKey}">
        </div>
      </div>`;
    container.appendChild(block);
    const ai=block.querySelector('.actual-input');
    ai.addEventListener('input',e=>{meta[e.target.dataset.key]=e.target.value;save();});
    ai.addEventListener('blur',()=>renderPay());
  });

  // Tax section
  const act1=parseFloat(meta.paid1)||0,act2=parseFloat(meta.paid2)||0;
  const grandTax=grandActual*0.30;
  const taxSection=document.createElement('div');taxSection.className='tax-section';
  taxSection.innerHTML=`
    <div class="tax-header">
      <span class="section-title" style="margin-bottom:0">🧾 Tax Estimate</span>
      <span class="tax-rate-badge">30% Rate</span>
    </div>
    <div class="tax-grid">
      <div class="tax-card">
        <div class="tax-card-label">Period 1 Set Aside</div>
        <div class="tax-card-amt">${fmt(act1*0.30)}</div>
        <div class="period-sub" style="text-align:center;margin-top:4px">Keep ${fmt(act1*0.70)}</div>
      </div>
      <div class="tax-card">
        <div class="tax-card-label">Period 2 Set Aside</div>
        <div class="tax-card-amt">${fmt(act2*0.30)}</div>
        <div class="period-sub" style="text-align:center;margin-top:4px">Keep ${fmt(act2*0.70)}</div>
      </div>
      <div class="tax-card highlight">
        <div class="tax-card-label">Monthly Total Tax</div>
        <div class="tax-card-amt">${fmt(grandTax)}</div>
        <div class="period-sub" style="text-align:center;margin-top:4px">Keep ${fmt(grandActual-grandTax)}</div>
      </div>
    </div>
    <div class="tax-note">Based on actual payments received · Set aside each payday to avoid a bill later</div>`;
  container.appendChild(taxSection);

  const mt=document.createElement('div');mt.className='month-total';
  mt.innerHTML=`<span class="month-total-label">Total Earned This Month</span><span class="month-total-amt">${fmt(grandBoy+grandGirl)}</span>`;
  container.appendChild(mt);
}

document.getElementById('prev').addEventListener('click',()=>{mo--;if(mo<0){mo=11;yr--;}document.getElementById('monthLabel').textContent=mname(yr,mo);renderCal();renderPay();});
document.getElementById('next').addEventListener('click',()=>{mo++;if(mo>11){mo=0;yr++;}document.getElementById('monthLabel').textContent=mname(yr,mo);renderCal();renderPay();});

document.getElementById('exportBtn').addEventListener('click',()=>{
  const days=new Date(yr,mo+1,0).getDate();
  const mn=new Date(yr,mo).toLocaleString('default',{month:'long'});
  const metaKey=mk(yr,mo);
  const meta=db[metaKey]||{paid1:'',paid2:''};
  const t1=periodTotals(1,15),t2=periodTotals(16,days);
  const act1=parseFloat(meta.paid1)||0,act2=parseFloat(meta.paid2)||0;
  const grandActual=act1+act2;
  let boyG=0,girlG=0;

  let txt=`BABYSITTING PAY SUMMARY\n${mn} ${yr}\n${'='.repeat(48)}\n\n`;
  txt+=`Rates: 1 kid = $22/hr  |  Both kids: overlap = $15/ea, extra solo = $22\n\n`;
  txt+=`DAILY LOG\n${'-'.repeat(48)}\n`;

  let any=false;
  for(let d=1;d<=days;d++){
    const dd=db[dk(yr,mo,d)];
    if(!dd||dd.status==='none')continue;
    const p=pay(dd);
    if(p.boy===0&&p.girl===0)continue;
    any=true;
    const date=new Date(yr,mo,d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    if(dd.status==='boy'){
      txt+=`${date}: Boy only | ${dd.hours||0} hrs @ $22/hr -> Boy's family: ${fmt(p.boy)}\n`;
    } else if(dd.status==='girl'){
      txt+=`${date}: Girl only | ${dd.hours||0} hrs @ $22/hr -> Girl's family: ${fmt(p.girl)}\n`;
    } else if(dd.status==='both'){
      const hb=dd.hoursB||0,hg=dd.hoursG||0,ov=Math.min(hb,hg);
      txt+=`${date}: Both kids | Boy: ${hb}hrs, Girl: ${hg}hrs\n`;
      txt+=`  Together: ${ov}hrs @ $15/ea`;
      if(hb-ov>0)txt+=`  | Boy extra: ${hb-ov}hrs @ $22`;
      if(hg-ov>0)txt+=`  | Girl extra: ${hg-ov}hrs @ $22`;
      txt+=`\n  -> Boy's family: ${fmt(p.boy)}  |  Girl's family: ${fmt(p.girl)}\n`;
    }
    boyG+=p.boy;girlG+=p.girl;
  }
  if(!any)txt+=`No days logged this month.\n`;

  txt+=`\nPAY PERIODS\n${'-'.repeat(48)}\n`;
  txt+=`Period 1 (${mn} 1-15) - Paid on the 15th\n`;
  txt+=`  Boy's: ${fmt(t1.boy)}  |  Girl's: ${fmt(t1.girl)}  |  Owed: ${fmt(t1.boy+t1.girl)}\n`;
  txt+=`  Boy hrs: ${t1.hBoy.toFixed(1)}  |  Girl hrs: ${t1.hGirl.toFixed(1)}\n`;
  txt+=`  Received: ${fmt(act1)}  |  Difference: ${fmt(act1-(t1.boy+t1.girl))}\n\n`;
  txt+=`Period 2 (${mn} 16-${days}) - Paid on the ${days}${ordinal(days)}\n`;
  txt+=`  Boy's: ${fmt(t2.boy)}  |  Girl's: ${fmt(t2.girl)}  |  Owed: ${fmt(t2.boy+t2.girl)}\n`;
  txt+=`  Boy hrs: ${t2.hBoy.toFixed(1)}  |  Girl hrs: ${t2.hGirl.toFixed(1)}\n`;
  txt+=`  Received: ${fmt(act2)}  |  Difference: ${fmt(act2-(t2.boy+t2.girl))}\n\n`;
  txt+=`${'='.repeat(48)}\nMONTHLY TOTALS\n`;
  txt+=`  Boy's family owed:   ${fmt(boyG)}\n`;
  txt+=`  Girl's family owed:  ${fmt(girlG)}\n`;
  txt+=`  Total owed:          ${fmt(boyG+girlG)}\n`;
  txt+=`  Total received:      ${fmt(grandActual)}\n\n`;
  txt+=`TAX ESTIMATE (30%)\n${'-'.repeat(48)}\n`;
  txt+=`  Period 1 set aside:  ${fmt(act1*0.30)}  (keep ${fmt(act1*0.70)})\n`;
  txt+=`  Period 2 set aside:  ${fmt(act2*0.30)}  (keep ${fmt(act2*0.70)})\n`;
  txt+=`  Total to set aside:  ${fmt(grandActual*0.30)}\n`;
  txt+=`  Total take-home:     ${fmt(grandActual*0.70)}\n`;
  txt+=`\nGenerated: ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}\n`;

  const blob=new Blob([txt],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download=`babysitting-${yr}-${String(mo+1).padStart(2,'0')}.txt`;
  a.click();URL.revokeObjectURL(url);
});

load();
document.getElementById('monthLabel').textContent=mname(yr,mo);
renderCal();
renderPay();