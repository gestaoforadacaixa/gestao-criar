import { useState, useEffect, useMemo } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────────
const SUPA_URL = "https://oltwaosdzgvbbvermilk.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHdhb3Nkemd2YmJ2ZXJtaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDU3MjksImV4cCI6MjA5NDEyMTcyOX0.WbDR65w6eywTgLc4Lwii_63RrJwKPN9oj1DsgjxeFBo";
const CID = "criar";
const H = {
  "Content-Type": "application/json",
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Prefer": "return=representation",
};

const sbGet = async (mes) => {
  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/lancamentos?cliente_id=eq.${CID}&mes=eq.${mes}&order=data.desc`,
      { headers: H }
    );
    return r.ok ? r.json() : [];
  } catch { return []; }
};

const sbPost = async (body) => {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos`, {
      method: "POST", headers: H, body: JSON.stringify(body),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
};

const sbPatch = async (id, body) => {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/lancamentos?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...H, "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch { return false; }
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────────
// Categorias reais do app CRIAR conforme documento
const CATEGORIAS = [
  "Administrativo",
  "Alimentação",
  "Infraestrutura",
  "Material Didático",
  "Mensalidades",
  "Salários",
  "Serviços",
  "Transporte",
];

const MEIOS = ["Crédito", "Débito", "Dinheiro", "Pix", "Transferência"];

const MESES = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
const ML = {
  "2026-04": "Abril 2026",    "2026-05": "Maio 2026",
  "2026-06": "Junho 2026",    "2026-07": "Julho 2026",
  "2026-08": "Agosto 2026",   "2026-09": "Setembro 2026",
};

const CAT_COR = {
  "Administrativo":   "#E67E22",
  "Alimentação":      "#F39C12",
  "Infraestrutura":   "#2980B9",
  "Material Didático":"#8E44AD",
  "Mensalidades":     "#27AE60",
  "Salários":         "#E91E8C",
  "Serviços":         "#16A085",
  "Transporte":       "#7F8C8D",
};

const fmt  = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().slice(0, 10);
const uid  = () => crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();
const fd   = d => { const [, m, day] = d.split("-"); return `${day}/${m}`; };

// ─── CSS ──────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #F0F6FF; font-family: 'Nunito', sans-serif; color: #1A5276; min-height: 100vh; }

.inp { width: 100%; border: 2px solid #D5E8F5; border-radius: 10px; padding: 12px 14px; font-size: 15px; font-family: 'Nunito', sans-serif; background: #F8FBFF; color: #1A5276; outline: none; transition: border .18s; -webkit-appearance: none; appearance: none; }
.inp:focus { border-color: #2980B9; box-shadow: 0 0 0 3px rgba(41,128,185,0.10); }
.inp::placeholder { color: #BDC3C7; }
.inp-err { border-color: #E74C3C !important; }

.btn { width: 100%; border: none; border-radius: 12px; padding: 15px; font-size: 14px; font-family: 'Nunito', sans-serif; font-weight: 800; cursor: pointer; transition: all .2s; }
.btn-main { background: #2980B9; color: #fff; }
.btn-main:hover { background: #1F618D; }
.btn-main:disabled { background: #D5E8F5; color: #A9B7C6; cursor: not-allowed; }
.btn-ghost { background: none; border: 2px solid #D5E8F5; color: #7F8C8D; margin-top: 10px; }
.btn-ghost:hover { border-color: #aaa; color: #555; }
.btn-del { background: none; border: 2px solid #E74C3C; color: #E74C3C; margin-top: 10px; }
.btn-del:hover { background: #E74C3C; color: #fff; }

.fab { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #2980B9, #8E44AD); color: #fff; border: none; border-radius: 50px; padding: 14px 26px; font-size: 13px; font-family: 'Nunito', sans-serif; font-weight: 800; cursor: pointer; box-shadow: 0 6px 24px rgba(41,128,185,0.35); z-index: 90; white-space: nowrap; display: flex; align-items: center; gap: 8px; transition: all .2s; }
.fab:hover { transform: translateX(-50%) translateY(-2px); }
.fab:active { transform: translateX(-50%) scale(.97); }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 200; display: flex; align-items: flex-end; backdrop-filter: blur(2px); }
.sheet { background: #fff; border-radius: 24px 24px 0 0; padding: 8px 20px 48px; width: 100%; max-width: 480px; margin: 0 auto; max-height: 92vh; overflow-y: auto; animation: sheetUp .26s cubic-bezier(.32,.72,0,1); }
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.handle { width: 40px; height: 4px; background: #E8EDF5; border-radius: 2px; margin: 12px auto 20px; }

.row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 13px 0; border-bottom: 1px solid #EBF5FB; }
.row:last-child { border-bottom: none; }

.tab-b { flex: 1; background: none; border: none; border-bottom: 2.5px solid transparent; color: #A9B7C6; padding: 10px 4px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 800; transition: all .2s; }
.tab-b.on { color: #2980B9; border-bottom-color: #2980B9; }
.tab-b:hover { color: #1A5276; }

.coll { background: #fff; border-radius: 14px; margin-bottom: 10px; overflow: hidden; border: 1px solid #D5E8F5; box-shadow: 0 2px 8px rgba(41,128,185,0.07); }
.coll-h { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background .15s; }
.coll-h:hover { background: #F8FBFF; }
.coll-b { border-top: 1px solid #EBF5FB; padding: 0 16px; }

.badge-rec { display: inline-block; background: #EBF5FB; color: #2980B9; border: 1px solid #AED6F1; border-radius: 20px; padding: 1px 7px; font-size: 9px; font-weight: 700; margin-left: 6px; }
.badge-exc { display: inline-block; background: #FDEDEC; color: #E74C3C; border: 1px solid #F1948A; border-radius: 20px; padding: 1px 7px; font-size: 9px; font-weight: 700; margin-top: 3px; }

.notif-btn { position: relative; background: none; border: 2px solid #D5E8F5; border-radius: 10px; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #7F8C8D; transition: all .2s; flex-shrink: 0; }
.notif-btn:hover, .notif-btn.has-pending { border-color: #E67E22; color: #E67E22; background: #FEF5EC; }
.notif-dot { position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; background: #E67E22; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff; font-weight: 700; border: 2px solid #F0F6FF; }

.toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1A5276; color: #fff; padding: 11px 22px; border-radius: 50px; font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700; z-index: 500; white-space: nowrap; pointer-events: none; animation: toastIn .22s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

.pend-item { padding: 14px 20px; border-bottom: 1px solid #EBF5FB; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.pend-item:last-child { border-bottom: none; }

.overlay-top { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 200; display: flex; align-items: flex-start; padding-top: 120px; }
.sheet-top { background: #fff; border-radius: 20px; padding: 0 0 20px; width: calc(100% - 32px); max-width: 448px; margin: 0 auto; animation: fadeDown .22s ease; max-height: 70vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.spin { display: inline-block; width: 14px; height: 14px; border: 2px solid #D5E8F5; border-top-color: #2980B9; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: #AED6F1; border-radius: 2px; }
`;

// ─── BAR ──────────────────────────────────────────────────────────────────────────
function Bar({ p, color }) {
  return (
    <div style={{ background: "#E8F4FD", borderRadius: 4, height: 6, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${Math.min(Math.max(p, 0), 100)}%`, background: color, height: "100%", borderRadius: 4, transition: "width .5s ease" }} />
    </div>
  );
}

// ─── FORM ────────────────────────────────────────────────────────────────────────
function FormSheet({ mes, onSaved, onClose }) {
  const [cat,  setCat]  = useState("");
  const [desc, setDesc] = useState("");
  const [val,  setVal]  = useState("");
  const [meio, setMeio] = useState("Pix");
  const [data, setData] = useState(mes + "-" + new Date().toISOString().slice(8, 10));
  const [obs,  setObs]  = useState("");
  const [rec,  setRec]  = useState(false);
  const [err,  setErr]  = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k, v) => {
    if (k === "cat")   setCat(v);
    else if (k === "desc") setDesc(v);
    else if (k === "val")  setVal(v);
    else if (k === "meio") setMeio(v);
    else if (k === "data") setData(v);
    else setObs(v);
    setErr(e => ({ ...e, [k]: false }));
  };

  const salvar = async () => {
    const e = {};
    if (!cat)         e.cat  = true;
    if (!desc.trim()) e.desc = true;
    const v = parseFloat(val.replace(",", "."));
    if (!v || v <= 0) e.val  = true;
    if (!data)        e.data = true;
    if (Object.keys(e).length) { setErr(e); return; }
    setBusy(true);
    const item = {
      id:              uid(),
      cliente_id:      CID,
      mes,
      centro:          "empresa",
      categoria:       cat,
      descricao:       desc.trim(),
      valor:           v,
      meio,
      data,
      obs,
      excluido:        false,
      recorrente:      rec,
      motivo_exclusao: "",
    };
    const res = await sbPost(item);
    setBusy(false);
    if (res) { onSaved(); onClose(); }
    else setErr({ geral: "Erro ao salvar. Verifique a conexão." });
  };

  const LBL = { fontSize: 10, color: "#7F8C8D", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 7 };
  const E = ({ k }) => err[k] ? <div style={{ fontSize: 11, color: "#E74C3C", marginTop: 4, fontWeight: 700 }}>Obrigatório</div> : null;

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1A5276", marginBottom: 20 }}>Novo Lançamento</div>

        {err.geral && (
          <div style={{ background: "#FDEDEC", border: "1px solid #F1948A", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#E74C3C", marginBottom: 14, fontWeight: 700 }}>
            {err.geral}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Categoria *</label>
          <select className={`inp${err.cat ? " inp-err" : ""}`} value={cat} onChange={e => set("cat", e.target.value)}>
            <option value="">Selecione…</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <E k="cat" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Descrição *</label>
          <input className={`inp${err.desc ? " inp-err" : ""}`}
            placeholder="Ex: Salário — Nome, SABESP, JBS Dedetizadora…"
            value={desc} onChange={e => set("desc", e.target.value)} />
          <E k="desc" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Valor (R$) *</label>
          <input className={`inp${err.val ? " inp-err" : ""}`}
            type="number" inputMode="decimal" placeholder="0,00"
            value={val} onChange={e => set("val", e.target.value)} />
          <E k="val" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={LBL}>Meio</label>
            <select className="inp" value={meio} onChange={e => set("meio", e.target.value)}>
              {MEIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Data *</label>
            <input className={`inp${err.data ? " inp-err" : ""}`} type="date" value={data} onChange={e => set("data", e.target.value)} />
            <E k="data" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LBL}>Observação</label>
          <textarea className="inp" style={{ minHeight: 60, resize: "none", fontSize: 13 }}
            placeholder="Cargo, referência, nota fiscal…"
            value={obs} onChange={e => set("obs", e.target.value)} />
        </div>

        {/* Recorrente */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #EBF5FB", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A5276" }}>Despesa Recorrente</div>
            <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 1 }}>Repete mensalmente</div>
          </div>
          <div
            style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", background: rec ? "#2980B9" : "#D5E8F5", display: "flex", alignItems: "center", padding: 2, transition: "background .2s", flexShrink: 0 }}
            onClick={() => setRec(r => !r)}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "transform .2s", transform: rec ? "translateX(20px)" : "none" }} />
          </div>
        </div>

        <button className="btn btn-main" onClick={salvar} disabled={busy}>
          {busy ? <><span className="spin" /> Salvando…</> : "✓ Registrar Lançamento"}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── EXCLUIR ─────────────────────────────────────────────────────────────────────
function DelSheet({ item, onDone, onClose }) {
  const [motivo, setMotivo] = useState("");
  const [err,    setErr]    = useState(false);
  const [busy,   setBusy]   = useState(false);

  const confirmar = async () => {
    if (!motivo.trim()) { setErr(true); return; }
    setBusy(true);
    const ok = await sbPatch(item.id, { excluido: true, motivo_exclusao: motivo.trim() });
    setBusy(false);
    if (ok) { onDone(); onClose(); }
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontSize: 18, fontWeight: 900, color: "#E74C3C", marginBottom: 6 }}>Excluir Lançamento</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A5276", marginBottom: 2 }}>{item.descricao}</div>
        <div style={{ fontSize: 13, color: "#A9B7C6", marginBottom: 18 }}>{fmt(item.valor)} · {fd(item.data)}</div>
        <div style={{ background: "#FDEDEC", border: "1px solid #F1948A44", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: "#E74C3C", fontWeight: 700 }}>
          O valor será excluído da soma total.
        </div>
        <label style={{ fontSize: 10, color: "#7F8C8D", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 7 }}>Motivo *</label>
        <textarea
          className={`inp${err ? " inp-err" : ""}`}
          style={{ minHeight: 76, resize: "none" }}
          placeholder="Descreva o motivo…"
          value={motivo}
          onChange={e => { setMotivo(e.target.value); setErr(false); }} />
        {err && <div style={{ fontSize: 11, color: "#E74C3C", marginTop: 4, fontWeight: 700 }}>Informe o motivo</div>}
        <div style={{ height: 16 }} />
        <button className="btn btn-del" onClick={confirmar} disabled={busy}>
          {busy ? <><span className="spin" /> Excluindo…</> : "Confirmar Exclusão"}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── CAT CARD ─────────────────────────────────────────────────────────────────────
function CatCard({ cat, val, total, sorted, RowComp }) {
  const [open, setOpen] = useState(false);
  const catItems = sorted.filter(t => t.categoria === cat);
  return (
    <div style={{ background: "#fff", borderRadius: 14, marginBottom: 10, overflow: "hidden", border: "1px solid #D5E8F5", boxShadow: "0 2px 8px rgba(41,128,185,0.07)" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: CAT_COR[cat] || "#999" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A5276" }}>{cat}</div>
            <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 1 }}>{catItems.filter(t => !t.excluido).length} lançamentos</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A5276" }}>{fmt(val)}</div>
          <div style={{ color: "#A9B7C6", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</div>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #EBF5FB", padding: "0 16px" }}>
          <div style={{ padding: "8px 0 4px" }}>
            <div style={{ background: "#E8F4FD", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{ width: `${total > 0 ? (val / total) * 100 : 0}%`, background: CAT_COR[cat] || "#999", height: "100%", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: "#A9B7C6", marginTop: 4 }}>{total > 0 ? ((val / total) * 100).toFixed(1) : 0}% do total</div>
          </div>
          {catItems.map(t => <RowComp key={t.id} t={t} />)}
        </div>
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────────
export default function AppCriar() {
  const [mesIdx,    setMesIdx]    = useState(0);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState("inicio");
  const [showForm,  setShowForm]  = useState(false);
  const [showPend,  setShowPend]  = useState(false);
  const [del,       setDel]       = useState(null);
  const [editItem,  setEditItem]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [prevItems, setPrevItems] = useState([]);

  const mes    = MESES[mesIdx];
  const mesAnt = mesIdx > 0 ? MESES[mesIdx - 1] : null;

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const d = await sbGet(mes);
    setItems(d || []);
    if (!silent) setLoading(false);
  };

  const loadPrev = async () => {
    if (!mesAnt) { setPrevItems([]); return; }
    const d = await sbGet(mesAnt);
    setPrevItems(d || []);
  };

  useEffect(() => { setItems([]); load(); loadPrev(); }, [mes]);
  useEffect(() => {
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
  }, [mes]);

  const showToast = m => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const ativos   = useMemo(() => items.filter(t => !t.excluido), [items]);
  const total    = useMemo(() => ativos.reduce((s, t) => s + t.valor, 0), [ativos]);
  const sorted   = useMemo(() => [...items].sort((a, b) => b.data.localeCompare(a.data)), [items]);

  // Comparativo com mês anterior
  const maxDia   = useMemo(() => { const d = items.map(t => parseInt(t.data.slice(8, 10))); return d.length ? Math.max(...d) : 31; }, [items]);
  const totalAnt = useMemo(() => prevItems.filter(t => !t.excluido && parseInt(t.data.slice(8, 10)) <= maxDia).reduce((s, t) => s + t.valor, 0), [prevItems, maxDia]);

  const byCat = useMemo(() => {
    const m = {};
    ativos.forEach(t => { m[t.categoria] = (m[t.categoria] || 0) + t.valor; });
    return Object.entries(m).map(([cat, val]) => ({ cat, val })).sort((a, b) => b.val - a.val);
  }, [ativos]);

  // Pendências recorrentes
  const pendencias = useMemo(() => {
    if (!mesAnt) return [];
    return prevItems
      .filter(t => t.recorrente && !t.excluido)
      .filter(base => !items.some(t => t.descricao === base.descricao && !t.excluido));
  }, [items, prevItems, mesAnt]);

  const Row = ({ t, showEdit = false }) => (
    <div className="row" style={{ opacity: t.excluido ? 0.4 : 1 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
        <div style={{ width: 4, height: 36, background: t.excluido ? "#D5E8F5" : (CAT_COR[t.categoria] || "#999"), borderRadius: 3, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.excluido ? "#A9B7C6" : "#1A5276", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: t.excluido ? "line-through" : "none" }}>
            {t.descricao}
            {t.recorrente && !t.excluido && <span className="badge-rec">↻ REC</span>}
          </div>
          <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 2 }}>
            {fd(t.data)} · {t.categoria} · {t.meio}
          </div>
          {t.obs && !t.excluido && (
            <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 1, fontStyle: "italic" }}>{t.obs}</div>
          )}
          {t.excluido && <span className="badge-exc">Valor excluído da soma</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.excluido ? "#BDC3C7" : "#1A5276" }}>{fmt(t.valor)}</div>
        {!t.excluido && showEdit && (
          <button
            onClick={() => setEditItem(t)}
            style={{ background: "none", border: "1px solid #D5E8F5", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "#A9B7C6", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#2980B9"}
            onMouseLeave={e => e.currentTarget.style.color = "#A9B7C6"}>
            ✎
          </button>
        )}
        {!t.excluido && !showEdit && (
          <button
            onClick={() => setDel(t)}
            style={{ background: "none", border: "1px solid #D5E8F5", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "#A9B7C6", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#E74C3C"}
            onMouseLeave={e => e.currentTarget.style.color = "#A9B7C6"}>
            ✕
          </button>
        )}
      </div>
    </div>
  );

  // Modal editar
  const EditSheet = ({ item, onDone, onClose }) => {
    const [cat,  setCat]  = useState(item.categoria);
    const [desc, setDesc] = useState(item.descricao);
    const [val,  setVal]  = useState(String(item.valor));
    const [meio, setMeio] = useState(item.meio);
    const [data, setData] = useState(item.data);
    const [obs,  setObs]  = useState(item.obs || "");
    const [busy, setBusy] = useState(false);
    const [delMode, setDelMode] = useState(false);
    const [motivo, setMotivo]   = useState("");
    const [mErr,   setMErr]     = useState(false);

    const salvar = async () => {
      const v = parseFloat(val.replace(",", "."));
      if (!cat || !desc.trim() || !v || !data) return;
      setBusy(true);
      await sbPatch(item.id, { categoria: cat, descricao: desc.trim(), valor: v, meio, data, obs });
      setBusy(false);
      onDone();
      onClose();
    };

    const excluir = async () => {
      if (!motivo.trim()) { setMErr(true); return; }
      setBusy(true);
      await sbPatch(item.id, { excluido: true, motivo_exclusao: motivo.trim() });
      setBusy(false);
      onDone();
      onClose();
    };

    const LBL = { fontSize: 10, color: "#7F8C8D", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 7 };

    return (
      <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet">
          <div className="handle" />
          {!delMode ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1A5276", marginBottom: 20 }}>Editar Lançamento</div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Categoria</label>
                <select className="inp" value={cat} onChange={e => setCat(e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Descrição</label>
                <input className="inp" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LBL}>Valor (R$)</label>
                <input className="inp" type="number" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={LBL}>Meio</label>
                  <select className="inp" value={meio} onChange={e => setMeio(e.target.value)}>
                    {MEIOS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Data</label>
                  <input className="inp" type="date" value={data} onChange={e => setData(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>Observação</label>
                <textarea className="inp" style={{ minHeight: 56, resize: "none", fontSize: 13 }} value={obs} onChange={e => setObs(e.target.value)} />
              </div>
              <button className="btn btn-main" onClick={salvar} disabled={busy}>
                {busy ? <><span className="spin" /> Salvando…</> : "✓ Salvar Alterações"}
              </button>
              <button className="btn btn-del" onClick={() => setDelMode(true)}>Excluir Lançamento</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#E74C3C", marginBottom: 6 }}>Excluir Lançamento</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A5276", marginBottom: 2 }}>{item.descricao}</div>
              <div style={{ fontSize: 13, color: "#A9B7C6", marginBottom: 18 }}>{fmt(item.valor)} · {fd(item.data)}</div>
              <div style={{ background: "#FDEDEC", border: "1px solid #F1948A44", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: "#E74C3C", fontWeight: 700 }}>
                O valor será excluído da soma total.
              </div>
              <label style={LBL}>Motivo *</label>
              <textarea className={`inp${mErr ? " inp-err" : ""}`} style={{ minHeight: 76, resize: "none" }}
                placeholder="Descreva o motivo…" value={motivo}
                onChange={e => { setMotivo(e.target.value); setMErr(false); }} />
              {mErr && <div style={{ fontSize: 11, color: "#E74C3C", marginTop: 4, fontWeight: 700 }}>Informe o motivo</div>}
              <div style={{ height: 16 }} />
              <button className="btn btn-del" onClick={excluir} disabled={busy}>
                {busy ? <><span className="spin" /> Excluindo…</> : "Confirmar Exclusão"}
              </button>
              <button className="btn btn-ghost" onClick={() => setDelMode(false)}>Voltar</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const anyModal = showForm || !!del || !!editItem;

  return (
    <div style={{ background: "#F0F6FF", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D5E8F5", padding: "14px 20px 0", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(41,128,185,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <svg width="46" height="46" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="50" fill="white" />
            {[{ color: "#E67E22", rot: 0 }, { color: "#8E44AD", rot: -72 }, { color: "#2980B9", rot: 72 }, { color: "#27AE60", rot: -144 }, { color: "#E91E8C", rot: 144 }].map(({ color, rot }, i) => (
              <g key={i} transform={`rotate(${rot} 50 50)`}>
                <ellipse cx="50" cy="24" rx="9" ry="13" fill={color} />
                <ellipse cx="43" cy="14" rx="2.2" ry="5" fill={color} transform="rotate(-15 43 14)" />
                <ellipse cx="47" cy="12" rx="2.2" ry="5" fill={color} transform="rotate(-5 47 12)" />
                <ellipse cx="51" cy="12" rx="2.2" ry="5" fill={color} transform="rotate(5 51 12)" />
                <ellipse cx="55" cy="13" rx="2.2" ry="5" fill={color} transform="rotate(15 55 13)" />
              </g>
            ))}
            <text x="50" y="52" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="9" fontWeight="900" fill="#1A5276" letterSpacing="2">CRIAR</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1A5276", lineHeight: 1 }}>CRIAR</div>
            <div style={{ fontSize: 11, color: "#A9B7C6", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 }}>Centro Educacional</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loading && <span className="spin" />}
            <button className={`notif-btn${pendencias.length > 0 ? " has-pending" : ""}`} onClick={() => setShowPend(o => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {pendencias.length > 0 && <span className="notif-dot">{pendencias.length}</span>}
            </button>
          </div>
        </div>

        {/* Mês */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "#F8FBFF", borderRadius: 10, padding: "6px 10px", border: "1px solid #D5E8F5" }}>
          <button onClick={() => setMesIdx(i => Math.max(0, i - 1))} disabled={mesIdx === 0}
            style={{ background: "none", border: "none", color: mesIdx === 0 ? "#D5E8F5" : "#7F8C8D", cursor: mesIdx === 0 ? "not-allowed" : "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>‹</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#1A5276" }}>{ML[mes]}</div>
          <button onClick={() => setMesIdx(i => Math.min(MESES.length - 1, i + 1))} disabled={mesIdx === MESES.length - 1}
            style={{ background: "none", border: "none", color: mesIdx === MESES.length - 1 ? "#D5E8F5" : "#7F8C8D", cursor: mesIdx === MESES.length - 1 ? "not-allowed" : "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>›</button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #EBF5FB" }}>
          {[["inicio", "Início"], ["historico", "Histórico"], ["categorias", "Categorias"]].map(([v, l]) => (
            <button key={v} className={`tab-b${view === v ? " on" : ""}`} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* PENDÊNCIAS */}
      {showPend && (
        <div className="overlay-top" onClick={e => { if (e.target === e.currentTarget) setShowPend(false); }}>
          <div className="sheet-top">
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #EBF5FB", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", borderRadius: "20px 20px 0 0" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#1A5276" }}>Despesas Recorrentes</div>
                <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 1 }}>{ML[mes]} · {pendencias.length === 0 ? "tudo em dia!" : `${pendencias.length} pendente(s)`}</div>
              </div>
              <button onClick={() => setShowPend(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {pendencias.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 14, color: "#1A5276", fontWeight: 800 }}>Tudo em dia!</div>
                <div style={{ fontSize: 12, color: "#A9B7C6", marginTop: 4 }}>Nenhuma recorrência pendente para {ML[mes]}</div>
              </div>
            ) : pendencias.map(p => (
              <div key={p.id} className="pend-item">
                <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                  <div style={{ width: 4, height: 36, background: CAT_COR[p.categoria] || "#999", borderRadius: 3, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#1A5276", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.descricao}</div>
                    <div style={{ fontSize: 11, color: "#A9B7C6", marginTop: 2 }}>{p.categoria} · {p.meio}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1A5276" }}>{fmt(p.valor)}</div>
                  <div style={{ fontSize: 10, color: "#E67E22", fontWeight: 700, marginTop: 2 }}>↻ RECORRENTE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO */}
      <div style={{ padding: "20px 16px 100px" }}>

        {/* INÍCIO */}
        {view === "inicio" && (
          <>
            <div style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(41,128,185,0.08)", borderLeft: "4px solid #2980B9" }}>
              <div style={{ fontSize: 10, color: "#A9B7C6", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>Total — {ML[mes]}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#1A5276", lineHeight: 1, marginBottom: 6 }}>
                {loading && !items.length ? "…" : fmt(total)}
              </div>
              <div style={{ fontSize: 12, color: "#A9B7C6", letterSpacing: ".08em", textTransform: "uppercase" }}>
                {ativos.length} lançamentos ativos
              </div>

              {/* Comparativo */}
              {mesAnt && totalAnt > 0 && (() => {
                const diff = ((total - totalAnt) / totalAnt) * 100;
                const baixo = diff < 0;
                const cor = baixo ? "#27AE60" : "#E74C3C";
                return (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: baixo ? "#EAFAF1" : "#FDEDEC", border: `1px solid ${cor}30`, borderRadius: 8, padding: "4px 10px", marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: cor, fontWeight: 800 }}>{baixo ? "▼" : "▲"} {Math.abs(diff).toFixed(1)}%</span>
                    <span style={{ fontSize: 10, color: "#7F8C8D", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700 }}>vs mês anterior</span>
                  </div>
                );
              })()}

              {/* Mini barras categorias */}
              {total > 0 && (
                <div style={{ marginTop: 14 }}>
                  {byCat.slice(0, 3).map(({ cat, val }) => (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#7F8C8D", fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontSize: 12, color: CAT_COR[cat] || "#999", fontWeight: 800 }}>{fmt(val)}</span>
                      </div>
                      <div style={{ background: "#E8F4FD", borderRadius: 4, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${total > 0 ? (val / total) * 100 : 0}%`, background: CAT_COR[cat] || "#999", height: "100%", borderRadius: 4, transition: "width .6s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: "#A9B7C6", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              {items.length > 0 ? "Últimos lançamentos" : "Nenhum lançamento neste mês"}
            </div>

            {loading && !items.length ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#A9B7C6" }}><span className="spin" /></div>
            ) : items.length > 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "0 16px", boxShadow: "0 2px 8px rgba(41,128,185,0.07)" }}>
                {sorted.slice(0, 10).map(t => <Row key={t.id} t={t} />)}
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, padding: "32px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(41,128,185,0.07)" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1A5276", marginBottom: 6 }}>Sem lançamentos</div>
                <div style={{ fontSize: 13, color: "#A9B7C6", lineHeight: 1.5 }}>Toque em "+ Novo Lançamento"<br />para registrar uma despesa.</div>
              </div>
            )}
          </>
        )}

        {/* HISTÓRICO */}
        {view === "historico" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#A9B7C6", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 600 }}>{items.length} lançamentos — {ML[mes]}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A5276" }}>{fmt(total)}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "0 16px", boxShadow: "0 2px 8px rgba(41,128,185,0.07)" }}>
              {sorted.length === 0
                ? <div style={{ padding: "32px 0", textAlign: "center", color: "#A9B7C6", fontSize: 14 }}>Nenhum lançamento neste mês.</div>
                : sorted.map(t => <Row key={t.id} t={t} showEdit={true} />)
              }
            </div>
          </>
        )}

        {/* CATEGORIAS */}
        {view === "categorias" && (
          <>
            <div style={{ fontSize: 10, color: "#A9B7C6", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>
              Categorias — {ML[mes]}
            </div>
            {byCat.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#A9B7C6", fontSize: 14 }}>Nenhum lançamento neste mês.</div>
            ) : (
              byCat.map(({ cat, val }) => (
                <CatCard key={cat} cat={cat} val={val} total={total} sorted={sorted} RowComp={Row} />
              ))
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {!anyModal && !showPend && (
        <button className="fab" onClick={() => setShowForm(true)}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Novo Lançamento
        </button>
      )}

      {showForm && <FormSheet mes={mes} onSaved={() => { load(); showToast("✓ Lançamento registrado"); }} onClose={() => setShowForm(false)} />}
      {del && <DelSheet item={del} onDone={() => { load(); showToast("Lançamento excluído"); }} onClose={() => setDel(null)} />}
      {editItem && <EditSheet item={editItem} onDone={() => { load(); showToast("✓ Lançamento atualizado"); }} onClose={() => setEditItem(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
