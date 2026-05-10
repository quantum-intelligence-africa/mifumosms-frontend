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
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Globe,
  Handshake,
  Hourglass,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MoonStar,
  MoreHorizontal,
  Package,
  ShieldCheck,
  Tag,
  UserCheck,
  UserX,
  Users,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';

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

const LS_KEY     = 'senda_admin_auth';
const BASE_URL   = 'https://mifumosms.mifumolabs.com';

function compactNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  return Math.round(n).toLocaleString();
}

function revenueSourcePriority(source) {
  const s = (source || '').toString().toLowerCase().trim();
  if (s === 'payment_transaction' || s === 'paymenttransaction') return 1;
  if (s === 'purchase') return 2;
  if (s === 'custom_sms_purchase' || s === 'customsmspurchase') return 3;
  if (s === 'senderid_request_payment' || s === 'senderidrequestpayment') return 4;
  if (s === 'manual_activity_log' || s === 'manualactivitylog') return 5;
  return 999;
}

function normalizeRefKey(ref) {
  return (ref || '').toString().trim().toLowerCase();
}

function parseNumberLoose(v) {
  if (typeof v === 'number') return v;
  const s = (v || '').toString().replace(/[^0-9.,-]/g, '').trim();
  if (!s) return null;
  const cleaned = s.replace(/,/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseLocalDateTime(s) {
  if (!s) return null;
  if (s instanceof Date) return Number.isNaN(s.getTime()) ? null : s;
  const str = s.toString().trim();
  if (!str) return null;

  const direct = new Date(str);
  if (!Number.isNaN(direct.getTime())) return direct;

  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, y, mo, d, hh, mm, ss] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), ss ? Number(ss) : 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

function startOfPeriodLocal(now, periodKey) {
  const d = new Date(now);
  if (Number.isNaN(d.getTime())) return null;

  if (periodKey === 'today') return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  if (periodKey === 'week') {
    const day = d.getDay(); // 0 Sun ... 6 Sat
    const diff = (day + 6) % 7; // days since Monday
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff, 0, 0, 0, 0);
  }
  if (periodKey === 'month') return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  if (periodKey === 'year') return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  return null;
}

function computeRevenueOverviewFromEntries(entries) {
  const normalized = (entries || [])
    .map((e, idx) => {
      const source = e.source || e.kind || e.table || e.model || e.type || 'unknown';
      const sourceNorm = source.toString().toLowerCase().trim();
      const amount = parseNumberLoose(e.amount ?? e.total ?? e.total_price ?? e.value);

      if (amount == null) return null;

      const paymentTx = e.payment_transaction || e.paymentTransaction || e.payment || e.transaction || null;
      const paymentStatus = (paymentTx?.status || '').toString().toLowerCase().trim();
      const status = (e.status || '').toString().toLowerCase().trim();
      const snippeStatus = (e.snippe_status || e.snippeStatus || '').toString().toLowerCase().trim();

      // Completion rules (only applied when relevant fields exist)
      if (sourceNorm.includes('paymenttransaction') || sourceNorm === 'payment_transaction') {
        if (e.status != null && status && status !== 'completed') return null;
      } else if (sourceNorm === 'purchase') {
        const purchaseCompleted = status === 'completed';
        const paymentCompleted = paymentStatus === 'completed';
        if (e.status != null && !purchaseCompleted && !paymentCompleted) return null;
      } else if (sourceNorm.includes('custom') || sourceNorm === 'custom_sms_purchase') {
        const customCompleted = status === 'completed';
        const paymentCompleted = paymentStatus === 'completed';
        if (e.status != null && !customCompleted && !paymentCompleted) return null;
      } else if (sourceNorm.includes('senderid') || sourceNorm === 'senderid_request_payment') {
        const paid = e.paid === true;
        const snippeCompleted = snippeStatus === 'completed';
        if ((e.paid != null || snippeStatus) && !paid && !snippeCompleted) return null;
      } else if (sourceNorm.includes('manual') || sourceNorm === 'manual_activity_log') {
        const activityType = (e.activity_type || e.activityType || '').toString().toLowerCase().trim();
        if (activityType && activityType !== 'transaction') return null;
        if (!(amount > 0)) return null;
      }

      // Timestamp resolution (prefers completed time where available)
      const paymentWhen =
        parseLocalDateTime(paymentTx?.completed_at) ||
        parseLocalDateTime(paymentTx?.updated_at) ||
        parseLocalDateTime(paymentTx?.created_at);
      const when =
        parseLocalDateTime(e.completed_at) ||
        paymentWhen ||
        parseLocalDateTime(e.updated_at) ||
        parseLocalDateTime(e.created_at) ||
        parseLocalDateTime(e.when) ||
        parseLocalDateTime(e.timestamp) ||
        parseLocalDateTime(e.time);
      const tenant = (e.tenant || e.workspace || e.account || e.org || '').toString().trim();
      const userLabel = (e.user_label || e.user || e.customer || e.email || '').toString().trim();
      const ref =
        e.ref ??
        e.reference ??
        e.invoice ??
        e.invoice_ref ??
        e.order_ref ??
        e.gateway_ref ??
        e.gateway_reference ??
        e.transaction_ref ??
        e.transaction_reference ??
        '';
      const objId = e.obj_id ?? e.id ?? e.pk ?? idx;

      if (when == null) return null;

      const normalizedRef = normalizeRefKey(ref);
      const key = normalizedRef || `${source}:${objId}`;
      return {
        key,
        source: source.toString(),
        priority: revenueSourcePriority(source),
        amount,
        when,
        tenant,
        userLabel,
        ref: (ref || '').toString(),
        objId,
      };
    })
    .filter(Boolean);

  normalized.sort((a, b) => (a.priority - b.priority) || (a.when - b.when));
  const seen = new Set();
  const deduped = [];
  for (const e of normalized) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    deduped.push(e);
  }

  const now = new Date();
  const starts = {
    today: startOfPeriodLocal(now, 'today'),
    week: startOfPeriodLocal(now, 'week'),
    month: startOfPeriodLocal(now, 'month'),
    year: startOfPeriodLocal(now, 'year'),
  };

  const periodDefs = [
    { key: 'today', label: 'Today', start: starts.today },
    { key: 'week', label: 'Week', start: starts.week },
    { key: 'month', label: 'Month', start: starts.month },
    { key: 'year', label: 'Year', start: starts.year },
  ];

  const periods = periodDefs.map(p => {
    const inPeriod = p.start ? deduped.filter(e => e.when >= p.start) : [];
    const revenue = inPeriod.reduce((s, e) => s + e.amount, 0);
    return { key: p.key, label: p.label, amount: revenue, count: inPeriod.length };
  });

  const allRevenue = deduped.reduce((s, e) => s + e.amount, 0);
  const allCount = deduped.length;
  periods.push({ key: 'all', label: 'All Time', amount: allRevenue, count: allCount });

  const tenantMap = new Map();
  for (const e of deduped) {
    const k = e.tenant || 'Unknown';
    tenantMap.set(k, (tenantMap.get(k) || 0) + e.amount);
  }
  const topTenants = Array.from(tenantMap.entries())
    .map(([tenant, amount]) => ({ tenant, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const recentEntries = [...deduped].sort((a, b) => b.when - a.when).slice(0, 12);

  return { periods, topTenants, recentEntries, allRevenue, allCount };
}

function extractRevenueEntriesFromHtml(doc) {
  const tables = Array.from(doc.querySelectorAll('table'));
  let best = null;
  let bestScore = 0;
  for (const t of tables) {
    const headerCells = Array.from(t.querySelectorAll('thead th')).map(th => (th.textContent || '').trim().toLowerCase());
    if (!headerCells.length) continue;
    const score =
      (headerCells.some(h => h.includes('amount')) ? 2 : 0) +
      (headerCells.some(h => h.includes('tenant')) ? 2 : 0) +
      (headerCells.some(h => h.includes('time') || h.includes('date')) ? 2 : 0) +
      (headerCells.some(h => h.includes('invoice') || h.includes('ref') || h.includes('reference')) ? 1 : 0) +
      (headerCells.some(h => h.includes('source')) ? 1 : 0);
    if (score > bestScore) {
      best = { table: t, headerCells };
      bestScore = score;
    }
  }

  if (!best || bestScore < 4) return [];
  const { table, headerCells } = best;
  const headerIndex = (pred) => headerCells.findIndex(pred);
  const idxAmount = headerIndex(h => h.includes('amount'));
  const idxTenant = headerIndex(h => h.includes('tenant'));
  const idxWhen = headerIndex(h => h.includes('time') || h.includes('date'));
  const idxRef = headerIndex(h => h.includes('invoice') || h.includes('ref') || h.includes('reference'));
  const idxSource = headerIndex(h => h.includes('source'));
  const idxUser = headerIndex(h => h.includes('user') || h.includes('customer') || h.includes('email'));

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const entries = [];
  for (const [i, r] of rows.entries()) {
    const cells = Array.from(r.querySelectorAll('td')).map(td => (td.textContent || '').replace(/\s+/g, ' ').trim());
    if (!cells.length) continue;
    const amount = idxAmount >= 0 ? parseNumberLoose(cells[idxAmount]) : null;
    const when = idxWhen >= 0 ? parseLocalDateTime(cells[idxWhen]) : null;
    if (amount == null || when == null) continue;
    entries.push({
      source: idxSource >= 0 ? cells[idxSource] : 'unknown',
      amount,
      when,
      tenant: idxTenant >= 0 ? cells[idxTenant] : '',
      user_label: idxUser >= 0 ? cells[idxUser] : '',
      ref: idxRef >= 0 ? cells[idxRef] : '',
      id: i,
    });
  }
  return entries;
}

function parseRevenueOverviewHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // 1) Try to find embedded JSON (best case)
  const jsonScripts = Array.from(doc.querySelectorAll('script[type="application/json"]'));
  for (const s of jsonScripts) {
    const text = (s.textContent || '').trim();
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        const possibleEntries = parsed.entries || parsed.data?.entries || parsed.recent_entries || parsed.recentEntries;
        if (Array.isArray(possibleEntries) && possibleEntries.length) {
          return { kind: 'computed', overview: computeRevenueOverviewFromEntries(possibleEntries) };
        }
        return { kind: 'json', parsed };
      }
    } catch {}
  }

  // 2) Try to parse entry rows from HTML and compute totals client-side (dedupe + periods)
  try {
    const entries = extractRevenueEntriesFromHtml(doc);
    if (entries.length) {
      return { kind: 'computed', overview: computeRevenueOverviewFromEntries(entries) };
    }
  } catch {}

  // 3) Fallback: heuristic text parsing (server-rendered totals already on page)
  const text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  const amountFrom = (labels) => {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${escaped}\\s*[:\\-—]?\\s*(?:TZS|TSh|Tsh)?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`, 'i');
      const m = text.match(re);
      if (m?.[1]) return Number(m[1].replace(/,/g, ''));
    }
    return null;
  };

  const periods = [
    { key: 'today', label: 'Today', amount: amountFrom(['Today', 'This Day']) },
    { key: 'week', label: 'Week', amount: amountFrom(['This Week', 'Week']) },
    { key: 'month', label: 'Month', amount: amountFrom(['This Month', 'Month']) },
    { key: 'year', label: 'Year', amount: amountFrom(['This Year', 'Year']) },
    { key: 'all', label: 'All Time', amount: amountFrom(['All time', 'All Time', 'All-time']) },
  ];

  const any = periods.some(p => typeof p.amount === 'number' && !Number.isNaN(p.amount));
  if (!any) return { kind: 'unparsed', text };

  return { kind: 'periods', periods };
}

async function fetchRevenueOverview() {
  const res = await fetch(`${BASE_URL}/api/revenue-overview/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'text/html' },
  });
  if (!res.ok) {
    const message =
      res.status === 403
        ? 'Access denied (403). Log in with a staff/superuser account on sys-admin-control-v3.'
        : `Failed to load revenue overview (HTTP ${res.status}).`;
    throw new Error(message);
  }
  const html = await res.text();
  return parseRevenueOverviewHtml(html);
}

// ─── API Client ────────────────────────────────────────────────────────────────
function getToken() {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s).token : null;
  } catch { return null; }
}

async function adminFetch(path, options = {}, onLogout) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    try {
      const refreshed = await fetch(`${BASE_URL}/auth/admin/refresh`, {
        method: 'POST', credentials: 'include',
      });
      if (refreshed.ok) {
        const { data } = await refreshed.json();
        const existing = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        localStorage.setItem(LS_KEY, JSON.stringify({
          ...existing, token: data.access_token,
          expires_at: Date.now() + data.expires_in * 1000,
        }));
        return adminFetch(path, options, onLogout);
      }
    } catch {}
    if (onLogout) onLogout();
    return { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Session expired. Please log in again.' } };
  }

  return res.json();
}

// ─── App Context ───────────────────────────────────────────────────────────────
const AppContext = React.createContext({ showToast: () => {}, onLogout: () => {} });

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
.senda-nav-icon{width:18px;height:18px;flex-shrink:0;}
.senda-ops-link{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-decoration:none;color:#0f172a;transition:background .15s,border-color .15s,transform .15s,box-shadow .15s;}
.senda-ops-link:hover{background:#f8fafc;border-color:#cbd5e1;transform:translateY(-1px);box-shadow:0 8px 24px rgba(15,23,42,.06);}
.senda-ops-kind{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}

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

// ─── Loading / Error helpers ───────────────────────────────────────────────────
function LoadingState({ label = 'Loading data...' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, gap:12, color:'#94a3b8', fontSize:14 }}>
      <Spinner size={22} color={BRAND}/> {label}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60, gap:10 }}>
      <AlertTriangle size={32} strokeWidth={1.8} color={AMBER}/>
      <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Failed to load data</div>
      <div style={{ fontSize:12, color:'#64748b', textAlign:'center', maxWidth:360 }}>{message}</div>
      {onRetry && (
        <button className="senda-btn senda-btn-primary" onClick={onRetry} style={{ height:36, fontSize:13, marginTop:8 }}>
          ↺ Retry
        </button>
      )}
    </div>
  );
}

