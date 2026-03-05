import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// FIREBASE CONFIG
// Remplace ces valeurs par celles de ta console Firebase
// https://console.firebase.google.com
// ═══════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "REMPLACE_PAR_TON_API_KEY",
  authDomain:        "REMPLACE_PAR_TON_AUTH_DOMAIN",
  projectId:         "REMPLACE_PAR_TON_PROJECT_ID",
  storageBucket:     "REMPLACE_PAR_TON_STORAGE_BUCKET",
  messagingSenderId: "REMPLACE_PAR_TON_MESSAGING_SENDER_ID",
  appId:             "REMPLACE_PAR_TON_APP_ID",
};

// ── Firebase SDK (chargé dynamiquement depuis CDN) ───────────────
// IMPORTANT : ces fonctions sont des STUBS tant que Firebase
// n'est pas configuré — l'app fonctionne en mode local.
// Dès que tu colles ta config, tout se connecte automatiquement.

let _db   = null;
let _auth = null;
let _initialized = false;

async function initFirebase() {
  if (_initialized) return { db:_db, auth:_auth };
  if (FIREBASE_CONFIG.apiKey === "REMPLACE_PAR_TON_API_KEY") {
    console.warn("⚠️  Firebase non configuré — mode démo local activé");
    _initialized = true;
    return { db:null, auth:null };
  }
  try {
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
    );
    const { getFirestore, collection, doc, setDoc,
            getDocs, onSnapshot, deleteDoc, updateDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
    );
    const { getAuth, signInWithEmailAndPassword,
            createUserWithEmailAndPassword, signOut } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
    );
    const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _db   = getFirestore(app);
    _auth = getAuth(app);
    window.__fb = { collection, doc, setDoc, getDocs, onSnapshot,
                    deleteDoc, updateDoc, signInWithEmailAndPassword,
                    createUserWithEmailAndPassword, signOut };
    _initialized = true;
    console.log("✅ Firebase connecté !");
  } catch(e) {
    console.error("Firebase init error:", e);
    _initialized = true;
  }
  return { db:_db, auth:_auth };
}

// ── Firestore helpers ────────────────────────────────────────────
async function fbGetAll(collectionName) {
  const { db } = await initFirebase();
  if (!db || !window.__fb) return null;
  const snap = await window.__fb.getDocs(window.__fb.collection(db, collectionName));
  return snap.docs.map(d => ({ ...d.data(), _docId:d.id }));
}

async function fbSet(collectionName, id, data) {
  const { db } = await initFirebase();
  if (!db || !window.__fb) return;
  await window.__fb.setDoc(
    window.__fb.doc(db, collectionName, String(id)), data
  );
}

async function fbDelete(collectionName, id) {
  const { db } = await initFirebase();
  if (!db || !window.__fb) return;
  await window.__fb.deleteDoc(window.__fb.doc(db, collectionName, String(id)));
}

function fbListen(collectionName, onChange) {
  initFirebase().then(({ db }) => {
    if (!db || !window.__fb) return;
    window.__fb.onSnapshot(window.__fb.collection(db, collectionName), snap => {
      const data = snap.docs.map(d => ({ ...d.data(), _docId:d.id }));
      onChange(data);
    });
  });
}

// ── Auth helper ───────────────────────────────────────────────────
async function fbLogin(email, password) {
  const { auth } = await initFirebase();
  if (!auth || !window.__fb) return null;
  const cred = await window.__fb.signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function fbLogout() {
  const { auth } = await initFirebase();
  if (!auth || !window.__fb) return;
  await window.__fb.signOut(auth);
}

// ── useFirestore hook ─────────────────────────────────────────────
// Usage: const [data, setData] = useFirestore("teams", INIT_TEAMS)
// - En mode démo (pas de config) : se comporte comme useState
// - En mode Firebase : sync temps réel automatique
function useFirestore(collectionName, initialData) {
  const [data, setData] = useState(initialData);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (FIREBASE_CONFIG.apiKey === "REMPLACE_PAR_TON_API_KEY") return;
    let loaded = false;
    // Try to load from Firestore first, seed with initialData if empty
    initFirebase().then(async ({ db }) => {
      if (!db || !window.__fb) return;
      const existing = await fbGetAll(collectionName);
      if (existing && existing.length === 0 && initialData.length > 0) {
        // Seed the database with demo data on first run
        for (const item of initialData) {
          await fbSet(collectionName, item.id, item);
        }
      }
      // Then subscribe to real-time updates
      fbListen(collectionName, (items) => {
        if (items.length > 0) { setData(items); setSynced(true); }
      });
      loaded = true;
    });
  }, [collectionName]);

  // When local state changes, sync to Firestore
  const setAndSync = async (updater) => {
    const newData = typeof updater === "function" ? updater(data) : updater;
    setData(newData);
    if (FIREBASE_CONFIG.apiKey === "REMPLACE_PAR_TON_API_KEY" || !synced) return;
    // Find added/changed items and sync
    for (const item of newData) {
      await fbSet(collectionName, item.id, item);
    }
  };

  return [data, setAndSync];
}


// ═══════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════
const RED   = "#c8102e";
const BLUE  = "#4fc3f7";
const GREEN = "#39FF14";
const GOLD  = "#FFD700";

// ═══════════════════════════════════════════════
// HEXAGON PULSE LOGO
// ═══════════════════════════════════════════════
function HexLogo({ size = 32, animated = true }) {
  const hex = (cx, cy, r, rot = 0) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6 + rot;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(" ");
  };
  const C = 60;
  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120"
      fill="none" style={{ display:"block", flexShrink:0 }}
    >
      <polygon points={hex(C,C,54)} fill="none" stroke="rgba(200,16,46,0.2)" strokeWidth="1"/>
      <polygon
        points={hex(C,C,54,Math.PI/6)} fill="none"
        stroke={RED} strokeWidth="1.5" strokeDasharray="8 5" opacity="0.5"
        style={animated
          ? { animation:"hexSpin 14s linear infinite", transformOrigin:"60px 60px" }
          : undefined}
      />
      <polygon points={hex(C,C,46)} fill="rgba(200,16,46,0.08)" stroke={RED} strokeWidth="1.5"/>
      <polygon points={hex(C,C,36)} fill="rgba(200,16,46,0.85)"/>
      <polygon points={hex(C,C,27)} fill="rgba(0,0,0,0.28)"/>
      <line x1="60" y1="26" x2="60" y2="94" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <line x1="29" y1="43" x2="91" y2="77" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <line x1="91" y1="43" x2="29" y2="77" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <text x={C} y={C+1}
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize="30" fill="#fff" textAnchor="middle" dominantBaseline="middle"
        letterSpacing="-0.5" style={{ userSelect:"none" }}>M</text>
      <circle cx={C} cy="7"   r="3.5" fill={RED}/>
      <circle cx={C} cy="113" r="2"   fill="rgba(200,16,46,0.45)"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════
function useSpring(target, k = 300, d = 28) {
  const [v, setV] = useState(target);
  const s = useRef({ pos:target, vel:0, raf:null });
  useEffect(() => {
    const r = s.current;
    cancelAnimationFrame(r.raf);
    const tick = () => {
      const f = -k*(r.pos-target) - d*r.vel;
      r.vel += f*0.016; r.pos += r.vel*0.016; setV(r.pos);
      if (Math.abs(r.pos-target)>0.001||Math.abs(r.vel)>0.001)
        r.raf = requestAnimationFrame(tick);
      else { r.pos=target; setV(target); }
    };
    r.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r.raf);
  }, [target, k, d]);
  return v;
}

// ═══════════════════════════════════════════════
// PRIMITIVE UI
// ═══════════════════════════════════════════════
function GCard({ children, onClick, style = {}, noPress }) {
  const [pressed, setPressed] = useState(false);
  const scale = useSpring(pressed ? 0.95 : 1, 420, 22);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => onClick && !noPress && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        transform:`scale(${scale})`,
        cursor: onClick ? "pointer" : "default",
        background:"rgba(255,255,255,0.045)",
        backdropFilter:"blur(24px)",
        border:"1px solid rgba(255,255,255,0.09)",
        borderRadius:22,
        ...style,
      }}
    >{children}</div>
  );
}

