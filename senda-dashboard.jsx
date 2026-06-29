/**
 * SENDA Admin Dashboard — senda-dashboard.jsx
 * Single-file standalone React component
 * Dependencies: react, recharts
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Handshake,
  Hourglass,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  MoonStar,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Tag,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
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
@keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(26px,-32px) scale(1.08)}}
@keyframes orbFloat2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,24px) scale(1.1)}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes shimmerText{0%{background-position:-200% center}100%{background-position:200% center}}

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
  /* Stat clusters become a horizontal swipe row on phones.
     Each card is a fixed-width snap target; the parent scrolls horizontally
     so the page stays short instead of stacking 20 tiles vertically. */
  .senda-stat-grid{
    display:flex!important;
    grid-template-columns:unset!important;
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    overflow-y:hidden;
    -webkit-overflow-scrolling:touch;
    scroll-snap-type:x mandatory;
    gap:10px!important;
    padding-bottom:6px;
    /* Edge fade hint that more content is to the right */
    mask-image:linear-gradient(to right,#000 0,#000 calc(100% - 24px),transparent 100%);
    -webkit-mask-image:linear-gradient(to right,#000 0,#000 calc(100% - 24px),transparent 100%);
  }
  .senda-stat-grid::-webkit-scrollbar{height:4px;}
  .senda-stat-grid::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
  .senda-stat-grid > .senda-card{
    flex:0 0 auto!important;
    width:170px!important;
    scroll-snap-align:start;
    padding:12px 12px!important;
  }
  .senda-stat-grid > .senda-card > div:first-child > span{font-size:9px!important;}
  .senda-stat-grid > .senda-card > div:nth-child(2){font-size:20px!important;}
  /* Chart and table cards: lighter padding on phones */
  .chart-h-responsive{height:180px!important;}
  .senda-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .overview-chart-card{padding:14px!important;}
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
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:isMobile?14:18}}>
        {userTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Messages (6 tiles) ─────────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Messages · Delivery Quality</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:isMobile?14:18}}>
        {messageTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Revenue (2 tiles) ──────────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Revenue</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:isMobile?14:18}}>
        {revenueTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* ── Sender IDs (3 tiles) ───────────────────────────────────────── */}
      <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Sender IDs</div>
      <div className="senda-stat-grid" style={{display:'grid',gap:12,marginBottom:isMobile?16:24}}>
        {senderTiles.map(c => <StatCard key={c.title} {...c}/>)}
      </div>

      {/* Row 1: SMS Volume vs Delivery */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:isMobile?12:16,marginBottom:isMobile?12:16}}>
        <div className="senda-card overview-chart-card" style={{padding:20}}>
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
        <div className="senda-card overview-chart-card" style={{padding:20}}>
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
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?12:16,marginBottom:isMobile?12:16}}>
        <div className="senda-card overview-chart-card" style={{padding:20}}>
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

        <div className="senda-card overview-chart-card" style={{padding:20}}>
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
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:isMobile?12:16,marginBottom:isMobile?12:16}}>
        <div className="senda-card overview-chart-card" style={{padding:20}}>
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
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:isMobile?12:16}}>
        <div className="senda-card overview-chart-card" style={{padding:20}}>
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

        <div className="senda-card overview-chart-card" style={{padding:20}}>
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
  // Default: exclude partner-network applications (development@swahilies.com et al)
  // so the cards show "our customers". Toggle to include them at any time.
  const [excludePartner, setExcludePartner] = useState(true);
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

  // Apply the partner-exclude toggle once; everything downstream reads `visibleItems`.
  const visibleItems = React.useMemo(() => {
    if (!excludePartner) return items;
    const blocked = new Set([...ENGAGEMENT_EXCLUDED_EMAILS]);
    return items.filter(s => !blocked.has(String(s.owner_email || '').toLowerCase()));
  }, [items, excludePartner]);

  // Counts:
  //  • Include partners → use the server's apiSummary (authoritative, includes pages
  //    beyond what we've loaded).
  //  • Exclude partners → recompute from visibleItems (server can't know about our filter).
  const counts = React.useMemo(() => {
    if (apiSummary && !excludePartner) {
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
        k, k === 'all' ? visibleItems.length : visibleItems.filter(s => s.status === k).length,
      ])
    );
  }, [apiSummary, items, visibleItems, excludePartner]);

  const filtered = React.useMemo(() => {
    setPage(1);
    return visibleItems.filter(s => {
      const m = filter === 'all' || s.status === filter;
      const q = search.toLowerCase();
      return m && (!q || (s.name||'').toLowerCase().includes(q) || (s.owner_email||'').toLowerCase().includes(q) || (s.company||'').toLowerCase().includes(q) || (s.id||'').toLowerCase().includes(q));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleItems, filter, search]);

  const totalFilteredPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pieDist = Object.entries(STATUS_META).map(([k,v]) => ({ name:v.label, value:counts[k], color:v.color })).filter(d=>d.value>0);

  return (
    <div className="senda-fade-in">
      {/* Audience toggle — exclude/include partner-network applications. */}
      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
        <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginRight:4}}>Audience</span>
        {[
          { id: true,  label: 'Exclude partners' },
          { id: false, label: 'Include partners' },
        ].map(opt => {
          const isActive = excludePartner === opt.id;
          return (
            <button key={String(opt.id)} onClick={() => setExcludePartner(opt.id)}
              title={opt.id
                ? `Hide senders owned by ${[...ENGAGEMENT_EXCLUDED_EMAILS].join(', ')}`
                : 'Show every sender, including partner-owned ones'}
              style={{
                height:28,padding:'0 11px',borderRadius:7,border:'none',cursor:'pointer',
                fontSize:11,fontWeight:600,
                background: isActive ? BRAND : '#f1f5f9',
                color:      isActive ? '#fff' : '#64748b',
              }}>{opt.label}</button>
          );
        })}
        {excludePartner && items.length > 0 && (
          <span style={{fontSize:10,color:'#94a3b8',marginLeft:4}}>
            {items.length - visibleItems.length} hidden
          </span>
        )}
      </div>

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

function PartnerWhatsAppCredentials({ partner }) {
  const { onLogout, showToast } = React.useContext(AppContext);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cred, setCred]           = useState(null);
  const [form, setForm]           = useState({
    label: '', phone_number_id: '', access_token: '',
    waba_id: '', verify_token: '', graph_api_base: '', is_active: true,
  });

  const load = React.useCallback(() => {
    setLoading(true);
    adminFetch(`/partners/${partner.id}/whatsapp-credentials`, {}, onLogout)
      .then(res => {
        if (res.success) {
          const d = res.data || {};
          setCred(d);
          setForm({
            label: d.label || '', phone_number_id: d.phone_number_id || '',
            access_token: '', waba_id: d.waba_id || '', verify_token: d.verify_token || '',
            graph_api_base: d.graph_api_base || '', is_active: d.is_active !== false,
          });
        } else {
          showToast && showToast(res.error?.message || 'Failed to load WhatsApp credentials', 'error');
        }
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [partner.id, onLogout, showToast]);

  useEffect(() => { load(); }, [load]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.phone_number_id.trim()) { showToast && showToast('Phone Number ID is required', 'error'); return; }
    if (!cred?.access_token_set && !form.access_token.trim()) {
      showToast && showToast('Access Token is required', 'error'); return;
    }
    setSaving(true);
    const body = {
      label: form.label.trim(), phone_number_id: form.phone_number_id.trim(),
      waba_id: form.waba_id.trim(), verify_token: form.verify_token.trim(),
      graph_api_base: form.graph_api_base.trim(), is_active: form.is_active,
    };
    if (form.access_token.trim()) body.access_token = form.access_token.trim();
    adminFetch(`/partners/${partner.id}/whatsapp-credentials`, { method: 'PUT', body: JSON.stringify(body) }, onLogout)
      .then(res => {
        if (res.success) { showToast && showToast('WhatsApp credentials saved', 'success'); load(); }
        else showToast && showToast(res.error?.message || 'Save failed', 'error');
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setSaving(false));
  };

  const verify = () => {
    setVerifying(true);
    adminFetch(`/partners/${partner.id}/whatsapp-credentials/verify`, { method: 'POST' }, onLogout)
      .then(res => {
        if (res.success) showToast && showToast('Credentials verified with Meta', 'success');
        else showToast && showToast(res.error?.message || 'Verification failed', 'error');
        load();
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setVerifying(false));
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' };
  const fieldWrap  = { marginBottom: 14 };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading WhatsApp credentials…</div>;
  }

  const statusPill = (() => {
    if (!cred?.configured) return { t: 'Not configured', bg: '#f1f5f9', fg: '#94a3b8' };
    if (!cred?.is_active)  return { t: 'Disabled',       bg: `${RED}12`,  fg: RED };
    if (cred?.verified)    return { t: 'Verified',       bg: `${GREEN}18`, fg: GREEN };
    return { t: 'Unverified', bg: `${AMBER}18`, fg: AMBER };
  })();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
      <div className="senda-card" style={{ maxWidth: 720, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Partner WhatsApp Credentials</span>
          <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: statusPill.bg, color: statusPill.fg }}>
            {statusPill.t}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18, lineHeight: 1.5 }}>
          Meta WhatsApp Cloud API credentials used to send <strong>this partner's</strong> messages —
          and the messages of every client/sub-tenant they create.
          {cred?.display_phone_number ? <> Connected number: <strong>{cred.display_phone_number}</strong>.</> : null}
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Label</label>
          <input className="senda-input" style={{ width: '100%' }} placeholder="Business / WABA name"
            value={form.label} onChange={e => setF('label', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Phone Number ID *</label>
            <input className="senda-input" style={{ width: '100%' }} placeholder="e.g. 123456789012345"
              value={form.phone_number_id} onChange={e => setF('phone_number_id', e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>WABA ID</label>
            <input className="senda-input" style={{ width: '100%' }} placeholder="Optional"
              value={form.waba_id} onChange={e => setF('waba_id', e.target.value)} />
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Access Token {cred?.access_token_set ? '(leave blank to keep current)' : '*'}</label>
          <input className="senda-input" type="password" autoComplete="new-password" style={{ width: '100%' }}
            placeholder={cred?.access_token_set ? `Stored ${cred.masked_token} — type to replace` : 'Meta long-lived / system-user token'}
            value={form.access_token} onChange={e => setF('access_token', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Verify Token</label>
            <input className="senda-input" style={{ width: '100%' }} placeholder="Webhook verify token"
              value={form.verify_token} onChange={e => setF('verify_token', e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Graph API Base</label>
            <input className="senda-input" style={{ width: '100%' }} placeholder="https://graph.facebook.com/v24.0"
              value={form.graph_api_base} onChange={e => setF('graph_api_base', e.target.value)} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569', margin: '4px 0 18px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setF('is_active', e.target.checked)} />
          Active
        </label>

        {cred?.last_verify_error && !cred?.verified && (
          <div style={{ fontSize: 12, color: RED, background: `${RED}0c`, border: `1px solid ${RED}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            {cred.last_verify_error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving}
            style={{ height: 38, padding: '0 18px', border: 'none', borderRadius: 9, background: BRAND, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>
            {saving ? 'Saving…' : (cred?.configured ? 'Update credentials' : 'Save credentials')}
          </button>
          <button onClick={verify} disabled={verifying || !cred?.configured}
            style={{ height: 38, padding: '0 18px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: (verifying || !cred?.configured) ? 'default' : 'pointer', opacity: (verifying || !cred?.configured) ? .6 : 1 }}>
            {verifying ? 'Verifying…' : 'Verify with Meta'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
          { id:'whatsapp',  label:'WhatsApp Credentials' },
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveView(t.id)}
            style={{height:42,padding:'0 18px',border:'none',background:'transparent',cursor:'pointer',
              fontSize:13,fontWeight:activeView===t.id?700:500,
              color:activeView===t.id?BRAND:'#64748b',
              borderBottom:activeView===t.id?`2px solid ${BRAND}`:'2px solid transparent',
              display:'flex',alignItems:'center',gap:7,transition:'all .15s',flexShrink:0,
            }}>
            {t.label}
            {t.count != null && (
              <span style={{padding:'1px 7px',borderRadius:99,fontSize:10,fontWeight:700,
                background:activeView===t.id?`${BRAND}18`:'#f1f5f9',
                color:activeView===t.id?BRAND:'#94a3b8'}}>
                {t.count}
              </span>
            )}
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

      {/* ── WhatsApp Credentials view ── */}
      {activeView === 'whatsapp' && <PartnerWhatsAppCredentials partner={partner} />}
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

// ─── Push Notifications Tab ─────────────────────────────────────────────────────
// Admin audit + control surface for Web Push. Lists every push dispatched to
// users (automated events, system, manual sends, broadcasts and tests), with
// filters, delivery stats, a broadcast composer and per-row resend.
const PUSH_STATUS_STYLE = {
  sent:    { bg:'#d1fae5', color:'#065f46', label:'Sent' },
  failed:  { bg:'#fee2e2', color:'#991b1b', label:'Failed' },
  skipped: { bg:'#f1f5f9', color:'#475569', label:'Skipped' },
  pending: { bg:'#fef3c7', color:'#92400e', label:'Pending' },
};
const PUSH_SOURCE_STYLE = {
  event:     { bg:'#eff6ff', color:'#1d4ed8', label:'Event' },
  system:    { bg:'#f5f3ff', color:'#6d28d9', label:'System' },
  manual:    { bg:'#ecfeff', color:'#0e7490', label:'Manual' },
  broadcast: { bg:'#fff7ed', color:'#c2410c', label:'Broadcast' },
  test:      { bg:'#f1f5f9', color:'#475569', label:'Test' },
};

function PushPill({ map, value }) {
  const s = map[value] || { bg:'#f1f5f9', color:'#475569', label:value || '—' };
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,
      fontSize:11,fontWeight:600,background:s.bg,color:s.color}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor'}}/>{s.label}
    </span>
  );
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // ISO: Mon=0 … Sun=6

const FIELD_LABEL = {display:'block',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6};

function PushBroadcastModal({ onClose, onSent, editing }) {
  const { showToast, onLogout } = React.useContext(AppContext);
  const [mode, setMode]     = useState(editing ? 'schedule' : 'now'); // 'now' | 'schedule'
  const [title, setTitle]   = useState(editing?.title || '');
  const [body, setBody]     = useState(editing?.body || '');
  const [url, setUrl]       = useState(editing?.url || '');
  const [target, setTarget] = useState(editing?.target || 'subscribed');
  const [frequency, setFrequency] = useState(editing?.frequency || 'daily');
  const [sendTime, setSendTime]   = useState((editing?.send_time || '09:00').slice(0,5));
  const [weekdays, setWeekdays]   = useState(editing?.weekdays || [0]);
  const [sending, setSending]     = useState(false);

  const toggleDay = (d) => setWeekdays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d].sort((a,b)=>a-b));

  // Lock background scroll + close on Escape while the modal is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = async () => {
    if (!title.trim()) { showToast('Title is required', 'error'); return; }

    if (mode === 'now') {
      setSending(true);
      try {
        const res = await adminFetch('/api/notifications/admin/push-send/', {
          method: 'POST',
          body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim(), target }),
        }, onLogout);
        if (res.success) {
          showToast(res.message || `Push delivered to ${res.delivered} device(s)`, 'success');
          onSent && onSent(); onClose();
        } else {
          showToast(res.error?.message || res.error || 'Failed to send push', 'error');
        }
      } catch { showToast('Network error sending push', 'error'); }
      finally { setSending(false); }
      return;
    }

    // Schedule (create or update)
    if (frequency === 'weekly' && weekdays.length === 0) {
      showToast('Pick at least one day for a weekly schedule', 'error'); return;
    }
    setSending(true);
    const payload = {
      title: title.trim(), body: body.trim(), url: url.trim(), target,
      frequency, send_time: sendTime, weekdays: frequency === 'weekly' ? weekdays : [],
    };
    try {
      const path = editing
        ? `/api/notifications/admin/push-schedules/${editing.id}/`
        : '/api/notifications/admin/push-schedules/';
      const res = await adminFetch(path, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      }, onLogout);
      if (res.success) {
        showToast(editing ? 'Schedule updated' : 'Schedule created', 'success');
        onSent && onSent(); onClose();
      } else {
        showToast(res.error?.message || res.error || 'Failed to save schedule', 'error');
      }
    } catch { showToast('Network error saving schedule', 'error'); }
    finally { setSending(false); }
  };

  const inputSm = { height:42, fontSize:13.5, borderRadius:10 };
  const subtitle = editing ? 'Update this recurring message'
    : mode === 'now' ? 'Deliver instantly to your audience'
    : 'Send automatically on a repeating schedule';

  // Render through a portal to <body> so the fixed overlay covers the whole
  // viewport — otherwise a transformed ancestor (the tab's fade animation keeps
  // a transform via fill:both) would clip and contain it.
  return createPortal((
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.55)',
      backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-start',justifyContent:'center',
      padding:'24px 16px',overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()} className="senda-fade-up"
        style={{width:'100%',maxWidth:460,margin:'auto',background:'#fff',borderRadius:18,
          boxShadow:'0 24px 70px rgba(15,23,42,.28)',display:'flex',flexDirection:'column',
          maxHeight:'calc(100vh - 48px)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:13,padding:'20px 22px',borderBottom:'1px solid #eef2f7',flexShrink:0}}>
          <div style={{width:42,height:42,borderRadius:12,flexShrink:0,
            background:`linear-gradient(135deg,${BRAND},${BRAND2})`,boxShadow:`0 6px 16px ${BRAND}40`,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Bell size={19} strokeWidth={2.3} color="#fff"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h3 style={{fontSize:16,fontWeight:800,color:'#0f172a',letterSpacing:'-.2px'}}>{editing ? 'Edit schedule' : 'New push'}</h3>
            <p style={{fontSize:12,color:'#94a3b8',marginTop:1}}>{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{border:'none',background:'#f1f5f9',borderRadius:9,
            width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#64748b',flexShrink:0}}>
            <X size={16}/>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{padding:'18px 22px',overflowY:'auto',flex:1}}>
          {!editing && (
            <div style={{position:'relative',display:'flex',background:'#f1f5f9',padding:4,borderRadius:12,marginBottom:20}}>
              <div style={{position:'absolute',top:4,bottom:4,left:mode==='now'?4:'50%',width:'calc(50% - 4px)',
                background:'#fff',borderRadius:9,boxShadow:'0 1px 4px rgba(15,23,42,.10)',transition:'left .2s ease'}}/>
              {[['now','Send now'],['schedule','Schedule recurring']].map(([id,label])=>(
                <button key={id} onClick={()=>setMode(id)} style={{flex:1,position:'relative',zIndex:1,
                  padding:'9px 8px',border:'none',background:'transparent',cursor:'pointer',
                  fontSize:13,fontWeight:700,fontFamily:'inherit',
                  color: mode===id ? BRAND : '#94a3b8',transition:'color .2s'}}>{label}</button>
              ))}
            </div>
          )}

          <label style={FIELD_LABEL}>Title</label>
          <input className="senda-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Weekly tips & updates" style={{...inputSm,marginBottom:14}}/>

          <label style={FIELD_LABEL}>Message</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Notification body…"
            className="senda-input" style={{height:'auto',fontSize:13.5,borderRadius:10,padding:'10px 14px',marginBottom:14,resize:'vertical',lineHeight:1.55}}/>

          <label style={FIELD_LABEL}>Click-through URL <span style={{color:'#cbd5e1',fontWeight:500}}>· optional</span></label>
          <input className="senda-input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="/dashboard" style={{...inputSm,marginBottom:14}}/>

          {mode === 'schedule' && (
            <div style={{background:'#f8fafc',border:'1px solid #eef2f7',borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <div style={{flex:'1 1 140px'}}>
                  <label style={FIELD_LABEL}>Frequency</label>
                  <select className="senda-input" value={frequency} onChange={e=>setFrequency(e.target.value)} style={{...inputSm,background:'#fff'}}>
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="once">Once</option>
                  </select>
                </div>
                <div style={{flex:'1 1 110px'}}>
                  <label style={FIELD_LABEL}>Time</label>
                  <input type="time" className="senda-input" value={sendTime} onChange={e=>setSendTime(e.target.value)} style={{...inputSm,background:'#fff'}}/>
                </div>
              </div>

              {frequency === 'weekly' && (
                <div style={{marginTop:14}}>
                  <label style={FIELD_LABEL}>Days of week</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {WEEKDAY_LABELS.map((lbl, d) => {
                      const on = weekdays.includes(d);
                      return (
                        <button key={d} onClick={()=>toggleDay(d)} style={{
                          minWidth:42,height:36,padding:'0 8px',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',
                          border: on ? `1.5px solid ${BRAND}` : '1.5px solid #e2e8f0',
                          background: on ? BRAND : '#fff', color: on ? '#fff' : '#94a3b8',
                          transition:'all .15s',
                        }}>{lbl}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p style={{fontSize:11,color:'#94a3b8',marginTop:12,display:'flex',alignItems:'center',gap:5}}>
                <Clock size={12} strokeWidth={2}/> Platform timezone · Africa/Dar es Salaam
              </p>
            </div>
          )}

          <label style={FIELD_LABEL}>Audience</label>
          <select className="senda-input" value={target} onChange={e=>setTarget(e.target.value)} style={{...inputSm}}>
            <option value="subscribed">Subscribed users (have enabled push)</option>
            <option value="all">All active users</option>
            <option value="tenant">My tenant only</option>
          </select>
        </div>

        {/* Footer (sticky) */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px',borderTop:'1px solid #eef2f7',flexShrink:0,background:'#fff'}}>
          <button className="senda-btn senda-btn-ghost senda-btn-sm" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={submit} disabled={sending}>
            {sending ? <><Spinner size={14} color="#fff"/> Saving…</>
              : mode==='now' ? <><Send size={14} strokeWidth={2.2}/> Send broadcast</>
              : <><Clock size={14} strokeWidth={2.2}/> {editing ? 'Save schedule' : 'Create schedule'}</>}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

function PushNotificationsTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [stats, setStats]     = useState(null);
  const [rows, setRows]       = useState([]);
  const [meta, setMeta]       = useState({ page:1, total_pages:1, total:0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [schedules, setSchedules] = useState([]);

  // Filters
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('');
  const [sourceF, setSourceF] = useState('');
  const [page, setPage]       = useState(1);

  const fetchStats = useCallback(() => {
    adminFetch('/api/notifications/admin/push-stats/', {}, onLogout)
      .then(res => { if (res.success) setStats(res.data); })
      .catch(() => {});
  }, [onLogout]);

  const fetchLogs = useCallback(() => {
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ page:String(page), limit:'25' });
    if (search.trim()) qs.set('search', search.trim());
    if (statusF) qs.set('status', statusF);
    if (sourceF) qs.set('source', sourceF);
    adminFetch(`/api/notifications/admin/push-logs/?${qs}`, {}, onLogout)
      .then(res => {
        if (res.success) { setRows(res.data || []); setMeta(res.meta || { page:1, total_pages:1, total:0 }); }
        else setError(res.error?.message || res.error || 'Failed to load push logs.');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [onLogout, page, search, statusF, sourceF]);

  const fetchSchedules = useCallback(() => {
    adminFetch('/api/notifications/admin/push-schedules/', {}, onLogout)
      .then(res => { if (res.success) setSchedules(res.data || []); })
      .catch(() => {});
  }, [onLogout]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => { setPage(1); }, [search, statusF, sourceF]);

  const refreshAll = () => { fetchStats(); fetchLogs(); fetchSchedules(); };

  const toggleSchedule = async (s) => {
    const res = await adminFetch(`/api/notifications/admin/push-schedules/${s.id}/`, {
      method: 'PATCH', body: JSON.stringify({ is_active: !s.is_active }),
    }, onLogout);
    if (res.success) { showToast(s.is_active ? 'Schedule paused' : 'Schedule resumed', 'success'); fetchSchedules(); }
    else showToast('Failed to update schedule', 'error');
  };

  const deleteSchedule = async (s) => {
    if (!window.confirm(`Delete the schedule "${s.title}"?`)) return;
    const res = await adminFetch(`/api/notifications/admin/push-schedules/${s.id}/`, { method:'DELETE' }, onLogout);
    if (res.success) { showToast('Schedule deleted', 'success'); fetchSchedules(); }
    else showToast('Failed to delete schedule', 'error');
  };

  const scheduleSummary = (s) => {
    const time = (s.send_time || '').slice(0,5);
    if (s.frequency === 'daily') return `Every day at ${time}`;
    if (s.frequency === 'once')  return `Once at ${time}`;
    const days = (s.weekdays || []).map(d => WEEKDAY_LABELS[d]).join(', ');
    return `Weekly (${days || '—'}) at ${time}`;
  };

  const handleResend = async (id) => {
    setResendingId(id);
    try {
      const res = await adminFetch(`/api/notifications/admin/push-logs/${id}/resend/`, { method:'POST' }, onLogout);
      if (res.success) showToast('Push re-sent successfully', 'success');
      else showToast(`Resend ${res.status || 'failed'}: ${res.log?.error_message || res.error || ''}`, 'error');
      refreshAll();
    } catch {
      showToast('Network error on resend', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const statCards = stats ? [
    { title:'Pushes (7 days)', value:Number(stats.last_7_days||0).toLocaleString(), desc:`${Number(stats.today||0).toLocaleString()} today · ${Number(stats.total||0).toLocaleString()} all-time`, icon:Bell, accent:BRAND },
    { title:'Delivery rate', value:`${stats.delivery_rate ?? 0}%`, desc:`${Number(stats.devices_delivered||0).toLocaleString()} of ${Number(stats.devices_targeted||0).toLocaleString()} devices reached`, icon:CheckCircle2, accent:GREEN },
    { title:'Failed', value:Number(stats.failed||0).toLocaleString(), desc:`${Number(stats.skipped||0).toLocaleString()} skipped (recipient has no device)`, icon:XCircle, accent:RED },
    { title:'Active devices', value:Number(stats.active_subscriptions||0).toLocaleString(), desc:`${Number(stats.subscribed_users||0).toLocaleString()} users subscribed`, icon:Users, accent:VIOLET },
  ] : [];

  return (
    <div className="senda-fade-in">
      <SectionHeader
        title="Push Notifications"
        subtitle="Every web push sent to users — automated events, system alerts, manual sends and broadcasts."
        actions={
          <>
            <button className="senda-btn senda-btn-ghost senda-btn-sm" onClick={refreshAll}>
              <RefreshCw size={14} strokeWidth={2.2}/> Refresh
            </button>
            <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={()=>{ setEditingSchedule(null); setShowCompose(true); }}>
              <Send size={14} strokeWidth={2.2}/> New push
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fill,minmax(220px,1fr))',gap:14,marginBottom:20}}>
        {statCards.length ? statCards.map(c => <StatCard key={c.title} {...c}/>) : (
          [0,1,2,3].map(i => <div key={i} className="senda-card" style={{height:104,opacity:.5}}/>)
        )}
      </div>

      {/* Recurring schedules */}
      {schedules.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <Clock size={13} strokeWidth={2.2}/> Recurring schedules ({schedules.length})
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {schedules.map(s => (
              <div key={s.id} className="senda-card" style={{padding:'14px 16px',opacity:s.is_active?1:0.6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:700,color:'#0f172a',fontSize:13.5,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.title}</div>
                    <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{scheduleSummary(s)}</div>
                  </div>
                  <PushPill map={PUSH_STATUS_STYLE} value={s.is_active ? 'sent' : 'skipped'}/>
                </div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:8,display:'flex',gap:12,flexWrap:'wrap'}}>
                  <span>{s.target_display || s.target}</span>
                  {s.total_runs > 0 && <span>· sent {s.total_runs}×</span>}
                  {s.next_run_at && s.is_active && <span>· next {new Date(s.next_run_at).toLocaleString()}</span>}
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,borderTop:'1px solid #f1f5f9',paddingTop:10}}>
                  <button className="senda-btn senda-btn-ghost senda-btn-sm" onClick={()=>{ setEditingSchedule(s); setShowCompose(true); }}>Edit</button>
                  <button className="senda-btn senda-btn-ghost senda-btn-sm" onClick={()=>toggleSchedule(s)}>{s.is_active ? 'Pause' : 'Resume'}</button>
                  <button className="senda-btn senda-btn-danger senda-btn-sm" onClick={()=>deleteSchedule(s)} style={{marginLeft:'auto'}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="senda-card" style={{padding:14,marginBottom:16,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 220px',minWidth:180}}>
          <Search size={15} strokeWidth={2} color="#94a3b8" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input className="senda-input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search title, message or user email…" style={{height:38,paddingLeft:36,fontSize:13}}/>
        </div>
        <select className="senda-input" value={statusF} onChange={e=>setStatusF(e.target.value)} style={{height:38,width:'auto',fontSize:13}}>
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
          <option value="pending">Pending</option>
        </select>
        <select className="senda-input" value={sourceF} onChange={e=>setSourceF(e.target.value)} style={{height:38,width:'auto',fontSize:13}}>
          <option value="">All sources</option>
          <option value="event">Event</option>
          <option value="system">System</option>
          <option value="manual">Manual</option>
          <option value="broadcast">Broadcast</option>
          <option value="test">Test</option>
        </select>
      </div>

      {/* Table */}
      <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:'60px 0',display:'flex',justifyContent:'center'}}><Spinner size={26} color={BRAND}/></div>
        ) : error ? (
          <div style={{padding:'40px 20px',textAlign:'center',color:RED,fontSize:13}}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={{padding:'48px 20px',textAlign:'center',color:'#94a3b8'}}>
            <Bell size={28} strokeWidth={1.6} style={{opacity:.4,marginBottom:8}}/>
            <p style={{fontSize:13}}>No push notifications match your filters yet.</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:880}}>
              <thead>
                <tr>
                  <th>Time</th><th>Recipient</th><th>Notification</th><th>Source</th>
                  <th>Status</th><th>Devices</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{whiteSpace:'nowrap',color:'#64748b'}}>
                      <div style={{fontSize:12}}>{fmtTime(r.created_at)}</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>{r.time_ago}</div>
                    </td>
                    <td>
                      {(r.user_name || r.user_email) ? (
                        <>
                          <div style={{fontWeight:600,color:'#0f172a',fontSize:12.5}}>{r.user_name || r.user_email}</div>
                          {r.user_email && r.user_name && <div style={{fontSize:11,color:'#94a3b8'}}>{r.user_email}</div>}
                          {r.tenant_name && <div style={{fontSize:11,color:'#cbd5e1'}}>{r.tenant_name}</div>}
                        </>
                      ) : (
                        <div style={{fontWeight:600,color:'#475569',fontSize:12.5,display:'inline-flex',alignItems:'center',gap:5}}>
                          <Users size={12} strokeWidth={2.2} style={{color:'#94a3b8'}}/>
                          {r.audience === 'tenant' && r.tenant_name
                            ? `Tenant · ${r.tenant_name}`
                            : (r.audience_display || 'All subscribers')}
                        </div>
                      )}
                    </td>
                    <td style={{maxWidth:300}}>
                      <div style={{fontWeight:600,color:'#0f172a',fontSize:12.5,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.title}</div>
                      {r.body && <div style={{fontSize:11.5,color:'#64748b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.body}</div>}
                      {r.error_message && r.status === 'failed' && (
                        <div style={{fontSize:11,color:RED,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={r.error_message}>⚠ {r.error_message}</div>
                      )}
                    </td>
                    <td><PushPill map={PUSH_SOURCE_STYLE} value={r.source}/></td>
                    <td><PushPill map={PUSH_STATUS_STYLE} value={r.status}/></td>
                    <td style={{whiteSpace:'nowrap',color:'#475569',fontSize:12}}>
                      {r.devices_delivered}/{r.devices_targeted}
                    </td>
                    <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                      {(r.status === 'failed' || r.status === 'sent') && r.user_email && (
                        <button className="senda-btn senda-btn-ghost senda-btn-sm" disabled={resendingId===r.id}
                          onClick={()=>handleResend(r.id)} title="Resend this push">
                          {resendingId===r.id ? <Spinner size={13} color={BRAND}/> : <RefreshCw size={13} strokeWidth={2.2}/>}
                          {!isMobile && (resendingId===r.id ? ' Sending' : ' Resend')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && rows.length > 0 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,flexWrap:'wrap',gap:8}}>
          <span style={{fontSize:12,color:'#94a3b8'}}>
            Page {meta.page} of {meta.total_pages} · {Number(meta.total||0).toLocaleString()} total
          </span>
          <div style={{display:'flex',gap:8}}>
            <button className="senda-btn senda-btn-ghost senda-btn-sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button>
            <button className="senda-btn senda-btn-ghost senda-btn-sm" disabled={page>=(meta.total_pages||1)} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      )}

      {showCompose && (
        <PushBroadcastModal
          editing={editingSchedule}
          onClose={()=>{ setShowCompose(false); setEditingSchedule(null); }}
          onSent={refreshAll}
        />
      )}
    </div>
  );
}

function DefaultWhatsAppCredentials() {
  const { onLogout, showToast } = React.useContext(AppContext);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [open, setOpen]           = useState(false);
  const [cred, setCred]           = useState(null);
  const [form, setForm]           = useState({
    label: '', phone_number_id: '', access_token: '',
    waba_id: '', verify_token: '', graph_api_base: '', is_active: true,
  });

  const load = React.useCallback(() => {
    setLoading(true);
    adminFetch('/whatsapp-credentials/default', {}, onLogout)
      .then(res => {
        if (res.success) {
          const d = res.data || {};
          setCred(d);
          setForm({
            label: d.label || '', phone_number_id: d.phone_number_id || '',
            access_token: '', waba_id: d.waba_id || '', verify_token: d.verify_token || '',
            graph_api_base: d.graph_api_base || '', is_active: d.is_active !== false,
          });
        } else {
          showToast && showToast(res.error?.message || 'Failed to load platform WhatsApp credentials', 'error');
        }
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [onLogout, showToast]);

  useEffect(() => { load(); }, [load]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.phone_number_id.trim()) { showToast && showToast('Phone Number ID is required', 'error'); return; }
    if (!cred?.access_token_set && !form.access_token.trim()) {
      showToast && showToast('Access Token is required', 'error'); return;
    }
    setSaving(true);
    const body = {
      label: form.label.trim(), phone_number_id: form.phone_number_id.trim(),
      waba_id: form.waba_id.trim(), verify_token: form.verify_token.trim(),
      graph_api_base: form.graph_api_base.trim(), is_active: form.is_active,
    };
    if (form.access_token.trim()) body.access_token = form.access_token.trim();
    adminFetch('/whatsapp-credentials/default', { method: 'PUT', body: JSON.stringify(body) }, onLogout)
      .then(res => {
        if (res.success) { showToast && showToast('Platform default WhatsApp credentials saved', 'success'); load(); }
        else showToast && showToast(res.error?.message || 'Save failed', 'error');
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setSaving(false));
  };

  const verify = () => {
    setVerifying(true);
    adminFetch('/whatsapp-credentials/default/verify', { method: 'POST' }, onLogout)
      .then(res => {
        if (res.success) showToast && showToast('Credentials verified with Meta', 'success');
        else showToast && showToast(res.error?.message || 'Verification failed', 'error');
        load();
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setVerifying(false));
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' };
  const fieldWrap  = { marginBottom: 14 };

  const statusPill = (() => {
    if (loading)           return { t: 'Loading…',      bg: '#f1f5f9', fg: '#94a3b8' };
    if (!cred?.configured) return { t: 'Not configured', bg: '#f1f5f9', fg: '#94a3b8' };
    if (!cred?.is_active)  return { t: 'Disabled',       bg: `${RED}12`,  fg: RED };
    if (cred?.verified)    return { t: 'Verified',       bg: `${GREEN}18`, fg: GREEN };
    return { t: 'Unverified', bg: `${AMBER}18`, fg: AMBER };
  })();

  return (
    <div className="senda-card" style={{ padding: 22, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={16} strokeWidth={2} color={GREEN} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Platform Default WhatsApp Credentials</h3>
            <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: statusPill.bg, color: statusPill.fg }}>{statusPill.t}</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
            Used to send messages for all normal (non-partner) customers.
            {cred?.display_phone_number ? <> Number: <strong>{cred.display_phone_number}</strong>.</> : null}
          </p>
        </div>
        <span style={{ fontSize: 18, color: '#94a3b8' }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && !loading && (
        <div style={{ marginTop: 18, maxWidth: 720 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Label</label>
            <input className="senda-input" style={{ width: '100%' }} placeholder="Platform business / WABA name"
              value={form.label} onChange={e => setF('label', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Phone Number ID *</label>
              <input className="senda-input" style={{ width: '100%' }} placeholder="e.g. 123456789012345"
                value={form.phone_number_id} onChange={e => setF('phone_number_id', e.target.value)} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>WABA ID</label>
              <input className="senda-input" style={{ width: '100%' }} placeholder="Optional"
                value={form.waba_id} onChange={e => setF('waba_id', e.target.value)} />
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Access Token {cred?.access_token_set ? '(leave blank to keep current)' : '*'}</label>
            <input className="senda-input" type="password" autoComplete="new-password" style={{ width: '100%' }}
              placeholder={cred?.access_token_set ? `Stored ${cred.masked_token} — type to replace` : 'Meta long-lived / system-user token'}
              value={form.access_token} onChange={e => setF('access_token', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Verify Token</label>
              <input className="senda-input" style={{ width: '100%' }} placeholder="Webhook verify token"
                value={form.verify_token} onChange={e => setF('verify_token', e.target.value)} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Graph API Base</label>
              <input className="senda-input" style={{ width: '100%' }} placeholder="https://graph.facebook.com/v24.0"
                value={form.graph_api_base} onChange={e => setF('graph_api_base', e.target.value)} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569', margin: '4px 0 18px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setF('is_active', e.target.checked)} />
            Active
          </label>
          {cred?.last_verify_error && !cred?.verified && (
            <div style={{ fontSize: 12, color: RED, background: `${RED}0c`, border: `1px solid ${RED}33`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              {cred.last_verify_error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving}
              style={{ height: 38, padding: '0 18px', border: 'none', borderRadius: 9, background: BRAND, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>
              {saving ? 'Saving…' : (cred?.configured ? 'Update credentials' : 'Save credentials')}
            </button>
            <button onClick={verify} disabled={verifying || !cred?.configured}
              style={{ height: 38, padding: '0 18px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: (verifying || !cred?.configured) ? 'default' : 'pointer', opacity: (verifying || !cred?.configured) ? .6 : 1 }}>
              {verifying ? 'Verifying…' : 'Verify with Meta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sender Approval SMS Settings ──────────────────────────────────────────────
// Controls whether the approval SMS is sent when a sender name is approved AND the
// message text used — independently for direct users and partner clients.
// Backed by /api/admin/v1/sender-approval-notifications (GET + /update PATCH).
const SMS_PLACEHOLDERS = ['{sender_name}', '{name}'];

function renderSmsPreview(template) {
  return (template || '')
    .replace(/\{sender_name\}/g, 'ACME')
    .replace(/\{name\}/g, 'Asha');
}

function SenderApprovalSmsSettings() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const [settings, setSettings] = useState({
    notify_direct_users: true, notify_partner_clients: true,
    direct_users_message: '', partner_clients_message: '',
    defaults: {}, placeholders: SMS_PLACEHOLDERS,
  });
  const [drafts, setDrafts]     = useState({ direct_users_message: '', partner_clients_message: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [savingKey, setSavingKey] = useState(null); // toggle currently saving
  const [savingMsg, setSavingMsg] = useState(null); // message currently saving

  const applyServer = (data) => {
    setSettings(data || {});
    setDrafts({
      direct_users_message: (data && data.direct_users_message) || '',
      partner_clients_message: (data && data.partner_clients_message) || '',
    });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    adminFetch('/api/admin/v1/sender-approval-notifications', {}, onLogout)
      .then(res => {
        if (!alive) return;
        if (res.success) applyServer(res.data);
        else setError(res.error?.message || 'Failed to load settings.');
      })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [onLogout]);

  const patch = async (payload) => {
    return adminFetch('/api/admin/v1/sender-approval-notifications/update', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, onLogout);
  };

  const toggle = async (key) => {
    if (savingKey) return;
    const next = !settings[key];
    setSavingKey(key);
    setSettings(prev => ({ ...prev, [key]: next })); // optimistic
    try {
      const res = await patch({ [key]: next });
      if (res.success) { applyServer(res.data); showToast('Approval SMS setting updated.', 'success'); }
      else { setSettings(prev => ({ ...prev, [key]: !next })); showToast(res.error?.message || 'Failed to update setting.', 'error'); }
    } catch (e) {
      setSettings(prev => ({ ...prev, [key]: !next }));
      showToast('Network error while updating.', 'error');
    } finally { setSavingKey(null); }
  };

  const saveMessage = async (msgKey, valueOverride) => {
    if (savingMsg) return;
    const value = (valueOverride !== undefined ? valueOverride : drafts[msgKey]).trim();
    if (!value) { showToast('Message cannot be empty.', 'error'); return; }
    setSavingMsg(msgKey);
    try {
      const res = await patch({ [msgKey]: value });
      if (res.success) { applyServer(res.data); showToast('Message saved.', 'success'); }
      else { showToast(res.error?.message || 'Failed to save message.', 'error'); }
    } catch (e) {
      showToast('Network error while saving.', 'error');
    } finally { setSavingMsg(null); }
  };

  const resetMessage = (msgKey) => {
    const def = (settings.defaults && settings.defaults[msgKey]) || '';
    if (!def) { showToast('No default available.', 'error'); return; }
    setDrafts(prev => ({ ...prev, [msgKey]: def }));
    saveMessage(msgKey, def);
  };

  // Toggle switch markup (button has no focus-sensitive state → safe as a component).
  const Switch = ({ on, busy, label, onClick }) => (
    <button
      role="switch" aria-checked={on} aria-label={label}
      disabled={busy || loading} onClick={onClick}
      style={{
        position:'relative', width:46, height:26, borderRadius:13, flexShrink:0, border:'none',
        cursor:(busy||loading)?'wait':'pointer', background: on ? BRAND : '#cbd5e1',
        transition:'background .2s ease', opacity:(busy||loading)?0.7:1,
      }}>
      <span style={{
        position:'absolute', top:3, left: on ? 23 : 3, width:20, height:20, borderRadius:'50%',
        background:'#fff', transition:'left .2s ease', boxShadow:'0 1px 3px rgba(0,0,0,.25)',
      }}/>
    </button>
  );

  // Render a section inline (NOT as <Component/>) so the textarea keeps focus across renders.
  const section = (toggleKey, msgKey, title, desc) => {
    const on    = !!settings[toggleKey];
    const draft = drafts[msgKey] || '';
    const dirty = draft !== (settings[msgKey] || '');
    const isDefault = draft === ((settings.defaults && settings.defaults[msgKey]) || '');
    const busyMsg = savingMsg === msgKey;
    const segs = smsSegments(draft).segments;

    return (
      <div key={msgKey} style={{padding:'18px 0', borderTop:'1px solid #f1f5f9'}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16}}>
          <div style={{minWidth:0}}>
            <p style={{fontSize:14,fontWeight:700,color:'#0f172a',margin:0}}>{title}</p>
            <p style={{fontSize:12,color:'#64748b',margin:'3px 0 0',lineHeight:1.5}}>{desc}</p>
          </div>
          <Switch on={on} busy={savingKey===toggleKey} label={title} onClick={() => toggle(toggleKey)} />
        </div>

        <div style={{marginTop:12, opacity: on ? 1 : 0.55}}>
          <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>
            Message text
          </label>
          <textarea
            value={draft}
            onChange={e => setDrafts(prev => ({ ...prev, [msgKey]: e.target.value }))}
            rows={3}
            placeholder="Enter the approval SMS message…"
            style={{
              width:'100%', boxSizing:'border-box', resize:'vertical',
              padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0',
              fontSize:13, lineHeight:1.5, color:'#0f172a', fontFamily:'inherit', outline:'none',
            }}
          />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:6,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#94a3b8'}}>Placeholders:</span>
              {SMS_PLACEHOLDERS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDrafts(prev => ({ ...prev, [msgKey]: (prev[msgKey] || '') + p }))}
                  style={{
                    fontSize:11, fontFamily:'monospace', color:BRAND, background:'#eff6ff',
                    border:'1px solid #dbeafe', borderRadius:6, padding:'2px 6px', cursor:'pointer',
                  }}>
                  {p}
                </button>
              ))}
            </div>
            <span style={{fontSize:11,color: draft.length>800?RED:'#94a3b8'}}>
              {draft.length} chars · {segs} SMS{segs===1?'':'s'}
            </span>
          </div>

          <div style={{
            marginTop:10, padding:'10px 12px', background:'#f8fafc',
            border:'1px solid #f1f5f9', borderRadius:8,
          }}>
            <p style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',margin:'0 0 4px'}}>Preview</p>
            <p style={{fontSize:13,color:'#334155',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap'}}>
              {renderSmsPreview(draft) || '—'}
            </p>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
            <button
              className="senda-btn senda-btn-primary senda-btn-sm"
              disabled={!dirty || busyMsg || !draft.trim()}
              onClick={() => saveMessage(msgKey)}
              style={{opacity:(!dirty || busyMsg || !draft.trim())?0.5:1}}>
              {busyMsg ? 'Saving…' : 'Save message'}
            </button>
            {dirty && (
              <button
                className="senda-btn senda-btn-ghost senda-btn-sm"
                disabled={busyMsg}
                onClick={() => setDrafts(prev => ({ ...prev, [msgKey]: settings[msgKey] || '' }))}>
                Cancel
              </button>
            )}
            <button
              className="senda-btn senda-btn-ghost senda-btn-sm"
              disabled={busyMsg || isDefault}
              onClick={() => resetMessage(msgKey)}
              style={{marginLeft:'auto', opacity:(busyMsg||isDefault)?0.5:1}}>
              Reset to default
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="senda-card" style={{padding:24, marginBottom:20}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
        <div>
          <p style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>Settings</p>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'3px 0 0'}}>Sender Approval SMS</h3>
        </div>
        <div style={{width:36,height:36,borderRadius:10,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Bell size={16} strokeWidth={2} color={BRAND}/>
        </div>
      </div>
      <p style={{fontSize:13,color:'#64748b',lineHeight:1.55,margin:'10px 0 4px'}}>
        Control the confirmation SMS sent to a customer when their sender name is approved —
        the on/off switch and the message text, separately for direct users and partner clients.
        Turn the switch off to silently approve without notifying. Bonus credits are unaffected.
      </p>

      {loading ? (
        <p style={{fontSize:13,color:'#94a3b8',margin:'16px 0 0'}}>Loading…</p>
      ) : error ? (
        <p style={{fontSize:13,color:RED,margin:'16px 0 0'}}>{error}</p>
      ) : (
        <div style={{marginTop:8}}>
          {section('notify_direct_users', 'direct_users_message', 'Direct users',
            'Customers who registered directly on the platform.')}
          {section('notify_partner_clients', 'partner_clients_message', 'Partner clients',
            'Customers created via API by a partner / Partina.')}
        </div>
      )}
    </div>
  );
}

// ─── System SMS Log Tab ─────────────────────────────────────────────────────────
// Browse every logged outbound SMS (SystemOutboundSMSLog) with search + filters.
// Backed by /api/admin/v1/system-sms-logs (+ /categories for the dropdown).
function SystemSmsLogTab() {
  const { onLogout } = React.useContext(AppContext);
  const [categories, setCategories] = useState([]);
  const [search, setSearch]         = useState('');
  const [debounced, setDebounced]   = useState('');
  const [category, setCategory]     = useState('all');
  const [statusF, setStatusF]       = useState('all');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);
  const [items, setItems]           = useState([]);
  const [meta, setMeta]             = useState({});
  const [summary, setSummary]       = useState({ total:0, sent:0, failed:0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [detail, setDetail]         = useState(null);
  const PER = 20;

  // Load category choices once for the dropdown.
  useEffect(() => {
    let alive = true;
    adminFetch('/api/admin/v1/system-sms-logs/categories', {}, onLogout)
      .then(res => { if (alive && res.success) setCategories(res.data || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [onLogout]);

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ page: String(page), limit: String(PER) });
    if (category !== 'all') qs.set('category', category);
    if (statusF !== 'all')  qs.set('status', statusF);
    if (dateFrom)           qs.set('date_from', dateFrom);
    if (dateTo)             qs.set('date_to', dateTo);
    if (debounced.trim())   qs.set('search', debounced.trim());

    adminFetch(`/api/admin/v1/system-sms-logs?${qs.toString()}`, {}, onLogout)
      .then(res => {
        if (res.success) {
          setItems(res.data || []);
          setMeta(res.meta || {});
          setSummary(res.summary || { total:0, sent:0, failed:0 });
        } else {
          setError(res.error?.message || 'Failed to load SMS logs.');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, category, statusF, dateFrom, dateTo, debounced, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pages = meta.total_pages || 1;
  const total = meta.total || 0;

  const resetFilters = () => {
    setSearch(''); setDebounced(''); setCategory('all'); setStatusF('all');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const StatChip = ({ label, value, color }) => (
    <div className="senda-card" style={{padding:'12px 16px', flex:'1 1 120px', minWidth:120}}>
      <p style={{fontSize:11,color:'#94a3b8',margin:0,fontWeight:600}}>{label}</p>
      <p style={{fontSize:20,fontWeight:800,color:color||'#0f172a',margin:'2px 0 0'}}>{(value||0).toLocaleString()}</p>
    </div>
  );

  return (
    <div className="senda-fade-in">
      {/* Summary chips */}
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <StatChip label="Total (filtered)" value={summary.total} />
        <StatChip label="Sent" value={summary.sent} color={GREEN} />
        <StatChip label="Failed" value={summary.failed} color={RED} />
      </div>

      {/* Filters */}
      <div className="senda-card" style={{padding:16, marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:4}}>Search</label>
            <input className="senda-input" placeholder="Phone, sender, message, email…"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{height:38,fontSize:13}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:4}}>Category</label>
            <select className="senda-input" value={category}
              onChange={e=>{ setCategory(e.target.value); setPage(1); }}
              style={{height:38,fontSize:13}}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:4}}>Status</label>
            <select className="senda-input" value={statusF}
              onChange={e=>{ setStatusF(e.target.value); setPage(1); }}
              style={{height:38,fontSize:13}}>
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:4}}>From</label>
            <input type="date" className="senda-input" value={dateFrom}
              onChange={e=>{ setDateFrom(e.target.value); setPage(1); }}
              style={{height:38,fontSize:13}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:4}}>To</label>
            <input type="date" className="senda-input" value={dateTo}
              onChange={e=>{ setDateTo(e.target.value); setPage(1); }}
              style={{height:38,fontSize:13}}/>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
            <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={resetFilters} style={{height:38}}>Reset</button>
            <button className="senda-btn senda-btn-sm" onClick={fetchData}
              style={{height:38,background:BRAND,color:'#fff',border:'none',display:'inline-flex',alignItems:'center',gap:6}}>
              <RefreshCw size={14} strokeWidth={2.2}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:900}}>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Recipient</th><th>Sender ID</th>
                  <th>Status</th><th>User / Tenant</th><th>Message</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(log => (
                  <tr key={log.id}>
                    <td style={{fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                    <td style={{fontSize:12,color:'#0f172a',fontWeight:600}}>{log.category_label || log.category}</td>
                    <td style={{fontFamily:'monospace',fontSize:12}}>{log.recipient_phone || '—'}</td>
                    <td style={{fontSize:12,color:'#475569'}}>{log.sender_id_used || '—'}</td>
                    <td><Badge status={log.success ? 'success' : 'failed'}/></td>
                    <td style={{fontSize:12,color:'#64748b'}}>{log.related_user_email || log.tenant_name || '—'}</td>
                    <td style={{fontSize:12,color:'#475569',maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {log.message_body || '—'}
                    </td>
                    <td>
                      <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={()=>setDetail(log)} style={{height:30}}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No SMS logs found.</div>}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid #f1f5f9',flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Page {meta.page || page} of {pages} · {total} total</span>
            <div style={{display:'flex',gap:4}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={(meta.page||page)<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} style={{opacity:(meta.page||page)<=1?.4:1}}>← Prev</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={(meta.page||page)>=pages} onClick={()=>setPage(p=>p+1)} style={{opacity:(meta.page||page)>=pages?.4:1}}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && createPortal(
        <div onClick={()=>setDetail(null)} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',display:'flex',justifyContent:'flex-end',zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'min(640px,100%)',height:'100%',background:'#fff',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #eef2f7'}}>
              <h3 style={{fontSize:15,fontWeight:800,color:'#0f172a',margin:0}}>SMS detail</h3>
              <button className="senda-btn senda-btn-sm" onClick={()=>setDetail(null)} style={{height:32,border:'1.5px solid #e2e8f0',background:'#fff'}}><X size={16}/></button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'18px 20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'8px 16px',fontSize:13,marginBottom:16}}>
                <span style={{color:'#94a3b8'}}>Category</span><span style={{color:'#0f172a',fontWeight:600}}>{detail.category_label || detail.category}</span>
                <span style={{color:'#94a3b8'}}>Recipient</span><span style={{color:'#0f172a',fontFamily:'monospace'}}>{detail.recipient_phone || '—'}</span>
                <span style={{color:'#94a3b8'}}>Sender ID</span><span style={{color:'#0f172a'}}>{detail.sender_id_used || '—'}</span>
                <span style={{color:'#94a3b8'}}>Status</span><span style={{color: detail.success ? '#16a34a' : '#dc2626',fontWeight:600}}>{detail.success ? 'Sent' : 'Failed'}</span>
                <span style={{color:'#94a3b8'}}>User</span><span style={{color:'#0f172a'}}>{detail.related_user_email || '—'}</span>
                <span style={{color:'#94a3b8'}}>Tenant</span><span style={{color:'#0f172a'}}>{detail.tenant_name || '—'}</span>
                <span style={{color:'#94a3b8'}}>Date</span><span style={{color:'#0f172a'}}>{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Message</div>
              <div style={{fontSize:13,color:'#0f172a',lineHeight:1.6,whiteSpace:'pre-wrap',background:'#f8fafc',border:'1px solid #eef2f7',borderRadius:10,padding:'12px 14px',marginBottom:18}}>{detail.message_body || '—'}</div>
              {detail.error_message && (
                <div style={{fontSize:12,color:'#dc2626',marginBottom:18,whiteSpace:'pre-wrap'}}>Error: {detail.error_message}</div>
              )}
              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <>
                  <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Metadata</div>
                  <pre style={{fontSize:12,color:'#334155',background:'#f8fafc',border:'1px solid #eef2f7',borderRadius:10,padding:'12px 14px',overflowX:'auto',margin:0}}>
{JSON.stringify(detail.metadata, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

// ─── Low SMS Credit Warning Settings ───────────────────────────────────────────
// Admin control for the warning SMS sent when a tenant's credits fall to/below a
// threshold. Backed by /api/admin/v1/low-credit-warning (GET + /update PATCH).
const LOW_CREDIT_PLACEHOLDERS = ['{credits}', '{name}', '{threshold}'];

function LowCreditWarningSettings() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const [settings, setSettings] = useState({
    enabled: true, threshold: 100, sender_id: '', message: '',
    defaults: {}, placeholders: LOW_CREDIT_PLACEHOLDERS,
  });
  const [drafts, setDrafts]   = useState({ threshold: '100', sender_id: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [savingToggle, setSavingToggle] = useState(false);
  const [savingForm, setSavingForm]     = useState(false);

  const applyServer = (data) => {
    const d = data || {};
    setSettings(d);
    setDrafts({
      threshold: String(d.threshold ?? 100),
      sender_id: d.sender_id || '',
      message: d.message || '',
    });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    adminFetch('/api/admin/v1/low-credit-warning', {}, onLogout)
      .then(res => {
        if (!alive) return;
        if (res.success) applyServer(res.data);
        else setError(res.error?.message || 'Failed to load settings.');
      })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [onLogout]);

  const patch = (payload) => adminFetch('/api/admin/v1/low-credit-warning/update', {
    method: 'PATCH', body: JSON.stringify(payload),
  }, onLogout);

  const toggleEnabled = async () => {
    if (savingToggle) return;
    const next = !settings.enabled;
    setSavingToggle(true);
    setSettings(prev => ({ ...prev, enabled: next })); // optimistic
    try {
      const res = await patch({ enabled: next });
      if (res.success) { applyServer(res.data); showToast('Low credit warning ' + (next ? 'enabled.' : 'disabled.'), 'success'); }
      else { setSettings(prev => ({ ...prev, enabled: !next })); showToast(res.error?.message || 'Failed to update.', 'error'); }
    } catch (e) {
      setSettings(prev => ({ ...prev, enabled: !next }));
      showToast('Network error while updating.', 'error');
    } finally { setSavingToggle(false); }
  };

  const saveForm = async () => {
    if (savingForm) return;
    const threshold = parseInt(drafts.threshold, 10);
    if (isNaN(threshold) || threshold < 0) { showToast('Threshold must be a number ≥ 0.', 'error'); return; }
    const message = drafts.message.trim();
    if (!message) { showToast('Message cannot be empty.', 'error'); return; }
    setSavingForm(true);
    try {
      const res = await patch({ threshold, sender_id: drafts.sender_id.trim(), message });
      if (res.success) { applyServer(res.data); showToast('Settings saved.', 'success'); }
      else { showToast(res.error?.message || 'Failed to save.', 'error'); }
    } catch (e) {
      showToast('Network error while saving.', 'error');
    } finally { setSavingForm(false); }
  };

  const resetMessage = () => {
    const def = (settings.defaults && settings.defaults.message) || '';
    if (!def) { showToast('No default available.', 'error'); return; }
    setDrafts(prev => ({ ...prev, message: def }));
  };

  const dirty = drafts.threshold !== String(settings.threshold ?? '')
    || (drafts.sender_id || '') !== (settings.sender_id || '')
    || (drafts.message || '') !== (settings.message || '');

  const preview = (drafts.message || '')
    .replace(/\{credits\}/g, '50')
    .replace(/\{name\}/g, 'Asha')
    .replace(/\{threshold\}/g, String(parseInt(drafts.threshold, 10) || 0));
  const segs = smsSegments(drafts.message || '').segments;

  return (
    <div className="senda-card" style={{padding:24, marginBottom:20}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
        <div>
          <p style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',margin:0}}>Settings</p>
          <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'3px 0 0'}}>Low SMS Credit Warning</h3>
        </div>
        <div style={{width:36,height:36,borderRadius:10,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <AlertTriangle size={16} strokeWidth={2} color={RED}/>
        </div>
      </div>
      <p style={{fontSize:13,color:'#64748b',lineHeight:1.55,margin:'10px 0 4px'}}>
        Warn a <strong>direct customer</strong> when their SMS credits drop to or below the threshold.
        An <strong>SMS</strong> is sent <strong>once</strong> per downward threshold crossing; a
        <strong> push / in-app</strong> notification is sent on each drop while low.
        Partner clients are excluded.
      </p>

      {loading ? (
        <p style={{fontSize:13,color:'#94a3b8',margin:'16px 0 0'}}>Loading…</p>
      ) : error ? (
        <p style={{fontSize:13,color:RED,margin:'16px 0 0'}}>{error}</p>
      ) : (
        <div style={{marginTop:8}}>
          {/* Enable toggle */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'16px 0',borderTop:'1px solid #f1f5f9'}}>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:'#0f172a',margin:0}}>Enabled</p>
              <p style={{fontSize:12,color:'#64748b',margin:'3px 0 0',lineHeight:1.5}}>Send the warning SMS automatically when credits run low.</p>
            </div>
            <button
              role="switch" aria-checked={!!settings.enabled} aria-label="Enabled"
              disabled={savingToggle} onClick={toggleEnabled}
              style={{
                position:'relative', width:46, height:26, borderRadius:13, flexShrink:0, border:'none',
                cursor:savingToggle?'wait':'pointer', background: settings.enabled ? BRAND : '#cbd5e1',
                transition:'background .2s ease', opacity:savingToggle?0.7:1,
              }}>
              <span style={{position:'absolute',top:3,left: settings.enabled ? 23 : 3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s ease',boxShadow:'0 1px 3px rgba(0,0,0,.25)'}}/>
            </button>
          </div>

          <div style={{paddingTop:16, borderTop:'1px solid #f1f5f9', opacity: settings.enabled ? 1 : 0.55}}>
            {/* Threshold + sender id */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>
                  Threshold (credits)
                </label>
                <input
                  type="number" min="0" className="senda-input" value={drafts.threshold}
                  onChange={e => setDrafts(prev => ({ ...prev, threshold: e.target.value }))}
                  style={{height:40,fontSize:13}}/>
                <p style={{fontSize:11,color:'#94a3b8',margin:'4px 0 0'}}>Warn when remaining credits ≤ this number.</p>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>
                  Sender ID
                </label>
                <input
                  className="senda-input" value={drafts.sender_id} placeholder="SENDA (default)"
                  onChange={e => setDrafts(prev => ({ ...prev, sender_id: e.target.value }))}
                  style={{height:40,fontSize:13}}/>
                <p style={{fontSize:11,color:'#94a3b8',margin:'4px 0 0'}}>Leave blank to use the platform default.</p>
              </div>
            </div>

            {/* Message */}
            <div style={{marginTop:14}}>
              <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>Message text</label>
              <textarea
                value={drafts.message} rows={3}
                onChange={e => setDrafts(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter the low-credit warning message…"
                style={{width:'100%',boxSizing:'border-box',resize:'vertical',padding:'10px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,lineHeight:1.5,color:'#0f172a',fontFamily:'inherit',outline:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:6,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,color:'#94a3b8'}}>Placeholders:</span>
                  {LOW_CREDIT_PLACEHOLDERS.map(p => (
                    <button key={p} type="button"
                      onClick={() => setDrafts(prev => ({ ...prev, message: (prev.message || '') + p }))}
                      style={{fontSize:11,fontFamily:'monospace',color:BRAND,background:'#eff6ff',border:'1px solid #dbeafe',borderRadius:6,padding:'2px 6px',cursor:'pointer'}}>
                      {p}
                    </button>
                  ))}
                </div>
                <span style={{fontSize:11,color:(drafts.message||'').length>800?RED:'#94a3b8'}}>
                  {(drafts.message||'').length} chars · {segs} SMS{segs===1?'':'s'}
                </span>
              </div>

              <div style={{marginTop:10,padding:'10px 12px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:8}}>
                <p style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',margin:'0 0 4px'}}>Preview</p>
                <p style={{fontSize:13,color:'#334155',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{preview || '—'}</p>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}>
                <button className="senda-btn senda-btn-primary senda-btn-sm"
                  disabled={!dirty || savingForm}
                  onClick={saveForm}
                  style={{opacity:(!dirty||savingForm)?0.5:1}}>
                  {savingForm ? 'Saving…' : 'Save changes'}
                </button>
                {dirty && (
                  <button className="senda-btn senda-btn-ghost senda-btn-sm" disabled={savingForm}
                    onClick={() => applyServer(settings)}>
                    Cancel
                  </button>
                )}
                <button className="senda-btn senda-btn-ghost senda-btn-sm" disabled={savingForm}
                  onClick={resetMessage} style={{marginLeft:'auto'}}>
                  Reset message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="senda-fade-in">
      <SenderApprovalSmsSettings />
      <LowCreditWarningSettings />
    </div>
  );
}

function OperationsTab() {
  return (
    <div className="senda-fade-in">
      <DefaultWhatsAppCredentials />
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
// ─── Broadcast Tab (Admin Broadcast Messaging) ──────────────────────────────
const BROADCAST_API = '/api/admin/v1';

const AUDIENCES = [
  { id:'direct_users', label:'Direct Users', desc:'Accounts registered directly on the platform.' },
  { id:'partners',     label:'Partners',     desc:'Clients of a specific partner — pick the partner below, then message its users.' },
];

const SEGMENTS = [
  { id:'all',            label:'All eligible',                 desc:'Everyone with an approved sender ID.' },
  { id:'never_used',     label:'Never used SMS',               desc:'Have an approved sender but have never sent any SMS.' },
  { id:'low_usage',      label:'Uses SMS slowly (1–100)',      desc:'Approved sender, but has sent only a few SMS.' },
  { id:'credits_unused', label:'Has credits · never used',    desc:'Hold SMS credits but have never sent.' },
  { id:'no_purchase',    label:'Approved sender · no purchase', desc:'Have an approved sender ID but never bought credits.' },
];

function smsSegments(text) {
  const len = (text || '').length;
  if (len === 0) return { len:0, segments:0 };
  // GSM-7 single 160 / multipart 153 (approximation; matches portal display).
  const segments = len <= 160 ? 1 : Math.ceil(len / 153);
  return { len, segments };
}

function BroadcastTab() {
  const { showToast, onLogout } = React.useContext(AppContext);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [view, setView]               = useState('compose'); // 'compose' | 'history' | 'scheduled'
  const [audience, setAudience]       = useState('direct_users');
  const [segment, setSegment]         = useState('all');
  const [partnerId, setPartnerId]     = useState('');
  const [partinas, setPartinas]       = useState([]);
  const [loadingPartinas, setLoadingPartinas] = useState(false);
  const [message, setMessage]         = useState('');
  const [skipSent, setSkipSent]       = useState(true);
  const [templates, setTemplates]     = useState([]);
  const [savingTpl, setSavingTpl]     = useState(false);

  // Scheduling (recurring/automatic broadcasts)
  const [scheduleOn, setScheduleOn]   = useState(false);
  const [frequency, setFrequency]     = useState('daily'); // 'once' | 'daily' | 'weekly'
  const [sendTime, setSendTime]       = useState('09:00');
  const [weekdays, setWeekdays]       = useState([]);       // ISO Mon=0..Sun=6
  const [scheduleName, setScheduleName] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [schedules, setSchedules]     = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Single direct message (search a sender / type a number)
  const [singleMode, setSingleMode]   = useState('search'); // 'search' | 'number'
  const [senderQuery, setSenderQuery] = useState('');
  const [senderResults, setSenderResults] = useState([]);
  const [searchingSenders, setSearchingSenders] = useState(false);
  const [selectedSender, setSelectedSender] = useState(null);
  const [singlePhone, setSinglePhone] = useState('');
  const [singleSenderId, setSingleSenderId] = useState('');
  const [singleMessage, setSingleMessage] = useState('');
  const [sendingSingle, setSendingSingle] = useState(false);
  const [singleHistory, setSingleHistory]       = useState([]);
  const [loadingSingleHistory, setLoadingSingleHistory] = useState(false);

  const [preview, setPreview]         = useState(null);
  const [previewing, setPreviewing]   = useState(false);

  const [sending, setSending]         = useState(false);
  const [progress, setProgress]       = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [history, setHistory]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [logs, setLogs]               = useState(null); // { broadcast, rows }
  const [resending, setResending]     = useState({}); // { [rowKey]: 'sending' | 'sent' }

  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  // Re-resolve eligibility whenever audience, partner, or segment changes; clears stale preview.
  useEffect(() => { setPreview(null); }, [audience, partnerId, segment]);

  // Load the partner list the first time the admin targets Partners.
  useEffect(() => {
    if (audience !== 'partners' || partinas.length || loadingPartinas) return;
    setLoadingPartinas(true);
    adminFetch(`${BROADCAST_API}/broadcasts/partinas`, { method:'GET' }, onLogout)
      .then(res => { if (res.success) setPartinas(res.data || []); })
      .catch(() => {})
      .finally(() => setLoadingPartinas(false));
  }, [audience, partinas.length, loadingPartinas, onLogout]);

  // Saved templates: load once, apply into the composer, save the current draft.
  const loadTemplates = useCallback(async () => {
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/templates`, { method:'GET' }, onLogout);
      if (res.success) setTemplates(res.data || []);
    } catch {}
  }, [onLogout]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const applyTemplate = useCallback((id) => {
    const t = templates.find(x => x.id === id);
    if (t) setMessage(t.body);
  }, [templates]);

  const saveTemplate = useCallback(async () => {
    if (!message.trim()) { showToast('Write a message first', 'error'); return; }
    const name = (window.prompt('Template name?') || '').trim();
    if (!name) return;
    setSavingTpl(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/templates`, {
        method:'POST', body: JSON.stringify({ name, body: message }),
      }, onLogout);
      if (res.success) { showToast('Template saved', 'success'); loadTemplates(); }
      else showToast(res.error?.message || 'Failed to save template', 'error');
    } catch { showToast('Network error saving template', 'error'); }
    finally { setSavingTpl(false); }
  }, [message, onLogout, showToast, loadTemplates]);

  const doPreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/preview`, {
        method:'POST', body: JSON.stringify({ audience, partner_id: partnerId || undefined, segment, message }),
      }, onLogout);
      if (res.success) setPreview(res.data);
      else showToast(res.error?.message || 'Failed to load recipients', 'error');
    } catch { showToast('Network error loading preview', 'error'); }
    finally { setPreviewing(false); }
  }, [audience, partnerId, segment, message, onLogout, showToast]);

  const pollProgress = useCallback((id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await adminFetch(`${BROADCAST_API}/broadcasts/${id}`, { method:'GET' }, onLogout);
        if (res.success) {
          setProgress(res.data);
          if (res.data.is_complete) {
            stopPolling();
            setSending(false);
            showToast(
              res.data.status === 'completed'
                ? `Broadcast complete — ${res.data.success_count} sent, ${res.data.failed_count} failed`
                : 'Broadcast finished with errors', res.data.failed_count ? 'error' : 'success');
          }
        }
      } catch {}
    }, 2000);
  }, [onLogout, showToast, stopPolling]);

  const doSend = useCallback(async () => {
    setConfirmOpen(false);
    setSending(true);
    setProgress(null);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/create`, {
        method:'POST',
        body: JSON.stringify({ audience, partner_id: partnerId || undefined, segment, message, skip_already_sent: skipSent }),
      }, onLogout);
      if (res.success) {
        setProgress({
          broadcast_id: res.data.broadcast_id, status:'pending', audience,
          total_planned: res.data.eligible_count, success_count:0, failed_count:0,
          skipped_count:0, processed:0, progress_pct:0, is_complete:false,
        });
        pollProgress(res.data.broadcast_id);
      } else {
        setSending(false);
        showToast(res.error?.message || 'Failed to start broadcast', 'error');
      }
    } catch { setSending(false); showToast('Network error starting broadcast', 'error'); }
  }, [audience, partnerId, segment, message, skipSent, onLogout, showToast, pollProgress]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts?limit=50`, { method:'GET' }, onLogout);
      if (res.success) setHistory(res.data || []);
    } catch {} finally { setLoadingHistory(false); }
  }, [onLogout]);
  useEffect(() => { if (view === 'history') loadHistory(); }, [view, loadHistory]);

  // ── Scheduled (recurring) broadcasts ──
  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/schedules`, { method:'GET' }, onLogout);
      if (res.success) setSchedules(res.data || []);
    } catch {} finally { setLoadingSchedules(false); }
  }, [onLogout]);
  useEffect(() => { if (view === 'scheduled') loadSchedules(); }, [view, loadSchedules]);

  const saveSchedule = useCallback(async () => {
    setSavingSchedule(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/schedules`, {
        method:'POST',
        body: JSON.stringify({
          name: scheduleName.trim() || undefined,
          audience, partner_id: partnerId || undefined, segment, message,
          skip_already_sent: skipSent,
          frequency, send_time: sendTime, weekdays: frequency === 'weekly' ? weekdays : [],
        }),
      }, onLogout);
      if (res.success) {
        showToast('Schedule saved — it will run automatically', 'success');
        setScheduleOn(false); setScheduleName('');
        setView('scheduled'); loadSchedules();
      } else showToast(res.error?.message || 'Failed to save schedule', 'error');
    } catch { showToast('Network error saving schedule', 'error'); }
    finally { setSavingSchedule(false); }
  }, [scheduleName, audience, partnerId, segment, message, skipSent, frequency, sendTime, weekdays, onLogout, showToast, loadSchedules]);

  const toggleSchedule = useCallback(async (s) => {
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/schedules/${s.id}`, {
        method:'PATCH', body: JSON.stringify({ is_active: !s.is_active }),
      }, onLogout);
      if (res.success) loadSchedules();
      else showToast(res.error?.message || 'Failed to update schedule', 'error');
    } catch { showToast('Network error', 'error'); }
  }, [onLogout, showToast, loadSchedules]);

  const deleteSchedule = useCallback(async (s) => {
    if (!window.confirm(`Delete schedule${s.name ? ` "${s.name}"` : ''}? It will stop running.`)) return;
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/schedules/${s.id}`, { method:'DELETE' }, onLogout);
      if (res.success) { showToast('Schedule deleted', 'success'); loadSchedules(); }
      else showToast(res.error?.message || 'Failed to delete', 'error');
    } catch { showToast('Network error', 'error'); }
  }, [onLogout, showToast, loadSchedules]);

  // ── Single direct message ──
  // Debounced sender search (name / account / phone / email).
  useEffect(() => {
    if (singleMode !== 'search') return;
    const q = senderQuery.trim();
    if (q.length < 2) { setSenderResults([]); return; }
    let cancelled = false;
    setSearchingSenders(true);
    const t = setTimeout(async () => {
      try {
        const res = await adminFetch(`${BROADCAST_API}/broadcasts/sender-search?search=${encodeURIComponent(q)}`, { method:'GET' }, onLogout);
        if (!cancelled && res.success) setSenderResults(res.data || []);
      } catch {} finally { if (!cancelled) setSearchingSenders(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [senderQuery, singleMode, onLogout]);

  // History of direct (single) messages — stored under the admin_single_send category.
  const loadSingleHistory = useCallback(async () => {
    setLoadingSingleHistory(true);
    try {
      const res = await adminFetch('/api/admin/v1/system-sms-logs?category=admin_single_send&limit=50', { method:'GET' }, onLogout);
      if (res.success) setSingleHistory(res.data || []);
    } catch {} finally { setLoadingSingleHistory(false); }
  }, [onLogout]);

  useEffect(() => { if (view === 'single') loadSingleHistory(); }, [view, loadSingleHistory]);

  const sendSingle = useCallback(async () => {
    const body = { message: singleMessage };
    if (singleMode === 'search') {
      if (!selectedSender) { showToast('Pick a recipient from the search results', 'error'); return; }
      body.sender_request_id = selectedSender.sender_request_id;
    } else {
      if (!singlePhone.trim()) { showToast('Enter a phone number', 'error'); return; }
      body.phone = singlePhone.trim();
      if (singleSenderId.trim()) body.sender_id = singleSenderId.trim();
    }
    setSendingSingle(true);
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/send-single`, {
        method:'POST', body: JSON.stringify(body),
      }, onLogout);
      if (res.success) {
        showToast(`Sent to ${res.data.to} as “${res.data.sender_id}”`, 'success');
        setSingleMessage(''); setSelectedSender(null); setSenderQuery(''); setSenderResults([]); setSinglePhone('');
        loadSingleHistory();
      } else showToast(res.error?.message || 'Failed to send', 'error');
    } catch { showToast('Network error sending message', 'error'); }
    finally { setSendingSingle(false); }
  }, [singleMessage, singleMode, selectedSender, singlePhone, singleSenderId, onLogout, showToast, loadSingleHistory]);

  const loadLogs = useCallback(async (b) => {
    try {
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/${b.broadcast_id}/logs?limit=100`, { method:'GET' }, onLogout);
      if (res.success) { setLogs({ broadcast:b, rows: res.data || [] }); setResending({}); }
    } catch { showToast('Failed to load audit log', 'error'); }
  }, [onLogout, showToast]);

  // Resend a single failed audit-log row, reusing the recipient, sender and message body.
  const resendRow = useCallback(async (row, key) => {
    if (!row.recipient_phone) { showToast('No recipient number on this row', 'error'); return; }
    if (!row.message_body) { showToast('No message body recorded — cannot resend', 'error'); return; }
    setResending(s => ({ ...s, [key]: 'sending' }));
    try {
      const body = { phone: row.recipient_phone, message: row.message_body };
      if (row.sender_name_used) body.sender_id = row.sender_name_used;
      const res = await adminFetch(`${BROADCAST_API}/broadcasts/send-single`, {
        method:'POST', body: JSON.stringify(body),
      }, onLogout);
      if (res.success) {
        showToast(`Resent to ${res.data.to} as “${res.data.sender_id}”`, 'success');
        setResending(s => ({ ...s, [key]: 'sent' }));
        setLogs(l => l ? { ...l, rows: l.rows.map((r,i) => `${i}` === key
          ? { ...r, delivery_status:'sent', error_message:null } : r) } : l);
      } else {
        showToast(res.error?.message || 'Resend failed', 'error');
        setResending(s => { const n = { ...s }; delete n[key]; return n; });
      }
    } catch {
      showToast('Network error resending message', 'error');
      setResending(s => { const n = { ...s }; delete n[key]; return n; });
    }
  }, [onLogout, showToast]);

  const seg = smsSegments(message);
  const stats = preview?.stats;
  const live = progress && !progress.is_complete && sending;
  const partnerNeeded = audience === 'partners' && !partnerId;
  const canPreview = !partnerNeeded && !previewing && !live;
  const canSend = !!stats && stats.eligible > 0 && message.trim().length > 0 && !partnerNeeded && !sending;
  const weekdaysOk = frequency !== 'weekly' || weekdays.length > 0;
  const canSchedule = message.trim().length > 0 && !partnerNeeded && !!sendTime && weekdaysOk && !savingSchedule;
  const toggleWeekday = (d) => setWeekdays(w => w.includes(d) ? w.filter(x=>x!==d) : [...w, d].sort((a,b)=>a-b));
  const singleSeg = smsSegments(singleMessage);
  const canSendSingle = singleMessage.trim().length > 0 && !sendingSingle &&
    (singleMode === 'search' ? !!selectedSender : singlePhone.trim().length > 0);

  const Pill = ({ children, color }) => (
    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99, fontSize:11,
      fontWeight:700, background:`${color}1a`, color }}>{children}</span>
  );
  const statusColor = (s) => s === 'completed' ? '#16a34a' : s === 'failed' ? '#dc2626'
    : s === 'running' ? BRAND : '#64748b';

  return (
    <div className="senda-fade-in">
      {/* Sub-nav */}
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        {[{id:'compose',label:'Compose'},{id:'single',label:'Direct message'},{id:'scheduled',label:'Scheduled'},{id:'history',label:'History'}].map(t => (
          <button key={t.id} onClick={()=>setView(t.id)}
            className="senda-btn senda-btn-sm"
            style={{ background: view===t.id ? BRAND : '#fff', color: view===t.id ? '#fff' : '#475569',
              border:`1.5px solid ${view===t.id ? BRAND : '#e2e8f0'}`, height:34 }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'compose' && (
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'minmax(0,1.1fr) minmax(0,1fr)', gap:18, alignItems:'start' }}>
          {/* Compose card */}
          <div className="senda-card" style={{ padding:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <Megaphone size={20} color={BRAND} strokeWidth={2.2}/>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>New Broadcast</h3>
            </div>

            <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', marginBottom:8 }}>Target audience</label>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
              {AUDIENCES.map(a => (
                <button key={a.id} onClick={()=>setAudience(a.id)} disabled={live}
                  style={{ textAlign:'left', padding:'12px 14px', borderRadius:11, cursor: live?'default':'pointer',
                    border:`1.5px solid ${audience===a.id ? BRAND : '#e2e8f0'}`,
                    background: audience===a.id ? `${BRAND}0d` : '#fff', transition:'all .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:16, height:16, borderRadius:'50%', flexShrink:0,
                      border:`5px solid ${audience===a.id ? BRAND : '#cbd5e1'}`, background:'#fff' }}/>
                    <span style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{a.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:4, marginLeft:24 }}>{a.desc}</div>
                </button>
              ))}
            </div>

            {audience === 'partners' && (
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', marginBottom:8 }}>Partner — whose clients to message</label>
                <select value={partnerId} onChange={e=>setPartnerId(e.target.value)} disabled={live || loadingPartinas}
                  className="senda-input" style={{ cursor: live ? 'default':'pointer' }}>
                  <option value="">{loadingPartinas ? 'Loading partners…' : 'Select a partner…'}</option>
                  {partinas.map(p => (
                    <option key={p.partner_id} value={p.partner_id}>
                      {p.name}{p.account_id ? ` · ${p.account_id}` : ''} — {p.clients_count} client{p.clients_count!==1?'s':''}
                    </option>
                  ))}
                </select>
                {!loadingPartinas && partinas.length === 0 && <div style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>No partners found.</div>}
                {partnerNeeded && <div style={{ fontSize:11, color:'#d97706', marginTop:6 }}>Choose a partner to continue.</div>}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:8 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#334155' }}>Message</label>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <select defaultValue="" onChange={e=>{ if(e.target.value){ applyTemplate(e.target.value); e.target.value=''; } }}
                  disabled={live || templates.length===0}
                  className="senda-input" style={{ height:30, width:'auto', fontSize:12, padding:'0 8px', cursor:'pointer' }}>
                  <option value="">{templates.length ? 'Load template…' : 'No templates'}</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="button" onClick={saveTemplate} disabled={live || savingTpl || !message.trim()}
                  className="senda-btn senda-btn-sm" style={{ height:30, fontSize:12, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity:(!message.trim()||savingTpl)?.5:1 }}>
                  {savingTpl ? 'Saving…' : 'Save as template'}
                </button>
              </div>
            </div>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} disabled={live}
              rows={5} placeholder="Type the SMS to broadcast… e.g. Habari ndugu {{name}}, ..."
              className="senda-input" style={{ height:'auto', padding:'12px 14px', resize:'vertical', lineHeight:1.5 }}/>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
              {seg.len} chars · {seg.segments} SMS segment{seg.segments!==1?'s':''} · optional: add <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4, color:'#475569' }}>{'{{name}}'}</code> to insert each recipient's name from the database
            </div>

            <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', margin:'18px 0 8px' }}>Recipient segment</label>
            <select value={segment} onChange={e=>setSegment(e.target.value)} disabled={live}
              className="senda-input" style={{ cursor: live ? 'default':'pointer' }}>
              {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>{SEGMENTS.find(s=>s.id===segment)?.desc}</div>

            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, cursor:'pointer', fontSize:13, color:'#334155' }}>
              <input type="checkbox" checked={skipSent} onChange={e=>setSkipSent(e.target.checked)} disabled={live}/>
              Skip recipients who already received this exact message
            </label>

            {/* Schedule / automate */}
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, cursor:'pointer', fontSize:13, color:'#334155' }}>
              <input type="checkbox" checked={scheduleOn} onChange={e=>setScheduleOn(e.target.checked)} disabled={live}/>
              <Clock size={14} color={scheduleOn ? BRAND : '#94a3b8'} strokeWidth={2.2}/>
              Schedule this broadcast to run automatically (like a campaign)
            </label>

            {scheduleOn && (
              <div style={{ marginTop:12, padding:'16px', borderRadius:12, border:`1.5px solid ${BRAND}33`, background:`${BRAND}08`, display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#334155', display:'block', marginBottom:6 }}>Repeat</label>
                    <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="senda-input" style={{ cursor:'pointer' }}>
                      <option value="once">Once — at the chosen time</option>
                      <option value="daily">Every day</option>
                      <option value="weekly">Every week — on chosen days</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#334155', display:'block', marginBottom:6 }}>Time</label>
                    <input type="time" value={sendTime} onChange={e=>setSendTime(e.target.value)} className="senda-input"/>
                  </div>
                </div>

                {frequency === 'weekly' && (
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#334155', display:'block', marginBottom:6 }}>On these days</label>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
                        <button key={d} type="button" onClick={()=>toggleWeekday(i)}
                          style={{ width:42, height:34, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
                            border:`1.5px solid ${weekdays.includes(i) ? BRAND : '#e2e8f0'}`,
                            background: weekdays.includes(i) ? BRAND : '#fff', color: weekdays.includes(i) ? '#fff' : '#475569' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                    {weekdays.length === 0 && <div style={{ fontSize:11, color:'#d97706', marginTop:6 }}>Pick at least one day.</div>}
                  </div>
                )}

                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#334155', display:'block', marginBottom:6 }}>Label (optional)</label>
                  <input type="text" value={scheduleName} onChange={e=>setScheduleName(e.target.value)} placeholder="e.g. Daily welcome SMS" className="senda-input"/>
                </div>

                <div style={{ fontSize:11, color:'#64748b', lineHeight:1.5 }}>
                  Recipients are re-checked each run, so new {audience === 'partners' ? 'partner clients' : 'users'} are picked up automatically. Times use the server timezone.
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="senda-btn senda-btn-sm" onClick={doPreview} disabled={!canPreview}
                style={{ height:40, border:`1.5px solid ${BRAND}`, color:BRAND, background:'#fff', fontWeight:700, opacity: canPreview ? 1 : .5, cursor: canPreview ? 'pointer':'not-allowed' }}>
                {previewing ? 'Checking…' : 'Preview recipients'}
              </button>
              {scheduleOn ? (
                <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={saveSchedule} disabled={!canSchedule}
                  style={{ height:40, fontWeight:700, opacity: canSchedule ? 1 : .5, cursor: canSchedule ? 'pointer':'not-allowed' }}>
                  <Clock size={15} strokeWidth={2.2} style={{ marginRight:6 }}/>{savingSchedule ? 'Saving…' : 'Save schedule'}
                </button>
              ) : (
                <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={()=>setConfirmOpen(true)}
                  disabled={!canSend}
                  style={{ height:40, fontWeight:700, opacity: canSend ? 1 : .5, cursor: canSend ? 'pointer':'not-allowed' }}>
                  <Send size={15} strokeWidth={2.2} style={{ marginRight:6 }}/>Send Broadcast
                </button>
              )}
            </div>
            {!scheduleOn && !stats && <div style={{ fontSize:12, color:'#94a3b8', marginTop:10 }}>Run a preview to see how many recipients are eligible before sending.</div>}
            {scheduleOn && <div style={{ fontSize:12, color:'#94a3b8', marginTop:10 }}>The schedule sends automatically — no preview needed. Manage saved schedules under the “Scheduled” tab.</div>}
          </div>

          {/* Right column: preview / live progress */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {progress && (
              <div className="senda-card" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{live ? 'Sending…' : 'Last broadcast'}</h3>
                  <Pill color={statusColor(progress.status)}>{progress.status}</Pill>
                </div>
                <div style={{ height:10, borderRadius:99, background:'#eef2f7', overflow:'hidden' }}>
                  <div style={{ width:`${progress.progress_pct||0}%`, height:'100%', borderRadius:99,
                    background:`linear-gradient(90deg,${BRAND},${BRAND2})`, transition:'width .4s' }}/>
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>
                  {progress.processed||0} / {progress.total_planned||0} processed ({progress.progress_pct||0}%)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16 }}>
                  {[
                    { label:'Sent',     value:progress.success_count, color:'#16a34a' },
                    { label:'Failed',   value:progress.failed_count,  color:'#dc2626' },
                    { label:'Skipped',  value:progress.skipped_count, color:'#d97706' },
                    { label:'SMS used', value:progress.sms_used,      color:BRAND },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center', padding:'12px 6px', borderRadius:11, background:'#f8fafc', border:'1px solid #eef2f7' }}>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{(s.value||0).toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {live && <div style={{ fontSize:11, color:'#94a3b8', marginTop:12, display:'flex', alignItems:'center', gap:6 }}>
                  <RefreshCw size={12} className="senda-spin"/> Live — refreshing every 2s</div>}
                {progress.last_error && <div style={{ fontSize:11, color:'#dc2626', marginTop:10 }}>Last error: {progress.last_error}</div>}
              </div>
            )}

            {stats && !live && (
              <div className="senda-card" style={{ padding:20 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Eligible recipients</h3>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:40, fontWeight:800, color:BRAND, lineHeight:1 }}>{stats.eligible.toLocaleString()}</span>
                  <span style={{ fontSize:13, color:'#64748b' }}>of {stats.total_in_audience.toLocaleString()} in audience</span>
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>
                  Excluded: <b>{stats.excluded_no_sender}</b> with no approved sender ID, <b>{stats.excluded_no_phone}</b> with no phone
                  {segment !== 'all' && <>, <b>{stats.excluded_by_segment}</b> outside “{SEGMENTS.find(s=>s.id===segment)?.label}” (of {stats.with_approved_sender} with an approved sender)</>}.
                  These will <b>not</b> receive the message.
                </div>
                {message.trim() && preview.recipients?.[0]?.tenant_name && (
                  <div style={{ marginBottom:14, padding:'10px 12px', borderRadius:10, background:'#f0f9ff', border:'1px solid #e0f2fe' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                      Example — as {preview.recipients[0].tenant_name} will receive it
                    </div>
                    <div style={{ fontSize:12.5, color:'#0f172a', lineHeight:1.55, whiteSpace:'pre-wrap' }}>
                      {message
                        .replace(/\{\{\s*(name|business_name)\s*\}\}/g, preview.recipients[0].tenant_name)
                        .replace(/\{\s*(name|business_name)\s*\}/g, preview.recipients[0].tenant_name)}
                    </div>
                  </div>
                )}
                {preview.recipients?.length > 0 ? (
                  <div style={{ maxHeight:280, overflowY:'auto', border:'1px solid #eef2f7', borderRadius:10 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ position:'sticky', top:0, background:'#f8fafc' }}>
                          <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Recipient</th>
                          <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Phone</th>
                          <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Sender Name</th>
                          <th style={{ textAlign:'right', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Credits</th>
                          <th style={{ textAlign:'right', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.recipients.map((r,i) => (
                          <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'8px 12px', color:'#0f172a' }}>{r.tenant_name || '—'}</td>
                            <td style={{ padding:'8px 12px', color:'#64748b', fontFamily:'monospace' }}>{r.phone_masked}</td>
                            <td style={{ padding:'8px 12px' }}><Pill color={BRAND}>{r.sender_name}</Pill></td>
                            <td style={{ padding:'8px 12px', textAlign:'right', color:'#0f172a' }}>{(r.credits||0).toLocaleString()}</td>
                            <td style={{ padding:'8px 12px', textAlign:'right', color:'#64748b' }}>{(r.used||0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div style={{ fontSize:12, color:'#94a3b8' }}>No eligible recipients in this audience.</div>}
                {preview.recipients_truncated && <div style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>Showing first {preview.recipients.length} — full list will be messaged.</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'single' && (
       <>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'minmax(0,1fr) minmax(0,1fr)', gap:18, alignItems:'start' }}>
          <div className="senda-card" style={{ padding:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <Send size={18} color={BRAND} strokeWidth={2.2}/>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>Send a direct message</h3>
            </div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Search a sender name to message its owner, or type any phone number.</div>

            {/* Mode toggle */}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[{id:'search',label:'Search sender / user'},{id:'number',label:'Type a number'}].map(m => (
                <button key={m.id} onClick={()=>setSingleMode(m.id)}
                  className="senda-btn senda-btn-sm"
                  style={{ flex:1, height:36, fontWeight:700, fontSize:12.5,
                    background: singleMode===m.id ? BRAND : '#fff', color: singleMode===m.id ? '#fff' : '#475569',
                    border:`1.5px solid ${singleMode===m.id ? BRAND : '#e2e8f0'}` }}>
                  {m.label}
                </button>
              ))}
            </div>

            {singleMode === 'search' ? (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', marginBottom:8 }}>Search by sender name, business, phone or email</label>
                <div style={{ position:'relative' }}>
                  <Search size={15} color="#94a3b8" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input value={senderQuery} onChange={e=>{ setSenderQuery(e.target.value); setSelectedSender(null); }}
                    placeholder="e.g. SENDA, Kuza, 0712…" className="senda-input" style={{ paddingLeft:36 }}/>
                </div>

                {selectedSender ? (
                  <div style={{ marginTop:12, padding:'12px 14px', borderRadius:11, border:`1.5px solid ${BRAND}`, background:`${BRAND}0d` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{selectedSender.account_name || '—'}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                          <Pill color={BRAND}>{selectedSender.sender_id}</Pill> · {selectedSender.phone_masked || 'no phone'}{selectedSender.owner_email ? ` · ${selectedSender.owner_email}` : ''}
                        </div>
                      </div>
                      <button onClick={()=>setSelectedSender(null)} className="senda-btn senda-btn-sm" style={{ height:30, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569' }}>Change</button>
                    </div>
                    {!selectedSender.has_phone && <div style={{ fontSize:11, color:'#dc2626', marginTop:8 }}>This user has no phone on record — switch to “Type a number”.</div>}
                  </div>
                ) : (senderQuery.trim().length >= 2) && (
                  <div style={{ marginTop:10, border:'1px solid #eef2f7', borderRadius:11, maxHeight:260, overflowY:'auto' }}>
                    {searchingSenders ? <div style={{ padding:14, fontSize:12, color:'#94a3b8' }}>Searching…</div>
                     : senderResults.length === 0 ? <div style={{ padding:14, fontSize:12, color:'#94a3b8' }}>No approved senders match “{senderQuery.trim()}”.</div>
                     : senderResults.map(r => (
                      <button key={r.sender_request_id} onClick={()=>{ setSelectedSender(r); }}
                        style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', border:'none', borderBottom:'1px solid #f1f5f9', background:'#fff', cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{r.account_name || '—'}</span>
                          <Pill color={BRAND}>{r.sender_id}</Pill>
                        </div>
                        <div style={{ fontSize:11.5, color:'#64748b', marginTop:3 }}>
                          {r.has_phone ? r.phone_masked : 'no phone'}{r.owner_email ? ` · ${r.owner_email}` : ''}{r.provider ? ` · ${r.provider}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', marginBottom:8 }}>Recipient phone number</label>
                <input value={singlePhone} onChange={e=>setSinglePhone(e.target.value)}
                  placeholder="+255…, 0712…, 0654… — any format" className="senda-input"/>
                <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', margin:'14px 0 8px' }}>Sender name <span style={{ color:'#94a3b8', fontWeight:500 }}>(optional — defaults to SENDA)</span></label>
                <input value={singleSenderId} onChange={e=>setSingleSenderId(e.target.value)} maxLength={11}
                  placeholder="e.g. SENDA" className="senda-input"/>
              </div>
            )}

            <label style={{ fontSize:12, fontWeight:700, color:'#334155', display:'block', marginBottom:8 }}>Message</label>
            <textarea value={singleMessage} onChange={e=>setSingleMessage(e.target.value)} rows={5}
              placeholder="Type the SMS…" className="senda-input" style={{ height:'auto', padding:'12px 14px', resize:'vertical', lineHeight:1.5 }}/>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>{singleSeg.len} chars · {singleSeg.segments} SMS segment{singleSeg.segments!==1?'s':''}</div>

            <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={sendSingle} disabled={!canSendSingle}
              style={{ height:42, marginTop:18, width:'100%', fontWeight:700, opacity: canSendSingle ? 1 : .5, cursor: canSendSingle ? 'pointer':'not-allowed' }}>
              <Send size={15} strokeWidth={2.2} style={{ marginRight:6 }}/>{sendingSingle ? 'Sending…' : 'Send message'}
            </button>
          </div>

          <div className="senda-card" style={{ padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:10 }}>How it works</h3>
            <ul style={{ margin:0, paddingLeft:18, fontSize:12.5, color:'#475569', lineHeight:1.7 }}>
              <li><b>Search sender / user</b> — find an approved sender name (or its owner by business, phone or email) and the message goes to that user’s phone, sent under their own approved sender ID.</li>
              <li><b>Type a number</b> — send to any phone in any format (<code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4 }}>+255…</code>, <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4 }}>07…</code>, <code style={{ background:'#f1f5f9', padding:'1px 5px', borderRadius:4 }}>06…</code>, or bare). The number is normalised automatically.</li>
              <li>Sends are recorded in the audit log under <i>admin_single_send</i>.</li>
            </ul>
          </div>
        </div>

        {/* Direct message history */}
        <div className="senda-card" style={{ padding:0, marginTop:18, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Direct message history</h3>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Your most recent direct (single) sends.</div>
            </div>
            <button onClick={loadSingleHistory} disabled={loadingSingleHistory}
              className="senda-btn senda-btn-sm" style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', fontWeight:700 }}>
              {loadingSingleHistory ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Recipient','Sender Used','Message','Status','Date/Time'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 16px', color:'#64748b', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingSingleHistory && singleHistory.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:20, color:'#94a3b8' }}>Loading…</td></tr>
                ) : singleHistory.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:20, color:'#94a3b8' }}>No direct messages sent yet.</td></tr>
                ) : singleHistory.map(r => (
                  <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 16px' }}>
                      <div style={{ color:'#0f172a' }}>{r.tenant_name || '—'}</div>
                      <div style={{ color:'#94a3b8', fontFamily:'monospace' }}>{r.recipient_phone}</div>
                    </td>
                    <td style={{ padding:'10px 16px' }}><Pill color={BRAND}>{r.sender_id_used || '—'}</Pill></td>
                    <td style={{ padding:'10px 16px', color:'#475569', maxWidth:280 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.message_body || ''}>{r.message_body || '—'}</div>
                    </td>
                    <td style={{ padding:'10px 16px' }}>
                      <Pill color={r.status==='sent' ? '#16a34a' : '#dc2626'}>{r.status}</Pill>
                      {r.error_message && <div style={{ color:'#dc2626', fontSize:11, marginTop:3 }}>{r.error_message}</div>}
                    </td>
                    <td style={{ padding:'10px 16px', color:'#64748b', whiteSpace:'nowrap' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
       </>
      )}

      {view === 'scheduled' && (() => {
        const repeatOf = (s) => s.frequency === 'once' ? 'Once'
          : s.frequency === 'daily' ? `Daily · ${s.send_time}`
          : `Weekly · ${(s.weekdays||[]).map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')} · ${s.send_time}`;
        const audienceOf = (s) => `${AUDIENCES.find(a=>a.id===s.audience)?.label || s.audience}${s.partner_name ? ` · ${s.partner_name}` : ''}`;
        return (
        <div className="senda-card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'16px 20px', borderBottom:'1px solid #eef2f7', flexWrap:'wrap' }}>
            <div style={{ minWidth:0 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Scheduled broadcasts</h3>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Automatic recurring campaigns. Create one from the Compose tab.</div>
            </div>
            <button className="senda-btn senda-btn-sm" onClick={loadSchedules} style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', flexShrink:0 }}>
              <RefreshCw size={13} strokeWidth={2.2} style={{ marginRight:6 }}/>Refresh
            </button>
          </div>
          {loadingSchedules ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
           : schedules.length === 0 ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>No schedules yet. Tick “Schedule this broadcast” in Compose to create one.</div>
           : isMobile ? (
            /* Mobile: stacked cards */
            <div style={{ display:'flex', flexDirection:'column', gap:12, padding:16 }}>
              {schedules.map(s => (
                <div key={s.id} style={{ border:'1px solid #eef2f7', borderRadius:12, padding:14, opacity:s.is_active?1:.7 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:14, minWidth:0, wordBreak:'break-word' }}>{s.name || 'Untitled schedule'}</div>
                    <Pill color={s.is_active ? '#16a34a' : '#94a3b8'}>{s.is_active ? 'Active' : 'Paused'}</Pill>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 10px', fontSize:12.5, color:'#475569', marginBottom:10 }}>
                    <span style={{ color:'#94a3b8' }}>Audience</span><span>{audienceOf(s)}</span>
                    <span style={{ color:'#94a3b8' }}>Repeat</span><span>{repeatOf(s)}</span>
                    <span style={{ color:'#94a3b8' }}>Next run</span><span>{s.is_active && s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'}</span>
                    <span style={{ color:'#94a3b8' }}>Runs</span><span>{s.total_runs || 0}</span>
                  </div>
                  <div style={{ fontSize:12.5, color:'#475569', background:'#f8fafc', borderRadius:8, padding:'8px 10px', marginBottom:12, lineHeight:1.5, maxHeight:66, overflow:'hidden' }}>{s.message}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="senda-btn senda-btn-sm" onClick={()=>toggleSchedule(s)}
                      style={{ flex:1, height:34, border:'1.5px solid #e2e8f0', background:'#fff', color:s.is_active ? '#d97706' : '#16a34a', fontWeight:700 }}>
                      {s.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button className="senda-btn senda-btn-sm" onClick={()=>deleteSchedule(s)}
                      style={{ flex:1, height:34, border:'1.5px solid #fecaca', background:'#fff', color:'#dc2626', fontWeight:700 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tablet/desktop: table in a horizontal-scroll wrapper so actions never clip */
            <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', minWidth:860, borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Label','Audience','Repeat','Next run','Runs','Status','Message',''].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#64748b', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{s.name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{audienceOf(s)}</td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{repeatOf(s)}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{s.is_active && s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569', fontWeight:700 }}>{s.total_runs || 0}</td>
                    <td style={{ padding:'10px 14px' }}><Pill color={s.is_active ? '#16a34a' : '#94a3b8'}>{s.is_active ? 'Active' : 'Paused'}</Pill></td>
                    <td style={{ padding:'10px 14px', color:'#475569', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.message}</td>
                    <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>
                      <button className="senda-btn senda-btn-sm" onClick={()=>toggleSchedule(s)}
                        style={{ height:30, border:'1.5px solid #e2e8f0', background:'#fff', color:s.is_active ? '#d97706' : '#16a34a', fontWeight:700, marginRight:8 }}>
                        {s.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button className="senda-btn senda-btn-sm" onClick={()=>deleteSchedule(s)}
                        style={{ height:30, border:'1.5px solid #fecaca', background:'#fff', color:'#dc2626', fontWeight:700 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      );})()}

      {view === 'history' && (
        <div className="senda-card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Broadcast history</h3>
            <button className="senda-btn senda-btn-sm" onClick={loadHistory} style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569' }}>
              <RefreshCw size={13} strokeWidth={2.2} style={{ marginRight:6 }}/>Refresh
            </button>
          </div>
          {loadingHistory ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
           : history.length === 0 ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>No broadcasts yet.</div>
           : (
            <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', minWidth:820, borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Date','Audience','Target','Status','Sent','Failed','SMS used','Message',''].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#64748b', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(b => (
                  <tr key={b.broadcast_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                    <td style={{ padding:'10px 14px' }}>{AUDIENCES.find(a=>a.id===b.audience)?.label || b.audience}</td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{b.partner_name || (b.audience==='direct_users' ? '—' : '')}</td>
                    <td style={{ padding:'10px 14px' }}><Pill color={statusColor(b.status)}>{b.status}</Pill></td>
                    <td style={{ padding:'10px 14px', color:'#16a34a', fontWeight:700 }}>{b.success_count}</td>
                    <td style={{ padding:'10px 14px', color:'#dc2626', fontWeight:700 }}>{b.failed_count}</td>
                    <td style={{ padding:'10px 14px', color:BRAND, fontWeight:700 }}>{(b.sms_used||0).toLocaleString()}</td>
                    <td style={{ padding:'10px 14px', color:'#475569', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.message}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <button className="senda-btn senda-btn-sm" onClick={()=>loadLogs(b)} style={{ height:30, border:'1.5px solid #e2e8f0', background:'#fff', color:BRAND, fontWeight:700 }}>Audit log</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && stats && createPortal(
        <div onClick={()=>setConfirmOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div onClick={e=>e.stopPropagation()} className="senda-card" style={{ padding:24, maxWidth:420, width:'100%' }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:10 }}>Send broadcast?</h3>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>
              This will message <b>{stats.eligible.toLocaleString()}</b> recipient{stats.eligible!==1?'s':''}
              {audience === 'partners' && preview?.partner_name ? <> from partner <b>{preview.partner_name}</b></> : ' (direct users)'}
              , each under their own approved sender name.
              {stats.excluded_no_sender>0 && <> <b>{stats.excluded_no_sender}</b> without an approved sender ID will be skipped.</>}
            </p>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button className="senda-btn senda-btn-sm" onClick={()=>setConfirmOpen(false)} style={{ height:38, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569' }}>Cancel</button>
              <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={doSend} style={{ height:38, fontWeight:700 }}>Send now</button>
            </div>
          </div>
        </div>, document.body)}

      {/* Audit log drawer */}
      {logs && createPortal(
        <div onClick={()=>setLogs(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', justifyContent:'flex-end', zIndex:1000 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'min(720px,100%)', height:'100%', background:'#fff', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Audit log</h3>
                <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>{logs.broadcast.broadcast_id}</div>
              </div>
              <button className="senda-btn senda-btn-sm" onClick={()=>setLogs(null)} style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff' }}><X size={16}/></button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ position:'sticky', top:0, background:'#f8fafc' }}>
                    {['Recipient','Sender Used','Status','Date/Time'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 14px', color:'#64748b', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.rows.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding:20, color:'#94a3b8' }}>No sends recorded yet.</td></tr>
                  ) : logs.rows.map((r,i) => (
                    <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'8px 14px' }}>
                        <div style={{ color:'#0f172a' }}>{r.tenant_name || '—'}</div>
                        <div style={{ color:'#94a3b8', fontFamily:'monospace' }}>{r.recipient_phone}</div>
                      </td>
                      <td style={{ padding:'8px 14px' }}><Pill color={BRAND}>{r.sender_name_used}</Pill></td>
                      <td style={{ padding:'8px 14px' }}>
                        <Pill color={r.delivery_status==='sent' ? '#16a34a' : '#dc2626'}>{r.delivery_status}</Pill>
                        {r.error_message && <div style={{ color:'#dc2626', fontSize:11, marginTop:3 }}>{r.error_message}</div>}
                        {r.delivery_status === 'failed' && (
                          <button
                            onClick={()=>resendRow(r, `${i}`)}
                            disabled={resending[`${i}`] === 'sending'}
                            className="senda-btn senda-btn-sm"
                            style={{ height:26, marginTop:6, padding:'0 12px', fontWeight:700,
                              border:`1.5px solid ${BRAND}`, background:'#fff', color:BRAND,
                              cursor: resending[`${i}`] === 'sending' ? 'default' : 'pointer',
                              opacity: resending[`${i}`] === 'sending' ? .6 : 1 }}>
                            {resending[`${i}`] === 'sending' ? 'Resending…' : 'Resend'}
                          </button>
                        )}
                      </td>
                      <td style={{ padding:'8px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

// ─── Partner Clients Tab (approved sender IDs + clients missing a phone) ─────
const PARTNER_VIEWS = [
  { id:'senders',  label:'Approved Sender IDs', endpoint:'partner-client-senders' },
  { id:'nophone',  label:'Missing phone',       endpoint:'partner-clients-no-phone' },
  { id:'messages', label:'Messages sent',       endpoint:'partner-client-messages' },
];

const MSG_STATUSES = ['', 'queued', 'sent', 'delivered', 'read', 'failed'];

function PartnerSendersTab() {
  const { onLogout } = React.useContext(AppContext);

  const [tab, setTab]             = useState('senders');
  const [partinas, setPartinas]   = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows]           = useState([]);
  const [meta, setMeta]           = useState({ total:0, page:1, total_pages:1, has_next:false, has_prev:false });
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [msgDetail, setMsgDetail] = useState(null); // { loading, data }

  useEffect(() => {
    adminFetch(`${BROADCAST_API}/broadcasts/partinas`, { method:'GET' }, onLogout)
      .then(res => { if (res.success) setPartinas(res.data || []); })
      .catch(() => {});
  }, [onLogout]);

  const openMessage = useCallback(async (id) => {
    setMsgDetail({ loading:true, data:null });
    try {
      const res = await adminFetch(`${BROADCAST_API}/partner-client-messages/${id}`, { method:'GET' }, onLogout);
      setMsgDetail({ loading:false, data: res.success ? res.data : null });
    } catch { setMsgDetail({ loading:false, data:null }); }
  }, [onLogout]);

  const endpoint = PARTNER_VIEWS.find(v => v.id === tab)?.endpoint || 'partner-client-senders';
  const isMessages = tab === 'messages';

  const buildParams = useCallback(() => {
    const qs = new URLSearchParams();
    if (partnerId) qs.set('partner_id', partnerId);
    if (search.trim()) qs.set('search', search.trim());
    if (isMessages) {
      if (statusF) qs.set('status', statusF);
      if (dateFrom) qs.set('from', dateFrom);
      if (dateTo) qs.set('to', dateTo);
    }
    return qs;
  }, [partnerId, search, isMessages, statusF, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildParams();
      qs.set('page', String(page)); qs.set('limit', '20');
      const res = await adminFetch(`${BROADCAST_API}/${endpoint}?${qs.toString()}`, { method:'GET' }, onLogout);
      if (res.success) { setRows(res.data || []); setMeta(res.meta || meta); }
    } catch {} finally { setLoading(false); }
  }, [endpoint, page, buildParams, onLogout]);

  const downloadCsv = useCallback(async () => {
    setDownloading(true);
    try {
      const qs = buildParams();
      qs.set('export', 'csv');
      const token = getToken();
      const resp = await fetch(`${BASE_URL}${BROADCAST_API}/partner-client-messages?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials:'include',
      });
      if (!resp.ok) throw new Error('download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'partner_client_messages.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {} finally { setDownloading(false); }
  }, [buildParams]);

  // Reset to page 1 when filters/tab change.
  useEffect(() => { setPage(1); }, [partnerId, search, statusF, dateFrom, dateTo, tab]);
  // Debounced load on filter/page/tab change.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const isSenders = tab === 'senders';

  return (
    <div className="senda-fade-in">
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {PARTNER_VIEWS.map(v => (
          <button key={v.id} onClick={()=>setTab(v.id)} className="senda-btn senda-btn-sm"
            style={{ height:34, background: tab===v.id ? BRAND : '#fff', color: tab===v.id ? '#fff' : '#475569',
              border:`1.5px solid ${tab===v.id ? BRAND : '#e2e8f0'}` }}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="senda-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            {isSenders ? <Tag size={18} color={BRAND} strokeWidth={2.2}/>
             : isMessages ? <MessageSquare size={18} color={BRAND} strokeWidth={2.2}/>
             : <AlertTriangle size={18} color="#d97706" strokeWidth={2.2}/>}
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>
              {isSenders ? 'Partner clients · Approved Sender IDs'
               : isMessages ? 'Partner clients · Messages sent'
               : 'Partner clients · Missing phone number'}
            </h3>
          </div>
          <div style={{ fontSize:12, color:'#64748b' }}>
            {isSenders
              ? <>Every approved sender ID belonging to a partner's clients. {meta.total?.toLocaleString?.() || 0} total.</>
              : isMessages
              ? <>Every SMS sent by partner clients. {meta.total?.toLocaleString?.() || 0} total.</>
              : <>Partner clients with no phone number — they can't receive broadcasts until a phone is added. {meta.total?.toLocaleString?.() || 0} total.</>}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
            <select value={partnerId} onChange={e=>setPartnerId(e.target.value)}
              className="senda-input" style={{ height:38, width:'auto', minWidth:220, cursor:'pointer' }}>
              <option value="">All partners</option>
              {partinas.map(p => <option key={p.partner_id} value={p.partner_id}>{p.name} — {p.clients_count} client{p.clients_count!==1?'s':''}</option>)}
            </select>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={15} color="#94a3b8" style={{ position:'absolute', left:12, top:11 }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder={isSenders ? 'Search sender ID, client, partner, email…'
                  : isMessages ? 'Search recipient, message, client, partner…'
                  : 'Search client, partner, email…'}
                className="senda-input" style={{ height:38, paddingLeft:34 }}/>
            </div>
          </div>

          {isMessages && (
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
              <select value={statusF} onChange={e=>setStatusF(e.target.value)}
                className="senda-input" style={{ height:36, width:'auto', cursor:'pointer' }}>
                {MSG_STATUSES.map(s => <option key={s} value={s}>{s ? s[0].toUpperCase()+s.slice(1) : 'All statuses'}</option>)}
              </select>
              <label style={{ fontSize:12, color:'#64748b' }}>From <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="senda-input" style={{ height:36, width:'auto', display:'inline-block', marginLeft:4 }}/></label>
              <label style={{ fontSize:12, color:'#64748b' }}>To <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="senda-input" style={{ height:36, width:'auto', display:'inline-block', marginLeft:4 }}/></label>
              <button onClick={downloadCsv} disabled={downloading || meta.total===0}
                className="senda-btn senda-btn-sm" style={{ height:36, marginLeft:'auto', border:`1.5px solid ${BRAND}`, color:BRAND, background:'#fff', fontWeight:700, opacity:(downloading||meta.total===0)?.5:1 }}>
                <Download size={14} strokeWidth={2.2} style={{ marginRight:6 }}/>{downloading ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          )}
        </div>

        {loading ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
         : rows.length === 0 ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>
             {isSenders ? 'No approved sender IDs found for partner clients.'
              : isMessages ? 'No messages found for partner clients.'
              : 'No partner clients are missing a phone number.'}
           </div>
         : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {(isSenders
                    ? ['Partner','Client','Sender ID','Provider','Owner','Approved']
                    : isMessages
                    ? ['Partner','Client','Recipient','Sender ID','Message','Status','Date','']
                    : ['Partner','Client','Email','Approved sender?','Joined']
                   ).map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#64748b', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isMessages ? rows.map(r => {
                  const sc = (r.status==='delivered'||r.status==='read') ? '#16a34a' : (r.status==='failed'||r.status==='undelivered') ? '#dc2626' : r.status==='sent' ? BRAND : '#64748b';
                  return (
                  <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{r.partner_name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#0f172a' }}>{r.client_name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', fontFamily:'monospace' }}>{r.recipient || '—'}</td>
                    <td style={{ padding:'10px 14px' }}>{r.sender_id ? <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:`${BRAND}1a`, color:BRAND }}>{r.sender_id}</span> : '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#475569', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.message}>{r.message || '—'}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:`${sc}1a`, color:sc }}>{r.status}</span></td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <button className="senda-btn senda-btn-sm" onClick={()=>openMessage(r.id)} style={{ height:30, border:'1.5px solid #e2e8f0', background:'#fff', color:BRAND, fontWeight:700 }}>View</button>
                    </td>
                  </tr>
                  );
                }) : isSenders ? rows.map(r => (
                  <tr key={r.sender_id_request_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{r.partner_name || '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ color:'#0f172a' }}>{r.client_name || '—'}</div>
                      {r.client_phone && <div style={{ color:'#94a3b8', fontFamily:'monospace', fontSize:11 }}>{r.client_phone}</div>}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99, fontSize:12, fontWeight:700, background:`${BRAND}1a`, color:BRAND }}>{r.sender_id}</span>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{r.provider || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b' }}>{r.owner_email || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )) : rows.map(r => (
                  <tr key={r.tenant_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{r.partner_name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#0f172a' }}>{r.client_name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b' }}>{r.client_email || '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                        background: r.has_approved_sender ? '#16a34a1a' : '#94a3b81a', color: r.has_approved_sender ? '#16a34a' : '#64748b' }}>
                        {r.has_approved_sender ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #eef2f7' }}>
            <div style={{ fontSize:12, color:'#94a3b8' }}>Page {meta.page} of {meta.total_pages}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_prev} onClick={()=>setPage(p=>Math.max(1,p-1))}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_prev?1:.5 }}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_next} onClick={()=>setPage(p=>p+1)}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_next?1:.5 }}>Next ›</button>
            </div>
          </div>
        )}
      </div>

      {msgDetail && createPortal(
        <div onClick={()=>setMsgDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', justifyContent:'flex-end', zIndex:1000 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'min(640px,100%)', height:'100%', background:'#fff', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Message detail</h3>
              <button className="senda-btn senda-btn-sm" onClick={()=>setMsgDetail(null)} style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff' }}><X size={16}/></button>
            </div>
            {msgDetail.loading ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
             : !msgDetail.data ? <div style={{ padding:24, color:'#dc2626', fontSize:13 }}>Could not load this message.</div>
             : (() => { const d = msgDetail.data; return (
              <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'8px 16px', fontSize:13, marginBottom:16 }}>
                  <span style={{ color:'#94a3b8' }}>Partner</span><span style={{ color:'#0f172a', fontWeight:600 }}>{d.partner_name || '—'}</span>
                  <span style={{ color:'#94a3b8' }}>Client</span><span style={{ color:'#0f172a' }}>{d.client_name || '—'}</span>
                  <span style={{ color:'#94a3b8' }}>Sender ID</span><span style={{ color:'#0f172a' }}>{d.sender_id || '—'}</span>
                  <span style={{ color:'#94a3b8' }}>Status</span><span style={{ color:'#0f172a' }}>{d.status}</span>
                  <span style={{ color:'#94a3b8' }}>Recipients</span><span style={{ color:'#0f172a' }}>{(d.recipients_count||0).toLocaleString()}</span>
                  <span style={{ color:'#94a3b8' }}>Date</span><span style={{ color:'#0f172a' }}>{d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Message</div>
                <div style={{ fontSize:13, color:'#0f172a', lineHeight:1.6, whiteSpace:'pre-wrap', background:'#f8fafc', border:'1px solid #eef2f7', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>{d.full_message || '—'}</div>
                {d.error_message && <div style={{ fontSize:12, color:'#dc2626', marginBottom:18 }}>Error: {d.error_message}</div>}

                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>
                  Recipients ({(d.recipients_list||[]).length}{d.recipients_truncated ? '+' : ''})
                </div>
                {(d.recipients_list||[]).length === 0 ? <div style={{ fontSize:12, color:'#94a3b8' }}>No per-recipient breakdown recorded.</div>
                 : (
                  <div style={{ border:'1px solid #eef2f7', borderRadius:10, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead><tr style={{ background:'#f8fafc' }}>
                        <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Phone</th>
                        <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Name</th>
                        <th style={{ textAlign:'left', padding:'8px 12px', color:'#64748b', fontWeight:700 }}>Status</th>
                      </tr></thead>
                      <tbody>
                        {d.recipients_list.map((rec,i) => (
                          <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#0f172a' }}>{rec.phone || '—'}</td>
                            <td style={{ padding:'8px 12px', color:'#64748b' }}>{rec.name || '—'}</td>
                            <td style={{ padding:'8px 12px', color: rec.status==='sent' ? '#16a34a' : rec.status==='failed' ? '#dc2626' : '#64748b' }}>{rec.status || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {d.recipients_truncated && <div style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>Showing first {(d.recipients_list||[]).length} recipients.</div>}
              </div>
             ); })()}
          </div>
        </div>, document.body)}
    </div>
  );
}

// ─── Approved Senders Tab (by audience: partners vs direct users) ────────────
function ApprovedSendersTab() {
  const { onLogout } = React.useContext(AppContext);

  const [audience, setAudience]   = useState('partners');
  const [partinas, setPartinas]   = useState([]);
  const [partnerId, setPartnerId] = useState('');
  const [search, setSearch]       = useState('');
  const [noProvider, setNoProvider] = useState(false);
  const [usage, setUsage]         = useState('');
  const [loginFrom, setLoginFrom] = useState('');
  const [loginTo, setLoginTo]     = useState('');
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows]           = useState([]);
  const [summary, setSummary]     = useState({ total:0, no_provider:0, with_provider:0 });
  const [meta, setMeta]           = useState({ total:0, page:1, total_pages:1, has_next:false, has_prev:false });
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);

  const isPartners = audience === 'partners';

  useEffect(() => {
    adminFetch(`${BROADCAST_API}/broadcasts/partinas`, { method:'GET' }, onLogout)
      .then(res => { if (res.success) setPartinas(res.data || []); })
      .catch(() => {});
  }, [onLogout]);

  const buildParams = useCallback(() => {
    const qs = new URLSearchParams({ audience });
    if (isPartners && partnerId) qs.set('partner_id', partnerId);
    if (search.trim()) qs.set('search', search.trim());
    if (noProvider) qs.set('no_provider', '1');
    if (!isPartners && usage) qs.set('usage', usage);
    if (!isPartners && loginFrom) qs.set('login_from', loginFrom);
    if (!isPartners && loginTo) qs.set('login_to', loginTo);
    return qs;
  }, [audience, isPartners, partnerId, search, noProvider, usage, loginFrom, loginTo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildParams();
      qs.set('page', String(page)); qs.set('limit', '20');
      const res = await adminFetch(`${BROADCAST_API}/approved-senders?${qs.toString()}`, { method:'GET' }, onLogout);
      if (res.success) { setRows(res.data || []); setMeta(res.meta || meta); setSummary(res.summary || { total:0, no_provider:0, with_provider:0 }); }
    } catch {} finally { setLoading(false); }
  }, [buildParams, page, onLogout]);

  const downloadCsv = useCallback(async () => {
    setDownloading(true);
    try {
      const qs = buildParams(); qs.set('export', 'csv');
      const token = getToken();
      const resp = await fetch(`${BASE_URL}${BROADCAST_API}/approved-senders?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials:'include',
      });
      if (!resp.ok) throw new Error('download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `approved_senders_${audience}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {} finally { setDownloading(false); }
  }, [buildParams, audience]);

  useEffect(() => { setPage(1); }, [audience, partnerId, search, noProvider, usage, loginFrom, loginTo]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const Chip = ({ label, value, active, onClick, color }) => (
    <button onClick={onClick} style={{ cursor:onClick?'pointer':'default', textAlign:'left', padding:'8px 14px', borderRadius:10,
      border:`1.5px solid ${active ? (color||BRAND) : '#e2e8f0'}`, background: active ? `${color||BRAND}0d` : '#fff' }}>
      <div style={{ fontSize:18, fontWeight:800, color: color||'#0f172a' }}>{(value||0).toLocaleString()}</div>
      <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{label}</div>
    </button>
  );

  return (
    <div className="senda-fade-in">
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{id:'partners',label:'Partners'},{id:'direct_users',label:'Direct Users'}].map(a => (
          <button key={a.id} onClick={()=>setAudience(a.id)} className="senda-btn senda-btn-sm"
            style={{ height:34, background: audience===a.id ? BRAND : '#fff', color: audience===a.id ? '#fff' : '#475569',
              border:`1.5px solid ${audience===a.id ? BRAND : '#e2e8f0'}` }}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="senda-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <Tag size={18} color={BRAND} strokeWidth={2.2}/>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>
              Approved Sender IDs · {isPartners ? 'Partner clients' : 'Direct users'}
            </h3>
          </div>
          <div style={{ fontSize:12, color:'#64748b' }}>
            {isPartners
              ? "All approved sender names belonging to partners' clients."
              : 'All approved sender names belonging to directly-registered customers.'}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <Chip label="Total approved" value={summary.total} active={!noProvider} onClick={()=>setNoProvider(false)}/>
            <Chip label="No provider" value={summary.no_provider} active={noProvider} onClick={()=>setNoProvider(!noProvider)} color="#d97706"/>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
            {isPartners && (
              <select value={partnerId} onChange={e=>setPartnerId(e.target.value)}
                className="senda-input" style={{ height:38, width:'auto', minWidth:220, cursor:'pointer' }}>
                <option value="">All partners</option>
                {partinas.map(p => <option key={p.partner_id} value={p.partner_id}>{p.name} — {p.clients_count} client{p.clients_count!==1?'s':''}</option>)}
              </select>
            )}
            <div style={{ position:'relative', flex:1, minWidth:180 }}>
              <Search size={15} color="#94a3b8" style={{ position:'absolute', left:12, top:11 }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sender ID, account, owner…"
                className="senda-input" style={{ height:38, paddingLeft:34 }}/>
            </div>
            <button onClick={downloadCsv} disabled={downloading || summary.total===0}
              className="senda-btn senda-btn-sm" style={{ height:38, border:`1.5px solid ${BRAND}`, color:BRAND, background:'#fff', fontWeight:700, opacity:(downloading||summary.total===0)?.5:1 }}>
              <Download size={14} strokeWidth={2.2} style={{ marginRight:6 }}/>{downloading ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>

          {!isPartners && (
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
              <select value={usage} onChange={e=>setUsage(e.target.value)} className="senda-input" style={{ height:36, width:'auto', cursor:'pointer' }}>
                <option value="">All usage</option>
                <option value="none">Never used SMS</option>
                <option value="low">Uses SMS slowly (1–100)</option>
                <option value="active">Active (100+)</option>
              </select>
              <span style={{ fontSize:12, color:'#64748b', fontWeight:600, marginLeft:6 }}>Last login between</span>
              <input type="date" value={loginFrom} onChange={e=>setLoginFrom(e.target.value)} className="senda-input" style={{ height:36, width:'auto' }}/>
              <span style={{ fontSize:12, color:'#94a3b8' }}>and</span>
              <input type="date" value={loginTo} onChange={e=>setLoginTo(e.target.value)} className="senda-input" style={{ height:36, width:'auto' }}/>
              {(usage || loginFrom || loginTo) && <button onClick={()=>{ setUsage(''); setLoginFrom(''); setLoginTo(''); }} className="senda-btn senda-btn-sm" style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b' }}>Clear</button>}
            </div>
          )}
        </div>

        {loading ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
         : rows.length === 0 ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>No approved sender IDs found.</div>
         : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {((isPartners ? ['Partner'] : []).concat(['Account','Sender ID','Provider'])
                    .concat(isPartners ? [] : ['Last login','SMS used'])
                    .concat(['Owner','Approved'])).map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#64748b', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.sender_id_request_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    {isPartners && <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{r.partner_name || '—'}</td>}
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ color:'#0f172a' }}>{r.account_name || '—'}</div>
                      {r.account_phone && <div style={{ color:'#94a3b8', fontFamily:'monospace', fontSize:11 }}>{r.account_phone}</div>}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99, fontSize:12, fontWeight:700, background:`${BRAND}1a`, color:BRAND }}>{r.sender_id}</span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      {r.provider ? <span style={{ color:'#475569' }}>{r.provider}</span>
                        : <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#d977061a', color:'#d97706' }}>No provider</span>}
                    </td>
                    {!isPartners && <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.last_login ? new Date(r.last_login).toLocaleDateString() : 'Never'}</td>}
                    {!isPartners && <td style={{ padding:'10px 14px', color:'#0f172a', fontWeight:600 }}>{(r.sms_used||0).toLocaleString()}</td>}
                    <td style={{ padding:'10px 14px', color:'#64748b' }}>{r.owner_email || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #eef2f7' }}>
            <div style={{ fontSize:12, color:'#94a3b8' }}>Page {meta.page} of {meta.total_pages}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_prev} onClick={()=>setPage(p=>Math.max(1,p-1))}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_prev?1:.5 }}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_next} onClick={()=>setPage(p=>p+1)}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_next?1:.5 }}>Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Registered · Never requested (idle users) ──────────────────────────────
function RegisteredIdleTab() {
  const { onLogout } = React.useContext(AppContext);

  const [search, setSearch]       = useState('');
  const [minIdle, setMinIdle]     = useState('');
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows]           = useState([]);
  const [summary, setSummary]     = useState({ total:0 });
  const [meta, setMeta]           = useState({ total:0, page:1, total_pages:1, has_next:false, has_prev:false });
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);

  const buildParams = useCallback(() => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set('search', search.trim());
    if (minIdle) qs.set('min_idle', String(minIdle));
    return qs;
  }, [search, minIdle]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildParams(); qs.set('page', String(page)); qs.set('limit', '20');
      const res = await adminFetch(`${BROADCAST_API}/registered-never-requested?${qs.toString()}`, { method:'GET' }, onLogout);
      if (res.success) { setRows(res.data || []); setMeta(res.meta || meta); setSummary(res.summary || { total:0 }); }
    } catch {} finally { setLoading(false); }
  }, [buildParams, page, onLogout]);

  const downloadCsv = useCallback(async () => {
    setDownloading(true);
    try {
      const qs = buildParams(); qs.set('export', 'csv');
      const token = getToken();
      const resp = await fetch(`${BASE_URL}${BROADCAST_API}/registered-never-requested?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials:'include',
      });
      if (!resp.ok) throw new Error('download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'registered_never_requested.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch {} finally { setDownloading(false); }
  }, [buildParams]);

  useEffect(() => { setPage(1); }, [search, minIdle]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div className="senda-fade-in">
      <div className="senda-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #eef2f7' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <Clock size={18} color={BRAND} strokeWidth={2.2}/>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>Registered · Never requested a Sender ID</h3>
          </div>
          <div style={{ fontSize:12, color:'#64748b' }}>
            Active users who signed up but never requested a sender ID, with how long they've been idle. {(summary.total||0).toLocaleString()} total.
          </div>

          <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={15} color="#94a3b8" style={{ position:'absolute', left:12, top:11 }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone…"
                className="senda-input" style={{ height:38, paddingLeft:34 }}/>
            </div>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>Idle ≥
              <input type="number" min="0" value={minIdle} onChange={e=>setMinIdle(e.target.value)} placeholder="0"
                className="senda-input" style={{ height:38, width:90, marginLeft:6, display:'inline-block' }}/> days
            </label>
            <button onClick={downloadCsv} disabled={downloading || summary.total===0}
              className="senda-btn senda-btn-sm" style={{ height:38, border:`1.5px solid ${BRAND}`, color:BRAND, background:'#fff', fontWeight:700, opacity:(downloading||summary.total===0)?.5:1 }}>
              <Download size={14} strokeWidth={2.2} style={{ marginRight:6 }}/>{downloading ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>
        </div>

        {loading ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>Loading…</div>
         : rows.length === 0 ? <div style={{ padding:24, color:'#94a3b8', fontSize:13 }}>No matching users.</div>
         : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['User','Business','Phone','Registered','Last login','Idle (days)'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#64748b', fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.user_id} style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ color:'#0f172a', fontWeight:600 }}>{r.name || '—'}</div>
                      <div style={{ color:'#94a3b8', fontSize:11 }}>{r.email}</div>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#475569' }}>{r.business || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', fontFamily:'monospace' }}>{r.phone || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{r.last_login ? new Date(r.last_login).toLocaleDateString() : 'Never'}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700, color: (r.idle_days||0) > 30 ? '#dc2626' : '#0f172a' }}>{r.idle_days != null ? r.idle_days.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid #eef2f7' }}>
            <div style={{ fontSize:12, color:'#94a3b8' }}>Page {meta.page} of {meta.total_pages}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_prev} onClick={()=>setPage(p=>Math.max(1,p-1))}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_prev?1:.5 }}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm" disabled={!meta.has_next} onClick={()=>setPage(p=>p+1)}
                style={{ height:32, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', opacity: meta.has_next?1:.5 }}>Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sidebar items grouped into labeled sections.
const NAV_GROUPS = [
  { title: 'Analytics', items: [
    { id:'overview',      Icon:BarChart3,    label:'Overview'         },
    { id:'insights',      Icon:Activity,     label:'Insights'         },
  ]},
  { title: 'Messaging', items: [
    { id:'broadcast',     Icon:Megaphone,    label:'Broadcast'        },
    { id:'whatsapp',      Icon:Send,         label:'WhatsApp'         },
    { id:'notifications', Icon:Bell,         label:'Push Notifications' },
    { id:'systemsms',     Icon:Mail,         label:'System SMS Log'   },
  ]},
  { title: 'Sender IDs', items: [
    { id:'senderids',     Icon:Tag,          label:'Sender IDs'       },
    { id:'approvedsenders', Icon:ShieldCheck, label:'Approved Senders' },
  ]},
  { title: 'Customers', items: [
    { id:'users',         Icon:Users,        label:'Users'            },
    { id:'idleusers',     Icon:Clock,        label:'Idle Users'       },
    { id:'engagement',    Icon:MessageSquare, label:'Engagement'      },
  ]},
  { title: 'Partners', items: [
    { id:'partners',      Icon:Handshake,    label:'Partners'         },
    { id:'partnersenders', Icon:Tag,         label:'Partner Clients'  },
  ]},
  { title: 'Billing', items: [
    { id:'transactions',  Icon:CreditCard,   label:'Transactions'     },
    { id:'packages',      Icon:Package,      label:'Packages'         },
  ]},
  { title: 'System', items: [
    { id:'loginactivity', Icon:ShieldCheck,  label:'Login Activity'   },
    { id:'settings',      Icon:Settings,     label:'Settings'         },
    { id:'operations',    Icon:Globe,        label:'Operations'       },
  ]},
];

// Flattened list for lookups (e.g. resolving the active tab's label/icon).
const NAV = NAV_GROUPS.flatMap(g => g.items);

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
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title} style={{marginBottom: collapsed ? 4 : 8}}>
            {!collapsed
              ? <div style={{fontSize:9,fontWeight:700,color:'#cbd5e1',letterSpacing:'.1em',textTransform:'uppercase',padding:'8px 8px 6px'}}>{group.title}</div>
              : (gi > 0 ? <div style={{height:1,background:'#f1f5f9',margin:'5px 10px'}}/> : null)
            }
            {group.items.map(n=>(
              <button key={n.id} className={`senda-nav-item${active===n.id?' active':''}`}
                onClick={()=>setActive(n.id)}
                title={collapsed?n.label:''}
                style={{justifyContent:collapsed?'center':'flex-start', borderLeft:active===n.id&&!collapsed?`3px solid ${BRAND}`:'3px solid transparent', paddingLeft:collapsed?undefined:9}}>
                <n.Icon className="senda-nav-icon" strokeWidth={2.2} />
                {!collapsed && <span>{n.label}</span>}
              </button>
            ))}
          </div>
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

        {/* nav list — scrollable if needed; all NAV items shown, grouped */}
        <nav style={{flex:1, overflowY:'auto', padding:'10px 8px'}}>
          {NAV_GROUPS.map(group => (
          <div key={group.title} style={{marginBottom:6}}>
            <div style={{fontSize:9,fontWeight:700,color:'#cbd5e1',letterSpacing:'.1em',textTransform:'uppercase',padding:'8px 12px 4px'}}>{group.title}</div>
            {group.items.map(n => {
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
          </div>
          ))}
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
function ToggleablePanel({ title, subtitle, color, hasData = true, emptyMsg = 'No data.', renderChart, renderTable, footer, headerAction }) {
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
      <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
        <div style={{minWidth:0,flex:1}}>
          <h4 style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{title}</h4>
          {subtitle && <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{subtitle}</p>}
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
          {headerAction}
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
    // Per request: Insights CSVs export only Name + Phone (no email / no other fields).
    const headers = ['Name','Phone'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines  = [headers.map(escape).join(',')];
    filteredRows.forEach(u => {
      lines.push([u.name || '', u.phone || ''].map(escape).join(','));
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
    // Insights CSVs export only Name + Phone.
    const headers = ['Name','Phone'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    filteredRows.forEach(u => {
      lines.push([u.name || '', u.phone || ''].map(escape).join(','));
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
    // Insights CSVs export only Name + Phone. Owner name comes from the
    // resolved user record (falls back to the sender name itself).
    const headers = ['Name','Phone'];
    const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    filteredRows.forEach(s => {
      const u = lookupOwner(s);
      const name  = u?.name || s.name || s.sender_name || s.sender_id || '';
      const phone = u?.phone || '';
      lines.push([name, phone].map(escape).join(','));
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
            const downloadPeriod = (item) => {
              const matched = filteredUsers.filter(item.filter);
              if (matched.length === 0) return;
              const slug = String(item.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              downloadEngagementCsv(
                `registrations-${slug || 'period'}-${new Date().toISOString().slice(0,10)}.csv`,
                ['Name','Phone'],
                matched.map(u => [u.name || '', u.phone || '']),
              );
            };
            return (
              <>
              <RegYearChips years={regYears} value={regYearFilter} onChange={setRegYearFilter}/>
              <ExpandableTable
                accent={BRAND}
                headers={['Period','Count','CSV']}
                items={[...aggregateItems, ...monthItems]}
                renderRow={(item) => {
                  const matchedCount = filteredUsers.filter(item.filter).length;
                  return (
                    <>
                      <td style={{fontWeight: item.__highlight ? 700 : 600, fontSize:12, color:'#0f172a'}}>{item.label}</td>
                      <td style={{fontSize:12, color: item.__highlight ? BRAND : '#64748b', fontWeight:600}}>{Number(item.count||0).toLocaleString()}</td>
                      <td style={{width:60}}>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadPeriod(item); }}
                          disabled={matchedCount === 0}
                          title={matchedCount === 0 ? 'No users to export' : `Download ${matchedCount} user${matchedCount===1?'':'s'} (Name + Phone)`}
                          style={{
                            display:'inline-flex',alignItems:'center',gap:4,
                            padding:'4px 9px',borderRadius:6,border:'none',
                            background: matchedCount === 0 ? '#f1f5f9' : BRAND,
                            color:      matchedCount === 0 ? '#94a3b8' : '#fff',
                            fontSize:10,fontWeight:700,
                            cursor: matchedCount === 0 ? 'not-allowed' : 'pointer',
                          }}>
                          <Download size={11} strokeWidth={2.4}/>
                          {matchedCount}
                        </button>
                      </td>
                    </>
                  );
                }}
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
              // Insights CSVs export only Name + Phone.
              const headers = ['Name','Phone'];
              const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
              const lines  = [headers.map(escape).join(',')];
              rows.forEach(u => {
                lines.push([u.name || '', u.phone || ''].map(escape).join(','));
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

// ─── Engagement Tab ──────────────────────────────────────────────────────────
// Three outreach dashboards backed by /api/admin/v1/engagement/*:
//   • Approved Senders (payment intelligence + intent tracking)
//   • Active Users (happy customers, sorted by spend)
//   • Inactive Users (registered but never engaged)
// Each row has an inline note editor that PUTs to the server-side notes endpoint.

// Normalize the wide range of envelopes the admin API might send back —
// DRF paginated ({count, results}), DRF wrapped ({success, data: {count, results}}),
// bare arrays, bare {items: []}, etc. — into a single shape:
//   { ok, count, items, pageSummary, error }
// The views consume those four fields directly, no further branching needed.
function unwrapEngagementResponse(res) {
  if (typeof console !== 'undefined' && console.debug) console.debug('[engagement] raw response:', res);
  if (res == null) return { ok: false, count: 0, items: [], pageSummary: {}, meta: null, hasNext: false, error: 'Empty response.' };

  // Explicit failure
  if (typeof res === 'object' && res.success === false) {
    return { ok: false, count: 0, items: [], pageSummary: {}, meta: null, hasNext: false,
      error: res.error?.message || res.error || res.message || 'Request failed.' };
  }

  // Walk through possible payload locations.
  // 1) wrapped: { success: true, data: <payload> }
  // 2) raw DRF: payload at top level
  // 3) bare array: top level is the items array
  const tryRoots = [];
  if (Array.isArray(res)) tryRoots.push({ items: res });
  if (typeof res === 'object') {
    tryRoots.push(res);
    if (res.data) tryRoots.push(res.data);
    if (res.results && typeof res.results === 'object' && !Array.isArray(res.results)) tryRoots.push(res.results);
  }

  let items = null;
  let pageSummary = {};
  let count = null;
  let meta = null;
  let hasNext = null;
  for (const root of tryRoots) {
    if (!root || typeof root !== 'object') continue;
    // count may live at root.count (DRF default) OR at root.meta.total / root.meta.count (custom envelope)
    if (count == null && typeof root.count === 'number') count = root.count;
    if (root.meta && typeof root.meta === 'object') {
      if (!meta) meta = root.meta;
      if (count == null && typeof root.meta.total === 'number') count = root.meta.total;
      if (count == null && typeof root.meta.count === 'number') count = root.meta.count;
      if (hasNext == null && typeof root.meta.has_next === 'boolean') hasNext = root.meta.has_next;
    }
    if (root.page_summary && typeof root.page_summary === 'object') pageSummary = root.page_summary;
    // items may be at root.items, root.results.items, or root.results (if array)
    if (items == null) {
      if (Array.isArray(root.items))   items = root.items;
      else if (Array.isArray(root.results)) items = root.results;
      else if (root.results && Array.isArray(root.results.items)) items = root.results.items;
    }
  }

  // If we got anything (even just an empty items array), treat as OK.
  // IMPORTANT: do NOT fall back `count` to `items.length` — callers rely on
  // a real total to know when to stop paginating, and a per-page fallback
  // would make them think page 1 was the whole dataset.
  if (items != null || count != null) {
    return {
      ok: true,
      count: count != null ? count : (items?.length ?? 0),
      items: items || [],
      pageSummary,
      meta,
      hasNext: hasNext != null ? hasNext : null,
      error: null,
    };
  }

  // Genuinely couldn't find data — surface what the server said.
  return {
    ok: false, count: 0, items: [], pageSummary: {}, meta: null, hasNext: false,
    error: res.error?.message || res.error || res.message || 'Unexpected response shape — check console for raw payload.',
  };
}

// Paginate through every page of an engagement endpoint and return the merged
// items array. Used by the CSV download buttons so the export covers the entire
// filtered set, not just the page currently on screen.
async function fetchAllEngagementPages(adminFetchFn, basePath, params = {}, onLogout) {
  const all = [];
  let page = 1;
  // Request a large page_size — the server may cap this lower (e.g. 20),
  // so the loop never assumes one page == one dataset. Stop signals are,
  // in order of preference: `meta.has_next`, `meta.total`, or an empty page.
  const PAGE_SIZE = 200;
  let safety = 0;
  let totalCount = null;
  while (safety++ < 500) {
    const qs = new URLSearchParams({ ...params, page: String(page), page_size: String(PAGE_SIZE) });
    const res = await adminFetchFn(`${basePath}?${qs}`, {}, onLogout);
    const { ok, items, count, meta, hasNext } = unwrapEngagementResponse(res);
    if (!ok && items.length === 0) break;
    // Prefer the explicit total from `meta.total` over the unwrap fallback
    // (which collapses to items.length when the server omits a count).
    if (meta && typeof meta.total === 'number') totalCount = meta.total;
    else if (totalCount == null && count != null && page === 1 && items.length > 0 && count > items.length) {
      // Only trust unwrap's count if it clearly represents a true total
      // (greater than the items just returned). Otherwise leave null.
      totalCount = count;
    }
    all.push(...items);
    // 1) Explicit `has_next: false` from the server → we have everything.
    if (hasNext === false) break;
    // 2) Total known and reached.
    if (totalCount != null && all.length >= totalCount) break;
    // 3) No total reported AND the server returned an empty page → done.
    if (items.length === 0) break;
    page++;
  }
  return all;
}

// Build + trigger a CSV download. UTF-8 with BOM so Excel reads Swahili / accented
// names correctly. `headers` is an array of column titles, `rows` is array of
// arrays whose order matches `headers`.
function downloadEngagementCsv(filename, headers, rows) {
  const escape = (c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(row.map(escape).join(',')));
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PAYMENT_STATUS_META = {
  paid:      { label: 'Paid',      color: GREEN  },
  not_paid:  { label: 'Not paid',  color: '#94a3b8' },
  pending:   { label: 'Pending',   color: AMBER  },
  attempted: { label: 'Attempted', color: ORANGE },
};

const PAYMENT_INTENT_OPTIONS = [
  { value: 'unknown',   label: 'Unknown'   },
  { value: 'will_pay',  label: 'Will pay'  },
  { value: 'declined',  label: 'Declined'  },
  { value: 'attempted', label: 'Attempted' },
];

// Generic note editor — used by all three views. Variant=`sender` shows the
// payment_intent dropdown; `user` omits it.
function EngagementNoteEditor({ note = {}, variant = 'user', onSave, saving = false, accent = BRAND }) {
  const [checked, setChecked]    = useState(!!note.checked);
  const [intent,  setIntent]     = useState(note.payment_intent || 'unknown');
  const [text,    setText]       = useState(note.feedback || '');
  const [dirty,   setDirty]      = useState(false);

  // Sync to upstream note when row's note arrives/changes.
  useEffect(() => {
    setChecked(!!note.checked);
    setIntent(note.payment_intent || 'unknown');
    setText(note.feedback || '');
    setDirty(false);
  }, [note.checked, note.payment_intent, note.feedback, note.updated_at]);

  const save = (overrides = {}) => {
    const body = { checked, feedback: text, ...overrides };
    if (variant === 'sender') body.payment_intent = overrides.payment_intent ?? intent;
    onSave?.(body);
    setDirty(false);
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Outreach status</div>
        <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,cursor:'pointer',fontSize:12,color:'#0f172a'}}>
          <input type="checkbox" checked={checked}
            onChange={e => { setChecked(e.target.checked); setDirty(true); save({ checked: e.target.checked }); }}
            style={{width:16,height:16,accentColor:accent,cursor:'pointer'}}/>
          <span>Mark as <strong>contacted</strong></span>
        </label>
        {variant === 'sender' && (
          <>
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Payment intent</div>
            <select className="senda-input" value={intent}
              onChange={e => { setIntent(e.target.value); setDirty(true); save({ payment_intent: e.target.value }); }}
              style={{height:32,fontSize:12,width:'100%'}}>
              {PAYMENT_INTENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </>
        )}
        {(note.last_contacted_at || note.contacted_by) && (
          <div style={{fontSize:10,color:'#94a3b8',marginTop:10}}>
            Last contact: {note.last_contacted_at ? new Date(note.last_contacted_at).toLocaleString() : '—'}
            {note.contacted_by && <><br/>By {note.contacted_by}</>}
          </div>
        )}
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Feedback</div>
        <textarea className="senda-input" rows={4}
          placeholder="What did the customer say? Free-text notes…"
          value={text}
          onChange={e => { setText(e.target.value); setDirty(true); }}
          onBlur={() => { if (dirty) save(); }}
          style={{width:'100%',fontSize:12,resize:'vertical',padding:'8px 10px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6,gap:8}}>
          <span style={{fontSize:10,color: dirty ? AMBER : '#94a3b8'}}>{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</span>
          <button onClick={() => save()} disabled={saving || !dirty}
            style={{padding:'6px 12px',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:dirty && !saving ? 'pointer':'not-allowed',
              background: dirty && !saving ? accent : '#f1f5f9', color: dirty && !saving ? '#fff' : '#94a3b8'}}>
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approved Senders sub-view ────────────────────────────────────────────────
// Emails that belong to partner-network admin accounts. Senders whose contact
// email matches one of these are excluded from the Approved Senders view —
// they're partner-owned applications, not direct customers.
const ENGAGEMENT_EXCLUDED_EMAILS = new Set([
  'development@swahilies.com',
]);
function isExcludedSenderRow(it) {
  const e = String(it?.email || '').trim().toLowerCase();
  return ENGAGEMENT_EXCLUDED_EMAILS.has(e);
}

function ApprovedSendersView() {
  const { onLogout } = React.useContext(AppContext);
  // Single source of truth: every row that matched the active server-side filters,
  // pulled across every page. Client-side filters (excludePartner) + pagination
  // run on top of this in-memory dataset. `items` and `count` below are derived.
  const [allItems, setAllItems] = useState([]);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [intent, setIntent]     = useState('all');
  const [excludePartner, setExcludePartner] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [openId, setOpenId]     = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [paySummary, setPaySummary] = useState(null);
  const PER = 25;

  // Refetch all pages when the SERVER-SIDE filters change. Toggling the
  // audience or paging through pages doesn't refire the request.
  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const params = {};
    if (search.trim())            params.search = search.trim();
    if (paymentStatus !== 'all')  params.payment_status = paymentStatus;
    if (intent !== 'all')         params.intent = intent;
    fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/approved-senders/', params, onLogout)
      .then(all => { setAllItems(all || []); })
      .catch(e => setError(e?.message || 'Failed to load approved senders.'))
      .finally(() => setLoading(false));
  }, [onLogout, search, paymentStatus, intent]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, paymentStatus, intent, excludePartner]);

  // Amount collected from approved senders, by period (independent of list filters).
  useEffect(() => {
    adminFetch('/api/admin/v1/engagement/approved-senders/payment-summary/', {}, onLogout)
      .then(res => { if (res && res.success) setPaySummary(res.data); })
      .catch(() => {});
  }, [onLogout]);

  // Apply audience filter (excludePartner) once. Everything downstream reads
  // from filteredAllItems so summary counts, table contents, and pagination
  // can never disagree.
  const filteredAllItems = React.useMemo(
    () => (excludePartner ? allItems.filter(it => !isExcludedSenderRow(it)) : allItems),
    [allItems, excludePartner]
  );
  const totalFiltered = filteredAllItems.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / PER));
  const safePage      = Math.min(page, totalPages);
  const items         = React.useMemo(
    () => filteredAllItems.slice((safePage - 1) * PER, safePage * PER),
    [filteredAllItems, safePage]
  );
  const count = totalFiltered; // exposes the right number to the existing UI bindings.

  // Summary cards now reflect the entire filtered dataset, not just one page.
  const summaryCards = React.useMemo(() => {
    const paid    = filteredAllItems.filter(i => i.payment_status === 'paid').length;
    const notPaid = filteredAllItems.filter(i => i.payment_status === 'not_paid').length;
    const pending = filteredAllItems.filter(i => ['pending','attempted'].includes(i.payment_status)).length;
    return {
      total: totalFiltered,
      paid,
      not_paid: notPaid,
      pending_or_attempted: pending,
    };
  }, [filteredAllItems, totalFiltered]);

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (search.trim())            params.search = search.trim();
      if (paymentStatus !== 'all')  params.payment_status = paymentStatus;
      if (intent !== 'all')         params.intent = intent;
      const fetched = await fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/approved-senders/', params, onLogout);
      const all = excludePartner ? fetched.filter(it => !isExcludedSenderRow(it)) : fetched;
      if (all.length === 0) return;
      downloadEngagementCsv(
        `approved-senders-${new Date().toISOString().slice(0,10)}.csv`,
        ['Sender Name','Business','Phone','Email','Location','Payment Status','Registration Fee (TZS)','SMS Spend (TZS)','Total Paid (TZS)','Txn Count','Customers','Days Active','Approved At','Last Payment','Note · Checked','Note · Intent','Note · Feedback','Note · Last Contacted','Note · Contacted By'],
        all.map(it => [
          it.sender_name || '',
          it.business || '',
          it.phone || '',
          it.email || '',
          it.location || '',
          it.payment_status || '',
          Number(it.registration_fee_tzs || 0),
          Number(it.sms_spend_tzs || 0),
          Number(it.total_paid_tzs || 0),
          it.txn_count || 0,
          it.customer_count || 0,
          it.days_active ?? '',
          it.approved_at || '',
          it.last_payment_at || '',
          it.note?.checked ? 'yes' : 'no',
          it.note?.payment_intent || '',
          it.note?.feedback || '',
          it.note?.last_contacted_at || '',
          it.note?.contacted_by || '',
        ]),
      );
    } finally { setDownloading(false); }
  };

  const saveNote = (requestId, body) => {
    setSavingId(requestId);
    adminFetch(`/api/admin/v1/engagement/approved-senders/${requestId}/note/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, onLogout)
      .then(res => {
        const noteData = (res && res.success && res.data) ? res.data
                       : (res && (res.checked != null || res.feedback != null || res.payment_intent != null)) ? res
                       : null;
        if (noteData) {
          setAllItems(prev => prev.map(it => it.request_id === requestId ? { ...it, note: noteData } : it));
        }
      })
      .finally(() => setSavingId(null));
  };

  return (
    <div>
      {/* Audience toggle — include or exclude partner-network applications */}
      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
        <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',marginRight:4}}>Audience</span>
        {[
          { id: true,  label: 'Exclude partners' },
          { id: false, label: 'Include partners' },
        ].map(opt => {
          const isActive = excludePartner === opt.id;
          return (
            <button key={String(opt.id)} onClick={() => setExcludePartner(opt.id)}
              title={opt.id ? `Hide senders owned by ${[...ENGAGEMENT_EXCLUDED_EMAILS].join(', ')}` : 'Show every approved sender, including partner-owned ones'}
              style={{
                height:26,padding:'0 11px',borderRadius:7,border:'none',cursor:'pointer',
                fontSize:11,fontWeight:600,
                background: isActive ? BRAND : '#f1f5f9',
                color:      isActive ? '#fff' : '#64748b',
              }}>{opt.label}</button>
          );
        })}
      </div>

      {/* Amount collected by period (registration fees + SMS spend) */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:12}}>
        {[
          { label:'Paid · Today',      d: paySummary?.today },
          { label:'Paid · This week',  d: paySummary?.this_week },
          { label:'Paid · This month', d: paySummary?.this_month },
          { label:'Paid · All time',   d: paySummary?.all_time },
        ].map(c => (
          <div key={c.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${GREEN}`}}>
            <div style={{fontSize:19,fontWeight:800,color: (c.d?.amount||0) > 0 ? '#0f172a' : '#94a3b8'}}>
              {Number(c.d?.amount || 0).toLocaleString()}
              <span style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginLeft:4}}>TZS</span>
            </div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:3}}>{c.label}</div>
            {paySummary
              ? <div style={{fontSize:10,color:'#cbd5e1',marginTop:3}}>{Number(c.d?.payments||0).toLocaleString()} payments · reg {Number(c.d?.registration||0).toLocaleString()} · sms {Number(c.d?.sms||0).toLocaleString()}</div>
              : <div style={{fontSize:10,color:'#e2e8f0',marginTop:3}}>loading…</div>}
          </div>
        ))}
      </div>

      {/* Page-summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14}}>
        {[
          { label:'Total',        value: summaryCards.total,               color: BRAND },
          { label:'Paid',         value: summaryCards.paid,                color: GREEN },
          { label:'Not paid',     value: summaryCards.not_paid,            color: '#94a3b8' },
          { label:'Pending / Attempted', value: summaryCards.pending_or_attempted, color: AMBER },
        ].map(k => (
          <div key={k.label} className="senda-card" style={{padding:'14px 16px',borderLeft:`3px solid ${k.color}`}}>
            <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>{Number(k.value || 0).toLocaleString()}</div>
            <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:3}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search name, business, email, phone…"
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:280,height:34,fontSize:12}}/>
        <div style={{display:'flex',gap:4}}>
          {['all','paid','not_paid','pending','attempted'].map(f => {
            const meta = PAYMENT_STATUS_META[f] || { label:'All', color: BRAND };
            const isActive = paymentStatus === f;
            return (
              <button key={f} onClick={()=>setPaymentStatus(f)} className="senda-btn senda-btn-sm"
                style={{background: isActive ? meta.color : '#f1f5f9', color: isActive ? '#fff' : '#64748b', border:'none'}}>
                {f === 'all' ? 'All' : meta.label}
              </button>
            );
          })}
        </div>
        <select className="senda-input" value={intent} onChange={e=>setIntent(e.target.value)}
          style={{height:34,fontSize:12}}>
          <option value="all">All intents</option>
          {PAYMENT_INTENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{count.toLocaleString()} senders</span>
        <button onClick={handleDownload} disabled={downloading || count === 0}
          style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',
            background: (downloading || count===0) ? '#f1f5f9' : BRAND,
            color: (downloading || count===0) ? '#94a3b8' : '#fff',
            border:'none',borderRadius:7,fontSize:11,fontWeight:700,
            cursor: (downloading || count===0) ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          {downloading ? 'Preparing…' : `Download CSV (${count})`}
        </button>
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:1000}}>
              <thead>
                <tr>
                  <th>Sender</th><th>Business</th><th>Contact</th>
                  <th>Payment</th><th>Paid (TZS)</th><th>Customers</th><th>Days</th><th>Note</th><th style={{width:30}}/>
                </tr>
              </thead>
              <tbody>
                {items.map(it => {
                  const isOpen = openId === it.request_id;
                  const meta = PAYMENT_STATUS_META[it.payment_status] || { label: it.payment_status, color:'#94a3b8' };
                  return (
                    <React.Fragment key={it.request_id}>
                      <tr onClick={() => setOpenId(isOpen ? null : it.request_id)}
                        style={{cursor:'pointer', background: isOpen ? '#eff6ff' : undefined}}>
                        <td style={{fontWeight:700,fontSize:12,color:'#0f172a'}}>{it.sender_name || '—'}</td>
                        <td style={{fontSize:12,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.business || '—'}</td>
                        <td style={{fontSize:11,color:'#64748b',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {it.email || '—'}
                          {it.phone && <div style={{fontFamily:'ui-monospace,Menlo,monospace',fontSize:10,color:'#94a3b8'}}>{it.phone}</div>}
                        </td>
                        <td>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:`${meta.color}18`,color:meta.color,textTransform:'uppercase',letterSpacing:'.04em'}}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{fontSize:12}}>
                          <div style={{fontWeight:700,color: Number(it.total_paid_tzs||0) > 0 ? GREEN : '#94a3b8'}}>
                            {Number(it.total_paid_tzs || 0).toLocaleString()}
                          </div>
                          {Number(it.registration_fee_tzs||0) > 0 && (
                            <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>
                              reg {Number(it.registration_fee_tzs).toLocaleString()}
                              {Number(it.sms_spend_tzs||0) > 0 ? ` · sms ${Number(it.sms_spend_tzs).toLocaleString()}` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{fontSize:12}}>{(it.customer_count || 0).toLocaleString()}</td>
                        <td style={{fontSize:11,color:'#64748b'}}>{it.days_active ?? '—'} d</td>
                        <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {it.note?.checked && <span style={{display:'inline-block',padding:'1px 6px',borderRadius:99,background:`${GREEN}18`,color:GREEN,fontSize:9,fontWeight:700,marginRight:4}}>✓</span>}
                          {it.note?.feedback || <span style={{color:'#cbd5e1'}}>—</span>}
                        </td>
                        <td style={{textAlign:'center',fontWeight:700,color: isOpen ? BRAND : '#cbd5e1'}}>{isOpen ? '▾' : '▸'}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={9} style={{padding:'14px 18px',background:'#f8fafc',borderTop:`2px solid ${BRAND}`,borderBottom:'1px solid #e2e8f0'}}>
                            <EngagementNoteEditor
                              note={it.note || {}}
                              variant="sender"
                              accent={BRAND}
                              saving={savingId === it.request_id}
                              onSave={(body) => saveNote(it.request_id, body)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={9} style={{padding:'30px 18px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No senders match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Page {safePage} of {totalPages} · {count.toLocaleString()} senders</span>
            <div style={{display:'flex',gap:4}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(1)} style={{opacity: page===1?.4:1}}>«</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(p=>p-1)} style={{opacity: page===1?.4:1}}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(p=>p+1)} style={{opacity: page>=totalPages?.4:1}}>Next ›</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(totalPages)} style={{opacity: page>=totalPages?.4:1}}>»</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Active Users sub-view ────────────────────────────────────────────────────
// Compose + send an SMS/email outreach message to selected users.
function MessageComposerModal({ recipients, onClose, onSent }) {
  const { showToast, onLogout } = React.useContext(AppContext);
  const [useSms, setUseSms]   = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [subject, setSubject] = useState('Message from SENDA');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const MAX_RECIPIENTS = 5000;
  const overCap = recipients.length > MAX_RECIPIENTS;
  const withPhone = recipients.filter(r => r.phone).length;
  const withEmail = recipients.filter(r => r.email).length;
  const smsSegments = Math.max(1, Math.ceil((body.length || 0) / 160));

  const submit = async () => {
    if (overCap) { showToast(`Select at most ${MAX_RECIPIENTS} recipients per send.`, 'error'); return; }
    const channels = [];
    if (useSms) channels.push('sms');
    if (useEmail) channels.push('email');
    if (!channels.length) { showToast('Pick at least one channel (SMS or Email)', 'error'); return; }
    if (!body.trim()) { showToast('Message body is required', 'error'); return; }
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/v1/engagement/message/', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: recipients.map(r => r.user_id),
          channels, message: body.trim(), subject: subject.trim(),
        }),
      }, onLogout);
      if (res && res.success) {
        showToast(res.message || `Sent to ${recipients.length} user(s)`, 'success');
        onSent && onSent(); onClose();
      } else {
        showToast(res?.error?.message || res?.error || 'Failed to send message', 'error');
      }
    } catch { showToast('Network error sending message', 'error'); }
    finally { setSending(false); }
  };

  const ChannelToggle = ({ on, set, label, sub, icon: Icon }) => (
    <button onClick={()=>set(v=>!v)} style={{
      flex:1, display:'flex', alignItems:'flex-start', gap:9, textAlign:'left',
      padding:'11px 13px', borderRadius:11, cursor:'pointer', fontFamily:'inherit',
      border: on ? `1.5px solid ${BRAND}` : '1.5px solid #e2e8f0',
      background: on ? `${BRAND}0c` : '#fff',
    }}>
      <div style={{width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,
        border: on ? 'none' : '1.5px solid #cbd5e1', background: on ? BRAND : '#fff',
        display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:800}}>
        {on ? '✓' : ''}
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color: on ? BRAND : '#475569',display:'flex',alignItems:'center',gap:5}}>
          <Icon size={13} strokeWidth={2.3}/> {label}
        </div>
        <div style={{fontSize:10.5,color:'#94a3b8',marginTop:1}}>{sub}</div>
      </div>
    </button>
  );

  return createPortal((
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(15,23,42,0.55)',
      backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px 16px',overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()} className="senda-fade-up"
        style={{width:'100%',maxWidth:480,margin:'auto',background:'#fff',borderRadius:18,
          boxShadow:'0 24px 70px rgba(15,23,42,.28)',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 48px)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:13,padding:'20px 22px',borderBottom:'1px solid #eef2f7',flexShrink:0}}>
          <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:`linear-gradient(135deg,${BRAND},${BRAND2})`,
            boxShadow:`0 6px 16px ${BRAND}40`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Send size={18} strokeWidth={2.3} color="#fff"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h3 style={{fontSize:16,fontWeight:800,color:'#0f172a',letterSpacing:'-.2px'}}>Message {recipients.length} user{recipients.length>1?'s':''}</h3>
            <p style={{fontSize:12,color:'#94a3b8',marginTop:1}}>{withPhone} with phone · {withEmail} with email</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{border:'none',background:'#f1f5f9',borderRadius:9,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#64748b',flexShrink:0}}>
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div style={{padding:'18px 22px',overflowY:'auto',flex:1}}>
          {overCap && (
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'9px 12px',marginBottom:14,fontSize:11,color:'#991b1b',display:'flex',gap:7}}>
              <AlertTriangle size={13} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
              <span>You selected {recipients.length.toLocaleString()} users, but at most {MAX_RECIPIENTS} can be messaged per send. Narrow your selection (e.g. use a filter), then send in batches.</span>
            </div>
          )}
          <label style={FIELD_LABEL}>Channels</label>
          <div style={{display:'flex',gap:10,marginBottom:16}}>
            <ChannelToggle on={useEmail} set={setUseEmail} label="Email" sub={`${withEmail} reachable`} icon={Mail}/>
            <ChannelToggle on={useSms} set={setUseSms} label="SMS" sub={`${withPhone} reachable`} icon={MessageSquare}/>
          </div>

          {useSms && (
            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'9px 12px',marginBottom:14,fontSize:11,color:'#92400e',display:'flex',gap:7}}>
              <AlertTriangle size={13} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>
              <span>SMS sends through the platform provider (sender “SENDA”) and uses platform credits — ~{smsSegments} segment{smsSegments>1?'s':''} per message.</span>
            </div>
          )}

          {useEmail && (
            <>
              <label style={FIELD_LABEL}>Email subject</label>
              <input className="senda-input" value={subject} onChange={e=>setSubject(e.target.value)} style={{height:42,fontSize:13.5,borderRadius:10,marginBottom:14}}/>
            </>
          )}

          <label style={FIELD_LABEL}>Message</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} placeholder="Write your message…"
            className="senda-input" style={{height:'auto',fontSize:13.5,borderRadius:10,padding:'10px 14px',resize:'vertical',lineHeight:1.55}}/>
          <div style={{fontSize:10.5,color:'#94a3b8',marginTop:5}}>
            {body.length} chars{useSms ? ` · ~${smsSegments} SMS segment${smsSegments>1?'s':''}` : ''}
          </div>
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px',borderTop:'1px solid #eef2f7',flexShrink:0}}>
          <button className="senda-btn senda-btn-ghost senda-btn-sm" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="senda-btn senda-btn-primary senda-btn-sm" onClick={submit} disabled={sending || overCap}>
            {sending ? <><Spinner size={14} color="#fff"/> Sending…</> : <><Send size={14} strokeWidth={2.2}/> Send to {recipients.length.toLocaleString()}</>}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}

// Cell renderer: a user's sender-name status (approved names, requested, or none).
function SenderNameCell({ it }) {
  const approved = it.approved_sender_names || [];
  const pending  = it.pending_sender_names || [];
  if (it.sender_status === 'approved' && approved.length) {
    return (
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {approved.map((n, i) => (
          <span key={i} style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6,background:`${GREEN}18`,color:GREEN,fontFamily:'ui-monospace,Menlo,monospace'}}>{n}</span>
        ))}
      </div>
    );
  }
  if (it.sender_status === 'requested') {
    return (
      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:`${AMBER}18`,color:AMBER}}
        title={pending.length ? `Requested: ${pending.join(', ')}` : 'Requested, not approved'}>
        Requested{pending.length ? ` · ${pending[0]}` : ''}
      </span>
    );
  }
  return <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'#f1f5f9',color:'#94a3b8'}}>No sender</span>;
}

// Filter chips for sender-name status. value: '' | 'approved' | 'requested' | 'none'.
function SenderStatusChips({ value, onChange }) {
  const opts = [
    { id:'',          label:'All senders',     color: BRAND },
    { id:'approved',  label:'Has sender name', color: GREEN },
    { id:'requested', label:'Requested',       color: AMBER },
    { id:'none',      label:'No sender name',  color: '#64748b' },
  ];
  return (
    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
      {opts.map(o => {
        const on = value === o.id;
        return (
          <button key={o.id} className="senda-btn senda-btn-sm" onClick={()=>onChange(o.id)}
            style={{background: on ? o.color : '#f1f5f9', color: on ? '#fff' : '#64748b', border:'none'}}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ActiveUsersView() {
  const { onLogout } = React.useContext(AppContext);
  // Full dataset across pages; visible rows + count derived below.
  const [allItems, setAllItems] = useState([]);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [minPaid, setMinPaid] = useState(0);
  const [minSms, setMinSms]   = useState(0);
  const [senderStatus, setSenderStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [openId, setOpenId]   = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [showComposer, setShowComposer] = useState(false);
  const PER = 25;

  const toggleSel = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (minPaid > 0)   params.min_total_paid = String(minPaid);
    if (minSms > 0)    params.min_sms_count = String(minSms);
    if (senderStatus)  params.sender_status = senderStatus;
    fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/active-users/', params, onLogout)
      .then(all => setAllItems(all || []))
      .catch(e => setError(e?.message || 'Failed to load active users.'))
      .finally(() => setLoading(false));
  }, [onLogout, search, minPaid, minSms, senderStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, minPaid, minSms, senderStatus]);

  // Derived: all rows, then page slice. (No partner-toggle on Active Users yet,
  // but the structure is parallel to ApprovedSendersView in case we add one.)
  const totalFiltered = allItems.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / PER));
  const safePage      = Math.min(page, totalPages);
  const items         = React.useMemo(
    () => allItems.slice((safePage - 1) * PER, safePage * PER),
    [allItems, safePage]
  );
  const count = totalFiltered;

  const saveNote = (userId, body) => {
    setSavingId(userId);
    adminFetch(`/api/admin/v1/engagement/users/${userId}/note/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, onLogout)
      .then(res => {
        // Accept either { success, data } or a bare note object.
        const noteData = (res && res.success && res.data) ? res.data
                       : (res && (res.checked != null || res.feedback != null)) ? res
                       : null;
        if (noteData) {
          setAllItems(prev => prev.map(it => it.user_id === userId ? { ...it, note: noteData } : it));
        }
      })
      .finally(() => setSavingId(null));
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (minPaid > 0)   params.min_total_paid = String(minPaid);
      if (minSms > 0)    params.min_sms_count  = String(minSms);
      const all = await fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/active-users/', params, onLogout);
      if (all.length === 0) return;
      downloadEngagementCsv(
        `active-users-${new Date().toISOString().slice(0,10)}.csv`,
        ['Name','Phone','Email','Business','Sender Status','Sender Names','Location','Registered At','Days Since Registration','Last Login','Phone Verified','Total Paid (TZS)','Txn Count','SMS Total','Note · Checked','Note · Feedback','Note · Last Contacted','Note · Contacted By'],
        all.map(u => [
          u.name || '',
          u.phone || '',
          u.email || '',
          u.business || '',
          u.sender_status || '',
          (u.approved_sender_names && u.approved_sender_names.length ? u.approved_sender_names : (u.pending_sender_names || [])).join(' / '),
          u.location || '',
          u.registered_at || '',
          u.days_since_registration ?? '',
          u.last_login_at || '',
          u.phone_verified ? 'yes' : 'no',
          Number(u.total_paid_tzs || 0),
          u.txn_count || 0,
          u.sms_total || 0,
          u.note?.checked ? 'yes' : 'no',
          u.note?.feedback || '',
          u.note?.last_contacted_at || '',
          u.note?.contacted_by || '',
        ]),
      );
    } finally { setDownloading(false); }
  };

  return (
    <div>
      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search email, name, phone, business…"
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:280,height:34,fontSize:12}}/>
        <div style={{display:'flex',gap:4}}>
          <button className="senda-btn senda-btn-sm" onClick={()=>{ setMinPaid(0); setMinSms(0); }}
            style={{background: minPaid===0 && minSms===0 ? BRAND : '#f1f5f9', color: minPaid===0 && minSms===0 ? '#fff' : '#64748b', border:'none'}}>
            All
          </button>
          <button className="senda-btn senda-btn-sm" onClick={()=>{ setMinPaid(50000); setMinSms(0); }}
            style={{background: minPaid===50000 ? GREEN : '#f1f5f9', color: minPaid===50000 ? '#fff' : '#64748b', border:'none'}}>
            Big spenders (≥50K)
          </button>
          <button className="senda-btn senda-btn-sm" onClick={()=>{ setMinSms(1000); setMinPaid(0); }}
            style={{background: minSms===1000 ? VIOLET : '#f1f5f9', color: minSms===1000 ? '#fff' : '#64748b', border:'none'}}>
            Heavy SMS (≥1K)
          </button>
        </div>
        <SenderStatusChips value={senderStatus} onChange={setSenderStatus}/>
        {allItems.length > 0 && (
          <button onClick={()=>setSelected(prev => {
              const allSelected = allItems.every(it => prev.has(it.user_id));
              const n = new Set(prev);
              if (allSelected) allItems.forEach(it => n.delete(it.user_id));
              else allItems.forEach(it => n.add(it.user_id));
              return n;
            })}
            className="senda-btn senda-btn-sm senda-btn-ghost" style={{fontSize:12}}>
            {allItems.every(it => selected.has(it.user_id)) ? 'Deselect all' : `Select all ${allItems.length.toLocaleString()}`}
          </button>
        )}
        {selected.size > 0 && (
          <>
            <button onClick={()=>setShowComposer(true)} className="senda-btn senda-btn-sm"
              style={{background:BRAND,color:'#fff',border:'none'}}>
              <Send size={13} strokeWidth={2.4}/> Message {selected.size.toLocaleString()}
            </button>
            <button onClick={()=>setSelected(new Set())} className="senda-btn senda-btn-sm senda-btn-ghost"
              style={{fontSize:12,color:'#94a3b8'}}>Clear</button>
          </>
        )}
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{count.toLocaleString()} users</span>
        <button onClick={handleDownload} disabled={downloading || count === 0}
          style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',
            background: (downloading || count===0) ? '#f1f5f9' : GREEN,
            color: (downloading || count===0) ? '#94a3b8' : '#fff',
            border:'none',borderRadius:7,fontSize:11,fontWeight:700,
            cursor: (downloading || count===0) ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          {downloading ? 'Preparing…' : `Download CSV (${count})`}
        </button>
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:1020}}>
              <thead>
                <tr>
                  <th style={{width:30}}>
                    <input type="checkbox"
                      title="Select all users (every page)"
                      checked={allItems.length > 0 && allItems.every(it => selected.has(it.user_id))}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && !(allItems.length > 0 && allItems.every(it => selected.has(it.user_id))); }}
                      onChange={e => setSelected(prev => {
                        const n = new Set(prev);
                        if (e.target.checked) allItems.forEach(it => n.add(it.user_id));
                        else allItems.forEach(it => n.delete(it.user_id));
                        return n;
                      })}
                      style={{accentColor:BRAND,cursor:'pointer'}}/>
                  </th>
                  <th>User</th><th>Business</th><th>Sender name</th><th>Phone</th>
                  <th>Total Paid (TZS)</th><th>Txns</th><th>SMS</th><th>Days</th><th>Note</th><th style={{width:30}}/>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const isOpen = openId === it.user_id;
                  return (
                    <React.Fragment key={it.user_id || i}>
                      <tr onClick={() => setOpenId(isOpen ? null : it.user_id)}
                        style={{cursor:'pointer', background: isOpen ? '#f0fdf4' : (selected.has(it.user_id) ? '#eff6ff' : undefined)}}>
                        <td onClick={e=>e.stopPropagation()} style={{textAlign:'center'}}>
                          <input type="checkbox" checked={selected.has(it.user_id)} onChange={()=>toggleSel(it.user_id)} style={{accentColor:BRAND,cursor:'pointer'}}/>
                        </td>
                        <td>
                          <div style={{fontWeight:600,fontSize:12,color:'#0f172a'}}>{it.name || '—'}</div>
                          <div style={{fontSize:10,color:'#94a3b8',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.email || '—'}</div>
                        </td>
                        <td style={{fontSize:12,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.business || '—'}</td>
                        <td><SenderNameCell it={it}/></td>
                        <td style={{fontSize:11,fontFamily:'ui-monospace,Menlo,monospace',color:'#475569',whiteSpace:'nowrap'}}>{it.phone || '—'}</td>
                        <td style={{fontSize:12,fontWeight:700,color:GREEN}}>{Number(it.total_paid_tzs || 0).toLocaleString()}</td>
                        <td style={{fontSize:12}}>{it.txn_count || 0}</td>
                        <td style={{fontSize:12,fontWeight:600,color:VIOLET}}>{(it.sms_total || 0).toLocaleString()}</td>
                        <td style={{fontSize:11,color:'#64748b'}}>{it.days_since_registration ?? '—'}</td>
                        <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {it.note?.checked && <span style={{display:'inline-block',padding:'1px 6px',borderRadius:99,background:`${GREEN}18`,color:GREEN,fontSize:9,fontWeight:700,marginRight:4}}>✓</span>}
                          {it.note?.feedback || <span style={{color:'#cbd5e1'}}>—</span>}
                        </td>
                        <td style={{textAlign:'center',fontWeight:700,color: isOpen ? GREEN : '#cbd5e1'}}>{isOpen ? '▾' : '▸'}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={11} style={{padding:'14px 18px',background:'#f8fafc',borderTop:`2px solid ${GREEN}`,borderBottom:'1px solid #e2e8f0'}}>
                            <EngagementNoteEditor
                              note={it.note || {}}
                              variant="user"
                              accent={GREEN}
                              saving={savingId === it.user_id}
                              onSave={(body) => saveNote(it.user_id, body)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={11} style={{padding:'30px 18px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No active users match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Page {safePage} of {totalPages} · {count.toLocaleString()} users · sorted by spend</span>
            <div style={{display:'flex',gap:4}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(1)} style={{opacity: page===1?.4:1}}>«</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(p=>p-1)} style={{opacity: page===1?.4:1}}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(p=>p+1)} style={{opacity: page>=totalPages?.4:1}}>Next ›</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(totalPages)} style={{opacity: page>=totalPages?.4:1}}>»</button>
            </div>
          </div>
        </div>
      )}

      {showComposer && (
        <MessageComposerModal
          recipients={allItems.filter(u => selected.has(u.user_id))}
          onClose={()=>setShowComposer(false)}
          onSent={()=>setSelected(new Set())}
        />
      )}
    </div>
  );
}

// ── Inactive Users sub-view ──────────────────────────────────────────────────
function InactiveUsersView() {
  const { onLogout } = React.useContext(AppContext);
  // Full dataset across pages; visible rows + count derived below.
  const [allItems, setAllItems] = useState([]);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [neverLoggedIn, setNeverLoggedIn] = useState(false);
  const [days, setDays] = useState(7);
  const [senderStatus, setSenderStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [openId, setOpenId]   = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [showComposer, setShowComposer] = useState(false);
  const PER = 25;

  const toggleSel = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const params = { days: String(days) };
    if (search.trim()) params.search = search.trim();
    if (neverLoggedIn) params.never_logged_in = 'true';
    if (senderStatus)  params.sender_status = senderStatus;
    fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/inactive-users/', params, onLogout)
      .then(all => setAllItems(all || []))
      .catch(e => setError(e?.message || 'Failed to load inactive users.'))
      .finally(() => setLoading(false));
  }, [onLogout, search, neverLoggedIn, days, senderStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, neverLoggedIn, days, senderStatus]);

  const totalFiltered = allItems.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / PER));
  const safePage      = Math.min(page, totalPages);
  const items         = React.useMemo(
    () => allItems.slice((safePage - 1) * PER, safePage * PER),
    [allItems, safePage]
  );
  const count = totalFiltered;

  const saveNote = (userId, body) => {
    setSavingId(userId);
    adminFetch(`/api/admin/v1/engagement/users/${userId}/note/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, onLogout)
      .then(res => {
        // Accept either { success, data } or a bare note object.
        const noteData = (res && res.success && res.data) ? res.data
                       : (res && (res.checked != null || res.feedback != null)) ? res
                       : null;
        if (noteData) {
          setAllItems(prev => prev.map(it => it.user_id === userId ? { ...it, note: noteData } : it));
        }
      })
      .finally(() => setSavingId(null));
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = { days: String(days) };
      if (search.trim()) params.search = search.trim();
      if (neverLoggedIn) params.never_logged_in = 'true';
      if (senderStatus)  params.sender_status = senderStatus;
      const all = await fetchAllEngagementPages(adminFetch, '/api/admin/v1/engagement/inactive-users/', params, onLogout);
      if (all.length === 0) return;
      downloadEngagementCsv(
        `inactive-users-${new Date().toISOString().slice(0,10)}.csv`,
        ['Name','Phone','Email','Business','Sender Status','Sender Names','Location','Registered At','Days Since Registration','Last Login','Phone Verified','Note · Checked','Note · Feedback','Note · Last Contacted','Note · Contacted By'],
        all.map(u => [
          u.name || '',
          u.phone || '',
          u.email || '',
          u.business || '',
          u.sender_status || '',
          (u.approved_sender_names && u.approved_sender_names.length ? u.approved_sender_names : (u.pending_sender_names || [])).join(' / '),
          u.location || '',
          u.registered_at || '',
          u.days_since_registration ?? '',
          u.last_login_at || 'never',
          u.phone_verified ? 'yes' : 'no',
          u.note?.checked ? 'yes' : 'no',
          u.note?.feedback || '',
          u.note?.last_contacted_at || '',
          u.note?.contacted_by || '',
        ]),
      );
    } finally { setDownloading(false); }
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="senda-input" placeholder="Search email, name, phone, business…"
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:280,height:34,fontSize:12}}/>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'#475569',fontWeight:600}}>Min days inactive:</span>
          <select className="senda-input" value={days} onChange={e=>setDays(Number(e.target.value))}
            style={{height:34,fontSize:12}}>
            {[1, 7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} d</option>)}
          </select>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#475569'}}>
          <input type="checkbox" checked={neverLoggedIn} onChange={e=>setNeverLoggedIn(e.target.checked)}
            style={{accentColor:RED}}/>
          Never logged in only
        </label>
        <SenderStatusChips value={senderStatus} onChange={setSenderStatus}/>
        {allItems.length > 0 && (
          <button onClick={()=>setSelected(prev => {
              const allSelected = allItems.every(it => prev.has(it.user_id));
              const n = new Set(prev);
              if (allSelected) allItems.forEach(it => n.delete(it.user_id));
              else allItems.forEach(it => n.add(it.user_id));
              return n;
            })}
            className="senda-btn senda-btn-sm senda-btn-ghost" style={{fontSize:12}}>
            {allItems.every(it => selected.has(it.user_id)) ? 'Deselect all' : `Select all ${allItems.length.toLocaleString()}`}
          </button>
        )}
        {selected.size > 0 && (
          <>
            <button onClick={()=>setShowComposer(true)} className="senda-btn senda-btn-sm"
              style={{background:BRAND,color:'#fff',border:'none'}}>
              <Send size={13} strokeWidth={2.4}/> Message {selected.size.toLocaleString()}
            </button>
            <button onClick={()=>setSelected(new Set())} className="senda-btn senda-btn-sm senda-btn-ghost"
              style={{fontSize:12,color:'#94a3b8'}}>Clear</button>
          </>
        )}
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{count.toLocaleString()} users</span>
        <button onClick={handleDownload} disabled={downloading || count === 0}
          style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',
            background: (downloading || count===0) ? '#f1f5f9' : RED,
            color: (downloading || count===0) ? '#94a3b8' : '#fff',
            border:'none',borderRadius:7,fontSize:11,fontWeight:700,
            cursor: (downloading || count===0) ? 'not-allowed' : 'pointer'}}>
          <Download size={13} strokeWidth={2.4}/>
          {downloading ? 'Preparing…' : `Download CSV (${count})`}
        </button>
        <button className="senda-btn senda-btn-sm senda-btn-ghost" onClick={fetchData} style={{fontSize:12}}>↻ Refresh</button>
      </div>

      {loading ? <LoadingState/> : error ? <ErrorState message={error} onRetry={fetchData}/> : (
        <div className="senda-card senda-table-wrap" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="senda-table" style={{minWidth:940}}>
              <thead>
                <tr>
                  <th style={{width:30}}>
                    <input type="checkbox"
                      title="Select all users (every page)"
                      checked={allItems.length > 0 && allItems.every(it => selected.has(it.user_id))}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && !(allItems.length > 0 && allItems.every(it => selected.has(it.user_id))); }}
                      onChange={e => setSelected(prev => {
                        const n = new Set(prev);
                        if (e.target.checked) allItems.forEach(it => n.add(it.user_id));
                        else allItems.forEach(it => n.delete(it.user_id));
                        return n;
                      })}
                      style={{accentColor:BRAND,cursor:'pointer'}}/>
                  </th>
                  <th>User</th><th>Business</th><th>Sender name</th><th>Phone</th>
                  <th>Days Idle</th><th>Last Login</th><th>Note</th><th style={{width:30}}/>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const isOpen = openId === it.user_id;
                  return (
                    <React.Fragment key={it.user_id || i}>
                      <tr onClick={() => setOpenId(isOpen ? null : it.user_id)}
                        style={{cursor:'pointer', background: isOpen ? '#fef2f2' : (selected.has(it.user_id) ? '#eff6ff' : undefined)}}>
                        <td onClick={e=>e.stopPropagation()} style={{textAlign:'center'}}>
                          <input type="checkbox" checked={selected.has(it.user_id)} onChange={()=>toggleSel(it.user_id)} style={{accentColor:BRAND,cursor:'pointer'}}/>
                        </td>
                        <td>
                          <div style={{fontWeight:600,fontSize:12,color:'#0f172a'}}>{it.name || '—'}</div>
                          <div style={{fontSize:10,color:'#94a3b8',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.email || '—'}</div>
                        </td>
                        <td style={{fontSize:12,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.business || '—'}</td>
                        <td><SenderNameCell it={it}/></td>
                        <td style={{fontSize:11,fontFamily:'ui-monospace,Menlo,monospace',color:'#475569',whiteSpace:'nowrap'}}>{it.phone || '—'}</td>
                        <td style={{fontSize:12,fontWeight:700,color:RED}}>{it.days_since_registration ?? '—'} d</td>
                        <td style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>
                          {it.last_login_at ? new Date(it.last_login_at).toLocaleDateString() : <span style={{color:RED,fontWeight:700}}>Never</span>}
                        </td>
                        <td style={{fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {it.note?.checked && <span style={{display:'inline-block',padding:'1px 6px',borderRadius:99,background:`${GREEN}18`,color:GREEN,fontSize:9,fontWeight:700,marginRight:4}}>✓</span>}
                          {it.note?.feedback || <span style={{color:'#cbd5e1'}}>—</span>}
                        </td>
                        <td style={{textAlign:'center',fontWeight:700,color: isOpen ? RED : '#cbd5e1'}}>{isOpen ? '▾' : '▸'}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={9} style={{padding:'14px 18px',background:'#f8fafc',borderTop:`2px solid ${RED}`,borderBottom:'1px solid #e2e8f0'}}>
                            <EngagementNoteEditor
                              note={it.note || {}}
                              variant="user"
                              accent={RED}
                              saving={savingId === it.user_id}
                              onSave={(body) => saveNote(it.user_id, body)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={9} style={{padding:'30px 18px',textAlign:'center',color:'#94a3b8',fontSize:13}}>No inactive users match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Page {safePage} of {totalPages} · {count.toLocaleString()} users · ≥ {days} d inactive{neverLoggedIn ? ' · never logged in' : ''}</span>
            <div style={{display:'flex',gap:4}}>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(1)} style={{opacity: page===1?.4:1}}>«</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page === 1} onClick={()=>setPage(p=>p-1)} style={{opacity: page===1?.4:1}}>‹ Prev</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(p=>p+1)} style={{opacity: page>=totalPages?.4:1}}>Next ›</button>
              <button className="senda-btn senda-btn-sm senda-btn-ghost" disabled={page >= totalPages} onClick={()=>setPage(totalPages)} style={{opacity: page>=totalPages?.4:1}}>»</button>
            </div>
          </div>
        </div>
      )}

      {showComposer && (
        <MessageComposerModal
          recipients={allItems.filter(u => selected.has(u.user_id))}
          onClose={()=>setShowComposer(false)}
          onSent={()=>setSelected(new Set())}
        />
      )}
    </div>
  );
}

function EngagementTab() {
  const [view, setView] = useState('approved-senders');
  const views = [
    { id:'approved-senders', label:'Approved Senders', color: BRAND, Icon: Tag },
    { id:'active-users',     label:'Active Users',     color: GREEN, Icon: UserCheck },
    { id:'inactive-users',   label:'Inactive Users',   color: RED,   Icon: UserX },
  ];
  const active = views.find(v => v.id === view);

  return (
    <div className="senda-fade-in">
      <div style={{marginBottom:14}}>
        <h3 style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Engagement &amp; Outreach</h3>
        <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>
          Payment intelligence on approved senders, top-spender retention, and dormant-account follow-up.
          Saves admin notes via <code style={{fontSize:10,color:'#475569'}}>/api/admin/v1/engagement/</code>.
        </p>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {views.map(v => {
          const isActive = view === v.id;
          return (
            <button key={v.id} onClick={()=>setView(v.id)}
              style={{
                display:'inline-flex',alignItems:'center',gap:6,
                height:34,padding:'0 14px',borderRadius:7,border:'none',cursor:'pointer',
                fontSize:12,fontWeight:600,
                background: isActive ? v.color : '#f1f5f9',
                color:      isActive ? '#fff'   : '#475569',
                transition:'background .12s',
              }}>
              <v.Icon size={14} strokeWidth={2.2}/>
              {v.label}
            </button>
          );
        })}
      </div>

      {view === 'approved-senders' && <ApprovedSendersView/>}
      {view === 'active-users'     && <ActiveUsersView/>}
      {view === 'inactive-users'   && <InactiveUsersView/>}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function WhatsAppSend({ partners }) {
  const { onLogout, showToast } = React.useContext(AppContext);
  const [scope, setScope]         = useState('default');
  const [mode, setMode]           = useState('single');
  const [recipients, setRecipients] = useState('');
  const [templates, setTemplates] = useState([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplIdx, setTplIdx]       = useState('');
  const [variables, setVariables] = useState([]);
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null);

  const loadTemplates = React.useCallback((sc) => {
    setTplLoading(true); setTemplates([]); setTplIdx(''); setVariables([]);
    adminFetch(`/whatsapp/templates?scope=${encodeURIComponent(sc)}`, {}, onLogout)
      .then(res => {
        if (res.success) setTemplates(res.data?.templates || []);
        else showToast && showToast(res.error?.message || 'Failed to load templates', 'error');
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setTplLoading(false));
  }, [onLogout, showToast]);

  useEffect(() => { loadTemplates(scope); }, [scope, loadTemplates]);

  const tpl = tplIdx !== '' ? templates[Number(tplIdx)] : null;
  const onPickTpl = (idx) => {
    setTplIdx(idx);
    const t = idx !== '' ? templates[Number(idx)] : null;
    setVariables(t ? Array.from({ length: t.variable_count || 0 }, () => '') : []);
  };

  const send = () => {
    if (!tpl) { showToast && showToast('Pick a template', 'error'); return; }
    const recips = recipients.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if (mode === 'single' && recips.length === 0) { showToast && showToast('Add at least one recipient', 'error'); return; }
    setSending(true); setResult(null);
    const body = {
      scope, mode,
      template_name: tpl.name, language: tpl.language || 'en',
      variables,
      recipients: recips,
    };
    adminFetch('/whatsapp/send', { method: 'POST', body: JSON.stringify(body) }, onLogout)
      .then(res => {
        if (res.success) { setResult(res.data); showToast && showToast(res.message || 'Sent', 'success'); }
        else showToast && showToast(res.error?.message || 'Send failed', 'error');
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setSending(false));
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' };
  const isDefault = scope === 'default';

  return (
    <div className="senda-card" style={{ padding: 22, maxWidth: 760 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Send using</label>
          <select className="senda-input" style={{ width: '100%' }} value={scope} onChange={e => { setScope(e.target.value); if (e.target.value === 'default') setMode('single'); }}>
            <option value="default">Platform Default (our number)</option>
            {partners.map(p => (
              <option key={p.partner_id} value={p.partner_id}>
                {(p.name || p.owner_email)}{p.credential?.configured ? '' : ' — no creds'}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['single', 'broadcast'].map(m => (
              <button key={m} onClick={() => setMode(m)} disabled={m === 'broadcast' && isDefault}
                style={{ flex: 1, height: 38, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: (m === 'broadcast' && isDefault) ? 'not-allowed' : 'pointer',
                  border: mode === m ? `1px solid ${BRAND}` : '1px solid #e2e8f0',
                  background: mode === m ? `${BRAND}10` : '#fff', color: mode === m ? BRAND : '#64748b', opacity: (m === 'broadcast' && isDefault) ? .5 : 1 }}>
                {m === 'single' ? 'Single / test' : "Partner's clients"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Approved template {tplLoading ? '(loading…)' : `(${templates.length})`}</label>
        <select className="senda-input" style={{ width: '100%' }} value={tplIdx} onChange={e => onPickTpl(e.target.value)}>
          <option value="">Select a template…</option>
          {templates.map((t, i) => <option key={`${t.name}-${t.language}-${i}`} value={i}>{t.name} · {t.language}{t.category ? ` · ${t.category}` : ''}</option>)}
        </select>
        {tpl?.body_text && <div style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '8px 12px', marginTop: 8, whiteSpace: 'pre-wrap' }}>{tpl.body_text}</div>}
      </div>

      {variables.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Template variables</label>
          {variables.map((v, i) => (
            <input key={i} className="senda-input" style={{ width: '100%', marginBottom: 8 }} placeholder={`Value for {{${i + 1}}}`}
              value={v} onChange={e => setVariables(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
          ))}
        </div>
      )}

      {mode === 'single' ? (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Recipients (E.164, comma or newline separated)</label>
          <textarea className="senda-input" style={{ width: '100%', minHeight: 70, fontFamily: 'monospace', fontSize: 12 }}
            placeholder={'+255700000001\n+255700000002'} value={recipients} onChange={e => setRecipients(e.target.value)} />
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          This sends the template to this partner's active client contacts. Admin sends are capped — for full broadcasts use the app's Campaigns.
        </div>
      )}

      <button onClick={send} disabled={sending || !tpl}
        style={{ height: 40, padding: '0 22px', border: 'none', borderRadius: 9, background: BRAND, color: '#fff', fontWeight: 700, fontSize: 13, cursor: (sending || !tpl) ? 'default' : 'pointer', opacity: (sending || !tpl) ? .6 : 1 }}>
        {sending ? 'Sending…' : 'Send template'}
      </button>

      {result && (
        <div style={{ marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Sent {result.sent}/{result.attempted} · Failed {result.failed}
            {result.capped ? ` · audience ${result.total_audience}, capped at ${result.cap}` : ''}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {(result.results || []).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>
                <code style={{ color: '#475569' }}>{r.to}</code>
                <span style={{ color: r.success ? GREEN : RED, fontWeight: 700 }}>{r.success ? 'sent' : (r.error || 'failed')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppTab() {
  const { onLogout, showToast } = React.useContext(AppContext);
  const [sub, setSub]         = useState('credentials');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // partner_id currently being edited

  const load = React.useCallback(() => {
    setLoading(true);
    adminFetch('/whatsapp-credentials', {}, onLogout)
      .then(res => {
        if (res.success) setData(res.data);
        else showToast && showToast(res.error?.message || 'Failed to load WhatsApp credentials', 'error');
      })
      .catch(e => showToast && showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [onLogout, showToast]);
  useEffect(() => { load(); }, [load]);

  const partners = (data?.partners) || [];

  const statusPill = (c) => {
    if (!c?.configured) return { t: 'Not set', bg: '#f1f5f9', fg: '#94a3b8' };
    if (!c?.is_active)  return { t: 'Disabled', bg: `${RED}12`, fg: RED };
    if (c?.verified)    return { t: 'Verified', bg: `${GREEN}18`, fg: GREEN };
    return { t: 'Unverified', bg: `${AMBER}18`, fg: AMBER };
  };

  return (
    <div className="senda-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>WhatsApp</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Save the Meta WhatsApp credentials used to send messages — the platform default for normal customers,
          and each partner's own number for that partner and all of their clients — and send approved templates.
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {[{ id: 'credentials', label: 'Credentials' }, { id: 'send', label: 'Send Message' }].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{ height: 36, padding: '0 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: sub === t.id ? `1px solid ${BRAND}` : '1px solid #e2e8f0',
              background: sub === t.id ? `${BRAND}10` : '#fff', color: sub === t.id ? BRAND : '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
      ) : sub === 'send' ? (
        <WhatsAppSend partners={partners} />
      ) : (
        <>
          {/* Platform default */}
          <DefaultWhatsAppCredentials />

          {/* Partners */}
          <div className="senda-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Partner Credentials <span style={{ color: '#94a3b8', fontWeight: 600 }}>· {partners.length}</span>
            </div>
            {partners.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No partners found.</div>
            )}
            {partners.map(p => {
              const pill = statusPill(p.credential);
              const isEditing = editing === p.partner_id;
              return (
                <div key={p.partner_id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{p.name || p.owner_email}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.owner_email} · {p.customers_count} client{p.customers_count !== 1 ? 's' : ''}</div>
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: pill.bg, color: pill.fg }}>{pill.t}</span>
                    <button onClick={() => setEditing(isEditing ? null : p.partner_id)}
                      style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: BRAND, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                  </div>
                  {isEditing && (
                    <div style={{ background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
                      <PartnerWhatsAppCredentials partner={{ id: p.partner_id, name: p.name, owner: { email: p.owner_email } }} />
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: '10px 18px' }}>
              <button onClick={load} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>↻ Refresh</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
    engagement:   <EngagementTab/>,
    broadcast:    <BroadcastTab/>,
    users:        <UsersTab/>,
    transactions: <TransactionsTab/>,
    senderids:    <SenderIdsTab/>,
    partners:     <PartnersTab/>,
    partnersenders: <PartnerSendersTab/>,
    approvedsenders: <ApprovedSendersTab/>,
    idleusers:    <RegisteredIdleTab/>,
    whatsapp:     <WhatsAppTab/>,
    loginactivity:<LoginActivityTab/>,
    packages:     <PackagesTab/>,
    notifications:<PushNotificationsTab/>,
    systemsms:    <SystemSmsLogTab/>,
    settings:     <SettingsTab/>,
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

  // Plain gray field styling, focus lifts to white + blue ring
  const fieldStyle = {
    width:'100%', height:46, borderRadius:6, border:'1px solid transparent',
    background:'#e9ebee', color:'#1e293b', fontSize:14, fontFamily:'inherit',
    outline:'none', transition:'background .18s, border-color .18s, box-shadow .18s',
  };
  const focusIn  = e => { e.target.style.background = '#fff'; e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}22`; };
  const focusOut = e => { e.target.style.background = '#e9ebee'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; };
  const labelStyle = { display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:7, letterSpacing:'.1em', textTransform:'uppercase' };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(135deg, #3b82f6 0%, ${BRAND} 55%, ${BRAND2} 100%)`,
      padding:'24px 16px', fontFamily:'inherit',
    }}>
      <div className="senda-fade-up" style={{position:'relative', width:'100%', maxWidth:420}}>
        {/* Decorative blue accent bar peeking behind the card */}
        <div style={{position:'absolute', right:-10, top:24, bottom:24, width:16, borderRadius:8,
          background:`linear-gradient(180deg,${BRAND},${BRAND2})`, zIndex:0}}/>

        {/* Card */}
        <div style={{
          position:'relative', zIndex:1, background:'#fff', borderRadius:8,
          padding: isMobile ? '32px 24px' : '40px 38px',
          boxShadow:'0 20px 50px rgba(0,0,0,.18)',
        }}>
          <h2 style={{fontSize:22, fontWeight:800, color:BRAND, letterSpacing:'.04em', margin:0, marginBottom:28, textTransform:'uppercase'}}>
            Account Login
          </h2>

          {/* Error */}
          {error && (
            <div className="senda-fade-in" style={{
              background:'#fee2e2', border:'1px solid #fecaca', borderRadius:6,
              padding:'10px 13px', marginBottom:18, display:'flex', alignItems:'center', gap:8,
            }}>
              <AlertTriangle size={15} strokeWidth={2} color='#dc2626' style={{flexShrink:0}}/>
              <span style={{fontSize:13, color:'#b91c1c', fontWeight:500}}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{marginBottom:18}}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email} onChange={e=>{setEmail(e.target.value); setError('');}} required
                placeholder="admin@senda.co.tz" autoComplete="username"
                style={{...fieldStyle, padding:'0 14px'}}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>

            {/* Password */}
            <div style={{marginBottom:16}}>
              <label style={labelStyle}>Password</label>
              <div style={{position:'relative'}}>
                <input
                  type={showPass?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value); setError('');}} required
                  placeholder="••••••••" autoComplete="current-password"
                  style={{...fieldStyle, padding:'0 42px 0 14px'}}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?'Hide password':'Show password'} style={{
                  position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                  padding:6, display:'flex', alignItems:'center', borderRadius:6,
                }}>
                  {showPass ? <EyeOff size={16} strokeWidth={2}/> : <Eye size={16} strokeWidth={2}/>}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22}}>
              <label style={{display:'flex', alignItems:'center', gap:7, cursor:'pointer'}}>
                <input type="checkbox" style={{accentColor:BRAND, width:14, height:14, cursor:'pointer'}}/>
                <span style={{fontSize:13, color:'#64748b'}}>Remember Me</span>
              </label>
              <a href="#" onClick={e=>e.preventDefault()} style={{fontSize:13, color:BRAND, textDecoration:'none', fontWeight:600}}
                onMouseEnter={e=>e.target.style.textDecoration='underline'}
                onMouseLeave={e=>e.target.style.textDecoration='none'}>
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" className="senda-btn senda-btn-primary" disabled={loading}
              style={{width:'100%', height:46, fontSize:14, fontWeight:700, borderRadius:6, letterSpacing:'.05em',
                background: loading ? '#3b82f6' : `linear-gradient(135deg,${BRAND},${BRAND2})`,
                boxShadow:`0 8px 20px ${BRAND}40`, textTransform:'uppercase',
                opacity: loading ? .85 : 1,
              }}>
              {loading ? (<><Spinner size={17} color="#fff"/> Logging in…</>) : 'Log In'}
            </button>
          </form>
        </div>
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
    document.title = 'SENDA';
    // Send the admin back to the public user-login page rather than the
    // hidden admin LoginPage. /admin is intentionally not advertised in the UI;
    // admins re-enter by appending ".admin" to their email on /login.
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
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