// ─── Hourly heatmap (no API endpoint — kept as visual reference) ───────────────
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
function StatCard({ title, value, desc, icon: Icon, accent, sparkline, sparkKey = 'count' }) {
  // Per /analytics/summary docs: tiles only carry value/label/description.
  // Trends come from the 12-month `series.*` arrays — pass them as `sparkline` to
  // render a small inline area chart at the bottom of the tile.
  const hasSpark = Array.isArray(sparkline) && sparkline.length > 1
    && sparkline.some(d => Number(d?.[sparkKey] || 0) > 0);
  const sparkId = `spark-${(title || 'k').replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div className="senda-card" style={{padding:'16px 18px',transition:'transform .2s,box-shadow .2s',cursor:'default'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
    >
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#94a3b8'}}>{title}</span>
        <div style={{width:32,height:32,borderRadius:9,background:`${accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {Icon ? <Icon size={16} className="senda-nav-icon" style={{width:16,height:16,color:accent}} strokeWidth={2.2}/> : null}
        </div>
      </div>
      <div style={{fontSize:26,fontWeight:800,color:'#0f172a',letterSpacing:'-.5px',lineHeight:1}}>{value}</div>
      {desc && (
        <div style={{marginTop:6,fontSize:11,color:'#94a3b8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{desc}</div>
      )}
      {hasSpark && (
        <div style={{height:32,marginTop:8,marginLeft:-6,marginRight:-6}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{top:2,right:2,left:2,bottom:0}}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={accent} stopOpacity={0.45}/>
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={sparkKey} stroke={accent} strokeWidth={1.5} fill={`url(#${sparkId})`} dot={false} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
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
// One round-trip from /analytics/summary delivers the 20 KPI tiles + 3 monthly
// series. Auxiliary endpoints (sms/monthly, networks/performance, delivery-rate-trend)
// supply the SMS-detail charts that aren't part of the summary payload.
function OverviewTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [period, setPeriod]       = useState('current_year');
  const [statsData, setStatsData] = useState(null);
  const [seriesReg, setSeriesReg] = useState([]); // registrations_monthly
  const [seriesPay, setSeriesPay] = useState([]); // paying_vs_non_paying_monthly
  const [seriesRev, setSeriesRev] = useState([]); // revenue_monthly
  const [generatedAt, setGeneratedAt] = useState(null);
  const [monthlySMS, setMonthlySMS]   = useState([]);
  const [networkPerf, setNetworkPerf] = useState([]);
  const [delivRate, setDelivRate]     = useState([]);

  const fetchAll = useCallback(() => {
    const year = new Date().getFullYear();
    setLoading(true);
    setError(null);
    const optional = (p) => p.catch(() => ({ success:false }));

    // Per docs: /analytics/summary is the ONLY endpoint the overview should call for KPIs +
    // the 3 monthly series. Pairing it with /users/growth or /revenue/monthly desyncs totals.
    Promise.all([
      adminFetch(`/analytics/summary?period=${period}`, {}, onLogout),
      optional(adminFetch(`/analytics/sms/monthly?year=${year}`, {}, onLogout)),
      optional(adminFetch(`/analytics/networks/performance?period=current_month`, {}, onLogout)),
      optional(adminFetch(`/analytics/sms/delivery-rate-trend?year=${year}&ma_window=3`, {}, onLogout)),
    ]).then(([summary, sms, networks, trend]) => {
      if (summary.success) {
        setStatsData(summary.data?.stats || null);
        const series = summary.data?.series || {};
        setSeriesReg(series.registrations_monthly || []);
        setSeriesPay(series.paying_vs_non_paying_monthly || []);
        setSeriesRev(series.revenue_monthly || []);
        setGeneratedAt(summary.data?.generated_at || null);
      }
      if (sms?.success) setMonthlySMS(sms.data || []);
      if (networks?.success) {
        const netColors = [BRAND, GREEN, AMBER, VIOLET, CYAN];
        setNetworkPerf((networks.data || []).map((n, i) => ({
          ...n, rate: n.delivery_rate, vol: n.volume, color: netColors[i % netColors.length],
        })));
      }
      if (trend?.success) {
        setDelivRate((trend.data || []).map(d => ({
          month: d.month,
          'Delivery Rate': d.delivery_rate,
          'MA-3': d.moving_avg_3,
        })));
      }
      if (!summary.success) setError(summary.error?.message || summary.message || 'Failed to load summary.');
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Stat helpers ──────────────────────────────────────────────────────────
  // Per /analytics/summary docs:
  //   - tiles only carry value/label/description (no change/change_label/change_direction).
  //   - trends live in `data.series` (12 contiguous months) — render as sparklines.
  //   - use `value` for math, `label` for display.
  const s = (key) => statsData?.[key] || null;
  const sLabel = (key, fallback = '—') => s(key)?.label ?? fallback;
  const sDesc  = (key, fallback = '')  => s(key)?.description || fallback;

  // Series for the sparklines — supplied by the same /analytics/summary call.
  const sparkRegistrations = (seriesReg || []);
  const sparkRevenue       = (seriesRev || []);
  const sparkPaying        = (seriesPay || []);
  // Approximate non-paying trend from the same series (total − paying).
  const sparkNonPaying     = (seriesPay || []).map(r => ({ ...r, non_paying: r.non_paying ?? Math.max((r.total||0) - (r.paying||0), 0) }));
  // Outbound SMS volume per month — auxiliary, only kept for these sparklines.
  const sparkSmsSent       = (monthlySMS || []).map(r => ({ ...r, sent: r.sent || r.value || 0 }));

  // Compose the 20-tile catalog. Grouped clusters render with section headers.
  const userTiles = !statsData ? [] : [
    { title:'Total Users',         value: sLabel('total_users'),               desc:sDesc('total_users'),               icon:Users,       accent:BRAND,    sparkline:sparkRegistrations, sparkKey:'count' },
    { title:'Active Users',        value: sLabel('active_users'),              desc:sDesc('active_users'),              icon:UserCheck,   accent:GREEN  },
    { title:'New · Today',         value: sLabel('registrations_today'),       desc:sDesc('registrations_today',  'New today'),         icon:UserCheck, accent:CYAN, sparkline:sparkRegistrations, sparkKey:'count' },
    { title:'New · This Week',     value: sLabel('registrations_this_week'),   desc:sDesc('registrations_this_week','ISO week'),        icon:UserCheck, accent:CYAN, sparkline:sparkRegistrations, sparkKey:'count' },
    { title:'New · This Month',    value: sLabel('registrations_this_month'),  desc:sDesc('registrations_this_month','Calendar month'), icon:UserCheck, accent:CYAN, sparkline:sparkRegistrations, sparkKey:'count' },
    { title:'Paying Users',        value: sLabel('paying_users'),              desc:sDesc('paying_users'),              icon:DollarSign,  accent:GREEN,    sparkline:sparkPaying,        sparkKey:'paying' },
    { title:'Non-Paying',          value: sLabel('non_paying_users'),          desc:sDesc('non_paying_users'),          icon:Users,       accent:'#94a3b8',sparkline:sparkNonPaying,     sparkKey:'non_paying' },
    { title:'Inactive Users',      value: sLabel('inactive_users'),            desc:sDesc('inactive_users'),            icon:UserX,       accent:RED    },
    { title:'Idle Buyers (>7d)',   value: sLabel('purchasers_inactive_7d'),    desc:sDesc('purchasers_inactive_7d'),    icon:MoonStar,    accent:AMBER  },
  ];

  const messageTiles = !statsData ? [] : [
    { title:'SMS Sent',            value: sLabel('sms_sent'),                  desc:sDesc('sms_sent'),                  icon:MessageSquare, accent:VIOLET, sparkline:sparkSmsSent, sparkKey:'sent' },
    { title:'Failed (Period)',     value: sLabel('failed_messages'),           desc:sDesc('failed_messages'),           icon:AlertTriangle, accent:ORANGE },
    { title:'Failed (All time)',   value: sLabel('failed_messages_all_time'),  desc:sDesc('failed_messages_all_time','Lifetime'), icon:XCircle,       accent:RED    },
    { title:'Total Msgs (All time)',value:sLabel('total_messages_all_time'),   desc:sDesc('total_messages_all_time','Outbound, all providers'), icon:MessageSquare, accent:BRAND, sparkline:sparkSmsSent, sparkKey:'sent' },
    { title:'Fail Rate',           value: sLabel('delivery_fail_rate'),        desc:sDesc('delivery_fail_rate'),        icon:AlertTriangle, accent:RED    },
    { title:'Avg Delivery',        value: sLabel('avg_delivery_time_seconds'), desc:sDesc('avg_delivery_time_seconds'), icon:Zap,           accent:GREEN  },
  ];

  const revenueTiles = !statsData ? [] : [
    { title:'Revenue (Period)',    value: sLabel('revenue_tzs'),               desc:sDesc('revenue_tzs'),               icon:Wallet,    accent:AMBER, sparkline:sparkRevenue, sparkKey:'amount' },
    { title:'Revenue (All time)',  value: sLabel('total_revenue_all_time'),    desc:sDesc('total_revenue_all_time','Lifetime'), icon:Wallet,    accent:GREEN, sparkline:sparkRevenue, sparkKey:'amount' },
  ];

  const senderTiles = !statsData ? [] : [
    { title:'Approved',            value: sLabel('approved_sender_ids'),       desc:sDesc('approved_sender_ids'),       icon:Tag,    accent:CYAN  },
    { title:'Pending Approvals',   value: sLabel('pending_sender_id_approvals'),desc:sDesc('pending_sender_id_approvals'),icon:Clock, accent:AMBER },
    { title:'Approved · No Pay',   value: sLabel('approved_unpaid_sender_ids'),desc:sDesc('approved_unpaid_sender_ids'),icon:Tag,    accent:'#6366f1' },
  ];

  // ── Series-derived chart data (already 12 contiguous months from server) ──
  const regChart = (seriesReg || []).map(r => ({ month: r.label, count: r.count }));
  const revChart = (seriesRev || []).map(r => ({ month: r.label, revenue: r.amount }));
  const payChart = (seriesPay || []).map(r => ({
    month: r.label,
    Paying: r.paying || 0,
    'Non-paying': r.non_paying || 0,
    Total: r.total || 0,
  }));

  // Period delivery breakdown — derived from stats so it stays consistent with KPI tiles.
  const periodSent     = s('sms_sent')?.value ?? 0;
  const periodFailed   = s('failed_messages')?.value ?? 0;
  const deliveredApprox = Math.max(periodSent - periodFailed, 0);
  const deliveryPie = [
    { name:'Delivered', value: deliveredApprox, color: GREEN },
    { name:'Failed',    value: periodFailed,    color: RED   },
  ].filter(d => d.value > 0);
  const totalPie = deliveryPie.reduce((acc, d) => acc + d.value, 0);

  const chartH = isMobile ? 180 : bp === 'tablet' ? 200 : 260;

  if (loading) return <LoadingState label="Loading analytics..."/>;

  return (
    <div className="senda-fade-in">
      {error && (
        <div style={{ padding:'10px 14px', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, marginBottom:16, fontSize:13, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={14} strokeWidth={2} color='#92400e' style={{flexShrink:0}}/> {error}
        </div>
      )}

      {/* Header: title + period selector */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:14}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Overview</h3>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>
            One round-trip from <code style={{fontSize:10,color:'#475569'}}>/analytics/summary</code>
            {generatedAt && <> · Generated {new Date(generatedAt).toLocaleTimeString()}</>}
          </p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em'}}>Period</span>
          {[
            { id:'today',         label:'Today' },
            { id:'current_month', label:'This Month' },
            { id:'last_month',    label:'Last Month' },
            { id:'current_year',  label:'This Year' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              style={{
                height:28, padding:'0 11px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background: period === p.id ? BRAND : '#f1f5f9',
                color:      period === p.id ? '#fff' : '#64748b',
              }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ── Users (9 tiles) ─────────────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Users · Registrations · Engagement</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:18}}>
        {userTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Messages (6 tiles) ─────────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Messages · Delivery Quality</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:18}}>
        {messageTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Revenue (2 tiles) ──────────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Revenue</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:18}}>
        {revenueTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Sender IDs (3 tiles) ───────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Sender IDs</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:24}}>
        {senderTiles.map(c => <StatCard key={c.title} {...c}/>)}
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

        {/* Delivery Pie — derived from period stats (sms_sent − failed_messages) */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Delivery Status" subtitle="Period (delivered = sent − failed)"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deliveryPie} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
                  paddingAngle={3} dataKey="value" nameKey="name" isAnimationActive={false}>
                  {deliveryPie.map((d,i) => <Cell key={i} fill={d.color} stroke="#fff" strokeWidth={2}/>)}
                </Pie>
                <Tooltip formatter={(v)=>v.toLocaleString()} contentStyle={{borderRadius:10,border:'none',background:'#1e293b',color:'#f1f5f9'}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {totalPie > 0 && (
            <div style={{display:'flex',justifyContent:'space-around',marginTop:8}}>
              {deliveryPie.map(d=>(
                <div key={d.name} style={{textAlign:'center'}}>
                  <div style={{fontSize:13,fontWeight:700,color:d.color}}>{((d.value/totalPie)*100).toFixed(1)}%</div>
                  <div style={{fontSize:10,color:'#94a3b8'}}>{d.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Registrations + Paying vs Non-paying — both from server series */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Registrations" subtitle="New users per month — last 12 months"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regChart} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="regChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.30}/>
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="count" name="New users" stroke={BRAND} fill="url(#regChartGrad)" strokeWidth={2.5}
                  dot={{r:3, fill:BRAND, stroke:'#fff', strokeWidth:1.5}} activeDot={{r:5}} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Paying vs Non-Paying" subtitle="End-of-month cumulative — last 12 months"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payChart} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Paying"     stackId="users" fill={GREEN}     radius={[0,0,0,0]} isAnimationActive={false}/>
                <Bar dataKey="Non-paying" stackId="users" fill={'#cbd5e1'} radius={[3,3,0,0]} isAnimationActive={false}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2b: Revenue monthly — from server series */}
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16,marginBottom:16}}>
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Revenue · Last 12 Months" subtitle="From canonical aggregator (matches transactions/admin totals)"/>
          <div className="chart-h-responsive" style={{height:chartH}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revChart} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=> v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="revenue" name="Revenue (TZS)" fill={AMBER} radius={[4,4,0,0]} isAnimationActive={false}/>
              </BarChart>
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
                <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{(n.vol||0).toLocaleString()} SMS</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
// Source slug → label + accent (per /analytics/transactions/admin docs).
const TXN_SOURCE_META = {
  payment_transaction:      { label:'Direct Gateway',             color: BRAND     },
  purchase:                 { label:'SMS Package Purchase',       color: GREEN     },
  custom_sms_purchase:      { label:'Custom SMS Purchase',        color: VIOLET    },
  senderid_request_payment: { label:'Sender ID Reg Fee',          color: CYAN      },
  manual_activity_log:      { label:'Manual Entry',               color: ORANGE    },
  zenopay_payment:          { label:'Zenopay (Legacy)',           color: '#94a3b8' },
};

function fmtTzs(n) {
  return `${Number(n || 0).toLocaleString()} TZS`;
}
function todayIso()    { return new Date().toISOString().slice(0,10); }
function isoDaysAgo(d) { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0,10); }
function firstOfMonth(){ const x = new Date(); x.setDate(1); return x.toISOString().slice(0,10); }
function firstOfYear() { return `${new Date().getFullYear()}-01-01`; }

function TransactionsTab() {
  const { onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  // Filters
  const [dateFrom,   setDateFrom]   = useState('');             // YYYY-MM-DD; empty = backend default (90d ago)
  const [dateTo,     setDateTo]     = useState('');             // YYYY-MM-DD; empty = now
  const [source,     setSource]     = useState('all');
  const [manualOnly, setManualOnly] = useState(false);
  const [search,     setSearch]     = useState('');             // client-side text filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePeriod, setActivePeriod] = useState('all_time'); // chip highlight

  // Pagination (offset/limit per docs)
  const PER = 25;
  const [offset, setOffset] = useState(0);

  // Data
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ top_n: '10', limit: String(PER), offset: String(offset) });
    if (dateFrom)            qs.set('date_from', dateFrom);
    if (dateTo)              qs.set('date_to', dateTo);
    if (source !== 'all')    qs.set('source', source);
    if (manualOnly)          qs.set('manual_only', 'true');

    adminFetch(`/analytics/transactions/admin?${qs}`, {}, onLogout)
      .then(res => {
        if (!res?.success) { setError(res?.message || res?.error?.message || 'Failed to load transactions.'); return; }
        setData(res.data || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, source, manualOnly, offset, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Period chips → set date_from / date_to and reset offset.
  const setPeriod = (key) => {
    setActivePeriod(key);
    setOffset(0);
    if (key === 'today')      { setDateFrom(todayIso());     setDateTo(todayIso()); }
    else if (key === 'week')  { setDateFrom(isoDaysAgo(7));  setDateTo(todayIso()); }
    else if (key === 'month') { setDateFrom(firstOfMonth()); setDateTo(todayIso()); }
    else if (key === 'year')  { setDateFrom(firstOfYear());  setDateTo(todayIso()); }
    else                      { setDateFrom('');             setDateTo(''); } // all_time
  };

  // Derived data (with safe defaults).
  const totals       = data?.totals       || {};
  const periodTotals = data?.period_totals || {};
  const breakdown    = data?.breakdown_by_source || [];
  const topBuyers    = data?.top_buyers    || [];
  const transactions = data?.transactions  || [];
  const pagination   = data?.pagination    || { total: 0, returned: 0 };
  const period       = data?.period        || {};

  // Status filter & search (client-side over the fetched page).
  const visibleRows = transactions.filter(t => {
    if (statusFilter !== 'all' && (t.status || '').toLowerCase() !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (t.who_purchased || '').toLowerCase().includes(q) ||
      (t.what_for      || '').toLowerCase().includes(q) ||
      (t.reference     || '').toLowerCase().includes(q) ||
      (t.id            || '').toLowerCase().includes(q)
    );
  });

  // Manual vs automated pie data
  const manualVsAuto = (totals.manual_total || totals.automated_total)
    ? [
        { name:'Automated', value: totals.automated_total || 0, fill: BRAND  },
        { name:'Manual',    value: totals.manual_total    || 0, fill: ORANGE },
      ].filter(d => d.value > 0)
    : [];

  // Period chip definitions
  const PERIOD_CHIPS = [
    { id:'today',     label:'Today',      pt:'today'      },
    { id:'week',      label:'This Week',  pt:'this_week'  },
    { id:'month',     label:'This Month', pt:'this_month' },
    { id:'year',      label:'This Year',  pt:'this_year'  },
    { id:'all_time',  label:'All Time',   pt:'all_time'   },
  ];

  return (
    <div className="senda-fade-in">
      {error && (
        <div style={{padding:'10px 14px',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:10,marginBottom:16,fontSize:13,color:'#92400e'}}>
          {error}
        </div>
      )}

      {/* ── Header KPIs ────────────────────────────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${isMobile?160:200}px,1fr))`,gap:12,marginBottom:16}}>
        {[
          { label:'Total Revenue',      value: fmtTzs(totals.total_revenue),                                                              accent: BRAND,   Icon: Wallet         },
          { label:'Transactions',       value: (totals.transaction_count ?? 0).toLocaleString(),                                          accent: VIOLET,  Icon: CreditCard     },
          { label:'Avg Ticket',         value: fmtTzs(Math.round(totals.average_transaction_value || 0)),                                 accent: GREEN,   Icon: DollarSign     },
          { label:'Manual Total',       value: fmtTzs(totals.manual_total),                                                                accent: ORANGE,  Icon: AlertTriangle  },
          { label:'Automated Total',    value: fmtTzs(totals.automated_total),                                                             accent: BRAND,   Icon: Zap            },
        ].map(c => (
          <div key={c.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${c.accent}`}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${c.accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <c.Icon size={17} strokeWidth={2.2} color={c.accent}/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16,fontWeight:800,color:'#0f172a',letterSpacing:'-.3px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.value}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:3}}>{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Period chips (Today/Week/Month/Year/All Time) ──────────────── */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${isMobile?140:160}px,1fr))`,gap:8,marginBottom:16}}>
        {PERIOD_CHIPS.map(p => {
          const stat = periodTotals[p.pt] || { amount:0, count:0 };
          const isActive = activePeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={()=>setPeriod(p.id)}
              className="senda-card"
              style={{
                textAlign:'left', padding:'12px 14px', cursor:'pointer',
                border:`1px solid ${isActive ? BRAND : 'transparent'}`,
                background: isActive ? `${BRAND}10` : '#fff',
              }}
            >
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>{p.label}</div>
              <div style={{fontSize:15,fontWeight:800,color:'#0f172a',marginTop:4,letterSpacing:'-.3px'}}>{compactNumber(stat.amount)} TZS</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{(stat.count || 0).toLocaleString()} txn{stat.count!==1?'s':''}</div>
            </button>
          );
        })}
      </div>

      {/* ── Filters row ────────────────────────────────────────────────── */}
      <div className="senda-card" style={{padding:'12px 14px',marginBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'auto auto 1fr auto auto',gap:10,alignItems:'end'}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>From</div>
            <input type="date" className="senda-input" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setOffset(0); setActivePeriod(''); }} style={{height:34,fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>To</div>
            <input type="date" className="senda-input" value={dateTo}   onChange={e=>{ setDateTo(e.target.value);   setOffset(0); setActivePeriod(''); }} style={{height:34,fontSize:12}}/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Search (page)</div>
            <input className="senda-input" placeholder="Customer, description, reference…" value={search} onChange={e=>setSearch(e.target.value)} style={{height:34,fontSize:12,width:'100%'}}/>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Source</div>
            <select className="senda-input" value={source} onChange={e=>{ setSource(e.target.value); setOffset(0); }} style={{height:34,fontSize:12}}>
              <option value="all">All sources</option>
              {Object.entries(TXN_SOURCE_META).map(([slug, meta]) => (
                <option key={slug} value={slug}>{meta.label}</option>
              ))}
            </select>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#475569',cursor:'pointer',height:34}}>
            <input type="checkbox" checked={manualOnly} onChange={e=>{ setManualOnly(e.target.checked); setOffset(0); }} style={{accentColor:ORANGE}}/>
            Manual only
          </label>
        </div>

        {/* Status sub-filter */}
        <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginRight:4}}>Status</span>
          {['all','completed','pending','failed'].map(s => (
            <button key={s} className="senda-btn senda-btn-sm" onClick={()=>setStatusFilter(s)}
              style={{background: statusFilter===s ? BRAND : '#f1f5f9', color: statusFilter===s ? '#fff' : '#64748b', border:'none'}}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
          {(period.start || period.end) && (
            <span style={{marginLeft:'auto',fontSize:11,color:'#94a3b8'}}>
              {period.start ? new Date(period.start).toLocaleDateString() : '…'} → {period.end ? new Date(period.end).toLocaleDateString() : '…'}
            </span>
          )}
        </div>
      </div>

      {loading ? <LoadingState/> : !data ? null : (
        <>
          {/* ── Charts row: source bar + manual/auto donut + top buyers ───── */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:14,marginBottom:14}}>
            {/* Source breakdown */}
            <div className="senda-card" style={{padding:18}}>
              <SectionHeader title="Revenue by Source" subtitle="Aggregator-canonical totals for the selected window"/>
              {breakdown.length === 0 ? (
                <div style={{padding:'30px 0',textAlign:'center',color:'#94a3b8',fontSize:12}}>No revenue in this window.</div>
              ) : (
                <div style={{height:240}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown.map(b => ({ ...b, fill: TXN_SOURCE_META[b.source]?.color || BRAND }))} layout="vertical" margin={{top:6,right:24,left:8,bottom:6}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                      <XAxis type="number" tickFormatter={v=>compactNumber(v)} tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="label" tick={{fontSize:11,fill:'#475569'}} axisLine={false} tickLine={false} width={140}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Bar dataKey="amount" name="Revenue (TZS)" radius={[0,6,6,0]} barSize={18} isAnimationActive={false}>
                        {breakdown.map((d, i) => <Cell key={i} fill={TXN_SOURCE_META[d.source]?.color || BRAND}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Manual vs Automated + Top Buyers stacked in right column */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="senda-card" style={{padding:18}}>
                <SectionHeader title="Manual vs Automated" subtitle="Recorded entries split"/>
                {manualVsAuto.length === 0 ? (
                  <div style={{padding:'24px 0',textAlign:'center',color:'#94a3b8',fontSize:12}}>—</div>
                ) : (() => {
                  const mvaTotal = manualVsAuto.reduce((s,d) => s + d.value, 0);
                  return (
                    <>
                      <div style={{height:220}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{top:6,right:6,bottom:6,left:6}}>
                            <Pie
                              data={manualVsAuto}
                              dataKey="value"
                              nameKey="name"
                              cx="50%" cy="50%"
                              innerRadius={48}
                              outerRadius={78}
                              paddingAngle={2}
                              isAnimationActive={false}
                              label={({ percent }) => percent > 0.04 ? `${(percent*100).toFixed(0)}%` : ''}
                              labelLine={false}
                            >
                              {manualVsAuto.map((d,i)=><Cell key={i} fill={d.fill} stroke="#fff" strokeWidth={2}/>)}
                            </Pie>
                            <Tooltip
                              formatter={(v, n) => [fmtTzs(v), n]}
                              contentStyle={{borderRadius:10,border:'none',background:'#1e293b',color:'#f1f5f9'}}
                              itemStyle={{color:'#f1f5f9'}}
                            />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Always-visible numeric breakdown so values don't depend on hover/click. */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:6}}>
                        {manualVsAuto.map(d => (
                          <div key={d.name} style={{borderLeft:`3px solid ${d.fill}`,padding:'6px 10px',background:'#f8fafc',borderRadius:6}}>
                            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em'}}>{d.name}</div>
                            <div style={{fontSize:13,fontWeight:800,color:'#0f172a',lineHeight:1.2,marginTop:2}}>{fmtTzs(d.value)}</div>
                            <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{mvaTotal ? ((d.value/mvaTotal)*100).toFixed(1) : '0.0'}%</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── Top Buyers leaderboard ─────────────────────────────────────── */}
          <div className="senda-card" style={{padding:18,marginBottom:14}}>
            <SectionHeader title="Top Customers" subtitle={`Highest spend in window (top ${Math.min(topBuyers.length, 10)})`}/>
            {topBuyers.length === 0 ? (
              <div style={{padding:'30px 0',textAlign:'center',color:'#94a3b8',fontSize:12}}>No buyers in this window.</div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table className="senda-table" style={{width:'100%',minWidth:540}}>
                  <thead><tr><th>#</th><th>Customer</th><th>Total Spent</th><th>Txns</th><th>Type</th></tr></thead>
                  <tbody>
                    {topBuyers.map((b, i) => (
                      <tr key={b.tenant_id || `${b.buyer_name}-${i}`}>
                        <td style={{fontSize:11,fontWeight:700,color:'#cbd5e1',width:28}}>{i+1}</td>
                        <td style={{fontWeight:700,color:'#0f172a',fontSize:13}}>{b.buyer_name || '—'}</td>
                        <td style={{fontWeight:700,color:GREEN,fontSize:13}}>{fmtTzs(b.total_spent)}</td>
                        <td style={{fontSize:12,color:'#64748b',fontWeight:600}}>{(b.transaction_count || 0).toLocaleString()}</td>
                        <td>
                          <span style={{
                            fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                            background: b.is_manual ? `${ORANGE}18` : `${BRAND}10`,
                            color:      b.is_manual ? ORANGE : BRAND,
                            textTransform:'uppercase', letterSpacing:'.04em',
                          }}>
                            {b.is_manual ? 'Manual' : 'Automated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Transactions table ─────────────────────────────────────────── */}
          <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>Transactions</div>
              <span style={{fontSize:11,color:'#94a3b8'}}>
                {visibleRows.length} shown · {pagination.returned || 0} on page · {pagination.total || 0} total
              </span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="senda-table" style={{minWidth:880}}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>For</th>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(t => {
                    const meta = TXN_SOURCE_META[t.source] || { label: t.source_label || 'Other', color: '#94a3b8' };
                    return (
                      <tr key={t.id}>
                        <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{t.date ? new Date(t.date).toLocaleString() : '—'}</td>
                        <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {t.is_manual && <span title="Manual entry" style={{width:6,height:6,borderRadius:'50%',background:ORANGE,flexShrink:0,display:'inline-block'}}/>}
                            <span style={{fontSize:12,fontWeight:600,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.who_purchased || '—'}</span>
                          </div>
                        </td>
                        <td style={{fontSize:12,color:'#475569',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.what_for || t.title || '—'}</td>
                        <td>
                          <span style={{
                            fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                            background: `${meta.color}18`, color: meta.color,
                            textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap',
                          }}>
                            {t.source_label || meta.label}
                          </span>
                        </td>
                        <td style={{fontWeight:700, color: GREEN}}>{Number(t.amount||0).toLocaleString()} {t.currency || 'TZS'}</td>
                        <td><code style={{fontSize:10,color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:4}}>{t.reference || '—'}</code></td>
                        <td><Badge status={t.status}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visibleRows.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No transactions match the current filter.</div>}

            {/* Offset/limit pagination */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid #f1f5f9',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:12,color:'#94a3b8'}}>
                Showing {Math.min(offset+1, pagination.total||0)}–{Math.min(offset + (pagination.returned||0), pagination.total||0)} of {pagination.total || 0}
              </span>
              <div style={{display:'flex',gap:4}}>
                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={offset === 0}
                  onClick={()=>setOffset(o => Math.max(0, o - PER))}
                  style={{opacity: offset === 0 ? .4 : 1}}>← Prev</button>
                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={offset + PER >= (pagination.total || 0)}
                  onClick={()=>setOffset(o => o + PER)}
                  style={{opacity: offset + PER >= (pagination.total || 0) ? .4 : 1}}>Next →</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// ─── Sender IDs Tab ───────────────────────────────────────────────────────────
const STATUS_META = {
  approved:        { label:'Approved',        color:GREEN,   bg:'#d1fae5', Icon:CheckCircle2, desc:'Active & live on network'         },
  pending:         { label:'Pending Review',  color:AMBER,   bg:'#fef3c7', Icon:Hourglass,    desc:'Awaiting admin review'            },
  await_payment:   { label:'Await Payment',   color:ORANGE,  bg:'#ffedd5', Icon:CreditCard,   desc:'Invoice issued, payment pending'  },
  rejected:        { label:'Rejected',        color:RED,     bg:'#fee2e2', Icon:XCircle,      desc:'Declined — policy violation'      },
  require_changes: { label:'Require Changes', color:CYAN,    bg:'#cffafe', Icon:Clock,        desc:'Admin requested document changes' },
};


function SenderIdsTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const tableRef = useRef(null);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [items, setItems]             = useState([]);
  const [apiSummary, setApiSummary]   = useState(null);
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const [users, setUsers]             = useState([]);
  const [partners, setPartners]       = useState([]);
  const PER_PAGE = 50;

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    setItems([]); setApiSummary(null); setLoadedPages(0); setTotalPages(1);

    const optional = (p) => p.catch(() => ({ success:false }));

    // Sender IDs (page 1) + the lookup feeds (users, partners) load in parallel —
    // partners + users are optional so an outage doesn't break the table itself.
    Promise.all([
      adminFetch(`/sender-ids?limit=100&page=1`, {}, onLogout),
      optional(adminFetch(`/users?limit=500&page=1`, {}, onLogout)),
      optional(adminFetch(`/partners`, {}, onLogout)),
    ]).then(([res, uRes, pRes]) => {
        if (uRes?.success) setUsers(uRes.data || []);
        if (pRes?.success) setPartners(pRes.data || []);

        if (!res.success) { setError(res.error?.message || 'Failed to load sender IDs.'); return; }
        const rows  = res.data || [];
        const meta  = res.meta || {};
        const pages = meta.total_pages || 1;
        if (res.summary) setApiSummary(res.summary);
        setTotalPages(pages);
        setLoadedPages(1);
        setItems(rows);

        // Fetch remaining pages in parallel
        if (pages > 1) {
          Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              adminFetch(`/sender-ids?limit=100&page=${i + 2}`, {}, onLogout)
            )
          ).then(responses => {
            const extra = responses.flatMap(r => (r.success ? r.data || [] : []));
            setItems(prev => [...prev, ...extra]);
            setLoadedPages(pages);
          }).catch(() => {/* partial data already shown */});
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout]);

  // Single owner resolver shared by every row.
  const resolveOwner = React.useMemo(() => buildOwnerResolver(users, partners), [users, partners]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Use API summary for accurate platform-wide counts; fall back to counting loaded rows
  const counts = React.useMemo(() => {
    if (apiSummary) {
      return {
        all:             apiSummary.total            ?? items.length,
        approved:        apiSummary.approved         ?? 0,
        pending:         apiSummary.pending          ?? 0,
        await_payment:   apiSummary.await_payment    ?? 0,
        require_changes: apiSummary.require_changes  ?? 0,
        rejected:        apiSummary.rejected         ?? 0,
      };
    }
    return Object.fromEntries(
      ['all', ...Object.keys(STATUS_META)].map(k => [
        k, k === 'all' ? items.length : items.filter(s => s.status === k).length,
      ])
    );
  }, [apiSummary, items]);

  const filtered = React.useMemo(() => {
    setPage(1);
    return items.filter(s => {
      const m = filter === 'all' || s.status === filter;
      const q = search.toLowerCase();
      return m && (!q || (s.name||'').toLowerCase().includes(q) || (s.owner_email||'').toLowerCase().includes(q) || (s.company||'').toLowerCase().includes(q) || (s.id||'').toLowerCase().includes(q));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, search]);

  const totalFilteredPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pieDist = Object.entries(STATUS_META).map(([k,v]) => ({ name:v.label, value:counts[k], color:v.color })).filter(d=>d.value>0);

  return (
    <div className="senda-fade-in">
      {/* ── Analytics row ── */}
      <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
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
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {Object.entries(STATUS_META).map(([k,v])=>(
            <div key={k} className="senda-card" style={{padding:'10px 12px',cursor:'pointer',borderLeft:`3px solid ${v.color}`,transition:'transform .15s'}}
              onClick={()=>setFilter(k)}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <v.Icon size={18} strokeWidth={2} color={v.color} style={{marginBottom:2}}/>
              <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>{counts[k]}</div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1.3}}>{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status lifecycle + Swahilis counts ── */}
      {(() => {
        const SWAHILIS = 'development@swahilies.com';
        const swItems  = items.filter(s => (s.owner_email || '').toLowerCase() === SWAHILIS);
        const swTotal  = swItems.length;
        const swCounts = Object.fromEntries(
          Object.keys(STATUS_META).map(k => [k, swItems.filter(s => s.status === k).length])
        );
        return (
          <div className="senda-card" style={{padding:16,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>Swahilies Sender Ids</div>

            <div style={{borderTop:'1px solid #f1f5f9',paddingTop:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:6}}>
                <div>
                  <span style={{fontSize:11,fontWeight:700,color:'#64748b'}}>Sender IDs by owner · </span>
                  <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:BRAND}}>{SWAHILIS}</span>
                </div>
                <span style={{fontSize:11,color:'#94a3b8'}}>
                  {loadedPages < totalPages
                    ? <span style={{color:AMBER}}>loading… ({loadedPages}/{totalPages} pages)</span>
                    : `${swTotal} total`}
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8}}>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <button key={k}
                    onClick={() => {
                      setFilter(k);
                      setSearch(SWAHILIS);
                      // Scroll to the table itself, not to the top of the page.
                      requestAnimationFrame(() => {
                        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    }}
                    style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'10px 12px',
                      borderRadius:10,border:`1px solid ${v.color}22`,background:v.bg,cursor:'pointer',
                      transition:'transform .15s,box-shadow .15s',textAlign:'left'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 4px 12px ${v.color}22`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                    title={`Filter table by ${v.label} for ${SWAHILIS}`}
                  >
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                      {React.createElement(v.Icon, {size:13,strokeWidth:2,color:v.color})}
                      <span style={{fontSize:10,fontWeight:700,color:v.color,textTransform:'uppercase',letterSpacing:'.05em'}}>{v.label}</span>
                    </div>
                    <div style={{fontSize:26,fontWeight:800,color:'#0f172a',lineHeight:1}}>
                      {loadedPages < totalPages ? '…' : swCounts[k]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
              {v.label} ({counts[k]})
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
          {filtered.length.toLocaleString()} record{filtered.length!==1?'s':''}
          {loadedPages < totalPages && (
            <>
              <div style={{width:10,height:10,borderRadius:'50%',border:`2px solid ${BRAND}`,borderTopColor:'transparent',animation:'spin 0.7s linear infinite'}}/>
              <span style={{color:AMBER}}>loading {loadedPages}/{totalPages}</span>
            </>
          )}
        </span>
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {/* ── Table ── */}
      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div ref={tableRef} className="senda-card senda-table-wrap" style={{overflow:'hidden',scrollMarginTop:80}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:980}}>
              <thead>
                <tr>
                  <th>ID</th><th>Sender Name</th><th>Company</th><th>Owner</th><th>Phone</th>
                  <th>Type</th><th>Network</th><th>SMS Sent</th>
                  <th>Status</th><th>Invoice</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => {
                  const owner    = resolveOwner(s);
                  const src      = owner?._source;
                  return (
                  <tr key={s.id}>
                    <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{s.id}</td>
                    <td>
                      <div style={{fontWeight:700,color:'#0f172a',fontSize:13}}>{s.name}</div>
                      {s.notes && <div style={{fontSize:10,color:'#f97316',marginTop:1,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.notes}>⚠ {s.notes}</div>}
                    </td>
                    <td style={{maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{s.company}</td>
                    <td style={{fontSize:11,color:'#64748b',maxWidth:170,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{owner?.name || s.owner_email || '—'}</span>
                        {src === 'partner_customer' && (
                          <span title={`Partner customer of ${owner._partner_name}`}
                            style={{flexShrink:0,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#fef3c7',color:'#92400e',letterSpacing:'.04em'}}>P</span>
                        )}
                        {src === 'partner_unmatched' && (
                          <span title={`Owned via partner email ${owner._partner_email} but no customer matched`}
                            style={{flexShrink:0,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#fef2f2',color:'#b91c1c',letterSpacing:'.04em'}}>P?</span>
                        )}
                      </div>
                      {(owner?.email || s.owner_email) && (
                        <div style={{fontSize:10,color:'#94a3b8',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{owner?.email || s.owner_email}</div>
                      )}
                    </td>
                    <td style={{fontSize:11,color:'#475569',fontFamily:'ui-monospace, Menlo, monospace',whiteSpace:'nowrap'}}>{owner?.phone || '—'}</td>
                    <td><Badge status={(s.type||'').toLowerCase()}/></td>
                    <td style={{fontSize:11,color:'#475569'}}>{s.network}</td>
                    <td style={{fontWeight:600}}>{(s.sms_count||0).toLocaleString()}</td>
                    <td><Badge status={s.status}/></td>
                    <td style={{fontSize:11,color:s.invoice_no?ORANGE:'#cbd5e1',fontWeight:s.invoice_no?600:400}}>{s.invoice_no||'—'}</td>
                    <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No sender IDs match the current filter.</div>}

          {/* Pagination bar */}
          {filtered.length > PER_PAGE && (
            <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:12,color:'#94a3b8'}}>
                {((page-1)*PER_PAGE+1).toLocaleString()}–{Math.min(page*PER_PAGE,filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}
              </span>
              <div style={{display:'flex',gap:4,alignItems:'center'}}>
                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={page===1} onClick={()=>setPage(1)}
                  style={{opacity:page===1?.4:1,minWidth:32}}>«</button>
                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={page===1} onClick={()=>setPage(p=>p-1)}
                  style={{opacity:page===1?.4:1}}>‹ Prev</button>

                {/* Page number pills */}
                {Array.from({length: totalFilteredPages}, (_,i)=>i+1)
                  .filter(p => p===1 || p===totalFilteredPages || Math.abs(p-page)<=2)
                  .reduce((acc,p,i,arr)=>{
                    if(i>0 && p-arr[i-1]>1) acc.push('…');
                    acc.push(p);
                    return acc;
                  },[])
                  .map((p,i)=> p==='…'
                    ? <span key={`gap-${i}`} style={{fontSize:12,color:'#94a3b8',padding:'0 4px'}}>…</span>
                    : <button key={p} className="senda-btn senda-btn-sm"
                        onClick={()=>setPage(p)}
                        style={{minWidth:32,background:page===p?BRAND:'#f1f5f9',color:page===p?'#fff':'#64748b',border:'none',fontWeight:page===p?700:400}}>
                        {p}
                      </button>
                  )
                }

                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={page===totalFilteredPages} onClick={()=>setPage(p=>p+1)}
                  style={{opacity:page===totalFilteredPages?.4:1}}>Next ›</button>
                <button className="senda-btn senda-btn-sm senda-btn-ghost"
                  disabled={page===totalFilteredPages} onClick={()=>setPage(totalFilteredPages)}
                  style={{opacity:page===totalFilteredPages?.4:1,minWidth:32}}>»</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Login Activity Tab ───────────────────────────────────────────────────────
// Recency filter chips for the user-last-logins table.
// Each chip maps cleanly to the documented endpoint params.
const RECENCY_FILTERS = [
  { id:'all',      label:'All',                params:{} },
  { id:'7d',       label:'Active · last 7 d',  params:{ inactive_days: 0 /* unused — handled client-side in summary */ }, summary:'active_last_7_days' },
  { id:'30d',      label:'Active · last 30 d', params:{}, summary:'active_last_30_days' },
  { id:'inactive', label:'Inactive · 30+ d',   params:{ inactive_days:30, order:'asc' }, summary:'inactive_30_days_or_more' },
  { id:'never',    label:'Never logged in',    params:{ never_logged_in:'true', order:'asc' }, summary:'never_logged_in' },
];

function LoginActivityTab() {
  const { onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  // ── View toggle: "Recency" (one row per user) vs "Events" (per-attempt audit) ──
  const [view, setView] = useState('recency');

  // ── Recency view state (driven by /users/last-logins) ────────────────────
  const [recencyRows,    setRecencyRows]    = useState([]);
  const [recencySummary, setRecencySummary] = useState({});
  const [recencyMeta,    setRecencyMeta]    = useState({});
  const [recencyLoading, setRecencyLoading] = useState(true);
  const [recencyError,   setRecencyError]   = useState(null);
  const [search,         setSearch]         = useState('');
  const [recencyChip,    setRecencyChip]    = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [roleFilter,     setRoleFilter]     = useState('all');
  const [sortField,      setSortField]      = useState('last_login_at');
  const [sortOrder,      setSortOrder]      = useState('desc');
  const [page,           setPage]           = useState(1);
  const PER = 25;

  // ── Events view state (driven by /auth/activity) ──────────────────────────
  const [evItems,    setEvItems]    = useState([]);
  const [dailyData,  setDailyData]  = useState([]);
  const [evLoading,  setEvLoading]  = useState(true);
  const [evError,    setEvError]    = useState(null);
  const [evFilter,   setEvFilter]   = useState('all');
  const [evSearch,   setEvSearch]   = useState('');

  // ── Recency fetch ────────────────────────────────────────────────────────
  const fetchRecency = useCallback(() => {
    setRecencyLoading(true); setRecencyError(null);
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(PER),
      sort: sortField,
      order: sortOrder,
    });
    if (search.trim())          qs.set('search', search.trim());
    if (statusFilter !== 'all') qs.set('status', statusFilter);
    if (roleFilter !== 'all')   qs.set('role', roleFilter);
    if (recencyChip === 'inactive') { qs.set('inactive_days', '30'); qs.set('order', 'asc'); }
    if (recencyChip === 'never')    { qs.set('never_logged_in', 'true'); qs.set('order', 'asc'); }
    if (recencyChip === '7d')       qs.set('inactive_days', '0');  // sentinel — backend-side ignored, sorts to recent first
    if (recencyChip === '30d')      qs.set('inactive_days', '0');

    adminFetch(`/users/last-logins?${qs}`, {}, onLogout)
      .then(res => {
        if (!res.success) {
          setRecencyError(res.error?.message || res.message || 'Failed to load login recency.');
          return;
        }
        let rows = res.data || [];
        // Active-7d / Active-30d are derived client-side because the docs only
        // give us `inactive_days` (i.e. >= N days). Apply them on the page.
        if (recencyChip === '7d' || recencyChip === '30d') {
          const cutoff = Date.now() - (recencyChip === '7d' ? 7 : 30) * 86400000;
          rows = rows.filter(r => r.last_login_at && new Date(r.last_login_at).getTime() >= cutoff);
        }
        setRecencyRows(rows);
        setRecencySummary(res.summary || {});
        setRecencyMeta(res.meta || {});
      })
      .catch(e => setRecencyError(e.message))
      .finally(() => setRecencyLoading(false));
  }, [onLogout, page, search, recencyChip, statusFilter, roleFilter, sortField, sortOrder]);

  useEffect(() => { fetchRecency(); }, [fetchRecency]);
  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1); }, [search, recencyChip, statusFilter, roleFilter, sortField, sortOrder]);

  // ── Events fetch (audit trail) ───────────────────────────────────────────
  const fetchEvents = useCallback(() => {
    setEvLoading(true); setEvError(null);
    Promise.all([
      adminFetch('/auth/activity', {}, onLogout),
      adminFetch('/auth/activity/daily?days=7', {}, onLogout),
    ]).then(([actRes, dailyRes]) => {
      if (actRes.success) setEvItems(actRes.data || []);
      else setEvError(actRes.error?.message || 'Failed to load activity.');
      if (dailyRes.success) setDailyData(dailyRes.data || []);
    }).catch(e => setEvError(e.message))
      .finally(() => setEvLoading(false));
  }, [onLogout]);

  useEffect(() => { if (view === 'events') fetchEvents(); }, [view, fetchEvents]);

  // ── CSV export of the current recency page ───────────────────────────────
  const handleDownloadCsv = () => {
    if (recencyRows.length === 0) return;
    const headers = ['User ID','Name','Email','Role','Status','Last Login (ISO)','Last Login (relative)','Has Ever Logged In','Joined'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    recencyRows.forEach(u => {
      lines.push([
        u.id || '',
        u.name || '',
        u.email || '',
        u.role || '',
        u.status || '',
        u.last_login_at || '',
        u.last_login_relative || '',
        u.has_ever_logged_in ? 'yes' : 'no',
        u.joined_at || '',
      ].map(escape).join(','));
    });
    const tag = recencyChip === 'all' ? 'all' : recencyChip.replace(/[^a-z0-9-]/gi, '');
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-last-logins-${tag}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Filtered events list (client-side text/status filters) ───────────────
  const evFiltered = evItems.filter(l => {
    const m = evFilter === 'all' || l.status === evFilter;
    const q = evSearch.toLowerCase();
    return m && (!q || (l.user||'').toLowerCase().includes(q) || (l.ip||'').includes(q) || (l.location||'').toLowerCase().includes(q));
  });
  const evSuccessRate = evItems.length > 0
    ? ((evItems.filter(l=>l.status==='success').length / evItems.length)*100).toFixed(1)
    : '—';

  // ── Pagination derived from server meta ───────────────────────────────────
  const totalPages = recencyMeta.total_pages || 1;
  const safePage   = Math.min(page, totalPages);
  const total      = recencyMeta.total || 0;

  const pageBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} className="senda-btn senda-btn-sm senda-btn-ghost"
      style={{opacity: disabled ? .4 : 1, minWidth:32}}>
      {label}
    </button>
  );

  // Color a "never logged in" row red when account is older than 7 days (per docs tip #4).
  const isStaleNeverLogin = (u) =>
    !u.has_ever_logged_in && u.joined_at && (Date.now() - new Date(u.joined_at).getTime()) > 7*86400000;

  return (
    <div className="senda-fade-in">
      {/* ── KPI strip — driven entirely by /users/last-logins `summary` ─── */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${isMobile?140:180}px,1fr))`,gap:12,marginBottom:18}}>
        {[
          { label:'Total Users',         value: recencySummary.total_users,             color: BRAND  },
          { label:'Ever Logged In',      value: recencySummary.ever_logged_in,          color: GREEN  },
          { label:'Never Logged In',     value: recencySummary.never_logged_in,         color: RED    },
          { label:'Active · Last 7 d',   value: recencySummary.active_last_7_days,      color: GREEN  },
          { label:'Active · Last 30 d',  value: recencySummary.active_last_30_days,     color: CYAN   },
          { label:'Inactive · 30+ d',    value: recencySummary.inactive_30_days_or_more,color: ORANGE },
        ].map(k => (
          <div key={k.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${k.color}`}}>
            <div style={{fontSize:22,fontWeight:800,color:'#0f172a',letterSpacing:'-.4px',lineHeight:1}}>
              {k.value != null ? Number(k.value).toLocaleString() : '—'}
            </div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:5}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── View switcher ────────────────────────────────────────────────── */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginRight:4}}>View</span>
        {[
          { id:'recency', label:'User Recency',  desc:'one row per user' },
          { id:'events',  label:'Login Events',  desc:'audit trail' },
        ].map(v => {
          const isActive = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)} className="senda-btn senda-btn-sm"
              style={{background: isActive ? BRAND : '#f1f5f9', color: isActive ? '#fff' : '#64748b', border:'none'}}
              title={v.desc}>
              {v.label}
            </button>
          );
        })}
        {view === 'recency' && (
          <button onClick={handleDownloadCsv} disabled={recencyRows.length === 0}
            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',marginLeft:'auto',
              background: recencyRows.length === 0 ? '#f1f5f9' : BRAND, color: recencyRows.length === 0 ? '#94a3b8' : '#fff',
              border:'none',borderRadius:7,fontSize:11,fontWeight:700,cursor: recencyRows.length === 0 ? 'not-allowed' : 'pointer'}}>
            <Download size={13} strokeWidth={2.4}/>
            Download CSV ({recencyRows.length})
          </button>
        )}
      </div>

      {view === 'recency' ? (
        <>
          {/* Recency chips — match summary semantics so the active chip's number
              and the table content are always in agreement. */}
          <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginRight:4}}>Recency</span>
            {RECENCY_FILTERS.map(f => {
              const isActive = recencyChip === f.id;
              const count    = f.summary ? recencySummary[f.summary] : recencySummary.total_users;
              return (
                <button key={f.id} onClick={() => setRecencyChip(f.id)} className="senda-btn senda-btn-sm"
                  style={{background: isActive ? BRAND : '#f1f5f9', color: isActive ? '#fff' : '#64748b', border:'none'}}>
                  {f.label}{count != null && <span style={{marginLeft:5,fontSize:10,fontWeight:700,
                    background: isActive ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                    color: isActive ? '#fff' : '#94a3b8',
                    padding:'1px 6px',borderRadius:99}}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Search + status + role + sort */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <input className="senda-input" placeholder="Search email or name…"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:isMobile?'100%':240,height:34,fontSize:12}}/>
            <select className="senda-input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              style={{height:34,fontSize:12}}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select className="senda-input" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
              style={{height:34,fontSize:12}}>
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select className="senda-input" value={sortField} onChange={e=>setSortField(e.target.value)}
              style={{height:34,fontSize:12}}>
              <option value="last_login_at">Sort: Last Login</option>
              <option value="created_at">Sort: Joined</option>
              <option value="email">Sort: Email</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="senda-btn senda-btn-sm senda-btn-ghost"
              title="Toggle sort order">
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
            <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>{total} matching</span>
            <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchRecency}
              style={{fontSize:12}}>↻ Refresh</button>
          </div>

          {/* Recency table */}
          {recencyLoading ? <LoadingState/> : recencyError ? <ErrorState message={recencyError} onRetry={fetchRecency}/> : (
            <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table className="senda-table" style={{minWidth:780}}>
                  <thead>
                    <tr>
                      <th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th>
                      <th>Last Login</th><th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recencyRows.map(u => {
                      const stale = isStaleNeverLogin(u);
                      return (
                        <tr key={u.id} style={stale ? {background:'#fef2f2'} : undefined}
                          title={u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Has never logged in'}>
                          <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{u.id}</td>
                          <td style={{fontSize:12,fontWeight:600,color:'#0f172a',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name || '—'}</td>
                          <td style={{fontSize:11,color:'#64748b',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</td>
                          <td><Badge status={u.role}/></td>
                          <td><Badge status={u.status}/></td>
                          <td style={{fontSize:11,color: u.has_ever_logged_in ? '#475569' : RED, fontWeight: u.has_ever_logged_in ? 500 : 700, whiteSpace:'nowrap'}}>
                            {u.last_login_relative || (u.has_ever_logged_in ? '—' : 'never')}
                          </td>
                          <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {recencyRows.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No users match this filter.</div>}

              {/* Server-driven pagination */}
              {totalPages > 1 && (
                <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <span style={{fontSize:12,color:'#94a3b8'}}>
                    Page {safePage} of {totalPages} · {total.toLocaleString()} users
                  </span>
                  <div style={{display:'flex',gap:4}}>
                    {pageBtn('«',      () => setPage(1),                              safePage === 1)}
                    {pageBtn('‹ Prev', () => setPage(p => Math.max(1, p - 1)),        safePage === 1)}
                    {pageBtn('Next ›', () => setPage(p => Math.min(totalPages, p+1)), safePage === totalPages)}
                    {pageBtn('»',      () => setPage(totalPages),                     safePage === totalPages)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Events view (audit trail from /auth/activity) ─────────────── */}
          <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'2fr 1fr',gap:16,marginBottom:18}}>
            <div className="senda-card" style={{padding:20}}>
              <SectionHeader title="Login Activity (Last 7 Days)" subtitle="Successful vs failed login attempts"/>
              <div style={{height:150}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{top:4,right:8,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10}}/>
                    <Bar dataKey="success" name="Success" fill={GREEN} radius={[4,4,0,0]} barSize={14} isAnimationActive={false}/>
                    <Bar dataKey="failed"  name="Failed"  fill={RED}   radius={[4,4,0,0]} barSize={14} isAnimationActive={false}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="senda-card" style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
              <SectionHeader title="Auth Health" subtitle="From login event log"/>
              {[
                {l:'Total Attempts', v:evItems.length,                                       c:BRAND},
                {l:'Successful',     v:evItems.filter(l=>l.status==='success').length,      c:GREEN},
                {l:'Failed',         v:evItems.filter(l=>l.status==='failed').length,       c:RED},
                {l:'Success Rate',   v:`${evSuccessRate}%`,                                 c:Number(evSuccessRate)>90?GREEN:AMBER},
              ].map(x=>(
                <div key={x.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                  <span style={{fontSize:12,color:'#64748b'}}>{x.l}</span>
                  <span style={{fontSize:14,fontWeight:700,color:x.c}}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <input className="senda-input" placeholder="Search user, IP, location..." value={evSearch}
              onChange={e=>setEvSearch(e.target.value)}
              style={{width:bp==='mobile'?'100%':260,height:38,fontSize:13}}/>
            <div style={{display:'flex',gap:4}}>
              {['all','success','failed'].map(f=>(
                <button key={f} className="senda-btn senda-btn-sm" onClick={()=>setEvFilter(f)}
                  style={{background:evFilter===f?BRAND:'#f1f5f9',color:evFilter===f?'#fff':'#64748b',border:'none'}}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{evFiltered.length} events</span>
            <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchEvents} style={{fontSize:12}}>↻ Refresh</button>
          </div>

          {evLoading ? <LoadingState/> : evError ? <ErrorState message={evError} onRetry={fetchEvents}/> : (
            <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table className="senda-table" style={{minWidth:680}}>
                  <thead>
                    <tr><th>Log ID</th><th>User</th><th>IP Address</th><th>Device</th><th>Location</th><th>Role</th><th>Status</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {evFiltered.map(l=>(
                      <tr key={l.id}>
                        <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{l.id}</td>
                        <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{l.user_email||l.user}</td>
                        <td style={{fontFamily:'monospace',fontSize:12,color:'#475569'}}>{l.ip}</td>
                        <td style={{fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.device}</td>
                        <td style={{fontSize:12}}>{l.location}</td>
                        <td><Badge status={l.role}/></td>
                        <td><Badge status={l.status}/></td>
                        <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{l.time ? new Date(l.time).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {evFiltered.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No activity records found.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Packages Analytics Tab (SMS + WhatsApp + Custom) ────────────────────────
const WA_GREEN = '#25D366';

function PackagesTab() {
  const { onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [smsPkgs,    setSmsPkgs]    = useState([]);
  const [waPkgs,     setWaPkgs]     = useState([]);
  const [smsAnl,     setSmsAnl]     = useState({});
  const [waAnl,      setWaAnl]      = useState({});
  const [senderFee,    setSenderFee]    = useState(null);
  const [senderList,   setSenderList]   = useState([]);
  const [senderSummary,setSenderSummary]= useState({});
  const [allTx,        setAllTx]        = useState([]);
  const [selectedPkg,  setSelectedPkg]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [section,    setSection]    = useState('sms');

  const fetchAll = useCallback(() => {
    setLoading(true); setError(null);
    // Helper: rescue a fetch that throws (404/network) so it doesn't reject Promise.all.
    const optional = (p) => p.catch(() => ({ success:false, __optional:true }));

    Promise.all([
      // Critical: failure here triggers the warning banner.
      adminFetch('/packages',                              {}, onLogout),
      adminFetch('/packages/analytics',                    {}, onLogout),
      adminFetch('/packages?type=whatsapp',                {}, onLogout),
      adminFetch('/packages/analytics?type=whatsapp',      {}, onLogout),
      // /custom-sms-purchases endpoints removed — they 404 on this backend.
      // Custom-deal stats are derived from /transactions where source === 'custom_sms_purchase'.
      // Sender data also lives inside /transactions filtered by source === 'senderid_request_payment'.
      optional(adminFetch('/api/messaging/sender-requests/fee/', {}, onLogout)),
      optional(adminFetch('/transactions?limit=500&page=1',      {}, onLogout)),
    ]).then(([sr, sa, wr, wa, fee, tx]) => {
      if (sr.success) setSmsPkgs(sr.data || []);
      if (sa.success) setSmsAnl(sa.data || {});
      if (wr.success) setWaPkgs(wr.data || []);
      if (wa.success) setWaAnl(wa.data || {});
      if (fee?.success) {
        setSenderFee({
          amount:   fee.amount   ?? fee.data?.amount   ?? null,
          currency: fee.currency || fee.data?.currency || 'TZS',
        });
      }
      if (tx?.success) {
        setAllTx(tx.data || []);
        const senderRows = (tx.data || []).filter(t => t.source === 'senderid_request_payment');
        const completed  = senderRows.filter(t => (t.status||'').toLowerCase() === 'completed');
        const pending    = senderRows.filter(t => (t.status||'').toLowerCase() === 'pending');
        const failed     = senderRows.filter(t => (t.status||'').toLowerCase() === 'failed');
        setSenderList(senderRows);
        setSenderSummary({
          total_count:     senderRows.length,
          completed_count: completed.length,
          pending_count:   pending.length,
          failed_count:    failed.length,
          total_revenue:   completed.reduce((s,t) => s + Number(t.amount || 0), 0),
        });
      }
      // Banner only fires when the package *lists* themselves can't load.
      // Analytics endpoints have client-side fallbacks (totals derived from the lists).
      const criticalFailed = !sr?.success && !wr?.success;
      if (criticalFailed) setError('Some data could not be loaded — showing available data.');
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const smsRev    = smsAnl.total_revenue    ?? smsPkgs.reduce((s,p)=>s+(p.total_revenue||0),0);
  const waRev     = waAnl.total_revenue     ?? waPkgs.reduce((s,p)=>s+(p.total_revenue||0),0);

  // Custom deals are derived from /transactions where source === 'custom_sms_purchase'
  // (or package === "Bulk/Custom") — the dedicated /custom-sms-purchases endpoints 404.
  const customFromTx = (allTx || []).filter(t =>
    (t.source||'') === 'custom_sms_purchase' ||
    (t.package||'').trim().toLowerCase() === 'bulk/custom'
  );
  const effectiveCustomList = customFromTx;

  const customAmt = (p) => Number(p.amount) || parseNumberLoose(p.total_price) || 0;
  const customStatusOk = (p) => ['completed','success.'].includes((p.status||'').toLowerCase());

  const custRev = effectiveCustomList.filter(customStatusOk).reduce((s,p) => s + customAmt(p), 0);
  // Sender-ID registration only counts completed payments toward revenue.
  const senderRev = senderSummary.total_revenue
    ?? senderList.filter(p => (p.status||'').toLowerCase() === 'completed')
                 .reduce((s,p) => s + (Number(p.amount) || 0), 0);
  const totalRev  = smsRev + waRev + custRev + senderRev;

  const smsBuyers     = smsAnl.total_buyers   ?? smsPkgs.reduce((s,p)=>s+(p.purchase_count||0),0);
  const waBuyers      = waAnl.total_buyers    ?? waPkgs.reduce((s,p)=>s+(p.purchase_count||0),0);
  const custBuyers    = effectiveCustomList.length;
  const custCompleted = effectiveCustomList.filter(customStatusOk).length;
  const custPending   = effectiveCustomList.filter(p => (p.status||'').toLowerCase() === 'pending').length;
  const custFailed    = effectiveCustomList.filter(p => (p.status||'').toLowerCase() === 'failed').length;
  const senderTotal   = senderSummary.total_count     ?? senderList.length;
  const senderDone    = senderSummary.completed_count ?? senderList.filter(p => (p.status||'').toLowerCase() === 'completed').length;
  const senderPending = senderSummary.pending_count   ?? senderList.filter(p => (p.status||'').toLowerCase() === 'pending').length;
  const totalBuyers   = smsBuyers + waBuyers + custBuyers + senderDone;

  const custAvg = custBuyers > 0 ? custRev / custBuyers : 0;
  const custMax = Math.max(0, ...effectiveCustomList.map(customAmt));

  // ── Chart data ────────────────────────────────────────────────────────────
  const revMix = [
    { name:'SMS',       value: Math.round(smsRev),    color: BRAND     },
    { name:'WhatsApp',  value: Math.round(waRev),     color: WA_GREEN  },
    { name:'Custom',    value: Math.round(custRev),   color: VIOLET    },
    { name:'Sender ID', value: Math.round(senderRev), color: CYAN      },
  ].filter(d => d.value > 0);

  // Group /transactions by package name → unique buyers + completed revenue.
  // Source of truth for the "Buyers per Package" chart since /packages itself
  // returns stale purchase_count / total_revenue on this backend.
  const txStatsByPackage = (() => {
    const map = new Map();
    (allTx || []).forEach(t => {
      const key = (t.package || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, { buyers: new Set(), revenue: 0, total: 0, completed: 0 });
      const entry = map.get(key);
      entry.total += 1;
      const buyer = t.user_id || t.user_email;
      if (buyer) entry.buyers.add(buyer);
      if (['completed','success.'].includes((t.status||'').toLowerCase())) {
        entry.completed += 1;
        entry.revenue += Number(t.amount || 0);
      }
    });
    return map;
  })();

  // Per-package metrics for the chart:
  //  - Purchases = total transactions for that package (volume signal)
  //  - Buyers    = unique users who bought (depth signal)
  //  - Revenue   = completed-only TZS, shown in thousands on the right axis
  const buyerChartFor = (p) => {
    const stats = txStatsByPackage.get((p.name || '').trim().toLowerCase());
    const purchases = stats ? stats.total       : (p.purchase_count || 0);
    const buyers    = stats ? stats.buyers.size : (p.purchase_count || 0);
    const revenue   = stats ? stats.revenue     : (p.total_revenue   || 0);
    return {
      name: p.name,
      Purchases: purchases,
      Buyers: buyers,
      Revenue: Math.round(revenue / 1000),
    };
  };

  const smsBuyerChart = smsPkgs.map(buyerChartFor);
  const waBuyerChart  = waPkgs.map(buyerChartFor);

  // Aggregate totals across every SMS + WhatsApp package shown in the chart.
  // Unique buyers must dedupe across packages (one user may buy several plans).
  const allChartRows = [...smsBuyerChart, ...waBuyerChart];
  const totalPurchases = allChartRows.reduce((s, d) => s + (d.Purchases || 0), 0);
  const totalChartRev  = allChartRows.reduce((s, d) => s + (d.Revenue || 0), 0) * 1000;
  const totalUniqueBuyers = (() => {
    const ids = new Set();
    [...smsPkgs, ...waPkgs].forEach(p => {
      const stats = txStatsByPackage.get((p.name || '').trim().toLowerCase());
      if (stats) stats.buyers.forEach(id => ids.add(id));
    });
    return ids.size;
  })();
  const activePackages = allChartRows.filter(d => (d.Purchases || 0) > 0).length;

  const PKG_COLORS = [BRAND, GREEN, AMBER, VIOLET, CYAN, ORANGE, PINK];

  // ── Package card renderer ─────────────────────────────────────────────────
  const PkgCard = ({ p, accent, onClick, isOpen = false }) => (
    <div
      className="senda-card"
      onClick={onClick}
      title={onClick ? (isOpen ? 'Click to collapse details' : 'Click to see purchases for this package') : undefined}
      style={{
        padding: 18,
        borderTop: `3px solid ${accent}`,
        position: 'relative',
        opacity: p.active === false ? 0.55 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .12s, box-shadow .12s, outline-color .12s',
        outline: isOpen ? `2px solid ${accent}` : '2px solid transparent',
        outlineOffset: isOpen ? 1 : 0,
        boxShadow: isOpen ? `0 8px 28px ${accent}26` : undefined,
      }}
      onMouseEnter={onClick && !isOpen ? (e)=>{ e.currentTarget.style.boxShadow='0 6px 20px rgba(15,23,42,.10)'; e.currentTarget.style.transform='translateY(-1px)'; } : undefined}
      onMouseLeave={onClick && !isOpen ? (e)=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform=''; } : undefined}
    >
      {p.popular && (
        <div style={{position:'absolute',top:12,right:12,background:accent,color:'#fff',
          fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,letterSpacing:'.08em'}}>
          POPULAR
        </div>
      )}
      {p.active === false && (
        <div style={{position:'absolute',top:12,right:p.popular?80:12,background:'#f1f5f9',color:'#94a3b8',
          fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,letterSpacing:'.08em'}}>
          INACTIVE
        </div>
      )}
      <div style={{fontSize:10,fontWeight:700,color:'#cbd5e1',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:3}}>{p.id}</div>
      <div style={{fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:2}}>{p.name}</div>
      <div style={{fontSize:12,color:'#64748b',marginBottom:14,minHeight:18}}>{p.desc || ''}</div>

      {/* Core metrics row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
        {[
          { label:'Credits',  value:(p.credits||0).toLocaleString(), color: accent },
          { label:'Price TZS', value: compactNumber(p.price||0), color:'#0f172a' },
          { label:'TZS/unit',  value:p.per_sms ?? p.per_conversation ?? '—', color: GREEN },
        ].map(m=>(
          <div key={m.label} style={{background:'#f8fafc',borderRadius:8,padding:'8px 10px'}}>
            <div style={{fontSize:15,fontWeight:800,color:m.color}}>{m.value}</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:1}}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Purchase analytics */}
      {(p.purchase_count != null || p.total_revenue != null) && (
        <div style={{borderTop:'1px solid #f1f5f9',paddingTop:12,display:'flex',gap:16}}>
          {p.purchase_count != null && (
            <div>
              <div style={{fontSize:16,fontWeight:800,color:BRAND}}>{(p.purchase_count||0).toLocaleString()}</div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Buyers</div>
            </div>
          )}
          {p.total_revenue != null && (
            <div>
              <div style={{fontSize:16,fontWeight:800,color:GREEN}}>{compactNumber(p.total_revenue)} TZS</div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Revenue</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Sections ──────────────────────────────────────────────────────────────
  const sections = [
    { id:'sms',      label:'SMS Packages',          count: smsPkgs.length             },
    { id:'whatsapp', label:'WhatsApp Packages',     count: waPkgs.length              },
    { id:'custom',   label:'Custom Deals',          count: effectiveCustomList.length },
    { id:'senderid', label:'Sender ID Reg',         count: senderTotal                },
  ];

  if (loading) return <LoadingState label="Loading package analytics..."/>;

  return (
    <div className="senda-fade-in">
      {error && (
        <div style={{padding:'10px 14px',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:10,marginBottom:16,fontSize:13,color:'#92400e'}}>
          {error}
        </div>
      )}

      {/* ── Cross-channel KPI strip ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14}}>
        {[
          { label:'Total Revenue',    value: compactNumber(totalRev)  + ' TZS',  accent: BRAND   },
          { label:'SMS Revenue',      value: compactNumber(smsRev)    + ' TZS',  accent: BRAND   },
          { label:'WhatsApp Revenue', value: compactNumber(waRev)     + ' TZS',  accent: WA_GREEN},
          { label:'Custom Revenue',   value: compactNumber(custRev)   + ' TZS',  accent: VIOLET  },
          { label:'Sender ID Revenue',value: compactNumber(senderRev) + ' TZS',  accent: CYAN    },
          { label:'Total Buyers',     value: totalBuyers.toLocaleString(),        accent: AMBER   },
          { label:'Custom Buyers',    value: custBuyers.toLocaleString(),         accent: ORANGE  },
          { label:'Sender ID Reqs',   value: `${senderDone} / ${senderTotal}`,    accent: CYAN    },
          {
            label:'Sender ID Fee',
            value: senderFee && senderFee.amount != null
              ? `${Number(senderFee.amount).toLocaleString()} ${senderFee.currency}`
              : '—',
            accent: CYAN,
          },
        ].map(k => (
          <div key={k.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${k.accent}`}}>
            <div style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{k.value}</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:3}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sender ID Fee callout ── */}
      <div className="senda-card" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap',
        padding:'14px 18px', marginBottom:20,
        borderLeft:`3px solid ${CYAN}`,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0}}>
          <div style={{width:42,height:42,borderRadius:11,background:`${CYAN}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Tag size={20} strokeWidth={2.2} color={CYAN}/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:'#0f172a',letterSpacing:'.01em'}}>Sender ID Registration Fee</div>
            <div style={{fontSize:11,color:'#64748b',marginTop:2,lineHeight:1.4}}>
              One-time charge per sender-name approval request. Source: <code style={{fontSize:10,color:'#475569'}}>/api/messaging/sender-requests/fee/</code>
            </div>
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          {senderFee && senderFee.amount != null ? (
            <>
              <div style={{fontSize:22,fontWeight:800,color:CYAN,lineHeight:1,letterSpacing:'-.5px'}}>
                {Number(senderFee.amount).toLocaleString()} <span style={{fontSize:13,fontWeight:700,color:'#64748b'}}>{senderFee.currency}</span>
              </div>
              <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>per request</div>
            </>
          ) : (
            <div style={{fontSize:12,color:'#94a3b8'}}>Fee unavailable</div>
          )}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 2fr',gap:16,marginBottom:20}}>
        {/* Revenue channel mix donut */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader title="Revenue by Channel" subtitle="SMS · WhatsApp · Custom"/>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revMix} cx="50%" cy="50%" innerRadius="52%" outerRadius="80%"
                  paddingAngle={4} dataKey="value" nameKey="name">
                  {revMix.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip formatter={v=>`${compactNumber(v)} TZS`}
                  contentStyle={{borderRadius:10,border:'none',background:'#1e293b',color:'#f1f5f9'}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'flex',justifyContent:'space-around',marginTop:4}}>
            {revMix.map(d=>(
              <div key={d.name} style={{textAlign:'center'}}>
                <div style={{fontSize:12,fontWeight:800,color:d.color}}>{totalRev>0?((d.value/totalRev)*100).toFixed(1):0}%</div>
                <div style={{fontSize:9,color:'#94a3b8'}}>{d.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-package activity (SMS + WA combined) */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader
            title="Activity per Package"
            subtitle={`${activePackages} active package${activePackages!==1?'s':''} · ${totalPurchases.toLocaleString()} total purchases`}
          />

          {/* ─ Aggregate totals across all packages ─ */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',
            gap:8, marginBottom:14,
          }}>
            {[
              { label:'Purchases', value: totalPurchases.toLocaleString(),       color: BRAND  },
              { label:'Buyers',    value: totalUniqueBuyers.toLocaleString(),    color: VIOLET },
              { label:'Revenue',   value: `${compactNumber(totalChartRev)} TZS`, color: GREEN  },
              { label:'Packages',  value: `${activePackages} / ${allChartRows.length}`, color: AMBER  },
            ].map(s => (
              <div key={s.label} style={{
                padding:'8px 12px', borderRadius:8,
                background:`${s.color}10`, borderLeft:`3px solid ${s.color}`,
              }}>
                <div style={{fontSize:15, fontWeight:800, color:s.color, lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...smsBuyerChart.map(d=>({...d,type:'SMS'})), ...waBuyerChart.map(d=>({...d,type:'WA'}))]}
                margin={{top:6,right:10,left:0,bottom:0}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left"  allowDecimals={false} tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={32}/>
                <YAxis yAxisId="right" orientation="right" tickFormatter={v=>`${v}K`} tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar yAxisId="left"  dataKey="Purchases" name="Purchases"   fill={BRAND}        radius={[4,4,0,0]} barSize={11} isAnimationActive={false}/>
                <Bar yAxisId="left"  dataKey="Buyers"    name="Unique buyers" fill={VIOLET}      radius={[4,4,0,0]} barSize={11} isAnimationActive={false}/>
                <Bar yAxisId="right" dataKey="Revenue"   name="Revenue (K TZS)" fill={`${GREEN}AA`} radius={[4,4,0,0]} barSize={11} isAnimationActive={false}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section switcher ── */}
      <div className="tab-wrapper" style={{marginBottom:20}}>
        {sections.map(s=>(
          <button key={s.id} className={`tab-btn${section===s.id?' active':''}`} onClick={()=>{ setSection(s.id); }}>
            {s.label}
            <span style={{marginLeft:6,fontSize:11,background:section===s.id?`${BRAND}18`:'#f1f5f9',
              color:section===s.id?BRAND:'#94a3b8',padding:'1px 6px',borderRadius:99,fontWeight:700}}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── SMS Packages ── */}
      {section === 'sms' && (
        smsPkgs.length === 0
          ? <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No SMS packages found.</div>
          : <ExpandableGrid
              items={smsPkgs}
              getId={(p) => p.id}
              selectedId={selectedPkg?._channel === 'sms' ? selectedPkg.id : null}
              renderItem={(p, i) => (
                <PkgCard
                  key={p.id}
                  p={p}
                  accent={PKG_COLORS[i % PKG_COLORS.length]}
                  isOpen={selectedPkg?.id === p.id}
                  onClick={() => setSelectedPkg(curr => curr?.id === p.id ? null : { ...p, _channel:'sms' })}
                />
              )}
              renderDetail={() => {
                const idx = smsPkgs.findIndex(p => p.id === selectedPkg.id);
                return (
                  <PackageDetailPanel
                    pkg={selectedPkg}
                    transactions={allTx}
                    accent={PKG_COLORS[(idx < 0 ? 0 : idx) % PKG_COLORS.length]}
                    onClose={() => setSelectedPkg(null)}
                  />
                );
              }}
            />
      )}

      {/* ── WhatsApp Packages ── */}
      {section === 'whatsapp' && (
        waPkgs.length === 0
          ? <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No WhatsApp packages found.</div>
          : <ExpandableGrid
              items={waPkgs}
              getId={(p) => p.id}
              selectedId={selectedPkg?._channel === 'whatsapp' ? selectedPkg.id : null}
              renderItem={(p) => (
                <PkgCard
                  key={p.id}
                  p={p}
                  accent={WA_GREEN}
                  isOpen={selectedPkg?.id === p.id}
                  onClick={() => setSelectedPkg(curr => curr?.id === p.id ? null : { ...p, _channel:'whatsapp' })}
                />
              )}
              renderDetail={() => (
                <PackageDetailPanel
                  pkg={selectedPkg}
                  transactions={allTx}
                  accent={WA_GREEN}
                  onClose={() => setSelectedPkg(null)}
                />
              )}
            />
      )}

      {/* ── Custom Deals ── */}
      {section === 'custom' && (
        <div>
          {/* Custom KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:20}}>
            {[
              { label:'Custom Purchases',  value: custBuyers.toLocaleString(),                accent: VIOLET  },
              { label:'Completed',         value: custCompleted.toLocaleString(),             accent: GREEN   },
              { label:'Pending',           value: custPending.toLocaleString(),               accent: AMBER   },
              { label:'Failed',            value: custFailed.toLocaleString(),                accent: RED     },
              { label:'Total Revenue',     value: compactNumber(custRev) + ' TZS',            accent: GREEN   },
              { label:'Avg Deal Size',     value: compactNumber(custAvg) + ' TZS',            accent: BRAND   },
              { label:'Largest Deal',      value: compactNumber(custMax) + ' TZS',            accent: ORANGE  },
            ].map(k=>(
              <div key={k.label} className="senda-card" style={{padding:'16px 18px',borderTop:`3px solid ${k.accent}`}}>
                <div style={{fontSize:22,fontWeight:800,color:'#0f172a',letterSpacing:'-.5px'}}>{k.value}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Custom purchases table */}
          {effectiveCustomList.length === 0
            ? <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No custom purchase records found.</div>
            : (
              <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
                <div style={{overflowX:'auto'}}>
                  <table className="senda-table" style={{minWidth:780}}>
                    <thead>
                      <tr>
                        <th>ID</th><th>Customer</th><th>Credits</th>
                        <th>Amount (TZS)</th><th>Cost/Unit</th>
                        <th>Method</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectiveCustomList.map(c=>{
                        const amt = customAmt(c);
                        const credits = c.credits || c.sms_credits || 0;
                        const perUnit = c.per_sms ?? c.cost_per_unit ?? (credits ? (amt / credits).toFixed(2) : '—');
                        return (
                          <tr key={c.id}>
                            <td style={{fontWeight:600,color:VIOLET,fontSize:12}}>{c.id}</td>
                            <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{c.user_email||c.customer||'—'}</td>
                            <td style={{fontWeight:600}}>{Number(credits).toLocaleString()}</td>
                            <td style={{fontWeight:700, color: customStatusOk(c) ? GREEN : '#0f172a'}}>{Number(amt).toLocaleString()}</td>
                            <td style={{fontSize:12,color:'#475569'}}>{perUnit}</td>
                            <td><span style={{fontSize:11,background:'#f1f5f9',padding:'2px 8px',borderRadius:6}}>{c.method || '—'}</span></td>
                            <td><Badge status={c.status}/></td>
                            <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : (c.date || '—')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',fontSize:12,color:'#94a3b8'}}>
                  {effectiveCustomList.length} custom deal{effectiveCustomList.length!==1?'s':''} · {custCompleted} completed · {custPending} pending · {custFailed} failed · Revenue {compactNumber(custRev)} TZS
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── Sender ID Registration ── */}
      {section === 'senderid' && (
        <div>
          {/* Sender-reg KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:20}}>
            {[
              { label:'Total Requests',    value: senderTotal.toLocaleString(),                  accent: BRAND  },
              { label:'Completed',         value: senderDone.toLocaleString(),                   accent: GREEN  },
              { label:'Pending',           value: senderPending.toLocaleString(),                accent: AMBER  },
              { label:'Failed',            value: (senderSummary.failed_count ?? 0).toLocaleString(), accent: RED },
              { label:'Revenue (TZS)',     value: compactNumber(senderRev),                      accent: CYAN   },
              { label:'Current Fee',       value: senderFee?.amount != null ? `${Number(senderFee.amount).toLocaleString()} ${senderFee.currency||'TZS'}` : '—', accent: CYAN   },
            ].map(k=>(
              <div key={k.label} className="senda-card" style={{padding:'16px 18px',borderTop:`3px solid ${k.accent}`}}>
                <div style={{fontSize:22,fontWeight:800,color:'#0f172a',letterSpacing:'-.5px'}}>{k.value}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Sender-reg payments table */}
          {senderList.length === 0 ? (
            <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No sender ID registration payments found.</div>
          ) : (
            <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table className="senda-table" style={{minWidth:780}}>
                  <thead>
                    <tr>
                      <th>ID</th><th>User</th><th>Package</th>
                      <th>Amount (TZS)</th><th>Method</th>
                      <th>Reference</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {senderList.map(p=>(
                      <tr key={p.id}>
                        <td style={{fontWeight:600,color:CYAN,fontSize:12}}>{p.id}</td>
                        <td style={{fontSize:12,color:'#475569',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.user_email || p.user_id}</td>
                        <td style={{fontSize:12}}>{p.package || 'Sender ID Reg'}</td>
                        <td style={{fontWeight:700,color: (p.status||'').toLowerCase()==='completed' ? GREEN : '#0f172a'}}>{Number(p.amount||0).toLocaleString()}</td>
                        <td><span style={{fontSize:11,background:'#f1f5f9',padding:'2px 8px',borderRadius:6}}>{p.method || '—'}</span></td>
                        <td style={{fontSize:11,color:'#64748b',fontFamily:'ui-monospace,Menlo,monospace',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.ref || '—'}</td>
                        <td><Badge status={p.status}/></td>
                        <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{p.date || (p.created_at ? new Date(p.created_at).toLocaleDateString() : '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',fontSize:12,color:'#94a3b8'}}>
                {senderList.length} request{senderList.length!==1?'s':''} · {senderDone} completed · {senderPending} pending · Revenue {compactNumber(senderRev)} TZS
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Row-aware expandable grid ────────────────────────────────────────────────
// CSS-grid with auto-fill; when one item is selected, drops a full-width detail
// row IMMEDIATELY after the row containing that item (not at the end of the grid).
// Tracks the live column count via ResizeObserver so the insertion point follows
// the layout as the viewport changes.
function ExpandableGrid({ items, selectedId, renderItem, renderDetail, getId, minColPx = 260, gap = 14 }) {
  const ref = useRef(null);
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const tracks = getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length;
      setCols(Math.max(1, tracks));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const selectedIdx = selectedId ? items.findIndex(it => getId(it) === selectedId) : -1;
  const rowOf       = selectedIdx >= 0 ? Math.floor(selectedIdx / cols) : -1;
  const insertAfter = rowOf >= 0 ? Math.min((rowOf + 1) * cols - 1, items.length - 1) : -1;

  return (
    <div
      ref={ref}
      style={{
        display:'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColPx}px, 1fr))`,
        gap,
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={getId(it)}>
          {renderItem(it, i)}
          {i === insertAfter && (
            <div style={{gridColumn: '1 / -1'}}>{renderDetail()}</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Inline package detail panel ──────────────────────────────────────────────
// Drops down below the package grid for the clicked card. Filters /transactions
// where t.package === pkg.name (case-insensitive). Animated, color-matched,
// click-the-card-again to collapse, or the inline Close button.
function PackageDetailPanel({ pkg, transactions, accent, onClose }) {
  const target = (pkg.name || '').trim().toLowerCase();
  const rows = (transactions || []).filter(t => (t.package || '').trim().toLowerCase() === target);

  const completed = rows.filter(t => ['completed','success.'].includes((t.status||'').toLowerCase()));
  const pending   = rows.filter(t => (t.status||'').toLowerCase() === 'pending');
  const failed    = rows.filter(t => (t.status||'').toLowerCase() === 'failed');
  const revenue   = completed.reduce((s,t) => s + Number(t.amount || 0), 0);
  const credits   = completed.reduce((s,t) => s + Number(t.credits || 0), 0);
  const buyers    = new Set(rows.map(t => t.user_id || t.user_email).filter(Boolean)).size;

  const KPI = ({ label, value, color = '#0f172a' }) => (
    <div style={{padding:'10px 12px', background:'#fff', borderRadius:8, borderLeft:`3px solid ${color}`, boxShadow:'0 1px 2px rgba(15,23,42,.04)'}}>
      <div style={{fontSize:18, fontWeight:800, color}}>{value}</div>
      <div style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginTop:3}}>{label}</div>
    </div>
  );

  return (
    <div
      style={{
        marginTop:14,
        background: `linear-gradient(180deg, ${accent}0C 0%, transparent 100%), #f8fafc`,
        border:`1px solid ${accent}33`,
        borderTop:`3px solid ${accent}`,
        borderRadius:12,
        overflow:'hidden',
        animation:'pkgPanelDown .22s ease-out',
        boxShadow:`0 6px 20px ${accent}1A`,
      }}
    >
      {/* Header */}
      <div style={{padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, borderBottom:`1px solid ${accent}1F`}}>
        <div style={{display:'flex', alignItems:'center', gap:12, minWidth:0}}>
          <div style={{
            width:40, height:40, borderRadius:10, background: accent,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:800, fontSize:14, flexShrink:0,
          }}>
            {(pkg.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <span style={{fontSize:16, fontWeight:800, color:'#0f172a'}}>{pkg.name}</span>
              <span style={{fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${accent}18`, color:accent, textTransform:'uppercase', letterSpacing:'.06em'}}>
                {pkg._channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </span>
              <span style={{fontSize:9, fontWeight:700, color:'#cbd5e1', letterSpacing:'.07em'}}>{pkg.id}</span>
            </div>
            <div style={{fontSize:11, color:'#64748b', marginTop:2}}>
              {(pkg.credits||0).toLocaleString()} credits · {compactNumber(pkg.price||0)} TZS · {pkg.per_sms ?? pkg.per_conversation ?? '—'} TZS/unit
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{border:'none', background:'#fff', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, color:'#475569', cursor:'pointer', boxShadow:'0 1px 2px rgba(15,23,42,.06)'}}
        >Collapse ▴</button>
      </div>

      {/* Body */}
      <div style={{padding:'14px 18px 18px'}}>
        {/* KPI strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:10, marginBottom:14}}>
          <KPI label="Purchases"   value={rows.length.toLocaleString()}      color={accent}/>
          <KPI label="Completed"   value={completed.length.toLocaleString()} color={GREEN}/>
          <KPI label="Pending"     value={pending.length.toLocaleString()}   color={AMBER}/>
          <KPI label="Failed"      value={failed.length.toLocaleString()}    color={RED}/>
          <KPI label="Revenue TZS" value={compactNumber(revenue)}             color={GREEN}/>
          <KPI label="Credits Sold"value={compactNumber(credits)}             color={VIOLET}/>
          <KPI label="Buyers"      value={buyers.toLocaleString()}            color={CYAN}/>
        </div>

        {/* Transactions table */}
        {rows.length === 0 ? (
          <div style={{padding:'30px 20px', textAlign:'center', color:'#94a3b8', fontSize:13, background:'#fff', borderRadius:10, border:'1px dashed #e2e8f0'}}>
            No purchases found for <strong style={{color:'#475569'}}>{pkg.name}</strong> in the loaded transaction sample.
          </div>
        ) : (
          <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table className="senda-table" style={{minWidth:760}}>
                <thead>
                  <tr>
                    <th>Txn ID</th><th>User</th><th>Amount</th><th>Credits</th>
                    <th>Method</th><th>Reference</th><th>Status</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(t => (
                    <tr key={t.id}>
                      <td style={{fontWeight:600, color:accent, fontSize:12}}>{t.id}</td>
                      <td style={{fontSize:12, color:'#475569', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.user_email || t.user_id}</td>
                      <td style={{fontWeight:700, color: ['completed','success.'].includes((t.status||'').toLowerCase()) ? GREEN : '#0f172a'}}>{Number(t.amount||0).toLocaleString()}</td>
                      <td style={{fontSize:12}}>{Number(t.credits||0).toLocaleString()}</td>
                      <td><span style={{fontSize:11, background:'#f1f5f9', padding:'2px 8px', borderRadius:6}}>{t.method || '—'}</span></td>
                      <td style={{fontSize:11, color:'#64748b', fontFamily:'ui-monospace,Menlo,monospace', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.ref || '—'}</td>
                      <td><Badge status={t.status}/></td>
                      <td style={{fontSize:11, color:'#64748b', whiteSpace:'nowrap'}}>{t.date || (t.created_at ? new Date(t.created_at).toLocaleDateString() : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{padding:'10px 16px', borderTop:'1px solid #f1f5f9', fontSize:12, color:'#94a3b8'}}>
              {rows.length} purchase{rows.length!==1?'s':''} · {completed.length} completed · {pending.length} pending · {failed.length} failed · Revenue {compactNumber(revenue)} TZS
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pkgPanelDown {
        from { opacity: 0; transform: translateY(-8px); max-height: 0; }
        to   { opacity: 1; transform: translateY(0);   max-height: 2000px; }
      }`}</style>
    </div>
  );
}

// ─── Partners Tab ─────────────────────────────────────────────────────────────
const TIER_COLOR = { Platinum:'#6366f1', Gold:AMBER, Silver:'#94a3b8' };

function PartnerSenderIdsModal({ partner, onClose }) {
  const { onLogout } = React.useContext(AppContext);
  const [senderIds, setSenderIds]       = useState([]);
  const [apiSummary, setApiSummary]     = useState(null);
  const [loadedPages, setLoadedPages]   = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [source, setSource]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [activeView, setActiveView]     = useState('customers');
  const [custSearch, setCustSearch]     = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSenderIds([]);
    setApiSummary(null);
    setLoadedPages(0);
    setTotalPages(1);

    const externalBase = (partner.api_url || partner.base_url || '').replace(/\/$/, '');

    if (externalBase) {
      setSource(externalBase);

      const fetchPage = (page) =>
        fetch(`${externalBase}/api/user-senders?limit=100&page=${page}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        }).then(r => r.json());

      // Fetch page 1 first to get meta + summary
      fetchPage(1)
        .then(res => {
          const rows  = res.data ?? res.results ?? res.sender_ids ?? (Array.isArray(res) ? res : []);
          const meta  = res.meta || {};
          const pages = meta.total_pages || 1;

          if (res.summary) setApiSummary(res.summary);
          setTotalPages(pages);
          setLoadedPages(1);
          setSenderIds(rows);

          // Fetch remaining pages in parallel if any
          if (pages > 1) {
            const remaining = Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2));
            Promise.all(remaining)
              .then(responses => {
                const extra = responses.flatMap(r =>
                  r.data ?? r.results ?? r.sender_ids ?? (Array.isArray(r) ? r : [])
                );
                setSenderIds(prev => [...prev, ...extra]);
                setLoadedPages(pages);
              })
              .catch(() => {/* partial data already shown */});
          }
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));

    } else {
      setSource(BASE_URL);
      const qs = new URLSearchParams({ limit: 100 });
      if (partner.id)      qs.set('partner_id', partner.id);
      if (partner.user_id) qs.set('user_id', partner.user_id);
      adminFetch(`/sender-ids?${qs}`, {}, onLogout)
        .then(res => {
          if (res.success) {
            setSenderIds(res.data || []);
            if (res.summary) setApiSummary(res.summary);
          } else {
            setError(res.error?.message || 'Failed to load sender IDs.');
          }
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [partner, onLogout]);

  const tierColor = TIER_COLOR[partner.tier] || BRAND;

  // Prefer API-supplied summary for true totals; fall back to counting loaded rows
  const statusCounts = React.useMemo(() => {
    if (apiSummary) {
      return {
        all:             apiSummary.total            ?? senderIds.length,
        approved:        apiSummary.approved         ?? 0,
        pending:         apiSummary.pending          ?? 0,
        rejected:        apiSummary.rejected         ?? 0,
        require_changes: apiSummary.require_changes  ?? 0,
        await_payment:   apiSummary.await_payment    ?? 0,
      };
    }
    const map = { all: senderIds.length };
    senderIds.forEach(s => {
      const k = (s.status || 'unknown').toLowerCase();
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [apiSummary, senderIds]);

  const filtered = senderIds.filter(s => {
    const matchStatus = statusFilter === 'all' || (s.status || '').toLowerCase() === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.name || s.sender_name || s.sender_id || '').toLowerCase().includes(q) ||
      (s.user_email || s.user || s.owner || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const STATUS_FILTERS = [
    { key: 'all',              label: 'All',             color: BRAND  },
    { key: 'approved',         label: 'Approved',        color: GREEN  },
    { key: 'pending',          label: 'Pending',         color: AMBER  },
    { key: 'rejected',         label: 'Rejected',        color: RED    },
    { key: 'require_changes',  label: 'Require Changes', color: CYAN   },
    { key: 'await_payment',    label: 'Await Payment',   color: VIOLET },
  ].filter(f => f.key === 'all' || (statusCounts[f.key] || 0) > 0);

  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:'#f8fafc',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* ── Top bar ── */}
      <div style={{height:64,background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',padding:'0 24px',gap:16,flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
        <button onClick={onClose} style={{display:'flex',alignItems:'center',gap:6,border:'none',background:'#f1f5f9',borderRadius:8,height:34,padding:'0 12px',cursor:'pointer',fontSize:13,fontWeight:600,color:'#475569',flexShrink:0}}>
          ← Back
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16,fontWeight:800,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{partner.name}</span>
            <span style={{padding:'2px 9px',borderRadius:99,fontSize:10,fontWeight:700,background:`${tierColor}18`,color:tierColor,flexShrink:0}}>{partner.tier}</span>
            <Badge status={partner.status}/>
          </div>
          <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>
            {partner.owner?.email || partner.contact || '—'}
          </div>
        </div>
        <code style={{fontSize:10,color:'#cbd5e1',display:'none'}}>{source}</code>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',gap:0,flexShrink:0}}>
        {[
          { id:'customers', label:'Partina Network', count: (partner.customers || []).length },
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveView(t.id)}
            style={{height:42,padding:'0 18px',border:'none',background:'transparent',cursor:'pointer',
              fontSize:13,fontWeight:activeView===t.id?700:500,
              color:activeView===t.id?BRAND:'#64748b',
              borderBottom:activeView===t.id?`2px solid ${BRAND}`:'2px solid transparent',
              display:'flex',alignItems:'center',gap:7,transition:'all .15s',flexShrink:0,
            }}>
            {t.label}
            <span style={{padding:'1px 7px',borderRadius:99,fontSize:10,fontWeight:700,
              background:activeView===t.id?`${BRAND}18`:'#f1f5f9',
              color:activeView===t.id?BRAND:'#94a3b8'}}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── KPI strip (Sender IDs view) ── */}
      {activeView === 'senders' && !error && (
        <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'12px 24px',display:'flex',gap:32,alignItems:'center',flexShrink:0,overflowX:'auto'}}>
          {[
            { label:'Total Sender IDs', value: statusCounts['all']             || 0, color: BRAND  },
            { label:'Approved',         value: statusCounts['approved']        || 0, color: GREEN  },
            { label:'Pending',          value: statusCounts['pending']         || 0, color: AMBER  },
            { label:'Rejected',         value: statusCounts['rejected']        || 0, color: RED    },
            { label:'Require Changes',  value: statusCounts['require_changes'] || 0, color: CYAN   },
            { label:'Await Payment',    value: statusCounts['await_payment']   || 0, color: VIOLET },
          ].map(k => (
            <div key={k.label} style={{flexShrink:0}}>
              <div style={{fontSize:22,fontWeight:800,color:k.color,lineHeight:1}}>
                {loading ? '…' : k.value}
              </div>
              <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginTop:3}}>{k.label}</div>
            </div>
          ))}
          {/* Background pagination progress */}
          {!loading && totalPages > 1 && loadedPages < totalPages && (
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <div style={{width:14,height:14,borderRadius:'50%',border:`2px solid ${BRAND}`,borderTopColor:'transparent',animation:'spin 0.7s linear infinite'}}/>
              <span style={{fontSize:11,color:'#94a3b8'}}>Loading page {loadedPages}/{totalPages}…</span>
            </div>
          )}
        </div>
      )}

      {/* ── Sender IDs view: Filter + Search bar + Table ── */}
      {activeView === 'senders' && (
        <>
          <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'10px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {STATUS_FILTERS.map(f => (
                <button key={f.key} onClick={()=>setStatusFilter(f.key)}
                  style={{height:30,padding:'0 11px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                    background: statusFilter===f.key ? f.color : '#f1f5f9',
                    color: statusFilter===f.key ? '#fff' : '#64748b',
                    transition:'all .15s',
                  }}>
                  {f.label}
                  <span style={{marginLeft:5,fontSize:10,fontWeight:700,
                    background: statusFilter===f.key ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                    color: statusFilter===f.key ? '#fff' : '#94a3b8',
                    padding:'1px 5px',borderRadius:99}}>
                    {statusCounts[f.key] || 0}
                  </span>
                </button>
              ))}
            </div>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search sender name or user…"
              className="senda-input"
              style={{height:32,fontSize:12,width:220,marginLeft:'auto'}}
            />
            <span style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap'}}>
              {filtered.length} result{filtered.length!==1?'s':''}
              {loadedPages < totalPages && <span style={{color:AMBER}}> · loading…</span>}
            </span>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'0 24px 24px'}}>
            {loading ? (
              <div style={{padding:60,textAlign:'center',color:'#94a3b8',fontSize:13}}>Loading sender IDs…</div>
            ) : error ? (
              <div style={{padding:40,textAlign:'center',color:RED,fontSize:13}}>{error}</div>
            ) : senderIds.length === 0 ? (
              <div style={{padding:60,textAlign:'center',color:'#94a3b8',fontSize:13}}>No sender IDs found for this partner.</div>
            ) : (
              <div className="senda-card senda-table-wrap" style={{marginTop:16,overflow:'hidden'}}>
                <div style={{overflowX:'auto'}}>
                  <table className="senda-table" style={{minWidth:640}}>
                    <thead>
                      <tr>
                        <th>#</th><th>Sender Name</th><th>User / Owner</th><th>Status</th><th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => (
                        <tr key={s.id || i}>
                          <td style={{fontSize:11,color:'#cbd5e1',fontWeight:600,width:40}}>{i + 1}</td>
                          <td style={{fontWeight:700,color:'#0f172a'}}>{s.name || s.sender_name || s.sender_id || '—'}</td>
                          <td style={{fontSize:12,color:'#64748b',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {s.user_email || s.user || s.owner || s.contact || '—'}
                          </td>
                          <td><Badge status={s.status}/></td>
                          <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : (s.date || '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <div style={{padding:'28px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No sender IDs match this filter.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Partina Network view: customers from /partners response ── */}
      {activeView === 'customers' && (() => {
        const customers = partner.customers || [];
        const networkNames = [...new Set(customers.map(c => c.partina_network_name).filter(Boolean))];
        const q = custSearch.toLowerCase();
        const filteredCusts = customers.filter(c =>
          !q ||
          (c.name || '').toLowerCase().includes(q) ||
          (c.partina_network_name || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
        const totalCredits   = customers.reduce((s,c) => s + (c.credits||0), 0);
        const totalPurchased = customers.reduce((s,c) => s + (c.total_purchased||0), 0);
        const totalUsed      = customers.reduce((s,c) => s + (c.total_used||0), 0);
        const activeCount    = customers.filter(c => c.is_active).length;

        return (
          <>
            {/* KPI strip */}
            <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'12px 24px',display:'flex',gap:32,alignItems:'center',flexShrink:0,overflowX:'auto'}}>
              {[
                { label:'Total Customers',   value: customers.length,                       color: BRAND  },
                { label:'Active',            value: activeCount,                            color: GREEN  },
                { label:'Network Name(s)',   value: networkNames.length || 1,               color: VIOLET },
                { label:'Credits Balance',   value: totalCredits.toLocaleString(),          color: CYAN   },
                { label:'Total Purchased',   value: totalPurchased.toLocaleString(),        color: ORANGE },
                { label:'Total Used',        value: totalUsed.toLocaleString(),             color: AMBER  },
              ].map(k => (
                <div key={k.label} style={{flexShrink:0}}>
                  <div style={{fontSize:20,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                  <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginTop:3}}>{k.label}</div>
                </div>
              ))}
              {networkNames.length > 0 && (
                <div style={{marginLeft:'auto',display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',flexShrink:0}}>
                  {networkNames.map(n => (
                    <span key={n} style={{padding:'3px 10px',borderRadius:99,background:`${BRAND}12`,color:BRAND,fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Search bar */}
            <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'10px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
              <input
                value={custSearch} onChange={e=>setCustSearch(e.target.value)}
                placeholder="Search customer, network name, phone…"
                className="senda-input"
                style={{height:32,fontSize:12,width:280}}
              />
              <span style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap',marginLeft:'auto'}}>
                {filteredCusts.length} of {customers.length} customer{customers.length!==1?'s':''}
              </span>
            </div>

            {/* Table */}
            <div style={{flex:1,overflowY:'auto',padding:'0 24px 24px'}}>
              {customers.length === 0 ? (
                <div style={{padding:60,textAlign:'center',color:'#94a3b8',fontSize:13}}>No customers linked to this partner network.</div>
              ) : (
                <div className="senda-card senda-table-wrap" style={{marginTop:16,overflow:'hidden'}}>
                  <div style={{overflowX:'auto'}}>
                    <table className="senda-table" style={{minWidth:780}}>
                      <thead>
                        <tr>
                          <th style={{width:36}}>#</th>
                          <th>Customer Name</th>
                          <th>Partina Network (Sender)</th>
                          <th>Phone</th>
                          <th style={{textAlign:'right'}}>Credits</th>
                          <th style={{textAlign:'right'}}>Purchased</th>
                          <th style={{textAlign:'right'}}>Used</th>
                          <th>Active</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCusts.map((c, i) => (
                          <tr key={c.tenant_id || i}>
                            <td style={{fontSize:11,color:'#cbd5e1',fontWeight:600}}>{i + 1}</td>
                            <td style={{fontWeight:600,color:'#0f172a',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                                title={c.name}>{c.name || '—'}</td>
                            <td>
                              <span style={{display:'inline-block',padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:700,background:`${BRAND}12`,color:BRAND,whiteSpace:'nowrap'}}>
                                {c.partina_network_name || '—'}
                              </span>
                            </td>
                            <td style={{fontFamily:'monospace',fontSize:11,whiteSpace:'nowrap',color:'#475569'}}>{c.phone && c.phone !== '+' ? c.phone : '—'}</td>
                            <td style={{textAlign:'right',fontWeight:700,color:c.credits>0?GREEN:'#94a3b8'}}>{(c.credits||0).toLocaleString()}</td>
                            <td style={{textAlign:'right',fontWeight:600,color:'#475569'}}>{(c.total_purchased||0).toLocaleString()}</td>
                            <td style={{textAlign:'right',fontWeight:600,color:'#94a3b8'}}>{(c.total_used||0).toLocaleString()}</td>
                            <td>
                              <span style={{display:'inline-block',padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:700,
                                background:c.is_active?`${GREEN}18`:`${RED}12`,
                                color:c.is_active?GREEN:RED}}>
                                {c.is_active?'Active':'Inactive'}
                              </span>
                            </td>
                            <td style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap'}}>
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredCusts.length === 0 && (
                    <div style={{padding:'28px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No customers match your search.</div>
                  )}
                  <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',fontSize:11,color:'#94a3b8',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:4}}>
                    <span>{customers.length} customer{customers.length!==1?'s':''} · {networkNames.join(', ') || '—'}</span>
                    <span>Balance: {totalCredits.toLocaleString()} · Purchased: {totalPurchased.toLocaleString()} · Used: {totalUsed.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function PartnersTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [items, setItems]                     = useState([]);
  const [summary, setSummary]                 = useState({});
  const [revTrend, setRevTrend]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [filter, setFilter]                   = useState('all');
  const [search, setSearch]                   = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      adminFetch('/partners', {}, onLogout),
      adminFetch('/partners/analytics/revenue-trend?months=6', {}, onLogout),
    ]).then(([pRes, rRes]) => {
      if (pRes.success) {
        setItems(pRes.data || []);
        if (pRes.summary) setSummary(pRes.summary);
      } else {
        setError(pRes.error?.message || 'Failed to load partners.');
      }
      if (rRes.success) setRevTrend(rRes.data || []);
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Prefer API summary for accurate platform-wide counts
  const totalPartners  = summary.total         ?? items.length;
  const activeCount    = summary.active        ?? items.filter(p=>p.status==='active').length;
  const pendingCount   = summary.pending       ?? items.filter(p=>p.status==='pending').length;
  const suspendedCount = summary.suspended     ?? items.filter(p=>p.status==='suspended').length;
  const totalClients   = summary.total_clients ?? items.reduce((s,p)=>{
    const cnt = p.clients ?? p.customers_count ?? (p.customers||[]).length ?? 0;
    return s + cnt;
  }, 0);
  // Compute credits/purchased/used from customers arrays (from /partners response)
  const totalCredBal   = items.reduce((s,p)=>(p.customers||[]).reduce((ss,c)=>ss+(c.credits||0),s),0);
  const totalPurchased = items.reduce((s,p)=>(p.customers||[]).reduce((ss,c)=>ss+(c.total_purchased||0),s),0);
  const totalUsed      = items.reduce((s,p)=>(p.customers||[]).reduce((ss,c)=>ss+(c.total_used||0),s),0);

  // Table filter runs on the loaded items array
  const filtered = items.filter(p => {
    const ms = filter==='all' || p.status===filter;
    const q  = search.toLowerCase();
    return ms && (!q || (p.name||'').toLowerCase().includes(q) || (p.contact||'').includes(q) || (p.region||'').toLowerCase().includes(q));
  });

  return (
    <div className="senda-fade-in">
      {/* ── KPI cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'Total Partners',  v:totalPartners,                               c:BRAND,  Icon:Handshake},
          {l:'Active',          v:activeCount,                               c:GREEN,  Icon:CheckCircle2},
          {l:'Pending',         v:pendingCount,                              c:AMBER,  Icon:Hourglass},
          {l:'Suspended',       v:suspendedCount,                            c:RED,    Icon:Ban},
          {l:'Total Clients',    v:totalClients.toLocaleString(),             c:VIOLET, Icon:Users},
          {l:'Credits Balance',  v:totalCredBal.toLocaleString(),            c:GREEN,  Icon:Wallet},
          {l:'Total Purchased',  v:totalPurchased.toLocaleString(),          c:ORANGE, Icon:DollarSign},
          {l:'Total Used',       v:totalUsed.toLocaleString(),               c:CYAN,   Icon:MessageSquare},
        ].map(x=>(
          <div key={x.l} className="senda-card" style={{padding:'12px 14px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${x.c}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <x.Icon size={16} strokeWidth={2.2} color={x.c} />
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{x.v}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>{x.l}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Analytics charts ── */}
      {!loading && !error && (
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
          <div className="senda-card" style={{padding:20}}>
            <SectionHeader title="Partner Revenue & Commission Trend" subtitle="6-month growth with commission overlay"/>
            <div style={{height:isMobile?160:200}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revTrend} margin={{top:4,right:8,left:0,bottom:0}}>
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
        </div>
      )}

      {/* ── Header ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Partner Directory</h3>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{filtered.length} partners shown</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search partner, email, region…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{width:isMobile?'100%':240,height:36,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {[['all','All'],['active','Active'],['pending','Pending'],['suspended','Suspended']].map(([k,l])=>(
            <button key={k} className="senda-btn senda-btn-sm" onClick={()=>setFilter(k)}
              style={{background:filter===k?BRAND:'#f1f5f9',color:filter===k?'#fff':'#64748b',border:'none'}}>
              {l} ({k==='all'?totalPartners:k==='active'?activeCount:k==='pending'?pendingCount:suspendedCount})
            </button>
          ))}
        </div>
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {/* ── Table ── */}
      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:860}}>
              <thead>
                <tr>
                  <th>ID</th><th>Agency Name</th><th>Contact</th><th>Region</th>
                  <th>Tier</th><th>Sender IDs</th><th>Clients</th>
                  <th style={{textAlign:'right'}}>Credits Balance</th>
                  <th style={{textAlign:'right'}}>Total Purchased</th>
                  <th style={{textAlign:'right'}}>Total Used</th>
                  <th>Status</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>{
                  const custs = p.customers || [];
                  const credBal   = custs.reduce((s,c) => s + (c.credits||0), 0);
                  const purchased = custs.reduce((s,c) => s + (c.total_purchased||0), 0);
                  const used      = custs.reduce((s,c) => s + (c.total_used||0), 0);
                  const clientCnt = p.clients ?? p.customers_count ?? custs.length ?? 0;
                  return (
                  <tr key={p.id}>
                    <td
                      style={{fontWeight:600,color:BRAND,fontSize:12,cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}}
                      title="Click to view sender IDs"
                      onClick={()=>setSelectedPartner(p)}
                    >{p.id}</td>
                    <td style={{fontWeight:700,color:'#0f172a'}}>{p.name}</td>
                    <td style={{fontSize:11,color:'#64748b',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contact}</td>
                    <td style={{fontSize:12}}>{p.region}</td>
                    <td>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:700,background:`${TIER_COLOR[p.tier]||BRAND}18`,color:TIER_COLOR[p.tier]||BRAND}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:TIER_COLOR[p.tier]||BRAND,flexShrink:0,display:'inline-block'}}/>
                        {p.tier || '—'}
                      </span>
                    </td>
                    <td style={{fontWeight:600,color:CYAN,cursor:'pointer'}} onClick={()=>setSelectedPartner(p)}>
                      {p.sender_id_count ?? p.sender_ids_count ?? p.sender_ids ?? (
                        <span style={{fontSize:11,color:BRAND,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}}>View</span>
                      )}
                    </td>
                    <td style={{fontWeight:600}}>{clientCnt.toLocaleString()}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:credBal>0?GREEN:'#94a3b8'}}>{credBal.toLocaleString()}</td>
                    <td style={{textAlign:'right',fontWeight:600,color:'#475569'}}>{purchased.toLocaleString()}</td>
                    <td style={{textAlign:'right',fontWeight:600,color:'#94a3b8'}}>{used.toLocaleString()}</td>
                    <td><Badge status={p.status}/></td>
                    <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{p.join_date ? new Date(p.join_date).toLocaleDateString() : '—'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length===0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No partners match the current filter.</div>}
        </div>
      )}

      {selectedPartner && (
        <PartnerSenderIdsModal partner={selectedPartner} onClose={()=>setSelectedPartner(null)}/>
      )}
    </div>
  );
}

// ─── Users Management Tab ─────────────────────────────────────────────────────
function UsersTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [items, setItems]         = useState([]);
  const [meta, setMeta]           = useState({});
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const PER = 15;

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ page, limit: PER });
    if (filterRole !== 'all')   qs.set('role', filterRole);
    if (filterStatus !== 'all') qs.set('status', filterStatus);
    if (search.trim())          qs.set('search', search.trim());
    adminFetch(`/users?${qs}`, {}, onLogout)
      .then(res => {
        if (res.success) { setItems(res.data || []); setMeta(res.meta || {}); }
        else setError(res.error?.message || 'Failed to load users.');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, filterRole, filterStatus, search, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total = meta.total || 0;
  const pages = meta.total_pages || 1;

  return (
    <div className="senda-fade-in">
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search by name, email..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{width:bp==='mobile'?'100%':260,height:38,fontSize:13}}/>
        <div style={{display:'flex',gap:4}}>
          {['all','admin','partner','user'].map(f=>(
            <button key={f} className="senda-btn senda-btn-sm" onClick={()=>{setFilterRole(f);setPage(1);}}
              style={{background:filterRole===f?BRAND:'#f1f5f9',color:filterRole===f?'#fff':'#64748b',border:'none'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          {['all','active','suspended'].map(f=>(
            <button key={f} className="senda-btn senda-btn-sm" onClick={()=>{setFilterStatus(f);setPage(1);}}
              style={{background:filterStatus===f?(f==='suspended'?RED:f==='active'?GREEN:BRAND):'#f1f5f9',color:filterStatus===f?'#fff':'#64748b',border:'none'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{total} users</span>
      </div>

      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:780}}>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>SMS Sent</th><th>Balance (TZS)</th><th>Status</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {items.map(u=>(
                  <tr key={u.id}>
                    <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{u.id}</td>
                    <td style={{fontWeight:600,color:'#0f172a'}}>{u.name}</td>
                    <td style={{fontSize:12,color:'#64748b'}}>{u.email}</td>
                    <td style={{fontFamily:'monospace',fontSize:12}}>{u.phone}</td>
                    <td><Badge status={u.role}/></td>
                    <td style={{fontWeight:600}}>{(u.sms_sent||0).toLocaleString()}</td>
                    <td style={{fontWeight:600,color:GREEN}}>{(u.balance||0).toLocaleString()}</td>
                    <td><Badge status={u.status}/></td>
                    <td style={{fontSize:12,color:'#64748b'}}>{u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No users found.</div>}
          {/* Pagination */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid #f1f5f9',flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Page {page} of {pages} · {total} total</span>
            <div style={{display:'flex',gap:4}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{opacity:page===1?.4:1}}>← Prev</button>
              {Array.from({length:Math.min(pages,7)},(_,i)=>i+1).map(p=>(
                <button key={p} className="senda-btn senda-btn-sm" onClick={()=>setPage(p)}
                  style={{background:p===page?BRAND:'#f1f5f9',color:p===page?'#fff':'#64748b',border:'none',minWidth:30}}>
                  {p}
                </button>
              ))}
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page>=pages} onClick={()=>setPage(p=>p+1)} style={{opacity:page>=pages?.4:1}}>Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Operations Tab ───────────────────────────────────────────────────────────
const OPS_LINKS = [
  {
    title: 'Revenue Overview',
    url: 'https://mifumosms.mifumolabs.com/api/revenue-overview/',
    kind: 'HTML Page',
    desc: 'Aggregated completed revenue from all sources — PaymentTransaction, Purchase, CustomSMSPurchase, SenderIDRequestPayment, and ManualActivityLog. Requires staff/superuser session.',
  },
  {
    title: 'User Accounts Admin',
    url: 'https://mifumosms.mifumolabs.com/sys-admin-control-v3/accounts/user/',
    kind: 'Django Admin',
    desc: 'Full Django admin interface for the accounts app — view, search, and manage all registered user accounts.',
  },
  {
    title: 'User Analysis',
    url: 'https://mifumosms.mifumolabs.com/sys-admin-control-v3/user-analysis/',
    kind: 'Django Admin',
    desc: 'Inactive user tracking and analysis tooling for churn monitoring and engagement insights.',
  },
  {
    title: 'SMS Dashboard',
    url: 'https://mifumosms.mifumolabs.com/sys-admin-control-v3/sms-dashboard/',
    kind: 'Django Admin',
    desc: 'SMS delivery statistics, channel performance, and related stats under the sms-dashboard admin app.',
  },
];

function OperationsTab() {
  return (
    <div className="senda-fade-in">
      <div className="senda-card" style={{
        padding:'14px 18px', marginBottom:20,
        borderLeft:`4px solid ${AMBER}`, background:'#fffbeb',
      }}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <AlertTriangle size={15} strokeWidth={2} color={AMBER} style={{marginTop:2,flexShrink:0}}/>
          <div>
            <p style={{fontSize:13,fontWeight:600,color:'#92400e',margin:0}}>Session Cookie Authentication Required</p>
            <p style={{fontSize:12,color:'#b45309',margin:'3px 0 0',lineHeight:1.5}}>
              These pages use Django session authentication — not Bearer tokens. Log in as a staff or superuser on sys-admin-control-v3 before opening these links.
            </p>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
        {OPS_LINKS.map(l => (
          <div key={l.url} className="senda-card" style={{padding:24,display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
              <div>
                <p style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>{l.kind}</p>
                <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'3px 0 0'}}>{l.title}</h3>
              </div>
              <div style={{width:36,height:36,borderRadius:10,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Globe size={16} strokeWidth={2} color={BRAND}/>
              </div>
            </div>
            <p style={{fontSize:13,color:'#64748b',lineHeight:1.55,margin:0,flex:1}}>{l.desc}</p>
            <div style={{borderTop:'1px solid #f1f5f9',paddingTop:12}}>
              <code style={{fontSize:10,color:'#94a3b8',wordBreak:'break-all',display:'block',marginBottom:10,lineHeight:1.4}}>{l.url}</code>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display:'inline-flex',alignItems:'center',gap:6,
                  padding:'0 14px',height:34,borderRadius:8,
                  background:BRAND,color:'#fff',
                  fontSize:13,fontWeight:600,textDecoration:'none',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=BRAND2;}}
                onMouseLeave={e=>{e.currentTarget.style.background=BRAND;}}
              >
                <ExternalLink size={13} strokeWidth={2.2}/>
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview',     Icon:BarChart3,   label:'Overview'       },
  { id:'insights',     Icon:Activity,    label:'Insights'       },
  { id:'users',        Icon:Users,       label:'Users'          },
  { id:'transactions', Icon:CreditCard,  label:'Transactions'   },
  { id:'senderids',    Icon:Tag,         label:'Sender IDs'     },
  { id:'partners',     Icon:Handshake,   label:'Partners'       },
  { id:'loginactivity',Icon:ShieldCheck, label:'Login Activity' },
  { id:'packages',     Icon:Package,     label:'Packages'       },
  { id:'operations',   Icon:Globe,       label:'Operations'     },
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
          <Mail size={18} strokeWidth={2.4} color="#fff" />
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
            <n.Icon className="senda-nav-icon" strokeWidth={2.2} />
            {!collapsed && <span>{n.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{padding:'10px 8px',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
        <button className="senda-nav-item" onClick={onLogout}
          title={collapsed?'Logout':''}
          style={{justifyContent:collapsed?'center':'flex-start',color:RED,width:'100%'}}>
          <LogOut className="senda-nav-icon" strokeWidth={2.2} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (mobile) ──────────────────────────────────────────────────────
// Mobile nav: a slide-in left drawer that shows every NAV item vertically.
// Triggered by the hamburger button in the mobile header. No bottom bar — the
// drawer has room for the full label of every section without truncation.
function LeftDrawerNav({ open, onClose, active, setActive, onLogout, adminInfo }) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:300,
          background:'rgba(15,23,42,0.45)', backdropFilter:'blur(2px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition:'opacity .18s ease-out',
        }}
      />
      {/* drawer panel */}
      <aside
        role="navigation"
        aria-hidden={!open}
        style={{
          position:'fixed', top:0, left:0, bottom:0, zIndex:301,
          width:'min(280px, 84vw)',
          background:'#fff', borderRight:'1px solid #e2e8f0',
          boxShadow: open ? '6px 0 30px rgba(15,23,42,.18)' : 'none',
          transform: `translateX(${open ? '0' : '-100%'})`,
          transition:'transform .22s ease-out',
          display:'flex', flexDirection:'column',
          paddingTop:'env(safe-area-inset-top, 0)',
        }}
      >
        {/* brand row */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #e2e8f0', flexShrink:0}}>
          <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
            <div style={{width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${BRAND},${BRAND2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              <Mail size={17} strokeWidth={2.4} color="#fff"/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13, fontWeight:800, color:'#0f172a', letterSpacing:'.02em', lineHeight:1}}>SENDA</div>
              <div style={{fontSize:10, color:'#94a3b8', marginTop:3}}>Admin Portal</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{border:'none', background:'#f1f5f9', borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:600, color:'#475569', cursor:'pointer'}}
          >Close</button>
        </div>

        {/* admin info */}
        {adminInfo && (
          <div style={{padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:10, flexShrink:0}}>
            <div style={{width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${BRAND},${BRAND2})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13, flexShrink:0}}>
              {(adminInfo.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{adminInfo.name || 'Admin'}</div>
              <div style={{fontSize:10, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{adminInfo.email || ''}</div>
            </div>
          </div>
        )}

        {/* nav list — scrollable if needed; all NAV items shown */}
        <nav style={{flex:1, overflowY:'auto', padding:'10px 8px'}}>
          {NAV.map(n => {
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => { setActive(n.id); onClose(); }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:12,
                  padding:'11px 12px', borderRadius:9,
                  border:'none',
                  background: isActive ? `${BRAND}14` : 'transparent',
                  color: isActive ? BRAND : '#475569',
                  fontWeight: isActive ? 700 : 500, fontSize:13.5,
                  cursor:'pointer', marginBottom:2, textAlign:'left',
                  transition:'background .12s, color .12s',
                }}
              >
                <span style={{
                  width:30, height:30, borderRadius:8,
                  background: isActive ? BRAND : '#f1f5f9',
                  display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <n.Icon size={16} strokeWidth={2.2} color={isActive ? '#fff' : '#64748b'}/>
                </span>
                <span style={{flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.label}</span>
                {isActive && <span style={{width:6, height:6, borderRadius:'50%', background:BRAND, flexShrink:0}}/>}
              </button>
            );
          })}
        </nav>

        {/* logout pinned at bottom */}
        <div style={{padding:'10px 12px calc(10px + env(safe-area-inset-bottom, 0))', borderTop:'1px solid #e2e8f0', flexShrink:0}}>
          <button
            onClick={() => { onClose(); onLogout(); }}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:`${RED}10`, border:`1px solid ${RED}40`,
              color: RED, fontWeight:700, fontSize:12.5,
              borderRadius:9, padding:'11px',
              cursor:'pointer',
            }}
          >
            <LogOut size={16} strokeWidth={2.4}/>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Toggleable chart/table panel (generic) ───────────────────────────────────
// Renders a card with header + Chart/Table toggle. Each metric supplies its own
// `renderChart()` and `renderTable()` so charts can vary (Area, Bar, Pie, etc).
function ToggleablePanel({ title, subtitle, color, hasData = true, emptyMsg = 'No data.', renderChart, renderTable, footer }) {
  const [view, setView] = useState('chart');

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setView(id)}
      style={{
        height:26, padding:'0 11px', borderRadius:6, border:'none', cursor:'pointer',
        fontSize:11, fontWeight:600,
        background: view === id ? color : '#f1f5f9',
        color:      view === id ? '#fff' : '#64748b',
        transition:'all .15s',
      }}
    >{label}</button>
  );

  return (
    <div className="senda-card" style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
        <div style={{minWidth:0,flex:1}}>
          <h4 style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{title}</h4>
          {subtitle && <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{subtitle}</p>}
        </div>
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          <TabBtn id="chart" label="Chart"/>
          <TabBtn id="table" label="Table"/>
        </div>
      </div>

      {!hasData ? (
        <div style={{padding:'40px 18px',textAlign:'center',color:'#94a3b8',fontSize:12}}>{emptyMsg}</div>
      ) : (
        <div style={{flex:1,minHeight:0}}>{view === 'chart' ? renderChart() : renderTable()}</div>
      )}

      {hasData && footer && (
        <div style={{padding:'8px 18px',borderTop:'1px solid #f1f5f9',fontSize:11,color:'#94a3b8'}}>
          {typeof footer === 'function' ? footer(view) : footer}
        </div>
      )}
    </div>
  );
}

// Helpers used by Insights panels
const InsightsChartBox = ({ children, height = 280 }) => (
  <div style={{padding:'12px 18px 14px',height}}>
    <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
  </div>
);

// Standard axis-title style + helpers — keeps every chart self-explanatory.
const AXIS_TITLE_STYLE = { fontSize: 11, fill: '#475569', fontWeight: 700, textAnchor: 'middle' };
const xAxisTitle = (text) => ({ value: text, position: 'insideBottom', offset: -6, style: AXIS_TITLE_STYLE });
const yAxisTitle = (text) => ({ value: text, angle: -90, position: 'insideLeft', offset: 0, style: AXIS_TITLE_STYLE });
const CHART_MARGIN = { top: 10, right: 16, left: 14, bottom: 28 };
const InsightsTable = ({ headers, rows, maxHeight = 300 }) => (
  <div style={{maxHeight,overflowY:'auto'}}>
    <table className="senda-table" style={{width:'100%'}}>
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

// Click any row to drill into per-row detail. Each item must carry __key
// (unique) and may optionally set __highlight (light background row).
function ExpandableTable({ headers, items, renderRow, renderDetail, maxHeight = 320, accent = '#2563EB' }) {
  const [openKey, setOpenKey] = useState(null);
  return (
    <div style={{maxHeight, overflowY:'auto'}}>
      <table className="senda-table" style={{width:'100%'}}>
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
            <th style={{width:30}}/>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const key = item.__key ?? i;
            const isOpen = openKey === key;
            const baseBg = isOpen ? '#eff6ff' : (item.__highlight ? '#f8fafc' : undefined);
            return (
              <React.Fragment key={key}>
                <tr
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  style={{cursor:'pointer', background:baseBg, transition:'background .12s'}}
                  title={isOpen ? 'Click to collapse' : 'Click to see details'}
                >
                  {renderRow(item, i)}
                  <td style={{textAlign:'center', color: isOpen ? accent : '#cbd5e1', fontSize:13, fontWeight:700, userSelect:'none'}}>
                    {isOpen ? '▾' : '▸'}
                  </td>
                </tr>
                {isOpen && renderDetail && (
                  <tr key={`${key}-d`}>
                    <td colSpan={headers.length + 1} style={{padding:'14px 18px', background:'#f8fafc', borderTop:`2px solid ${accent}`, borderBottom:'1px solid #e2e8f0'}}>
                      {renderDetail(item, i)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={headers.length + 1} style={{padding:'30px 18px', textAlign:'center', color:'#94a3b8', fontSize:12}}>No data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Reusable detail block: label/value grid for a user-like object.
function DetailGrid({ fields }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12}}>
      {fields.map((f, i) => (
        <div key={f.label + i}>
          <div style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3}}>{f.label}</div>
          <div style={{fontSize:12, color:'#0f172a', fontWeight:600, lineHeight:1.4, wordBreak:'break-word'}}>
            {f.value === null || f.value === undefined || f.value === '' ? <span style={{color:'#cbd5e1'}}>—</span> : f.value}
          </div>
        </div>
      ))}
    </div>
  );
}
// Resolve the *end-customer* for a sender row.
// Two distinct paths because partner-owned senders carry the PARTNER's
// owner_id/owner_email (e.g. USR-00079 / development@swahilies.com), so a naive
// /users lookup would return the partner admin instead of the actual customer.
//
//  • If the sender's owner_email matches any registered partner-owner email →
//      route through partner-customer lookup (tenant_id, then sender name,
//      then company) and return the matched partner customer.
//  • Otherwise → /users lookup (direct user / our own company end-user).
//  • If neither finds a match, fall back gracefully so phone/name still render.
//
// Returns:
//   { name, phone, email, _source, _partner_name, _partner_email, _tenant_id } | null
function buildOwnerResolver(users = [], partners = []) {
  const norm = (v) => String(v || '').trim().toLowerCase();

  // /users index by id and lowercased email
  const userByKey = new Map();
  users.forEach(u => {
    if (u.id)    userByKey.set(u.id, u);
    if (u.email) userByKey.set(norm(u.email), u);
  });

  // Partner indexes:
  //   partnerOwnerEmails — emails that *belong to partners* (signals "partner-owned sender")
  //   custByName / custByTenant — partner customers keyed by name and tenant_id
  //   partnerByOwnerEmail — owner-email → partner record (for fallback context)
  const partnerOwnerEmails    = new Set();
  const partnerByOwnerEmail   = new Map();
  const custByName            = new Map(); // each value is an array (multiple customers can share a name)
  const custByTenant          = new Map();

  partners.forEach(p => {
    const ownerEmail = norm(p.owner?.email);
    if (ownerEmail) {
      partnerOwnerEmails.add(ownerEmail);
      partnerByOwnerEmail.set(ownerEmail, p);
    }
    (p.customers || []).forEach(c => {
      const enriched = {
        name: c.name,
        phone: c.phone && c.phone !== '+' ? c.phone : null,
        email: c.email,
        tenant_id: c.tenant_id,
        subdomain: c.subdomain,
        partner_name:  p.name,
        partner_email: ownerEmail,
      };
      const nKey = norm(c.name);
      const tKey = norm(c.tenant_id);
      if (nKey) {
        if (!custByName.has(nKey)) custByName.set(nKey, []);
        custByName.get(nKey).push(enriched);
      }
      if (tKey) custByTenant.set(tKey, enriched);
    });
  });

  // Try several keys to find the partner customer. Tenant first (most reliable),
  // then exact sender name, then `company`, then a normalized prefix-match
  // (so "RICONSTORE" matches "RICONSTORE LTD" etc).
  const findPartnerCustomer = (s) => {
    const tenantKey  = norm(s.tenant_id || s.tenant);
    if (tenantKey && custByTenant.has(tenantKey)) return custByTenant.get(tenantKey);

    const senderName = norm(s.name || s.sender_name);
    const companyKey = norm(s.company);

    const exactList =
      (senderName && custByName.get(senderName)) ||
      (companyKey && custByName.get(companyKey));
    if (exactList && exactList.length) return exactList[0];

    // Loose match: sender name is a substring/prefix of customer name (or vice versa).
    if (senderName) {
      for (const [k, list] of custByName) {
        if (k.includes(senderName) || senderName.includes(k)) return list[0];
      }
    }
    if (companyKey) {
      for (const [k, list] of custByName) {
        if (k.includes(companyKey) || companyKey.includes(k)) return list[0];
      }
    }
    return null;
  };

  return function resolve(s) {
    if (!s) return null;

    // Sender API uses owner_id / owner_email; older code paths used user_id / user_email.
    const ownerId    = s.owner_id || s.user_id || s.user;
    const ownerEmail = norm(s.owner_email || s.user_email || s.email);
    const isPartnerOwned = partnerOwnerEmails.has(ownerEmail);

    // ── Partner-owned sender — prefer the customer over the partner admin user.
    if (isPartnerOwned) {
      const cust = findPartnerCustomer(s);
      if (cust) {
        return {
          name:  cust.name,
          email: cust.email || ownerEmail,
          phone: cust.phone,
          _source: 'partner_customer',
          _partner_name:  cust.partner_name,
          _partner_email: cust.partner_email,
          _tenant_id:     cust.tenant_id,
        };
      }
      // No customer match — return partner-context shell so the UI still shows
      // partner attribution and the sender's company/name as best-known label.
      const partner = partnerByOwnerEmail.get(ownerEmail);
      return {
        name:  s.company || s.name || ownerEmail,
        email: ownerEmail,
        phone: null,
        _source: 'partner_unmatched',
        _partner_name:  partner?.name || null,
        _partner_email: ownerEmail,
      };
    }

    // ── Non-partner ("our company users"): direct lookup against /users.
    const direct = (ownerId && userByKey.get(ownerId)) || (ownerEmail && userByKey.get(ownerEmail));
    if (direct) return { ...direct, _source: 'direct_user' };

    // Last-ditch: maybe the sender name matches a partner customer even though
    // the email isn't a known partner. Try the loose matcher.
    const cust = findPartnerCustomer(s);
    if (cust) {
      return {
        name:  cust.name,
        email: cust.email || ownerEmail,
        phone: cust.phone,
        _source: 'partner_customer',
        _partner_name:  cust.partner_name,
        _partner_email: cust.partner_email,
        _tenant_id:     cust.tenant_id,
      };
    }
    return null;
  };
}

// Build a set of partner-owner emails (e.g. development@swahilies.com) so consumers
// can filter "our own users" out of the partner-network end-customers.
function getPartnerOwnerEmails(partners = []) {
  const set = new Set();
  (partners || []).forEach(p => {
    const e = String(p.owner?.email || '').trim().toLowerCase();
    if (e) set.add(e);
  });
  return set;
}

function userDetailFields(u) {
  return [
    { label:'User ID',   value: u.id },
    { label:'Phone',     value: u.phone },
    { label:'Email',     value: u.email },
    { label:'Role',      value: u.role },
    { label:'Status',    value: u.status },
    { label:'Joined',    value: u.joined_at ? new Date(u.joined_at).toLocaleString() : null },
    { label:'Last Seen', value: u.last_seen_at ? new Date(u.last_seen_at).toLocaleString() : 'Never' },
    { label:'SMS Sent',  value: (u.sms_sent ?? 0).toLocaleString() },
    { label:'Balance',   value: `${(u.balance ?? 0).toLocaleString()} TZS` },
  ];
}

// Paginated, downloadable table for "Approved Sender · No Payment".
// Shows sender + owner phone (looked up from /users), keeps click-to-expand
// drill-down, and exposes a CSV export of the full filtered list.
// Buckets mirror the Idle Buyers bar-chart (`inactiveBuyerBuckets`).
// Used to filter "users who bought SMS/sender but haven't logged in for >7d".
const IDLE_BUYER_BUCKETS = [
  { id: 'all',     label: 'All',       min: null, max: null },
  { id: '7-14',    label: '7–14 d',    min: 7,    max: 14 },
  { id: '15-30',   label: '15–30 d',   min: 15,   max: 30 },
  { id: '31-60',   label: '31–60 d',   min: 31,   max: 60 },
  { id: '61-90',   label: '61–90 d',   min: 61,   max: 90 },
  { id: '90+',     label: '90+ d',     min: 91,   max: Infinity },
  { id: 'never',   label: 'Never seen',min: null, max: null },
];

const matchesIdleBucket = (u, bucketId) => {
  if (bucketId === 'all') return true;
  if (bucketId === 'never') return !u.last_seen_at;
  if (!u.last_seen_at) return false;
  const b = IDLE_BUYER_BUCKETS.find(x => x.id === bucketId);
  if (!b || b.min == null) return true;
  const days = Math.floor((Date.now() - new Date(u.last_seen_at).getTime()) / 86400000);
  return days >= b.min && days <= b.max;
};

// Idle Buyers table: paginated, filterable, with purchase context per row.
// Each row carries a `tx` map index so we can show "last purchase, total spent,
// purchase count" without recomputing globally inside renderRow.
function IdleBuyersTable({ rows, transactions = [] }) {
  const [page, setPage]       = useState(1);
  const [openKey, setOpenKey] = useState(null);
  const [bucket, setBucket]   = useState('all');
  const PER = 15;
  const DAY = 86400000;
  const now = Date.now();

  useEffect(() => { setPage(1); }, [rows.length, bucket]);

  // Pre-compute purchase stats per user once. Successful transactions only.
  const txStatsByUser = React.useMemo(() => {
    const map = new Map();
    transactions.forEach(t => {
      const status = String(t.status || '').toLowerCase();
      if (status && status !== 'completed' && status !== 'success') return;
      const id    = t.user_id || t.user;
      const email = String(t.user_email || '').toLowerCase();
      const amt   = Number(t.amount || t.total || t.total_price || 0);
      const date  = t.created_at ? new Date(t.created_at) : null;
      const apply = (k) => {
        if (!k) return;
        const cur = map.get(k) || { count: 0, total: 0, lastDate: null, sources: new Set() };
        cur.count += 1;
        cur.total += amt;
        if (date && (!cur.lastDate || date > cur.lastDate)) cur.lastDate = date;
        if (t.source) cur.sources.add(t.source);
        map.set(k, cur);
      };
      apply(id);
      apply(email);
    });
    return map;
  }, [transactions]);

  const statsFor = (u) => {
    const byId    = u.id    && txStatsByUser.get(u.id);
    const byEmail = u.email && txStatsByUser.get(String(u.email).toLowerCase());
    return byId || byEmail || { count: 0, total: 0, lastDate: null, sources: new Set() };
  };

  const filteredRows = React.useMemo(
    () => rows.filter(u => matchesIdleBucket(u, bucket)),
    [rows, bucket]
  );

  const bucketCounts = React.useMemo(() => {
    const counts = {};
    IDLE_BUYER_BUCKETS.forEach(b => {
      counts[b.id] = b.id === 'all' ? rows.length : rows.filter(u => matchesIdleBucket(u, b.id)).length;
    });
    return counts;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER));
  const safePage   = Math.min(page, totalPages);
  const paged      = filteredRows.slice((safePage - 1) * PER, safePage * PER);

  const handleDownload = () => {
    if (filteredRows.length === 0) return;
    const headers = ['User ID','Name','Email','Phone','Status','Joined','Last Seen','Days Idle','Purchases','Total Spent (TZS)','Last Purchase','Sources'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines  = [headers.map(escape).join(',')];
    filteredRows.forEach(u => {
      const days = u.last_seen_at ? Math.floor((now - new Date(u.last_seen_at).getTime()) / DAY) : 'Never';
      const st   = statsFor(u);
      lines.push([
        u.id || '',
        u.name || '',
        u.email || '',
        u.phone || '',
        u.status || '',
        u.joined_at ? new Date(u.joined_at).toISOString().slice(0,10) : '',
        u.last_seen_at ? new Date(u.last_seen_at).toISOString().slice(0,10) : '',
        days,
        st.count,
        st.total,
        st.lastDate ? st.lastDate.toISOString().slice(0,10) : '',
        [...st.sources].join('|'),
      ].map(escape).join(','));
    });
    const tag = bucket === 'all' ? 'all' : bucket.replace(/[^a-z0-9-]/gi, '');
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idle-buyers-${tag}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pageBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled}
      style={{padding:'4px 10px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:6,
        fontSize:11, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1}}>
      {label}
    </button>
  );

  const activeLabel = IDLE_BUYER_BUCKETS.find(b => b.id === bucket)?.label;

  // Inline mini-chart data — every bucket except "all" so the chart and the
  // chips agree, and clicking a bar sets the active bucket.
  const chartData = IDLE_BUYER_BUCKETS.filter(b => b.id !== 'all').map(b => ({
    id: b.id,
    label: b.label,
    count: bucketCounts[b.id] || 0,
    isActive: bucket === b.id,
  }));

  return (
    <div>
      {/* Inline distribution chart — visible without toggling to Chart view */}
      <div style={{padding:'10px 18px 0'}}>
        <div style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4}}>
          Distribution by days since last login
        </div>
        <div style={{height:90}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{top:6,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={28}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="count" name="Idle buyers" radius={[4,4,0,0]} barSize={22} isAnimationActive={false}
                onClick={(d) => d?.id && setBucket(d.id)} cursor="pointer">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.isActive ? AMBER : `${AMBER}88`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bucket chips — same data, mirrors the chart */}
      <div style={{padding:'10px 18px 0', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
        <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginRight:4}}>Days since last login</span>
        {IDLE_BUYER_BUCKETS.map(b => {
          const isActive = bucket === b.id;
          const count = bucketCounts[b.id] || 0;
          if (b.id !== 'all' && count === 0) return null;
          return (
            <button key={b.id} onClick={() => setBucket(b.id)}
              style={{
                height:26, padding:'0 10px', borderRadius:99, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background: isActive ? AMBER : '#f1f5f9',
                color:      isActive ? '#fff' : '#475569',
              }}>
              {b.label}
              <span style={{
                marginLeft:5, fontSize:10, fontWeight:700,
                background: isActive ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                color:      isActive ? '#fff' : '#94a3b8',
                padding:'1px 6px', borderRadius:99,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{padding:'10px 18px', borderBottom:'1px solid #f1f5f9', display:'flex',
        justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
        <span style={{fontSize:11, color:'#475569', fontWeight:600}}>
          {filteredRows.length === 0
            ? bucket === 'all' ? 'No idle buyers right now.' : 'No buyers match this bucket.'
            : `${(safePage-1)*PER + 1}–${Math.min(safePage*PER, filteredRows.length)} of ${filteredRows.length}${bucket !== 'all' ? ` (${rows.length} total)` : ''}`}
        </span>
        <button onClick={handleDownload} disabled={filteredRows.length === 0}
          style={{display:'inline-flex', alignItems:'center', gap:6, padding:'7px 12px',
            background: filteredRows.length === 0 ? '#f1f5f9' : AMBER,
            color:      filteredRows.length === 0 ? '#94a3b8' : '#fff',
            border:'none', borderRadius:7, fontSize:11, fontWeight:700,
            cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          Download CSV ({filteredRows.length}{bucket !== 'all' ? ` · ${activeLabel}` : ''})
        </button>
      </div>

      {/* Table */}
      <div style={{maxHeight: 380, overflowY:'auto'}}>
        <table className="senda-table" style={{width:'100%'}}>
          <thead>
            <tr>
              <th>User</th><th>Phone</th><th>Last Seen</th><th>Purchases</th><th>Total Spent</th><th style={{width:30}}/>
            </tr>
          </thead>
          <tbody>
            {paged.map((u, i) => {
              const key  = u.id || u.email || `r${(safePage-1)*PER + i}`;
              const isOpen = openKey === key;
              const days = u.last_seen_at ? Math.floor((now - new Date(u.last_seen_at).getTime()) / DAY) : null;
              const st   = statsFor(u);
              return (
                <React.Fragment key={key}>
                  <tr onClick={() => setOpenKey(isOpen ? null : key)}
                    style={{cursor:'pointer', background: isOpen ? '#fffbeb' : undefined, transition:'background .12s'}}
                    title={isOpen ? 'Click to collapse' : 'Click for details'}>
                    <td>
                      <div style={{fontWeight:600,fontSize:12,color:'#0f172a',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name || '—'}</div>
                      <div style={{fontSize:10,color:'#94a3b8',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email || '—'}</div>
                    </td>
                    <td style={{fontSize:11, color:'#475569', fontFamily:'ui-monospace, Menlo, monospace', whiteSpace:'nowrap'}}>{u.phone || '—'}</td>
                    <td style={{fontSize:11, color:'#64748b', whiteSpace:'nowrap'}}>
                      {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'Never'}
                      {days != null && <div style={{fontSize:10,color:AMBER,fontWeight:700}}>{days} d ago</div>}
                    </td>
                    <td style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{st.count}</td>
                    <td style={{fontSize:12,fontWeight:700,color:GREEN,whiteSpace:'nowrap'}}>{st.total.toLocaleString()} TZS</td>
                    <td style={{textAlign:'center', fontWeight:700, color: isOpen ? AMBER : '#cbd5e1', userSelect:'none'}}>{isOpen ? '▾' : '▸'}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} style={{padding:'14px 18px', background:'#f8fafc', borderTop:`2px solid ${AMBER}`, borderBottom:'1px solid #e2e8f0'}}>
                        <DetailGrid fields={[
                          ...userDetailFields(u),
                          { label:'Days idle',        value: days === null ? 'Never seen' : <span style={{color:AMBER, fontWeight:700}}>{days} days</span> },
                          { label:'Successful purchases', value: st.count },
                          { label:'Total spent',      value: <span style={{color:GREEN, fontWeight:700}}>{st.total.toLocaleString()} TZS</span> },
                          { label:'Last purchase',    value: st.lastDate ? new Date(st.lastDate).toLocaleString() : '—' },
                          { label:'Purchase sources', value: st.sources.size ? [...st.sources].join(', ') : '—' },
                        ]}/>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={6} style={{padding:'30px 18px', textAlign:'center', color:'#94a3b8', fontSize:12}}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, borderTop:'1px solid #f1f5f9'}}>
          <span style={{fontSize:11, color:'#94a3b8'}}>Page {safePage} / {totalPages}</span>
          <div style={{display:'flex', gap:4}}>
            {pageBtn('«',      () => setPage(1),                            safePage === 1)}
            {pageBtn('← Prev', () => setPage(p => Math.max(1, p - 1)),      safePage === 1)}
            {pageBtn('Next →', () => setPage(p => Math.min(totalPages, p+1)), safePage === totalPages)}
            {pageBtn('»',      () => setPage(totalPages),                   safePage === totalPages)}
          </div>
        </div>
      )}
    </div>
  );
}

// Buckets mirror the Inactive Users bar-chart so the filter chips match its axis.
const INACTIVE_USER_BUCKETS = [
  { id: 'all',       label: 'All',       min: null, max: null },
  { id: '30-60',     label: '30–60 d',   min: 30,   max: 60 },
  { id: '60-90',     label: '60–90 d',   min: 60,   max: 90 },
  { id: '90-180',    label: '90–180 d',  min: 90,   max: 180 },
  { id: '180+',      label: '180+ d',    min: 180,  max: Infinity },
  { id: 'never',     label: 'Never',     min: null, max: null }, // never logged in
  { id: 'suspended', label: 'Suspended', min: null, max: null }, // suspended account
];

const matchesUserBucket = (u, bucketId) => {
  if (bucketId === 'all') return true;
  if (bucketId === 'suspended') return (u.status || '').toLowerCase() === 'suspended';
  // For day-range buckets, suspended users are excluded so they don't double-count.
  if ((u.status || '').toLowerCase() === 'suspended') return false;
  if (bucketId === 'never') return !u.last_seen_at;
  if (!u.last_seen_at) return false;
  const b = INACTIVE_USER_BUCKETS.find(x => x.id === bucketId);
  if (!b || b.min == null) return true;
  const days = Math.floor((Date.now() - new Date(u.last_seen_at).getTime()) / 86400000);
  return days >= b.min && days <= b.max;
};

function InactiveUsersTable({ rows }) {
  const [page, setPage]       = useState(1);
  const [openKey, setOpenKey] = useState(null);
  const [bucket, setBucket]   = useState('all');
  const PER = 15;
  const DAY = 86400000;
  const now = Date.now();

  useEffect(() => { setPage(1); }, [rows.length, bucket]);

  const filteredRows = React.useMemo(
    () => rows.filter(u => matchesUserBucket(u, bucket)),
    [rows, bucket]
  );

  const bucketCounts = React.useMemo(() => {
    const counts = {};
    INACTIVE_USER_BUCKETS.forEach(b => {
      counts[b.id] = b.id === 'all' ? rows.length : rows.filter(u => matchesUserBucket(u, b.id)).length;
    });
    return counts;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER));
  const safePage   = Math.min(page, totalPages);
  const paged      = filteredRows.slice((safePage - 1) * PER, safePage * PER);

  const handleDownload = () => {
    if (filteredRows.length === 0) return;
    const headers = ['Name','Email','Phone','Status','Last Seen','Days Idle','Joined','User ID','SMS Sent','Balance (TZS)'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    filteredRows.forEach(u => {
      const days = u.last_seen_at ? Math.floor((now - new Date(u.last_seen_at).getTime()) / DAY) : null;
      const idle = (u.status || '').toLowerCase() === 'suspended' ? 'Suspended'
                 : days === null ? 'Never'
                 : String(days);
      lines.push([
        u.name || '',
        u.email || '',
        u.phone || '',
        u.status || '',
        u.last_seen_at ? new Date(u.last_seen_at).toISOString().slice(0,10) : '',
        idle,
        u.joined_at ? new Date(u.joined_at).toISOString().slice(0,10) : '',
        u.id || '',
        u.sms_sent ?? 0,
        u.balance ?? 0,
      ].map(escape).join(','));
    });
    const bucketTag = bucket === 'all' ? 'all' : bucket.replace(/[^a-z0-9-]/gi, '');
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inactive-users-${bucketTag}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pageBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled}
      style={{padding:'4px 10px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:6,
        fontSize:11, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1}}>
      {label}
    </button>
  );

  const activeBucketLabel = INACTIVE_USER_BUCKETS.find(b => b.id === bucket)?.label;

  return (
    <div>
      {/* Bucket filter chips — match the chart's axis */}
      <div style={{padding:'10px 18px 0', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
        <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginRight:4}}>Inactivity range</span>
        {INACTIVE_USER_BUCKETS.map(b => {
          const isActive = bucket === b.id;
          const count    = bucketCounts[b.id] || 0;
          if (b.id !== 'all' && count === 0) return null;
          return (
            <button key={b.id} onClick={() => setBucket(b.id)}
              style={{
                height:26, padding:'0 10px', borderRadius:99, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background: isActive ? RED : '#f1f5f9',
                color:      isActive ? '#fff' : '#475569',
                transition:'background .12s, color .12s',
              }}>
              {b.label}
              <span style={{
                marginLeft:5, fontSize:10, fontWeight:700,
                background: isActive ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                color:      isActive ? '#fff' : '#94a3b8',
                padding:'1px 6px', borderRadius:99,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar — counts + download */}
      <div style={{padding:'10px 18px', borderBottom:'1px solid #f1f5f9', display:'flex',
        justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
        <span style={{fontSize:11, color:'#475569', fontWeight:600}}>
          {filteredRows.length === 0
            ? bucket === 'all' ? 'No inactive users.' : 'No users match this bucket.'
            : `${(safePage-1)*PER + 1}–${Math.min(safePage*PER, filteredRows.length)} of ${filteredRows.length}${bucket !== 'all' ? ` (${rows.length} total)` : ''}`}
        </span>
        <button onClick={handleDownload} disabled={filteredRows.length === 0}
          style={{display:'inline-flex', alignItems:'center', gap:6, padding:'7px 12px',
            background: filteredRows.length === 0 ? '#f1f5f9' : RED,
            color:      filteredRows.length === 0 ? '#94a3b8' : '#fff',
            border:'none', borderRadius:7, fontSize:11, fontWeight:700,
            cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          Download CSV ({filteredRows.length}{bucket !== 'all' ? ` · ${activeBucketLabel}` : ''})
        </button>
      </div>

      {/* Table */}
      <div style={{maxHeight: 380, overflowY:'auto'}}>
        <table className="senda-table" style={{width:'100%'}}>
          <thead>
            <tr>
              <th>User</th><th>Email</th><th>Phone</th><th>Last Seen</th><th>Status</th><th style={{width:30}}/>
            </tr>
          </thead>
          <tbody>
            {paged.map((u, i) => {
              const key    = u.id || u.email || `r${(safePage-1)*PER + i}`;
              const isOpen = openKey === key;
              const days   = u.last_seen_at ? Math.floor((now - new Date(u.last_seen_at).getTime()) / DAY) : null;
              const reason = (u.status||'').toLowerCase() === 'suspended' ? 'Suspended account'
                           : days === null ? 'Has never logged in'
                           : `${days} days since last seen`;
              return (
                <React.Fragment key={key}>
                  <tr onClick={() => setOpenKey(isOpen ? null : key)}
                    style={{cursor:'pointer', background: isOpen ? '#fef2f2' : undefined, transition:'background .12s'}}
                    title={isOpen ? 'Click to collapse' : 'Click for details'}>
                    <td style={{fontWeight:600, fontSize:12, color:'#0f172a'}}>{u.name || '—'}</td>
                    <td style={{fontSize:11, color:'#64748b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.email || '—'}</td>
                    <td style={{fontSize:11, color:'#475569', fontFamily:'ui-monospace, Menlo, monospace', whiteSpace:'nowrap'}}>{u.phone || '—'}</td>
                    <td style={{fontSize:11, color:'#64748b', whiteSpace:'nowrap'}}>{u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'Never'}</td>
                    <td><Badge status={u.status}/></td>
                    <td style={{textAlign:'center', fontWeight:700, color: isOpen ? RED : '#cbd5e1', userSelect:'none'}}>{isOpen ? '▾' : '▸'}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} style={{padding:'14px 18px', background:'#f8fafc', borderTop:`2px solid ${RED}`, borderBottom:'1px solid #e2e8f0'}}>
                        <DetailGrid fields={[
                          ...userDetailFields(u),
                          { label:'Reason inactive', value: <span style={{color:RED, fontWeight:700}}>{reason}</span> },
                        ]}/>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={6} style={{padding:'30px 18px', textAlign:'center', color:'#94a3b8', fontSize:12}}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, borderTop:'1px solid #f1f5f9'}}>
          <span style={{fontSize:11, color:'#94a3b8'}}>Page {safePage} / {totalPages}</span>
          <div style={{display:'flex', gap:4}}>
            {pageBtn('«',      () => setPage(1),                              safePage === 1)}
            {pageBtn('← Prev', () => setPage(p => Math.max(1, p - 1)),        safePage === 1)}
            {pageBtn('Next →', () => setPage(p => Math.min(totalPages, p+1)), safePage === totalPages)}
            {pageBtn('»',      () => setPage(totalPages),                     safePage === totalPages)}
          </div>
        </div>
      )}
    </div>
  );
}

// Buckets must mirror the chart's `approvedAgeBuckets` so the filter labels match
// what the user sees on the chart axis.
const APPROVED_AGE_BUCKETS = [
  { id: 'all',     label: 'All',     min: null, max: null },
  { id: 'lt7',     label: '< 7 d',   min: 0,    max: 7 },
  { id: '7-30',    label: '7–30 d',  min: 7,    max: 30 },
  { id: '30-60',   label: '30–60 d', min: 30,   max: 60 },
  { id: '60-90',   label: '60–90 d', min: 60,   max: 90 },
  { id: '90+',     label: '90+ d',   min: 90,   max: Infinity },
  { id: 'unknown', label: 'Unknown', min: null, max: null },
];

const matchesBucket = (s, bucketId) => {
  if (bucketId === 'all') return true;
  const ts = s.approved_at || s.created_at;
  if (bucketId === 'unknown') return !ts;
  if (!ts) return false;
  const b = APPROVED_AGE_BUCKETS.find(x => x.id === bucketId);
  if (!b) return true;
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return days >= b.min && days <= b.max;
};

function ApprovedNoPaymentTable({ rows, users, partners = [] }) {
  const [page, setPage] = useState(1);
  const [openKey, setOpenKey] = useState(null);
  const [bucket, setBucket]  = useState('all');
  const PER = 15;

  // Reset to page 1 when source data or filter changes.
  useEffect(() => { setPage(1); }, [rows.length, bucket]);

  // Apply bucket filter once; everything else (counts, paging, CSV) flows from this.
  const filteredRows = React.useMemo(
    () => rows.filter(s => matchesBucket(s, bucket)),
    [rows, bucket]
  );

  // Per-chip counts so the filter pills show how many rows fall in each bucket.
  const bucketCounts = React.useMemo(() => {
    const counts = {};
    APPROVED_AGE_BUCKETS.forEach(b => {
      counts[b.id] = b.id === 'all' ? rows.length : rows.filter(s => matchesBucket(s, b.id)).length;
    });
    return counts;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER));
  const safePage   = Math.min(page, totalPages);
  const paged      = filteredRows.slice((safePage - 1) * PER, safePage * PER);

  const lookupOwner = React.useMemo(() => buildOwnerResolver(users, partners), [users, partners]);

  const handleDownload = () => {
    if (filteredRows.length === 0) return;
    const headers = ['Sender Name','Owner Name','Owner Email','Phone','Partner Network','Source','Approved Date','Sender ID'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    filteredRows.forEach(s => {
      const u  = lookupOwner(s);
      const ts = s.approved_at || s.created_at;
      lines.push([
        s.name || s.sender_name || s.sender_id || '',
        u?.name || '',
        s.user_email || s.owner_email || u?.email || '',
        u?.phone || '',
        u?._partner_name || (u?._source === 'partner_unmatched' ? '(via partner email)' : ''),
        u?._source === 'partner_customer' ? 'Partner customer'
          : u?._source === 'partner_unmatched' ? 'Partner-owned (customer not matched)'
          : u?._source === 'direct_user' ? 'Direct user'
          : 'Unmatched',
        ts ? new Date(ts).toISOString().slice(0, 10) : '',
        s.id || s.sender_id || '',
      ].map(escape).join(','));
    });
    // Filename reflects the active bucket so files don't collide.
    const bucketTag = bucket === 'all' ? 'all' : bucket.replace(/[^a-z0-9-]/gi, '');
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-sender-no-credits-${bucketTag}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pageBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled}
      style={{padding:'4px 10px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:6,
        fontSize:11, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1}}>
      {label}
    </button>
  );

  return (
    <div>
      {/* Bucket filter chips — match the chart's day-range axis */}
      <div style={{padding:'10px 18px 0', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
        <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginRight:4}}>Days since approval</span>
        {APPROVED_AGE_BUCKETS.map(b => {
          const isActive = bucket === b.id;
          const count    = bucketCounts[b.id] || 0;
          // Hide buckets with zero rows except 'all' (always shown)
          if (b.id !== 'all' && count === 0) return null;
          return (
            <button key={b.id} onClick={()=>setBucket(b.id)}
              style={{
                height:26, padding:'0 10px', borderRadius:99, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background: isActive ? '#6366f1' : '#f1f5f9',
                color:      isActive ? '#fff'    : '#475569',
                transition:'background .12s, color .12s',
              }}>
              {b.label}
              <span style={{
                marginLeft:5, fontSize:10, fontWeight:700,
                background: isActive ? 'rgba(255,255,255,.25)' : '#e2e8f0',
                color:      isActive ? '#fff' : '#94a3b8',
                padding:'1px 6px', borderRadius:99,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar — counts + download */}
      <div style={{padding:'10px 18px', borderBottom:'1px solid #f1f5f9', display:'flex',
        justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
        <span style={{fontSize:11, color:'#475569', fontWeight:600}}>
          {filteredRows.length === 0
            ? bucket === 'all' ? 'No senders to show.' : 'No senders match this bucket.'
            : `${(safePage-1)*PER + 1}–${Math.min(safePage*PER, filteredRows.length)} of ${filteredRows.length}${bucket !== 'all' ? ` (${rows.length} total)` : ''}`}
        </span>
        <button onClick={handleDownload} disabled={filteredRows.length === 0}
          style={{display:'inline-flex', alignItems:'center', gap:6, padding:'7px 12px',
            background: filteredRows.length === 0 ? '#f1f5f9' : '#6366f1',
            color:      filteredRows.length === 0 ? '#94a3b8' : '#fff',
            border:'none', borderRadius:7, fontSize:11, fontWeight:700,
            cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          Download CSV ({filteredRows.length}{bucket !== 'all' ? ` · ${APPROVED_AGE_BUCKETS.find(b=>b.id===bucket)?.label || ''}` : ''})
        </button>
      </div>

      {/* Table */}
      <div style={{maxHeight: 380, overflowY:'auto'}}>
        <table className="senda-table" style={{width:'100%'}}>
          <thead>
            <tr>
              <th>Sender</th><th>Owner</th><th>Phone</th><th>Approved</th><th style={{width:30}}/>
            </tr>
          </thead>
          <tbody>
            {paged.map((s, i) => {
              const key    = s.id || `r${(safePage-1)*PER + i}`;
              const isOpen = openKey === key;
              const u      = lookupOwner(s);
              const ts     = s.approved_at || s.created_at;
              return (
                <React.Fragment key={key}>
                  <tr
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    style={{cursor:'pointer', background: isOpen ? '#eff6ff' : undefined, transition:'background .12s'}}
                    title={isOpen ? 'Click to collapse' : 'Click for details'}
                  >
                    <td style={{fontWeight:700, fontSize:12, color:'#0f172a'}}>{s.name || s.sender_name || s.sender_id || '—'}</td>
                    <td style={{fontSize:11, color:'#64748b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u?.name || s.user_email || s.user || s.owner || '—'}</span>
                        {u?._source === 'partner_customer' && (
                          <span title={`Partner customer of ${u._partner_name}`}
                            style={{flexShrink:0,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#fef3c7',color:'#92400e',letterSpacing:'.04em'}}>
                            P
                          </span>
                        )}
                        {u?._source === 'partner_unmatched' && (
                          <span title={`Owned via partner email ${u._partner_email} but no customer matched`}
                            style={{flexShrink:0,fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#fef2f2',color:'#b91c1c',letterSpacing:'.04em'}}>
                            P?
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{fontSize:11, color:'#475569', fontFamily:'ui-monospace, Menlo, monospace', whiteSpace:'nowrap'}}>{u?.phone || '—'}</td>
                    <td style={{fontSize:11, color:'#64748b', whiteSpace:'nowrap'}}>{ts ? new Date(ts).toLocaleDateString() : '—'}</td>
                    <td style={{textAlign:'center', fontWeight:700, color: isOpen ? '#6366f1' : '#cbd5e1', userSelect:'none'}}>{isOpen ? '▾' : '▸'}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} style={{padding:'14px 18px', background:'#f8fafc', borderTop:'2px solid #6366f1', borderBottom:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:10, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6}}>Sender</div>
                        <DetailGrid fields={[
                          { label:'Sender Name', value: s.name || s.sender_name || s.sender_id },
                          { label:'Sender ID',   value: s.id || s.sender_id },
                          { label:'Status',      value: <Badge status={s.status || 'approved'}/> },
                          { label:'Approved on', value: ts ? new Date(ts).toLocaleString() : '—' },
                        ]}/>
                        <div style={{fontSize:10, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.06em', marginTop:14, marginBottom:6}}>
                          {u?._source === 'partner_customer' ? `Owner · resolved via partner ${u._partner_name}` : `Owner ${u ? '' : '(not in loaded sample)'}`}
                        </div>
                        {u && u._source !== 'partner_customer' ? (
                          <DetailGrid fields={userDetailFields(u)}/>
                        ) : u ? (
                          <DetailGrid fields={[
                            { label:'Customer Name', value: u.name },
                            { label:'Phone',         value: u.phone },
                            { label:'Email',         value: u.email },
                            { label:'Tenant ID',     value: u._tenant_id },
                            { label:'Partner',       value: u._partner_name },
                            { label:'Partner Email', value: u._partner_email },
                          ]}/>
                        ) : (
                          <DetailGrid fields={[
                            { label:'Owner ID',    value: s.user_id || s.user },
                            { label:'Owner Email', value: s.user_email || s.owner },
                          ]}/>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={5} style={{padding:'30px 18px', textAlign:'center', color:'#94a3b8', fontSize:12}}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{padding:'10px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, borderTop:'1px solid #f1f5f9'}}>
          <span style={{fontSize:11, color:'#94a3b8'}}>Page {safePage} / {totalPages}</span>
          <div style={{display:'flex', gap:4}}>
            {pageBtn('«',      () => setPage(1),                        safePage === 1)}
            {pageBtn('← Prev', () => setPage(p => Math.max(1, p-1)),    safePage === 1)}
            {pageBtn('Next →', () => setPage(p => Math.min(totalPages, p+1)), safePage === totalPages)}
            {pageBtn('»',      () => setPage(totalPages),               safePage === totalPages)}
          </div>
        </div>
      )}
    </div>
  );
}

// Year filter chips — used by Panel 1 (Registrations) so admins can scope the
// chart and per-month rows to a specific year, e.g. "2025" or "2026", or
// "All years" to keep the lifetime-spanning view.
function RegYearChips({ years = [], value, onChange }) {
  return (
    <div style={{padding:'10px 18px 0', display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
      <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginRight:4}}>Year</span>
      <button onClick={() => onChange(null)}
        style={{
          height:26, padding:'0 12px', borderRadius:99, border:'none', cursor:'pointer',
          fontSize:11, fontWeight:600,
          background: value == null ? '#2563EB' : '#f1f5f9',
          color:      value == null ? '#fff'    : '#475569',
        }}>
        All years
      </button>
      {years.map(yr => {
        const isActive = value === yr;
        return (
          <button key={yr} onClick={() => onChange(yr)}
            style={{
              height:26, padding:'0 12px', borderRadius:99, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:600,
              background: isActive ? '#2563EB' : '#f1f5f9',
              color:      isActive ? '#fff'    : '#475569',
            }}>
            {yr}
          </button>
        );
      })}
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────
// Eight admin signals, each with a Chart/Table toggle:
//  1. Registrations (daily / weekly / monthly)
//  2. Paid vs Unpaid this month
//  3. Buyers inactive > 7 days
//  4. Total messages sent (monthly volume)
//  5. Inactive users (last_seen_at > 30d or suspended)
//  6. Failed messages (delivery breakdown)
//  7. Revenue (total + monthly)
//  8. Approved sender · no payment
function InsightsTab() {
  const { onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [period, setPeriod]   = useState('current_year');
  // "Our users only" — strip partner-owner emails (Swahilis et al) from every
  // client-side computation. Defaults ON because that's the typical admin lens.
  const [excludePartners, setExcludePartners] = useState(true);
  // Registrations year filter — null = all years, else only that year's months.
  const [regYearFilter, setRegYearFilter] = useState(null);
  const [stats, setStats]               = useState(null);
  const [seriesReg, setSeriesReg]       = useState([]); // registrations_monthly
  const [seriesPay, setSeriesPay]       = useState([]); // paying_vs_non_paying_monthly
  const [seriesRev, setSeriesRev]       = useState([]); // revenue_monthly
  const [generatedAt, setGeneratedAt]   = useState(null);
  const [monthlySMS, setMonthlySMS]     = useState([]);
  const [users, setUsers]               = useState([]);
  const [usersMeta, setUsersMeta]       = useState({});
  const [senderIds, setSenderIds]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [partners, setPartners]         = useState([]);

  const fetchAll = useCallback(() => {
    const year = new Date().getFullYear();
    setLoading(true);
    setError(null);
    const optional = (p) => p.catch(() => ({ success:false }));

    // /analytics/summary is the single source of truth for KPIs + the 3 monthly series.
    // Per docs we MUST NOT pair it with /analytics/users/growth or /analytics/revenue/monthly
    // — they desync. The other endpoints are auxiliary (for drill-down lists / per-month SMS).
    Promise.all([
      adminFetch(`/analytics/summary?period=${period}`, {}, onLogout),
      optional(adminFetch(`/analytics/sms/monthly?year=${year}`, {}, onLogout)),
      adminFetch(`/users?limit=500&page=1`, {}, onLogout),
      adminFetch(`/sender-ids?status=approved&limit=200&page=1`, {}, onLogout),
      adminFetch(`/transactions?limit=500&page=1&status=success`, {}, onLogout),
      optional(adminFetch(`/partners`, {}, onLogout)),
    ]).then(([s, ms, u, sid, tx, pr]) => {
      if (s.success) {
        setStats(s.data?.stats || null);
        const series = s.data?.series || {};
        setSeriesReg(series.registrations_monthly || []);
        setSeriesPay(series.paying_vs_non_paying_monthly || []);
        setSeriesRev(series.revenue_monthly || []);
        setGeneratedAt(s.data?.generated_at || null);
      }
      if (ms?.success) setMonthlySMS(ms.data || []);
      if (u.success)   { setUsers(u.data || []); setUsersMeta(u.meta || {}); }
      if (sid.success) setSenderIds(sid.data || []);
      if (tx.success)  setTransactions(tx.data || []);
      if (pr?.success) setPartners(pr.data || []);

      // Don't gate the warning on the optional fetches.
      const anyFailed = [s,u,sid,tx].some(x => !x.success);
      if (anyFailed) setError('Some metrics could not be loaded — partial view shown.');
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derive metrics ─────────────────────────────────────────────────────────
  // Per the /analytics/summary docs: read stats.<key>.value for math, .label for display.
  // Lists for drill-down still come from /users, /sender-ids, /transactions.
  const now = Date.now();
  const DAY = 86400000;

  // Helper: read stat value with safe fallback.
  const stat = (key, fallback = 0) => stats?.[key]?.value ?? fallback;
  const statLabel = (key) => stats?.[key]?.label;

  // ── Partner exclusion ─────────────────────────────────────────────────────
  // Build a set of partner-owner emails so we can strip them from every
  // client-side computation when "Our users only" is enabled.
  const partnerEmails = React.useMemo(
    () => getPartnerOwnerEmails(partners),
    [partners]
  );
  const isPartnerUser = (u) => partnerEmails.has(String(u?.email || '').toLowerCase());
  const isPartnerSender = (s) => {
    const e = String(s?.owner_email || s?.user_email || '').toLowerCase();
    return partnerEmails.has(e);
  };
  const isPartnerTx = (t) => {
    const e = String(t?.user_email || '').toLowerCase();
    return partnerEmails.has(e);
  };

  const filteredUsers     = excludePartners ? users.filter(u => !isPartnerUser(u))      : users;
  const filteredSenderIds = excludePartners ? senderIds.filter(s => !isPartnerSender(s)): senderIds;
  const filteredTx        = excludePartners ? transactions.filter(t => !isPartnerTx(t)) : transactions;

  // Some KPIs come from the server (which counts ALL users). When excluding partners
  // we recompute the user-related ones client-side so the headline matches the table.
  // Server stats stay authoritative for SMS/revenue (platform-wide metrics anyway).

  // 1. Registrations — server-provided when "all", client-derived from joined_at when filtering.
  const regToday   = excludePartners
    ? filteredUsers.filter(u => u.joined_at && (now - new Date(u.joined_at).getTime()) < DAY).length
    : stat('registrations_today');
  const regWeek    = excludePartners
    ? filteredUsers.filter(u => u.joined_at && (now - new Date(u.joined_at).getTime()) < 7*DAY).length
    : stat('registrations_this_week');
  const regMonth   = excludePartners
    ? filteredUsers.filter(u => u.joined_at && (now - new Date(u.joined_at).getTime()) < 30*DAY).length
    : stat('registrations_this_month');
  const totalUsers = excludePartners
    ? filteredUsers.length
    : stat('total_users', usersMeta.total ?? users.length);

  // 2. Paying vs non-paying — when excluding partners, derive from filtered transactions
  // (a "paying user" = at least one completed credit purchase) so partner-account
  // payments don't inflate the conversion number.
  // Definition: PAID = at least one transaction with status completed/success (any source,
  // including Sender-ID registration fees). UNPAID = no successful transaction ever
  // (only failed attempts, or never paid).
  let paidCount, unpaidCount;
  if (excludePartners) {
    const buyerIds = new Set();
    filteredTx.forEach(t => {
      const status = String(t.status || '').toLowerCase();
      if (status && status !== 'completed' && status !== 'success') return;
      const id = t.user_id || t.user || t.user_email;
      if (id) buyerIds.add(id);
    });
    paidCount   = filteredUsers.filter(u => buyerIds.has(u.id) || buyerIds.has(u.email)).length;
    unpaidCount = Math.max(filteredUsers.length - paidCount, 0);
  } else {
    paidCount   = stat('paying_users');
    unpaidCount = stat('non_paying_users', Math.max(totalUsers - paidCount, 0));
  }
  const conversionPct = totalUsers ? Math.round(paidCount / totalUsers * 100) : 0;

  // 3. Buyers inactive >7d — list always derived from filtered users + transactions.
  const buyerIdsAll = new Set(filteredTx.map(t => t.user_id || t.user || t.user_email).filter(Boolean));
  const inactiveBuyers = filteredUsers.filter(u => {
    const id = u.id || u.email;
    if (!buyerIdsAll.has(id)) return false;
    if (!u.last_seen_at) return true;
    return (now - new Date(u.last_seen_at).getTime()) > 7*DAY;
  });
  const idleBuyersCount = excludePartners ? inactiveBuyers.length : stat('purchasers_inactive_7d');

  // 4. Total messages sent — platform-wide; server is authoritative either way.
  const smsSent      = stat('sms_sent');
  const smsAllTime   = stat('total_messages_all_time');

  // 5. Inactive users — list from filtered users; headline from server unless filtering.
  const inactiveUsers = filteredUsers.filter(u => {
    if (u.status === 'suspended') return true;
    if (!u.last_seen_at) return true;
    return (now - new Date(u.last_seen_at).getTime()) > 30*DAY;
  });
  const inactiveUsersCount = excludePartners ? inactiveUsers.length : stat('inactive_users');
  const inactivePct = totalUsers ? Math.round((inactiveUsersCount / totalUsers) * 100) : 0;

  // 6. Failed messages — derive period delivery breakdown from summary stats.
  const failed       = stat('failed_messages');
  const failedAll    = stat('failed_messages_all_time');
  const failRatePct  = stats?.delivery_fail_rate?.value ?? null; // server-provided %
  const deliveredApprox = Math.max(smsSent - failed, 0);
  const totalDel = smsSent;
  const failPct  = failRatePct != null ? failRatePct.toFixed(1) : (totalDel ? ((failed / totalDel) * 100).toFixed(1) : '0.0');
  const deliveryArr = [
    { name:'Delivered', value: deliveredApprox, color: GREEN },
    { name:'Failed',    value: failed,          color: RED   },
  ].filter(d => d.value > 0);

  // 7. Revenue — period & all-time both from server.
  const totalRevenue   = stat('total_revenue_all_time');
  const periodRevenue  = stat('revenue_tzs');
  // "This month" revenue = the latest entry of revenue_monthly (last index).
  const thisMonthRev = seriesRev.length ? Number(seriesRev[seriesRev.length - 1].amount || 0) : 0;

  // 8. Approved sender · no payment.
  // Three-way join: filteredUsers ⨝ filteredSenderIds ⨝ filteredTx.
  //   1. Index OUR users by id and lowercased email.
  //   2. Build the credit-buyer set from filteredTx (completed, non-sender-fee).
  //   3. Take only senders whose owner exists in OUR user index AND is not in the buyer set.
  // Effect: partner-account approvals (owner_email = developer@swahilies.com) are dropped
  // entirely, and remaining approved senders surface their owners' contact info.
  const userByKey = new Map();
  filteredUsers.forEach(u => {
    if (u.id)    userByKey.set(u.id, u);
    if (u.email) userByKey.set(String(u.email).toLowerCase(), u);
  });

  const creditBuyerIds    = new Set();
  const creditBuyerEmails = new Set();
  filteredTx.forEach(t => {
    if (t.source === 'senderid_request_payment') return;
    const status = String(t.status || '').toLowerCase();
    if (status && status !== 'completed' && status !== 'success') return;
    const id    = t.user_id || t.user;
    const email = t.user_email;
    if (id)    creditBuyerIds.add(id);
    if (email) creditBuyerEmails.add(String(email).toLowerCase());
  });

  const approvedNoPayment = filteredSenderIds.filter(s => {
    if (s.status && String(s.status).toLowerCase() !== 'approved') return false;
    const ownerId    = s.owner_id || s.user_id || s.user || s.owner;
    const ownerEmail = String(s.user_email || s.owner_email || s.email || '').toLowerCase();
    // Owner MUST be one of OUR users (filteredUsers excludes partner emails).
    const ownerIsOurUser = (ownerId && userByKey.has(ownerId)) || (ownerEmail && userByKey.has(ownerEmail));
    if (!ownerIsOurUser) return false;
    // ...and must not appear in the credit-buyer set.
    if (ownerId    && creditBuyerIds.has(ownerId))       return false;
    if (ownerEmail && creditBuyerEmails.has(ownerEmail)) return false;
    return true;
  });

  // ── Monthly series (all from /analytics/summary `series.*`) ──────────────
  // Server returns 12 contiguous months ending in current month; no gap-fill needed.
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearNow = new Date().getFullYear();

  // Registrations series — derived directly from the user roster so the chart,
  // counts, and drill-down lists always agree on the same data source.
  // Window: earliest joined_at → current month (full system lifetime, not just
  // trailing 12 months). If only the last 12 months have data the chart still
  // looks identical, but if the system is younger the chart shows fewer months
  // (e.g. just Feb→May for a 4-month-old install) and never shows empty leading
  // months. The audience toggle picks which roster (filteredUsers vs all users).
  const regSeries = (() => {
    const sourceUsers = excludePartners ? filteredUsers : users;
    if (sourceUsers.length === 0) return [];

    let earliest = null;
    sourceUsers.forEach(u => {
      if (!u.joined_at) return;
      const d = new Date(u.joined_at);
      if (Number.isNaN(d.getTime())) return;
      if (!earliest || d < earliest) earliest = d;
    });
    if (!earliest) return [];

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const endNow = new Date();
    let yr = earliest.getFullYear();
    let m  = earliest.getMonth();
    const cells = [];
    // Walk forward month by month until we reach the current calendar month.
    while (yr < endNow.getFullYear() || (yr === endNow.getFullYear() && m <= endNow.getMonth())) {
      cells.push({ year: yr, monthIdx: m + 1, label: MONTH_NAMES[m] });
      m++; if (m > 11) { m = 0; yr++; }
    }

    // Compute monthly counts + a running cumulative total for the trend line.
    let cumulative = 0;
    const showYear = cells[0].year !== cells[cells.length - 1].year;
    return cells.map(({ year, monthIdx, label }) => {
      const start = new Date(year, monthIdx - 1, 1);
      const end   = new Date(year, monthIdx,     1);
      const count = sourceUsers.filter(u => {
        if (!u.joined_at) return false;
        const d = new Date(u.joined_at);
        return d >= start && d < end;
      }).length;
      cumulative += count;
      return {
        month: showYear ? `${label} '${String(year).slice(2)}` : label,
        new_users: count,
        cumulative,
        year,
        monthIdx,
      };
    });
  })();
  // Years present in the registration data — used by the year-filter chips.
  const regYears = React.useMemo(() => {
    const set = new Set();
    regSeries.forEach(r => { if (r.year != null) set.add(r.year); });
    return [...set].sort((a, b) => a - b);
  }, [regSeries]);

  // Year filter chip state. `null` = show all years.
  const visibleRegSeries = regYearFilter == null
    ? regSeries
    : regSeries.filter(r => r.year === regYearFilter);
  const regMax    = Math.max(1, ...visibleRegSeries.map(r => r.new_users || 0));
  const regCumMax = Math.max(1, ...visibleRegSeries.map(r => r.cumulative || 0));

  // Revenue series:
  //  - "All" → server's revenue_monthly (canonical, all platform).
  //  - "Our users only" → derive from filteredTx so chart matches the drill-down list.
  const revenueSeries = excludePartners
    ? (() => {
        const monthsBack = (seriesRev || []).map(r => ({ year: r.year, month: r.month, label: r.label }));
        const fallback = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
        const months = monthsBack.length ? monthsBack : fallback.map((m,i) => ({ year:yearNow, month:i+1, label:m }));
        return months.map(({ year, month, label }) => {
          const start = new Date(year, month - 1, 1);
          const end   = new Date(year, month,     1);
          const amount = filteredTx.reduce((sum, t) => {
            if (!t.created_at) return sum;
            const status = String(t.status || '').toLowerCase();
            if (status && status !== 'completed' && status !== 'success') return sum;
            const d = new Date(t.created_at);
            if (d < start || d >= end) return sum;
            return sum + Number(t.amount || t.total || t.total_price || 0);
          }, 0);
          return { month: label, revenue: amount, value: amount, year, monthIdx: month };
        });
      })()
    : (seriesRev || []).map(r => ({
        month: r.label, revenue: r.amount, value: r.amount, year: r.year, monthIdx: r.month,
      }));
  const revenueMax = Math.max(1, ...revenueSeries.map(r => r.revenue || 0));

  // Paying-vs-non-paying snapshot at end of each month.
  // - "All audience" → server-cumulative series (matches all platform users).
  // - "Our users only" → derive from filteredUsers + filteredTx so partner accounts
  //   don't bias the conversion picture.
  const paidUnpaidSeries = excludePartners
    ? (() => {
        // Build per-month sets from filtered transactions, joined to filtered user roster.
        const monthsBack = (seriesPay || []).map(r => ({ year: r.year, month: r.month, label: r.label }));
        const fallbackMonths = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
        const months = monthsBack.length ? monthsBack : fallbackMonths.map((m,i) => ({ year:yearNow, month:i+1, label:m }));
        return months.map(({ year, month, label }) => {
          const monthEnd = new Date(year, month, 0, 23, 59, 59); // last second of that month
          // Cumulative payers: any filtered tx with status=completed/success AND
          // created_at <= monthEnd. ALL successful transactions count, including
          // Sender-ID registration fees — once a user has paid, they're "paid".
          const payerKey = new Set();
          filteredTx.forEach(t => {
            const status = String(t.status || '').toLowerCase();
            if (status && status !== 'completed' && status !== 'success') return;
            if (!t.created_at) return;
            if (new Date(t.created_at) > monthEnd) return;
            const id = t.user_id || t.user || t.user_email;
            if (id) payerKey.add(id);
          });
          // Cumulative total filtered users: joined_at <= monthEnd
          const total = filteredUsers.filter(u => u.joined_at && new Date(u.joined_at) <= monthEnd).length;
          const paid  = filteredUsers.filter(u => u.joined_at && new Date(u.joined_at) <= monthEnd && (payerKey.has(u.id) || payerKey.has(u.email))).length;
          return { month: label, paid, unpaid: Math.max(total - paid, 0), total, year, monthIdx: month };
        });
      })()
    : (seriesPay || []).map(r => ({
        month: r.label, paid: r.paying || 0, unpaid: r.non_paying || 0, total: r.total || 0,
        year: r.year, monthIdx: r.month,
      }));
  const paidUnpaidMax = Math.max(1, ...paidUnpaidSeries.map(r => Math.max(r.paid, r.unpaid, r.total)));

  // Monthly SMS: still from /analytics/sms/monthly (not part of summary endpoint).
  const smsSeries = monthlySMS.length > 0 ? monthlySMS : MONTH_LABELS.map(m => ({ month:m, sent:0, delivered:0 }));
  const smsMax    = Math.max(1, ...smsSeries.map(m => m.sent || m.value || 0));

  // ── Bucket builders for chart views ────────────────────────────────────────
  const bucketByGap = (rows, gapField, brackets) => {
    const buckets = brackets.map(b => ({ ...b, count: 0 }));
    rows.forEach(r => {
      const ts = r[gapField];
      if (!ts) { const nv = buckets.find(b => b.label === 'Never' || b.label === 'Unknown'); if (nv) nv.count++; return; }
      const days = Math.floor((now - new Date(ts).getTime()) / DAY);
      const b = buckets.find(x => x.min !== -1 && days >= x.min && days <= x.max);
      if (b) b.count++;
    });
    return buckets;
  };
  const inactiveBuyerBuckets = () => bucketByGap(inactiveBuyers, 'last_seen_at', [
    { label:'7–14 d',  min:7,  max:14 },
    { label:'15–30 d', min:15, max:30 },
    { label:'31–60 d', min:31, max:60 },
    { label:'61–90 d', min:61, max:90 },
    { label:'90+ d',   min:91, max:Infinity },
    { label:'Never',   min:-1, max:-1 },
  ]);
  const inactiveUserBuckets = () => {
    const buckets = [
      { label:'30–60 d',  min:30,  max:60,  count:0 },
      { label:'60–90 d',  min:60,  max:90,  count:0 },
      { label:'90–180 d', min:90,  max:180, count:0 },
      { label:'180+ d',   min:180, max:Infinity, count:0 },
      { label:'Never',    min:-1,  max:-1,  count:0 },
      { label:'Suspended',min:-2,  max:-2,  count:0 },
    ];
    inactiveUsers.forEach(u => {
      if (u.status === 'suspended') { buckets[5].count++; return; }
      if (!u.last_seen_at) { buckets[4].count++; return; }
      const days = Math.floor((now - new Date(u.last_seen_at).getTime()) / DAY);
      const b = buckets.find(x => x.min >= 0 && days >= x.min && days <= x.max);
      if (b) b.count++;
    });
    return buckets;
  };
  const approvedAgeBuckets = () => {
    const buckets = [
      { label:'< 7 d',   min:0,  max:7,   count:0 },
      { label:'7–30 d',  min:7,  max:30,  count:0 },
      { label:'30–60 d', min:30, max:60,  count:0 },
      { label:'60–90 d', min:60, max:90,  count:0 },
      { label:'90+ d',   min:90, max:Infinity, count:0 },
      { label:'Unknown', min:-1, max:-1,  count:0 },
    ];
    approvedNoPayment.forEach(s => {
      const ts = s.approved_at || s.created_at;
      if (!ts) { buckets[5].count++; return; }
      const days = Math.floor((now - new Date(ts).getTime()) / DAY);
      const b = buckets.find(x => x.min !== -1 && days >= x.min && days <= x.max);
      if (b) b.count++;
    });
    return buckets;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState label="Loading insights…"/>;

  const KPI = ({ Icon, label, value, sub, color }) => (
    <div className="senda-card" style={{padding:'14px 16px',borderTop:`3px solid ${color}`,minHeight:88}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
        <div style={{width:34,height:34,borderRadius:9,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={17} strokeWidth={2.2} color={color}/>
        </div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1.2,marginBottom:4}}>{label}</div>
          <div style={{fontSize:20,fontWeight:800,color:'#0f172a',lineHeight:1,letterSpacing:'-.5px'}}>{value}</div>
          {sub && <div style={{fontSize:11,color:'#64748b',marginTop:4,lineHeight:1.3}}>{sub}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="senda-fade-in">
      {error && (
        <div style={{padding:'10px 14px',marginBottom:14,background:'#fef3c7',border:`1px solid ${AMBER}`,borderRadius:8,fontSize:12,color:'#78350f'}}>
          {error}
        </div>
      )}

      <div style={{marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap'}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Operational Insights</h3>
          <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>
            One round-trip from <code style={{fontSize:10,color:'#475569'}}>/analytics/summary</code>.
            {generatedAt && <> · Generated {new Date(generatedAt).toLocaleTimeString()}</>}
          </p>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          {/* Audience scope — strips partner-owner emails from every client-side metric. */}
          <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
            <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em'}}>Audience</span>
            {[
              { id:true,  label:'Our users only' },
              { id:false, label:'All (incl. partners)' },
            ].map(opt => {
              const isActive = excludePartners === opt.id;
              return (
                <button key={String(opt.id)} onClick={() => setExcludePartners(opt.id)}
                  title={opt.id ? `Excludes ${partnerEmails.size} partner-owner email${partnerEmails.size!==1?'s':''}` : 'Includes partner-network end-customers'}
                  style={{
                    height:28, padding:'0 11px', borderRadius:7, border:'none', cursor:'pointer',
                    fontSize:11, fontWeight:600,
                    background: isActive ? '#6366f1' : '#f1f5f9',
                    color:      isActive ? '#fff'    : '#64748b',
                    transition:'background .12s',
                  }}>{opt.label}</button>
              );
            })}
          </div>
          {/* Period selector — drives period-scoped stats (sms_sent, failed, revenue_tzs, etc.) */}
          <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
            <span style={{fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em'}}>Period</span>
            {[
              { id:'today',         label:'Today' },
              { id:'current_month', label:'This Month' },
              { id:'last_month',    label:'Last Month' },
              { id:'current_year',  label:'This Year' },
            ].map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                style={{
                  height:28, padding:'0 11px', borderRadius:7, border:'none', cursor:'pointer',
                  fontSize:11, fontWeight:600,
                  background: period === p.id ? BRAND : '#f1f5f9',
                  color:      period === p.id ? '#fff' : '#64748b',
                  transition:'background .12s',
                }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── At-a-glance KPI strip — sourced from stats.<key>.value/.label ── */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${isMobile?160:200}px,1fr))`,gap:12,marginBottom:18}}>
        <KPI Icon={UserCheck}     color={BRAND}     label="Registrations · Today"  value={statLabel('registrations_today') || regToday.toLocaleString()} sub={`${regWeek} this week · ${regMonth} this month`}/>
        <KPI Icon={DollarSign}    color={GREEN}     label="Paying vs Non-Paying"   value={`${paidCount} / ${unpaidCount}`} sub={`${conversionPct}% have paid`}/>
        <KPI Icon={MoonStar}      color={AMBER}     label="Buyers inactive > 7d"   value={(statLabel('purchasers_inactive_7d') || idleBuyersCount).toLocaleString()} sub="Paying users, no recent login"/>
        <KPI Icon={MessageSquare} color={VIOLET}    label="Total Messages Sent"    value={statLabel('sms_sent') || compactNumber(smsSent)} sub={`${compactNumber(smsAllTime)} all time`}/>
        <KPI Icon={UserX}         color={RED}       label="Inactive Users"         value={statLabel('inactive_users') || inactiveUsersCount.toLocaleString()} sub={`${inactivePct}% · last seen > 30d`}/>
        <KPI Icon={AlertTriangle} color={ORANGE}    label="Failed Messages"        value={statLabel('failed_messages') || failed.toLocaleString()} sub={`${failPct}% fail rate · ${failedAll} all time`}/>
        <KPI Icon={Wallet}        color={CYAN}      label="Revenue · All Time"     value={statLabel('total_revenue_all_time') || `${compactNumber(totalRevenue)} TZS`} sub={`${compactNumber(periodRevenue)} TZS this period`}/>
        <KPI Icon={Tag}           color={'#6366f1'} label="Approved · No Credits"  value={(statLabel('approved_unpaid_sender_ids') || approvedNoPayment.length).toLocaleString()} sub="Approved sender, owner never bought credits"/>
      </div>

      {/* ── 8 toggleable panels (chart ⇄ table) ─────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14}}>

        {/* 1 — Registrations */}
        <ToggleablePanel
          title="Registrations · Trend Over Time"
          subtitle={(() => {
            const span = regSeries.length;
            const first = regSeries[0]?.month;
            const last  = regSeries[span - 1]?.month;
            return `Today ${regToday} · Week ${regWeek} · Month ${regMonth}${span ? ` · ${span} month${span!==1?'s':''} (${first} → ${last})` : ''}`;
          })()}
          color={BRAND}
          hasData={regSeries.length > 0 || users.length > 0}
          emptyMsg="No registration data available."
          renderChart={() => (
            <>
              <RegYearChips years={regYears} value={regYearFilter} onChange={setRegYearFilter}/>
              <InsightsChartBox height={300}>
                <ComposedChart data={visibleRegSeries} margin={CHART_MARGIN}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis
                    dataKey="month"
                    label={xAxisTitle(
                      regYearFilter != null
                        ? `Month (${regYearFilter})`
                        : visibleRegSeries[0]?.year !== visibleRegSeries[visibleRegSeries.length-1]?.year
                          ? 'Month (across years)'
                          : `Month (${visibleRegSeries[0]?.year || yearNow})`
                    )}
                    tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    domain={[0, Math.ceil(regMax * 1.2)]}
                    label={yAxisTitle('New users / month')}
                    tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={56}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    domain={[0, Math.ceil(regCumMax * 1.1)]}
                    tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={40}
                  />
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="new_users"
                    name="New / month"
                    stroke={BRAND}
                    fill="url(#regGrad)"
                    strokeWidth={2.5}
                    dot={{r:3, fill:BRAND, stroke:'#fff', strokeWidth:1.5}}
                    activeDot={{r:5}}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative total"
                    stroke={GREEN}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{r:2.5, fill:GREEN}}
                    activeDot={{r:4}}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </InsightsChartBox>
            </>
          )}
          renderTable={() => {
            const yearFilteredSeries = regYearFilter == null ? regSeries : regSeries.filter(r => r.year === regYearFilter);
            const aggregateItems = [
              { __key:'today',  label:'Today',     count: regToday,   filter: u => u.joined_at && (now - new Date(u.joined_at).getTime()) < DAY,    __highlight:true },
              { __key:'week',   label:'This Week', count: regWeek,    filter: u => u.joined_at && (now - new Date(u.joined_at).getTime()) < 7*DAY,   __highlight:true },
              { __key:'month',  label:'This Month',count: regMonth,   filter: u => u.joined_at && (now - new Date(u.joined_at).getTime()) < 30*DAY,  __highlight:true },
              { __key:'all',    label:'All Time',  count: totalUsers, filter: () => true,                                                            __highlight:true },
            ];
            const monthItems = yearFilteredSeries.map((g, i) => {
              // The trailing 12-month series spans years (e.g. Jun 2025 → May 2026),
              // so use the row's own (year, monthIdx) instead of array index.
              const yr  = g.year;
              const m0  = (g.monthIdx ?? (i + 1)) - 1; // 0-based for Date.getMonth()
              return {
                __key:`m-${i}`, label:g.month, count:g.new_users || 0,
                filter: u => {
                  if (!u.joined_at) return false;
                  const d = new Date(u.joined_at);
                  return (yr == null || d.getFullYear() === yr) && d.getMonth() === m0;
                },
              };
            });
            return (
              <>
              <RegYearChips years={regYears} value={regYearFilter} onChange={setRegYearFilter}/>
              <ExpandableTable
                accent={BRAND}
                headers={['Period','Count']}
                items={[...aggregateItems, ...monthItems]}
                renderRow={(item) => (
                  <>
                    <td style={{fontWeight: item.__highlight ? 700 : 600, fontSize:12, color:'#0f172a'}}>{item.label}</td>
                    <td style={{fontSize:12, color: item.__highlight ? BRAND : '#64748b', fontWeight:600}}>{Number(item.count||0).toLocaleString()}</td>
                  </>
                )}
                renderDetail={(item) => {
                  const matched = filteredUsers.filter(item.filter);
                  if (matched.length === 0) return <div style={{fontSize:12, color:'#94a3b8'}}>No registered users in this period (within loaded sample of {users.length}).</div>;
                  return (
                    <div>
                      <div style={{fontSize:11, color:'#475569', marginBottom:8, fontWeight:600}}>
                        Showing {Math.min(matched.length, 10)} of {matched.length} users registered in <span style={{color:BRAND}}>{item.label}</span>
                      </div>
                      <table className="senda-table" style={{width:'100%'}}>
                        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>SMS</th></tr></thead>
                        <tbody>
                          {matched.slice(0,10).map((u,j) => (
                            <tr key={u.id || u.email || j}>
                              <td style={{fontWeight:600,fontSize:12,color:'#0f172a'}}>{u.name || '—'}</td>
                              <td style={{fontSize:11,color:'#64748b',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email || '—'}</td>
                              <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{u.phone || '—'}</td>
                              <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '—'}</td>
                              <td style={{fontSize:11,fontWeight:600,color:'#0f172a'}}>{(u.sms_sent ?? 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }}
              />
              </>
            );
          }}
        />

        {/* 2 — Paid vs Unpaid (per month) */}
        <ToggleablePanel
          title="Paid vs Unpaid · Monthly"
          subtitle={`${paidCount} paid this month · ${conversionPct}% conversion · grouped by month of ${yearNow}`}
          color={GREEN}
          hasData={users.length > 0 || transactions.length > 0}
          emptyMsg="No user or transaction data loaded."
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={paidUnpaidSeries} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="month"
                  label={xAxisTitle(`Month (${yearNow})`)}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, Math.ceil(paidUnpaidMax * 1.2)]}
                  label={yAxisTitle('Users')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={48}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="paid"   name="Paid users"   fill={GREEN}     radius={[3,3,0,0]} barSize={10} isAnimationActive={false}/>
                <Bar dataKey="unpaid" name="Unpaid users" fill={'#cbd5e1'} radius={[3,3,0,0]} barSize={10} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => {
            // ── Period-bounded paid/unpaid analyzer ─────────────────────────
            // For an arbitrary period [start, end):
            //   paid   = users with at least one successful tx in [start, end)
            //   unpaid = users who joined in [start, end) AND have never paid (any time).
            // For "All Time": paid = all paid users ever; unpaid = registered users who never paid.
            const isSuccess = (t) => {
              const s = String(t.status || '').toLowerCase();
              return s === 'completed' || s === 'success';
            };
            const userKeys = (u) => {
              const k = [];
              if (u.id) k.push(u.id);
              if (u.email) k.push(String(u.email).toLowerCase());
              return k;
            };
            // Has-ever-paid index — needed for unpaid detection in any period.
            const paidEverSet = new Set();
            filteredTx.forEach(t => {
              if (!isSuccess(t)) return;
              const id    = t.user_id || t.user;
              const email = String(t.user_email || '').toLowerCase();
              if (id)    paidEverSet.add(id);
              if (email) paidEverSet.add(email);
            });
            const userPaidEver = (u) => userKeys(u).some(k => paidEverSet.has(k));

            const periodStats = (start, end) => {
              const paidIds = new Set();
              filteredTx.forEach(t => {
                if (!isSuccess(t) || !t.created_at) return;
                const d = new Date(t.created_at);
                if (start && d < start) return;
                if (end   && d >= end)  return;
                const id    = t.user_id || t.user;
                const email = String(t.user_email || '').toLowerCase();
                if (id)    paidIds.add(id);
                if (email) paidIds.add(email);
              });
              const paidUsers = filteredUsers.filter(u => userKeys(u).some(k => paidIds.has(k)));
              const unpaidUsers = filteredUsers.filter(u => {
                if (!u.joined_at) return false;
                const d = new Date(u.joined_at);
                if (start && d < start) return false;
                if (end   && d >= end)  return false;
                return !userPaidEver(u);
              });
              return { paidUsers, unpaidUsers };
            };
            const allTimeStats = () => ({
              paidUsers:   filteredUsers.filter(userPaidEver),
              unpaidUsers: filteredUsers.filter(u => !userPaidEver(u)),
            });

            // Aggregate windows.
            const todayStart = new Date(); todayStart.setHours(0,0,0,0);
            const weekStart  = new Date(Date.now() - 7 * 86400000);
            const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

            const buildItem = (key, label, statsObj, opts = {}) => {
              const paid   = statsObj.paidUsers.length;
              const unpaid = statsObj.unpaidUsers.length;
              const total  = paid + unpaid;
              return {
                __key: key, label, paid, unpaid,
                conv: total ? Math.round((paid / total) * 100) : 0,
                paidUsers:   statsObj.paidUsers,
                unpaidUsers: statsObj.unpaidUsers,
                __highlight: !!opts.highlight,
                periodEnd: opts.periodEnd || null,
              };
            };

            const aggregates = [
              buildItem('today', 'Today',      periodStats(todayStart, null), { highlight:true }),
              buildItem('week',  'This Week',  periodStats(weekStart,  null), { highlight:true }),
              buildItem('month', 'This Month', periodStats(monthStart, null), { highlight:true }),
              buildItem('all',   'All Time',   allTimeStats(),                { highlight:true }),
            ];

            // 12 trailing-month rows mirroring the chart's labels but using
            // PERIOD-BOUNDED logic (paid in that month, joined in that month
            // and never paid). Different from the chart's cumulative bars on
            // purpose — the table answers "what happened in each month?".
            const monthItems = (paidUnpaidSeries || []).map((r, i) => {
              const yr = r.year || yearNow;
              const m  = r.monthIdx || (i + 1); // 1-based
              const start = new Date(yr, m - 1, 1);
              const end   = new Date(yr, m,     1);
              const stats = periodStats(start, end);
              return buildItem(`m-${i}`, r.month, stats, { periodEnd: end });
            });

            const items = [...aggregates, ...monthItems];

            // ── CSV export helper for unpaid users ─────────────────────────
            // monthEnd = null  → "now" (current cumulative snapshot)
            // monthEnd = Date  → cumulative as of that month-end
            const buildPayerKey = (cutoff) => {
              const set = new Set();
              filteredTx.forEach(t => {
                // Any successful transaction (any source) makes a user "paid".
                const status = String(t.status || '').toLowerCase();
                if (status && status !== 'completed' && status !== 'success') return;
                if (!t.created_at) return;
                if (cutoff && new Date(t.created_at) > cutoff) return;
                const id    = t.user_id || t.user;
                const email = String(t.user_email || '').toLowerCase();
                if (id)    set.add(id);
                if (email) set.add(email);
              });
              return set;
            };
            const computeUnpaid = (cutoff) => {
              const payerKey = buildPayerKey(cutoff);
              return filteredUsers.filter(u => {
                if (cutoff && (!u.joined_at || new Date(u.joined_at) > cutoff)) return false;
                return !payerKey.has(u.id) && !payerKey.has(String(u.email || '').toLowerCase());
              });
            };
            const downloadUnpaidCsv = (rows, tag) => {
              if (!rows.length) return;
              const headers = ['User ID','Name','Email','Phone','Role','Status','Joined','Last Seen','Days Since Joining','SMS Sent','Balance (TZS)'];
              const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
              const lines  = [headers.map(escape).join(',')];
              const now = Date.now();
              rows.forEach(u => {
                const days = u.joined_at ? Math.floor((now - new Date(u.joined_at).getTime()) / 86400000) : '';
                lines.push([
                  u.id || '',
                  u.name || '',
                  u.email || '',
                  u.phone || '',
                  u.role || '',
                  u.status || '',
                  u.joined_at ? new Date(u.joined_at).toISOString().slice(0,10) : '',
                  u.last_seen_at ? new Date(u.last_seen_at).toISOString().slice(0,10) : '',
                  days,
                  u.sms_sent ?? 0,
                  u.balance ?? 0,
                ].map(escape).join(','));
              });
              const safeTag = String(tag || 'all').replace(/[^a-z0-9-]/gi, '');
              const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
              const url  = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `unpaid-users-${safeTag}-${new Date().toISOString().slice(0,10)}.csv`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            };

            const allUnpaid = computeUnpaid(null);

            return (
              <>
                {/* Top toolbar — download every unpaid user (current snapshot) */}
                <div style={{padding:'10px 18px', borderBottom:'1px solid #f1f5f9', display:'flex',
                  justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <span style={{fontSize:11, color:'#475569', fontWeight:600}}>
                    {allUnpaid.length === 0
                      ? 'No unpaid users right now.'
                      : `${allUnpaid.length} unpaid user${allUnpaid.length !== 1 ? 's' : ''} as of today`}
                  </span>
                  <button onClick={() => downloadUnpaidCsv(allUnpaid, 'now')} disabled={allUnpaid.length === 0}
                    style={{display:'inline-flex', alignItems:'center', gap:6, padding:'7px 12px',
                      background: allUnpaid.length === 0 ? '#f1f5f9' : GREEN,
                      color:      allUnpaid.length === 0 ? '#94a3b8' : '#fff',
                      border:'none', borderRadius:7, fontSize:11, fontWeight:700,
                      cursor: allUnpaid.length === 0 ? 'not-allowed' : 'pointer'}}>
                    <Download size={13} strokeWidth={2.4}/>
                    Download Unpaid CSV ({allUnpaid.length})
                  </button>
                </div>

              <ExpandableTable
                accent={GREEN}
                headers={['Period','Paid','Unpaid','Conv.']}
                items={items}
                renderRow={(item) => (
                  <>
                    <td style={{fontWeight: item.__highlight?700:600, fontSize:12, color: item.__highlight?BRAND:'#0f172a'}}>{item.label}</td>
                    <td style={{fontSize:12,fontWeight:600,color:GREEN}}>{item.paid.toLocaleString()}</td>
                    <td style={{fontSize:12,fontWeight:600,color:'#64748b'}}>{item.unpaid.toLocaleString()}</td>
                    <td style={{fontSize:12,color: item.__highlight?BRAND:'#64748b',fontWeight: item.__highlight?700:400}}>{item.conv}%</td>
                  </>
                )}
                renderDetail={(item) => {
                  // The aggregate/per-month rows already carry full paidUsers/unpaidUsers
                  // arrays (computed period-bounded). Slice the first 10 for display.
                  const paidUsersAll   = item.paidUsers   || [];
                  const unpaidUsersAll = item.unpaidUsers || [];
                  const paidUsers   = paidUsersAll.slice(0, 10);
                  const unpaidUsers = unpaidUsersAll.slice(0, 10);

                  // Cutoff for the per-row purchase activity stats: end of that period.
                  // Aggregate rows ("Today/Week/Month/All Time") use "now".
                  const monthEnd = item.periodEnd || new Date();
                  const monthTag = item.__key === 'all'   ? 'all-time'
                                : item.__key === 'today' ? 'today'
                                : item.__key === 'week'  ? 'this-week'
                                : item.__key === 'month' ? 'this-month'
                                : item.label.toLowerCase().replace(/\s+/g, '-');

                  // Compute per-user purchase stats from transactions up to monthEnd.
                  // Used to replace the Email column with actual purchase activity.
                  const userTxStats = (u) => {
                    const id    = u.id;
                    const email = String(u.email || '').toLowerCase();
                    let successCount = 0, failCount = 0, lastDate = null, totalSpent = 0;
                    filteredTx.forEach(t => {
                      if (!t.created_at) return;
                      const d = new Date(t.created_at);
                      if (d > monthEnd) return;
                      const txId    = t.user_id || t.user;
                      const txEmail = String(t.user_email || '').toLowerCase();
                      const matches = (id && txId === id) || (email && txEmail === email);
                      if (!matches) return;
                      const status = String(t.status || '').toLowerCase();
                      if (status === 'completed' || status === 'success') {
                        successCount++;
                        totalSpent += Number(t.amount || t.total || t.total_price || 0);
                        if (!lastDate || d > lastDate) lastDate = d;
                      } else if (status === 'failed') {
                        failCount++;
                      }
                    });
                    return { successCount, failCount, lastDate, totalSpent };
                  };

                  const fmtRelativeDays = (date) => {
                    if (!date) return '—';
                    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
                    if (days === 0) return 'today';
                    if (days === 1) return '1 d ago';
                    if (days < 30) return `${days} d ago`;
                    const months = Math.floor(days / 30);
                    return months === 1 ? '1 mo ago' : `${months} mo ago`;
                  };

                  const Col = ({ title, rows, color, empty, isPaid }) => (
                    <div>
                      <div style={{fontSize:10, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6}}>{title}</div>
                      {rows.length === 0 ? (
                        <div style={{fontSize:11, color:'#94a3b8'}}>{empty}</div>
                      ) : (
                        <table className="senda-table" style={{width:'100%'}}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>{isPaid ? 'Total Spent' : 'Activity'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((u, j) => {
                              const stats = userTxStats(u);
                              return (
                                <tr key={u.id || u.email || j} title={u.email || ''}>
                                  <td style={{fontWeight:600,fontSize:12,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name || '—'}</td>
                                  <td style={{fontSize:11,whiteSpace:'nowrap'}}>
                                    {isPaid ? (
                                      <>
                                        <span style={{fontWeight:700,color:GREEN}}>{stats.totalSpent.toLocaleString()} TZS</span>
                                        <span style={{color:'#94a3b8',marginLeft:4}}>· {stats.successCount} purchase{stats.successCount !== 1 ? 's' : ''}</span>
                                        {stats.lastDate && <span style={{color:'#94a3b8',marginLeft:4}}>· last {fmtRelativeDays(stats.lastDate)}</span>}
                                      </>
                                    ) : stats.failCount > 0 ? (
                                      <>
                                        <span style={{fontWeight:700,color:RED}}>{stats.failCount} failed</span>
                                        <span style={{color:'#94a3b8',marginLeft:4}}>· joined {fmtRelativeDays(u.joined_at)}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span style={{color:'#94a3b8'}}>Never paid</span>
                                        <span style={{color:'#94a3b8',marginLeft:4}}>· joined {fmtRelativeDays(u.joined_at)}</span>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                  return (
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:8,flexWrap:'wrap'}}>
                        <div style={{fontSize:11,color:'#475569',fontWeight:600}}>
                          <span style={{color:BRAND}}>{item.label}</span> · {item.paid} paid · {item.unpaid} unpaid · {item.conv}% conversion
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadUnpaidCsv(unpaidUsersAll, monthTag); }}
                          disabled={unpaidUsersAll.length === 0}
                          style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',
                            background: unpaidUsersAll.length === 0 ? '#f1f5f9' : '#cbd5e1',
                            color:      unpaidUsersAll.length === 0 ? '#94a3b8' : '#475569',
                            border:'none', borderRadius:6, fontSize:10, fontWeight:700,
                            cursor: unpaidUsersAll.length === 0 ? 'not-allowed' : 'pointer'}}>
                          <Download size={11} strokeWidth={2.4}/>
                          CSV ({unpaidUsersAll.length})
                        </button>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                        <Col isPaid title={`Paid (${item.paid})`}        rows={paidUsers}   color={GREEN}     empty="No paying users this month."/>
                        <Col        title={`Unpaid (${item.unpaid})`}     rows={unpaidUsers} color={'#94a3b8'} empty="No unpaid registrations this month."/>
                      </div>
                    </div>
                  );
                }}
              />
              </>
            );
          }}
        />

        {/* 3 — Idle buyers */}
        <ToggleablePanel
          title="Buyers Inactive > 7 days"
          subtitle="Bought SMS/sender, last seen > 7d. Re-engage."
          color={AMBER}
          hasData={inactiveBuyers.length > 0}
          emptyMsg="No idle buyers in current sample."
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={inactiveBuyerBuckets()} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="label"
                  label={xAxisTitle('Days since last login')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  label={yAxisTitle('Buyers')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={48}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="count" name="Idle buyers" fill={AMBER} radius={[4,4,0,0]} barSize={30} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => (
            <IdleBuyersTable rows={inactiveBuyers} transactions={filteredTx}/>
          )}
        />

        {/* 4 — Total messages sent */}
        <ToggleablePanel
          title="Total Messages Sent"
          subtitle={`${compactNumber(smsSent)} this year — month-by-month volume below`}
          color={VIOLET}
          hasData={smsSeries.some(m => (m.sent||m.value||0) > 0) || smsSent > 0}
          emptyMsg="No messages sent yet this year."
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={smsSeries} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="month"
                  label={xAxisTitle(`Month (${yearNow})`)}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={v=>compactNumber(v)}
                  domain={[0, Math.ceil(smsMax * 1.2)]}
                  label={yAxisTitle('Messages')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={50}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="sent" name="Messages sent" fill={VIOLET} radius={[4,4,0,0]} barSize={18} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => {
            const yearTotalSent = smsSeries.reduce((a,m) => a + Number(m.sent || m.value || 0), 0) || smsSent;
            const items = [
              { __key:'tot', label:'Total (Year)', sent: Number(smsSent || yearTotalSent), delivered: smsSeries.reduce((a,m)=>a+Number(m.delivered||0),0), failed: smsSeries.reduce((a,m)=>a+Number(m.failed||0),0), __highlight:true, isTotal:true },
              ...smsSeries.map((m, i) => ({
                __key:`m-${i}`, label:m.month,
                sent: Number(m.sent || m.value || 0),
                delivered: Number(m.delivered || 0),
                failed: Number(m.failed || 0),
                pending: Number(m.pending || 0),
              })),
            ];
            return (
              <ExpandableTable
                accent={VIOLET}
                headers={['Month','Sent','Delivered']}
                items={items}
                renderRow={(item) => (
                  <>
                    <td style={{fontWeight: item.__highlight?700:600, fontSize:12, color: item.__highlight?VIOLET:'#0f172a'}}>{item.label}</td>
                    <td style={{fontSize:12, color: item.__highlight?VIOLET:'#0f172a', fontWeight:600}}>{item.sent.toLocaleString()}</td>
                    <td style={{fontSize:12, color: GREEN, fontWeight:600}}>{item.delivered.toLocaleString()}</td>
                  </>
                )}
                renderDetail={(item) => {
                  const sent      = item.sent;
                  const delivered = item.delivered;
                  const failed    = item.failed;
                  const pending   = item.pending || Math.max(sent - delivered - failed, 0);
                  const dRate     = sent ? ((delivered/sent)*100).toFixed(1) : '0.0';
                  const fRate     = sent ? ((failed/sent)*100).toFixed(1)    : '0.0';
                  const share     = yearTotalSent ? ((sent/yearTotalSent)*100).toFixed(1) : '0.0';
                  return (
                    <DetailGrid fields={[
                      { label:'Sent',           value: sent.toLocaleString() },
                      { label:'Delivered',      value: <span style={{color:GREEN}}>{delivered.toLocaleString()} ({dRate}%)</span> },
                      { label:'Failed',         value: <span style={{color:RED}}>{failed.toLocaleString()} ({fRate}%)</span> },
                      { label:'Pending',        value: <span style={{color:AMBER}}>{pending.toLocaleString()}</span> },
                      ...(item.isTotal ? [] : [{ label:'Share of year', value: `${share}%` }]),
                    ]}/>
                  );
                }}
              />
            );
          }}
        />

        {/* 5 — Inactive users */}
        <ToggleablePanel
          title="Inactive Users"
          subtitle={`${inactiveUsers.length} users (${inactivePct}%) · last seen > 30d or suspended`}
          color={RED}
          hasData={inactiveUsers.length > 0}
          emptyMsg="All users active in the last 30 days."
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={inactiveUserBuckets()} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="label"
                  label={xAxisTitle('Days since last seen / status')}
                  tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  label={yAxisTitle('Users')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={48}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="count" name="Inactive users" fill={RED} radius={[4,4,0,0]} barSize={30} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => (
            <InactiveUsersTable rows={inactiveUsers}/>
          )}
        />

        {/* 6 — Failed messages */}
        <ToggleablePanel
          title="Failed Messages · This Month"
          subtitle={`${failed.toLocaleString()} failed (${failPct}% of total)`}
          color={ORANGE}
          hasData={totalDel > 0}
          emptyMsg="No delivery data yet for this month."
          renderChart={() => (
            <InsightsChartBox>
              <PieChart>
                <Pie data={deliveryArr} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {deliveryArr.map((d,i) => <Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </InsightsChartBox>
          )}
          renderTable={() => {
            const STATUS_INFO = {
              Delivered: { note:'Successfully accepted by handset/carrier.',                          action:'Healthy. Track moving-average trend on Overview.' },
              Failed:    { note:'Carrier rejected the message (bad number, blocked, throttled, etc.).', action:'Investigate per-network failure rates; flag low-balance senders.' },
              Pending:   { note:'In-flight or awaiting delivery receipt from carrier.',                action:'Recheck status after carrier callback window closes.' },
            };
            const items = deliveryArr.map(d => ({
              __key:d.name, status:d.name, count:d.value, color:d.color,
            }));
            return (
              <ExpandableTable
                accent={ORANGE}
                headers={['Status','Count','%']}
                items={items}
                renderRow={(d) => (
                  <>
                    <td style={{fontWeight:700,fontSize:12,color:d.color}}>{d.status}</td>
                    <td style={{fontSize:12,fontWeight:600,color:'#0f172a'}}>{d.count.toLocaleString()}</td>
                    <td style={{fontSize:12,color:'#64748b'}}>{totalDel ? ((d.count/totalDel)*100).toFixed(1) : '0.0'}%</td>
                  </>
                )}
                renderDetail={(d) => {
                  const info = STATUS_INFO[d.status] || {};
                  return (
                    <DetailGrid fields={[
                      { label:'Status',         value: <span style={{color:d.color, fontWeight:700}}>{d.status}</span> },
                      { label:'Count',          value: d.count.toLocaleString() },
                      { label:'Share of total', value: `${totalDel ? ((d.count/totalDel)*100).toFixed(2) : '0.00'}%` },
                      { label:'Period',         value: 'Current month' },
                      { label:'Description',    value: info.note },
                      { label:'Action',         value: info.action },
                    ]}/>
                  );
                }}
              />
            );
          }}
        />

        {/* 7 — Revenue */}
        <ToggleablePanel
          title="Revenue · Total + Monthly"
          subtitle={`${compactNumber(totalRevenue)} TZS all time · ${compactNumber(thisMonthRev)} TZS latest month`}
          color={CYAN}
          hasData={revenueSeries.some(r => (r.revenue||r.value||0) > 0) || totalRevenue > 0}
          emptyMsg="No revenue recorded yet this year."
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={revenueSeries} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="month"
                  label={xAxisTitle(`Month (${yearNow})`)}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)}
                  domain={[0, Math.ceil(revenueMax * 1.2)]}
                  label={yAxisTitle('Revenue (TZS)')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={56}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="revenue" name="Monthly revenue (TZS)" fill={CYAN} radius={[4,4,0,0]} barSize={18} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => {
            const items = [
              { __key:'tot', label:'Total (Year)', monthIdx:null, amount: Number(totalRevenue||0), __highlight:true, isTotal:true },
              ...revenueSeries.map((r, i) => ({ __key:`m-${i}`, label:r.month, monthIdx:i, amount: Number(r.revenue || r.value || 0) })),
            ];
            return (
              <ExpandableTable
                accent={CYAN}
                headers={['Month','Revenue (TZS)']}
                items={items}
                renderRow={(item) => (
                  <>
                    <td style={{fontWeight: item.__highlight?700:600, fontSize:12, color: item.__highlight?CYAN:'#0f172a'}}>{item.label}</td>
                    <td style={{fontSize:12, fontWeight:600, color: item.__highlight?CYAN:GREEN}}>{item.amount.toLocaleString()}</td>
                  </>
                )}
                renderDetail={(item) => {
                  if (item.isTotal) {
                    const monthAvg = revenueSeries.length ? Math.round(item.amount / Math.max(1, revenueSeries.filter(r=>(r.revenue||r.value||0)>0).length)) : 0;
                    const best = revenueSeries.reduce((a,r,i)=> ((r.revenue||r.value||0) > a.amount ? {month:r.month, amount:Number(r.revenue||r.value||0), idx:i} : a), {month:'—', amount:0, idx:-1});
                    return (
                      <DetailGrid fields={[
                        { label:'Year-to-date',    value: `${item.amount.toLocaleString()} TZS` },
                        { label:'Avg/active month',value: `${monthAvg.toLocaleString()} TZS` },
                        { label:'Best month',      value: `${best.month} · ${best.amount.toLocaleString()} TZS` },
                        { label:'Months with revenue', value: `${revenueSeries.filter(r=>(r.revenue||r.value||0)>0).length} of 12` },
                      ]}/>
                    );
                  }
                  const mi    = item.monthIdx;
                  // monthIdx from server series is 1-based (1..12); year may differ from yearNow
                  // (last 12 months span). Normalize by reading year from item too.
                  const yr    = item.year || yearNow;
                  const month = (typeof mi === 'number' && mi >= 1 && mi <= 12) ? (mi - 1) : 0;
                  const start = new Date(yr, month,     1);
                  const end   = new Date(yr, month + 1, 1);
                  const monthTx = filteredTx.filter(t => {
                    if (!t.created_at) return false;
                    const d = new Date(t.created_at);
                    return d >= start && d < end;
                  });
                  const userByKey = new Map();
                  filteredUsers.forEach(u => {
                    if (u.id)    userByKey.set(u.id, u);
                    if (u.email) userByKey.set(String(u.email).toLowerCase(), u);
                  });
                  const buyers = new Set(monthTx.map(t => t.user_id || t.user || t.user_email).filter(Boolean));
                  const avg    = monthTx.length ? Math.round(item.amount / monthTx.length) : 0;
                  return (
                    <div>
                      <div style={{fontSize:11,color:'#475569',marginBottom:8,fontWeight:600}}>
                        {item.label} · {monthTx.length} transactions · {buyers.size} unique buyers · avg {avg.toLocaleString()} TZS
                      </div>
                      {monthTx.length === 0 ? (
                        <div style={{fontSize:12,color:'#94a3b8'}}>
                          No transactions in {item.label} {excludePartners ? '(after filtering partner accounts)' : `(within loaded sample of ${transactions.length})`}.
                        </div>
                      ) : (
                        <table className="senda-table" style={{width:'100%'}}>
                          <thead><tr><th>Date</th><th>Buyer</th><th>Email</th><th>Amount (TZS)</th><th>Status</th></tr></thead>
                          <tbody>
                            {monthTx.slice(0,10).map((t, j) => {
                              const idKey = t.user_id || t.user;
                              const emailKey = String(t.user_email || '').toLowerCase();
                              const u = (idKey && userByKey.get(idKey)) || (emailKey && userByKey.get(emailKey));
                              return (
                              <tr key={t.id || j}>
                                <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{new Date(t.created_at).toLocaleDateString()}</td>
                                <td style={{fontSize:12,fontWeight:600,color:'#0f172a',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u?.name || t.user_email || t.user_id || '—'}</td>
                                <td style={{fontSize:11,color:'#64748b',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u?.email || t.user_email || '—'}</td>
                                <td style={{fontSize:12,fontWeight:600,color:GREEN}}>{Number(t.amount || t.total || t.total_price || 0).toLocaleString()}</td>
                                <td style={{fontSize:11}}><Badge status={t.status}/></td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                }}
              />
            );
          }}
        />

        {/* 8 — Approved sender · no payment */}
        <ToggleablePanel
          title="Approved Sender · No Payment"
          subtitle="Sender approved, owner has never purchased credits."
          color={'#6366f1'}
          hasData={approvedNoPayment.length > 0}
          emptyMsg={senderIds.length === 0
            ? 'No approved sender IDs loaded yet.'
            : 'Every approved sender owner has bought messaging credits at least once.'}
          renderChart={() => (
            <InsightsChartBox>
              <BarChart data={approvedAgeBuckets()} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis
                  dataKey="label"
                  label={xAxisTitle('Days since approval')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  label={yAxisTitle('Senders')}
                  tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={48}
                />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="square" iconSize={10} wrapperStyle={{fontSize:11, paddingTop:4}}/>
                <Bar dataKey="count" name="Approved · no payment" fill={'#6366f1'} radius={[4,4,0,0]} barSize={30} isAnimationActive={false}/>
              </BarChart>
            </InsightsChartBox>
          )}
          renderTable={() => (
            <ApprovedNoPaymentTable rows={approvedNoPayment} users={filteredUsers} partners={partners}/>
          )}
        />
      </div>

    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout, adminInfo, showToast }) {
  const bp = useBreakpoint();
  const [active, setActive] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const sidebarMode = isMobile ? 'hidden' : isTablet ? 'icon' : 'full';
  const mainRef = React.useRef(null);

  const tabLabel = NAV.find(n=>n.id===active);
  const tabTitle = tabLabel ? `SENDA Admin | ${tabLabel.label}` : 'SENDA Admin';

  useEffect(() => { document.title = tabTitle; }, [tabTitle]);

  // Scroll content to top whenever the active page changes
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const tabMap = {
    overview:     <OverviewTab/>,
    insights:     <InsightsTab/>,
    users:        <UsersTab/>,
    transactions: <TransactionsTab/>,
    senderids:    <SenderIdsTab/>,
    partners:     <PartnersTab/>,
    loginactivity:<LoginActivityTab/>,
    packages:     <PackagesTab/>,
    operations:   <OperationsTab/>,
  };

  return (
    <AppContext.Provider value={{ showToast: showToast || (()=>{}), onLogout }}>
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
          <div style={{display:'flex',alignItems:'center',gap:12, minWidth:0}}>
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                style={{
                  width:38, height:38, borderRadius:9,
                  background:'#f1f5f9', border:'1px solid #e2e8f0',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', flexShrink:0,
                }}
              >
                <Menu size={18} strokeWidth={2.4} color="#475569"/>
              </button>
            )}
            <div style={{minWidth:0}}>
              <h2 style={{fontSize:isMobile?14:16,fontWeight:700,color:'#0f172a',lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                  {tabLabel?.Icon ? <tabLabel.Icon size={18} strokeWidth={2.2} color={BRAND} /> : null}
                  <span>{tabLabel?.label}</span>
                </span>
              </h2>
              {!isMobile && <p style={{fontSize:11,color:'#94a3b8',marginTop:1}}>SENDA Admin Portal</p>}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?8:12}}>
            {!isMobile && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{adminInfo?.name || 'Admin'}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{adminInfo?.email || ''}</div>
              </div>
            )}
            <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${BRAND},${BRAND2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14,flexShrink:0}}>A</div>
            {isMobile && (
              <button className="senda-btn senda-btn-sm senda-btn-danger" onClick={onLogout} style={{padding:'0 10px',height:32}}>
                <LogOut size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main ref={mainRef} style={{flex:1,overflowY:'auto',padding:isMobile?'16px 12px 24px':'24px',minWidth:0}}>
          {tabMap[active]}
        </main>
      </div>

      {isMobile && (
        <LeftDrawerNav
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          active={active}
          setActive={setActive}
          onLogout={onLogout}
          adminInfo={adminInfo}
        />
      )}
    </div>
    </AppContext.Provider>
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
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(LS_KEY, JSON.stringify({
          token: data.data.access_token,
          expires_at: Date.now() + data.data.expires_in * 1000,
          admin: data.data.admin,
          loginAt: Date.now(),
        }));
        onLogin(data.data.admin);
      } else {
        setError(data.error?.message || 'Invalid credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
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
            <Mail size={28} strokeWidth={2.4} color="#fff" />
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
            <AlertTriangle size={15} strokeWidth={2} color='#fca5a5' style={{flexShrink:0}}/>
            <span style={{fontSize:13,color:'#fca5a5',fontWeight:500}}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Email</label>
            <div style={{position:'relative'}}>
              <Mail size={15} strokeWidth={2} color='rgba(255,255,255,0.4)' style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
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
              <ShieldCheck size={15} strokeWidth={2} color='rgba(255,255,255,0.4)' style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
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
      const { token, expires_at } = JSON.parse(saved);
      return !!token && Date.now() < expires_at;
    } catch { return false; }
  });

  const [adminInfo, setAdminInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}').admin || null; }
    catch { return null; }
  });

  const [toast, setToast] = useState(null);
  const toastId = useRef(0);

  const showToast = useCallback((message, type='success') => {
    const id = ++toastId.current;
    setToast({ id, message, type });
  }, []);

  const handleLogin = useCallback((admin) => {
    setAdminInfo(admin || null);
    setIsLoggedIn(true);
    setTimeout(() => showToast(`Welcome back, ${admin?.name || 'Admin'}!`, 'success'), 150);
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await adminFetch('/auth/admin/logout', { method: 'POST' }, null);
    } catch {}
    localStorage.removeItem(LS_KEY);
    setIsLoggedIn(false);
    setAdminInfo(null);
    document.title = 'SENDA Admin | Login';
  }, []);

  return (
    <div style={{transition:'opacity .35s ease', opacity:1}}>
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast(null)}/>
      )}
      {isLoggedIn
        ? <Dashboard onLogout={handleLogout} adminInfo={adminInfo} showToast={showToast}/>
        : <LoginPage onLogin={handleLogin}/>
      }
    </div>
  );
}
