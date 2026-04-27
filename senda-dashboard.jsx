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
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Globe,
  Handshake,
  Hourglass,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  ShieldCheck,
  Tag,
  UserCheck,
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
function StatCard({ title, value, change, up, desc, icon: Icon, accent }) {
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
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [monthlySMS, setMonthlySMS]       = useState([]);
  const [revenueData, setRevenueData]     = useState([]);
  const [userGrowth, setUserGrowth]       = useState([]);
  const [deliveryPie, setDeliveryPie]     = useState([]);
  const [networkPerf, setNetworkPerf]     = useState([]);
  const [delivRate, setDelivRate]         = useState([]);

  const fetchAll = useCallback(() => {
    const year = new Date().getFullYear();
    setLoading(true);
    setError(null);

    Promise.all([
      adminFetch(`/analytics/summary?period=current_year`, {}, onLogout),
      adminFetch(`/analytics/sms/monthly?year=${year}`, {}, onLogout),
      adminFetch(`/analytics/revenue/monthly?year=${year}`, {}, onLogout),
      adminFetch(`/analytics/users/growth?year=${year}`, {}, onLogout),
      adminFetch(`/analytics/sms/delivery-status?period=current_month`, {}, onLogout),
      adminFetch(`/analytics/networks/performance?period=current_month`, {}, onLogout),
      adminFetch(`/analytics/sms/delivery-rate-trend?year=${year}&ma_window=3`, {}, onLogout),
    ]).then(([summary, sms, revenue, growth, pie, networks, trend]) => {
      if (summary.success) setStatsData(summary.data.stats);
      if (sms.success)     setMonthlySMS(sms.data);
      if (revenue.success) setRevenueData(revenue.data.map(d => ({ ...d, avgOrder: d.avg_order })));
      if (growth.success)  setUserGrowth(growth.data);
      if (pie.success) {
        const pieColors = { delivered: GREEN, failed: RED, pending: AMBER };
        setDeliveryPie(pie.data.breakdown.map(b => ({
          name: b.status.charAt(0).toUpperCase() + b.status.slice(1),
          value: b.value,
          color: pieColors[b.status] || BRAND,
        })));
      }
      if (networks.success) {
        const netColors = [BRAND, GREEN, AMBER, VIOLET, CYAN];
        setNetworkPerf(networks.data.map((n, i) => ({
          ...n, rate: n.delivery_rate, vol: n.volume, color: netColors[i % netColors.length],
        })));
      }
      if (trend.success) {
        setDelivRate(trend.data.map(d => ({
          month: d.month,
          'Delivery Rate': d.delivery_rate,
          'MA-3': d.moving_avg_3,
        })));
      }
      const anyFailed = [summary, sms, revenue, growth, pie, networks, trend].some(r => !r.success);
      if (anyFailed) setError('Some data could not be loaded. Showing available data.');
    }).catch(e => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmtChange = (s) => {
    const sign = s.change_direction === 'up' ? '+' : '';
    return `${sign}${s.change}`;
  };
  const statCards = statsData ? [
    { title:'Total Users',   value: statsData.total_users.value.toLocaleString(),            change: fmtChange(statsData.total_users),   up: statsData.total_users.change_direction==='up',              desc:'registered',  icon:Users,         accent:BRAND  },
    { title:'Active Users',  value: statsData.active_users.value.toLocaleString(),           change: fmtChange(statsData.active_users),  up: statsData.active_users.change_direction==='up',             desc:'this month',  icon:UserCheck,      accent:GREEN  },
    { title:'SMS Sent',      value: statsData.sms_sent.value.toLocaleString(),               change: fmtChange(statsData.sms_sent),      up: statsData.sms_sent.change_direction==='up',                 desc:'this year',   icon:MessageSquare,  accent:VIOLET },
    { title:'Revenue (TZS)', value: compactNumber(statsData.revenue_tzs.value),            change: fmtChange(statsData.revenue_tzs),   up: statsData.revenue_tzs.change_direction==='up',              desc:'total',       icon:Wallet,         accent:AMBER  },
    { title:'Sender IDs',    value: statsData.approved_sender_ids.value.toString(),          change: fmtChange(statsData.approved_sender_ids), up: statsData.approved_sender_ids.change_direction==='up', desc:'approved',    icon:Tag,            accent:CYAN  },
    { title:'Fail Rate',     value: `${statsData.delivery_fail_rate.value}%`,                change: fmtChange(statsData.delivery_fail_rate),  up: statsData.delivery_fail_rate.change_direction==='up',  desc:'delivery',    icon:AlertTriangle,  accent:RED    },
    { title:'Avg Delivery',  value: `${statsData.avg_delivery_time_seconds.value}s`,         change: fmtChange(statsData.avg_delivery_time_seconds), up: statsData.avg_delivery_time_seconds.change_direction==='up', desc:'response', icon:Zap,            accent:GREEN },
    { title:'Pending Appr.', value: statsData.pending_sender_id_approvals.value.toString(),  change: fmtChange(statsData.pending_sender_id_approvals), up: statsData.pending_sender_id_approvals.change_direction==='up', desc:'sender IDs', icon:Clock,         accent:AMBER },
  ] : [];

  const totalPie = deliveryPie.reduce((s, d) => s + d.value, 0);
  const chartH   = isMobile ? 180 : bp === 'tablet' ? 200 : 260;

  if (loading) return <LoadingState label="Loading analytics..."/>;

  return (
    <div className="senda-fade-in">
      {error && (
        <div style={{ padding:'10px 14px', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, marginBottom:16, fontSize:13, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={14} strokeWidth={2} color='#92400e' style={{flexShrink:0}}/> {error}
        </div>
      )}

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
          <SectionHeader title="Delivery Status" subtitle="Current month breakdown"/>
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
function TransactionsTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [items, setItems]   = useState([]);
  const [meta, setMeta]     = useState({});
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const PER = 10;

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page, limit: PER, sort: 'date', order: 'desc' });
    if (filter !== 'all') qs.set('status', filter);
    if (search.trim())    qs.set('search', search.trim());
    adminFetch(`/transactions?${qs}`, {}, onLogout)
      .then(res => {
        if (res.success) { setItems(res.data); setMeta(res.meta || {}); setSummary(res.summary || {}); }
        else setError(res.error?.message || 'Failed to load transactions.');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, filter, search, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total  = meta.total || 0;
  const pages  = meta.total_pages || 1;

  return (
    <div className="senda-fade-in">
      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[
          {label:'Total Txns',  value: summary.total_count  ?? '—',                               icon:CreditCard,   color:BRAND},
          {label:'Completed',   value: summary.completed_count ?? '—',                            icon:CheckCircle2, color:GREEN},
          {label:'Pending',     value: summary.pending_count ?? '—',                              icon:Hourglass,    color:AMBER},
          {label:'Failed',      value: summary.failed_count ?? '—',                               icon:XCircle,      color:RED  },
          {label:'Revenue (K)', value: summary.total_revenue != null ? `${Math.round(summary.total_revenue/1000)}K` : '—', icon:Wallet,       color:VIOLET},
        ].map(c=>(
          <div key={c.label} className="senda-card" style={{padding:'14px 16px'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${c.color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {(() => {
                  const Icon = c.icon;
                  return <Icon size={18} strokeWidth={2.2} color={c.color} />;
                })()}
              </div>
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
      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:720}}>
              <thead>
                <tr>
                  <th>Txn ID</th><th>User</th><th>Package</th>
                  <th>Amount (TZS)</th><th>Credits</th>
                  <th>Method</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t=>(
                  <tr key={t.id}>
                    <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{t.id}</td>
                    <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.user_email}</td>
                    <td>{t.package}</td>
                    <td style={{fontWeight:600}}>{t.amount.toLocaleString()}</td>
                    <td>{t.credits.toLocaleString()}</td>
                    <td><span style={{fontSize:11,background:'#f1f5f9',padding:'2px 8px',borderRadius:6}}>{t.method}</span></td>
                    <td><Badge status={t.status}/></td>
                    <td style={{fontSize:12,color:'#64748b'}}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No transactions found.</div>}
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
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [items, setItems]             = useState([]);
  const [apiSummary, setApiSummary]   = useState(null);
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);
  const PER_PAGE = 50;

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    setItems([]); setApiSummary(null); setLoadedPages(0); setTotalPages(1);

    // Fetch page 1 to get meta + summary
    adminFetch(`/sender-ids?limit=100&page=1`, {}, onLogout)
      .then(res => {
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
      {/* ── Top analytics row ── */}
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
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:860}}>
              <thead>
                <tr>
                  <th>ID</th><th>Sender Name</th><th>Company</th><th>Owner</th>
                  <th>Type</th><th>Network</th><th>SMS Sent</th>
                  <th>Status</th><th>Invoice</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{s.id}</td>
                    <td>
                      <div style={{fontWeight:700,color:'#0f172a',fontSize:13}}>{s.name}</div>
                      {s.notes && <div style={{fontSize:10,color:'#f97316',marginTop:1,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.notes}>⚠ {s.notes}</div>}
                    </td>
                    <td style={{maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{s.company}</td>
                    <td style={{fontSize:11,color:'#64748b',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.owner_email}</td>
                    <td><Badge status={(s.type||'').toLowerCase()}/></td>
                    <td style={{fontSize:11,color:'#475569'}}>{s.network}</td>
                    <td style={{fontWeight:600}}>{(s.sms_count||0).toLocaleString()}</td>
                    <td><Badge status={s.status}/></td>
                    <td style={{fontSize:11,color:s.invoice_no?ORANGE:'#cbd5e1',fontWeight:s.invoice_no?600:400}}>{s.invoice_no||'—'}</td>
                    <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
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

      {/* ── Status lifecycle guide ── */}
      <div className="senda-card" style={{padding:16,marginTop:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Status Lifecycle</div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          {[
            {s:'pending',arrow:'→'},{s:'await_payment',arrow:'→'},{s:'approved',arrow:null},
            {s:'require_changes',arrow:'→ (back to pending)'},{s:'rejected',arrow:null},
          ].map(({s,arrow})=>(
            <React.Fragment key={s}>
              <div style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,background:STATUS_META[s].bg}}>
                {React.createElement(STATUS_META[s].Icon, {size:12,strokeWidth:2,color:STATUS_META[s].color})}
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
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [items, setItems]     = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      adminFetch('/auth/activity', {}, onLogout),
      adminFetch('/auth/activity/daily?days=7', {}, onLogout),
    ]).then(([actRes, dailyRes]) => {
      if (actRes.success) setItems(actRes.data || []);
      else setError(actRes.error?.message || 'Failed to load activity.');
      if (dailyRes.success) setDailyData(dailyRes.data || []);
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = items.filter(l => {
    const m = filter === 'all' || l.status === filter;
    const q = search.toLowerCase();
    return m && (!q || (l.user||'').toLowerCase().includes(q) || (l.ip||'').includes(q) || (l.location||'').toLowerCase().includes(q));
  });

  const successRate = items.length > 0
    ? ((items.filter(l=>l.status==='success').length / items.length)*100).toFixed(1)
    : '—';
  return (
    <div className="senda-fade-in">
      {/* Mini chart row */}
      <div style={{display:'grid',gridTemplateColumns:bp==='mobile'?'1fr':'2fr 1fr',gap:16,marginBottom:20}}>
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
                <Bar dataKey="success" name="Success" fill={GREEN} radius={[4,4,0,0]} barSize={14}/>
                <Bar dataKey="failed" name="Failed" fill={RED} radius={[4,4,0,0]} barSize={14}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="senda-card" style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <SectionHeader title="Auth Summary" subtitle="Overall health"/>
          {[
            {l:'Total Attempts', v:items.length,                                         c:BRAND},
            {l:'Successful',     v:items.filter(l=>l.status==='success').length,         c:GREEN},
            {l:'Failed',         v:items.filter(l=>l.status==='failed').length,          c:RED},
            {l:'Success Rate',   v:`${successRate}%`,                                    c:Number(successRate)>90?GREEN:AMBER},
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
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {/* Table */}
      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:680}}>
              <thead>
                <tr><th>Log ID</th><th>User</th><th>IP Address</th><th>Device</th><th>Location</th><th>Role</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {filtered.map(l=>(
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
          {filtered.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No activity records found.</div>}
        </div>
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
  const [customList, setCustomList] = useState([]);
  const [smsAnl,     setSmsAnl]     = useState({});
  const [waAnl,      setWaAnl]      = useState({});
  const [customAnl,  setCustomAnl]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [section,    setSection]    = useState('sms');

  const fetchAll = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      adminFetch('/packages',                              {}, onLogout),
      adminFetch('/packages/analytics',                   {}, onLogout),
      adminFetch('/packages?type=whatsapp',               {}, onLogout),
      adminFetch('/packages/analytics?type=whatsapp',     {}, onLogout),
      adminFetch('/custom-sms-purchases',                 {}, onLogout),
      adminFetch('/custom-sms-purchases/analytics',       {}, onLogout),
    ]).then(([sr, sa, wr, wa, cr, ca]) => {
      if (sr.success) setSmsPkgs(sr.data || []);
      if (sa.success) setSmsAnl(sa.data || {});
      if (wr.success) setWaPkgs(wr.data || []);
      if (wa.success) setWaAnl(wa.data || {});
      if (cr.success) setCustomList(cr.data || []);
      if (ca.success) setCustomAnl(ca.data || {});
      const anyFail = [sr,sa,wr,wa,cr,ca].some(r => !r.success);
      if (anyFail) setError('Some data could not be loaded — showing available data.');
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const smsRev    = smsAnl.total_revenue    ?? smsPkgs.reduce((s,p)=>s+(p.total_revenue||0),0);
  const waRev     = waAnl.total_revenue     ?? waPkgs.reduce((s,p)=>s+(p.total_revenue||0),0);
  const custRev   = customAnl.total_revenue ?? customList.reduce((s,p)=>s+(parseNumberLoose(p.total_price)||0),0);
  const totalRev  = smsRev + waRev + custRev;

  const smsBuyers  = smsAnl.total_buyers  ?? smsPkgs.reduce((s,p)=>s+(p.purchase_count||0),0);
  const waBuyers   = waAnl.total_buyers   ?? waPkgs.reduce((s,p)=>s+(p.purchase_count||0),0);
  const custBuyers = customAnl.total_buyers ?? customList.length;
  const totalBuyers = smsBuyers + waBuyers + custBuyers;

  const custAvg    = custBuyers > 0 ? custRev / custBuyers : 0;
  const custMax    = customAnl.largest_deal ?? Math.max(0, ...customList.map(p=>parseNumberLoose(p.total_price)||0));

  // ── Chart data ────────────────────────────────────────────────────────────
  const revMix = [
    { name:'SMS',       value: Math.round(smsRev),  color: BRAND     },
    { name:'WhatsApp',  value: Math.round(waRev),   color: WA_GREEN  },
    { name:'Custom',    value: Math.round(custRev),  color: VIOLET    },
  ].filter(d => d.value > 0);

  const smsBuyerChart = smsPkgs.map(p => ({
    name: p.name,
    Buyers:   p.purchase_count || 0,
    Revenue:  Math.round((p.total_revenue || 0) / 1000),
  }));

  const waBuyerChart = waPkgs.map(p => ({
    name: p.name,
    Buyers:   p.purchase_count || 0,
    Revenue:  Math.round((p.total_revenue || 0) / 1000),
  }));

  const PKG_COLORS = [BRAND, GREEN, AMBER, VIOLET, CYAN, ORANGE, PINK];

  // ── Package card renderer ─────────────────────────────────────────────────
  const PkgCard = ({ p, accent }) => (
    <div className="senda-card" style={{
      padding: 18,
      borderTop: `3px solid ${accent}`,
      position: 'relative',
      opacity: p.active === false ? 0.55 : 1,
    }}>
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
    { id:'sms',      label:'SMS Packages',       count: smsPkgs.length   },
    { id:'whatsapp', label:'WhatsApp Packages',  count: waPkgs.length    },
    { id:'custom',   label:'Custom Deals',       count: custBuyers        },
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
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:20}}>
        {[
          { label:'Total Revenue',    value: compactNumber(totalRev)  + ' TZS',  accent: BRAND   },
          { label:'SMS Revenue',      value: compactNumber(smsRev)    + ' TZS',  accent: BRAND   },
          { label:'WhatsApp Revenue', value: compactNumber(waRev)     + ' TZS',  accent: WA_GREEN},
          { label:'Custom Revenue',   value: compactNumber(custRev)   + ' TZS',  accent: VIOLET  },
          { label:'Total Buyers',     value: totalBuyers.toLocaleString(),        accent: AMBER   },
          { label:'Custom Buyers',    value: custBuyers.toLocaleString(),         accent: ORANGE  },
        ].map(k => (
          <div key={k.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${k.accent}`}}>
            <div style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{k.value}</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:3}}>{k.label}</div>
          </div>
        ))}
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

        {/* Buyers per package (SMS + WA combined) */}
        <div className="senda-card" style={{padding:20}}>
          <SectionHeader
            title="Buyers per Package"
            subtitle="Purchase count & revenue (TZS K) across all packages"
          />
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...smsBuyerChart.map(d=>({...d,type:'SMS'})), ...waBuyerChart.map(d=>({...d,type:'WA'}))]}
                margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tickFormatter={v=>`${v}K`} tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar yAxisId="left"  dataKey="Buyers"  name="Buyers"        fill={BRAND}       radius={[4,4,0,0]} barSize={14}/>
                <Bar yAxisId="right" dataKey="Revenue" name="Revenue (K)"   fill={`${GREEN}99`} radius={[4,4,0,0]} barSize={14}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section switcher ── */}
      <div className="tab-wrapper" style={{marginBottom:20}}>
        {sections.map(s=>(
          <button key={s.id} className={`tab-btn${section===s.id?' active':''}`} onClick={()=>setSection(s.id)}>
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
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
              {smsPkgs.map((p,i)=><PkgCard key={p.id} p={p} accent={PKG_COLORS[i%PKG_COLORS.length]}/>)}
            </div>
      )}

      {/* ── WhatsApp Packages ── */}
      {section === 'whatsapp' && (
        waPkgs.length === 0
          ? <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No WhatsApp packages found.</div>
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
              {waPkgs.map((p,i)=><PkgCard key={p.id} p={p} accent={WA_GREEN}/>)}
            </div>
      )}

      {/* ── Custom Deals ── */}
      {section === 'custom' && (
        <div>
          {/* Custom KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:20}}>
            {[
              { label:'Total Custom Buyers', value: custBuyers.toLocaleString(),                 accent: VIOLET  },
              { label:'Total Revenue',        value: compactNumber(custRev) + ' TZS',             accent: GREEN   },
              { label:'Avg Deal Size',         value: compactNumber(custAvg) + ' TZS',            accent: BRAND   },
              { label:'Largest Deal',          value: compactNumber(custMax) + ' TZS',            accent: ORANGE  },
            ].map(k=>(
              <div key={k.label} className="senda-card" style={{padding:'16px 18px',borderTop:`3px solid ${k.accent}`}}>
                <div style={{fontSize:22,fontWeight:800,color:'#0f172a',letterSpacing:'-.5px'}}>{k.value}</div>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Custom purchases table */}
          {customList.length === 0
            ? <div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No custom purchase records found.</div>
            : (
              <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
                <div style={{overflowX:'auto'}}>
                  <table className="senda-table" style={{minWidth:700}}>
                    <thead>
                      <tr>
                        <th>ID</th><th>Customer</th><th>Credits</th>
                        <th>Total Price (TZS)</th><th>Cost/Unit</th>
                        <th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customList.map(c=>(
                        <tr key={c.id}>
                          <td style={{fontWeight:600,color:BRAND,fontSize:12}}>{c.id}</td>
                          <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12}}>{c.user_email||c.customer||'—'}</td>
                          <td style={{fontWeight:600}}>{(c.credits||c.sms_credits||0).toLocaleString()}</td>
                          <td style={{fontWeight:700,color:GREEN}}>{(parseNumberLoose(c.total_price)||0).toLocaleString()}</td>
                          <td style={{fontSize:12,color:'#475569'}}>{c.per_sms ?? c.cost_per_unit ?? '—'}</td>
                          <td><Badge status={c.status}/></td>
                          <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : (c.date || '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',fontSize:12,color:'#94a3b8'}}>
                  {customList.length} custom deal{customList.length!==1?'s':''} · Total {compactNumber(custRev)} TZS
                </div>
              </div>
            )
          }
        </div>
      )}
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
          <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>Sender IDs · {partner.api_url || partner.base_url ? 'External API' : 'SENDA API'}</div>
        </div>
        <code style={{fontSize:10,color:'#cbd5e1',display:'none'}}>{source}</code>
      </div>

      {/* ── KPI strip ── */}
      {!error && (
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

      {/* ── Filter + Search bar ── */}
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

      {/* ── Table ── */}
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
  const totalPartners = summary.total          ?? items.length;
  const activeCount   = summary.active         ?? items.filter(p=>p.status==='active').length;
  const pendingCount  = summary.pending        ?? items.filter(p=>p.status==='pending').length;
  const suspendedCount= summary.suspended      ?? items.filter(p=>p.status==='suspended').length;
  const totalClients  = summary.total_clients  ?? items.reduce((s,p)=>s+(p.clients||0),0);
  const totalSMS      = summary.total_sms_sent ?? items.reduce((s,p)=>s+(p.sms_sent||0),0);
  const totalRevenue  = summary.total_revenue  ?? items.reduce((s,p)=>s+(p.revenue||0),0);
  const totalComm     = summary.total_commission ?? items.reduce((s,p)=>s+(p.commission||0),0);

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
          {l:'Total Clients',   v:totalClients.toLocaleString(),             c:VIOLET, Icon:Users},
          {l:'SMS via Partners',v:compactNumber(totalSMS),                   c:CYAN,   Icon:MessageSquare},
          {l:'Partner Revenue', v:compactNumber(totalRevenue) + ' TZS',      c:ORANGE, Icon:Wallet},
          {l:'Commissions',     v:compactNumber(totalComm) + ' TZS',         c:GREEN,  Icon:DollarSign},
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
                  <th>Tier</th><th>Sender IDs</th><th>Clients</th><th>SMS Sent</th>
                  <th>Revenue (TZS)</th><th>Commission</th><th>Status</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>(
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
                    <td style={{fontWeight:600}}>{(p.clients||0).toLocaleString()}</td>
                    <td style={{fontWeight:600}}>{compactNumber(p.sms_sent||0)}</td>
                    <td style={{fontWeight:700,color:GREEN}}>{compactNumber(p.revenue||0)}</td>
                    <td style={{fontWeight:600,color:ORANGE}}>{compactNumber(p.commission||0)}</td>
                    <td><Badge status={p.status}/></td>
                    <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>{p.join_date ? new Date(p.join_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
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
function BottomNav({ active, setActive, onLogout }) {
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:200,
      background:'#fff', borderTop:'1px solid #e2e8f0',
      boxShadow:'0 -4px 16px rgba(0,0,0,.08)',
      height:60, display:'flex', alignItems:'stretch',
      overflowX:'auto', overflowY:'hidden',
    }}>
      {NAV.map(n=>(
        <button key={n.id} onClick={()=>setActive(n.id)} style={{
          minWidth:56, flex:'0 0 auto',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          border:'none', background:'none', cursor:'pointer', padding:'4px 6px', gap:2,
          color: active===n.id ? BRAND : '#94a3b8',
          borderBottom: active===n.id ? `2px solid ${BRAND}` : '2px solid transparent',
          transition:'color .15s',
        }}>
          <n.Icon size={18} strokeWidth={2.2} color={active===n.id ? BRAND : '#94a3b8'} />
          <span style={{fontSize:8,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{n.label.split(' ')[0]}</span>
        </button>
      ))}
      <button onClick={onLogout} style={{
        minWidth:56, flex:'0 0 auto',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        border:'none', borderBottom:'2px solid transparent',
        background:'none', cursor:'pointer', padding:'4px 6px', gap:2, color:RED,
      }}>
        <LogOut size={18} strokeWidth={2.2} color={RED} />
        <span style={{fontSize:8,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>Logout</span>
      </button>
    </nav>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout, adminInfo, showToast }) {
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
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {isMobile && (
              <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${BRAND},${BRAND2})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Mail size={16} strokeWidth={2.4} color="#fff" />
              </div>
            )}
            <div>
              <h2 style={{fontSize:isMobile?14:16,fontWeight:700,color:'#0f172a',lineHeight:1}}>
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
        <main style={{flex:1,overflowY:'auto',padding:isMobile?'16px 12px 80px':'24px',minWidth:0}}>
          {tabMap[active]}
        </main>
      </div>

      {isMobile && <BottomNav active={active} setActive={setActive} onLogout={onLogout}/>}
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