function FadeIn({ children }) {
  const [s, setS] = useState({ opacity:0, transform:"translateY(20px) scale(0.98)" });
  useEffect(() => {
    const t = setTimeout(() =>
      setS({ opacity:1, transform:"translateY(0) scale(1)" }), 40);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ ...s, transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
      {children}
    </div>
  );
}

function AnimNum({ to, color="#fff", size=28, dur=900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (ts) => {
      const p = Math.min((ts-start)/dur, 1);
      setN(Math.round(to*(1-Math.pow(1-p,4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return (
    <span style={{
      fontSize:size, fontWeight:900,
      fontFamily:"'Barlow Condensed',sans-serif", color,
    }}>{n}</span>
  );
}

function Field({ label, type="text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{
        fontSize:8, color:"rgba(255,255,255,0.35)",
        letterSpacing:2, fontFamily:"'Barlow',sans-serif",
        textTransform:"uppercase", marginBottom:5,
      }}>{label}</div>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder || label}
        style={{
          width:"100%", background:"rgba(255,255,255,0.055)",
          border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
          padding:"11px 14px", color:"#fff",
          fontFamily:"'Barlow',sans-serif", fontSize:13,
          outline:"none", boxSizing:"border-box",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{
        fontSize:8, color:"rgba(255,255,255,0.35)",
        letterSpacing:2, fontFamily:"'Barlow',sans-serif",
        textTransform:"uppercase", marginBottom:5,
      }}>{label}</div>
      <select
        value={value} onChange={onChange}
        style={{
          width:"100%", background:"rgba(255,255,255,0.05)",
          border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
          padding:"11px 14px", color:"#fff",
          fontFamily:"'Barlow',sans-serif", fontSize:13, outline:"none",
        }}
      >{children}</select>
    </div>
  );
}

function Btn({ children, onClick, color=RED, disabled=false, outline=false }) {
  const [pr, setPr] = useState(false);
  const bg = disabled
    ? "rgba(255,255,255,0.06)"
    : outline
    ? "transparent"
    : pr
    ? `linear-gradient(135deg,${color},${color}cc)`
    : `linear-gradient(135deg,${color},${color}bb)`;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setPr(true)}
      onPointerUp={() => setPr(false)}
      onPointerLeave={() => setPr(false)}
      style={{
        width:"100%", background:bg,
        border: outline ? `1.5px solid ${color}66` : "none",
        borderRadius:14, padding:"13px",
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize:12, fontWeight:900, cursor:disabled?"not-allowed":"pointer",
        fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
        textTransform:"uppercase",
        boxShadow: disabled||outline ? "none" : `0 8px 24px ${color}44`,
        transition:"all 0.25s", transform:pr?"scale(0.98)":"scale(1)",
      }}
    >{children}</button>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", top:72, left:"50%", transform:"translateX(-50%)",
      background:"rgba(57,255,20,0.92)", color:"#000",
      padding:"9px 22px", borderRadius:28, fontSize:12, fontWeight:900,
      zIndex:9999, fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap",
      boxShadow:"0 8px 32px rgba(57,255,20,0.4)", pointerEvents:"none",
    }}>{msg}</div>
  );
}

function useToast() {
  const [msg, setMsg] = useState("");
  const show = (m) => { setMsg(m); setTimeout(()=>setMsg(""),2200); };
  return [msg, show];
}

// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════
const POSITIONS = ["Attaquant","Milieu","Défenseur","Ailier","Gardien"];
const CATEGORIES = [
  "U6","U7","U8","U9","U10","U11","U12","U13",
  "U14","U15","U16","U17","U18","U19","U20",
  "Seniors","Vétérans","Féminine",
];
const TEAM_COLORS = [
  { v:RED,    l:"Rouge"  },
  { v:BLUE,   l:"Bleu"   },
  { v:GREEN,  l:"Vert"   },
  { v:GOLD,   l:"Or"     },
  { v:"#FF6B35", l:"Orange" },
  { v:"#6C5CE7", l:"Violet" },
  { v:"#FD79A8", l:"Rose"   },
  { v:"#00cec9", l:"Cyan"   },
];
const TEAM_EMOJIS = ["⚽","🔴","🔵","🟢","🟡","🟠","🟣","⚪","🏅","⭐","🎯","🦅"];

const STATUS_C = { active:GREEN, injured:GOLD, suspended:RED };

const INIT_TEAMS = [
  { id:1, name:"Seniors A", category:"Seniors", color:RED,    emoji:"🔴", coachId:101, playerIds:[] },
  { id:2, name:"U17",       category:"U17",     color:BLUE,   emoji:"🔵", coachId:102, playerIds:[] },
  { id:3, name:"U13",       category:"U13",     color:GREEN,  emoji:"🟢", coachId:103, playerIds:[] },
  { id:4, name:"U9",        category:"U9",      color:GOLD,   emoji:"🟡", coachId:104, playerIds:[] },
  { id:5, name:"U7",        category:"U7",      color:"#FF6B35", emoji:"🟠", coachId:null, playerIds:[] },
];

const INIT_COACHES = [
  { id:101, name:"Marc Lefebvre", email:"lefebvre@fcparis.fr", phone:"06 11 22 33 44", license:"FFF-12345", teamId:1 },
  { id:102, name:"Sophie Renard", email:"renard@fcparis.fr",   phone:"06 55 66 77 88", license:"FFF-67890", teamId:2 },
  { id:103, name:"Pierre Morel",  email:"morel@fcparis.fr",    phone:"06 99 00 11 22", license:"FFF-11111", teamId:3 },
  { id:104, name:"Lucie Bernard", email:"bernard@fcparis.fr",  phone:"06 33 44 55 66", license:"FFF-22222", teamId:4 },
];

const INIT_PLAYERS = [
  { id:1, name:"Thomas Durand",  email:"t.durand@psg.fr",  position:"Attaquant", number:"9",  status:"active",  teamId:1 },
  { id:2, name:"Mohamed Benali", email:"m.benali@psg.fr",  position:"Milieu",    number:"8",  status:"active",  teamId:1 },
  { id:3, name:"Antoine Leroy",  email:"a.leroy@psg.fr",   position:"Défenseur", number:"4",  status:"injured", teamId:2 },
  { id:4, name:"Samir Rachid",   email:"s.rachid@psg.fr",  position:"Gardien",   number:"1",  status:"active",  teamId:2 },
  { id:5, name:"Léa Fontaine",   email:"l.fontaine@psg.fr",position:"Milieu",    number:"10", status:"active",  teamId:3 },
];

const ABSENCE_REASONS = [
  { id:"injury",   icon:"🩹", label:"Blessure"                },
  { id:"illness",  icon:"🤒", label:"Maladie"                 },
  { id:"personal", icon:"👤", label:"Raison personnelle"      },
  { id:"work",     icon:"💼", label:"Obligation pro"          },
  { id:"family",   icon:"👨‍👩‍👧", label:"Raison familiale"       },
  { id:"travel",   icon:"✈️", label:"Déplacement"             },
  { id:"other",    icon:"📝", label:"Autre motif"             },
];

const PRODUCTS = [
  { id:1, cat:"Maillots",     name:"Maillot Domicile 2026",   price:89.99, emoji:"👕", badge:"NEW", bg:"linear-gradient(135deg,#1a0a14,#3d0f1f)" },
  { id:2, cat:"Maillots",     name:"Maillot Extérieur 2026",  price:84.99, emoji:"👕", badge:"",    bg:"linear-gradient(135deg,#0a1628,#1a2a40)" },
  { id:3, cat:"Accessoires",  name:"Écharpe Club",            price:24.99, emoji:"🧣", badge:"TOP", bg:"linear-gradient(135deg,#1a1a3a,#2d2d5e)" },
  { id:4, cat:"Accessoires",  name:"Casquette Officielle",    price:19.99, emoji:"🧢", badge:"",    bg:"linear-gradient(135deg,#0d2847,#1a3a5c)" },
  { id:5, cat:"Billetterie",  name:"Match Seniors A",         price:45.00, emoji:"🎟️", badge:"HOT", bg:"linear-gradient(135deg,#8B0000,#5c0000)" },
  { id:6, cat:"Billetterie",  name:"Abonnement Saison",       price:650.0, emoji:"📋", badge:"VIP", bg:"linear-gradient(135deg,#2a1500,#4a2200)" },
  { id:7, cat:"Équipement",   name:"Short Entraînement",      price:34.99, emoji:"🩳", badge:"",    bg:"linear-gradient(135deg,#111,#1a1a1a)" },
  { id:8, cat:"Équipement",   name:"Veste Survêtement",       price:64.99, emoji:"🧥", badge:"NEW", bg:"linear-gradient(135deg,#0a1628,#1a2a40)" },
];

const PLANS = {
  starter:    { label:"Starter",     color:BLUE,  max:25  },
  pro:        { label:"Pro Club",    color:RED,   max:999 },
  federation: { label:"Fédération",  color:GOLD,  max:999 },
};

const DEMO_USERS = [
  { id:99,  role:"admin",  email:"admin@fcparis.fr",     password:"Admin2026!", tempPwd:false, plan:"pro", club:"FC Paris Manager", validated:true  },
  { id:1,   role:"player", email:"mbappe@fcparis.fr",    password:"Tmp@1234",   tempPwd:true,  club:"FC Paris Manager", validated:true,  name:"Kylian Mbappé",   number:7  },
  { id:2,   role:"player", email:"dembele@fcparis.fr",   password:"Dembele26!", tempPwd:false, club:"FC Paris Manager", validated:true,  name:"Ousmane Dembélé", number:11 },
  { id:3,   role:"player", email:"pending@fcparis.fr",   password:"Tmp@5678",   tempPwd:true,  club:"FC Paris Manager", validated:false, name:"Antoine Leroy",   number:4  },
  { id:101, role:"coach",  email:"lefebvre@fcparis.fr",  password:"Coach2026!", tempPwd:false, club:"FC Paris Manager", validated:true,  name:"Marc Lefebvre",   teamId:1  },
  { id:102, role:"coach",  email:"renard@fcparis.fr",    password:"Coach2026!", tempPwd:false, club:"FC Paris Manager", validated:true,  name:"Sophie Renard",   teamId:2  },
];

const INIT_EVENTS = [
  { id:1, type:"match",    title:"Seniors A vs Marseille", date:"2026-03-15", time:"15:00", location:"Stade Municipal", description:"Match de championnat D1.",    attendance:{} },
  { id:2, type:"training", title:"Entraînement U17",       date:"2026-03-12", time:"18:30", location:"Terrain 2",       description:"Travail tactique défensif.",  attendance:{} },
  { id:3, type:"training", title:"Entraînement Seniors A", date:"2026-03-13", time:"19:00", location:"Terrain Principal",description:"Préparation match samedi.",  attendance:{} },
  { id:4, type:"event",    title:"AG Annuelle du Club",    date:"2026-03-20", time:"20:00", location:"Salle des fêtes", description:"Assemblée générale annuelle.", attendance:{} },
];

const DEMO_PLAYERS_SQUAD = [
  { id:10, name:"Kylian Mbappé",    pos:"ATT", number:7,  pace:97, shooting:90, passing:80, dribbling:95, defense:36, physical:78, goals:16, assists:8,  emoji:"🌟", nationality:"🇫🇷", age:27, height:"178cm", weight:"73kg" },
  { id:11, name:"Ousmane Dembélé",  pos:"ATT", number:11, pace:96, shooting:85, passing:82, dribbling:93, defense:30, physical:65, goals:12, assists:14, emoji:"⚡", nationality:"🇫🇷", age:28, height:"178cm", weight:"67kg" },
  { id:12, name:"Lucas Hernández",  pos:"DEF", number:21, pace:76, shooting:42, passing:70, dribbling:68, defense:86, physical:84, goals:1,  assists:3,  emoji:"🛡️", nationality:"🇫🇷", age:28, height:"184cm", weight:"78kg" },
  { id:13, name:"Marco Verratti",   pos:"MID", number:6,  pace:72, shooting:72, passing:92, dribbling:89, defense:78, physical:66, goals:4,  assists:10, emoji:"🎯", nationality:"🇮🇹", age:32, height:"165cm", weight:"60kg" },
  { id:14, name:"Gianluigi Donnarumma", pos:"GK", number:1, pace:60, shooting:22, passing:62, dribbling:30, defense:88, physical:90, goals:0, assists:0, emoji:"🧤", nationality:"🇮🇹", age:26, height:"196cm", weight:"96kg" },
];

// ═══════════════════════════════════════════════
// RADAR CHART
// ═══════════════════════════════════════════════
function Radar({ stats, color = GREEN }) {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (ts) => {
      const p = Math.min((ts-start)/900, 1);
      setProg(1-Math.pow(1-p,3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const keys = ["pace","shooting","passing","dribbling","defense","physical"];
  const labels = ["PACE","SHO","PAS","DRI","DEF","PHY"];
  const cx=120, cy=118, R=82;
  const ang = (i) => (i*Math.PI*2)/6 - Math.PI/2;
  const grid = (l) => keys.map((_,i) =>
    `${cx+Math.cos(ang(i))*R*l},${cy+Math.sin(ang(i))*R*l}`
  ).join(" ");
  const data = keys.map((k,i) => {
    const v=(stats[k]/100)*R*prog;
    return `${cx+Math.cos(ang(i))*v},${cy+Math.sin(ang(i))*v}`;
  }).join(" ");
  return (
    <svg width={240} height={240} style={{ display:"block", margin:"0 auto" }}>
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.03"/>
        </radialGradient>
      </defs>
      {[0.25,0.5,0.75,1].map(l => (
        <polygon key={l} points={grid(l)}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {keys.map((_,i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={cx+Math.cos(ang(i))*R} y2={cy+Math.sin(ang(i))*R}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      ))}
      <polygon points={data}
        fill="url(#rg)" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {keys.map((k,i) => (
        <circle key={k}
          cx={cx+Math.cos(ang(i))*(stats[k]/100)*R*prog}
          cy={cy+Math.sin(ang(i))*(stats[k]/100)*R*prog}
          r="4" fill={color}
          style={{ filter:`drop-shadow(0 0 6px ${color})` }}/>
      ))}
      {labels.map((lbl,i) => {
        const lx = cx+Math.cos(ang(i))*(R+18);
        const ly = cy+Math.sin(ang(i))*(R+18);
        return (
          <text key={lbl} x={lx} y={ly}
            fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
            fontSize="11" fill={color} textAnchor="middle" dominantBaseline="middle"
            letterSpacing="1">{lbl}</text>
        );
      })}
      <text x={cx} y={cy-8}
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize="11" fill="rgba(255,255,255,0.35)"
        textAnchor="middle" letterSpacing="1">OVERALL</text>
      <text x={cx} y={cy+10}
        fontFamily="'Barlow Condensed',sans-serif" fontWeight="900"
        fontSize="22" fill="#fff" textAnchor="middle">{
          Math.round(Object.values(stats).reduce((s,v)=>s+v,0)/6)
        }</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════
// HOME DASHBOARD
// ═══════════════════════════════════════════════
function Home({ goPlayer, teams, coaches, players }) {
  const stats = [
    { label:"Équipes",  val:teams.length,   color:RED,   icon:"🏟️" },
    { label:"Coachs",   val:coaches.length, color:BLUE,  icon:"🧑‍🏫" },
    { label:"Joueurs",  val:players.length, color:GREEN, icon:"👥"  },
    { label:"Actifs",   val:players.filter(p=>p.status==="active").length, color:GOLD, icon:"✅" },
  ];
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {stats.map(s => (
            <GCard key={s.label} style={{ padding:"18px 14px", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
              <AnimNum to={s.val} color={s.color} size={30}/>
              <div style={{
                fontSize:7, color:"rgba(255,255,255,0.35)",
                letterSpacing:1.5, textTransform:"uppercase",
                fontFamily:"'Barlow',sans-serif", marginTop:4,
              }}>{s.label}</div>
            </GCard>
          ))}
        </div>
        {/* Teams summary */}
        <div style={{
          fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:3,
          fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:12,
        }}>Équipes du club</div>
        {teams.map(team => {
          const coach = coaches.find(c => c.id === team.coachId);
          const count = players.filter(p => p.teamId === team.id).length;
          return (
            <GCard key={team.id} style={{ padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:`${team.color}22`,
                  border:`2px solid ${team.color}44`,
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:22, flexShrink:0,
                }}>{team.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{
                    fontSize:15, fontWeight:900, color:"#fff",
                    fontFamily:"'Barlow Condensed',sans-serif",
                  }}>{team.name}</div>
                  <div style={{
                    fontSize:9, color:team.color,
                    letterSpacing:1.5, fontFamily:"'Barlow',sans-serif",
                    textTransform:"uppercase", marginTop:2,
                  }}>{team.category}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{
                    fontSize:18, fontWeight:900, color:"#fff",
                    fontFamily:"'Barlow Condensed',sans-serif",
                  }}>{count}</div>
                  <div style={{
                    fontSize:7, color:"rgba(255,255,255,0.3)",
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>joueurs</div>
                </div>
              </div>
              {coach && (
                <div style={{
                  marginTop:10, paddingTop:10,
                  borderTop:"1px solid rgba(255,255,255,0.05)",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <span style={{ fontSize:14 }}>🧑‍🏫</span>
                  <div style={{
                    fontSize:11, color:"rgba(255,255,255,0.55)",
                    fontFamily:"'Barlow',sans-serif",
                  }}>{coach.name}</div>
                </div>
              )}
            </GCard>
          );
        })}
        {/* Top players */}
        <div style={{
          fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:3,
          fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
          marginBottom:12, marginTop:6,
        }}>Effectif vedette</div>
        {DEMO_PLAYERS_SQUAD.slice(0,3).map(p => (
          <GCard key={p.id} onClick={() => goPlayer(p)}
            style={{ padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:`linear-gradient(135deg,rgba(200,16,46,0.28),rgba(200,16,46,0.08))`,
              border:"1px solid rgba(200,16,46,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:24, flexShrink:0,
            }}>{p.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:14, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",
              }}>{p.name}</div>
              <div style={{
                fontSize:8, color:BLUE, letterSpacing:1.5,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginTop:2,
              }}>#{p.number} · {p.pos}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{
                fontSize:22, fontWeight:900, color:GREEN,
                fontFamily:"'Barlow Condensed',sans-serif",
              }}>{Math.round(Object.values({
                pace:p.pace, shooting:p.shooting, passing:p.passing,
                dribbling:p.dribbling, defense:p.defense, physical:p.physical,
              }).reduce((s,v)=>s+v,0)/6)}</div>
              <div style={{
                fontSize:6, color:"rgba(255,255,255,0.3)",
                letterSpacing:1, fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
              }}>OVR</div>
            </div>
          </GCard>
        ))}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// PLAYER PROFILE
// ═══════════════════════════════════════════════
function Profile({ player }) {
  const [tab, setTab] = useState("stats");
  if (!player) return null;
  const statRows = [
    { k:"goals",   label:"Buts",          color:GREEN },
    { k:"assists", label:"Passes déc.",   color:BLUE  },
    { k:"pace",    label:"Vitesse",        color:GOLD  },
  ];
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        <GCard style={{ padding:"24px 20px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
            <div style={{
              width:72, height:72, borderRadius:22,
              background:"linear-gradient(135deg,rgba(200,16,46,0.28),rgba(200,16,46,0.08))",
              border:"1px solid rgba(200,16,46,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, flexShrink:0,
            }}>{player.emoji}</div>
            <div>
              <div style={{
                fontSize:22, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
              }}>{player.name}</div>
              <div style={{
                fontSize:9, color:BLUE, letterSpacing:2,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginTop:4,
              }}>#{player.number} · {player.pos}</div>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {[
                  { v:player.goals,   l:"Buts",   c:GREEN },
                  { v:player.assists, l:"Passes",  c:BLUE  },
                ].map(s => (
                  <div key={s.l} style={{
                    background:`${s.c}15`, border:`1px solid ${s.c}33`,
                    borderRadius:20, padding:"3px 10px", fontSize:9,
                    color:s.c, fontFamily:"'Barlow Condensed',sans-serif",
                    fontWeight:900, letterSpacing:1,
                  }}>{s.v} {s.l}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { l:"Nationalité", v:player.nationality + " FR" },
              { l:"Âge",         v:player.age + " ans" },
              { l:"Taille",      v:player.height },
            ].map(r => (
              <div key={r.l} style={{
                background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px",
              }}>
                <div style={{
                  fontSize:7, color:"rgba(255,255,255,0.3)", letterSpacing:1.5,
                  fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:4,
                }}>{r.l}</div>
                <div style={{
                  fontSize:12, fontWeight:700, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{r.v}</div>
              </div>
            ))}
          </div>
        </GCard>
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {["stats","radar"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1,
              background: tab===t
                ? "linear-gradient(135deg,rgba(200,16,46,0.85),rgba(140,10,30,0.85))"
                : "rgba(255,255,255,0.05)",
              border: tab===t ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius:16, padding:"10px",
              color: tab===t ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize:10, cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
              textTransform:"uppercase",
              boxShadow: tab===t ? "0 4px 16px rgba(200,16,46,0.4)" : "none",
              transition:"all 0.25s",
            }}>{t === "stats" ? "📊 Stats" : "🎯 Radar"}</button>
          ))}
        </div>
        {tab === "stats" && (
          <GCard style={{ padding:"20px" }}>
            {[
              { l:"Vitesse",  v:player.pace,     c:GOLD  },
              { l:"Tir",      v:player.shooting, c:RED   },
              { l:"Passe",    v:player.passing,  c:BLUE  },
              { l:"Dribble",  v:player.dribbling,c:GREEN },
              { l:"Défense",  v:player.defense,  c:"#a29bfe" },
              { l:"Physique", v:player.physical, c:"#fd79a8" },
            ].map(r => (
              <div key={r.l} style={{ marginBottom:12 }}>
                <div style={{
                  display:"flex", justifyContent:"space-between", marginBottom:4,
                }}>
                  <span style={{
                    fontSize:10, color:"rgba(255,255,255,0.5)",
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>{r.l}</span>
                  <span style={{
                    fontSize:12, fontWeight:900, color:r.c,
                    fontFamily:"'Barlow Condensed',sans-serif",
                  }}>{r.v}</span>
                </div>
                <div style={{
                  height:4, background:"rgba(255,255,255,0.06)",
                  borderRadius:4, overflow:"hidden",
                }}>
                  <div style={{
                    height:"100%", width:`${r.v}%`,
                    background:`linear-gradient(90deg,${r.c},${r.c}88)`,
                    borderRadius:4, transition:"width 0.8s ease",
                  }}/>
                </div>
              </div>
            ))}
          </GCard>
        )}
        {tab === "radar" && (
          <GCard style={{ padding:"20px" }}>
            <Radar stats={{
              pace:player.pace, shooting:player.shooting, passing:player.passing,
              dribbling:player.dribbling, defense:player.defense, physical:player.physical,
            }} color={GREEN}/>
          </GCard>
        )}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// PLAYERS VIEW
// ═══════════════════════════════════════════════
function PlayersView({ goPlayer, teams }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all"
    ? DEMO_PLAYERS_SQUAD
    : DEMO_PLAYERS_SQUAD.filter(p => p.pos === filter);
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto" }}>
          {["all","ATT","MID","DEF","GK"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter===f
                ? "linear-gradient(135deg,rgba(200,16,46,0.85),rgba(140,10,30,0.85))"
                : "rgba(255,255,255,0.05)",
              border: filter===f ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius:22, padding:"7px 16px",
              color: filter===f ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize:9, whiteSpace:"nowrap", cursor:"pointer",
              fontFamily:"'Barlow',sans-serif", letterSpacing:1.5,
              textTransform:"uppercase",
              boxShadow: filter===f ? "0 4px 20px rgba(200,16,46,0.4)" : "none",
              transition:"all 0.3s",
            }}>{f === "all" ? "Tous" : f}</button>
          ))}
        </div>
        {filtered.map(p => (
          <GCard key={p.id} onClick={() => goPlayer(p)} style={{ padding:"16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{
                width:52, height:52, borderRadius:17,
                background:"linear-gradient(135deg,rgba(200,16,46,0.28),rgba(200,16,46,0.08))",
                border:"1px solid rgba(200,16,46,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26, flexShrink:0,
              }}>{p.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:16, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{p.name}</div>
                <div style={{
                  fontSize:8, color:BLUE, letterSpacing:1.5,
                  fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginTop:2,
                }}>#{p.number} · {p.pos}</div>
                <div style={{ display:"flex", gap:6, marginTop:5 }}>
                  {[
                    { v:p.goals,   l:"⚽", c:GREEN },
                    { v:p.assists, l:"🎯", c:BLUE  },
                  ].map(s => (
                    <span key={s.l} style={{
                      background:`${s.c}15`, border:`1px solid ${s.c}33`,
                      borderRadius:20, padding:"2px 8px",
                      fontSize:9, color:s.c,
                      fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
                    }}>{s.l} {s.v}</span>
                  ))}
                </div>
              </div>
              <div style={{
                width:44, height:44, borderRadius:13,
                background:"rgba(57,255,20,0.1)",
                border:"1px solid rgba(57,255,20,0.25)",
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
              }}>
                <div style={{
                  fontSize:18, fontWeight:900, color:GREEN,
                  fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
                }}>{Math.round((p.pace+p.shooting+p.passing+p.dribbling+p.defense+p.physical)/6)}</div>
                <div style={{
                  fontSize:6, color:"rgba(57,255,20,0.6)",
                  letterSpacing:1, fontFamily:"'Barlow',sans-serif",
                }}>OVR</div>
              </div>
            </div>
          </GCard>
        ))}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// AGENDA
// ═══════════════════════════════════════════════
function Agenda({ events, setEvents, role, currentUser }) {
  const [sel, setSel] = useState(null);
  const typeIcon  = { match:"⚽", training:"🏃", event:"📅" };
  const typeLabel = { match:"Match", training:"Entraînement", event:"Événement" };
  const typeColor = { match:RED, training:BLUE, event:GOLD };
  const sorted = [...events].sort((a,b)=>a.date.localeCompare(b.date));
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        {sorted.map(ev => (
          <GCard key={ev.id} onClick={() => setSel(ev)}
            style={{ padding:"16px", marginBottom:10 }}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{
                width:44, height:44, borderRadius:14,
                background:`${typeColor[ev.type]}18`,
                border:`1px solid ${typeColor[ev.type]}33`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, flexShrink:0,
              }}>{typeIcon[ev.type]}</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:14, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{ev.title}</div>
                <div style={{
                  fontSize:9, color:"rgba(255,255,255,0.4)",
                  fontFamily:"'Barlow',sans-serif", marginTop:3,
                }}>{ev.date} · {ev.time} · {ev.location}</div>
              </div>
              <div style={{
                background:`${typeColor[ev.type]}18`,
                border:`1px solid ${typeColor[ev.type]}33`,
                borderRadius:20, padding:"3px 10px",
                fontSize:8, color:typeColor[ev.type],
                fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                flexShrink:0,
              }}>{typeLabel[ev.type]}</div>
            </div>
          </GCard>
        ))}
        {sel && (
          <div style={{
            position:"fixed", inset:0, zIndex:9000,
            background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            padding:"0 0 0",
          }} onClick={() => setSel(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background:"#0d0d1a", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430,
              padding:"24px 20px 48px",
            }}>
              <div style={{
                width:36, height:4, borderRadius:2,
                background:"rgba(255,255,255,0.15)",
                margin:"0 auto 20px",
              }}/>
              <div style={{
                fontSize:22, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif", marginBottom:6,
              }}>{sel.title}</div>
              <div style={{
                fontSize:10, color:"rgba(255,255,255,0.4)",
                fontFamily:"'Barlow',sans-serif", marginBottom:16,
              }}>{sel.date} · {sel.time} · {sel.location}</div>
              <div style={{
                fontSize:13, color:"rgba(255,255,255,0.6)",
                fontFamily:"'Barlow',sans-serif", lineHeight:1.7,
              }}>{sel.description}</div>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// BOUTIQUE
// ═══════════════════════════════════════════════
function Shop({ cart, setCart }) {
  const [cat, setCat] = useState("Tous");
  const [toast, showToast] = useToast();
  const cats = ["Tous","Maillots","Accessoires","Billetterie","Équipement"];
  const list = cat==="Tous" ? PRODUCTS : PRODUCTS.filter(p=>p.cat===cat);
  const addToCart = (p) => {
    setCart(prev => {
      const e = prev.find(i=>i.id===p.id);
      return e ? prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i) : [...prev,{...p,qty:1}];
    });
    showToast("✓ Ajouté au panier");
  };
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const badgeC = { NEW:"#6C5CE7", TOP:"#2a9d8f", HOT:RED, VIP:GOLD };
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px", position:"relative" }}>
        <Toast msg={toast}/>
        {count > 0 && (
          <GCard style={{
            padding:"14px 18px", marginBottom:16,
            background:"linear-gradient(135deg,rgba(79,195,247,0.1),rgba(79,195,247,0.05))",
            border:"1px solid rgba(79,195,247,0.18)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{ fontSize:13, color:"#fff", fontFamily:"'Barlow',sans-serif" }}>
              🛒 <span style={{ color:BLUE, fontWeight:700 }}>{count} article{count>1?"s":""}</span>
            </span>
            <span style={{ fontSize:17, fontWeight:900, color:GOLD, fontFamily:"'Barlow Condensed',sans-serif" }}>
              {total.toFixed(2)} €
            </span>
          </GCard>
        )}
        <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:6 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              background: cat===c
                ? "linear-gradient(135deg,rgba(200,16,46,0.9),rgba(160,13,39,0.9))"
                : "rgba(255,255,255,0.05)",
              border: cat===c ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius:22, padding:"8px 18px",
              color: cat===c ? "#fff" : "rgba(255,255,255,0.45)",
              fontSize:9, whiteSpace:"nowrap", cursor:"pointer",
              fontFamily:"'Barlow',sans-serif", letterSpacing:1.5,
              textTransform:"uppercase", transition:"all 0.35s",
              boxShadow: cat===c ? "0 4px 20px rgba(200,16,46,0.4)" : "none",
            }}>{c}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {list.map(p => (
            <GCard key={p.id} style={{ overflow:"hidden" }}>
              <div style={{
                background:p.bg, height:108,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:46, position:"relative",
              }}>
                {p.badge && (
                  <div style={{
                    position:"absolute", top:8, left:8,
                    background:badgeC[p.badge],
                    borderRadius:7, padding:"2px 9px",
                    fontSize:7, fontWeight:900,
                    color:p.badge==="VIP"?"#000":"#fff",
                    letterSpacing:2, fontFamily:"'Barlow',sans-serif",
                  }}>{p.badge}</div>
                )}
                <span style={{ filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}>{p.emoji}</span>
              </div>
              <div style={{ padding:"13px" }}>
                <div style={{
                  fontSize:7, color:"rgba(255,255,255,0.3)",
                  letterSpacing:1.5, textTransform:"uppercase",
                  fontFamily:"'Barlow',sans-serif", marginBottom:4,
                }}>{p.cat}</div>
                <div style={{
                  fontSize:12, fontWeight:700, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                  marginBottom:8, lineHeight:1.3,
                }}>{p.name}</div>
                <div style={{
                  fontSize:18, fontWeight:900, color:BLUE,
                  fontFamily:"'Barlow Condensed',sans-serif", marginBottom:10,
                }}>{p.price.toFixed(2)} €</div>
                <GCard onClick={() => addToCart(p)} style={{
                  padding:"10px", textAlign:"center",
                  background:"linear-gradient(135deg,rgba(200,16,46,0.75),rgba(160,13,39,0.75))",
                  border:"1px solid rgba(200,16,46,0.4)", borderRadius:12,
                }}>
                  <span style={{
                    color:"#fff", fontSize:9, fontWeight:900,
                    fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
                  }}>+ AJOUTER</span>
                </GCard>
              </div>
            </GCard>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// ADMIN — TEAMS MANAGER
// ═══════════════════════════════════════════════
function TeamsManager({ teams, setTeams, coaches, players }) {
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name:"", category:"Seniors", color:RED, emoji:"⚽", coachId:"" });
  const [toast, showToast] = useToast();

  const createTeam = () => {
    if (!form.name.trim()) return;
    const coach = coaches.find(c => c.id === parseInt(form.coachId));
    setTeams(ts => [...ts, {
      id:Date.now(), name:form.name.trim(),
      category:form.category, color:form.color, emoji:form.emoji,
      coachId:coach?.id||null, playerIds:[],
    }]);
    setForm({ name:"", category:"Seniors", color:RED, emoji:"⚽", coachId:"" });
    setView("list");
    showToast("✅ Équipe créée !");
  };

  const deleteTeam = (id) => {
    setTeams(ts => ts.filter(t => t.id !== id));
    showToast("🗑 Équipe supprimée");
  };

  const changeCoach = (teamId, coachId) => {
    const coach = coaches.find(c => c.id === parseInt(coachId));
    setTeams(ts => ts.map(t => t.id===teamId
      ? { ...t, coachId:coach?.id||null }
      : t
    ));
  };

  if (view === "create") return (
    <FadeIn>
      <div>
        <Toast msg={toast}/>
        <button
          onClick={() => setView("list")}
          style={{
            background:"none", border:"none", color:"rgba(255,255,255,0.45)",
            cursor:"pointer", fontSize:12, fontFamily:"'Barlow',sans-serif",
            marginBottom:18, display:"flex", alignItems:"center", gap:6, padding:0,
          }}
        >← Retour à la liste</button>

        <GCard style={{ padding:"22px" }}>
          <div style={{
            fontSize:10, fontWeight:900, color:RED,
            letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:18,
          }}>NOUVELLE ÉQUIPE</div>

          <Field
            label="Nom de l'équipe"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name:e.target.value }))}
            placeholder="ex: U13 A, Seniors 1..."
          />

          <SelectField
            label="Catégorie"
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category:e.target.value }))}
          >
            {CATEGORIES.map(c => (
              <option key={c} style={{ background:"#111" }}>{c}</option>
            ))}
          </SelectField>

          {/* Color picker */}
          <div style={{ marginBottom:14 }}>
            <div style={{
              fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:2,
              fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:8,
            }}>Couleur</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TEAM_COLORS.map(c => (
                <button
                  key={c.v}
                  onClick={() => setForm(p => ({ ...p, color:c.v }))}
                  style={{
                    width:32, height:32, borderRadius:10, background:c.v,
                    border:`2.5px solid ${form.color===c.v?"#fff":"transparent"}`,
                    cursor:"pointer", transition:"all 0.2s",
                    transform:form.color===c.v?"scale(1.18)":"scale(1)",
                    boxShadow:form.color===c.v?`0 0 14px ${c.v}`:"none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Emoji picker */}
          <div style={{ marginBottom:14 }}>
            <div style={{
              fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:2,
              fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:8,
            }}>Emoji</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {TEAM_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(p => ({ ...p, emoji:e }))}
                  style={{
                    width:36, height:36, borderRadius:10, fontSize:18,
                    background:form.emoji===e?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)",
                    border:`1.5px solid ${form.emoji===e?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}`,
                    cursor:"pointer", transition:"all 0.2s",
                    transform:form.emoji===e?"scale(1.15)":"scale(1)",
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          <SelectField
            label="Coach (optionnel)"
            value={form.coachId}
            onChange={e => setForm(p => ({ ...p, coachId:e.target.value }))}
          >
            <option value="" style={{ background:"#111" }}>— Aucun coach —</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id} style={{ background:"#111" }}>
                🧑‍🏫 {c.name}
              </option>
            ))}
          </SelectField>

          {/* Preview */}
          <div style={{
            display:"flex", alignItems:"center", gap:12, marginBottom:18,
            background:`${form.color}14`, border:`1px solid ${form.color}33`,
            borderRadius:14, padding:"12px 16px",
          }}>
            <span style={{ fontSize:28 }}>{form.emoji}</span>
            <div>
              <div style={{
                fontSize:15, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",
              }}>{form.name || "Nom de l'équipe"}</div>
              <div style={{
                fontSize:9, color:form.color, letterSpacing:1.5,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
              }}>{form.category}</div>
            </div>
          </div>

          <Btn onClick={createTeam} disabled={!form.name.trim()}>
            CRÉER L'ÉQUIPE
          </Btn>
        </GCard>
      </div>
    </FadeIn>
  );

  return (
    <div>
      <Toast msg={toast}/>
      <Btn onClick={() => setView("create")} style={{ marginBottom:16 }}>
        + CRÉER UNE ÉQUIPE
      </Btn>

      {teams.length === 0 && (
        <GCard style={{ padding:"32px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🏟️</div>
          <div style={{
            fontSize:13, color:"rgba(255,255,255,0.35)",
            fontFamily:"'Barlow',sans-serif",
          }}>Aucune équipe. Créez-en une !</div>
        </GCard>
      )}

      {teams.map(team => {
        const coach = coaches.find(c => c.id === team.coachId);
        const count = players.filter(p => p.teamId === team.id).length;
        return (
          <GCard key={team.id} style={{ padding:"18px", marginBottom:12 }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div style={{
                width:52, height:52, borderRadius:16,
                background:`${team.color}22`, border:`2px solid ${team.color}55`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26, flexShrink:0,
              }}>{team.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:16, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{team.name}</div>
                <div style={{
                  fontSize:9, color:team.color, letterSpacing:2,
                  fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginTop:2,
                }}>{team.category}</div>
                <div style={{
                  fontSize:10, color:"rgba(255,255,255,0.35)",
                  fontFamily:"'Barlow',sans-serif", marginTop:2,
                }}>{count} joueur{count!==1?"s":""}</div>
              </div>
              <button
                onClick={() => deleteTeam(team.id)}
                style={{
                  background:"rgba(200,16,46,0.12)",
                  border:"1px solid rgba(200,16,46,0.3)",
                  borderRadius:10, width:32, height:32,
                  color:RED, cursor:"pointer", fontSize:14,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >🗑</button>
            </div>

            {/* Coach section */}
            <div style={{
              background:"rgba(255,255,255,0.03)", borderRadius:12,
              padding:"10px 14px", marginBottom:coach?0:0,
            }}>
              <div style={{
                fontSize:7, color:"rgba(255,255,255,0.28)", letterSpacing:2,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:8,
              }}>Coach assigné</div>
              {coach ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{
                      width:30, height:30, borderRadius:9,
                      background:`${team.color}22`, border:`1px solid ${team.color}44`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                    }}>🧑‍🏫</div>
                    <div>
                      <div style={{
                        fontSize:13, fontWeight:700, color:"#fff",
                        fontFamily:"'Barlow Condensed',sans-serif",
                      }}>{coach.name}</div>
                      <div style={{
                        fontSize:9, color:"rgba(255,255,255,0.3)",
                        fontFamily:"'Barlow',sans-serif",
                      }}>{coach.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => changeCoach(team.id, "")}
                    style={{
                      background:"rgba(255,255,255,0.05)",
                      border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, padding:"4px 10px",
                      fontSize:8, color:"rgba(255,255,255,0.35)",
                      cursor:"pointer", fontFamily:"'Barlow',sans-serif",
                    }}
                  >Changer</button>
                </div>
              ) : (
                <select
                  defaultValue=""
                  onChange={e => changeCoach(team.id, e.target.value)}
                  style={{
                    width:"100%", background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
                    padding:"9px 12px", color:"#fff",
                    fontFamily:"'Barlow',sans-serif", fontSize:12, outline:"none",
                  }}
                >
                  <option value="" style={{ background:"#111" }}>
                    {coaches.length ? "— Assigner un coach —" : "— Aucun coach créé —"}
                  </option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id} style={{ background:"#111" }}>
                      🧑‍🏫 {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Players chips */}
            {count > 0 && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>
                {players.filter(p => p.teamId===team.id).map(p => (
                  <div key={p.id} style={{
                    background:`${team.color}18`, border:`1px solid ${team.color}2a`,
                    borderRadius:20, padding:"3px 10px",
                    fontSize:8, color:"#fff",
                    fontFamily:"'Barlow',sans-serif",
                    display:"flex", alignItems:"center", gap:4,
                  }}>
                    <div style={{
                      width:5, height:5, borderRadius:"50%",
                      background:STATUS_C[p.status]||"#666",
                    }}/>
                    #{p.number} {p.name.split(" ").slice(-1)[0]}
                  </div>
                ))}
              </div>
            )}
          </GCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ADMIN — COACHES MANAGER
// ═══════════════════════════════════════════════
function CoachesManager({ coaches, setCoaches, teams }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", phone:"", license:"", teamId:"" });
  const [toast, showToast] = useToast();

  const addCoach = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setCoaches(cs => [...cs, {
      id:Date.now(), name:form.name.trim(), email:form.email.trim(),
      phone:form.phone, license:form.license,
      teamId:form.teamId ? parseInt(form.teamId) : null,
    }]);
    setForm({ name:"", email:"", phone:"", license:"", teamId:"" });
    setShowForm(false);
    showToast("✅ Coach créé — email envoyé !");
  };

  const removeCoach = (id) => {
    setCoaches(cs => cs.filter(c => c.id !== id));
    showToast("🗑 Coach retiré");
  };

  const canAdd = form.name.trim() && form.email.trim();

  return (
    <div>
      <Toast msg={toast}/>
      <GCard
        onClick={() => setShowForm(s => !s)}
        style={{
          padding:"14px 20px", marginBottom:14,
          background: showForm
            ? "rgba(200,16,46,0.1)"
            : "linear-gradient(135deg,rgba(200,16,46,0.9),rgba(160,13,39,0.9))",
          border: showForm ? "1px solid rgba(200,16,46,0.4)" : "none",
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}
      >
        <span style={{ fontSize:16 }}>{showForm ? "✕" : "+"}</span>
        <span style={{
          color:"#fff", fontSize:12, fontWeight:900,
          fontFamily:"'Barlow Condensed',sans-serif",
          letterSpacing:2, textTransform:"uppercase",
        }}>{showForm ? "ANNULER" : "AJOUTER UN COACH"}</span>
      </GCard>

      <div style={{
        overflow:"hidden",
        maxHeight:showForm ? 600 : 0,
        transition:"max-height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        marginBottom:showForm ? 16 : 0,
        opacity:showForm ? 1 : 0,
      }}>
        <GCard style={{ padding:"20px" }}>
          <div style={{
            fontSize:10, fontWeight:900, color:BLUE, letterSpacing:2,
            fontFamily:"'Barlow Condensed',sans-serif", marginBottom:16,
          }}>NOUVEAU COMPTE COACH</div>

          <Field label="Nom complet" value={form.name}
            onChange={e => setForm(p => ({ ...p, name:e.target.value }))}
            placeholder="Prénom Nom"/>
          <Field label="Email" type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email:e.target.value }))}
            placeholder="coach@club.fr"/>
          <Field label="Téléphone" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone:e.target.value }))}
            placeholder="+33 6 ..."/>
          <Field label="N° Licence FFF" value={form.license}
            onChange={e => setForm(p => ({ ...p, license:e.target.value }))}
            placeholder="FFF-XXXXXXXX"/>

          <SelectField
            label="Équipe assignée"
            value={form.teamId}
            onChange={e => setForm(p => ({ ...p, teamId:e.target.value }))}
          >
            <option value="" style={{ background:"#111" }}>— Sans équipe pour l'instant —</option>
            {teams.map(t => (
              <option key={t.id} value={t.id} style={{ background:"#111" }}>
                {t.emoji} {t.name}
              </option>
            ))}
          </SelectField>

          <div style={{
            background:"rgba(79,195,247,0.08)",
            border:"1px solid rgba(79,195,247,0.2)",
            borderRadius:12, padding:"10px 14px", marginBottom:16,
            fontSize:11, color:"rgba(79,195,247,0.8)",
            fontFamily:"'Barlow',sans-serif", lineHeight:1.6,
          }}>
            📧 Un email avec mot de passe temporaire sera envoyé automatiquement.
          </div>

          <Btn onClick={addCoach} disabled={!canAdd} color={BLUE}>
            CRÉER LE COMPTE COACH
          </Btn>
        </GCard>
      </div>

      {coaches.length === 0 && !showForm && (
        <GCard style={{ padding:"28px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🧑‍🏫</div>
          <div style={{
            fontSize:13, color:"rgba(255,255,255,0.35)",
            fontFamily:"'Barlow',sans-serif",
          }}>Aucun coach enregistré</div>
        </GCard>
      )}

      {coaches.map(coach => {
        const team = teams.find(t => t.id===coach.teamId || t.coachId===coach.id);
        return (
          <GCard key={coach.id} style={{ padding:"16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:48, height:48, borderRadius:15,
                background:"linear-gradient(135deg,rgba(79,195,247,0.28),rgba(79,195,247,0.08))",
                border:"1px solid rgba(79,195,247,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, flexShrink:0,
              }}>🧑‍🏫</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:14, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{coach.name}</div>
                <div style={{
                  fontSize:10, color:"rgba(255,255,255,0.35)",
                  fontFamily:"'Barlow',sans-serif", marginTop:2,
                }}>{coach.email}</div>
                {coach.phone && (
                  <div style={{
                    fontSize:9, color:"rgba(255,255,255,0.22)",
                    fontFamily:"'Barlow',sans-serif", marginTop:1,
                  }}>{coach.phone}</div>
                )}
                {team && (
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:5, marginTop:6,
                    background:`${team.color}18`, border:`1px solid ${team.color}33`,
                    borderRadius:20, padding:"2px 9px",
                  }}>
                    <span style={{ fontSize:11 }}>{team.emoji}</span>
                    <span style={{
                      fontSize:8, color:team.color, letterSpacing:1.5,
                      fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
                    }}>{team.name}</span>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <div style={{
                  background:"rgba(79,195,247,0.12)",
                  border:"1px solid rgba(79,195,247,0.3)",
                  borderRadius:20, padding:"3px 10px",
                  fontSize:8, color:BLUE,
                  fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                }}>COACH</div>
                {coach.license && (
                  <div style={{
                    fontSize:8, color:"rgba(255,255,255,0.22)",
                    fontFamily:"'Barlow',sans-serif",
                  }}>{coach.license}</div>
                )}
                <button
                  onClick={() => removeCoach(coach.id)}
                  style={{
                    background:"rgba(200,16,46,0.1)",
                    border:"1px solid rgba(200,16,46,0.25)",
                    borderRadius:8, padding:"3px 8px",
                    fontSize:9, color:RED, cursor:"pointer",
                    fontFamily:"'Barlow',sans-serif",
                  }}
                >Retirer</button>
              </div>
            </div>
          </GCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ADMIN — PLAYERS MANAGER
// ═══════════════════════════════════════════════
function PlayersManager({ players, setPlayers, teams }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", position:"Attaquant", number:"", teamId:"" });
  const [filterTeam, setFilterTeam] = useState("all");
  const [toast, showToast] = useToast();

  const addPlayer = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setPlayers(ps => [...ps, {
      ...form, id:Date.now(), status:"active",
      teamId:form.teamId ? parseInt(form.teamId) : null,
    }]);
    setForm({ name:"", email:"", position:"Attaquant", number:"", teamId:"" });
    setShowForm(false);
    showToast("✅ Joueur inscrit !");
  };

  const assignTeam = (playerId, teamId) => {
    setPlayers(ps => ps.map(p =>
      p.id===playerId ? { ...p, teamId:teamId?parseInt(teamId):null } : p
    ));
  };

  const removePlayer = (id) => {
    setPlayers(ps => ps.filter(p => p.id !== id));
    showToast("🗑 Joueur retiré");
  };

  const filtered = filterTeam==="all"
    ? players
    : filterTeam==="none"
    ? players.filter(p => !p.teamId)
    : players.filter(p => p.teamId===parseInt(filterTeam));

  const canAdd = form.name.trim() && form.email.trim();

  return (
    <div>
      <Toast msg={toast}/>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"Total",       val:players.length,                          color:BLUE,  icon:"👥" },
          { label:"Sans équipe", val:players.filter(p=>!p.teamId).length,    color:GOLD,  icon:"⚠️" },
        ].map(s => (
          <GCard key={s.label} style={{ padding:"14px", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <AnimNum to={s.val} color={s.color} size={26}/>
            <div style={{
              fontSize:7, color:"rgba(255,255,255,0.35)",
              letterSpacing:1.5, textTransform:"uppercase",
              fontFamily:"'Barlow',sans-serif", marginTop:4,
            }}>{s.label}</div>
          </GCard>
        ))}
      </div>

      {/* Add button */}
      <GCard
        onClick={() => setShowForm(s => !s)}
        style={{
          padding:"14px 20px", marginBottom:14,
          background: showForm
            ? "rgba(200,16,46,0.1)"
            : "linear-gradient(135deg,rgba(200,16,46,0.9),rgba(160,13,39,0.9))",
          border: showForm ? "1px solid rgba(200,16,46,0.4)" : "none",
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}
      >
        <span style={{ fontSize:16 }}>{showForm?"✕":"+"}</span>
        <span style={{
          color:"#fff", fontSize:12, fontWeight:900,
          fontFamily:"'Barlow Condensed',sans-serif",
          letterSpacing:2, textTransform:"uppercase",
        }}>{showForm ? "ANNULER" : "INSCRIRE UN JOUEUR"}</span>
      </GCard>

      {/* Form */}
      <div style={{
        overflow:"hidden",
        maxHeight:showForm ? 600 : 0,
        transition:"max-height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        marginBottom:showForm ? 16 : 0,
        opacity:showForm ? 1 : 0,
      }}>
        <GCard style={{ padding:"20px" }}>
          <Field label="Nom complet" value={form.name}
            onChange={e => setForm(p => ({ ...p, name:e.target.value }))}/>
          <Field label="Email" type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email:e.target.value }))}/>
          <Field label="Numéro de maillot" type="number" value={form.number}
            onChange={e => setForm(p => ({ ...p, number:e.target.value }))}/>

          <SelectField label="Poste"
            value={form.position}
            onChange={e => setForm(p => ({ ...p, position:e.target.value }))}>
            {POSITIONS.map(pos => (
              <option key={pos} style={{ background:"#111" }}>{pos}</option>
            ))}
          </SelectField>

          <SelectField label="Équipe"
            value={form.teamId}
            onChange={e => setForm(p => ({ ...p, teamId:e.target.value }))}>
            <option value="" style={{ background:"#111" }}>— Sans équipe —</option>
            {teams.map(t => (
              <option key={t.id} value={t.id} style={{ background:"#111" }}>
                {t.emoji} {t.name} ({t.category})
              </option>
            ))}
          </SelectField>

          <Btn onClick={addPlayer} disabled={!canAdd}>
            INSCRIRE LE JOUEUR
          </Btn>
        </GCard>
      </div>

      {/* Filter chips */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:14 }}>
        {[
          { id:"all",  label:`Tous (${players.length})`, color:"#fff" },
          { id:"none", label:`⚠️ Sans équipe (${players.filter(p=>!p.teamId).length})`, color:GOLD },
          ...teams.map(t => ({
            id:String(t.id),
            label:`${t.emoji} ${t.name}`,
            color:t.color,
          })),
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterTeam(f.id)}
            style={{
              background: filterTeam===f.id ? `${f.color}22` : "rgba(255,255,255,0.05)",
              border:`1px solid ${filterTeam===f.id ? f.color+"66" : "rgba(255,255,255,0.08)"}`,
              borderRadius:20, padding:"6px 14px",
              color:filterTeam===f.id ? f.color : "rgba(255,255,255,0.4)",
              fontSize:8, whiteSpace:"nowrap", cursor:"pointer",
              fontFamily:"'Barlow',sans-serif", letterSpacing:1.5,
              transition:"all 0.2s",
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Player list */}
      {filtered.map(p => {
        const team = teams.find(t => t.id===p.teamId);
        return (
          <GCard key={p.id} style={{ padding:"14px 16px", marginBottom:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:44, height:44, borderRadius:14,
                background:team ? `${team.color}22` : "rgba(255,255,255,0.06)",
                border:`1px solid ${team ? team.color+"44" : "rgba(255,255,255,0.1)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:15, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0,
              }}>{p.number||"?"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:13, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif",
                }}>{p.name}</div>
                <div style={{
                  fontSize:9, color:"rgba(255,255,255,0.3)",
                  fontFamily:"'Barlow',sans-serif", marginTop:1,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>{p.email}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span style={{
                    fontSize:7, color:BLUE, letterSpacing:1.5,
                    fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
                  }}>{p.position}</span>
                  {team && (
                    <span style={{
                      fontSize:7, color:team.color, letterSpacing:1.2,
                      fontFamily:"'Barlow',sans-serif",
                      background:`${team.color}18`, borderRadius:20, padding:"1px 7px",
                    }}>{team.emoji} {team.name}</span>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <div style={{
                  width:8, height:8, borderRadius:"50%",
                  background:STATUS_C[p.status]||"#666",
                  boxShadow:`0 0 8px ${STATUS_C[p.status]||"#666"}`,
                }}/>
                <button
                  onClick={() => removePlayer(p.id)}
                  style={{
                    background:"rgba(200,16,46,0.1)",
                    border:"1px solid rgba(200,16,46,0.25)",
                    borderRadius:8, padding:"3px 8px",
                    fontSize:8, color:RED, cursor:"pointer",
                    fontFamily:"'Barlow',sans-serif",
                  }}
                >✕</button>
              </div>
            </div>

            {/* Team assignment */}
            <div style={{
              marginTop:10, paddingTop:10,
              borderTop:"1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{
                fontSize:7, color:"rgba(255,255,255,0.22)", letterSpacing:2,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:6,
              }}>Affecter à une équipe</div>
              <select
                value={p.teamId||""}
                onChange={e => assignTeam(p.id, e.target.value)}
                style={{
                  width:"100%", background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)", borderRadius:10,
                  padding:"8px 12px", color:"#fff",
                  fontFamily:"'Barlow',sans-serif", fontSize:12, outline:"none",
                }}
              >
                <option value="" style={{ background:"#111" }}>— Sans équipe —</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id} style={{ background:"#111" }}>
                    {t.emoji} {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          </GCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ADMIN VIEW (tabs)
// ═══════════════════════════════════════════════
function AdminView({ players, setPlayers, teams, setTeams, coaches, setCoaches }) {
  const [adminTab, setAdminTab] = useState("equipes");
  const TABS = [
    { id:"equipes", icon:"🏟️", label:"Équipes"  },
    { id:"coachs",  icon:"🧑‍🏫", label:"Coachs"   },
    { id:"joueurs", icon:"👥",  label:"Joueurs"  },
  ];
  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        {/* Counters */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
          {[
            { label:"Équipes", val:teams.length,   color:RED,   icon:"🏟️" },
            { label:"Coachs",  val:coaches.length, color:BLUE,  icon:"🧑‍🏫" },
            { label:"Joueurs", val:players.length, color:GREEN, icon:"👥"  },
          ].map(s => (
            <GCard key={s.label} style={{ padding:"14px 10px", textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:5 }}>{s.icon}</div>
              <AnimNum to={s.val} color={s.color} size={24}/>
              <div style={{
                fontSize:7, color:"rgba(255,255,255,0.35)",
                letterSpacing:1.5, textTransform:"uppercase",
                fontFamily:"'Barlow',sans-serif", marginTop:3,
              }}>{s.label}</div>
            </GCard>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setAdminTab(t.id)}
              style={{
                flex:1,
                background: adminTab===t.id
                  ? "linear-gradient(135deg,rgba(200,16,46,0.85),rgba(140,10,30,0.85))"
                  : "rgba(255,255,255,0.05)",
                border: adminTab===t.id ? "none" : "1px solid rgba(255,255,255,0.08)",
                borderRadius:16, padding:"10px 6px",
                color: adminTab===t.id ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize:9, cursor:"pointer",
                fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                textTransform:"uppercase", transition:"all 0.25s",
                boxShadow: adminTab===t.id ? "0 4px 16px rgba(200,16,46,0.4)" : "none",
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              }}
            >
              <span style={{ fontSize:18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {adminTab==="equipes" && (
          <TeamsManager
            teams={teams} setTeams={setTeams}
            coaches={coaches} players={players}
          />
        )}
        {adminTab==="coachs" && (
          <CoachesManager
            coaches={coaches} setCoaches={setCoaches}
            teams={teams}
          />
        )}
        {adminTab==="joueurs" && (
          <PlayersManager
            players={players} setPlayers={setPlayers}
            teams={teams}
          />
        )}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// ACCESS DENIED
// ═══════════════════════════════════════════════
function AccessDenied({ tab, onLogin }) {
  const msgs = {
    home:    { icon:"🏠", title:"Accès réservé", sub:"Connectez-vous pour voir le tableau de bord." },
    players: { icon:"👥", title:"Réservé aux membres", sub:"Connectez-vous pour accéder à l'effectif." },
    agenda:  { icon:"📅", title:"Agenda privé", sub:"Connectez-vous pour voir le calendrier." },
    admin:   { icon:"⚙️", title:"Zone admin", sub:"Réservé aux administrateurs du club." },
  };
  const m = msgs[tab] || msgs.home;
  return (
    <div style={{
      minHeight:"60vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 20px", textAlign:"center",
    }}>
      <div style={{ fontSize:56, marginBottom:16 }}>{m.icon}</div>
      <div style={{
        fontFamily:"'Barlow Condensed',sans-serif",
        fontSize:26, fontWeight:900, color:"#fff", marginBottom:10,
      }}>{m.title}</div>
      <div style={{
        fontSize:14, color:"rgba(255,255,255,0.45)",
        fontFamily:"'Barlow',sans-serif",
        marginBottom:28, maxWidth:300, lineHeight:1.6,
      }}>{m.sub}</div>
      <button
        onClick={onLogin}
        style={{
          background:"linear-gradient(135deg,#c8102e,#a00d27)",
          border:"none", borderRadius:16, padding:"15px 40px",
          color:"#fff", fontFamily:"'Barlow Condensed',sans-serif",
          fontSize:14, fontWeight:900, letterSpacing:2,
          cursor:"pointer", boxShadow:"0 8px 28px rgba(200,16,46,0.4)",
        }}
      >SE CONNECTER →</button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PLAN BADGE
// ═══════════════════════════════════════════════
function PlanBadge({ plan }) {
  const p = PLANS[plan] || PLANS.starter;
  return (
    <div style={{
      background:`${p.color}18`, border:`1px solid ${p.color}44`,
      borderRadius:20, padding:"4px 12px",
      display:"inline-flex", alignItems:"center", gap:6,
    }}>
      <div style={{
        width:6, height:6, borderRadius:"50%",
        background:p.color, boxShadow:`0 0 8px ${p.color}`,
      }}/>
      <span style={{
        fontSize:9, color:p.color, letterSpacing:1.5,
        fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", fontWeight:700,
      }}>{p.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════
// AUTH SCREENS
// ═══════════════════════════════════════════════
function LoginScreen({ onLogin, onGuest }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const tryLogin = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const u = DEMO_USERS.find(u => u.email===email.trim() && u.password===pwd);
      if (!u) { setError("Email ou mot de passe incorrect."); return; }
      if (!u.validated) { setError("Inscription en attente de validation."); return; }
      onLogin(u);
    }, 800);
  };

  const quickLogin = (u) => { setEmail(u.email); setPwd(u.password); setDemoOpen(false); };

  const roleGroups = [
    { role:"admin",  label:"Admin",   icon:"⚙️",  color:RED  },
    { role:"coach",  label:"Coachs",  icon:"🧑‍🏫", color:BLUE },
    { role:"player", label:"Joueurs", icon:"⚽",  color:GREEN },
  ];

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"24px 20px", position:"relative", overflow:"hidden",
    }}>
      {/* Background rings */}
      {[500,300,160].map((s,i) => (
        <div key={s} style={{
          position:"absolute", top:"50%", left:"50%",
          width:s, height:s, borderRadius:"50%",
          border:`1px solid rgba(200,16,46,${i===1?0.1:0.06})`,
          transform:"translate(-50%,-50%)",
          animation:`spinR ${25-i*5}s linear infinite ${i===1?"reverse":""}`,
          pointerEvents:"none",
        }}/>
      ))}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        width:160, height:160, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(200,16,46,0.1) 0%,transparent 70%)",
        transform:"translate(-50%,-50%)", pointerEvents:"none",
      }}/>

      <FadeIn>
        <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", alignItems:"center" }}>
          {/* Logo */}
          <div style={{ marginBottom:20, filter:"drop-shadow(0 0 28px rgba(200,16,46,0.55))" }}>
            <HexLogo size={96}/>
          </div>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:30, fontWeight:900, color:"#fff",
            letterSpacing:2, marginBottom:4,
          }}>FC MANAGER PRO</div>
          <div style={{
            fontSize:11, color:"rgba(255,255,255,0.35)",
            letterSpacing:2, fontFamily:"'Barlow',sans-serif", marginBottom:32,
          }}>SAISON 2025 / 2026</div>

          {/* Form */}
          <div style={{
            width:"100%", background:"rgba(255,255,255,0.04)",
            backdropFilter:"blur(24px)",
            border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:24, padding:"26px 22px", marginBottom:16,
          }}>
            <div style={{
              fontSize:11, fontWeight:900, color:"#fff",
              fontFamily:"'Barlow Condensed',sans-serif",
              letterSpacing:2, marginBottom:20,
            }}>CONNEXION</div>

            <Field label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr"/>

            <div style={{ marginBottom:20 }}>
              <div style={{
                fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:2,
                fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:6,
              }}>Mot de passe</div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPwd?"text":"password"}
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && tryLogin()}
                  placeholder="••••••••"
                  style={{
                    width:"100%", background:"rgba(255,255,255,0.055)",
                    border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:14,
                    padding:"13px 48px 13px 16px", color:"#fff",
                    fontFamily:"'Barlow',sans-serif", fontSize:14,
                    outline:"none", boxSizing:"border-box",
                  }}
                />
                <button
                  onClick={() => setShowPwd(s => !s)}
                  style={{
                    position:"absolute", right:14, top:"50%",
                    transform:"translateY(-50%)",
                    background:"none", border:"none",
                    color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:16,
                  }}
                >{showPwd ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {error && (
              <div style={{
                background:"rgba(200,16,46,0.12)",
                border:"1px solid rgba(200,16,46,0.35)",
                borderRadius:12, padding:"10px 14px", marginBottom:14,
                fontSize:12, color:"#ff6b6b",
                fontFamily:"'Barlow',sans-serif",
                display:"flex", gap:8, alignItems:"center",
              }}>⚠ {error}</div>
            )}

            <button
              onClick={tryLogin} disabled={loading}
              style={{
                width:"100%", marginBottom:14,
                background: loading
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg,#c8102e,#a00d27)",
                border:"none", borderRadius:16, padding:"15px",
                color:"#fff", fontFamily:"'Barlow Condensed',sans-serif",
                fontSize:14, fontWeight:900, letterSpacing:2,
                cursor:loading?"not-allowed":"pointer",
                boxShadow:loading?"none":"0 8px 28px rgba(200,16,46,0.4)",
                transition:"all 0.3s",
              }}
            >{loading ? "Connexion…" : "SE CONNECTER →"}</button>

            <button
              onClick={onGuest}
              style={{
                width:"100%", background:"transparent",
                border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"13px",
                color:"rgba(255,255,255,0.5)",
                fontFamily:"'Barlow Condensed',sans-serif",
                fontSize:13, fontWeight:700, letterSpacing:1.5, cursor:"pointer",
              }}
            >🛒 ACCÉDER À LA BOUTIQUE</button>
          </div>

          {/* Demo accounts */}
          <button
            onClick={() => setDemoOpen(o => !o)}
            style={{
              background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:20, padding:"8px 18px",
              fontSize:10, color:"rgba(255,255,255,0.4)",
              fontFamily:"'Barlow',sans-serif",
              letterSpacing:1.5, cursor:"pointer",
              marginBottom:demoOpen?12:0, textTransform:"uppercase",
            }}
          >🎮 Comptes démo {demoOpen?"▲":"▼"}</button>

          {demoOpen && (
            <FadeIn>
              <div style={{
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px", width:"100%",
              }}>
                <div style={{
                  fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:2,
                  fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:10,
                }}>Connexion rapide</div>

                {roleGroups.map(group => (
                  <div key={group.role} style={{ marginBottom:12 }}>
                    <div style={{
                      fontSize:7, color:group.color, letterSpacing:2,
                      fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
                      marginBottom:6, display:"flex", alignItems:"center", gap:5,
                    }}>
                      <span>{group.icon}</span> {group.label}
                    </div>
                    {DEMO_USERS.filter(u => u.role===group.role).map(u => (
                      <button
                        key={u.id}
                        onClick={() => quickLogin(u)}
                        style={{
                          width:"100%",
                          background:`rgba(${group.role==="admin"?"200,16,46":group.role==="coach"?"79,195,247":"57,255,20"},0.08)`,
                          border:`1px solid rgba(${group.role==="admin"?"200,16,46":group.role==="coach"?"79,195,247":"57,255,20"},0.2)`,
                          borderRadius:12, padding:"9px 14px", marginBottom:5,
                          cursor:"pointer",
                          display:"flex", alignItems:"center", gap:10, textAlign:"left",
                        }}
                      >
                        <span style={{ fontSize:16 }}>{group.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{
                            fontSize:11, fontWeight:700, color:"#fff",
                            fontFamily:"'Barlow Condensed',sans-serif",
                          }}>{u.name || u.club}</div>
                          <div style={{
                            fontSize:8, color:"rgba(255,255,255,0.3)",
                            fontFamily:"'Barlow',sans-serif",
                          }}>{u.email}</div>
                        </div>
                        <div style={{
                          background:`rgba(${group.role==="admin"?"200,16,46":group.role==="coach"?"79,195,247":"57,255,20"},0.15)`,
                          border:`1px solid rgba(${group.role==="admin"?"200,16,46":group.role==="coach"?"79,195,247":"57,255,20"},0.3)`,
                          borderRadius:20, padding:"2px 8px",
                          fontSize:7, color:group.color,
                          fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                        }}>{group.label.toUpperCase().slice(0,-1)}</div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </FadeIn>
    </div>
  );
}


// ═══════════════════════════════════════════════
// PLAYER PROFILE PAGE
// ═══════════════════════════════════════════════
function PlayerProfile({ currentUser, players, events, setEvents, teams }) {
  const [activeTab, setActiveTab] = useState("stats");
  const [toast, showToast] = useToast();

  // Match currentUser to a player record
  const playerRecord = players.find(
    p => p.name === currentUser.name || p.id === currentUser.id
  ) || players[0];

  const team = playerRecord ? teams.find(t => t.id === playerRecord.teamId) : null;

  // Stats for this player (season simulated)
  const SEASON = {
    goals: 8, assists: 5, yellowCards: 2, redCards: 0,
    matchesPlayed: 14, minutesPlayed: 1180,
    successfulDribbles: 32, duelsWon: 58, shotAccuracy: 64,
    passAccuracy: 79,
  };

  // Next upcoming event needing confirmation
  const now = "2026-03-05";
  const upcoming = events
    .filter(e => e.date >= now)
    .sort((a,b) => a.date.localeCompare(b.date));
  const nextEvent = upcoming[0] || null;
  const myConfirmation = nextEvent
    ? (nextEvent.attendance || {})[currentUser.id]
    : null;

  const [confirmModal, setConfirmModal] = useState(false);
  const [absenceStep, setAbsenceStep]   = useState("choice");
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceNote, setAbsenceNote]   = useState("");

  const confirmPresence = (present, reason, note) => {
    setEvents(evs => evs.map(ev =>
      ev.id === nextEvent.id
        ? { ...ev, attendance:{
            ...ev.attendance,
            [currentUser.id]: { present, reason:reason||null, note:note||"" },
          }}
        : ev
    ));
    setConfirmModal(false);
    setAbsenceStep("choice");
    setAbsenceReason(""); setAbsenceNote("");
    showToast(present ? "✅ Présence confirmée !" : "📋 Absence enregistrée");
  };

  const TABS = [
    { id:"stats", label:"Stats", icon:"📊" },
    { id:"season", label:"Saison", icon:"📈" },
    { id:"events", label:"Événements", icon:"📅" },
  ];

  const statRows = [
    { label:"Buts",              val:SEASON.goals,             icon:"⚽", color:GREEN },
    { label:"Passes déc.",       val:SEASON.assists,           icon:"🎯", color:BLUE  },
    { label:"Matchs joués",      val:SEASON.matchesPlayed,     icon:"🏟️", color:"#fff" },
    { label:"Minutes jouées",    val:SEASON.minutesPlayed,     icon:"⏱",  color:GOLD  },
    { label:"Cartons jaunes",    val:SEASON.yellowCards,       icon:"🟨", color:GOLD  },
    { label:"Cartons rouges",    val:SEASON.redCards,          icon:"🟥", color:RED   },
    { label:"Dribbles réussis",  val:SEASON.successfulDribbles,icon:"🏃", color:"#a29bfe" },
    { label:"Duels gagnés",      val:SEASON.duelsWon,          icon:"💪", color:"#fd79a8" },
  ];

  const rateRows = [
    { label:"Précision tir",   val:SEASON.shotAccuracy,  color:GREEN },
    { label:"Précision passe", val:SEASON.passAccuracy,  color:BLUE  },
    { label:"Duels gagnés",    val:SEASON.duelsWon,      color:GOLD  },
  ];

  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        <Toast msg={toast}/>

        {/* ── Hero card ── */}
        <div style={{
          background:"linear-gradient(135deg,rgba(200,16,46,0.18),rgba(200,16,46,0.05))",
          border:"1px solid rgba(200,16,46,0.25)",
          borderRadius:24, padding:"22px 20px", marginBottom:16,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{
            position:"absolute", top:-30, right:-30,
            width:120, height:120, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(200,16,46,0.15),transparent 70%)",
            pointerEvents:"none",
          }}/>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{
              width:72, height:72, borderRadius:22,
              background:team ? `${team.color}22` : "rgba(200,16,46,0.2)",
              border:`2px solid ${team ? team.color+"55" : "rgba(200,16,46,0.4)"}`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:36, flexShrink:0,
            }}>⚽</div>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:22, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
              }}>{currentUser.name || "Joueur"}</div>
              <div style={{
                fontSize:10, color:"rgba(255,255,255,0.45)",
                fontFamily:"'Barlow',sans-serif", marginTop:4,
              }}>{currentUser.email}</div>
              <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                {playerRecord && (
                  <div style={{
                    background:"rgba(79,195,247,0.12)",
                    border:"1px solid rgba(79,195,247,0.3)",
                    borderRadius:20, padding:"3px 10px",
                    fontSize:8, color:BLUE,
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>#{playerRecord.number} · {playerRecord.position}</div>
                )}
                {team && (
                  <div style={{
                    background:`${team.color}18`,
                    border:`1px solid ${team.color}33`,
                    borderRadius:20, padding:"3px 10px",
                    fontSize:8, color:team.color,
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>{team.emoji} {team.name}</div>
                )}
                <div style={{
                  background:"rgba(57,255,20,0.12)",
                  border:"1px solid rgba(57,255,20,0.3)",
                  borderRadius:20, padding:"3px 10px",
                  fontSize:8, color:GREEN,
                  fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                }}>● Actif</div>
              </div>
            </div>
          </div>
          {/* Quick stat pills */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)",
            gap:8, marginTop:18,
          }}>
            {[
              { v:SEASON.goals,        l:"Buts",     c:GREEN },
              { v:SEASON.assists,      l:"Passes",   c:BLUE  },
              { v:SEASON.matchesPlayed,l:"Matchs",   c:"#fff" },
              { v:SEASON.yellowCards,  l:"Cartons",  c:GOLD  },
            ].map(s => (
              <div key={s.l} style={{
                background:"rgba(255,255,255,0.05)",
                borderRadius:14, padding:"10px 8px", textAlign:"center",
              }}>
                <div style={{
                  fontSize:22, fontWeight:900, color:s.c,
                  fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
                }}>{s.v}</div>
                <div style={{
                  fontSize:7, color:"rgba(255,255,255,0.35)",
                  letterSpacing:1.5, textTransform:"uppercase",
                  fontFamily:"'Barlow',sans-serif", marginTop:3,
                }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Confirmation Banner (urgent) ── */}
        {nextEvent && !myConfirmation && (
          <div style={{
            background:"linear-gradient(135deg,rgba(255,165,0,0.18),rgba(255,165,0,0.06))",
            border:"2px solid rgba(255,165,0,0.5)",
            borderRadius:20, padding:"16px 18px", marginBottom:16,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{
              position:"absolute", top:-20, right:-20,
              width:80, height:80, borderRadius:"50%",
              background:"radial-gradient(circle,rgba(255,165,0,0.2),transparent)",
              pointerEvents:"none",
            }}/>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{
                width:40, height:40, borderRadius:13,
                background:"rgba(255,165,0,0.18)",
                border:"1px solid rgba(255,165,0,0.4)",
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:20, flexShrink:0,
              }}>⚠️</div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:11, fontWeight:900, color:"#FFA500",
                  fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1.5,
                }}>CONFIRMATION REQUISE</div>
                <div style={{
                  fontSize:12, fontWeight:900, color:"#fff",
                  fontFamily:"'Barlow Condensed',sans-serif", marginTop:2,
                }}>{nextEvent.title}</div>
                <div style={{
                  fontSize:9, color:"rgba(255,255,255,0.5)",
                  fontFamily:"'Barlow',sans-serif", marginTop:2,
                }}>{nextEvent.date} · {nextEvent.time} · {nextEvent.location}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => confirmPresence(true)} style={{
                flex:1, background:"linear-gradient(135deg,rgba(57,255,20,0.25),rgba(57,255,20,0.1))",
                border:"2px solid rgba(57,255,20,0.5)", borderRadius:14,
                padding:"12px 8px", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              }}>
                <span style={{ fontSize:20 }}>✅</span>
                <span style={{
                  fontSize:10, fontWeight:900, color:GREEN,
                  fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1,
                }}>PRÉSENT</span>
              </button>
              <button onClick={() => { setConfirmModal(true); setAbsenceStep("choice"); }} style={{
                flex:1, background:"linear-gradient(135deg,rgba(200,16,46,0.2),rgba(200,16,46,0.08))",
                border:"2px solid rgba(200,16,46,0.45)", borderRadius:14,
                padding:"12px 8px", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              }}>
                <span style={{ fontSize:20 }}>❌</span>
                <span style={{
                  fontSize:10, fontWeight:900, color:RED,
                  fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1,
                }}>ABSENT</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmed banner */}
        {nextEvent && myConfirmation && (
          <div style={{
            background: myConfirmation.present
              ? "linear-gradient(135deg,rgba(57,255,20,0.12),rgba(57,255,20,0.04))"
              : "linear-gradient(135deg,rgba(200,16,46,0.12),rgba(200,16,46,0.04))",
            border:`1px solid ${myConfirmation.present?"rgba(57,255,20,0.35)":"rgba(200,16,46,0.35)"}`,
            borderRadius:18, padding:"14px 18px", marginBottom:16,
            display:"flex", alignItems:"center", gap:12,
          }}>
            <span style={{ fontSize:28 }}>
              {myConfirmation.present ? "✅" : "❌"}
            </span>
            <div>
              <div style={{
                fontSize:12, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",
              }}>{nextEvent.title}</div>
              <div style={{
                fontSize:10, color:myConfirmation.present ? GREEN : RED,
                fontFamily:"'Barlow',sans-serif", marginTop:2,
              }}>
                {myConfirmation.present
                  ? "Votre présence est confirmée"
                  : `Absent · ${ABSENCE_REASONS.find(r=>r.id===myConfirmation.reason)?.label||"Motif enregistré"}`}
              </div>
            </div>
            <button onClick={() => {
              setEvents(evs => evs.map(ev =>
                ev.id===nextEvent.id
                  ? { ...ev, attendance:{ ...ev.attendance, [currentUser.id]:null }}
                  : ev
              ));
            }} style={{
              marginLeft:"auto", background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:8,
              padding:"4px 10px", fontSize:8, color:"rgba(255,255,255,0.35)",
              cursor:"pointer", fontFamily:"'Barlow',sans-serif",
            }}>Modifier</button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex:1,
              background: activeTab===t.id
                ? "linear-gradient(135deg,rgba(200,16,46,0.85),rgba(140,10,30,0.85))"
                : "rgba(255,255,255,0.05)",
              border: activeTab===t.id ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius:14, padding:"10px 4px",
              color: activeTab===t.id ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize:9, cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1.5,
              textTransform:"uppercase", transition:"all 0.25s",
              boxShadow: activeTab===t.id ? "0 4px 16px rgba(200,16,46,0.4)" : "none",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            }}>
              <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Stats tab ── */}
        {activeTab==="stats" && (
          <FadeIn>
            <div>
              <div style={{
                display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16,
              }}>
                {statRows.slice(0,4).map(r => (
                  <GCard key={r.label} style={{ padding:"16px 14px", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{r.icon}</div>
                    <div style={{
                      fontSize:28, fontWeight:900, color:r.color,
                      fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
                    }}>{r.val}</div>
                    <div style={{
                      fontSize:8, color:"rgba(255,255,255,0.35)",
                      letterSpacing:1.5, textTransform:"uppercase",
                      fontFamily:"'Barlow',sans-serif", marginTop:4,
                    }}>{r.label}</div>
                  </GCard>
                ))}
              </div>
              {/* Cards + Dribbles */}
              <GCard style={{ padding:"18px" }}>
                <div style={{
                  fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.35)",
                  letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", marginBottom:14,
                }}>Discipline & Technique</div>
                {statRows.slice(4).map(r => (
                  <div key={r.label} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 0",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:18 }}>{r.icon}</span>
                      <span style={{
                        fontSize:12, color:"rgba(255,255,255,0.65)",
                        fontFamily:"'Barlow',sans-serif",
                      }}>{r.label}</span>
                    </div>
                    <span style={{
                      fontSize:18, fontWeight:900, color:r.color,
                      fontFamily:"'Barlow Condensed',sans-serif",
                    }}>{r.val}</span>
                  </div>
                ))}
              </GCard>
            </div>
          </FadeIn>
        )}

        {/* ── Season tab ── */}
        {activeTab==="season" && (
          <FadeIn>
            <div>
              <GCard style={{ padding:"18px", marginBottom:14 }}>
                <div style={{
                  fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.35)",
                  letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", marginBottom:16,
                }}>Taux de réussite</div>
                {rateRows.map(r => (
                  <div key={r.label} style={{ marginBottom:14 }}>
                    <div style={{
                      display:"flex", justifyContent:"space-between", marginBottom:5,
                    }}>
                      <span style={{
                        fontSize:11, color:"rgba(255,255,255,0.55)",
                        fontFamily:"'Barlow',sans-serif",
                      }}>{r.label}</span>
                      <span style={{
                        fontSize:13, fontWeight:900, color:r.color,
                        fontFamily:"'Barlow Condensed',sans-serif",
                      }}>{r.val}%</span>
                    </div>
                    <div style={{
                      height:6, background:"rgba(255,255,255,0.06)",
                      borderRadius:6, overflow:"hidden",
                    }}>
                      <div style={{
                        height:"100%", width:`${r.val}%`,
                        background:`linear-gradient(90deg,${r.color},${r.color}88)`,
                        borderRadius:6, transition:"width 1s ease",
                      }}/>
                    </div>
                  </div>
                ))}
              </GCard>
              {/* Minutes chart - simple bar visual */}
              <GCard style={{ padding:"18px" }}>
                <div style={{
                  fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.35)",
                  letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", marginBottom:14,
                }}>Temps de jeu · Saison</div>
                {[
                  { m:"Jan",v:90 },{ m:"Fév",v:75 },{ m:"Mar",v:60 },
                  { m:"Avr",v:90 },{ m:"Mai",v:45 },{ m:"Jun",v:80 },
                ].map(b => (
                  <div key={b.m} style={{
                    display:"flex", alignItems:"center", gap:10, marginBottom:8,
                  }}>
                    <div style={{
                      width:28, fontSize:9, color:"rgba(255,255,255,0.3)",
                      fontFamily:"'Barlow',sans-serif",
                    }}>{b.m}</div>
                    <div style={{
                      flex:1, height:8, background:"rgba(255,255,255,0.06)",
                      borderRadius:4, overflow:"hidden",
                    }}>
                      <div style={{
                        height:"100%", width:`${b.v}%`,
                        background:`linear-gradient(90deg,${BLUE},${BLUE}88)`,
                        borderRadius:4,
                      }}/>
                    </div>
                    <div style={{
                      width:36, fontSize:9, color:BLUE, textAlign:"right",
                      fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
                    }}>{b.v}'</div>
                  </div>
                ))}
              </GCard>
            </div>
          </FadeIn>
        )}

        {/* ── Events tab ── */}
        {activeTab==="events" && (
          <FadeIn>
            <div>
              {upcoming.length === 0 && (
                <GCard style={{ padding:"28px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
                  <div style={{
                    fontSize:13, color:"rgba(255,255,255,0.35)",
                    fontFamily:"'Barlow',sans-serif",
                  }}>Aucun événement à venir</div>
                </GCard>
              )}
              {upcoming.map((ev, idx) => {
                const conf = (ev.attendance||{})[currentUser.id];
                const isNext = idx === 0;
                return (
                  <GCard key={ev.id} style={{
                    padding:"14px 16px", marginBottom:10,
                    border: isNext && !conf
                      ? "1px solid rgba(255,165,0,0.45)"
                      : conf?.present
                      ? "1px solid rgba(57,255,20,0.25)"
                      : conf
                      ? "1px solid rgba(200,16,46,0.25)"
                      : "1px solid rgba(255,255,255,0.09)",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{
                        width:40, height:40, borderRadius:13,
                        background:"rgba(255,255,255,0.06)",
                        border:"1px solid rgba(255,255,255,0.1)",
                        display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:18, flexShrink:0,
                      }}>
                        {{ match:"⚽", training:"🏃", event:"📅" }[ev.type]}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{
                          fontSize:13, fontWeight:900, color:"#fff",
                          fontFamily:"'Barlow Condensed',sans-serif",
                        }}>{ev.title}</div>
                        <div style={{
                          fontSize:9, color:"rgba(255,255,255,0.35)",
                          fontFamily:"'Barlow',sans-serif", marginTop:2,
                        }}>{ev.date} · {ev.time}</div>
                      </div>
                      {!conf ? (
                        isNext ? (
                          <div style={{
                            background:"rgba(255,165,0,0.15)",
                            border:"1px solid rgba(255,165,0,0.4)",
                            borderRadius:20, padding:"3px 10px",
                            fontSize:8, color:"#FFA500",
                            fontFamily:"'Barlow',sans-serif",
                          }}>⏳ En attente</div>
                        ) : (
                          <div style={{
                            background:"rgba(255,255,255,0.06)",
                            border:"1px solid rgba(255,255,255,0.12)",
                            borderRadius:20, padding:"3px 10px",
                            fontSize:8, color:"rgba(255,255,255,0.35)",
                            fontFamily:"'Barlow',sans-serif",
                          }}>À confirmer</div>
                        )
                      ) : conf.present ? (
                        <div style={{
                          background:"rgba(57,255,20,0.12)",
                          border:"1px solid rgba(57,255,20,0.3)",
                          borderRadius:20, padding:"3px 10px",
                          fontSize:8, color:GREEN,
                          fontFamily:"'Barlow',sans-serif",
                        }}>✓ Présent</div>
                      ) : (
                        <div style={{
                          background:"rgba(200,16,46,0.12)",
                          border:"1px solid rgba(200,16,46,0.3)",
                          borderRadius:20, padding:"3px 10px",
                          fontSize:8, color:RED,
                          fontFamily:"'Barlow',sans-serif",
                        }}>✗ Absent</div>
                      )}
                    </div>
                  </GCard>
                );
              })}
            </div>
          </FadeIn>
        )}

        {/* ── Absence modal ── */}
        {confirmModal && (
          <div style={{
            position:"fixed", inset:0, zIndex:9000,
            background:"rgba(0,0,0,0.88)", backdropFilter:"blur(14px)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
          }}>
            <div style={{
              background:"#0d0d1a", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:"24px 24px 0 0", width:"100%", maxWidth:430,
              padding:"24px 20px 48px",
            }}>
              <div style={{
                width:36, height:4, borderRadius:2,
                background:"rgba(255,255,255,0.15)",
                margin:"0 auto 20px",
              }}/>
              {absenceStep === "choice" && (
                <FadeIn>
                  <div>
                    <div style={{
                      fontSize:14, fontWeight:900, color:RED,
                      fontFamily:"'Barlow Condensed',sans-serif",
                      letterSpacing:1.5, marginBottom:6,
                    }}>MOTIF D'ABSENCE</div>
                    <div style={{
                      fontSize:11, color:"rgba(255,255,255,0.4)",
                      fontFamily:"'Barlow',sans-serif", marginBottom:18,
                    }}>{nextEvent?.title}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {ABSENCE_REASONS.map(r => (
                        <button key={r.id} onClick={() => setAbsenceReason(r.id)} style={{
                          background: absenceReason===r.id
                            ? "rgba(200,16,46,0.28)" : "rgba(255,255,255,0.04)",
                          border:`1.5px solid ${absenceReason===r.id
                            ? "rgba(200,16,46,0.7)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius:14, padding:"11px 14px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:12, textAlign:"left",
                          transition:"all 0.2s",
                          transform:absenceReason===r.id ? "scale(1.02)" : "scale(1)",
                        }}>
                          <span style={{ fontSize:20 }}>{r.icon}</span>
                          <span style={{
                            fontSize:13, fontWeight:600, color:"#fff",
                            fontFamily:"'Barlow',sans-serif", flex:1,
                          }}>{r.label}</span>
                          {absenceReason===r.id && (
                            <span style={{ fontSize:14, color:RED }}>●</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {absenceReason && (
                      <button onClick={() => setAbsenceStep("note")} style={{
                        width:"100%", marginTop:14,
                        background:"linear-gradient(135deg,#c8102e,#a00d27)",
                        border:"none", borderRadius:14, padding:"13px",
                        color:"#fff", fontSize:12, fontWeight:900,
                        cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                        letterSpacing:2, boxShadow:"0 8px 24px rgba(200,16,46,0.35)",
                      }}>CONTINUER →</button>
                    )}
                    <button onClick={() => setConfirmModal(false)} style={{
                      width:"100%", marginTop:8,
                      background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:14, padding:"12px", color:"rgba(255,255,255,0.4)",
                      fontSize:12, cursor:"pointer",
                      fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
                    }}>ANNULER</button>
                  </div>
                </FadeIn>
              )}
              {absenceStep === "note" && (
                <FadeIn>
                  <div>
                    <button onClick={() => setAbsenceStep("choice")} style={{
                      background:"none", border:"none",
                      color:"rgba(255,255,255,0.4)", cursor:"pointer",
                      fontSize:12, fontFamily:"'Barlow',sans-serif",
                      marginBottom:16, display:"flex", alignItems:"center", gap:6, padding:0,
                    }}>← Retour</button>
                    <div style={{
                      fontSize:14, fontWeight:900, color:RED,
                      fontFamily:"'Barlow Condensed',sans-serif",
                      letterSpacing:1.5, marginBottom:16,
                    }}>NOTE OPTIONNELLE</div>
                    <textarea
                      value={absenceNote}
                      onChange={e => setAbsenceNote(e.target.value)}
                      placeholder="Précisez si besoin (facultatif)..."
                      rows={3}
                      style={{
                        width:"100%", background:"rgba(255,255,255,0.055)",
                        border:"1px solid rgba(255,255,255,0.1)", borderRadius:14,
                        padding:"12px 14px", color:"#fff",
                        fontFamily:"'Barlow',sans-serif", fontSize:13,
                        outline:"none", boxSizing:"border-box",
                        resize:"none", marginBottom:14,
                      }}
                    />
                    <button onClick={() => confirmPresence(false, absenceReason, absenceNote)} style={{
                      width:"100%",
                      background:"linear-gradient(135deg,#c8102e,#a00d27)",
                      border:"none", borderRadius:14, padding:"13px",
                      color:"#fff", fontSize:12, fontWeight:900,
                      cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
                      letterSpacing:2, boxShadow:"0 8px 24px rgba(200,16,46,0.35)",
                    }}>CONFIRMER MON ABSENCE</button>
                  </div>
                </FadeIn>
              )}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// COACH PROFILE PAGE
// ═══════════════════════════════════════════════
function CoachProfile({ currentUser, coaches, teams, players, events, setEvents, clubPlan }) {
  const [activeTab, setActiveTab] = useState("equipe");
  const [toast, showToast] = useToast();
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title:"", type:"training", date:"", time:"18:00", location:"", description:"",
  });
  const [rosterModal, setRosterModal] = useState(null);

  const canCreateEvent = ["pro","federation"].includes(clubPlan);

  // Coach data
  const coachRecord = coaches.find(c => c.id===currentUser.id) || coaches[0];
  const coachTeams  = teams.filter(t => t.coachId === currentUser.id);

  // All players in coach's teams
  const myPlayers = players.filter(p =>
    coachTeams.some(t => t.id === p.teamId)
  );

  // Upcoming events
  const now = "2026-03-05";
  const upcoming = events
    .filter(e => e.date >= now)
    .sort((a,b) => a.date.localeCompare(b.date));

  // Create event handler
  const createEvent = () => {
    if (!eventForm.title.trim() || !eventForm.date) return;
    const newEv = {
      id:Date.now(),
      ...eventForm,
      title:eventForm.title.trim(),
      attendance:{},
      createdBy:currentUser.id,
      teamIds:coachTeams.map(t=>t.id),
    };
    setEvents(evs => [...evs, newEv]);
    setCreateEventOpen(false);
    setEventForm({ title:"", type:"training", date:"", time:"18:00", location:"", description:"" });
    showToast("✅ Événement créé !");
  };

  // Add player to event roster
  const addPlayerToEvent = (eventId, playerId) => {
    setEvents(evs => evs.map(ev => {
      if (ev.id !== eventId) return ev;
      const roster = ev.roster ? [...ev.roster] : [];
      if (!roster.includes(playerId)) roster.push(playerId);
      return { ...ev, roster };
    }));
    showToast("✅ Joueur ajouté à l'événement");
  };

  const removePlayerFromEvent = (eventId, playerId) => {
    setEvents(evs => evs.map(ev => {
      if (ev.id !== eventId) return ev;
      return { ...ev, roster:(ev.roster||[]).filter(id=>id!==playerId) };
    }));
  };

  const TABS = [
    { id:"equipe",   label:"Mon équipe",  icon:"🏟️" },
    { id:"events",   label:"Événements",  icon:"📅" },
    { id:"classement",label:"Classement", icon:"🏆" },
  ];

  // Simulated league table
  const CLASSEMENT = [
    { rank:1, name:"PSG Seniors A",  pts:42, j:16, g:13, n:3, p:0, bp:38, bc:12 },
    { rank:2, name:"Lyon FC",        pts:35, j:16, g:11, n:2, p:3, bp:29, bc:18 },
    { rank:3, name:"OM Seniors",     pts:31, j:16, g:9,  n:4, p:3, bp:27, bc:20 },
    { rank:4, name:"Bordeaux",       pts:28, j:16, g:8,  n:4, p:4, bp:24, bc:22 },
    { rank:5, name:"Nantes",         pts:22, j:16, g:6,  n:4, p:6, bp:19, bc:25 },
    { rank:6, name:"Lens SC",        pts:18, j:16, g:5,  n:3, p:8, bp:16, bc:28 },
    { rank:7, name:"Rennes B",       pts:14, j:16, g:4,  n:2, p:10,bp:14, bc:32 },
    { rank:8, name:"Toulouse",       pts:10, j:16, g:2,  n:4, p:10,bp:10, bc:36 },
  ];
  const myTeamName = coachTeams[0]?.name || "";
  const myRank = CLASSEMENT.findIndex(c => c.name.includes("PSG")) + 1;

  return (
    <FadeIn>
      <div style={{ padding:"0 16px 120px" }}>
        <Toast msg={toast}/>

        {/* ── Hero card ── */}
        <div style={{
          background:"linear-gradient(135deg,rgba(79,195,247,0.16),rgba(79,195,247,0.04))",
          border:"1px solid rgba(79,195,247,0.28)",
          borderRadius:24, padding:"22px 20px", marginBottom:16,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{
            position:"absolute", top:-30, right:-30,
            width:120, height:120, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(79,195,247,0.15),transparent 70%)",
            pointerEvents:"none",
          }}/>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
            <div style={{
              width:72, height:72, borderRadius:22,
              background:"linear-gradient(135deg,rgba(79,195,247,0.25),rgba(79,195,247,0.08))",
              border:"2px solid rgba(79,195,247,0.4)",
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:36, flexShrink:0,
            }}>🧑‍🏫</div>
            <div style={{ flex:1 }}>
              <div style={{
                fontSize:22, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
              }}>{currentUser.name}</div>
              <div style={{
                fontSize:10, color:"rgba(255,255,255,0.45)",
                fontFamily:"'Barlow',sans-serif", marginTop:4,
              }}>{currentUser.email}</div>
              <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                <div style={{
                  background:"rgba(79,195,247,0.12)",
                  border:"1px solid rgba(79,195,247,0.3)",
                  borderRadius:20, padding:"3px 10px",
                  fontSize:8, color:BLUE,
                  fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                }}>🧑‍🏫 COACH</div>
                {coachRecord?.license && (
                  <div style={{
                    background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.12)",
                    borderRadius:20, padding:"3px 10px",
                    fontSize:8, color:"rgba(255,255,255,0.45)",
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>{coachRecord.license}</div>
                )}
                {!canCreateEvent && (
                  <div style={{
                    background:"rgba(255,215,0,0.1)",
                    border:"1px solid rgba(255,215,0,0.25)",
                    borderRadius:20, padding:"3px 10px",
                    fontSize:8, color:GOLD,
                    fontFamily:"'Barlow',sans-serif", letterSpacing:1,
                  }}>⬆️ Passer Pro pour créer des événements</div>
                )}
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[
              { v:coachTeams.length, l:"Équipes",  c:BLUE  },
              { v:myPlayers.length,  l:"Joueurs",  c:GREEN },
              { v:upcoming.length,   l:"À venir",  c:GOLD  },
            ].map(s => (
              <div key={s.l} style={{
                background:"rgba(255,255,255,0.05)", borderRadius:14,
                padding:"10px 8px", textAlign:"center",
              }}>
                <div style={{
                  fontSize:22, fontWeight:900, color:s.c,
                  fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1,
                }}>{s.v}</div>
                <div style={{
                  fontSize:7, color:"rgba(255,255,255,0.35)",
                  letterSpacing:1.5, textTransform:"uppercase",
                  fontFamily:"'Barlow',sans-serif", marginTop:3,
                }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex:1,
              background: activeTab===t.id
                ? "linear-gradient(135deg,rgba(79,195,247,0.7),rgba(2,136,209,0.7))"
                : "rgba(255,255,255,0.05)",
              border: activeTab===t.id ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius:14, padding:"10px 4px",
              color: activeTab===t.id ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize:9, cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1.5,
              textTransform:"uppercase", transition:"all 0.25s",
              boxShadow: activeTab===t.id ? "0 4px 16px rgba(79,195,247,0.35)" : "none",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            }}>
              <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Mon équipe tab ── */}
        {activeTab==="equipe" && (
          <FadeIn>
            <div>
              {coachTeams.length === 0 && (
                <GCard style={{ padding:"28px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🏟️</div>
                  <div style={{
                    fontSize:13, color:"rgba(255,255,255,0.35)",
                    fontFamily:"'Barlow',sans-serif",
                  }}>Aucune équipe assignée</div>
                </GCard>
              )}
              {coachTeams.map(team => {
                const teamPlayers = players.filter(p => p.teamId===team.id);
                return (
                  <div key={team.id}>
                    <GCard style={{ padding:"18px", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                        <div style={{
                          width:52, height:52, borderRadius:16,
                          background:`${team.color}22`, border:`2px solid ${team.color}55`,
                          display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:26, flexShrink:0,
                        }}>{team.emoji}</div>
                        <div style={{ flex:1 }}>
                          <div style={{
                            fontSize:18, fontWeight:900, color:"#fff",
                            fontFamily:"'Barlow Condensed',sans-serif",
                          }}>{team.name}</div>
                          <div style={{
                            fontSize:9, color:team.color, letterSpacing:2,
                            fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
                          }}>{team.category} · {teamPlayers.length} joueurs</div>
                        </div>
                      </div>
                      {/* Player rows */}
                      {teamPlayers.map(p => (
                        <div key={p.id} style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"9px 0",
                          borderBottom:"1px solid rgba(255,255,255,0.04)",
                        }}>
                          <div style={{
                            width:34, height:34, borderRadius:11,
                            background:`${team.color}18`,
                            border:`1px solid ${team.color}33`,
                            display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:12, fontWeight:900,
                            color:"#fff", fontFamily:"'Barlow Condensed',sans-serif",
                            flexShrink:0,
                          }}>{p.number}</div>
                          <div style={{ flex:1 }}>
                            <div style={{
                              fontSize:13, fontWeight:900, color:"#fff",
                              fontFamily:"'Barlow Condensed',sans-serif",
                            }}>{p.name}</div>
                            <div style={{
                              fontSize:8, color:"rgba(255,255,255,0.35)",
                              fontFamily:"'Barlow',sans-serif", marginTop:1,
                            }}>{p.position}</div>
                          </div>
                          <div style={{
                            width:8, height:8, borderRadius:"50%",
                            background:STATUS_C[p.status]||"#666",
                            boxShadow:`0 0 8px ${STATUS_C[p.status]||"#666"}`,
                          }}/>
                        </div>
                      ))}
                      {teamPlayers.length === 0 && (
                        <div style={{
                          fontSize:11, color:"rgba(255,255,255,0.25)",
                          fontFamily:"'Barlow',sans-serif",
                          textAlign:"center", padding:"12px 0",
                        }}>Aucun joueur dans cette équipe</div>
                      )}
                    </GCard>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        )}

        {/* ── Événements tab ── */}
        {activeTab==="events" && (
          <FadeIn>
            <div>
              {/* Create event button */}
              {canCreateEvent ? (
                <GCard onClick={() => setCreateEventOpen(o=>!o)} style={{
                  padding:"14px 20px", marginBottom:14,
                  background: createEventOpen
                    ? "rgba(79,195,247,0.1)"
                    : "linear-gradient(135deg,rgba(79,195,247,0.7),rgba(2,136,209,0.7))",
                  border: createEventOpen ? "1px solid rgba(79,195,247,0.4)" : "none",
                  cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  <span style={{ fontSize:16 }}>{createEventOpen?"✕":"+"}</span>
                  <span style={{
                    color:"#fff", fontSize:12, fontWeight:900,
                    fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
                  }}>{createEventOpen ? "ANNULER" : "CRÉER UN ÉVÉNEMENT"}</span>
                </GCard>
              ) : (
                <GCard style={{
                  padding:"14px 20px", marginBottom:14,
                  background:"rgba(255,215,0,0.06)",
                  border:"1px solid rgba(255,215,0,0.2)",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>🔒</span>
                    <div>
                      <div style={{
                        fontSize:11, fontWeight:900, color:GOLD,
                        fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1.5,
                      }}>FONCTIONNALITÉ PRO</div>
                      <div style={{
                        fontSize:10, color:"rgba(255,255,255,0.4)",
                        fontFamily:"'Barlow',sans-serif", marginTop:2,
                      }}>Passez à l'abonnement Pro pour créer des événements</div>
                    </div>
                  </div>
                </GCard>
              )}

              {/* Create event form */}
              <div style={{
                overflow:"hidden",
                maxHeight:createEventOpen ? 700 : 0,
                transition:"max-height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                marginBottom:createEventOpen ? 16 : 0,
                opacity:createEventOpen ? 1 : 0,
              }}>
                <GCard style={{ padding:"20px" }}>
                  <div style={{
                    fontSize:10, fontWeight:900, color:BLUE, letterSpacing:2,
                    fontFamily:"'Barlow Condensed',sans-serif", marginBottom:16,
                  }}>NOUVEL ÉVÉNEMENT</div>

                  <Field label="Titre" value={eventForm.title}
                    onChange={e => setEventForm(p => ({ ...p, title:e.target.value }))}
                    placeholder="ex: Entraînement tactique..."/>

                  <SelectField label="Type"
                    value={eventForm.type}
                    onChange={e => setEventForm(p => ({ ...p, type:e.target.value }))}>
                    <option value="training" style={{ background:"#111" }}>🏃 Entraînement</option>
                    <option value="match"    style={{ background:"#111" }}>⚽ Match</option>
                    <option value="event"    style={{ background:"#111" }}>📅 Événement</option>
                  </SelectField>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <Field label="Date" type="date" value={eventForm.date}
                      onChange={e => setEventForm(p => ({ ...p, date:e.target.value }))}/>
                    <Field label="Heure" type="time" value={eventForm.time}
                      onChange={e => setEventForm(p => ({ ...p, time:e.target.value }))}/>
                  </div>

                  <Field label="Lieu" value={eventForm.location}
                    onChange={e => setEventForm(p => ({ ...p, location:e.target.value }))}
                    placeholder="Terrain, salle..."/>

                  <div style={{ marginBottom:16 }}>
                    <div style={{
                      fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:2,
                      fontFamily:"'Barlow',sans-serif", textTransform:"uppercase", marginBottom:5,
                    }}>Description</div>
                    <textarea
                      value={eventForm.description}
                      onChange={e => setEventForm(p => ({ ...p, description:e.target.value }))}
                      placeholder="Détails, consignes..."
                      rows={3}
                      style={{
                        width:"100%", background:"rgba(255,255,255,0.055)",
                        border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
                        padding:"11px 14px", color:"#fff",
                        fontFamily:"'Barlow',sans-serif", fontSize:13,
                        outline:"none", boxSizing:"border-box", resize:"none",
                      }}
                    />
                  </div>

                  <button onClick={createEvent}
                    disabled={!eventForm.title.trim() || !eventForm.date}
                    style={{
                      width:"100%",
                      background:(eventForm.title.trim()&&eventForm.date)
                        ? "linear-gradient(135deg,rgba(79,195,247,0.8),rgba(2,136,209,0.8))"
                        : "rgba(255,255,255,0.06)",
                      border:"none", borderRadius:14, padding:"13px",
                      color:(eventForm.title.trim()&&eventForm.date)
                        ? "#fff" : "rgba(255,255,255,0.3)",
                      fontSize:12, fontWeight:900,
                      cursor:(eventForm.title.trim()&&eventForm.date)?"pointer":"not-allowed",
                      fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:2,
                      boxShadow:(eventForm.title.trim()&&eventForm.date)
                        ? "0 8px 24px rgba(79,195,247,0.35)" : "none",
                      transition:"all 0.3s",
                    }}
                  >CRÉER L'ÉVÉNEMENT</button>
                </GCard>
              </div>

              {/* Events list with roster management */}
              {upcoming.map(ev => {
                const evRoster = ev.roster || [];
                const isOpen = rosterModal === ev.id;
                return (
                  <GCard key={ev.id} style={{ padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                      <div style={{
                        width:40, height:40, borderRadius:13,
                        background:"rgba(255,255,255,0.06)",
                        border:"1px solid rgba(255,255,255,0.1)",
                        display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:18, flexShrink:0,
                      }}>{{ match:"⚽", training:"🏃", event:"📅" }[ev.type]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{
                          fontSize:13, fontWeight:900, color:"#fff",
                          fontFamily:"'Barlow Condensed',sans-serif",
                        }}>{ev.title}</div>
                        <div style={{
                          fontSize:9, color:"rgba(255,255,255,0.35)",
                          fontFamily:"'Barlow',sans-serif", marginTop:2,
                        }}>{ev.date} · {ev.time} · {ev.location}</div>
                      </div>
                      <div style={{
                        background:"rgba(79,195,247,0.1)",
                        border:"1px solid rgba(79,195,247,0.25)",
                        borderRadius:20, padding:"3px 10px",
                        fontSize:8, color:BLUE,
                        fontFamily:"'Barlow',sans-serif",
                      }}>{evRoster.length} joueurs</div>
                    </div>

                    {/* Roster chips */}
                    {evRoster.length > 0 && (
                      <div style={{
                        display:"flex", gap:5, flexWrap:"wrap", marginBottom:10,
                      }}>
                        {evRoster.map(pid => {
                          const pl = myPlayers.find(p=>p.id===pid);
                          if (!pl) return null;
                          return (
                            <div key={pid} style={{
                              background:"rgba(79,195,247,0.1)",
                              border:"1px solid rgba(79,195,247,0.25)",
                              borderRadius:20, padding:"3px 8px",
                              fontSize:8, color:"#fff",
                              fontFamily:"'Barlow',sans-serif",
                              display:"flex", alignItems:"center", gap:5,
                            }}>
                              #{pl.number} {pl.name.split(" ").slice(-1)[0]}
                              <span onClick={() => removePlayerFromEvent(ev.id, pid)}
                                style={{ cursor:"pointer", color:RED, fontSize:10 }}>×</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add player to event */}
                    <button onClick={() => setRosterModal(isOpen ? null : ev.id)} style={{
                      width:"100%", background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
                      padding:"8px 12px", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      color:"rgba(255,255,255,0.45)",
                      fontFamily:"'Barlow',sans-serif", fontSize:10,
                    }}>
                      <span>{isOpen?"▲":"+ Ajouter des joueurs"}</span>
                    </button>

                    {/* Player picker dropdown */}
                    <div style={{
                      overflow:"hidden",
                      maxHeight:isOpen ? 300 : 0,
                      transition:"max-height 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                      opacity:isOpen ? 1 : 0,
                      marginTop:isOpen ? 8 : 0,
                    }}>
                      <div style={{
                        background:"rgba(255,255,255,0.03)",
                        borderRadius:12, padding:"10px",
                      }}>
                        {myPlayers
                          .filter(p => !evRoster.includes(p.id))
                          .map(p => {
                            const t = teams.find(tm => tm.id===p.teamId);
                            return (
                              <div key={p.id} onClick={() => addPlayerToEvent(ev.id, p.id)}
                                style={{
                                  display:"flex", alignItems:"center", gap:10,
                                  padding:"8px", borderRadius:10, cursor:"pointer",
                                  marginBottom:4,
                                  background:"rgba(255,255,255,0.04)",
                                  border:"1px solid rgba(255,255,255,0.07)",
                                  transition:"background 0.2s",
                                }}>
                                <div style={{
                                  width:28, height:28, borderRadius:8,
                                  background:t?`${t.color}22`:"rgba(255,255,255,0.06)",
                                  display:"flex", alignItems:"center",
                                  justifyContent:"center", fontSize:11, fontWeight:900,
                                  color:"#fff", fontFamily:"'Barlow Condensed',sans-serif",
                                }}>{p.number}</div>
                                <div style={{ flex:1 }}>
                                  <div style={{
                                    fontSize:12, fontWeight:900, color:"#fff",
                                    fontFamily:"'Barlow Condensed',sans-serif",
                                  }}>{p.name}</div>
                                  <div style={{
                                    fontSize:8, color:"rgba(255,255,255,0.3)",
                                    fontFamily:"'Barlow',sans-serif",
                                  }}>{p.position} · {t?.name}</div>
                                </div>
                                <span style={{
                                  fontSize:18, color:GREEN,
                                }}>+</span>
                              </div>
                            );
                          })}
                        {myPlayers.filter(p => !evRoster.includes(p.id)).length === 0 && (
                          <div style={{
                            fontSize:11, color:"rgba(255,255,255,0.25)",
                            fontFamily:"'Barlow',sans-serif",
                            textAlign:"center", padding:"8px 0",
                          }}>Tous vos joueurs sont déjà dans cet événement</div>
                        )}
                      </div>
                    </div>
                  </GCard>
                );
              })}

              {upcoming.length === 0 && (
                <GCard style={{ padding:"28px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
                  <div style={{
                    fontSize:13, color:"rgba(255,255,255,0.35)",
                    fontFamily:"'Barlow',sans-serif",
                  }}>Aucun événement à venir</div>
                </GCard>
              )}
            </div>
          </FadeIn>
        )}

        {/* ── Classement tab ── */}
        {activeTab==="classement" && (
          <FadeIn>
            <div>
              <GCard style={{ padding:"18px", marginBottom:14 }}>
                <div style={{
                  fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.35)",
                  letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", marginBottom:14,
                }}>Classement · Championnat</div>

                {/* Header */}
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"32px 1fr 32px 28px 28px 28px 36px",
                  gap:4, marginBottom:8,
                  padding:"0 4px",
                }}>
                  {["#","Équipe","Pts","J","G","P","Diff"].map(h => (
                    <div key={h} style={{
                      fontSize:7, color:"rgba(255,255,255,0.3)", letterSpacing:1,
                      fontFamily:"'Barlow',sans-serif", textTransform:"uppercase",
                      textAlign: h==="Équipe" ? "left" : "center",
                    }}>{h}</div>
                  ))}
                </div>

                {CLASSEMENT.map(row => {
                  const isMe = row.rank === myRank;
                  return (
                    <div key={row.rank} style={{
                      display:"grid",
                      gridTemplateColumns:"32px 1fr 32px 28px 28px 28px 36px",
                      gap:4, padding:"9px 4px",
                      borderRadius:10, marginBottom:3,
                      background: isMe
                        ? "linear-gradient(135deg,rgba(79,195,247,0.15),rgba(79,195,247,0.05))"
                        : "transparent",
                      border: isMe
                        ? "1px solid rgba(79,195,247,0.3)"
                        : "1px solid transparent",
                    }}>
                      <div style={{
                        fontSize:12, fontWeight:900,
                        color: row.rank<=3 ? [GOLD,"rgba(200,200,200,0.8)","#cd7f32"][row.rank-1] : "rgba(255,255,255,0.35)",
                        fontFamily:"'Barlow Condensed',sans-serif",
                        textAlign:"center",
                      }}>{row.rank<=3?"🏅":row.rank}</div>
                      <div style={{
                        fontSize:11, fontWeight: isMe?900:600, color: isMe?BLUE:"#fff",
                        fontFamily:"'Barlow Condensed',sans-serif",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>{row.name}</div>
                      <div style={{
                        fontSize:13, fontWeight:900,
                        color: row.rank===1 ? GOLD : isMe ? BLUE : "#fff",
                        fontFamily:"'Barlow Condensed',sans-serif", textAlign:"center",
                      }}>{row.pts}</div>
                      {[row.j, row.g, row.p].map((v,i) => (
                        <div key={i} style={{
                          fontSize:11, color:"rgba(255,255,255,0.5)",
                          fontFamily:"'Barlow Condensed',sans-serif", textAlign:"center",
                        }}>{v}</div>
                      ))}
                      <div style={{
                        fontSize:11,
                        color: (row.bp-row.bc)>0 ? GREEN : (row.bp-row.bc)<0 ? RED : "rgba(255,255,255,0.4)",
                        fontFamily:"'Barlow Condensed',sans-serif", textAlign:"center",
                        fontWeight:900,
                      }}>{(row.bp-row.bc)>0?"+":""}{row.bp-row.bc}</div>
                    </div>
                  );
                })}
              </GCard>

              {/* Form guide */}
              <GCard style={{ padding:"16px 18px" }}>
                <div style={{
                  fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.35)",
                  letterSpacing:2, fontFamily:"'Barlow Condensed',sans-serif",
                  textTransform:"uppercase", marginBottom:12,
                }}>Forme récente · {myTeamName || "Mon équipe"}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["V","V","N","V","D","V","V"].map((r, i) => (
                    <div key={i} style={{
                      width:34, height:34, borderRadius:10,
                      background: r==="V" ? "rgba(57,255,20,0.2)" : r==="N" ? "rgba(255,255,255,0.1)" : "rgba(200,16,46,0.2)",
                      border:`1.5px solid ${r==="V"?"rgba(57,255,20,0.5)":r==="N"?"rgba(255,255,255,0.2)":"rgba(200,16,46,0.5)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:900,
                      color: r==="V" ? GREEN : r==="N" ? "rgba(255,255,255,0.7)" : RED,
                      fontFamily:"'Barlow Condensed',sans-serif",
                    }}>{r}</div>
                  ))}
                </div>
              </GCard>
            </div>
          </FadeIn>
        )}
      </div>
    </FadeIn>
  );
}

// ═══════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  ::-webkit-scrollbar{display:none;}
  @keyframes hexSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes spinR{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.22);}
  input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.5);}
  select option{background:#111;}
  textarea{resize:none;}
`;

// ═══════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════
const NAV_TABS = [
  { id:"home",    icon:"🏠", label:"Accueil",  access:["admin","player","coach"] },
  { id:"players", icon:"👥", label:"Joueurs",  access:["admin","player","coach"] },
  { id:"agenda",  icon:"📅", label:"Agenda",   access:["admin","player","coach"] },
  { id:"shop",    icon:"🛒", label:"Boutique", access:["admin","player","coach","guest"] },
  { id:"profile", icon:"👤", label:"Profil",   access:["player","coach"] },
  { id:"admin",   icon:"⚙️", label:"Admin",    access:["admin"] },
];

// ═══════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════
export default function App() {
  const [authView, setAuthView]   = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab]             = useState("shop");
  const [player, setPlayer]       = useState(null);
  // ── Firebase real-time collections ─────────────
  // Mode démo si FIREBASE_CONFIG non rempli,
  // sync temps réel automatique une fois configuré
  const [events, setEvents]   = useFirestore("events",  INIT_EVENTS);
  const [players, setPlayers] = useFirestore("players", INIT_PLAYERS);
  const [teams, setTeams]     = useFirestore("teams",   INIT_TEAMS);
  const [coaches, setCoaches] = useFirestore("coaches", INIT_COACHES);
  const [cart, setCart]       = useState([]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setAuthView("app");
    setTab("home");
  };

  // Firebase auth login (called from LoginScreen when Firebase configured)
  const handleFirebaseLogin = async (email, password, setError, setLoading) => {
    if (FIREBASE_CONFIG.apiKey === "REMPLACE_PAR_TON_API_KEY") return false;
    try {
      setLoading(true);
      const fbUser = await fbLogin(email, password);
      if (!fbUser) return false;
      // Load user profile from Firestore users collection
      const users = await fbGetAll("users");
      const profile = users ? users.find(u => u.email === fbUser.email) : null;
      if (profile) {
        handleLogin(profile);
        return true;
      }
      setError("Compte non trouvé dans la base de données.");
      return false;
    } catch(e) {
      const msg = e.code === "auth/wrong-password" ? "Mot de passe incorrect."
        : e.code === "auth/user-not-found" ? "Email non trouvé."
        : "Erreur de connexion.";
      setError(msg);
      return false;
    } finally { setLoading(false); }
  };

  const handleGuest = () => {
    setCurrentUser({ id:0, role:"guest", name:"Visiteur" });
    setAuthView("app");
    setTab("shop");
  };

  const handleLogout = () => {
    fbLogout().catch(()=>{});
    setCurrentUser(null);
    setAuthView("login");
    setTab("shop");
    setCart([]);
  };

  const canAccess = (tabId) => {
    if (!currentUser) return tabId === "shop";
    const t = NAV_TABS.find(t => t.id===tabId);
    return t ? t.access.includes(currentUser.role) : false;
  };

  const activeBase = tab==="playerProfile" ? "players" : tab;

  // profile tab visible for player + coach only (not admin)
  const profileVisibleTabs = !currentUser || currentUser.role==="guest"
    ? NAV_TABS.filter(t => t.id==="shop")
    : currentUser.role==="admin"
    ? NAV_TABS.filter(t => t.id!=="profile")
    : NAV_TABS.filter(t => t.id!=="admin");

  const visibleTabs = profileVisibleTabs;
  const cartCount  = cart.reduce((s,i) => s+i.qty, 0);

  const TAB_LABELS = {
    home:"TABLEAU DE BORD", players:"JOUEURS",
    playerProfile: player?.name?.split(" ").pop()?.toUpperCase()||"JOUEUR",
    agenda:"AGENDA", shop:"BOUTIQUE", admin:"ADMINISTRATION",
    profile:"MON PROFIL",
  };

  // ── AUTH ──────────────────────────────────────
  if (authView === "login") {
    return (
      <div style={{ maxWidth:430, margin:"0 auto", background:"#080810", minHeight:"100vh" }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{
          position:"fixed", top:-100, right:-100,
          width:350, height:350, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(200,16,46,0.08) 0%,transparent 70%)",
          pointerEvents:"none",
        }}/>
        <LoginScreen onLogin={handleLogin} onGuest={handleGuest}/>
      </div>
    );
  }

  // ── APP ───────────────────────────────────────
  return (
    <div style={{
      maxWidth:430, margin:"0 auto", background:"#080810",
      minHeight:"100vh", position:"relative", overflow:"hidden",
    }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Ambient blobs */}
      <div style={{
        position:"fixed", top:-100, right:-100,
        width:350, height:350, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(200,16,46,0.07) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>
      <div style={{
        position:"fixed", bottom:-80, left:-80,
        width:280, height:280, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(79,195,247,0.06) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>

      <div style={{ height:48 }}/>

      {/* HEADER */}
      <div style={{
        padding:"0 20px 14px", position:"sticky", top:0, zIndex:200,
        background:"rgba(8,8,16,0.92)", backdropFilter:"blur(40px)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {tab==="playerProfile" && (
              <button
                onClick={() => setTab("players")}
                style={{
                  background:"rgba(255,255,255,0.07)", border:"none",
                  borderRadius:12, width:34, height:34, color:"#fff",
                  cursor:"pointer", fontSize:16,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >←</button>
            )}
            <HexLogo size={32}/>
            <div>
              <div style={{
                fontSize:14, fontWeight:900, color:"#fff",
                fontFamily:"'Barlow Condensed',sans-serif",
                letterSpacing:2.5, lineHeight:1,
              }}>FC MANAGER</div>
              <div style={{
                fontSize:7, color:"rgba(255,255,255,0.3)",
                letterSpacing:2, fontFamily:"'Barlow',sans-serif", marginTop:2,
              }}>{TAB_LABELS[tab]||""}</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {currentUser?.role==="admin" && currentUser.plan && (
              <PlanBadge plan={currentUser.plan}/>
            )}
            {currentUser?.role==="player" && (
              <div style={{
                background:"rgba(79,195,247,0.12)",
                border:"1px solid rgba(79,195,247,0.3)",
                borderRadius:20, padding:"4px 10px",
                fontSize:9, color:BLUE,
                fontFamily:"'Barlow',sans-serif", letterSpacing:1,
              }}>⚽ {currentUser.name?.split(" ")[0]}</div>
            )}
            {currentUser?.role==="coach" && (
              <div style={{
                background:"rgba(57,255,20,0.1)",
                border:"1px solid rgba(57,255,20,0.3)",
                borderRadius:20, padding:"4px 10px",
                fontSize:9, color:GREEN,
                fontFamily:"'Barlow',sans-serif", letterSpacing:1,
              }}>🧑‍🏫 {currentUser.name?.split(" ")[0]}</div>
            )}
            {currentUser?.role==="guest" && (
              <div style={{
                background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:20, padding:"4px 10px",
                fontSize:9, color:"rgba(255,255,255,0.4)",
                fontFamily:"'Barlow',sans-serif", letterSpacing:1,
              }}>👁 Visiteur</div>
            )}
            {cartCount > 0 && (
              <div
                onClick={() => setTab("shop")}
                style={{
                  background:"rgba(200,16,46,0.2)",
                  border:"1px solid rgba(200,16,46,0.45)",
                  borderRadius:22, padding:"5px 13px",
                  fontSize:11, color:"#fff", cursor:"pointer",
                  fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1,
                }}
              >🛒 {cartCount}</div>
            )}
            <button
              onClick={handleLogout}
              style={{
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:12, width:32, height:32,
                color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >⏏</button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div key={tab} style={{ position:"relative", zIndex:1 }}>
        {tab==="shop" && (
          <Shop cart={cart} setCart={setCart}/>
        )}
        {tab!=="shop" && !canAccess(tab) && (
          <AccessDenied tab={tab} onLogin={() => { setCurrentUser(null); setAuthView("login"); }}/>
        )}
        {tab==="home" && canAccess("home") && (
          <Home
            goPlayer={p => { setPlayer(p); setTab("playerProfile"); }}
            teams={teams} coaches={coaches} players={players}
          />
        )}
        {tab==="players" && canAccess("players") && (
          <PlayersView
            goPlayer={p => { setPlayer(p); setTab("playerProfile"); }}
            teams={teams}
          />
        )}
        {tab==="playerProfile" && canAccess("players") && (
          <Profile player={player}/>
        )}
        {tab==="agenda" && canAccess("agenda") && (
          <Agenda
            events={events} setEvents={setEvents}
            role={currentUser?.role} currentUser={currentUser}
          />
        )}
        {tab==="admin" && canAccess("admin") && (
          <AdminView
            players={players} setPlayers={setPlayers}
            teams={teams}   setTeams={setTeams}
            coaches={coaches} setCoaches={setCoaches}
          />
        )}
        {tab==="profile" && canAccess("profile") && currentUser?.role==="player" && (
          <PlayerProfile
            currentUser={currentUser}
            players={players}
            events={events}
            setEvents={setEvents}
            teams={teams}
          />
        )}
        {tab==="profile" && canAccess("profile") && currentUser?.role==="coach" && (
          <CoachProfile
            currentUser={currentUser}
            coaches={coaches}
            teams={teams}
            players={players}
            events={events}
            setEvents={setEvents}
            clubPlan={currentUser.plan || "starter"}
          />
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position:"fixed", bottom:0, left:"50%",
        transform:"translateX(-50%)",
        width:"100%", maxWidth:430, zIndex:200,
      }}>
        <div style={{
          background:"rgba(6,6,14,0.95)",
          backdropFilter:"blur(50px)",
          borderTop:"1px solid rgba(255,255,255,0.06)",
          padding:"10px 8px 32px",
          display:"flex", justifyContent:"space-around",
        }}>
          {visibleTabs.map(t => {
            const active  = activeBase === t.id;
            const locked  = !canAccess(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background:"none", border:"none",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", gap:4,
                  cursor:"pointer", flex:1, padding:"4px 0",
                  position:"relative", opacity:locked?0.4:1,
                }}
              >
                {active && (
                  <div style={{
                    position:"absolute", top:-10, left:"50%",
                    transform:"translateX(-50%)",
                    width:28, height:2.5,
                    background:"linear-gradient(90deg,#c8102e,#ff4466)",
                    borderRadius:2, boxShadow:"0 0 14px #c8102e",
                  }}/>
                )}
                <div style={{
                  fontSize:20,
                  filter:active?"none":"grayscale(1) opacity(0.35)",
                  transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  transform:active?"scale(1.18) translateY(-2px)":"scale(1) translateY(0)",
                  position:"relative",
                }}>
                  {t.icon}
                  {locked && (
                    <span style={{ position:"absolute", top:-4, right:-4, fontSize:9 }}>🔒</span>
                  )}
                </div>
                <div style={{
                  fontSize:8,
                  color:active?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.28)",
                  fontFamily:"'Barlow',sans-serif",
                  letterSpacing:1.2, textTransform:"uppercase",
                  transition:"color 0.3s",
                }}>{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
