/**
 * SENDA Admin Dashboard — senda-dashboard.jsx
 * Single-file standalone React component
 * Dependencies: react, recharts
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND   = '#2563EB';
const BRAND2  = '#1d4ed8';
const GREEN   = '#10b981';
const AMBER   = '#f59e0b';
const RED     = '#ef4444';
const VIOLET  = '#8b5cf6';
const CYAN    = '#06b6d4';
const PINK    = '#ec4899';
const ORANGE  = '#f97316';

const ADMIN_EMAIL    = 'admin@senda.co.tz';
const ADMIN_PASSWORD = 'senda@2025';
const LS_KEY         = 'senda_admin_auth';

// ─── CSS Injection ────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:#f1f5f9;}
::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
::-webkit-scrollbar-thumb:hover{background:#94a3b8;}

@keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:.7}100%{transform:translateY(-120vh) scale(0.3);opacity:0}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}70%{transform:scale(1.35);opacity:0}100%{transform:scale(1.35);opacity:0}}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes toastIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(120%)}}
@keyframes gradPulse{0%,100%{opacity:.7}50%{opacity:1}}

.senda-fade-in{animation:fadeSlideIn .45s cubic-bezier(.25,.46,.45,.94) both}
.senda-fade-up{animation:fadeSlideUp .5s cubic-bezier(.25,.46,.45,.94) both}
.senda-spin{animation:spin .8s linear infinite}
.senda-toast-in{animation:toastIn .35s ease both}
.senda-toast-out{animation:toastOut .35s ease both}

.senda-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.senda-card:hover{box-shadow:0 4px 16px rgba(37,99,235,.10);}

.senda-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:inherit;font-weight:600;border-radius:10px;transition:all .18s;}
.senda-btn:hover{filter:brightness(1.07);}
.senda-btn:active{transform:scale(.97);}
.senda-btn-primary{background:linear-gradient(135deg,${BRAND},${BRAND2});color:#fff;padding:0 22px;height:44px;font-size:15px;}
.senda-btn-sm{padding:0 14px;height:32px;font-size:12px;border-radius:8px;}
.senda-btn-ghost{background:transparent;color:#64748b;border:1px solid #e2e8f0;}
.senda-btn-ghost:hover{background:#f8fafc;color:#1e293b;}
.senda-btn-danger{background:#fee2e2;color:#dc2626;border:1px solid #fecaca;}
.senda-btn-danger:hover{background:#fecaca;}
.senda-btn-success{background:#d1fae5;color:#059669;border:1px solid #a7f3d0;}
.senda-btn-success:hover{background:#a7f3d0;}

.senda-input{width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:14px;font-family:inherit;color:#1e293b;background:#fff;outline:none;transition:border-color .18s,box-shadow .18s;}
.senda-input:focus{border-color:${BRAND};box-shadow:0 0 0 3px rgba(37,99,235,.12);}
.senda-input::placeholder{color:#94a3b8;}

.senda-table{width:100%;border-collapse:collapse;}
.senda-table thead th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#64748b;background:#f8fafc;padding:10px 14px;border-bottom:1px solid #e2e8f0;}
.senda-table tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s;}
.senda-table tbody tr:hover{background:#f8fafc;}
.senda-table tbody td{padding:11px 14px;font-size:13px;color:#334155;}
.senda-table tbody tr:last-child{border-bottom:none;}

.senda-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;}
.badge-green{background:#d1fae5;color:#065f46;}
.badge-red{background:#fee2e2;color:#991b1b;}
.badge-amber{background:#fef3c7;color:#92400e;}
.badge-blue{background:#dbeafe;color:#1e40af;}
.badge-violet{background:#ede9fe;color:#5b21b6;}
.badge-gray{background:#f1f5f9;color:#475569;}
.badge-orange{background:#ffedd5;color:#9a3412;}
.badge-cyan{background:#cffafe;color:#155e75;}

.senda-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:all .18s;color:#64748b;font-size:13.5px;font-weight:500;border:none;background:transparent;width:100%;text-align:left;white-space:nowrap;}
.senda-nav-item:hover{background:#f0f4ff;color:${BRAND};}
.senda-nav-item.active{background:#eff6ff;color:${BRAND};font-weight:700;border-left:3px solid ${BRAND};padding-left:9px;}

.tab-wrapper{display:flex;gap:4px;border-bottom:2px solid #e2e8f0;margin-bottom:20px;}
.tab-btn{padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#94a3b8;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .18s;font-family:inherit;}
.tab-btn.active{color:${BRAND};border-bottom-color:${BRAND};}
.tab-btn:hover:not(.active){color:#475569;}

/* Responsive helpers */
@media(max-width:639px){
  .hide-mobile{display:none!important;}
  .senda-stat-grid{grid-template-columns:1fr 1fr!important;}
  .chart-h-responsive{height:180px!important;}
  .senda-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
}
@media(min-width:640px) and (max-width:1023px){
  .senda-stat-grid{grid-template-columns:1fr 1fr!important;}
  .chart-h-responsive{height:200px!important;}
}
@media(min-width:1024px){
  .senda-stat-grid{grid-template-columns:repeat(4,1fr)!important;}
  .chart-h-responsive{height:260px!important;}
}
`;

function injectCSS() {
  if (document.getElementById('senda-styles')) return;
  const s = document.createElement('style');
  s.id = 'senda-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const monthlySMS = [
  { month:'Jan', sent:42000, delivered:39500, failed:1800, pending:700 },
  { month:'Feb', sent:51000, delivered:48200, failed:2100, pending:700 },
  { month:'Mar', sent:47500, delivered:44900, failed:1900, pending:700 },
  { month:'Apr', sent:63000, delivered:60100, failed:2300, pending:600 },
  { month:'May', sent:58000, delivered:55400, failed:1900, pending:700 },
  { month:'Jun', sent:72000, delivered:68800, failed:2600, pending:600 },
  { month:'Jul', sent:68000, delivered:65200, failed:2100, pending:700 },
  { month:'Aug', sent:84000, delivered:80500, failed:2900, pending:600 },
  { month:'Sep', sent:79000, delivered:75800, failed:2500, pending:700 },
  { month:'Oct', sent:93000, delivered:89200, failed:3100, pending:700 },
  { month:'Nov', sent:101000, delivered:97000, failed:3300, pending:700 },
  { month:'Dec', sent:115000, delivered:110500, failed:3800, pending:700 },
];

const revenueData = [
  { month:'Jan', revenue:1280000, packages:42, avgOrder:30476 },
  { month:'Feb', revenue:1540000, packages:58, avgOrder:26551 },
  { month:'Mar', revenue:1390000, packages:51, avgOrder:27254 },
  { month:'Apr', revenue:1870000, packages:71, avgOrder:26338 },
  { month:'May', revenue:1720000, packages:65, avgOrder:26461 },
  { month:'Jun', revenue:2140000, packages:83, avgOrder:25783 },
  { month:'Jul', revenue:1980000, packages:76, avgOrder:26052 },
  { month:'Aug', revenue:2450000, packages:95, avgOrder:25789 },
  { month:'Sep', revenue:2280000, packages:88, avgOrder:25909 },
  { month:'Oct', revenue:2710000, packages:107, avgOrder:25327 },
  { month:'Nov', revenue:2980000, packages:119, avgOrder:25042 },
  { month:'Dec', revenue:3350000, packages:138, avgOrder:24275 },
];

const userGrowth = [
  { month:'Jan', users:310, active:240, churned:18 },
  { month:'Feb', users:385, active:298, churned:22 },
  { month:'Mar', users:442, active:348, churned:19 },
  { month:'Apr', users:531, active:420, churned:25 },
  { month:'May', users:614, active:490, churned:28 },
  { month:'Jun', users:723, active:582, churned:31 },
  { month:'Jul', users:808, active:650, churned:29 },
  { month:'Aug', users:941, active:765, churned:35 },
  { month:'Sep', users:1052, active:860, churned:38 },
  { month:'Oct', users:1218, active:1001, churned:42 },
  { month:'Nov', users:1380, active:1140, churned:46 },
  { month:'Dec', users:1547, active:1289, churned:51 },
];

const deliveryPie = [
  { name:'Delivered', value:110500, color:GREEN },
  { name:'Failed',    value:3800,   color:RED    },
  { name:'Pending',   value:700,    color:AMBER  },
];

const networkPerf = [
  { network:'Vodacom', rate:97.2, vol:48000, color:BRAND },
  { network:'Airtel',  rate:95.8, vol:31000, color:GREEN  },
  { network:'Tigo',    rate:96.1, vol:22000, color:AMBER  },
  { network:'Halotel', rate:94.3, vol:9000,  color:VIOLET },
  { network:'TTCL',    rate:93.7, vol:5000,  color:CYAN   },
];

const hourlyHeatmap = [
  { hour:'06:00', Mon:120,Tue:140,Wed:115,Thu:130,Fri:180,Sat:90,Sun:60 },
  { hour:'08:00', Mon:380,Tue:410,Wed:360,Thu:400,Fri:520,Sat:150,Sun:110 },
  { hour:'10:00', Mon:640,Tue:690,Wed:610,Thu:650,Fri:820,Sat:310,Sun:240 },
  { hour:'12:00', Mon:540,Tue:570,Wed:500,Thu:555,Fri:720,Sat:410,Sun:320 },
  { hour:'14:00', Mon:590,Tue:620,Wed:560,Thu:600,Fri:760,Sat:380,Sun:280 },
  { hour:'16:00', Mon:710,Tue:750,Wed:680,Thu:720,Fri:890,Sat:290,Sun:210 },
  { hour:'18:00', Mon:490,Tue:510,Wed:470,Thu:500,Fri:630,Sat:220,Sun:180 },
  { hour:'20:00', Mon:280,Tue:300,Wed:260,Thu:290,Fri:380,Sat:180,Sun:150 },
];

const transactions = Array.from({length:30}, (_,i)=>({
  id:`TXN-${String(10001+i).padStart(5,'0')}`,
  user:`user${i+1}@${['gmail','yahoo','outlook','senda'][i%4]}.com`,
  package:['Starter 500','Basic 2000','Pro 5000','Business 10K','Enterprise 25K'][i%5],
  amount:[5000,18000,42000,80000,185000][i%5],
  credits:[500,2000,5000,10000,25000][i%5],
  method:['M-Pesa','Tigo Pesa','Airtel Money','Bank Transfer'][i%4],
  status:i%7===0?'failed':i%5===0?'pending':'completed',
  date:new Date(Date.now()-i*86400000*1.2).toISOString().split('T')[0],
  ref:`REF${Math.random().toString(36).substr(2,8).toUpperCase()}`,
}));

const SENDER_ID_STATUSES = ['approved','pending','await_payment','rejected','require_changes'];
const senderIds = Array.from({length:25}, (_,i)=>({
  id:`SID-${String(1001+i).padStart(4,'0')}`,
  name:['SENDA','VODABANK','HEALTHNET','EDUPAY','GOVTTZ','SHOPIFY','MFUMOLABS','TECHCO','BONGO','KARIBU','JUMUIA','PAMOJA','UHURU','IMARA','SIMBA'][i%15],
  owner:`business${i+1}@company${i+1}.co.tz`,
  company:['Senda Ltd','Voda Bank','HealthNet TZ','EduPay','Govt TZ','Shopify TZ','Mfumo Labs','TechCo','Bongo Media','Karibu Group','Jumuia Co','Pamoja Ltd','Uhuru Corp','Imara Ventures','Simba Holdings'][i%15],
  status: i%5===0?'await_payment': i%7===0?'require_changes': i%9===0?'rejected': i%11===0?'pending':'approved',
  type:['Promotional','Transactional'][i%2],
  network:['Vodacom','Airtel','Tigo','All Networks'][i%4],
  purpose:['Marketing','OTP & Alerts','Customer Service','Notifications'][i%4],
  created:new Date(Date.now()-i*5*86400000).toISOString().split('T')[0],
  smsCount:Math.floor(Math.random()*50000+1000),
  invoiceNo: i%5===0 ? `INV-${String(20001+i).padStart(5,'0')}` : null,
  notes: i%7===0 ? 'Business registration certificate required' : i%9===0 ? 'Name violates telecom naming policy' : '',
}));

// ─── Partners Mock Data ───────────────────────────────────────────────────────
const partners = Array.from({length:18}, (_,i)=>({
  id:`PTR-${String(3001+i).padStart(4,'0')}`,
  name:['NexaComm','AfricaLink','TechBridge TZ','MobiSolutions','CloudSMS','DataPulse','NetReach','ConnectTZ','SignalPro','SwiftMsg','PeakComm','InfoPath','SmartBiz','RapidSMS','LinkMedia','VoiceEdge','PrimeTech','ZetraCom'][i%18],
  contact:`partner${i+1}@agency${i+1}.co.tz`,
  phone:`+2557${String(20000000+i*999999).slice(0,8)}`,
  region:['Dar es Salaam','Arusha','Mwanza','Dodoma','Mbeya','Zanzibar','Morogoro','Tanga'][i%8],
  status: i%8===0?'pending': i%11===0?'suspended':'active',
  tier:   i%3===0?'Gold': i%5===0?'Platinum':'Silver',
  clients:Math.floor(Math.random()*40+5),
  smsSent:Math.floor(Math.random()*200000+10000),
  revenue:Math.floor(Math.random()*4000000+500000),
  commission:Math.floor(Math.random()*400000+50000),
  joinDate:new Date(Date.now()-i*14*86400000).toISOString().split('T')[0],
  apiKey:`pk_live_${Math.random().toString(36).substr(2,16)}`,
}));

const partnerRevTrend = [
  { month:'Jul', revenue:3200000, commission:320000, clients:28 },
  { month:'Aug', revenue:3900000, commission:390000, clients:32 },
  { month:'Sep', revenue:4400000, commission:440000, clients:35 },
  { month:'Oct', revenue:5100000, commission:510000, clients:38 },
  { month:'Nov', revenue:5800000, commission:580000, clients:42 },
  { month:'Dec', revenue:6700000, commission:670000, clients:46 },
];

const tierDist = [
  { name:'Platinum', value:3, color:'#6366f1' },
  { name:'Gold',     value:6, color:AMBER      },
  { name:'Silver',   value:9, color:'#94a3b8'  },
];

const loginActivity = Array.from({length:25}, (_,i)=>({
  id:`LOG-${String(5001+i).padStart(5,'0')}`,
  user:i===0?'admin@senda.co.tz':`user${i}@${['gmail','yahoo','outlook'][i%3]}.com`,
  ip:`${192+i%3}.${168+i%5}.${1+i%10}.${Math.floor(Math.random()*254+1)}`,
  device:['Chrome / Windows','Safari / macOS','Firefox / Linux','Chrome / Android','Safari / iOS'][i%5],
  location:['Dar es Salaam','Arusha','Mwanza','Dodoma','Mbeya','Zanzibar'][i%6],
  status:i%8===0?'failed':'success',
  time:new Date(Date.now()-i*3600000*1.5).toISOString().replace('T',' ').split('.')[0],
  role:i===0?'admin':'user',
}));

const smsPackages = [
  { id:'PKG-001', name:'Starter',    credits:500,   price:5000,   per_sms:10.0, popular:false, color:'#64748b', desc:'Perfect for individuals & small tests' },
  { id:'PKG-002', name:'Basic',      credits:2000,  price:18000,  per_sms:9.0,  popular:false, color:GREEN,     desc:'Ideal for small businesses' },
  { id:'PKG-003', name:'Pro',        credits:5000,  price:42000,  per_sms:8.4,  popular:true,  color:BRAND,     desc:'Best value for growing businesses' },
  { id:'PKG-004', name:'Business',   credits:10000, price:80000,  per_sms:8.0,  popular:false, color:VIOLET,    desc:'For established enterprises' },
  { id:'PKG-005', name:'Enterprise', credits:25000, price:185000, per_sms:7.4,  popular:false, color:AMBER,     desc:'Maximum savings at scale' },
  { id:'PKG-006', name:'Unlimited',  credits:50000, price:350000, per_sms:7.0,  popular:false, color:PINK,      desc:'For high-volume senders' },
];

const stats = {
  totalUsers:    { value:'1,547',   change:'+12.4%', up:true,  desc:'Total registered users'   },
  activeUsers:   { value:'1,289',   change:'+8.7%',  up:true,  desc:'Active this month'         },
  smsSent:       { value:'876,500', change:'+18.2%', up:true,  desc:'SMS sent this year'        },
  revenue:       { value:'25.7M',   change:'+21.5%', up:true,  desc:'Total revenue (TZS)'       },
  senderIds:     { value:'117',     change:'+5',     up:true,  desc:'Approved sender IDs'       },
  failRate:      { value:'3.28%',   change:'-0.4%',  up:false, desc:'Delivery failure rate'     },
  avgResponse:   { value:'1.8s',    change:'-0.3s',  up:false, desc:'Avg delivery time'         },
  pendingAppr:   { value:'8',       change:'+2',     up:false, desc:'Pending sender IDs'        },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useBreakpoint() {
  const get = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  };
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return bp;
}

// ─── Floating Dots (login bg) ─────────────────────────────────────────────────
function FloatingDots() {
  const dots = useRef(Array.from({length:22}, (_,i) => ({
    id:i,
    left: `${Math.random()*100}%`,
    size: `${Math.floor(Math.random()*14+6)}px`,
    dur:  `${Math.random()*14+10}s`,
    delay:`${Math.random()*10}s`,
    opacity: Math.random()*0.25+0.08,
  }))).current;
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {dots.map(d => (
        <div key={d.id} style={{
          position:'absolute', bottom:'-60px', left:d.left,
          width:d.size, height:d.size, borderRadius:'50%',
          background:'rgba(255,255,255,0.6)', opacity:d.opacity,
          animation:`floatUp ${d.dur} ${d.delay} infinite linear`,
        }}/>
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type='success', onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2700);
    const t2 = setTimeout(onDone, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  const bg = type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  const col = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  return (
    <div className={leaving ? 'senda-toast-out' : 'senda-toast-in'} style={{
      position:'fixed', top:20, right:20, zIndex:9999,
      display:'flex', alignItems:'center', gap:10,
      background:bg, color:col, border:`1px solid ${col}33`,
      borderRadius:12, padding:'12px 18px', boxShadow:'0 8px 24px rgba(0,0,0,.12)',
      fontSize:14, fontWeight:600, minWidth:260, maxWidth:380,
    }}>
      <span style={{fontSize:18, fontWeight:800}}>{icon}</span>
      {message}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size=20, color='#fff' }) {
  return (
    <div className="senda-spin" style={{
      width:size, height:size, borderRadius:'50%',
      border:`2.5px solid ${color}33`,
      borderTopColor:color,
    }}/>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, change, up, desc, icon, accent }) {
  return (
    <div className="senda-card" style={{padding:'16px 18px',transition:'transform .2s,box-shadow .2s',cursor:'default'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
    >
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#94a3b8'}}>{title}</span>
        <div style={{width:32,height:32,borderRadius:9,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{fontSize:16}}>{icon}</span>
        </div>
      </div>
      <div style={{fontSize:26,fontWeight:800,color:'#0f172a',letterSpacing:'-.5px',lineHeight:1}}>{value}</div>
      <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:11,fontWeight:700,color:up?GREEN:RED,background:up?'#d1fae5':'#fee2e2',padding:'2px 7px',borderRadius:99}}>
          {change}
        </span>
        <span style={{fontSize:11,color:'#94a3b8'}}>{desc}</span>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix='', suffix='' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#1e293b',border:'none',borderRadius:10,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.25)'}}>
      <p style={{color:'#94a3b8',fontSize:11,fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</p>
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginTop:3}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color||p.fill,flexShrink:0}}/>
          <span style={{color:'#e2e8f0',fontSize:12,fontWeight:500}}>{p.name}</span>
          <span style={{color:'#f1f5f9',fontSize:13,fontWeight:700,marginLeft:'auto'}}>
            {prefix}{typeof p.value==='number' ? p.value.toLocaleString() : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, actions }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div>
        <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{title}</h3>
        {subtitle && <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{subtitle}</p>}
      </div>
      {actions && <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{actions}</div>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    completed:       ['badge-green',  'Completed'],
    approved:        ['badge-green',  'Approved'],
    success:         ['badge-green',  'Success'],
    active:          ['badge-green',  'Active'],
    failed:          ['badge-red',    'Failed'],
    rejected:        ['badge-red',    'Rejected'],
    suspended:       ['badge-red',    'Suspended'],
    pending:         ['badge-amber',  'Pending'],
    await_payment:   ['badge-orange', 'Await Payment'],
    require_changes: ['badge-cyan',   'Require Changes'],
    promotional:     ['badge-violet', 'Promo'],
    transactional:   ['badge-blue',   'Trans'],
    admin:           ['badge-violet', 'Admin'],
    partner:         ['badge-cyan',   'Partner'],
    user:            ['badge-blue',   'User'],
    platinum:        ['badge-violet', 'Platinum'],
    gold:            ['badge-amber',  'Gold'],
    silver:          ['badge-gray',   'Silver'],
  };
  const [cls, label] = map[status?.toLowerCase()] || ['badge-gray', status];
  return <span className={`senda-badge ${cls}`}><span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block'}}></span>{label}</span>;
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const statCards = [
    { title:'Total Users',    value:stats.totalUsers.value,  change:stats.totalUsers.change,  up:true,  desc:'registered',  icon:'👥', accent:BRAND  },
    { title:'Active Users',   value:stats.activeUsers.value, change:stats.activeUsers.change, up:true,  desc:'this month',  icon:'✅', accent:GREEN  },
    { title:'SMS Sent',       value:stats.smsSent.value,     change:stats.smsSent.change,     up:true,  desc:'this year',   icon:'📨', accent:VIOLET },
    { title:'Revenue (TZS)',  value:stats.revenue.value,     change:stats.revenue.change,     up:true,  desc:'total',       icon:'💰', accent:AMBER  },
    { title:'Sender IDs',     value:stats.senderIds.value,   change:stats.senderIds.change,   up:true,  desc:'approved',    icon:'🏷️', accent:CYAN   },
    { title:'Fail Rate',      value:stats.failRate.value,    change:stats.failRate.change,     up:false, desc:'Dec avg',     icon:'⚠️', accent:RED    },
    { title:'Avg Delivery',   value:stats.avgResponse.value, change:stats.avgResponse.change,  up:false, desc:'response',    icon:'⚡', accent:GREEN  },
    { title:'Pending Appr.',  value:stats.pendingAppr.value, change:stats.pendingAppr.change,  up:false, desc:'sender IDs',  icon:'🕐', accent:AMBER  },
  ];

  const chartH = isMobile ? 180 : bp === 'tablet' ? 200 : 260;

  // Delivery rate 12-month trend
  const delivRate = monthlySMS.map(m=>({
    month: m.month,
    'Delivery Rate': +((m.delivered/m.sent)*100).toFixed(2),
    'MA-3': 0, // placeholder; computed below
  }));
  for(let i=2;i<delivRate.length;i++){
    delivRate[i]['MA-3'] = +((delivRate[i-2]['Delivery Rate']+delivRate[i-1]['Delivery Rate']+delivRate[i]['Delivery Rate'])/3).toFixed(2);
  }

  return (
    <div className="senda-fade-in">
      {/* Stat Cards — 2 cols mobile, 4 cols md+ */}
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:24}}>
        {statCards.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* Row 1: SMS Volume vs Delivery */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:16,marginBottom:16}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="SMS Volume & Delivery Analysis" subtitle="Sent vs Delivered vs Failed — 12-month comparison"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlySMS} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}K`} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="sent" name="Sent" stroke={BRAND} fill="url(#sentGrad)" strokeWidth={2}/>
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke={GREEN} fill="url(#delivGrad)" strokeWidth={2}/>
                <Bar dataKey="failed" name="Failed" fill={`${RED}cc`} radius={[3,3,0,0]} barSize={8}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Pie */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Dec Delivery Status" subtitle="Current month breakdown"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deliveryPie} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
                  paddingAngle={3} dataKey="value" nameKey="name">
                  {deliveryPie.map((d,i) => <Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip formatter={(v)=>v.toLocaleString()} contentStyle={{borderRadius:10,border:'none',background:'#1e293b',color:'#f1f5f9'}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'flex',justifyContent:'space-around',marginTop:8}}>
            {deliveryPie.map(d=>(
              <div key={d.name} style={{textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:d.color}}>{((d.value/115000)*100).toFixed(1)}%</div>
                <div style={{fontSize:10,color:'#94a3b8'}}>{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Revenue + User Growth */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Revenue vs Package Sales" subtitle="Monthly revenue (TZS) & package count"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left" tickFormatter={v=>`${(v/1000000).toFixed(1)}M`} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={`${BRAND}cc`} radius={[4,4,0,0]} barSize={14}/>
                <Line yAxisId="right" type="monotone" dataKey="packages" name="Packages" stroke={AMBER} strokeWidth={2.5} dot={{r:3,fill:AMBER}} activeDot={{r:5}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="User Growth & Churn" subtitle="New users vs active vs churned"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={VIOLET} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={VIOLET} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="users" name="Total Users" stroke={VIOLET} fill="url(#userGrad)" strokeWidth={2}/>
                <Area type="monotone" dataKey="active" name="Active" stroke={GREEN} fill="url(#activeGrad)" strokeWidth={2}/>
                <Line type="monotone" dataKey="churned" name="Churned" stroke={RED} strokeWidth={2} strokeDasharray="4 3" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Delivery Rate Trend + Network Performance */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:16}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Delivery Rate Trend (with 3-Month MA)" subtitle="Rate % and moving average overlay — quality monitoring"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={delivRate} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis domain={[91,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip suffix="%"/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Delivery Rate" fill={`${BRAND}55`} radius={[4,4,0,0]} barSize={16}/>
                <Line type="monotone" dataKey="MA-3" name="3-Mo Moving Avg" stroke={AMBER} strokeWidth={2.5} dot={false} strokeDasharray="6 3"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Network Performance" subtitle="Delivery rate by carrier"/>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:4}}>
            {networkPerf.map(n=>(
              <div key={n.network}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:'#334155'}}>{n.network}</span>
                  <span style={{fontSize:12,fontWeight:700,color:n.color}}>{n.rate}%</span>
                </div>
                <div style={{background:'#f1f5f9',borderRadius:99,height:6,overflow:'hidden'}}>
                  <div style={{width:`${n.rate}%`,background:n.color,height:'100%',borderRadius:99,transition:'width .8s ease'}}/>
                </div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{n.vol.toLocaleString()} SMS</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab() {
  const bp = useBreakpoint();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER = 8;

  const filtered = transactions.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.id.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.package.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const total = filtered.length;
  const paged = filtered.slice((page-1)*PER, page*PER);
  const pages = Math.ceil(total/PER);

  const summary = {
    total: transactions.length,
    completed: transactions.filter(t=>t.status==='completed').length,
    pending:   transactions.filter(t=>t.status==='pending').length,
    failed:    transactions.filter(t=>t.status==='failed').length,
    revenue:   transactions.filter(t=>t.status==='completed').reduce((s,t)=>s+t.amount,0),
  };

  return (
    <div className="senda-fade-in">
      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {label:'Total Txns',  value:summary.total,                     icon:'📋', color:BRAND},
          {label:'Completed',   value:summary.completed,                 icon:'✅', color:GREEN},
          {label:'Pending',     value:summary.pending,                   icon:'⏳', color:AMBER},
          {label:'Failed',      value:summary.failed,                    icon:'❌', color:RED  },
          {label:'Revenue (K)', value:`${(summary.revenue/1000).toFixed(0)}K`, icon:'💰', color:VIOLET},
        ].map(c=>(
          <div key={c.label} className="senda-card" style={{padding:'14px 16px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${c.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{c.icon}</div>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>{c.value}</div>
                <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search by ID, user, package, ref..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}}
          style={{width:bp==='mobile'?'100%':280,height:38,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {['all','completed','pending','failed'].map(f=>(
            <button key={f} className="senda-btn senda-btn-sm" onClick={()=>{setFilter(f);setPage(1);}}
              style={{background:filter===f?BRAND:'#f1f5f9',color:filter===f?'#fff':'#64748b',border:'none'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{total} result{total!==1?'s':''}</span>
      </div>

      {/* Table */}
      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="senda-table" style={{minWidth:720}}>
            <thead>
              <tr>
                <th>Txn ID</th><th>User</th><th>Package</th>
                <th>Amount (TZS)</th><th>Credits</th>
                <th>Method</th><th>Status</th><th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(t=>(
                <tr key={t.id}>
                  <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{t.id}</td>
                  <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.user}</td>
                  <td>{t.package}</td>
                  <td style={{fontWeight:600}}>{t.amount.toLocaleString()}</td>
                  <td>{t.credits.toLocaleString()}</td>
                  <td><span style={{fontSize:11,background:'#f1f5f9',padding:'2px 8px',borderRadius:6}}>{t.method}</span></td>
                  <td><Badge status={t.status}/></td>
                  <td style={{fontSize:12,color:'#64748b'}}>{t.date}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="senda-btn senda-btn-sm senda-btn-ghost" title="View">👁</button>
                      {t.status==='pending' && <button className="senda-btn senda-btn-sm senda-btn-success" title="Approve">✓</button>}
                      {t.status!=='failed' && <button className="senda-btn senda-btn-sm senda-btn-danger" title="Refund">↩</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid #f1f5f9',flexWrap:'wrap',gap:8}}>
          <span style={{fontSize:12,color:'#94a3b8'}}>Showing {Math.min((page-1)*PER+1,total)}–{Math.min(page*PER,total)} of {total}</span>
          <div style={{display:'flex',gap:4}}>
            <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{opacity:page===1?.4:1}}>← Prev</button>
            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
              <button key={p} className="senda-btn senda-btn-sm" onClick={()=>setPage(p)}
                style={{background:p===page?BRAND:'#f1f5f9',color:p===page?'#fff':'#64748b',border:'none',minWidth:30}}>
                {p}
              </button>
            ))}
            <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page===pages} onClick={()=>setPage(p=>p+1)} style={{opacity:page===pages?.4:1}}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sender IDs Tab ───────────────────────────────────────────────────────────
const STATUS_META = {
  approved:        { label:'Approved',        color:GREEN,   bg:'#d1fae5', icon:'✅', desc:'Active & live on network'         },
  pending:         { label:'Pending Review',  color:AMBER,   bg:'#fef3c7', icon:'⏳', desc:'Awaiting admin review'            },
  await_payment:   { label:'Await Payment',   color:ORANGE,  bg:'#ffedd5', icon:'💳', desc:'Invoice issued, payment pending'  },
  rejected:        { label:'Rejected',        color:RED,     bg:'#fee2e2', icon:'❌', desc:'Declined — policy violation'      },
  require_changes: { label:'Require Changes', color:CYAN,    bg:'#cffafe', icon:'🔁', desc:'Admin requested document changes' },
};

// Inline notes/feedback modal (lightweight)
function NotesModal({ item, onClose, onSave }) {
  const [note, setNote] = useState(item.notes || '');
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div className="senda-card senda-fade-up" style={{width:'100%',maxWidth:480,padding:24}}>
        <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>📝 Admin Notes for <span style={{color:BRAND}}>{item.name}</span></h3>
        <p style={{fontSize:12,color:'#94a3b8',marginBottom:14}}>These notes are sent to the applicant as change-request feedback.</p>
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="e.g. Please submit updated business registration certificate…"
          style={{width:'100%',minHeight:100,borderRadius:10,border:'1.5px solid #e2e8f0',padding:'10px 12px',fontSize:13,fontFamily:'inherit',color:'#1e293b',outline:'none',resize:'vertical'}}/>
        <div style={{display:'flex',gap:8,marginTop:14,justifyContent:'flex-end'}}>
          <button className="senda-btn senda-btn-ghost" onClick={onClose} style={{height:36,fontSize:13}}>Cancel</button>
          <button className="senda-btn senda-btn-primary" onClick={()=>onSave(note)} style={{height:36,fontSize:13}}>💾 Save & Send</button>
        </div>
      </div>
    </div>
  );
}

function SenderIdsTab() {
  const bp = useBreakpoint();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(senderIds);
  const [notesModal, setNotesModal] = useState(null); // item being edited

  const updateStatus = (id, newStatus, notes) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, notes: notes ?? s.notes } : s));
  };
  const openRequireChanges = (item) => setNotesModal(item);
  const saveNotes = (note) => {
    updateStatus(notesModal.id, 'require_changes', note);
    setNotesModal(null);
  };

  const counts = Object.fromEntries(
    ['all',...Object.keys(STATUS_META)].map(k => [k, k==='all' ? items.length : items.filter(s=>s.status===k).length])
  );

  const filtered = items.filter(s => {
    const m = filter === 'all' || s.status === filter;
    const q = search.toLowerCase();
    return m && (!q || s.name.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  });

  // Status distribution pie for mini chart
  const pieDist = Object.entries(STATUS_META).map(([k,v]) => ({ name:v.label, value:counts[k], color:v.color })).filter(d=>d.value>0);

  return (
    <div className="senda-fade-in">

      {notesModal && <NotesModal item={notesModal} onClose={()=>setNotesModal(null)} onSave={saveNotes}/>}

      {/* ── Top analytics row ── */}
      <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
        {/* Status breakdown bar chart */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Sender ID Status Distribution" subtitle="All 5 lifecycle stages at a glance"/>
          <div style={{height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieDist} layout="vertical" margin={{top:4,right:40,left:90,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false} width={88}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="value" name="Count" radius={[0,6,6,0]} barSize={18}>
                  {pieDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary stat tiles */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {Object.entries(STATUS_META).map(([k,v])=>(
            <div key={k} className="senda-card" style={{padding:'10px 12px',cursor:'pointer',borderLeft:`3px solid ${v.color}`,transition:'transform .15s'}}
              onClick={()=>setFilter(k)}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <div style={{fontSize:18,marginBottom:2}}>{v.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>{counts[k]}</div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1.3}}>{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search name, owner, company, ID…" value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:bp==='mobile'?'100%':260,height:38,fontSize:13}}/>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          <button className="senda-btn senda-btn-sm" onClick={()=>setFilter('all')}
            style={{background:filter==='all'?BRAND:'#f1f5f9',color:filter==='all'?'#fff':'#64748b',border:'none'}}>
            All ({counts.all})
          </button>
          {Object.entries(STATUS_META).map(([k,v])=>(
            <button key={k} className="senda-btn senda-btn-sm" onClick={()=>setFilter(k)}
              style={{background:filter===k?v.color:'#f1f5f9',color:filter===k?'#fff':'#64748b',border:'none'}}>
              {v.icon} {v.label} ({counts[k]})
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{filtered.length} result{filtered.length!==1?'s':''}</span>
      </div>

      {/* ── Table ── */}
      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="senda-table" style={{minWidth:860}}>
            <thead>
              <tr>
                <th>ID</th><th>Sender Name</th><th>Company</th><th>Owner</th>
                <th>Type</th><th>Network</th><th>SMS Sent</th>
                <th>Status</th><th>Invoice</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{s.id}</td>
                  <td>
                    <div style={{fontWeight:700,color:'#0f172a',fontSize:13}}>{s.name}</div>
                    {s.notes && <div style={{fontSize:10,color:'#f97316',marginTop:1,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.notes}>⚠ {s.notes}</div>}
                  </td>
                  <td style={{maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{s.company}</td>
                  <td style={{fontSize:11,color:'#64748b',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.owner}</td>
                  <td><Badge status={s.type.toLowerCase()}/></td>
                  <td style={{fontSize:11,color:'#475569'}}>{s.network}</td>
                  <td style={{fontWeight:600}}>{s.smsCount.toLocaleString()}</td>
                  <td><Badge status={s.status}/></td>
                  <td style={{fontSize:11,color:s.invoiceNo?ORANGE:'#cbd5e1',fontWeight:s.invoiceNo?600:400}}>{s.invoiceNo||'—'}</td>
                  <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{s.created}</td>
                  <td>
                    <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                      {/* PENDING → Approve / Request Changes / Reject */}
                      {s.status==='pending' && <>
                        <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'approved')}>✅ Approve</button>
                        <button className="senda-btn senda-btn-sm" style={{fontSize:11,background:'#cffafe',color:'#155e75',border:'1px solid #a5f3fc'}} onClick={()=>openRequireChanges(s)}>🔁 Changes</button>
                        <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'rejected')}>❌ Reject</button>
                      </>}

                      {/* AWAIT PAYMENT → Mark Paid (→approved) / Cancel */}
                      {s.status==='await_payment' && <>
                        <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'approved')}>💳 Mark Paid</button>
                        <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'rejected')}>Cancel</button>
                      </>}

                      {/* REQUIRE CHANGES → Edit Note / Approve once fixed / Reject */}
                      {s.status==='require_changes' && <>
                        <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'approved')}>✅ Approve</button>
                        <button className="senda-btn senda-btn-sm" style={{fontSize:11,background:'#ede9fe',color:'#5b21b6',border:'1px solid #ddd6fe'}} onClick={()=>openRequireChanges(s)}>📝 Edit Note</button>
                        <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'rejected')}>Reject</button>
                      </>}

                      {/* APPROVED → Request Payment / Revoke */}
                      {s.status==='approved' && <>
                        <button className="senda-btn senda-btn-sm" style={{fontSize:11,background:'#ffedd5',color:'#9a3412',border:'1px solid #fed7aa'}} onClick={()=>updateStatus(s.id,'await_payment')}>💳 Req. Payment</button>
                        <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'rejected')}>Revoke</button>
                      </>}

                      {/* REJECTED → Re-review (→pending) */}
                      {s.status==='rejected' && <>
                        <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(s.id,'approved')}>✅ Re-approve</button>
                        <button className="senda-btn senda-btn-sm" style={{fontSize:11,background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a'}} onClick={()=>updateStatus(s.id,'pending')}>↩ Re-review</button>
                      </>}

                      <button className="senda-btn senda-btn-sm senda-btn-ghost" style={{fontSize:11}} title="View full details">👁</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>
            No sender IDs match the current filter.
          </div>
        )}
      </div>

      {/* ── Status lifecycle guide ── */}
      <div className="senda-card" style={{padding:16,marginTop:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Status Lifecycle</div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          {[
            {s:'pending',   arrow:'→'},
            {s:'await_payment', arrow:'→'},
            {s:'approved',  arrow:null},
            {s:'require_changes', arrow:'→ (back to pending)'},
            {s:'rejected',  arrow:null},
          ].map(({s,arrow})=>(
            <React.Fragment key={s}>
              <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,background:STATUS_META[s].bg}}>
                <span>{STATUS_META[s].icon}</span>
                <span style={{fontSize:11,fontWeight:600,color:STATUS_META[s].color}}>{STATUS_META[s].label}</span>
              </div>
              {arrow && <span style={{fontSize:12,color:'#cbd5e1',fontWeight:700}}>{arrow}</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Activity Tab ───────────────────────────────────────────────────────
function LoginActivityTab() {
  const bp = useBreakpoint();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = loginActivity.filter(l => {
    const m = filter === 'all' || l.status === filter;
    const q = search.toLowerCase();
    return m && (!q || l.user.includes(q) || l.ip.includes(q) || l.location.toLowerCase().includes(q));
  });

  const successRate = ((loginActivity.filter(l=>l.status==='success').length/loginActivity.length)*100).toFixed(1);

  // Group by day for chart
  const byDay = {};
  loginActivity.forEach(l => {
    const d = l.time.split(' ')[0];
    if (!byDay[d]) byDay[d] = { date:d, success:0, failed:0 };
    byDay[d][l.status]++;
  });
  const chartData = Object.values(byDay).sort((a,b)=>a.date.localeCompare(b.date)).slice(-7);

  return (
    <div className="senda-fade-in">
      {/* Mini chart row */}
      <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Login Activity (Last 7 Days)" subtitle="Successful vs failed login attempts"/>
          <div style={{height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10}}/>
                <Bar dataKey="success" name="Success" fill={GREEN} radius={[4,4,0,0]} barSize={14}/>
                <Bar dataKey="failed" name="Failed" fill={RED} radius={[4,4,0,0]} barSize={14}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="senda-card" style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <SectionHeader title="Auth Summary" subtitle="Overall health"/>
          {[
            {l:'Total Attempts', v:loginActivity.length, c:BRAND},
            {l:'Successful', v:loginActivity.filter(l=>l.status==='success').length, c:GREEN},
            {l:'Failed', v:loginActivity.filter(l=>l.status==='failed').length, c:RED},
            {l:'Success Rate', v:`${successRate}%`, c:successRate>90?GREEN:AMBER},
          ].map(x=>(
            <div key={x.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
              <span style={{fontSize:12,color:'#64748b'}}>{x.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:x.c}}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search user, IP, location..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:bp==='mobile'?'100%':260,height:38,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {['all','success','failed'].map(f=>(
            <button key={f} className="senda-btn senda-btn-sm" onClick={()=>setFilter(f)}
              style={{background:filter===f?BRAND:'#f1f5f9',color:filter===f?'#fff':'#64748b',border:'none'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="senda-table" style={{minWidth:680}}>
            <thead>
              <tr><th>Log ID</th><th>User</th><th>IP Address</th><th>Device</th><th>Location</th><th>Role</th><th>Status</th><th>Time</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id}>
                  <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{l.id}</td>
                  <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{l.user}</td>
                  <td style={{fontFamily:'monospace',fontSize:12,color:'#475569'}}>{l.ip}</td>
                  <td style={{fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.device}</td>
                  <td style={{fontSize:12}}>{l.location}</td>
                  <td><Badge status={l.role}/></td>
                  <td><Badge status={l.status}/></td>
                  <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{l.time}</td>
                  <td>
                    <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} title="Block IP">🚫 Block</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SMS Packages Tab ─────────────────────────────────────────────────────────
function SmsPackagesTab() {
  const bp = useBreakpoint();
  const [pkgs, setPkgs] = useState(smsPackages);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);

  const openEdit = (pkg) => { setEditing(pkg.id); setForm({...pkg}); setShowAdd(false); };
  const openAdd  = () => { setShowAdd(true); setEditing(null); setForm({id:`PKG-${String(pkgs.length+1).padStart(3,'0')}`,name:'',credits:1000,price:8000,per_sms:8.0,popular:false,color:BRAND,desc:''}); };
  const saveEdit = () => {
    if (editing) setPkgs(p=>p.map(x=>x.id===editing?{...form}:x));
    else setPkgs(p=>[...p,{...form}]);
    setEditing(null); setShowAdd(false);
  };
  const deletePkg = id => { if(window.confirm('Delete this package?')) setPkgs(p=>p.filter(x=>x.id!==id)); };

  // Comparison chart data
  const cmpData = pkgs.map(p=>({name:p.name,credits:p.credits,price:p.price/1000,per_sms:p.per_sms}));

  const isEditing = editing || showAdd;

  return (
    <div className="senda-fade-in">
      {/* Analytics row */}
      <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'1fr 1fr',gap:16,marginBottom:20}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Credits vs Price Comparison" subtitle="Package value analysis"/>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cmpData} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tickFormatter={v=>`${v}K`} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar yAxisId="left" dataKey="credits" name="Credits" fill={`${BRAND}99`} radius={[4,4,0,0]} barSize={18}/>
                <Line yAxisId="right" type="monotone" dataKey="price" name="Price (K TZS)" stroke={AMBER} strokeWidth={2.5} dot={{r:4,fill:AMBER}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Cost per SMS by Package" subtitle="Lower = better value for customers"/>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmpData} layout="vertical" margin={{top:4,right:24,left:60,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" domain={[6,11]} tickFormatter={v=>`${v} TZS`} tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip prefix="" suffix=" TZS/SMS"/>}/>
                <Bar dataKey="per_sms" name="Cost/SMS" radius={[0,4,4,0]} barSize={16}>
                  {cmpData.map((_, i) => <Cell key={i} fill={[BRAND,GREEN,AMBER,VIOLET,CYAN,PINK][i%6]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Header + Add */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>SMS Package Manager</h3>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{pkgs.length} packages configured</p>
        </div>
        <button className="senda-btn senda-btn-primary" onClick={openAdd} style={{height:38,fontSize:13}}>+ Add Package</button>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="senda-card senda-fade-up" style={{padding:20,marginBottom:16,borderLeft:`4px solid ${BRAND}`}}>
          <h4 style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:14}}>{editing?'Edit Package':'New Package'}</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
            {[
              {k:'name',label:'Package Name',type:'text'},
              {k:'credits',label:'Credits',type:'number'},
              {k:'price',label:'Price (TZS)',type:'number'},
              {k:'per_sms',label:'Cost per SMS',type:'number'},
              {k:'desc',label:'Description',type:'text'},
            ].map(f=>(
              <div key={f.k}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>{f.label}</label>
                <input className="senda-input" type={f.type} value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:f.type==='number'?+e.target.value:e.target.value}))} style={{height:38,fontSize:13}}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>Popular?</label>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:10}}>
                <input type="checkbox" checked={!!form.popular} onChange={e=>setForm(p=>({...p,popular:e.target.checked}))} style={{width:16,height:16,accentColor:BRAND}}/>
                <span style={{fontSize:13,color:'#334155'}}>Mark as Popular</span>
              </label>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button className="senda-btn senda-btn-primary" onClick={saveEdit} style={{height:36,fontSize:13}}>💾 Save</button>
            <button className="senda-btn senda-btn-ghost" onClick={()=>{setEditing(null);setShowAdd(false);}} style={{height:36,fontSize:13}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Package Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {pkgs.map(p=>(
          <div key={p.id} className="senda-card" style={{padding:20,borderTop:`4px solid ${p.color}`,position:'relative',transition:'transform .2s,box-shadow .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
          >
            {p.popular && <div style={{position:'absolute',top:12,right:12,background:BRAND,color:'#fff',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,letterSpacing:'.08em'}}>POPULAR</div>}
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:4}}>{p.id}</div>
            <div style={{fontSize:20,fontWeight:800,color:'#0f172a',marginBottom:2}}>{p.name}</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>{p.desc}</div>
            <div style={{display:'flex',gap:16,marginBottom:14}}>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:p.color}}>{p.credits.toLocaleString()}</div>
                <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>CREDITS</div>
              </div>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:'#0f172a'}}>{(p.price/1000).toFixed(0)}K</div>
                <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>TZS</div>
              </div>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:GREEN}}>{p.per_sms}</div>
                <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>TZS/SMS</div>
              </div>
            </div>
            <div style={{height:4,background:'#f1f5f9',borderRadius:99,marginBottom:14,overflow:'hidden'}}>
              <div style={{width:`${(p.credits/50000)*100}%`,background:p.color,height:'100%',borderRadius:99}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={()=>openEdit(p)} style={{flex:1}}>✏️ Edit</button>
              <button className="senda-btn senda-btn-sm senda-btn-danger" onClick={()=>deletePkg(p.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Partners Tab ─────────────────────────────────────────────────────────────
const TIER_COLOR = { Platinum:'#6366f1', Gold:AMBER, Silver:'#94a3b8' };

function PartnersTab() {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [items, setItems] = useState(partners);
  const [filter, setFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const updateStatus = (id, s) => setItems(p => p.map(x => x.id===id ? {...x, status:s} : x));
  const openEdit = (pt) => { setEditId(pt.id); setForm({...pt}); setShowAdd(false); };
  const saveEdit = () => {
    if (editId) setItems(p=>p.map(x=>x.id===editId?{...form}:x));
    else setItems(p=>[...p,{...form,id:`PTR-${String(3001+p.length).padStart(4,'0')}`,joinDate:new Date().toISOString().split('T')[0]}]);
    setEditId(null); setShowAdd(false);
  };
  const deleteParter = id => { if(window.confirm('Remove this partner?')) setItems(p=>p.filter(x=>x.id!==id)); };

  const counts = {
    all:       items.length,
    active:    items.filter(p=>p.status==='active').length,
    pending:   items.filter(p=>p.status==='pending').length,
    suspended: items.filter(p=>p.status==='suspended').length,
  };
  const tierCounts = { all:items.length, Platinum:items.filter(p=>p.tier==='Platinum').length, Gold:items.filter(p=>p.tier==='Gold').length, Silver:items.filter(p=>p.tier==='Silver').length };

  const filtered = items.filter(p => {
    const ms = filter==='all' || p.status===filter;
    const mt = tierFilter==='all' || p.tier===tierFilter;
    const q  = search.toLowerCase();
    return ms && mt && (!q || p.name.toLowerCase().includes(q) || p.contact.includes(q) || p.region.toLowerCase().includes(q));
  });

  const totalRevenue = items.reduce((s,p)=>s+p.revenue,0);
  const totalComm    = items.reduce((s,p)=>s+p.commission,0);
  const totalClients = items.reduce((s,p)=>s+p.clients,0);
  const totalSMS     = items.reduce((s,p)=>s+p.smsSent,0);

  const isEditing = editId || showAdd;

  return (
    <div className="senda-fade-in">

      {/* ── KPI cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'Total Partners', v:items.length,                   c:BRAND,  i:'🤝'},
          {l:'Active',         v:counts.active,                  c:GREEN,  i:'✅'},
          {l:'Pending',        v:counts.pending,                 c:AMBER,  i:'⏳'},
          {l:'Suspended',      v:counts.suspended,               c:RED,    i:'🚫'},
          {l:'Total Clients',  v:totalClients,                   c:VIOLET, i:'👥'},
          {l:'SMS via Partners',v:`${(totalSMS/1000).toFixed(0)}K`,c:CYAN, i:'📨'},
          {l:'Partner Revenue',v:`${(totalRevenue/1000000).toFixed(1)}M`,c:ORANGE,i:'💰'},
          {l:'Commissions',    v:`${(totalComm/1000000).toFixed(2)}M`,c:GREEN,i:'💸'},
        ].map(x=>(
          <div key={x.l} className="senda-card" style={{padding:'12px 14px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${x.c}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{x.i}</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{x.v}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>{x.l}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Analytics charts ── */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Partner Revenue & Commission Trend" subtitle="6-month growth with commission overlay"/>
          <div style={{height:isMobile?160:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={partnerRevTrend} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="partnerRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left"  tickFormatter={v=>`${(v/1000000).toFixed(1)}M`} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (TZS)" stroke={BRAND} fill="url(#partnerRevGrad)" strokeWidth={2}/>
                <Bar yAxisId="left" dataKey="commission" name="Commission" fill={`${GREEN}99`} radius={[4,4,0,0]} barSize={12}/>
                <Line yAxisId="right" type="monotone" dataKey="clients" name="Active Clients" stroke={VIOLET} strokeWidth={2.5} dot={{r:3,fill:VIOLET}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Partner Tier Distribution" subtitle="Platinum / Gold / Silver breakdown"/>
          <div style={{height:isMobile?140:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierDist} cx="50%" cy="50%" innerRadius="50%" outerRadius="78%" paddingAngle={4} dataKey="value">
                  {tierDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip formatter={v=>v} contentStyle={{borderRadius:10,border:'none',background:'#1e293b',color:'#f1f5f9'}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'flex',justifyContent:'space-around',marginTop:4}}>
            {tierDist.map(d=>(
              <div key={d.name} style={{textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:800,color:d.color}}>{d.value}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Header + Add button ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Partner Directory</h3>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{filtered.length} partners shown</p>
        </div>
        <button className="senda-btn senda-btn-primary" onClick={()=>{setShowAdd(true);setEditId(null);setForm({name:'',contact:'',phone:'',region:'Dar es Salaam',tier:'Silver',status:'pending',clients:0,smsSent:0,revenue:0,commission:0,apiKey:`pk_live_${Math.random().toString(36).substr(2,16)}`});}} style={{height:38,fontSize:13}}>
          + Add Partner
        </button>
      </div>

      {/* ── Inline add/edit form ── */}
      {isEditing && (
        <div className="senda-card senda-fade-up" style={{padding:20,marginBottom:16,borderLeft:`4px solid ${BRAND}`}}>
          <h4 style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:14}}>{editId?'Edit Partner':'Onboard New Partner'}</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
            {[
              {k:'name',label:'Agency Name',type:'text'},
              {k:'contact',label:'Contact Email',type:'email'},
              {k:'phone',label:'Phone',type:'text'},
              {k:'region',label:'Region',type:'text'},
            ].map(f=>(
              <div key={f.k}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>{f.label}</label>
                <input className="senda-input" type={f.type} value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{height:38,fontSize:13}}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>Tier</label>
              <select value={form.tier||'Silver'} onChange={e=>setForm(p=>({...p,tier:e.target.value}))}
                className="senda-input" style={{height:38,fontSize:13,cursor:'pointer'}}>
                <option>Silver</option><option>Gold</option><option>Platinum</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>Status</label>
              <select value={form.status||'pending'} onChange={e=>setForm(p=>({...p,status:e.target.value}))}
                className="senda-input" style={{height:38,fontSize:13,cursor:'pointer'}}>
                <option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          {form.apiKey && (
            <div style={{marginTop:12,padding:'8px 12px',background:'#f8fafc',borderRadius:8,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>API KEY:</span>
              <code style={{fontSize:11,color:'#1e293b',fontFamily:'monospace'}}>{form.apiKey}</code>
            </div>
          )}
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button className="senda-btn senda-btn-primary" onClick={saveEdit} style={{height:36,fontSize:13}}>💾 Save</button>
            <button className="senda-btn senda-btn-ghost" onClick={()=>{setEditId(null);setShowAdd(false);}} style={{height:36,fontSize:13}}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search partner, email, region…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:isMobile?'100%':240,height:36,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {[['all','All'],['active','Active'],['pending','Pending'],['suspended','Suspended']].map(([k,l])=>(
            <button key={k} className="senda-btn senda-btn-sm" onClick={()=>setFilter(k)}
              style={{background:filter===k?BRAND:'#f1f5f9',color:filter===k?'#fff':'#64748b',border:'none'}}>
              {l} ({counts[k]??items.length})
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          {['all','Platinum','Gold','Silver'].map(t=>(
            <button key={t} className="senda-btn senda-btn-sm" onClick={()=>setTierFilter(t)}
              style={{background:tierFilter===t?(TIER_COLOR[t]||BRAND):'#f1f5f9',color:tierFilter===t?'#fff':'#64748b',border:'none'}}>
              {t==='all'?'All Tiers':t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="senda-table" style={{minWidth:860}}>
            <thead>
              <tr>
                <th>ID</th><th>Agency Name</th><th>Contact</th><th>Region</th>
                <th>Tier</th><th>Clients</th><th>SMS Sent</th>
                <th>Revenue (TZS)</th><th>Commission</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{p.id}</td>
                  <td style={{fontWeight:700,color:'#0f172a'}}>{p.name}</td>
                  <td style={{fontSize:11,color:'#64748b',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contact}</td>
                  <td style={{fontSize:12}}>{p.region}</td>
                  <td>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:700,background:`${TIER_COLOR[p.tier]}22`,color:TIER_COLOR[p.tier]}}>
                      {p.tier==='Platinum'?'💎':p.tier==='Gold'?'🥇':'🥈'} {p.tier}
                    </span>
                  </td>
                  <td style={{fontWeight:600}}>{p.clients}</td>
                  <td style={{fontWeight:600}}>{(p.smsSent/1000).toFixed(1)}K</td>
                  <td style={{fontWeight:700,color:GREEN}}>{(p.revenue/1000).toFixed(0)}K</td>
                  <td style={{fontWeight:600,color:ORANGE}}>{(p.commission/1000).toFixed(0)}K</td>
                  <td><Badge status={p.status}/></td>
                  <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{p.joinDate}</td>
                  <td>
                    <div style={{display:'flex',gap:3}}>
                      {p.status==='pending'   && <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(p.id,'active')}>✅ Activate</button>}
                      {p.status==='active'    && <button className="senda-btn senda-btn-sm senda-btn-danger"  style={{fontSize:11}} onClick={()=>updateStatus(p.id,'suspended')}>🚫 Suspend</button>}
                      {p.status==='suspended' && <button className="senda-btn senda-btn-sm senda-btn-success" style={{fontSize:11}} onClick={()=>updateStatus(p.id,'active')}>↩ Reinstate</button>}
                      <button className="senda-btn senda-btn-sm senda-btn-ghost" style={{fontSize:11}} onClick={()=>openEdit(p)}>✏️</button>
                      <button className="senda-btn senda-btn-sm senda-btn-danger" style={{fontSize:11}} onClick={()=>deleteParter(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No partners match the current filter.</div>}
      </div>
    </div>
  );
}

// ─── Users Management Tab ─────────────────────────────────────────────────────
function UsersTab() {
  const bp = useBreakpoint();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const users = Array.from({length:20}, (_,i) => ({
    id: `USR-${String(1001+i).padStart(5,'0')}`,
    name: ['Alice Mwanga','Bob Karibu','Clara Ndoto','David Moshi','Eva Nyerere','Frank Soko','Grace Tembo','Henry Juma','Irene Bongo','James Kibet'][i%10],
    email: `user${i+1}@${['gmail','yahoo','outlook','senda'][i%4]}.com`,
    phone: `+2557${String(10000000+i*1234567).slice(0,8)}`,
    role: i===0?'admin':i%5===0?'partner':'user',
    status: i%9===0?'suspended':'active',
    joined: new Date(Date.now()-i*7*86400000).toISOString().split('T')[0],
    smsSent: Math.floor(Math.random()*5000+100),
    balance: Math.floor(Math.random()*50000+500),
  }));

  const filtered = users.filter(u => {
    const m = filterRole==='all' || u.role===filterRole;
    const q = search.toLowerCase();
    return m && (!q || u.name.toLowerCase().includes(q) || u.email.includes(q));
  });

  return (
    <div className="senda-fade-in">
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search by name, email..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:bp==='mobile'?'100%':260,height:38,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {['all','admin','partner','user'].map(f=>(
            <button key={f} className="senda-btn senda-btn-sm" onClick={()=>setFilterRole(f)}
              style={{background:filterRole===f?BRAND:'#f1f5f9',color:filterRole===f?'#fff':'#64748b',border:'none'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{filtered.length} users</span>
      </div>

      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="senda-table" style={{minWidth:780}}>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>SMS Sent</th><th>Balance (TZS)</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id}>
                  <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{u.id}</td>
                  <td style={{fontWeight:600,color:'#0f172a'}}>{u.name}</td>
                  <td style={{fontSize:12,color:'#64748b'}}>{u.email}</td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{u.phone}</td>
                  <td><Badge status={u.role}/></td>
                  <td style={{fontWeight:600}}>{u.smsSent.toLocaleString()}</td>
                  <td style={{fontWeight:600,color:GREEN}}>{u.balance.toLocaleString()}</td>
                  <td><Badge status={u.status}/></td>
                  <td style={{fontSize:12,color:'#64748b'}}>{u.joined}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="senda-btn senda-btn-sm senda-btn-ghost" title="View">👁</button>
                      {u.status==='active'
                        ? <button className="senda-btn senda-btn-sm senda-btn-danger" title="Suspend" style={{fontSize:11}}>Suspend</button>
                        : <button className="senda-btn senda-btn-sm senda-btn-success" title="Activate" style={{fontSize:11}}>Activate</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview',    icon:'📊', label:'Overview'      },
  { id:'users',       icon:'👥', label:'Users'          },
  { id:'transactions',icon:'💳', label:'Transactions'   },
  { id:'senderids',   icon:'🏷️', label:'Sender IDs'    },
  { id:'partners',    icon:'🤝', label:'Partners'       },
  { id:'loginactivity',icon:'🔐',label:'Login Activity' },
  { id:'smspackages', icon:'📦', label:'SMS Packages'   },
];

function Sidebar({ active, setActive, onLogout, mode }) {
  // mode: 'full' | 'icon' | 'hidden'
  if (mode === 'hidden') return null;
  const collapsed = mode === 'icon';
  const w = collapsed ? 60 : 220;

  return (
    <aside style={{
      width:w, flexShrink:0, height:'100vh', position:'sticky', top:0,
      background:'#fff', borderRight:'1px solid #e2e8f0',
      display:'flex', flexDirection:'column', transition:'width .25s ease',
      boxShadow:'1px 0 4px rgba(0,0,0,.04)', overflow:'hidden', zIndex:100,
    }}>
      {/* Logo */}
      <div style={{height:64, display:'flex', alignItems:'center', justifyContent:collapsed?'center':'flex-start',
        padding:collapsed?'0':'0 16px', borderBottom:'1px solid #f1f5f9', flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${BRAND},${BRAND2})`,
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{fontSize:18,color:'#fff'}}>✉</span>
        </div>
        {!collapsed && (
          <div style={{marginLeft:10}}>
            <div style={{fontSize:16,fontWeight:800,color:'#0f172a',letterSpacing:'-.3px'}}>SENDA</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'.1em'}}>Admin Panel</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        {!collapsed && <div style={{fontSize:9,fontWeight:700,color:'#cbd5e1',letterSpacing:'.1em',textTransform:'uppercase',padding:'4px 8px 8px'}}>Navigation</div>}
        {NAV.map(n=>(
          <button key={n.id} className={`senda-nav-item${active===n.id?' active':''}`}
            onClick={()=>setActive(n.id)}
            title={collapsed?n.label:''}
            style={{justifyContent:collapsed?'center':'flex-start', borderLeft:active===n.id&&!collapsed?`3px solid ${BRAND}`:'3px solid transparent', paddingLeft:collapsed?undefined:9}}>
            <span style={{fontSize:18,flexShrink:0}}>{n.icon}</span>
            {!collapsed && <span>{n.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{padding:'10px 8px',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
        <button className="senda-nav-item" onClick={onLogout}
          title={collapsed?'Logout':''}
          style={{justifyContent:collapsed?'center':'flex-start',color:RED,width:'100%'}}>
          <span style={{fontSize:18,flexShrink:0}}>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (mobile) ──────────────────────────────────────────────────────
function BottomNav({ active, setActive, onLogout }) {
  const visible = NAV.slice(0,5);
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:200,
      background:'#fff', borderTop:'1px solid #e2e8f0',
      display:'flex', alignItems:'center',
      boxShadow:'0 -4px 16px rgba(0,0,0,.08)',
      height:60,
    }}>
      {visible.map(n=>(
        <button key={n.id} onClick={()=>setActive(n.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          border:'none', background:'none', cursor:'pointer', padding:'4px 2px', gap:2,
          color: active===n.id ? BRAND : '#94a3b8',
          transition:'color .15s',
        }}>
          <span style={{fontSize:20, filter:active===n.id?'none':'grayscale(50%)'}}>{n.icon}</span>
          <span style={{fontSize:9,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>{n.label.split(' ')[0]}</span>
        </button>
      ))}
      <button onClick={onLogout} style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        border:'none', background:'none', cursor:'pointer', padding:'4px 2px', gap:2, color:RED,
      }}>
        <span style={{fontSize:20}}>🚪</span>
        <span style={{fontSize:9,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>Logout</span>
      </button>
    </nav>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const bp = useBreakpoint();
  const [active, setActive] = useState('overview');
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const sidebarMode = isMobile ? 'hidden' : isTablet ? 'icon' : 'full';

  const tabLabel = NAV.find(n=>n.id===active);
  const tabTitle = tabLabel ? `SENDA Admin | ${tabLabel.label}` : 'SENDA Admin';

  useEffect(() => { document.title = tabTitle; }, [tabTitle]);

  const tabMap = {
    overview:     <OverviewTab/>,
    users:        <UsersTab/>,
    transactions: <TransactionsTab/>,
    senderids:    <SenderIdsTab/>,
    partners:     <PartnersTab/>,
    loginactivity:<LoginActivityTab/>,
    smspackages:  <SmsPackagesTab/>,
  };

  return (
    <div style={{display:'flex',height:'100vh',background:'#f8fafc',overflow:'hidden'}}>
      <Sidebar active={active} setActive={setActive} onLogout={onLogout} mode={sidebarMode}/>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Header */}
        <header style={{
          height:64, background:'#fff', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:`0 ${isMobile?'16px':'24px'}`, flexShrink:0,
          boxShadow:'0 1px 4px rgba(0,0,0,.04)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {isMobile && (
              <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${BRAND},${BRAND2})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:16,color:'#fff'}}>✉</span>
              </div>
            )}
            <div>
              <h2 style={{fontSize:isMobile?14:16,fontWeight:700,color:'#0f172a',lineHeight:1}}>
                {tabLabel?.icon} {tabLabel?.label}
              </h2>
              {!isMobile && <p style={{fontSize:11,color:'#94a3b8',marginTop:1}}>SENDA Admin Portal</p>}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?8:12}}>
            {!isMobile && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>Admin</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>admin@senda.co.tz</div>
              </div>
            )}
            <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${BRAND},${BRAND2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14,flexShrink:0}}>A</div>
            {isMobile && (
              <button className="senda-btn senda-btn-sm senda-btn-danger" onClick={onLogout} style={{padding:'0 10px',height:32,fontSize:12}}>🚪</button>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{flex:1,overflowY:'auto',padding:isMobile?'16px 12px 80px':'24px',minWidth:0}}>
          {tabMap[active]}
        </main>
      </div>

      {isMobile && <BottomNav active={active} setActive={setActive} onLogout={onLogout}/>}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bp = useBreakpoint();

  useEffect(() => { document.title = 'SENDA Admin | Login'; }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 520));
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(LS_KEY, JSON.stringify({ email, loginAt: Date.now() }));
      onLogin();
    } else {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const isMobile = bp === 'mobile';

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:`radial-gradient(ellipse at 20% 50%, #1e3a8a 0%, #0f172a 50%, #1e1b4b 100%)`,
      position:'relative',overflow:'hidden',padding:isMobile?'16px':'0',
    }}>
      <FloatingDots/>

      {/* Glow orbs */}
      <div style={{position:'absolute',top:'15%',left:'10%',width:300,height:300,borderRadius:'50%',background:`${BRAND}22`,filter:'blur(80px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'20%',right:'8%',width:250,height:250,borderRadius:'50%',background:`#7c3aed22`,filter:'blur(70px)',pointerEvents:'none'}}/>

      {/* Card */}
      <div className="senda-fade-up" style={{
        width:'100%', maxWidth:420,
        background:'rgba(255,255,255,0.05)',
        backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:20,
        padding:isMobile?'28px 20px':'40px 36px',
        boxShadow:'0 24px 80px rgba(0,0,0,.5)',
        position:'relative', zIndex:10,
      }}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
            width:62,height:62,borderRadius:18,
            background:`linear-gradient(135deg,${BRAND},${BRAND2})`,
            boxShadow:`0 8px 24px ${BRAND}66`,marginBottom:14,
          }}>
            <span style={{fontSize:28,color:'#fff'}}>✉</span>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-.5px'}}>SENDA</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2,letterSpacing:'.1em',textTransform:'uppercase',fontWeight:600}}>Admin Dashboard</div>
        </div>

        <h2 style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:6,textAlign:'center'}}>Welcome back</h2>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',textAlign:'center',marginBottom:24}}>Sign in to manage SENDA platform</p>

        {/* Error */}
        {error && (
          <div style={{
            background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',
            borderRadius:10,padding:'10px 14px',marginBottom:16,
            display:'flex',alignItems:'center',gap:8,
          }}>
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{fontSize:13,color:'#fca5a5',fontWeight:500}}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Email</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:.6}}>📧</span>
              <input
                type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}} required
                placeholder="admin@senda.co.tz"
                style={{width:'100%',height:46,borderRadius:11,border:'1px solid rgba(255,255,255,0.15)',
                  background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:14,padding:'0 14px 0 40px',
                  outline:'none',fontFamily:'inherit',transition:'border-color .18s,box-shadow .18s',
                }}
                onFocus={e=>{e.target.style.borderColor=`${BRAND}`;e.target.style.boxShadow=`0 0 0 3px ${BRAND}40`;}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.15)';e.target.style.boxShadow='none';}}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Password</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:.6}}>🔒</span>
              <input
                type={showPass?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('');}} required
                placeholder="••••••••"
                style={{width:'100%',height:46,borderRadius:11,border:'1px solid rgba(255,255,255,0.15)',
                  background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:14,padding:'0 42px 0 40px',
                  outline:'none',fontFamily:'inherit',transition:'border-color .18s,box-shadow .18s',
                }}
                onFocus={e=>{e.target.style.borderColor=BRAND;e.target.style.boxShadow=`0 0 0 3px ${BRAND}40`;}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.15)';e.target.style.boxShadow='none';}}
              />
              <button type="button" onClick={()=>setShowPass(v=>!v)} style={{
                position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:16,padding:4,
              }}>{showPass?'🙈':'👁'}</button>
            </div>
          </div>

          {/* Forgot + Remember */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
              <input type="checkbox" style={{accentColor:BRAND,width:14,height:14}}/>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Remember me</span>
            </label>
            <a href="#" onClick={e=>e.preventDefault()} style={{fontSize:12,color:`${BRAND}cc`,textDecoration:'none',fontWeight:600}}
              onMouseEnter={e=>e.target.style.color='#93c5fd'}
              onMouseLeave={e=>e.target.style.color=`${BRAND}cc`}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button type="submit" className="senda-btn senda-btn-primary" disabled={loading}
            style={{width:'100%',height:48,fontSize:15,borderRadius:12,
              background:loading?'#3b82f6':`linear-gradient(135deg,${BRAND},${BRAND2})`,
              boxShadow:`0 8px 20px ${BRAND}55`,
              opacity:loading?.85:1,
            }}>
            {loading ? (
              <><Spinner size={18} color="#fff"/> Authenticating...</>
            ) : (
              <>Sign In →</>
            )}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:20,fontSize:11,color:'rgba(255,255,255,0.25)'}}>
          SENDA Admin Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function SendaAdmin() {
  injectCSS();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return false;
      const { loginAt } = JSON.parse(saved);
      // Session expires after 8 hours
      return Date.now() - loginAt < 8 * 3600 * 1000;
    } catch { return false; }
  });

  const [toast, setToast] = useState(null);
  const toastId = useRef(0);

  const showToast = useCallback((message, type='success') => {
    const id = ++toastId.current;
    setToast({ id, message, type });
  }, []);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
    setTimeout(() => showToast('Welcome back, Admin! 👋', 'success'), 150);
  }, [showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setIsLoggedIn(false);
    document.title = 'SENDA Admin | Login';
  }, []);

  return (
    <div style={{transition:'opacity .35s ease', opacity:1}}>
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast(null)}/>
      )}
      {isLoggedIn
        ? <Dashboard onLogout={handleLogout}/>
        : <LoginPage onLogin={handleLogin}/>
      }
    </div>
  );
}
