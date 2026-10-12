import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  Columns3,
  Users,
  Plus,
  Search,
  ArrowUpRight,
  Phone,
  CalendarDays,
  X,
  LogOut,
  ChevronRight,
  RefreshCw,
  Check,
  Building2,
  SlidersHorizontal,
  Download,
  Bell,
  FileText,
  Trophy,
  XCircle,
  Clock,
  Settings,
  ShieldCheck,
  TrendingUp,
  Coins,
  MapPin,
  List,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { stages, choices, regions, label, date, money, payload } from './constants';
import './style.css';

// API manzili bitta manbadan olinadi. Oldin saqlangan LocalTunnel
// yoki boshqa URL'lar production konfiguratsiyasini almashtirmaydi.
export function getApiUrl() {
  const configured = (import.meta.env.VITE_API_URL || 'https://crm-api.uzautotrailer.uz/api')
    .trim()
    .replace(/\/+$/, '');
  return configured.endsWith('/api') ? configured : `${configured}/api`;
}

async function request(path, method = 'GET', data) {
  const apiBase = getApiUrl();
  let normalizedPath = path.startsWith('/') ? path : '/' + path;
  if (apiBase.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  }
  const url = apiBase + normalizedPath;
  const token = sessionStorage.getItem('uat_token');

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const r = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  const b = await r.json().catch(() => ({ message: 'Server bilan aloqa yo‘q' }));
  if (!r.ok) {
    if (r.status === 401 && !path.includes('/auth/login')) {
      sessionStorage.clear();
      window.dispatchEvent(new Event('uat-logout'));
    }
    throw Error(Array.isArray(b?.message) ? b.message.join(', ') : b?.message || 'So‘rov bajarilmadi');
  }
  return b;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('uat_user'));
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState('board');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fn = () => setUser(null);
    window.addEventListener('uat-logout', fn);
    return () => window.removeEventListener('uat-logout', fn);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [l, u] = await Promise.all([request('/leads'), request('/users')]);
      setLeads(Array.isArray(l) ? l : []);
      setUsers(Array.isArray(u) ? u : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    setProductError('');
    try {
      const p = await request('/products');
      setProducts(Array.isArray(p) ? p : []);
    } catch (e) {
      setProductError(e.message);
    }
  }

  useEffect(() => {
    if (user) {
      load();
      loadProducts();
      const t = setInterval(load, 60000);
      return () => clearInterval(t);
    }
  }, [user]);

  const leadList = Array.isArray(leads) ? leads : [];
  const userList = Array.isArray(users) ? users : [];

  const filtered = leadList.filter(
    (l) =>
      (!customerTypeFilter || l.customerType === customerTypeFilter) &&
      (!source || l.source === source) &&
      (!from || (l.createdAt && l.createdAt.slice(0, 10) >= from)) &&
      (!to || (l.createdAt && l.createdAt.slice(0, 10) <= to)) &&
      [l.fullName, l.phone, l.company, ...(Array.isArray(l.products) ? l.products.map((p) => p.name) : [])]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  async function save(data) {
    if (busy) return;
    setBusy(true);
    try {
      await request(modal.id ? '/leads/' + modal.id : '/leads', modal.id ? 'PUT' : 'POST', modal.id ? { ...data, version: modal.version } : data);
      setModal(null);
      await load();
    } catch (e) {
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function move(id, status) {
    const lead = leadList.find((l) => l.id === id);
    if (!lead || lead.status === status || busy) return;
    if (status === 'lost') {
      setModal({ ...lead, status });
      return;
    }
    setBusy(true);
    try {
      await request('/leads/' + id, 'PUT', { ...payload(lead), status, version: lead.version });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <Login onLogin={setUser} />;

  const won = filtered.filter((l) => l.status === 'won');
  const active = filtered.filter((l) => !['won', 'lost'].includes(l.status));
  const totalAmountWon = won.reduce((n, l) => n + (Number(l.amount) || 0), 0);

  return (
    <div className="page-container">
      <div className="window-frame">
        {/* SIDEBAR */}
        <aside className="sidebar">
          {/* Sidebar Brand Lockup */}
          <div className="sidebar-brand">
            <span className="sidebar-logo">
              U<span>↗</span>
            </span>
            <div className="sidebar-brand-name">
              UzAutoTrailer
              <small>CRM</small>
            </div>
          </div>

          {/* Department badge */}
          <div className="dept-pill">
            <span className="online-dot" />
            Sotuv bo‘limi
            <span className="tag">CRM</span>
          </div>

          <p className="nav-label">ISH MAYDONI</p>
          <nav className="sidebar-nav">
            <button className={page === 'board' ? 'active' : ''} onClick={() => setPage('board')}>
              <Columns3 size={18} />
              Leadlar
              <b className="count">{leadList.length}</b>
            </button>
            <button className={page === 'stats' ? 'active' : ''} onClick={() => setPage('stats')}>
              <LayoutDashboard size={18} />
              Statistika
            </button>
          </nav>

          {/* Sidebar Bottom */}
          <div className="sidebar-bottom">
            <button className="sidebar-util-btn" onClick={() => setPage('board')}>
              <ShieldCheck size={16} />
              Yaqqol mijozlar bazasi
            </button>
            <button className="sidebar-util-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={16} />
              Sozlamalar
            </button>

            {/* User Profile Row */}
            <div className="user-profile-bar">
              <span className="user-avatar-circle">{user.name?.[0] || 'A'}</span>
              <div className="user-info">
                <strong>{user.name}</strong>
                <small>{user.role === 'admin' ? 'Administrator' : 'Operator'}</small>
              </div>
              <button
                className="logout-icon-btn"
                title="Chiqish"
                onClick={() => {
                  sessionStorage.clear();
                  setUser(null);
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="main-viewport">
          {/* Top Window Navigation Header */}
          <header className="window-header">
            <div className="breadcrumb-trail">
              Ish maydoni <ChevronRight size={14} /> <span>{page === 'board' ? 'Leadlar' : 'Statistika'}</span>
            </div>
            <div className="header-actions">
              <button className="header-icon-btn" title="Qidiruv" onClick={() => document.getElementById('search-input')?.focus()}>
                <Search size={16} />
              </button>
              <button className="header-icon-btn" title="Bildirishnomalar" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={16} />
                <span className="badge-dot" />
              </button>
              <div className="system-status-indicator">
                <span className="status-blue-dot" />
                UzAutoTrailer CRM
              </div>
              <span className="header-avatar">{user.name?.[0] || 'A'}</span>
            </div>
          </header>

          {/* Body Content */}
          <section className="content-body">
            {/* Page Title & Main Action Row */}
            <div className="page-title-row">
              <div>
                <p className="page-eyebrow">MUHIM KO‘RSATKICHLAR</p>
                <h1>{page === 'board' ? 'Har bir lead nazoratda.' : 'Raqamlar orqali natija.'}</h1>
                <p className="desc">
                  {page === 'board'
                    ? 'Muvaffaqiyatli boshqaring, mijozlarni davom ettiring va sotuvga olib boring.'
                    : 'Jamoa natijalarini va mijozlar oqimini bir joyda kuzating.'}
                </p>
              </div>

              {page === 'board' ? (
                <button className="btn-primary" onClick={() => setModal({})}>
                  <Plus size={17} /> Yangi lead
                </button>
              ) : (
                <div className="date-range-badge">
                  <Calendar size={14} />
                  <span>01/08/2024 - 10/09/2024</span>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{error}</span>
                <button onClick={load} style={{ fontWeight: 700, textDecoration: 'underline' }}>Qayta urinish</button>
              </div>
            )}

            {/* 4 Metrics Cards */}
            <div className="metrics-row">
              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box blue">
                    <Users size={18} />
                  </div>
                  <span className="kpi-label">Jami leadlar</span>
                </div>
                <div className="kpi-value">{filtered.length}</div>
                <div className="kpi-footer">Tanlangan davr bo‘yicha</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box sky">
                    <TrendingUp size={18} />
                  </div>
                  <span className="kpi-label">Faol manfaatdorlar</span>
                </div>
                <div className="kpi-value">{active.length}</div>
                <div className="kpi-footer">
                  Javob qaytdi mijozlar <span className="kpi-growth">+ +4%</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box cyan">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="kpi-label">Muvaffaqiyatli sotuv</span>
                </div>
                <div className="kpi-value">{won.length}</div>
                <div className="kpi-footer">
                  {filtered.length ? Math.round((won.length / filtered.length) * 100) : 0}% umumiy konversiya{' '}
                  <span className="kpi-growth">+ +0%</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box amber">
                    <Coins size={18} />
                  </div>
                  <span className="kpi-label">Sotuv samarasi</span>
                </div>
                <div className="kpi-value">{totalAmountWon ? money(totalAmountWon) : '0'} UZS</div>
                <div className="kpi-footer">
                  UZS - umumiy kutilgan kasr <span className="kpi-growth">+ +0%</span>
                </div>
              </div>
            </div>

            {page === 'board' ? (
              <>
                {/* Filter Toolbar */}
                <div className="filter-toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      id="search-input"
                      placeholder="Ism, telefon yoki mahsulot bo‘yicha qidirish..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={customerTypeFilter}
                    onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  >
                    <option value="">Barcha segmentlar</option>
                    {choices.customerType.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="">Barcha manbalar</option>
                    {choices.source.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    className="date-input-field"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    title="Davr boshlanishi"
                  />
                  <span style={{ color: '#94a3b8' }}>—</span>
                  <input
                    type="date"
                    className="date-input-field"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    min={from}
                    title="Davr oxiri"
                  />

                  <button className="btn-icon-square" title="Yangilash" onClick={load}>
                    <RefreshCw size={15} className={loading ? 'spin' : ''} />
                  </button>
                </div>

                {/* Board Section Header */}
                <div className="board-header-row">
                  <div className="board-title-group">
                    <h2>
                      <Columns3 size={18} color="#0969da" />
                      Sotuv voronkasi
                    </h2>
                    <span className="lead-count">{filtered.length} ta lead</span>
                  </div>

                  <div className="view-mode-toggle">
                    <button
                      className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                      onClick={() => setViewMode('kanban')}
                    >
                      <Columns3 size={14} /> Kanban
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={14} /> Ro‘yxat
                    </button>
                    <button className="view-btn" title="Qo‘shimcha" onClick={() => setModal({})}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                {/* View Mode: Kanban or List */}
                {viewMode === 'kanban' ? (
                  <div className="kanban-board">
                    {stages.map(([status, title, color, bgLight, borderLight]) => {
                      const colLeads = filtered.filter((l) => l.status === status);
                      return (
                        <div
                          className="kanban-column"
                          key={status}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            move(e.dataTransfer.getData('text/plain'), status);
                          }}
                        >
                          <div className="column-header">
                            <span className="column-dot" style={{ background: color }} />
                            <span>{title}</span>
                            <span className="column-count-badge">{colLeads.length}</span>
                          </div>

                          <div className="column-cards-container">
                            {status === 'new' && (
                              <button
                                className="btn-col-add-quick"
                                onClick={() => setModal({ status: 'new' })}
                              >
                                <span>Yangi lead qo‘shish</span>
                                <Plus size={14} />
                              </button>
                            )}

                            {colLeads.map((l) => (
                              <article
                                key={l.id}
                                className="kanban-card"
                                draggable={!busy}
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}
                                onClick={() => setModal(l)}
                              >
                                <div className="card-header-line">
                                  <span className="card-title">{l.fullName}</span>
                                  <MoreHorizontal size={14} color="#94a3b8" />
                                </div>

                                <div className="card-company">
                                  {l.company || label('customerType', l.customerType)}
                                </div>

                                {Array.isArray(l.products) && l.products.length > 0 && (
                                  <div className="card-product-tag">
                                    {l.products[0].name}
                                    {l.products.length > 1 && ` (+${l.products.length - 1})`}
                                  </div>
                                )}

                                <div className="card-info-item">
                                  <MapPin size={12} color="#94a3b8" />
                                  <span>
                                    {l.region || 'Toshkent'}
                                    {l.city ? `, ${l.city}` : ''}
                                  </span>
                                </div>

                                <div className="card-info-item">
                                  <Phone size={12} color="#94a3b8" />
                                  <span>{l.phone}</span>
                                </div>

                                <div className="card-footer">
                                  <div className="card-operator">
                                    <span className="avatar-tiny">
                                      {userList.find((u) => u.id === l.operatorId)?.name?.[0] || 'A'}
                                    </span>
                                    <span>{userList.find((u) => u.id === l.operatorId)?.name || 'Admin'}</span>
                                  </div>
                                  <span className="card-amount">
                                    {l.amount ? `${money(l.amount)} UZS` : '+ UZS'}
                                  </span>
                                </div>
                              </article>
                            ))}

                            {colLeads.length === 0 && status !== 'new' && (
                              <div className="empty-col-card">
                                <div
                                  className="empty-col-icon-circle"
                                  style={{ background: bgLight, color: color }}
                                >
                                  {status === 'contacted' && <Clock size={20} />}
                                  {status === 'offer' && <FileText size={20} />}
                                  {status === 'negotiation' && <Users size={20} />}
                                  {status === 'won' && <Trophy size={20} />}
                                  {status === 'lost' && <XCircle size={20} />}
                                </div>
                                <h4>Bu bosqichda lead yo‘q</h4>
                                <p>Yangi lead qo‘shish</p>
                                <button
                                  className="btn-add-in-empty"
                                  onClick={() => setModal({ status })}
                                >
                                  + Lead qo‘shish
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST / TABLE VIEW */
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mijoz</th>
                          <th>Telefon</th>
                          <th>Hudud</th>
                          <th>Mahsulotlar</th>
                          <th>Mas’ul operator</th>
                          <th>Bosqich</th>
                          <th>Summa</th>
                          <th>Sana</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                              Leadlar topilmadi.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((l) => {
                            const stageObj = stages.find((s) => s[0] === l.status) || stages[0];
                            return (
                              <tr
                                key={l.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setModal(l)}
                              >
                                <td>
                                  <strong>{l.fullName}</strong>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>
                                    {l.company || label('customerType', l.customerType)}
                                  </div>
                                </td>
                                <td>{l.phone}</td>
                                <td>
                                  {l.region}
                                  {l.city ? `, ${l.city}` : ''}
                                </td>
                                <td>
                                  {Array.isArray(l.products) && l.products.length > 0
                                    ? l.products.map((p) => p.name).join(', ')
                                    : '—'}
                                </td>
                                <td>{userList.find((u) => u.id === l.operatorId)?.name || 'Admin'}</td>
                                <td>
                                  <span
                                    className="status-badge"
                                    style={{
                                      background: stageObj[3],
                                      color: stageObj[2],
                                      border: `1px solid ${stageObj[4]}`,
                                    }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageObj[2] }} />
                                    {stageObj[1]}
                                  </span>
                                </td>
                                <td>
                                  <strong>{money(l.amount)} UZS</strong>
                                </td>
                                <td style={{ fontSize: 11, color: '#64748b' }}>{date(l.createdAt)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* STATISTIKA PAGE (2x2 Grid matching mockup) */
              <Stats leads={filtered} users={userList} />
            )}
          </section>
        </main>
      </div>

      {/* MODALS */}
      {modal && (
        <LeadModal
          lead={modal}
          users={userList}
          products={products}
          productError={productError}
          retryProducts={loadProducts}
          onClose={() => !busy && setModal(null)}
          onSave={save}
          busy={busy}
          currentUser={user}
          leads={leadList}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} currentUser={user} />
      )}

      {notifOpen && (
        <NotificationsModal onClose={() => setNotifOpen(false)} leads={leadList} />
      )}
    </div>
  );
}

/* STATS COMPONENT (Matches the right-side dashboard in the mockup) */
function Stats({ leads, users }) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const total = safeLeads.length;

  // Grouping helper
  const countBy = (fn) => {
    const o = {};
    safeLeads.forEach((l) => {
      const vals = fn(l);
      (Array.isArray(vals) ? vals : [vals]).forEach((k) => {
        if (k) o[k] = (o[k] || 0) + 1;
      });
    });
    return o;
  };

  const sourcesCount = countBy((l) => label('source', l.source));
  const productsCount = countBy((l) => (Array.isArray(l.products) ? l.products.map((p) => p.name) : []));
  const regionsCount = countBy((l) => l.region);

  const mainSources = [
    ['Telefon qo‘ng‘irog‘i', '#0969da'],
    ['Veb-sayt', '#06b6d4'],
    ['Tavsiya', '#eab308'],
    ['Boshqa', '#ef4444'],
  ];

  const mainRegions = [
    ['Samarqand', '#0969da'],
    ['Toshkent shahri', '#2563eb'],
    ['Farg‘ona', '#06b6d4'],
    ['Buxoro', '#38bdf8'],
    ['Boshqa hududlar', '#94a3b8'],
  ];

  function downloadCsv() {
    const rows = [
      ['Operator', 'Jami leadlar', 'Sotuv', 'Konversiya %', 'Sotuv UZS'],
      ...safeUsers.map((u) => {
        const a = safeLeads.filter((l) => l.operatorId === u.id);
        const w = a.filter((l) => l.status === 'won');
        return [
          u.name,
          a.length,
          w.length,
          a.length ? (w.length / a.length * 100).toFixed(1) : 0,
          w.reduce((s, l) => s + (l.amount || 0), 0),
        ];
      }),
    ];
    const blob = new Blob(
      ['\ufeff' + rows.map((row) => row.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n')],
      { type: 'text/csv;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'operator-statistika.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <div className="stats-2x2-grid">
        {/* 1. Sotuv voronkasi (Horizontal bar chart) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>Sotuv voronkasi</h3>
            <p>Leadlarning joriy bosqichlari</p>
          </div>
          {stages.map(([statusKey, stageTitle]) => {
            const count = safeLeads.filter((l) => l.status === statusKey).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={statusKey} className="funnel-bar-item">
                <div className="funnel-bar-info">
                  <span>{stageTitle}</span>
                  <span className="pct">
                    {count} - {pct}%
                  </span>
                </div>
                <div className="bar-track-bg">
                  <div className="bar-fill" style={{ width: `${Math.max(count > 0 ? 8 : 0, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Leadlar manbalari (Donut chart with center text and legend) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>Leadlar manbalari</h3>
            <p>Mijozlar qayerdan kelmoqda?</p>
          </div>
          <div className="donut-chart-container">
            <div className="donut-svg-wrap">
              <svg viewBox="0 0 100 100" width="140" height="140">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0969da"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={total > 0 ? '0' : '238.76'}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="donut-center-label">
                <strong>{total}</strong>
                <small>Jami lead</small>
              </div>
            </div>

            <div className="donut-legend">
              {mainSources.map(([sourceName, bulletColor]) => {
                const count = sourcesCount[sourceName] || 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={sourceName} className="legend-item">
                    <div className="legend-left">
                      <span className="legend-bullet" style={{ background: bulletColor }} />
                      <span>{sourceName}</span>
                    </div>
                    <span>
                      {count} <small style={{ color: '#94a3b8' }}>({pct}%)</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Mahsulotga qiziqish */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>Mahsulotga qiziqish</h3>
            <p>Qaysi mahsulotlarga qiziqish yuqori?</p>
          </div>
          {Object.entries(productsCount).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Hali mahsulot tanlanmagan.</p>
          ) : (
            Object.entries(productsCount)
              .slice(0, 4)
              .map(([prodName, count]) => {
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={prodName} className="funnel-bar-item">
                    <div className="funnel-bar-info">
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                        {prodName}
                      </span>
                      <span className="pct">
                        {count} - {pct}%
                      </span>
                    </div>
                    <div className="bar-track-bg">
                      <div className="bar-fill" style={{ width: `${Math.max(count > 0 ? 8 : 0, pct)}%` }} />
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* 4. Hududlar kesimida (Uzbekistan map vector + legend) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>Hududlar kesimida</h3>
            <p>Leadlar qayer hududlardan?</p>
          </div>
          <div className="map-region-box">
            <div className="map-svg-wrap">
              {/* Stylized vector map of Uzbekistan with highlighted center */}
              <svg viewBox="0 0 200 120" width="160" height="100">
                {/* Uzbekistan outline background */}
                <path
                  d="M15,40 Q40,15 90,20 Q130,22 170,35 Q185,55 160,85 Q135,100 110,85 Q80,105 45,75 Q20,80 15,40 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {/* Highlighted Samarqand/Tashkent region in blue */}
                <path
                  d="M100,65 L115,55 L130,70 L115,82 Z"
                  fill="#0969da"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <circle cx="115" cy="68" r="3" fill="#ffffff" />
              </svg>
            </div>

            <div className="donut-legend">
              {mainRegions.map(([regName, bulletColor]) => {
                const count = regName === 'Boshqa hududlar' ? 0 : regionsCount[regName] || 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={regName} className="legend-item">
                    <div className="legend-left">
                      <span className="legend-bullet" style={{ background: bulletColor }} />
                      <span>{regName}</span>
                    </div>
                    <span>
                      {count} <small style={{ color: '#94a3b8' }}>({pct}%)</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Operator stats table with download button */}
      <div className="table-container" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Operatorlar natijasi</h3>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Jamoa a’zolarining ko‘rsatkichlari</p>
          </div>
          <button className="btn-secondary" onClick={downloadCsv}>
            <Download size={14} /> CSV yuklash
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Jami lead</th>
              <th>Faol</th>
              <th>Sotuv</th>
              <th>Konversiya</th>
              <th>Sotuv summasi</th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.map((u) => {
              const a = safeLeads.filter((l) => l.operatorId === u.id);
              const w = a.filter((l) => l.status === 'won');
              const conv = a.length ? (w.length / a.length * 100).toFixed(1) : 0;
              const sum = w.reduce((s, l) => s + (l.amount || 0), 0);
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{a.length}</td>
                  <td>{a.filter((l) => !['won', 'lost'].includes(l.status)).length}</td>
                  <td>{w.length}</td>
                  <td>{conv}%</td>
                  <td>
                    <strong>{money(sum)} UZS</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* LEAD MODAL */
function LeadModal({ lead, users, products, productError, retryProducts, onClose, onSave, busy, currentUser, leads }) {
  const [data, setData] = useState({
    fullName: '',
    company: '',
    industry: '',
    region: 'Toshkent shahri',
    city: '',
    customerType: 'legal',
    products: [],
    paymentType: 'undecided',
    offerSent: 'no',
    rejectionReason: '',
    rejectionOther: '',
    phone: '+998',
    source: 'phone',
    sourceOther: '',
    operatorId: currentUser.id,
    status: 'new',
    notes: '',
    followUpAt: null,
    amount: 0,
    ...payload(lead),
  });
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [productQuery, setProductQuery] = useState('');

  useEffect(() => {
    if (lead.id) {
      request('/leads/' + lead.id + '/events')
        .then((evs) => setEvents(Array.isArray(evs) ? evs : []))
        .catch((e) => setError(e.message));
    }
    const close = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [lead.id, busy]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const input = (k, title, props = {}) => (
    <label className="field-label">
      {title}
      <input
        value={data[k] ?? ''}
        onChange={(e) => set(k, props.type === 'number' ? Number(e.target.value) : e.target.value)}
        {...props}
      />
    </label>
  );
  const select = (k, title, opts = choices[k]) => (
    <label className="field-label">
      {title}
      <select value={data[k]} onChange={(e) => set(k, k === 'operatorId' ? +e.target.value : e.target.value)}>
        {opts.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );

  const safeLeads = Array.isArray(leads) ? leads : [];
  const duplicate = safeLeads.find((l) => l.id !== lead.id && l.phone === data.phone.replace(/[\s()-]/g, ''));
  const dt = data.followUpAt
    ? new Date(new Date(data.followUpAt).getTime() - new Date(data.followUpAt).getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    : '';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal-content" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#0969da', letterSpacing: 1.5, margin: 0 }}>
              {lead.id ? 'MIJOZ KARTASI' : 'YANGI MUROJAAT'}
            </p>
            <h2 style={{ margin: '3px 0 0' }}>{lead.id ? lead.fullName : 'Yangi lead qo‘shish'}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onSave(data);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <div className="modal-body">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0969da', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>01</span> Mijoz haqida ma’lumot
            </div>
            <div className="form-grid-2">
              {input('fullName', 'Ism va familiya *', { required: true, minLength: 2, maxLength: 120, autoFocus: true })}
              {input('phone', 'Telefon raqami *', { required: true, type: 'tel', placeholder: '+998901234567' })}
              {select('customerType', 'Mijoz turi *')}
              {input('company', 'Korxona nomi / MChJ', { maxLength: 160, placeholder: 'Masalan: Grand Logistics MChJ' })}
              {input('industry', 'Faoliyat tarmog‘i / soha *', { required: true, maxLength: 120, placeholder: 'Logistika, qurilish...' })}
              {select('region', 'Hudud *', regions.map((r) => [r, r]))}
              {input('city', 'Shahar / tuman *', { required: true, maxLength: 100 })}
              {select('operatorId', 'Mas’ul operator *', (Array.isArray(users) ? users : []).map((u) => [u.id, u.name]))}
            </div>

            {duplicate && (
              <p style={{ background: '#fef3c7', color: '#b45309', padding: '8px 12px', borderRadius: 6, fontSize: 11 }}>
                Bu raqam bazada mavjud: <strong>{duplicate.fullName}</strong>.
              </p>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: '#0969da', display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span>02</span> Mahsulotlar va taklif
            </div>
            <label className="field-label">
              Qiziqtirgan mahsulotlar *
              <input
                placeholder="Mahsulot qidirish..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </label>

            {productError && (
              <div style={{ color: '#b45309', fontSize: 11 }}>
                {productError} <button type="button" onClick={retryProducts} style={{ textDecoration: 'underline' }}>Qayta yuklash</button>
              </div>
            )}

            <div className="product-selector-grid">
              {[...(Array.isArray(products) ? products : []), ...(Array.isArray(data.products) ? data.products : []).filter((p) => !(Array.isArray(products) ? products : []).some((x) => x.id === p.id))]
                .filter((p) => p.name.toLowerCase().includes(productQuery.toLowerCase()))
                .map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={(Array.isArray(data.products) ? data.products : []).some((x) => x.id === p.id)}
                      onChange={(e) =>
                        set(
                          'products',
                          e.target.checked
                            ? [...data.products, p]
                            : data.products.filter((x) => x.id !== p.id)
                        )
                      }
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
            </div>

            <div className="form-grid-2">
              {select('paymentType', 'To‘lov turi *')}
              {select('offerSent', 'Tijoriy taklif *')}
              {input('amount', 'Taxminiy / sotuv summasi (UZS)', { type: 'number', min: 0, step: 'any' })}
              {select('status', 'Lead bosqichi', stages.map(([k, t]) => [k, t]))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#0969da', display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span>03</span> Murojaat va keyingi qadam
            </div>
            <div className="form-grid-2">
              {select('source', 'Murojaat manbasi *')}
              <label className="field-label">
                Qayta bog‘lanish sanasi
                <input
                  type="datetime-local"
                  value={dt}
                  onChange={(e) => set('followUpAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </label>
            </div>

            <label className="field-label">
              Operator izohi
              <textarea
                rows={2}
                value={data.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Mijoz ehtiyoji va kelishuvlar..."
              />
            </label>

            {lead.id && events.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>O‘zgarishlar tarixi</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {events.map((ev) => (
                    <div key={ev.id} style={{ fontSize: 11, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <strong>{ev.actor}</strong>: {ev.description}
                      </span>
                      <span style={{ color: '#94a3b8' }}>{date(ev.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
              Bekor qilish
            </button>
            <button className="btn-primary" disabled={busy || !(Array.isArray(data.products) ? data.products : []).length}>
              {busy ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* SETTINGS MODAL */
function SettingsModal({ onClose, currentUser }) {

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>Tizim sozlamalari</h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <ShieldCheck size={28} color="#0969da" />
            <div>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>UzAutoTrailer CRM v2.0</strong>
              <div style={{ fontSize: 11, color: '#64748b' }}>PostgreSQL Baza & NestJS API integratsiyasi</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Foydalanuvchi ma’lumotlari:</div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Ism: <strong>{currentUser?.name}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Lavozim: <strong>{currentUser?.role === 'admin' ? 'Administrator' : 'Operator'}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              Backend: <span>{getApiUrl()}</span>
            </div>
          </div>

          <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <div className="field-label">Backend API manzili:</div>
            <code style={{ display: 'block', wordBreak: 'break-all', fontSize: 12 }}>
              {getApiUrl()}
            </code>
            <small>API manzili .env dagi VITE_API_URL orqali sozlanadi.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

/* NOTIFICATIONS MODAL */
function NotificationsModal({ onClose, leads }) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>Bildirishnomalar</h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: 360 }}>
          {safeLeads.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Hozircha bildirishnomalar yo‘q.</p>
          ) : (
            safeLeads.slice(0, 5).map((l) => (
              <div
                key={l.id}
                style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0f172a' }}>
                  <span>{l.fullName}</span>
                  <span style={{ fontSize: 10, color: '#0969da' }}>{label('source', l.source)}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{l.company || 'Yakka tartibdagi mijoz'}</div>
              </div>
            ))
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}

/* LOGIN SCREEN */
function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-left-banner">
          <div className="corp-brand-lockup" style={{ color: '#ffffff' }}>
            <div className="corp-logo-mark" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
              <span className="logo-u" style={{ color: '#38bdf8' }}>
                U<span>↗</span>
              </span>
            </div>
            <div className="corp-brand-text">
              <h1 style={{ color: '#ffffff' }}>UzAutoTrailer</h1>
              <span style={{ color: '#38bdf8' }}>C R M</span>
            </div>
          </div>

          <div style={{ margin: '48px 0' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#38bdf8', marginBottom: 8 }}>
              SOTUV JAMOASI UCHUN
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>
              Muloqotdan <br /> natijagacha.
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginTop: 14 }}>
              Leadlar, mijozlar va jamoa natijalari.
              <br />
              Hammasi bitta qulay ish maydonida.
            </p>
          </div>

          <div style={{ fontSize: 11, color: '#64748b' }}>UzAutoTrailer · Sales Management System</div>
        </div>

        <form
          className="login-right-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            const data = new FormData(e.target);
            try {
              const r = await request('/auth/login', 'POST', Object.fromEntries(data));
              sessionStorage.setItem('uat_token', r.token);
              sessionStorage.setItem('uat_user', JSON.stringify(r.user));
              onLogin(r.user);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#0969da', background: '#eff6ff', padding: '3px 8px', borderRadius: 4, width: 'fit-content', marginBottom: 12 }}>
            XUSH KELIBSIZ
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Ish maydoniga kirish
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
            Operator hisobingiz orqali davom eting.
          </p>

          <label className="field-label" style={{ marginBottom: 16 }}>
            Login
            <input name="username" autoComplete="username" required placeholder="admin yoki rahima" defaultValue="admin" />
          </label>

          <label className="field-label" style={{ marginBottom: 20 }}>
            Parol
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Parolingizni kiriting"
              defaultValue="12345678910"
            />
          </label>

          {error && (
            <p style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 16 }}>
              {error}
            </p>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={busy}>
            {busy ? 'Kirilmoqda...' : 'Kirish'}
            <ArrowUpRight size={17} />
          </button>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                Backend server:
              </span>

            </div>
            <code style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '5px 8px', borderRadius: 4, color: '#0969da', fontSize: 11, wordBreak: 'break-all', textAlign: 'center' }}>
              {getApiUrl()}
            </code>
            <small style={{ color: '#94a3b8', fontSize: 10, textAlign: 'center' }}>
              Backend manzili sozlangan; ulanish login yoki health so‘rovida tekshiriladi.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
