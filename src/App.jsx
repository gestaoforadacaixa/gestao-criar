import { useState, useEffect, useMemo, useCallback } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://oltwaosdzgvbbvermilk.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHdhb3Nkemd2YmJ2ZXJtaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDU3MjksImV4cCI6MjA5NDEyMTcyOX0.WbDR65w6eywTgLc4Lwii_63RrJwKPN9oj1DsgjxeFBo";
const CID = "criar";
const H = {
  "Content-Type": "application/json",
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Prefer": "return=representation",
};
async function sbGet(mes) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?cliente_id=eq.${CID}&mes=eq.${mes}&order=data.desc`, { headers: H });
    return r.ok ? r.json() : [];
  } catch { return []; }
}
async function sbPost(body) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos`, { method: "POST", headers: H, body: JSON.stringify(body) });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
async function sbPatch(id, body) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?id=eq.${id}`, { method: "PATCH", headers: { ...H, "Prefer": "return=minimal" }, body: JSON.stringify(body) });
    return r.ok;
  } catch { return false; }
}
async function rcGet(mes) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/receitas?cliente_id=eq.${CID}&mes=eq.${mes}&order=semana.desc`, { headers: H });
    return r.ok ? r.json() : [];
  } catch { return []; }
}
async function rcPost(body) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/receitas`, { method: "POST", headers: H, body: JSON.stringify(body) });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
async function rcDelete(id) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/receitas?id=eq.${id}`, { method: "DELETE", headers: H });
    return r.ok;
  } catch { return false; }
}
async function fetchCategorias() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/categorias?cliente_id=eq.${CID}&order=nome.asc`, { headers: H });
    return r.ok ? r.json() : [];
  } catch { return []; }
}
const uid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now());


let CATEGORIAS = [
  "Administrativo",
  "Alimentação",
  "Compromissos Financeiros",
  "Impostos",
  "Infraestrutura",
  "Liquidação de Fatura",
  "Material Didático",
  "Mensalidades",
  "Obra",
  "Outros",
  "Papelaria",
  "Salários",
  "Serviços",
  "Transporte",
];
const MEIOS          = ["Crédito","Débito","Dinheiro","Pix","Transferência"];
const PERIODICIDADES = ["Mensal","Quinzenal","Semanal"];
const REPETICOES_OPT = [2,3,4,5,6,12];
const MESES_NOMES    = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CAT_CORES = {
  "Administrativo":          "#E67E22",
  "Alimentação":             "#F39C12",
  "Compromissos Financeiros":"#C0392B",
  "Impostos":                "#7D3C98",
  "Infraestrutura":          "#2980B9",
  "Liquidação de Fatura":    "#5D6D7E",
  "Material Didático":       "#8E44AD",
  "Mensalidades":            "#27AE60",
  "Obra":                    "#B03A2E",
  "Outros":                  "#95A5A6",
  "Papelaria":               "#1ABC9C",
  "Salários":                "#E91E8C",
  "Serviços":                "#16A085",
  "Transporte":              "#7F8C8D",
};
const MEIO_CORES = {
  "Crédito":       "#8E44AD",
  "Débito":        "#3498DB",
  "Dinheiro":      "#27AE60",
  "Pix":           "#00B894",
  "Transferência": "#E67E22",
};
// ─── Meses do sistema — gerado automaticamente, nunca precisa editar ─────────
// MES_INICIO = primeiro mês com dados no sistema (não mexer nunca)
// FECHADOS   = meses que já foram encerrados manualmente pelo usuário
//              (para adicionar um mês fechado no futuro, só incluir a chave
//              "AAAA-MM" nessa lista)
const MES_INICIO = "2026-04";
const FECHADOS   = ["2026-04","2026-05"];
const MESES_NOMES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function gerarMeses(){
  const [ay,am] = MES_INICIO.split("-").map(Number);
  const hoje = new Date();
  let ly = hoje.getFullYear() + 2, lm = hoje.getMonth()+1; // vai até 2 ANOS à frente do mês atual
  const arr=[];
  let y=ay, m=am;
  while(y<ly || (y===ly && m<=lm)){
    const key=`${y}-${String(m).padStart(2,"0")}`;
    arr.push({ label:`${MESES_NOMES_FULL[m-1]} ${y}`, mes:key, fechado:FECHADOS.includes(key) });
    m++; if(m>12){ m=1; y++; }
  }
  return arr;
}
const MESES = gerarMeses();
// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDate = d => { const[,m,day]=d.split("-"); return `${day}/${m}`; };
const hoje    = () => new Date().toISOString().slice(0,10);
const d2brl   = d => { const n=parseInt(d||"0",10); return `${Math.floor(n/100).toLocaleString("pt-BR")},${String(n%100).padStart(2,"0")}`; };
const d2float = d => parseInt(d||"0",10)/100;
const float2d = v => String(Math.round(v*100));
const soma    = arr => arr.filter(t=>!t.excluido && t.categoria!=="Liquidação de Fatura").reduce((s,t)=>s+t.valor,0);
const padN    = n => String(n).padStart(2,"0");
// Retorna 5 faixas semanais do mês: [{ini, fim, label}]
const semanasDoMes = mesKey => {
  const [ano,mes] = mesKey.split("-").map(Number);
  const ultDia = new Date(ano, mes, 0).getDate();
  return [
    { ini:1,  fim:Math.min(7,ultDia),  label:"Sem 1" },
    { ini:8,  fim:Math.min(14,ultDia), label:"Sem 2" },
    { ini:15, fim:Math.min(21,ultDia), label:"Sem 3" },
    { ini:22, fim:Math.min(28,ultDia), label:"Sem 4" },
    ...(ultDia>28 ? [{ ini:29, fim:ultDia, label:"Sem 5" }] : []),
  ];
};
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0} html,body{background:#F0F6FF}
input,select,textarea{-webkit-appearance:none;appearance:none}
input:focus,select:focus,textarea:focus{outline:none;border-color:#2980B9!important;box-shadow:0 0 0 3px #2980B920}
.tab:hover{color:#1A5276!important}
.btn-primary{background:#2980B9;color:#fff;border:none;border-radius:12px;padding:16px;font-size:15px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;width:100%;transition:all .2s}
.btn-primary:hover{background:#1F618D}
.btn-success{background:#27AE60;color:#fff;border:none;border-radius:12px;padding:16px;font-size:15px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;width:100%;transition:all .2s}
.btn-success:hover{background:#1E8449}
.btn-ghost{background:none;border:2px solid #D5E8F5;border-radius:12px;padding:14px;font-size:14px;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;width:100%;color:#5D6D7E;transition:all .2s;margin-top:10px}
.btn-ghost:hover{border-color:#aaa;color:#333}
.btn-danger{background:none;border:2px solid #E74C3C;border-radius:12px;padding:14px;font-size:14px;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;width:100%;color:#E74C3C;transition:all .2s;margin-top:10px}
.btn-danger:hover{background:#E74C3C;color:#fff}
.fab{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#2980B9,#8E44AD);color:#fff;border:none;border-radius:50px;padding:15px 28px;font-size:14px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;box-shadow:0 6px 24px #2980B940;z-index:90;display:flex;align-items:center;gap:8px;transition:all .2s;white-space:nowrap}
.fab-green{background:linear-gradient(135deg,#27AE60,#16A085);box-shadow:0 6px 24px #27AE6040}
.fab:hover{transform:translateX(-50%) translateY(-2px)} .fab:active{transform:translateX(-50%) scale(.98)}
.overlay{position:fixed;inset:0;background:#00000055;z-index:200;display:flex;align-items:flex-end}
.sheet{background:#fff;border-radius:24px 24px 0 0;padding:8px 20px 40px;width:100%;max-width:480px;margin:0 auto;animation:sheetUp .28s cubic-bezier(.32,.72,0,1);max-height:94vh;overflow-y:auto}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.overlay-top{position:fixed;inset:0;background:#00000055;z-index:200;display:flex;align-items:flex-start;padding-top:120px}
.sheet-top{background:#fff;border-radius:20px;padding:0 0 20px;width:calc(100% - 32px);max-width:448px;margin:0 auto;animation:fadeDown .22s ease;max-height:70vh;overflow-y:auto;box-shadow:0 8px 32px #00000020}
@keyframes fadeDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.handle{width:40px;height:4px;background:#e8e8e8;border-radius:2px;margin:12px auto 20px}
.row-item{transition:background .12s;border-radius:8px} .row-item:active{background:#EBF5FB}
.row-excluido{opacity:.4}
.badge{display:inline-flex;align-items:center;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;font-family:'Nunito',sans-serif;margin-top:3px}
.icon-btn{background:none;border:2px solid #D5E8F5;border-radius:8px;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;color:#7F8C8D}
.icon-btn:hover{border-color:#2980B9;color:#2980B9}
.icon-btn-danger:hover{border-color:#E74C3C;color:#E74C3C}
.notif-btn{position:relative;background:none;border:2px solid #D5E8F5;border-radius:10px;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#7F8C8D;transition:all .2s;flex-shrink:0}
.notif-btn:hover,.notif-btn.has-pending{border-color:#E67E22;color:#E67E22;background:#FEF5EC}
.notif-dot{position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#E67E22;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;font-family:'Nunito',sans-serif;border:2px solid #F0F6FF}
.coll-toggle{cursor:pointer;transition:all .15s;border-radius:14px;user-select:none}
.reveal{animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.arrow-btn{background:none;border:2px solid #D5E8F5;border-radius:8px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#5D6D7E;transition:all .2s;flex-shrink:0}
.arrow-btn:hover:not(:disabled){border-color:#2980B9;color:#2980B9} .arrow-btn:disabled{opacity:.3;cursor:not-allowed}
.mes-btn{background:none;border:2px solid #D5E8F5;border-radius:10px;padding:8px 16px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;color:#1A5276;display:flex;align-items:center;gap:8px;transition:border .2s}
.mes-btn:hover{border-color:#2980B9}
.month-picker{position:absolute;top:110%;left:50%;transform:translateX(-50%);background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 32px #00000022;z-index:300;width:280px;animation:fadeIn .15s ease}
.mc{border:none;border-radius:8px;padding:10px 4px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;color:#333;background:none;width:100%}
.mc:hover:not(.mc-dis){background:#EBF5FB} .mc-act{background:#2980B9!important;color:#fff!important} .mc-dis{opacity:.3;cursor:not-allowed}
.period-btn{border:2px solid #D5E8F5;border-radius:10px;background:#F8FBFF;color:#5D6D7E;font-size:13px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;text-align:center;transition:all .2s;padding:10px 6px;flex:1}
.period-btn:hover,.period-btn.on{border-color:#2980B9;background:#2980B9;color:#fff}
.rep-btn{border:2px solid #D5E8F5;border-radius:10px;background:#F8FBFF;color:#5D6D7E;font-size:13px;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer;transition:all .2s;padding:8px 10px}
.rep-btn:hover,.rep-btn.on{border-color:#2980B9;background:#2980B9;color:#fff}
.pend-item{padding:14px 20px;border-bottom:1px solid #EBF5FB;display:flex;justify-content:space-between;align-items:center;gap:10px}
.pend-item:last-child{border-bottom:none}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1A5276;color:#fff;padding:12px 24px;border-radius:50px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;z-index:500;white-space:nowrap;animation:toastIn .25s ease;pointer-events:none}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#2980B9;border-radius:2px}`;
function Logo({size=48}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="white"/>
      {[{color:"#E67E22",rot:0},{color:"#8E44AD",rot:-72},{color:"#2980B9",rot:72},{color:"#27AE60",rot:-144},{color:"#E91E8C",rot:144}].map(({color,rot},i)=>(
        <g key={i} transform={`rotate(${rot} 50 50)`}>
          <ellipse cx="50" cy="24" rx="9" ry="13" fill={color}/>
          <ellipse cx="43" cy="14" rx="2.2" ry="5" fill={color} transform="rotate(-15 43 14)"/>
          <ellipse cx="47" cy="12" rx="2.2" ry="5" fill={color} transform="rotate(-5 47 12)"/>
          <ellipse cx="51" cy="12" rx="2.2" ry="5" fill={color} transform="rotate(5 51 12)"/>
          <ellipse cx="55" cy="13" rx="2.2" ry="5" fill={color} transform="rotate(15 55 13)"/>
        </g>
      ))}
      <text x="50" y="52" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="9" fontWeight="900" fill="#1A5276" letterSpacing="2">CRIAR</text>
    </svg>
  );
}
function Bar({percent,color="#2980B9"}) {
  return (
    <div style={{background:"#E8F4FD",borderRadius:4,height:6,width:"100%",overflow:"hidden"}}>
      <div style={{width:`${Math.min(Math.max(percent,0),100)}%`,background:color,height:"100%",borderRadius:4}}/>
    </div>
  );
}
function Toggle({value,onChange}) {
  return (
    <div style={{width:44,height:24,borderRadius:12,cursor:"pointer",transition:"background .2s",background:value?"#2980B9":"#ddd",display:"flex",alignItems:"center",padding:2,flexShrink:0}} onClick={()=>onChange(!value)}>
      <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px #0003",transition:"transform .2s",transform:value?"translateX(20px)":"translateX(0)"}}/>
    </div>
  );
}
function Comparativo({atual,anterior,isParcial}) {
  if(!anterior) return null;
  const diff=((atual-anterior)/anterior)*100;
  const baixo=diff<0;
  const cor=baixo?"#27AE60":"#E74C3C";
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:baixo?"#EAFAF1":"#FDEDEC",border:`1px solid ${cor}30`,borderRadius:8,padding:"4px 10px",marginTop:8}}>
      <span style={{fontSize:14,color:cor,fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>{baixo?"▼":"▲"} {Math.abs(diff).toFixed(1)}%</span>
      <span style={{fontSize:10,color:"#7F8C8D",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{isParcial?"vs mesmo período ant.":"vs mês anterior"}</span>
    </div>
  );
}
function CollapsibleSection({label,count,valor,color,children}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{marginBottom:12}}>
      <div className="coll-toggle" onClick={()=>setOpen(o=>!o)}
        style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 2px 8px #2980B910",display:"flex",justifyContent:"space-between",alignItems:"center",border:open?`2px solid ${color}`:"2px solid transparent",transition:"all .2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:4,height:20,background:color,borderRadius:2}}/>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>{label}</div>
            {count!=null&&<div style={{fontSize:11,color:"#A9B7C6",marginTop:1,fontFamily:"'Nunito',sans-serif"}}>{count} lançamentos</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {valor!=null&&<div style={{fontSize:18,fontWeight:800,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>{fmt(valor)}</div>}
          <div style={{color:"#A9B7C6",transition:"transform .25s",transform:open?"rotate(180deg)":"rotate(0)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>
      {open&&<div className="reveal" style={{marginTop:6}}>{children}</div>}
    </div>
  );
}
function MonthPicker({mesAtual,onSelect,onClose}) {
  const [anoView,setAnoView]=useState(parseInt(mesAtual.slice(0,4)));
  const disp=MESES.map(m=>m.mes);
  const anosDisp=[...new Set(disp.map(k=>parseInt(k.slice(0,4))))];
  const podeAnt=anosDisp.includes(anoView-1);
  const podeProx=anosDisp.includes(anoView+1);
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:299}} onClick={onClose}/>
      <div className="month-picker">
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:14}}>
          <button className="arrow-btn" style={{width:26,height:26}} disabled={!podeAnt} onClick={()=>setAnoView(a=>a-1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{fontSize:15,fontFamily:"'Nunito',sans-serif",fontWeight:800,color:"#1A5276"}}>{anoView}</div>
          <button className="arrow-btn" style={{width:26,height:26}} disabled={!podeProx} onClick={()=>setAnoView(a=>a+1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {MESES_NOMES.map((nome,i)=>{
            const key=`${anoView}-${padN(i+1)}`;
            const isAct=key===mesAtual;
            const isDis=!disp.includes(key);
            return <button key={key} className={`mc${isAct?" mc-act":""}${isDis?" mc-dis":""}`} disabled={isDis} onClick={()=>{if(!isDis){onSelect(key);onClose();}}}>{nome}</button>;
          })}
        </div>
      </div>
    </>
  );
}
const emptyForm=()=>({descricao:"",valorDigits:"",categoria:"",meio:"",data:hoje(),obs:"",recorrente:false,periodicidade:"Mensal",diaVencimento:"",repeticoes:null});
const emptyFormReceita=()=>({descricao:"",valorDigits:"",data:hoje(),obs:""});
const INP=err=>({background:"#F8FBFF",border:`2px solid ${err?"#E74C3C":"#D5E8F5"}`,borderRadius:10,color:"#1A5276",padding:"13px 14px",fontSize:15,fontFamily:"'Nunito',sans-serif",width:"100%",transition:"border .2s"});
const FL={fontSize:11,color:"#7F8C8D",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7,display:"block",fontWeight:700,fontFamily:"'Nunito',sans-serif"};
function FormBody({form,setForm,erro,setErro}) {
  const Err=({k})=>erro[k]?<div style={{fontSize:11,color:"#E74C3C",marginTop:4,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{erro[k]}</div>:null;
  return (
    <>
      <div style={{marginBottom:16}}>
        <label style={FL}>Descrição *</label>
        <input style={INP(erro.descricao)} placeholder="Ex: Salário — Nome" value={form.descricao}
          onChange={e=>{setForm(f=>({...f,descricao:e.target.value}));setErro(r=>({...r,descricao:null}));}}/>
        <Err k="descricao"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Valor *</label>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#7F8C8D",fontFamily:"'Nunito',sans-serif",fontWeight:700}}>R$</span>
          <input style={{...INP(erro.valor),paddingLeft:40,fontSize:20,fontWeight:800}} placeholder="0,00"
            value={form.valorDigits?d2brl(form.valorDigits):""} inputMode="numeric"
            onChange={e=>{setForm(f=>({...f,valorDigits:e.target.value.replace(/\D/g,"")}));setErro(r=>({...r,valor:null}));}}/>
        </div>
        <Err k="valor"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Categoria *</label>
        <select style={INP(erro.categoria)} value={form.categoria}
          onChange={e=>{setForm(f=>({...f,categoria:e.target.value}));setErro(r=>({...r,categoria:null}));}}>
          <option value="">Selecione...</option>
          {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <Err k="categoria"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Meio de Pagamento *</label>
        <select style={INP(erro.meio)} value={form.meio}
          onChange={e=>{setForm(f=>({...f,meio:e.target.value}));setErro(r=>({...r,meio:null}));}}>
          <option value="">Selecione...</option>
          {MEIOS.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <Err k="meio"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Data *</label>
        <input type="date" style={INP(erro.data)} value={form.data}
          onChange={e=>{setForm(f=>({...f,data:e.target.value}));setErro(r=>({...r,data:null}));}}/>
        <Err k="data"/>
      </div>
      <div style={{marginBottom:8}}>
        <label style={FL}>Observação</label>
        <textarea style={{...INP(false),minHeight:72,resize:"none",fontSize:14}} placeholder="Cargo, referência, etc."
          value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}/>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:"2px solid #EBF5FB",marginTop:4}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>Despesa Recorrente</div>
          <div style={{fontSize:11,color:"#A9B7C6",marginTop:2,fontFamily:"'Nunito',sans-serif"}}>Lança automaticamente nos próximos meses</div>
        </div>
        <Toggle value={form.recorrente} onChange={v=>setForm(f=>({...f,recorrente:v}))}/>
      </div>
      {form.recorrente&&(
        <div style={{background:"#EBF5FB",border:"1.5px solid #AED6F1",borderRadius:12,padding:16,marginTop:8}}>
          <div style={{fontSize:11,color:"#2980B9",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:800,marginBottom:14,fontFamily:"'Nunito',sans-serif"}}>Configurar Recorrência</div>
          <div style={{marginBottom:14}}>
            <label style={FL}>Periodicidade *</label>
            <div style={{display:"flex",gap:8}}>
              {PERIODICIDADES.map(p=><button key={p} className={`period-btn${form.periodicidade===p?" on":""}`} onClick={()=>setForm(f=>({...f,periodicidade:p}))}>{p}</button>)}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={FL}>Dia do Vencimento *</label>
            <input type="number" min="1" max="31" style={{...INP(erro.diaVencimento),width:"50%"}} placeholder="Ex: 8"
              value={form.diaVencimento} onChange={e=>setForm(f=>({...f,diaVencimento:e.target.value}))}/>
            {erro.diaVencimento&&<div style={{fontSize:11,color:"#E74C3C",marginTop:4,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{erro.diaVencimento}</div>}
          </div>
          <div>
            <label style={FL}>Repetir por quantos meses? *</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {REPETICOES_OPT.map(n=><button key={n} className={`rep-btn${form.repeticoes===n?" on":""}`} onClick={()=>setForm(f=>({...f,repeticoes:n}))}>{n}x</button>)}
            </div>
            {erro.repeticoes&&<div style={{fontSize:11,color:"#E74C3C",marginTop:4,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{erro.repeticoes}</div>}
          </div>
        </div>
      )}
    </>
  );
}
// Formulário simplificado só de receita (valor + data + obs)
function FormBodyReceita({form,setForm,erro,setErro}) {
  const Err=({k})=>erro[k]?<div style={{fontSize:11,color:"#E74C3C",marginTop:4,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{erro[k]}</div>:null;
  return (
    <>
      <div style={{marginBottom:16}}>
        <label style={FL}>Descrição *</label>
        <input style={INP(erro.descricao)} placeholder="Ex: Mensalidade Junho — Turma A" value={form.descricao}
          onChange={e=>{setForm(f=>({...f,descricao:e.target.value}));setErro(r=>({...r,descricao:null}));}}/>
        <Err k="descricao"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Valor Recebido *</label>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#7F8C8D",fontFamily:"'Nunito',sans-serif",fontWeight:700}}>R$</span>
          <input style={{...INP(erro.valor),paddingLeft:40,fontSize:22,fontWeight:800,color:"#27AE60"}} placeholder="0,00"
            value={form.valorDigits?d2brl(form.valorDigits):""} inputMode="numeric"
            onChange={e=>{setForm(f=>({...f,valorDigits:e.target.value.replace(/\D/g,"")}));setErro(r=>({...r,valor:null}));}}/>
        </div>
        <Err k="valor"/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={FL}>Data *</label>
        <input type="date" style={INP(erro.data)} value={form.data}
          onChange={e=>{setForm(f=>({...f,data:e.target.value}));setErro(r=>({...r,data:null}));}}/>
        <Err k="data"/>
      </div>
      <div style={{marginBottom:8}}>
        <label style={FL}>Observação</label>
        <textarea style={{...INP(false),minHeight:64,resize:"none",fontSize:14}} placeholder="Opcional — origem, forma de pagamento, etc."
          value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}/>
      </div>
    </>
  );
}
const INIT_STATE={
  "2026-04":[],
  "2026-05":[],
  "2026-06":[],
  "2026-07":[],
  "2026-08":[],
  "2026-09":[],
};
const INIT_RECEITAS={
  "2026-04":[],
  "2026-05":[],
  "2026-06":[],
  "2026-07":[],
  "2026-08":[],
  "2026-09":[],
};
export default function App() {
  const idxHoje = MESES.findIndex(m => m.mes === new Date().toISOString().slice(0,7));
  const [mesIdx,setMesIdx]                 = useState(idxHoje >= 0 ? idxHoje : MESES.length - 1);
  const [allItems,setAllItems]             = useState(INIT_STATE);
  const [allReceitas,setAllReceitas]       = useState(INIT_RECEITAS);
  const [loading,setLoading]               = useState(true);
  const [lastSync,setLastSync]             = useState(null);
  const [,forceCatUpdate]                  = useState(0);
  const [view,setView]                     = useState("inicio");
  const [showPicker,setShowPicker]         = useState(false);
  const [showPend,setShowPend]             = useState(false);
  const [showForm,setShowForm]             = useState(false);
  const [showFormReceita,setShowFormReceita]=useState(false);
  const [editItem,setEditItem]             = useState(null);
  const [delItem,setDelItem]               = useState(null);
  const [delReceita,setDelReceita]         = useState(null);
  const [motivoExc,setMotivoExc]           = useState("");
  const [motivoErr,setMotivoErr]           = useState(false);
  const [form,setForm]                     = useState(emptyForm());
  const [formReceita,setFormReceita]       = useState(emptyFormReceita());
  const [erro,setErro]                     = useState({});
  const [erroReceita,setErroReceita]       = useState({});
  const [toast,setToast]                   = useState(null);
  const mesAtual  = MESES[mesIdx];
  const mesAnt    = mesIdx>0?MESES[mesIdx-1]:null;
  const isFechado = mesAtual.fechado;
  const items     = allItems[mesAtual.mes]||[];
  const itemsAnt  = mesAnt?(allItems[mesAnt.mes]||[]):[];
  const receitas  = allReceitas[mesAtual.mes]||[];

  // ─── Carregamento do Supabase ────────────────────────────────────────────────
  const load = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    const [dAtual, dAnt, rAtual] = await Promise.all([
      sbGet(mesAtual.mes),
      mesAnt ? sbGet(mesAnt.mes) : Promise.resolve([]),
      rcGet(mesAtual.mes),
    ]);
    setAllItems(p => ({...p, [mesAtual.mes]: dAtual||[], ...(mesAnt ? {[mesAnt.mes]: dAnt||[]} : {})}));
    setAllReceitas(p => ({...p, [mesAtual.mes]: rAtual||[]}));
    setLastSync(new Date());
    if (!silent) setLoading(false);
  }, [mesAtual.mes, mesAnt]);

  useEffect(() => { load(); }, [load]);
  // Busca categorias administráveis do painel do mentor; se falhar ou vier vazio,
  // mantém a lista fixa (CATEGORIAS/CAT_CORES já declaradas acima) como fallback.
  useEffect(() => {
    fetchCategorias().then(res => {
      if (res && res.length > 0) {
        CATEGORIAS = res.map(r => r.nome);
        res.forEach(r => { CAT_CORES[r.nome] = r.cor; });
        forceCatUpdate(v => v + 1);
      }
    });
  }, []);
  useEffect(() => {
    if (showForm || showFormReceita || editItem || delItem || delReceita || showPend) return;
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
  }, [load, showForm, showFormReceita, editItem, delItem, delReceita, showPend]);

  const ativos     = useMemo(()=>items.filter(t=>!t.excluido),[items]);
  const contaveis  = useMemo(()=>ativos.filter(t=>t.categoria!=="Liquidação de Fatura"),[ativos]);
  const total      = useMemo(()=>contaveis.reduce((s,t)=>s+t.valor,0),[contaveis]);
  const totalReceita = useMemo(()=>receitas.reduce((s,r)=>s+r.valor,0),[receitas]);
  const saldo        = totalReceita - total;
  const maxDia     = useMemo(()=>{const d=items.map(t=>parseInt(t.data.slice(8,10)));return d.length?Math.max(...d):31;},[items]);
  const totalAnt   = useMemo(()=>soma(itemsAnt.filter(t=>parseInt(t.data.slice(8,10))<=maxDia)),[itemsAnt,maxDia]);
  const sorted     = useMemo(()=>[...items].sort((a,b)=>new Date(b.data)-new Date(a.data)),[items]);
  const sortedReceitas = useMemo(()=>[...receitas].sort((a,b)=>new Date(b.semana)-new Date(a.semana)),[receitas]);
  const byCat      = useMemo(()=>{
    const m={};
    contaveis.forEach(t=>{m[t.categoria]=(m[t.categoria]||0)+t.valor;});
    return Object.entries(m).map(([cat,val])=>({cat,val})).sort((a,b)=>b.val-a.val);
  },[contaveis]);
  // Dashboard "por meio de pagamento" — inclui todos os MEIOS mesmo com valor 0
  const byMeio     = useMemo(()=>{
    const m={};
    MEIOS.forEach(mm=>{ m[mm]={total:0, count:0}; });
    contaveis.forEach(t=>{
      if(!m[t.meio]) m[t.meio]={total:0, count:0};
      m[t.meio].total += t.valor;
      m[t.meio].count += 1;
    });
    return Object.entries(m).map(([meio,d])=>({meio, val:d.total, count:d.count})).sort((a,b)=>b.val-a.val);
  },[ativos]);
  // Fluxo semanal — receita, despesa e saldo por semana do mês
  const fluxoSemanal = useMemo(()=>{
    const semanas = semanasDoMes(mesAtual.mes);
    return semanas.map(sem=>{
      const rec = receitas.filter(r=>{
        const d=parseInt(r.semana.slice(8,10));
        return d>=sem.ini && d<=sem.fim;
      }).reduce((s,r)=>s+r.valor,0);
      const desp = contaveis.filter(t=>{
        const d=parseInt(t.data.slice(8,10));
        return d>=sem.ini && d<=sem.fim;
      }).reduce((s,t)=>s+t.valor,0);
      return {...sem, receita:rec, despesa:desp, saldo:rec-desp};
    });
  },[receitas,ativos,mesAtual.mes]);
  const pendencias = useMemo(()=>{
    if(isFechado||!mesAnt) return [];
    return itemsAnt.filter(t=>t.recorrente&&!t.excluido)
      .filter(base=>!items.some(t=>t.descricao===base.descricao&&!t.excluido));
  },[items,itemsAnt,mesAnt,isFechado]);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};
  const setItems=fn=>setAllItems(p=>({...p,[mesAtual.mes]:typeof fn==="function"?fn(p[mesAtual.mes]||[]):fn}));
  const setReceitas=fn=>setAllReceitas(p=>({...p,[mesAtual.mes]:typeof fn==="function"?fn(p[mesAtual.mes]||[]):fn}));
  const goMes=dir=>{setMesIdx(i=>i+dir);setShowPicker(false);setShowPend(false);};
  const validar=f=>{
    const e={};
    if(!f.descricao.trim())                            e.descricao    ="Campo obrigatório";
    if(!f.valorDigits||parseInt(f.valorDigits)===0)    e.valor        ="Campo obrigatório";
    if(!f.categoria)                                   e.categoria    ="Selecione uma categoria";
    if(!f.meio)                                        e.meio         ="Selecione o meio de pagamento";
    if(!f.data)                                        e.data         ="Campo obrigatório";
    if(f.recorrente){
      const dia=parseInt(f.diaVencimento);
      if(!f.diaVencimento||isNaN(dia)||dia<1||dia>31) e.diaVencimento="Informe um dia válido (1–31)";
      if(!f.repeticoes)                                e.repeticoes   ="Selecione quantas repetições";
    }
    return e;
  };
  const validarReceita=f=>{
    const e={};
    if(!f.descricao.trim())                            e.descricao ="Campo obrigatório";
    if(!f.valorDigits||parseInt(f.valorDigits)===0)    e.valor     ="Campo obrigatório";
    if(!f.data)                                        e.data      ="Campo obrigatório";
    return e;
  };
  const lancar=async ()=>{
    const e=validar(form);
    if(Object.keys(e).length){setErro(e);return;}
    const valor = d2float(form.valorDigits);
    const item = {
      id: uid(),
      cliente_id: CID,
      mes: form.data.slice(0,7),
      centro: "empresa",
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor,
      meio: form.meio,
      data: form.data,
      obs: form.obs,
      excluido: false,
      recorrente: form.recorrente,
      motivo_exclusao: "",
    };
    const res = await sbPost(item);
    if(res && form.recorrente){
      const reps=parseInt(form.repeticoes), dia=parseInt(form.diaVencimento);
      const [ano,mes]=form.data.slice(0,7).split("-").map(Number);
      for(let i=1;i<=reps;i++){
        let nm=mes+i, na=ano;
        while(nm>12){nm-=12;na++;}
        const key=`${na}-${padN(nm)}`;
        const novaData=`${key}-${padN(dia)}`;
        await sbPost({id:uid(),cliente_id:CID,mes:key,centro:"empresa",categoria:form.categoria,descricao:form.descricao.trim(),valor,meio:form.meio,data:novaData,obs:form.obs,excluido:false,recorrente:true,motivo_exclusao:""});
      }
    }
    setShowForm(false);
    load();
    showToast(form.recorrente?`✓ Registrado + ${form.repeticoes}x inserido(s) automaticamente`:"✓ Lançamento registrado");
  };
  const lancarReceita=async ()=>{
    const e=validarReceita(formReceita);
    if(Object.keys(e).length){setErroReceita(e);return;}
    const payload={
      id: uid(),
      cliente_id: CID,
      mes: formReceita.data.slice(0,7),
      semana: formReceita.data,
      valor: d2float(formReceita.valorDigits),
      descricao: formReceita.descricao.trim(),
      obs: formReceita.obs,
      data_lancamento: hoje(),
    };
    const res = await rcPost(payload);
    setShowFormReceita(false);
    if(res){ load(); showToast("✓ Receita registrada"); }
  };
  const openEdit=item=>{
    setForm({descricao:item.descricao,valorDigits:float2d(item.valor),categoria:item.categoria,meio:item.meio,data:item.data,obs:item.obs||"",recorrente:false,periodicidade:"Mensal",diaVencimento:"",repeticoes:null});
    setErro({});setEditItem(item);
  };
  const salvarEdicao=async ()=>{
    const e=validar(form);
    if(Object.keys(e).length){setErro(e);return;}
    const ok = await sbPatch(editItem.id, {
      descricao: form.descricao.trim(),
      valor: d2float(form.valorDigits),
      categoria: form.categoria,
      meio: form.meio,
      data: form.data,
      mes: form.data.slice(0,7),
      obs: form.obs,
    });
    setEditItem(null);
    if(ok){ load(); showToast("✓ Lançamento atualizado"); }
  };
  const confirmarExclusao=async ()=>{
    if(!motivoExc.trim()){setMotivoErr(true);return;}
    const ok = await sbPatch(delItem.id, { excluido: true, motivo_exclusao: motivoExc.trim() });
    setDelItem(null);setMotivoExc("");setMotivoErr(false);
    if(ok){ load(); showToast("Lançamento excluído"); }
  };
  const confirmarExclusaoReceita=async ()=>{
    const ok = await rcDelete(delReceita.id);
    setDelReceita(null);
    if(ok){ load(); showToast("Receita excluída"); }
  };
  const anyModal=showForm||showFormReceita||!!editItem||!!delItem||!!delReceita;
  const card={background:"#fff",borderRadius:14,padding:"4px 16px",boxShadow:"0 2px 8px #2980B910",marginBottom:12};
  const rowDiv=last=>({padding:"13px 0",borderBottom:last?"none":"1px solid #EBF5FB",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10});
  const LancRow=({t,last,showEdit})=>(
    <div className={`row-item${t.excluido?" row-excluido":""}`} style={rowDiv(last)}>
      <div style={{display:"flex",gap:10,alignItems:"center",flex:1,minWidth:0}}>
        <div style={{width:4,height:t.excluido?16:40,background:t.excluido?"#ddd":CAT_CORES[t.categoria]||"#999",borderRadius:3,flexShrink:0}}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,color:t.excluido?"#aaa":"#1A5276",fontWeight:700,fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:t.excluido?"line-through":"none"}}>{t.descricao}</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#A9B7C6",fontFamily:"'Nunito',sans-serif"}}>{fmtDate(t.data)} · {t.categoria} · {t.meio}</span>
            {t.recorrente&&!t.excluido&&<span className="badge" style={{background:"#EBF5FB",color:"#2980B9",border:"1px solid #AED6F1"}}>↻ Recorrente</span>}
            {t.categoria==="Liquidação de Fatura"&&!t.excluido&&<span className="badge" style={{background:"#EBF5FB",color:"#2980B9",border:"1px solid #AED6F1"}}>Liquidação</span>}
          </div>
          {t.obs&&!t.excluido&&<div style={{fontSize:11,color:"#A9B7C6",marginTop:1,fontStyle:"italic",fontFamily:"'Nunito',sans-serif"}}>{t.obs}</div>}
          {t.excluido&&<span className="badge" style={{background:"#FDEDEC",color:"#E74C3C",border:"1px solid #F1948A"}}>Valor excluído da soma de valores</span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:800,color:t.excluido?"#bbb":"#1A5276",fontFamily:"'Nunito',sans-serif"}}>{fmt(t.valor)}</div>
        {showEdit&&!t.excluido&&!isFechado&&(
          <button className="icon-btn" onClick={()=>openEdit(t)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
  const ReceitaRow=({r,last})=>(
    <div className="row-item" style={rowDiv(last)}>
      <div style={{display:"flex",gap:10,alignItems:"center",flex:1,minWidth:0}}>
        <div style={{width:4,height:40,background:"#27AE60",borderRadius:3,flexShrink:0}}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,color:"#1A5276",fontWeight:700,fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.descricao}</div>
          <div style={{fontSize:11,color:"#A9B7C6",fontFamily:"'Nunito',sans-serif",marginTop:2}}>{fmtDate(r.semana)}</div>
          {r.obs&&<div style={{fontSize:11,color:"#A9B7C6",marginTop:1,fontStyle:"italic",fontFamily:"'Nunito',sans-serif"}}>{r.obs}</div>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:800,color:"#27AE60",fontFamily:"'Nunito',sans-serif"}}>{fmt(r.valor)}</div>
        {!isFechado&&(
          <button className="icon-btn icon-btn-danger" onClick={()=>setDelReceita(r)} title="Excluir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:"#F0F6FF",minHeight:"100vh",color:"#1A5276",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style>
      {/* HEADER */}
      <div style={{background:"#fff",borderBottom:"1px solid #D5E8F5",padding:"12px 20px 0",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 12px #2980B910"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <Logo size={46}/>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:900,color:"#1A5276",lineHeight:1.1}}>CRIAR</div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"#A9B7C6",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>Centro Educacional</span>
              {lastSync && (
                <span style={{display:"inline-flex",alignItems:"center",gap:4,background:"#EAFAF1",border:"1px solid #27AE6033",borderRadius:16,padding:"2px 8px",fontSize:9,color:"#27AE60",fontWeight:700,letterSpacing:"0.04em"}}>
                  <span style={{width:5,height:5,background:"#27AE60",borderRadius:"50%"}}/>
                  {loading ? "Sync" : "Online"}
                </span>
              )}
            </div>
          </div>
          <button className={`notif-btn${pendencias.length>0?" has-pending":""}`} onClick={()=>setShowPend(o=>!o)} title="Recorrências pendentes">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {pendencias.length>0&&<span className="notif-dot">{pendencias.length}</span>}
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,paddingBottom:6,position:"relative"}}>
          <button className="arrow-btn" disabled={mesIdx===0} onClick={()=>goMes(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{position:"relative"}}>
            <button className="mes-btn" onClick={()=>setShowPicker(o=>!o)}>
              {mesAtual.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2980B9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showPicker&&<MonthPicker mesAtual={mesAtual.mes} onSelect={k=>{const i=MESES.findIndex(m=>m.mes===k);if(i>=0)setMesIdx(i);}} onClose={()=>setShowPicker(false)}/>}
          </div>
          <button className="arrow-btn" disabled={mesIdx===MESES.length-1} onClick={()=>goMes(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div style={{position:"absolute",right:0,display:"flex",gap:4}}>
            {isFechado&&<span className="badge" style={{background:"#F2F3F4",color:"#7F8C8D",border:"1px solid #D5D8DC"}}>Fechado</span>}
            {!isFechado&&items.length>0&&<span className="badge" style={{background:"#FEF9E7",color:"#D68910",border:"1px solid #F9E79F"}}>Parcial</span>}
          </div>
        </div>
        <nav style={{display:"flex",marginTop:2}}>
          {[["inicio","Início"],["caixa","Caixa"],["categorias","Categorias"],["historico","Histórico"]].map(([v,l])=>(
            <button key={v} className="tab" onClick={()=>setView(v)}
              style={{flex:1,background:"none",border:"none",borderBottom:view===v?"2.5px solid #2980B9":"2.5px solid transparent",color:view===v?"#2980B9":"#A9B7C6",padding:"10px 4px",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:800,transition:"all .2s"}}>
              {l}
            </button>
          ))}
        </nav>
      </div>
      {/* PENDÊNCIAS */}
      {showPend&&(
        <div className="overlay-top" onClick={e=>{if(e.target===e.currentTarget)setShowPend(false);}}>
          <div className="sheet-top">
            <div style={{padding:"18px 20px 12px",borderBottom:"1px solid #EBF5FB",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",borderRadius:"20px 20px 0 0"}}>
              <div>
                <div style={{fontSize:16,fontWeight:900,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>Despesas Recorrentes</div>
                <div style={{fontSize:11,color:"#A9B7C6",marginTop:1,fontFamily:"'Nunito',sans-serif"}}>{mesAtual.label} · {pendencias.length===0?"tudo em dia!":"pendente(s) de lançamento"}</div>
              </div>
              <button onClick={()=>setShowPend(false)} style={{background:"none",border:"none",color:"#aaa",fontSize:20,cursor:"pointer"}}>✕</button>
            </div>
            {pendencias.length===0?(
              <div style={{padding:"28px 20px",textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:8}}>✓</div>
                <div style={{fontSize:14,color:"#1A5276",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>Tudo em dia!</div>
                <div style={{fontSize:12,color:"#A9B7C6",marginTop:4,fontFamily:"'Nunito',sans-serif"}}>Nenhuma recorrência pendente para {mesAtual.label}</div>
              </div>
            ):pendencias.map(p=>(
              <div key={p.id} className="pend-item">
                <div style={{display:"flex",gap:10,alignItems:"center",flex:1,minWidth:0}}>
                  <div style={{width:4,height:36,background:CAT_CORES[p.categoria]||"#999",borderRadius:3,flexShrink:0}}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:"#1A5276",fontWeight:700,fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.descricao}</div>
                    <div style={{fontSize:11,color:"#A9B7C6",marginTop:2,fontFamily:"'Nunito',sans-serif"}}>{p.categoria} · {p.meio}</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>{fmt(p.valor)}</div>
                  <div style={{fontSize:10,color:"#E67E22",fontWeight:700,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>↻ RECORRENTE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* CONTEÚDO */}
      <div style={{padding:"20px 16px 120px"}}>
        {view==="inicio"&&(
          <>
            <div style={{background:"#fff",borderRadius:16,padding:"24px 20px",marginBottom:14,boxShadow:"0 2px 12px #2980B910"}}>
              <div style={{fontSize:11,letterSpacing:"0.15em",color:"#A9B7C6",textTransform:"uppercase",marginBottom:4,fontWeight:700}}>Total lançado — {mesAtual.label}</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
                <div style={{fontSize:40,fontWeight:900,color:"#1A5276",lineHeight:1}}>{fmt(total)}</div>
                {mesAnt&&totalAnt>0&&<Comparativo atual={total} anterior={totalAnt} isParcial={!isFechado}/>}
              </div>
              <div style={{fontSize:12,color:"#A9B7C6",marginTop:8,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600}}>{contaveis.length} lançamentos ativos</div>
              {mesAnt&&totalAnt>0&&<div style={{fontSize:10,color:"#D5E8F5",marginTop:4,fontFamily:"'Nunito',sans-serif"}}>Ref.: {mesAnt.label}{!isFechado?` (dias 1–${maxDia})`:""}</div>}
            </div>
            <div style={{fontSize:10,color:"#A9B7C6",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Despesas por Categoria</div>
            <div style={card}>
              {byCat.length===0
                ?<div style={{padding:"24px 0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{color:"#A9B7C6",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Nenhum lançamento ainda.</div></div>
                :byCat.map(({cat,val},i)=>(
                  <div key={cat} style={{padding:"12px 0",borderBottom:i===byCat.length-1?"none":"1px solid #EBF5FB"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:CAT_CORES[cat]||"#999",flexShrink:0}}/>
                        <span style={{fontSize:14,color:"#1A5276",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{cat}</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>{fmt(val)}</span>
                    </div>
                    <Bar percent={total>0?(val/total)*100:0} color={CAT_CORES[cat]||"#999"}/>
                    <div style={{fontSize:10,color:"#A9B7C6",marginTop:4,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>
                      {total>0?((val/total)*100).toFixed(1):0}% do total · {contaveis.filter(t=>t.categoria===cat).length} lançamentos
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}
        {view==="caixa"&&(
          <>
            {/* KPIs principais */}
            <div style={{background:"#fff",borderRadius:16,padding:"20px",marginBottom:14,boxShadow:"0 2px 12px #2980B910"}}>
              <div style={{fontSize:11,letterSpacing:"0.15em",color:"#A9B7C6",textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Fluxo de Caixa — {mesAtual.label}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:"#EAFAF1",borderRadius:12,padding:"14px",border:"1px solid #A9DFBF"}}>
                  <div style={{fontSize:9,letterSpacing:"0.15em",color:"#1E8449",textTransform:"uppercase",fontWeight:800,marginBottom:4}}>Receita</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#1E8449",lineHeight:1}}>{fmt(totalReceita)}</div>
                  <div style={{fontSize:10,color:"#7F8C8D",marginTop:4,fontWeight:600}}>{receitas.length} entrada(s)</div>
                </div>
                <div style={{background:"#FDEDEC",borderRadius:12,padding:"14px",border:"1px solid #F5B7B1"}}>
                  <div style={{fontSize:9,letterSpacing:"0.15em",color:"#B03A2E",textTransform:"uppercase",fontWeight:800,marginBottom:4}}>Despesa</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#B03A2E",lineHeight:1}}>{fmt(total)}</div>
                  <div style={{fontSize:10,color:"#7F8C8D",marginTop:4,fontWeight:600}}>{contaveis.length} saída(s)</div>
                </div>
              </div>
              <div style={{background:saldo>=0?"#EBF5FB":"#FEF5EC",borderRadius:12,padding:"16px 18px",border:`2px solid ${saldo>=0?"#2980B9":"#E67E22"}`}}>
                <div style={{fontSize:10,letterSpacing:"0.15em",color:saldo>=0?"#2980B9":"#B7620F",textTransform:"uppercase",fontWeight:800,marginBottom:4}}>Saldo do Mês</div>
                <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                  <div style={{fontSize:28,fontWeight:900,color:saldo>=0?"#2980B9":"#B7620F",lineHeight:1}}>{fmt(saldo)}</div>
                  <div style={{fontSize:11,color:"#7F8C8D",fontWeight:700}}>{saldo>=0?"positivo":"negativo"}</div>
                </div>
              </div>
            </div>
            {/* Grid semanal */}
            <div style={{fontSize:10,color:"#A9B7C6",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Fluxo Semanal</div>
            <div style={{...card,padding:"8px 4px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr 1fr 1fr",gap:6,padding:"8px 10px",borderBottom:"1px solid #EBF5FB"}}>
                <div style={{fontSize:9,color:"#7F8C8D",fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>Semana</div>
                <div style={{fontSize:9,color:"#1E8449",fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"right"}}>Receita</div>
                <div style={{fontSize:9,color:"#B03A2E",fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"right"}}>Despesa</div>
                <div style={{fontSize:9,color:"#2980B9",fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"right"}}>Saldo</div>
              </div>
              {fluxoSemanal.map((sem,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1.1fr 1fr 1fr 1fr",gap:6,padding:"10px 10px",borderBottom:i===fluxoSemanal.length-1?"none":"1px solid #F0F6FF",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,color:"#1A5276",fontWeight:800}}>{sem.label}</div>
                    <div style={{fontSize:10,color:"#A9B7C6",fontWeight:600,marginTop:1}}>dia {sem.ini}–{sem.fim}</div>
                  </div>
                  <div style={{fontSize:12,color:sem.receita>0?"#1E8449":"#D5E8F5",fontWeight:800,textAlign:"right"}}>{fmt(sem.receita)}</div>
                  <div style={{fontSize:12,color:sem.despesa>0?"#B03A2E":"#D5E8F5",fontWeight:800,textAlign:"right"}}>{fmt(sem.despesa)}</div>
                  <div style={{fontSize:12,color:sem.saldo===0?"#D5E8F5":(sem.saldo>0?"#2980B9":"#E67E22"),fontWeight:900,textAlign:"right"}}>{fmt(sem.saldo)}</div>
                </div>
              ))}
            </div>
            {/* Lista de receitas */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,marginBottom:10}}>
              <div style={{fontSize:10,color:"#A9B7C6",letterSpacing:"0.2em",textTransform:"uppercase",fontWeight:700}}>Recebimentos do Mês</div>
              <div style={{fontSize:11,color:"#A9B7C6",fontWeight:700}}>{receitas.length} entrada(s)</div>
            </div>
            <div style={card}>
              {sortedReceitas.length===0
                ?<div style={{padding:"24px 0",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8}}>💰</div>
                  <div style={{color:"#A9B7C6",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Nenhum recebimento neste mês.</div>
                  {!isFechado&&<div style={{color:"#A9B7C6",fontSize:12,marginTop:4,fontFamily:"'Nunito',sans-serif"}}>Toque em "Nova Receita" abaixo</div>}
                </div>
                :sortedReceitas.map((r,i)=><ReceitaRow key={r.id} r={r} last={i===sortedReceitas.length-1}/>)
              }
            </div>
          </>
        )}
        {view==="categorias"&&(
          <>
            {/* Dashboard: Por meio de pagamento */}
            <div style={{fontSize:22,fontWeight:900,color:"#1A5276",marginBottom:6,fontFamily:"'Nunito',sans-serif"}}>Por Meio de Pagamento</div>
            <div style={{fontSize:11,color:"#A9B7C6",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12,fontWeight:600}}>{mesAtual.label}</div>
            <div style={card}>
              {total===0
                ?<div style={{padding:"24px 0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>💳</div><div style={{color:"#A9B7C6",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Nenhum lançamento neste mês.</div></div>
                :byMeio.map(({meio,val,count},i)=>(
                  <div key={meio} style={{padding:"12px 0",borderBottom:i===byMeio.length-1?"none":"1px solid #EBF5FB"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:MEIO_CORES[meio]||"#999",flexShrink:0}}/>
                        <span style={{fontSize:14,color:"#1A5276",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{meio}</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:val>0?"#1A5276":"#D5E8F5",fontFamily:"'Nunito',sans-serif"}}>{fmt(val)}</span>
                    </div>
                    <Bar percent={total>0?(val/total)*100:0} color={MEIO_CORES[meio]||"#999"}/>
                    <div style={{fontSize:10,color:"#A9B7C6",marginTop:4,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>
                      {total>0?((val/total)*100).toFixed(1):0}% do total · {count} lançamento{count===1?"":"s"}
                    </div>
                  </div>
                ))
              }
            </div>
            {/* Por Categoria (existente, colapsível) */}
            <div style={{fontSize:22,fontWeight:900,color:"#1A5276",marginTop:22,marginBottom:18,fontFamily:"'Nunito',sans-serif"}}>Por Categoria</div>
            {byCat.length===0
              ?<div style={{...card,padding:24,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📂</div><div style={{color:"#A9B7C6",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Nenhum lançamento neste mês.</div></div>
              :byCat.map(({cat,val})=>(
                <CollapsibleSection key={cat} label={cat} count={contaveis.filter(t=>t.categoria===cat).length} valor={val} color={CAT_CORES[cat]||"#999"}>
                  <div style={{...card,marginTop:0}}>
                    {sorted.filter(t=>t.categoria===cat).map((t,i,arr)=><LancRow key={t.id} t={t} last={i===arr.length-1} showEdit={false}/>)}
                  </div>
                </CollapsibleSection>
              ))
            }
          </>
        )}
        {view==="historico"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:22,fontWeight:900,color:"#1A5276",fontFamily:"'Nunito',sans-serif"}}>Histórico</div>
              <div style={{fontSize:11,color:"#A9B7C6",fontWeight:600,fontFamily:"'Nunito',sans-serif"}}>{items.length} lançamentos</div>
            </div>
            <div style={card}>
              {sorted.length===0
                ?<div style={{padding:"24px 0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🗒️</div><div style={{color:"#A9B7C6",fontSize:14,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Nenhum lançamento neste mês.</div></div>
                :sorted.map((t,i)=><LancRow key={t.id} t={t} last={i===sorted.length-1} showEdit={true}/>)
              }
            </div>
          </>
        )}
      </div>
      {/* FAB — muda conforme aba */}
      {!anyModal&&!showPend&&!isFechado&&view!=="caixa"&&(
        <button className="fab" onClick={()=>{setForm(emptyForm());setErro({});setShowForm(true);}}>
          <span style={{fontSize:20,lineHeight:1}}>+</span> Novo Lançamento
        </button>
      )}
      {!anyModal&&!showPend&&!isFechado&&view==="caixa"&&(
        <button className="fab fab-green" onClick={()=>{setFormReceita(emptyFormReceita());setErroReceita({});setShowFormReceita(true);}}>
          <span style={{fontSize:20,lineHeight:1}}>+</span> Nova Receita
        </button>
      )}
      {showForm&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="sheet">
            <div className="handle"/>
            <div style={{fontSize:20,fontWeight:900,color:"#1A5276",marginBottom:20,fontFamily:"'Nunito',sans-serif"}}>Novo Lançamento</div>
            <FormBody form={form} setForm={setForm} erro={erro} setErro={setErro}/>
            <div style={{height:16}}/>
            <button className="btn-primary" onClick={lancar}>Registrar Lançamento</button>
            <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}
      {showFormReceita&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowFormReceita(false);}}>
          <div className="sheet">
            <div className="handle"/>
            <div style={{fontSize:20,fontWeight:900,color:"#1E8449",marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>Nova Receita</div>
            <div style={{fontSize:11,color:"#A9B7C6",marginBottom:18,fontFamily:"'Nunito',sans-serif"}}>Registro de recebimento em caixa</div>
            <FormBodyReceita form={formReceita} setForm={setFormReceita} erro={erroReceita} setErro={setErroReceita}/>
            <div style={{height:16}}/>
            <button className="btn-success" onClick={lancarReceita}>Registrar Receita</button>
            <button className="btn-ghost" onClick={()=>setShowFormReceita(false)}>Cancelar</button>
          </div>
        </div>
      )}
      {editItem&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setEditItem(null);}}>
          <div className="sheet">
            <div className="handle"/>
            <div style={{fontSize:20,fontWeight:900,color:"#1A5276",marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>Editar Lançamento</div>
            <div style={{fontSize:11,color:"#A9B7C6",marginBottom:18,fontFamily:"'Nunito',sans-serif"}}>#{editItem.id} · {fmtDate(editItem.data)}</div>
            <FormBody form={form} setForm={setForm} erro={erro} setErro={setErro}/>
            <div style={{height:16}}/>
            <button className="btn-primary" onClick={salvarEdicao}>Salvar Alterações</button>
            <button className="btn-danger" onClick={()=>{setDelItem(editItem);setEditItem(null);}}>Excluir Lançamento</button>
            <button className="btn-ghost" onClick={()=>setEditItem(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {delItem&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setDelItem(null);setMotivoExc("");setMotivoErr(false);}}}>
          <div className="sheet">
            <div className="handle"/>
            <div style={{fontSize:18,fontWeight:900,color:"#E74C3C",marginBottom:6,fontFamily:"'Nunito',sans-serif"}}>Excluir Lançamento</div>
            <div style={{fontSize:14,color:"#1A5276",marginBottom:2,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{delItem.descricao}</div>
            <div style={{fontSize:13,color:"#A9B7C6",marginBottom:20,fontFamily:"'Nunito',sans-serif"}}>{fmt(delItem.valor)} · {fmtDate(delItem.data)}</div>
            <div style={{background:"#FDEDEC",border:"1px solid #F1948A33",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#E74C3C",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>
              Valor excluído da soma de valores.
            </div>
            <label style={FL}>Motivo da Exclusão *</label>
            <textarea placeholder="Descreva o motivo..." value={motivoExc} onChange={e=>{setMotivoExc(e.target.value);setMotivoErr(false);}}
              style={{background:"#F8FBFF",border:`2px solid ${motivoErr?"#E74C3C":"#D5E8F5"}`,borderRadius:10,color:"#1A5276",padding:"13px 14px",fontSize:14,fontFamily:"'Nunito',sans-serif",width:"100%",minHeight:90,resize:"none"}}/>
            {motivoErr&&<div style={{fontSize:11,color:"#E74C3C",marginTop:4,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>Informe o motivo da exclusão</div>}
            <div style={{height:16}}/>
            <button className="btn-primary" style={{background:"#E74C3C"}} onClick={confirmarExclusao}>Confirmar Exclusão</button>
            <button className="btn-ghost" onClick={()=>{setDelItem(null);setMotivoExc("");setMotivoErr(false);}}>Cancelar</button>
          </div>
        </div>
      )}
      {delReceita&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setDelReceita(null);}}>
          <div className="sheet">
            <div className="handle"/>
            <div style={{fontSize:18,fontWeight:900,color:"#E74C3C",marginBottom:6,fontFamily:"'Nunito',sans-serif"}}>Excluir Receita</div>
            <div style={{fontSize:14,color:"#1A5276",marginBottom:2,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{delReceita.descricao}</div>
            <div style={{fontSize:13,color:"#A9B7C6",marginBottom:20,fontFamily:"'Nunito',sans-serif"}}>{fmt(delReceita.valor)} · {fmtDate(delReceita.semana)}</div>
            <div style={{background:"#FDEDEC",border:"1px solid #F1948A33",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#E74C3C",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>
              Este recebimento será removido do fluxo de caixa.
            </div>
            <button className="btn-primary" style={{background:"#E74C3C"}} onClick={confirmarExclusaoReceita}>Confirmar Exclusão</button>
            <button className="btn-ghost" onClick={()=>setDelReceita(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}
