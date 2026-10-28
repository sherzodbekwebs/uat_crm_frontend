import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Columns3, Users, Plus, Search, ArrowUpRight, Phone, CalendarDays, X, LogOut, ChevronRight, RefreshCw, Check, Building2, SlidersHorizontal, Download, Bell, FileText, Trophy, XCircle, Clock, Settings, ShieldCheck, TrendingUp, Coins, MapPin, List, MoreHorizontal, CheckCircle2, Calendar, MessageSquare, Sparkles } from 'lucide-react';
import { stages, choices, regions, label, date, money, payload } from './constants';
import './style.css';
import './theme.css';
import './mint.css';
import './features.css';
import { t, t as translateOption, useLanguage, localized } from './i18n';
import { Topbar, Catalog, UserManagement, RegionMap } from './features';
import { RequestLoading, LoadingText, trackRequest } from './loading.jsx';
import { saveWithMerge } from './lead-merge.js';

// API manzili bitta manbadan olinadi. Oldin saqlangan LocalTunnel
// yoki boshqa URL'lar production konfiguratsiyasini almashtirmaydi.
export function getApiUrl() {
  const configured = (import.meta.env.VITE_API_URL || 'https://crm-api.uzautotrailer.uz/api').trim().replace(/\/+$/, '');
  return configured.endsWith('/api') ? configured : `${configured}/api`;
}
function request(path, method = 'GET', data) {
  return trackRequest(() => performRequest(path, method, data));
}
async function performRequest(path, method = 'GET', data) {
  const apiBase = getApiUrl();
  let normalizedPath = path.startsWith('/') ? path : '/' + path;
  if (apiBase.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  }
  const url = apiBase + normalizedPath;
  const token = sessionStorage.getItem('uat_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  const r = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });
  const b = await r.json().catch(() => ({
    message: 'Server bilan aloqa yo‘q'
  }));
  if (!r.ok) {
    if (r.status === 401 && !path.includes('/auth/login')) {
      sessionStorage.clear();
      window.dispatchEvent(new Event('uat-logout'));
    }
    const error = Error(Array.isArray(b?.message) ? b.message.join(', ') : b?.message || 'So‘rov bajarilmadi');
    error.status = r.status;
    throw error;
  }
  return b;
}
function App() {
  useLanguage();
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
  const [productsLoading, setProductsLoading] = useState(false);
  const loadLock = useRef(false);
  const productLock = useRef(false);
  const saveLock = useRef(false);
  const [modal, setModal] = useState(null);
  const [conflict, setConflict] = useState(null);
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
    if (loadLock.current) return;
    loadLock.current = true;
    setLoading(true);
    try {
      const [l, u] = await Promise.all([request('/leads'), request('/users')]);
      setLeads(Array.isArray(l) ? l : []);
      setUsers(Array.isArray(u) ? u : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      loadLock.current = false;
      setLoading(false);
    }
  }
  async function loadProducts() {
    if (productLock.current) return;
    productLock.current = true;
    setProductsLoading(true);
    setProductError('');
    try {
      let p;
      try {
        if (import.meta.env.DEV) {
          const response = await fetch('/catalog-api/products', {signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw Error('Catalog unavailable');
          p = await response.json();
        } else p = await request('/catalog');
        p = p.filter(item => item.isActive !== false).map(item => ({...item, name:item.titleUz || item.titleRu || item.titleEn}));
      } catch { p = await request('/products'); }
      setProducts(Array.isArray(p) ? p : []);
    } catch (e) {
      setProductError(e.message);
    } finally {
      productLock.current = false;
      setProductsLoading(false);
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
  const filtered = leadList.filter(l => (!customerTypeFilter || l.customerType === customerTypeFilter) && (!source || l.source === source) && (!from || l.createdAt && l.createdAt.slice(0, 10) >= from) && (!to || l.createdAt && l.createdAt.slice(0, 10) <= to) && [l.fullName, l.phone, l.company, ...(Array.isArray(l.products) ? l.products.map(p => p.name) : [])].join(' ').toLowerCase().includes(query.toLowerCase()));
  async function updateLead(base, data) {
    return saveWithMerge({
      base,
      data,
      put: (draft, version) => request('/leads/' + base.id, 'PUT', {
        ...draft,
        version
      }),
      refresh: async () => {
        const latest = await request('/leads');
        setLeads(latest);
        return latest.find(item => item.id === base.id);
      },
      resolve: (keys, merged, remote) => new Promise((resolve, reject) => {
        setConflict({
          keys,
          merged,
          remote,
          finish: choices => {
            setConflict(null);
            if (!choices) {
              reject(new Error('Saqlash bekor qilindi. Kiritilgan ma’lumotlar oynada saqlanib turibdi.'));
              return;
            }
            resolve({
              ...merged,
              ...Object.fromEntries(keys.map(key => [key, choices[key] === 'remote' ? remote[key] : merged[key]]))
            });
          }
        });
      })
    });
  }
  async function save(data) {
    if (saveLock.current) return;
    saveLock.current = true;
    setBusy(true);
    try {
      if (modal.id) await updateLead(modal, data);else await request('/leads', 'POST', data);
      setModal(null);
      await load();
    } catch (e) {
      throw e;
    } finally {
      saveLock.current = false;
      setBusy(false);
    }
  }
  async function move(id, status) {
    const lead = leadList.find(l => l.id === id);
    if (!lead || lead.status === status || saveLock.current) return;
    if (status === 'lost') {
      setModal({
        ...lead,
        initialStatus: status
      });
      return;
    }
    saveLock.current = true;
    setBusy(true);
    try {
      await updateLead(lead, {
        ...payload(lead),
        status
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      saveLock.current = false;
      setBusy(false);
    }
  }
  if (!user) return <Login onLogin={setUser} />;
  const won = filtered.filter(l => l.status === 'won');
  const active = filtered.filter(l => !['won', 'lost'].includes(l.status));
  const totalAmountWon = won.reduce((n, l) => n + (Number(l.amount) || 0), 0);
  return <div className="page-container">
      <div className="window-frame">
        {/* SIDEBAR */}
        <aside className="sidebar">
          {/* Sidebar Brand Lockup */}
          <div className="sidebar-brand">
            <span className="sidebar-logo">
              L<span>↗</span>
            </span>
            <div className="sidebar-brand-name">
              LeadCore
              <small>CRM</small>
            </div>
          </div>

          {/* Department badge */}
          <div className="dept-pill">
            <span className="online-dot" />{t("Sotuv bo\u2018limi")}<span className="tag">CRM</span>
          </div>

          <p className="nav-label">{t("ISH MAYDONI")}</p>
          <nav className="sidebar-nav">
            <button className={page === 'board' ? 'active' : ''} onClick={() => setPage('board')}>
              <Columns3 size={18} />{t("Leadlar")}<b className="count">{leadList.length}</b>
            </button>
            <button className={page === 'stats' ? 'active' : ''} onClick={() => setPage('stats')}>
              <LayoutDashboard size={18} />{t("Statistika")}</button>
          <button className={page === 'catalog' ? 'active' : ''} onClick={() => setPage('catalog')}><Building2 size={18} />{t('Katalog')}</button>
            {user.role === 'admin' && <button className={page === 'users' ? 'active' : ''} onClick={() => setPage('users')}><Users size={18} />{t('Foydalanuvchilar')}</button>}
            </nav>

          {/* Sidebar Bottom */}
          <div className="sidebar-bottom">
            <button className="sidebar-util-btn" onClick={() => setPage('board')}>
              <ShieldCheck size={16} />{t("Yaqqol mijozlar bazasi")}</button>
            <button className="sidebar-util-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={16} />{t("Sozlamalar")}</button>

            {/* User Profile Row */}
            <div className="user-profile-bar">
              <span className="user-avatar-circle">{user.name?.[0] || 'A'}</span>
              <div className="user-info">
                <strong>{user.name}</strong>
                <small>{user.role === 'admin' ? t("Administrator") : t("Operator")}</small>
              </div>
              <button className="logout-icon-btn" title={t("Chiqish")} onClick={() => {
              sessionStorage.clear();
              setUser(null);
            }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="main-viewport">
          {/* Top Window Navigation Header */}
          <Topbar query={query} onQuery={value => {
          setQuery(value);
          setPage('board');
        }} />

          {/* Body Content */}
          {page === 'catalog' ? <Catalog api={request} /> : page === 'users' && user.role === 'admin' ? <UserManagement api={request} currentUser={user} onUpdated={load} /> : <section className="content-body">
            {/* Page Title & Main Action Row */}
            <div className="page-title-row">
              <div>
                <p className="page-eyebrow">{t("MUHIM KO\u2018RSATKICHLAR")}</p>
                <h1>{page === 'board' ? t("Har bir lead nazoratda.") : t("Raqamlar orqali natija.")}</h1>
                <p className="desc">
                  {page === 'board' ? t("Muvaffaqiyatli boshqaring, mijozlarni davom ettiring va sotuvga olib boring.") : t("Jamoa natijalarini va mijozlar oqimini bir joyda kuzating.")}
                </p>
              </div>

              {page === 'board' ? <button className="btn-primary" onClick={() => setModal({})}>
                  <Plus size={17} />{t("Yangi lead")}</button> : <div className="date-range-badge">
                  <Calendar size={14} />
                  <span>LeadCore</span>
                </div>}
            </div>

            {error && <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
                <span>{t(error)}</span>
                <button onClick={load} disabled={loading} style={{
              fontWeight: 700,
              textDecoration: 'underline'
            }}>{loading ? t("Yuklanmoqda...") : t("Qayta urinish")}</button>
              </div>}

            {/* 4 Metrics Cards */}
            <div className="metrics-row">
              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box blue">
                    <Users size={18} />
                  </div>
                  <span className="kpi-label">{t("Jami leadlar")}</span>
                </div>
                <div className="kpi-value">{filtered.length}</div>
                <div className="kpi-footer">{t("Tanlangan davr bo\u2018yicha")}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box sky">
                    <TrendingUp size={18} />
                  </div>
                  <span className="kpi-label">{t("Faol manfaatdorlar")}</span>
                </div>
                <div className="kpi-value">{active.length}</div>
                <div className="kpi-footer">{t("Javob qaytdi mijozlar")}<span className="kpi-growth">—</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box cyan">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="kpi-label">{t("Muvaffaqiyatli sotuv")}</span>
                </div>
                <div className="kpi-value">{won.length}</div>
                <div className="kpi-footer">
                  {filtered.length ? Math.round(won.length / filtered.length * 100) : 0}{t("% umumiy konversiya")}{' '}
                  <span className="kpi-growth">—</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon-box amber">
                    <Coins size={18} />
                  </div>
                  <span className="kpi-label">{t("Sotuv samarasi")}</span>
                </div>
                <div className="kpi-value">{totalAmountWon ? money(totalAmountWon) : '0'} UZS</div>
                <div className="kpi-footer">{t("UZS - umumiy kutilgan kasr")}<span className="kpi-growth">—</span>
                </div>
              </div>
            </div>

            {page === 'board' ? <>
                {/* Filter Toolbar */}
                <div className="filter-toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input id="search-input" placeholder={t("Ism, telefon yoki mahsulot bo\u2018yicha qidirish...")} value={query} onChange={e => setQuery(e.target.value)} />
                  </div>

                  <select className="filter-select" value={customerTypeFilter} onChange={e => setCustomerTypeFilter(e.target.value)}>
                    <option value="">{t("Barcha segmentlar")}</option>
                    {choices.customerType.map(([v, t]) => <option key={v} value={v}>
                        {translateOption(t)}</option>)}
                  </select>

                  <select className="filter-select" value={source} onChange={e => setSource(e.target.value)}>
                    <option value="">{t("Barcha manbalar")}</option>
                    {choices.source.map(([v, t]) => <option key={v} value={v}>
                        {translateOption(t)}</option>)}
                  </select>

                  <input type="date" className="date-input-field" value={from} onChange={e => setFrom(e.target.value)} title={t("Davr boshlanishi")} />
                  <span style={{
                color: '#94a3b8'
              }}>—</span>
                  <input type="date" className="date-input-field" value={to} onChange={e => setTo(e.target.value)} min={from} title={t("Davr oxiri")} />

                  <button className="btn-icon-square" title={loading ? t("Yangilanmoqda...") : t("Yangilash")} disabled={loading} aria-label={loading ? t("Yangilanmoqda") : t("Yangilash")} onClick={load}>
                    <RefreshCw size={15} className={loading ? 'spin' : ''} />
                  </button>
                </div>

                {/* Board Section Header */}
                <div className="board-header-row">
                  <div className="board-title-group">
                    <h2>
                      <Columns3 size={18} color="#0969da" />{t("Sotuv voronkasi")}</h2>
                    <span className="lead-count">{filtered.length}{t("ta lead")}</span>
                  </div>

                  <div className="view-mode-toggle">
                    <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
                      <Columns3 size={14} />{t("Kanban")}</button>
                    <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                      <List size={14} />{t("Ro\u2018yxat")}</button>
                    <button className="view-btn" title={t("Qo\u2018shimcha")} onClick={() => setModal({})}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                {/* View Mode: Kanban or List */}
                {viewMode === 'kanban' ? <div className="kanban-board">
                    {stages.map(([status, title, color, bgLight, borderLight]) => {
                const colLeads = filtered.filter(l => l.status === status);
                return <div className="kanban-column" style={{
                  '--stage-color': color
                }} key={status} onDragOver={e => e.preventDefault()} onDrop={e => {
                  e.preventDefault();
                  move(e.dataTransfer.getData('text/plain'), status);
                }}>
                          <div className="column-header">
                            <span className="column-dot" style={{
                      background: color
                    }} />
                            <span>{t(title)}</span>
                            <span className="column-count-badge">{colLeads.length}</span>
                          </div>

                          <div className="column-cards-container">
                            {status === 'new' && <button className="btn-col-add-quick" onClick={() => setModal({
                      status: 'new'
                    })}>
                                <span>{t("Yangi lead qo\u2018shish")}</span>
                                <Plus size={14} />
                              </button>}

                            {colLeads.map(l => <article key={l.id} className="kanban-card" draggable={!busy} onDragStart={e => e.dataTransfer.setData('text/plain', l.id)} onClick={() => setModal(l)}>
                                <div className="card-header-line">
                                  <span className="card-title">{l.fullName}</span>
                                  <MoreHorizontal size={14} color="#94a3b8" />
                                </div>

                                <div className="card-company">
                                  {l.company || label('customerType', l.customerType)}
                                </div>

                                {Array.isArray(l.products) && l.products.length > 0 && <div className="card-product-tag">
                                    {localized(products.find(p => p.id === l.products[0].id) || l.products[0])}
                                    {l.products.length > 1 && ` (+${l.products.length - 1})`}
                                  </div>}

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
                                      {userList.find(u => u.id === l.operatorId)?.name?.[0] || 'A'}
                                    </span>
                                    <span>{userList.find(u => u.id === l.operatorId)?.name || 'Admin'}</span>
                                  </div>
                                  <span className="card-amount">
                                    {l.amount ? `${money(l.amount)} UZS` : '+ UZS'}
                                  </span>
                                </div>
                              </article>)}

                            {colLeads.length === 0 && status !== 'new' && <div className="empty-col-card">
                                <div className="empty-col-icon-circle" style={{
                        background: bgLight,
                        color: color
                      }}>
                                  {status === 'contacted' && <Clock size={20} />}
                                  {status === 'offer' && <FileText size={20} />}
                                  {status === 'negotiation' && <Users size={20} />}
                                  {status === 'won' && <Trophy size={20} />}
                                  {status === 'lost' && <XCircle size={20} />}
                                </div>
                                <h4>{t("Bu bosqichda lead yo\u2018q")}</h4>
                                <p>{t("Yangi lead qo\u2018shish")}</p>
                                <button className="btn-add-in-empty" onClick={() => setModal({
                        status
                      })}>{t("+ Lead qo\u2018shish")}</button>
                              </div>}
                          </div>
                        </div>;
              })}
                  </div> : (/* LIST / TABLE VIEW */
            <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("Mijoz")}</th>
                          <th>{t("Telefon")}</th>
                          <th>{t("Hudud")}</th>
                          <th>{t("Mahsulotlar")}</th>
                          <th>{t("Mas\u2019ul operator")}</th>
                          <th>{t("Bosqich")}</th>
                          <th>{t("Summa")}</th>
                          <th>{t("Sana")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? <tr>
                            <td colSpan={8} style={{
                      textAlign: 'center',
                      padding: '36px',
                      color: '#94a3b8'
                    }}>{t("Leadlar topilmadi.")}</td>
                          </tr> : filtered.map(l => {
                    const stageObj = stages.find(s => s[0] === l.status) || stages[0];
                    return <tr key={l.id} style={{
                      cursor: 'pointer'
                    }} onClick={() => setModal(l)}>
                                <td>
                                  <strong>{l.fullName}</strong>
                                  <div style={{
                          fontSize: 11,
                          color: '#6e8578'
                        }}>
                                    {l.company || label('customerType', l.customerType)}
                                  </div>
                                </td>
                                <td>{l.phone}</td>
                                <td>
                                  {l.region}
                                  {l.city ? `, ${l.city}` : ''}
                                </td>
                                <td>
                                  {Array.isArray(l.products) && l.products.length > 0 ? l.products.map(p => localized(products.find(item => item.id === p.id) || p)).join(', ') : '—'}
                                </td>
                                <td>{userList.find(u => u.id === l.operatorId)?.name || 'Admin'}</td>
                                <td>
                                  <span className="status-badge" style={{
                          background: stageObj[3],
                          color: stageObj[2],
                          border: `1px solid ${stageObj[4]}`
                        }}>
                                    <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: stageObj[2]
                          }} />
                                    {stageObj[1]}
                                  </span>
                                </td>
                                <td>
                                  <strong>{money(l.amount)} UZS</strong>
                                </td>
                                <td style={{
                        fontSize: 11,
                        color: '#6e8578'
                      }}>{date(l.createdAt)}</td>
                              </tr>;
                  })}
                      </tbody>
                    </table>
                  </div>)}
              </> : (/* STATISTIKA PAGE (2x2 Grid matching mockup) */
          <Stats leads={filtered} users={userList} catalogProducts={products} />)}
          </section>}
        </main>
      </div>

      {busy && !modal && !conflict && <div className="operation-notice"><LoadingText text={t("O\u2018zgarishlar saqlanmoqda...")} /></div>}
      {/* MODALS */}
      {conflict && <ConflictDialog conflict={conflict} users={userList} catalogProducts={products} />}
      {modal && <LeadModal lead={modal} users={userList} products={products} productError={productError} productsLoading={productsLoading} retryProducts={loadProducts} onClose={() => !busy && setModal(null)} onSave={save} busy={busy} currentUser={user} leads={leadList} />}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} currentUser={user} />}

      {notifOpen && <NotificationsModal onClose={() => setNotifOpen(false)} leads={leadList} />}
    </div>;
}

/* STATS COMPONENT (Matches the right-side dashboard in the mockup) */
function Stats({
  leads,
  users,
  catalogProducts = []
}) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const total = safeLeads.length;

  // Grouping helper
  const countBy = fn => {
    const o = {};
    safeLeads.forEach(l => {
      const vals = fn(l);
      (Array.isArray(vals) ? vals : [vals]).forEach(k => {
        if (k) o[k] = (o[k] || 0) + 1;
      });
    });
    return o;
  };
  const sourcesCount = countBy(l => t(label('source', l.source)));
  const productsCount = countBy(l => Array.isArray(l.products) ? l.products.map(p => localized(catalogProducts.find(item => item.id === p.id) || p)) : []);
  const regionsCount = countBy(l => l.region);
  const mainSources = choices.source.map(([key,title],i)=>[t(title),['#0969da','#06b6d4','#eab308','#ef4444','#8b5cf6','#10b981','#f97316'][i]]);
  const mainRegions = [[t("Samarqand"), '#0969da'], [t("Toshkent shahri"), '#2563eb'], [t("Farg\u2018ona"), '#06b6d4'], [t("Buxoro"), '#38bdf8'], [t("Boshqa hududlar"), '#94a3b8']];
  function downloadCsv() {
    const rows = [[t("Operator"), t("Jami leadlar"), t("Sotuv"), 'Konversiya %', 'Sotuv UZS'], ...safeUsers.map(u => {
      const a = safeLeads.filter(l => l.operatorId === u.id);
      const w = a.filter(l => l.status === 'won');
      return [u.name, a.length, w.length, a.length ? (w.length / a.length * 100).toFixed(1) : 0, w.reduce((s, l) => s + (l.amount || 0), 0)];
    })];
    const blob = new Blob(['\ufeff' + rows.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'operator-statistika.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
      <div className="stats-2x2-grid">
        {/* 1. Sotuv voronkasi (Horizontal bar chart) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>{t("Sotuv voronkasi")}</h3>
            <p>{t("Leadlarning joriy bosqichlari")}</p>
          </div>
          {stages.map(([statusKey, stageTitle]) => {
          const count = safeLeads.filter(l => l.status === statusKey).length;
          const pct = total ? Math.round(count / total * 100) : 0;
          return <div key={statusKey} className="funnel-bar-item">
                <div className="funnel-bar-info">
                  <span>{t(stageTitle)}</span>
                  <span className="pct">
                    {count} - {pct}%
                  </span>
                </div>
                <div className="bar-track-bg">
                  <div className="bar-fill" style={{
                width: `${Math.max(count > 0 ? 8 : 0, pct)}%`
              }} />
                </div>
              </div>;
        })}
        </div>

        {/* 2. Leadlar manbalari (Donut chart with center text and legend) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>{t("Leadlar manbalari")}</h3>
            <p>{t("Mijozlar qayerdan kelmoqda?")}</p>
          </div>
          <div className="donut-chart-container">
            <div className="donut-svg-wrap">
              <svg viewBox="0 0 100 100" width="140" height="140">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0969da" strokeWidth="14" strokeDasharray="238.76" strokeDashoffset={total > 0 ? '0' : '238.76'} strokeLinecap="round" transform="rotate(-90 50 50)" />
              </svg>
              <div className="donut-center-label">
                <strong>{total}</strong>
                <small>{t("Jami lead")}</small>
              </div>
            </div>

            <div className="donut-legend">
              {mainSources.map(([sourceName, bulletColor]) => {
              const count = sourcesCount[sourceName] || 0;
              const pct = total ? Math.round(count / total * 100) : 0;
              return <div key={sourceName} className="legend-item">
                    <div className="legend-left">
                      <span className="legend-bullet" style={{
                    background: bulletColor
                  }} />
                      <span>{sourceName}</span>
                    </div>
                    <span>
                      {count} <small style={{
                    color: '#94a3b8'
                  }}>({pct}%)</small>
                    </span>
                  </div>;
            })}
            </div>
          </div>
        </div>

        {/* 3. Mahsulotga qiziqish */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>{t("Mahsulotga qiziqish")}</h3>
            <p>{t("Qaysi mahsulotlarga qiziqish yuqori?")}</p>
          </div>
          {Object.entries(productsCount).length === 0 ? <p style={{
          color: '#94a3b8',
          fontSize: 12
        }}>{t("Hali mahsulot tanlanmagan.")}</p> : Object.entries(productsCount).slice(0, 4).map(([prodName, count]) => {
          const pct = total ? Math.round(count / total * 100) : 0;
          return <div key={prodName} className="funnel-bar-item">
                    <div className="funnel-bar-info">
                      <span style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '75%'
              }}>
                        {prodName}
                      </span>
                      <span className="pct">
                        {count} - {pct}%
                      </span>
                    </div>
                    <div className="bar-track-bg">
                      <div className="bar-fill" style={{
                width: `${Math.max(count > 0 ? 8 : 0, pct)}%`
              }} />
                    </div>
                  </div>;
        })}
        </div>

        {/* 4. Hududlar kesimida (Uzbekistan map vector + legend) */}
        <div className="stat-box">
          <div className="stat-box-head">
            <h3>{t("Hududlar kesimida")}</h3>
            <p>{t("Leadlar qayer hududlardan?")}</p>
          </div>
          <RegionMap leads={safeLeads} />
        </div>
      </div>

      {/* Operator stats table with download button */}
      <div className="table-container" style={{
      marginTop: 16
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
          <div>
            <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0
          }}>{t("Operatorlar natijasi")}</h3>
            <p style={{
            fontSize: 11,
            color: '#6e8578',
            margin: '2px 0 0'
          }}>{t("Jamoa a\u2019zolarining ko\u2018rsatkichlari")}</p>
          </div>
          <button className="btn-secondary" onClick={downloadCsv}>
            <Download size={14} />{t("CSV yuklash")}</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Operator")}</th>
              <th>{t("Jami lead")}</th>
              <th>{t("Faol")}</th>
              <th>{t("Sotuv")}</th>
              <th>{t("Konversiya")}</th>
              <th>{t("Sotuv summasi")}</th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.map(u => {
            const a = safeLeads.filter(l => l.operatorId === u.id);
            const w = a.filter(l => l.status === 'won');
            const conv = a.length ? (w.length / a.length * 100).toFixed(1) : 0;
            const sum = w.reduce((s, l) => s + (l.amount || 0), 0);
            return <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{a.length}</td>
                  <td>{a.filter(l => !['won', 'lost'].includes(l.status)).length}</td>
                  <td>{w.length}</td>
                  <td>{conv}%</td>
                  <td>
                    <strong>{money(sum)} UZS</strong>
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
      </div>
    </>;
}

/* LEAD MODAL */
function LeadModal({
  lead,
  users,
  products,
  productError,
  productsLoading,
  retryProducts,
  onClose,
  onSave,
  busy,
  currentUser,
  leads
}) {
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
    notes: '',
    followUpAt: null,
    amount: 0,
    ...payload(lead),
    status: lead.initialStatus || lead.status || 'new'
  });
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  useEffect(() => {
    let active = true;
    if (lead.id) {
      setEventsLoading(true);
      request('/leads/' + lead.id + '/events').then(evs => {
        if (active) setEvents(Array.isArray(evs) ? evs : []);
      }).catch(e => {
        if (active) setError(e.message);
      }).finally(() => {
        if (active) setEventsLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [lead.id]);
  useEffect(() => {
    const close = e => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [busy, onClose]);
  const set = (k, v) => setData(d => ({
    ...d,
    [k]: v
  }));
  const input = (k, title, props = {}) => <label className="field-label">
      {t(title)}
      <input value={data[k] ?? ''} onChange={e => set(k, props.type === 'number' ? Number(e.target.value) : e.target.value)} {...props} />
    </label>;
  const select = (k, title, opts = choices[k]) => <label className="field-label">
      {t(title)}
      <select value={data[k]} onChange={e => set(k, k === 'operatorId' ? +e.target.value : e.target.value)}>
        {opts.map(([v, t]) => <option key={v} value={v}>
            {translateOption(t)}</option>)}
      </select>
    </label>;
  const safeLeads = Array.isArray(leads) ? leads : [];
  const duplicate = safeLeads.find(l => l.id !== lead.id && l.phone === data.phone.replace(/[\s()-]/g, ''));
  const dt = data.followUpAt ? new Date(new Date(data.followUpAt).getTime() - new Date(data.followUpAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  return <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <section className="modal-content lead-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#248478',
            letterSpacing: 1.5,
            margin: 0
          }}>
              {lead.id ? t("MIJOZ KARTASI") : t("YANGI MUROJAAT")}
            </p>
            <h2 style={{
            margin: '3px 0 0'
          }}>{lead.id ? lead.fullName : t("Yangi lead qo\u2018shish")}</h2>
          </div>
          <button onClick={onClose} style={{
          color: '#94a3b8'
        }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={async e => {
        e.preventDefault();
        setError('');
        try {
          await onSave(data);
        } catch (e) {
          setError(e.message);
        }
      }}>
          <fieldset className="modal-body loading-fields lead-columns" disabled={busy} aria-busy={busy}>
            <div className="lead-fields">
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#248478',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>01</span>{t("Mijoz haqida ma\u2019lumot")}</div>
            <div className="form-grid-2">
              {input('fullName', t("Ism va familiya *"), {
                required: true,
                minLength: 2,
                maxLength: 120,
                autoFocus: true
              })}
              {input('phone', t("Telefon raqami *"), {
                required: true,
                type: 'tel',
                placeholder: '+998901234567'
              })}
              {select('customerType', t("Mijoz turi *"))}
              {input('company', t("Korxona nomi / MChJ"), {
                maxLength: 160,
                placeholder: t("Masalan: Grand Logistics MChJ")
              })}
              {input('industry', t("Faoliyat tarmog\u2018i / soha *"), {
                required: true,
                maxLength: 120,
                placeholder: t("Logistika, qurilish...")
              })}
              {select('region', t("Hudud *"), regions.map(r => [r, r]))}
              {input('city', t("Shahar / tuman *"), {
                required: true,
                maxLength: 100
              })}
              {select('operatorId', t("Mas\u2019ul operator *"), (Array.isArray(users) ? users : []).map(u => [u.id, u.name]))}
            </div>

            {duplicate && <p style={{
              background: '#fef3c7',
              color: '#b45309',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 11
            }}>{t("Bu raqam bazada mavjud:")}<strong>{duplicate.fullName}</strong>.
              </p>}

            <div className="form-grid-2">
              {select('paymentType', t("To\u2018lov turi *"))}
              {select('offerSent', t("Tijoriy taklif *"))}
              {input('amount', t("Taxminiy / sotuv summasi (UZS)"), {
                type: 'number',
                min: 0,
                step: 'any'
              })}
              {select('status', t("Lead bosqichi"), stages.map(([k, t]) => [k, t]))}
            </div>

            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#248478',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 10
            }}>
              <span>03</span>{t("Murojaat va keyingi qadam")}</div>
            <div className="form-grid-2">
              {select('source', t("Murojaat manbasi *"))}
              <label className="field-label">{t("Qayta bog\u2018lanish sanasi")}<input type="datetime-local" value={dt} onChange={e => set('followUpAt', e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </label>
            </div>

            <label className="field-label">{t("Operator izohi")}<textarea rows={2} value={data.notes} onChange={e => set('notes', e.target.value)} placeholder={t("Mijoz ehtiyoji va kelishuvlar...")} />
            </label>

            {eventsLoading && <LoadingText text={t("O\u2018zgarishlar tarixi yuklanmoqda...")} />}
            {lead.id && events.length > 0 && <div style={{
              marginTop: 12
            }}>
                <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#6e8578',
                marginBottom: 8
              }}>{t("O\u2018zgarishlar tarixi")}</div>
                <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                  {events.map(ev => <div key={ev.id} style={{
                  fontSize: 11,
                  color: '#657e70',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                      <span>
                        <strong>{ev.actor}</strong>: {ev.description}
                      </span>
                      <span style={{
                    color: '#94a3b8'
                  }}>{date(ev.createdAt)}</span>
                    </div>)}
                </div>
              </div>}

            {error && <p style={{
              color: '#ef4444',
              fontSize: 12
            }}>{t(error)}</p>}
            </div><aside className="lead-products">            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#248478',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 10
            }}>
              <span>02</span>{t("Mahsulotlar va taklif")}</div>
            <label className="field-label">{t("Qiziqtirgan mahsulotlar *")}<input placeholder={t("Mahsulot qidirish...")} value={productQuery} onChange={e => setProductQuery(e.target.value)} />
            </label>

            {productsLoading && <LoadingText text={t("Mahsulotlar yuklanmoqda...")} />}
            {productError && <div style={{
              color: '#b45309',
              fontSize: 11
            }}>
                {productError} <button type="button" disabled={productsLoading} onClick={retryProducts} style={{
                textDecoration: 'underline'
              }}>{t("Qayta yuklash")}</button>
              </div>}

            <div className="product-selector-grid">
              {[...(Array.isArray(products) ? products : []), ...(Array.isArray(data.products) ? data.products : []).filter(p => !(Array.isArray(products) ? products : []).some(x => x.id === p.id))].filter(p => localized(p).toLowerCase().includes(productQuery.toLowerCase())).map(p => <label key={p.id}>
                    <input type="checkbox" checked={(Array.isArray(data.products) ? data.products : []).some(x => x.id === p.id)} onChange={e => set('products', e.target.checked ? [...data.products, { id: p.id, name: p.name }] : data.products.filter(x => x.id !== p.id))} />
                    <span>{localized(p)}</span>
                  </label>)}
            </div>

</aside>
          </fieldset>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>{t("Bekor qilish")}</button>
            <button className="btn-primary" disabled={busy || !(Array.isArray(data.products) ? data.products : []).length}>
              {busy ? <LoadingText text={t("Saqlanmoqda...")} /> : t("Saqlash")}
            </button>
          </div>
        </form>
      </section>
    </div>;
}

/* SETTINGS MODAL */
function SettingsModal({
  onClose,
  currentUser
}) {
  return <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{
      maxWidth: 520
    }}>
        <div className="modal-header">
          <h2>{t("Tizim sozlamalari")}</h2>
          <button onClick={onClose} style={{
          color: '#94a3b8'
        }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0'
        }}>
            <ShieldCheck size={28} color="#0969da" />
            <div>
              <strong style={{
              fontSize: 13,
              color: '#254638'
            }}>LeadCore CRM v2.0</strong>
              <div style={{
              fontSize: 11,
              color: '#6e8578'
            }}>PostgreSQL Baza & NestJS API integratsiyasi</div>
            </div>
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
            <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#334155'
          }}>{t("Foydalanuvchi ma\u2019lumotlari:")}</div>
            <div style={{
            fontSize: 12,
            color: '#657e70'
          }}>{t("Ism:")}<strong>{currentUser?.name}</strong>
            </div>
            <div style={{
            fontSize: 12,
            color: '#657e70'
          }}>{t("Lavozim:")}<strong>{currentUser?.role === 'admin' ? t("Administrator") : t("Operator")}</strong>
            </div>
            <div style={{
            fontSize: 12,
            color: '#657e70',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
              Backend: <span>{getApiUrl()}</span>
            </div>
          </div>

          <div style={{
          marginTop: 12,
          borderTop: '1px solid #f1f5f9',
          paddingTop: 12
        }}>
            <div className="field-label">Backend API manzili:</div>
            <code style={{
            display: 'block',
            wordBreak: 'break-all',
            fontSize: 12
          }}>
              {getApiUrl()}
            </code>
            <small>API manzili .env dagi VITE_API_URL orqali sozlanadi.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>{t("Yopish")}</button>
        </div>
      </div>
    </div>;
}

/* NOTIFICATIONS MODAL */
function NotificationsModal({
  onClose,
  leads
}) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  return <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{
      maxWidth: 440
    }}>
        <div className="modal-header">
          <h2>{t("Bildirishnomalar")}</h2>
          <button onClick={onClose} style={{
          color: '#94a3b8'
        }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{
        maxHeight: 360
      }}>
          {safeLeads.length === 0 ? <p style={{
          color: '#94a3b8',
          fontSize: 12,
          textAlign: 'center'
        }}>{t("Hozircha bildirishnomalar yo\u2018q.")}</p> : safeLeads.slice(0, 5).map(l => <div key={l.id} style={{
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: 12
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
            color: '#254638'
          }}>
                  <span>{l.fullName}</span>
                  <span style={{
              fontSize: 10,
              color: '#248478'
            }}>{t(label('source', l.source))}</span>
                </div>
                <div style={{
            color: '#6e8578',
            fontSize: 11,
            marginTop: 2
          }}>{l.company || t("Yakka tartibdagi mijoz")}</div>
              </div>)}
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>{t("Tushunarli")}</button>
        </div>
      </div>
    </div>;
}

/* LOGIN SCREEN */
function Login({
  onLogin
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loginLock = useRef(false);
  return <div className="login-wrap">
      <div className="login-card">
        <div className="login-left-banner">
          <div className="corp-brand-lockup" style={{
          color: '#ffffff'
        }}>
            <div className="corp-logo-mark" style={{
            background: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.2)'
          }}>
              <span className="logo-u" style={{
              color: '#38bdf8'
            }}>
                L<span>↗</span>
              </span>
            </div>
            <div className="corp-brand-text">
              <h1 style={{
              color: '#ffffff'
            }}>LeadCore</h1>
              <span style={{
              color: '#38bdf8'
            }}>C R M</span>
            </div>
          </div>

          <div style={{
          margin: '48px 0'
        }}>
            <p style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2,
            color: '#38bdf8',
            marginBottom: 8
          }}>{t("SOTUV JAMOASI UCHUN")}</p>
            <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2
          }}>{t("Muloqotdan")}<br />{t("natijagacha.")}</h2>
            <p style={{
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.6,
            marginTop: 14
          }}>{t("Leadlar, mijozlar va jamoa natijalari.")}<br />{t("Hammasi bitta qulay ish maydonida.")}</p>
          </div>

          <div style={{
          fontSize: 11,
          color: '#6e8578'
        }}>LeadCore · Sales Management System</div>
        </div>

        <form className="login-right-form" onSubmit={async e => {
        e.preventDefault();
        if (loginLock.current) return;
        loginLock.current = true;
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
          loginLock.current = false;
          setBusy(false);
        }
      }}>
          <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: '#248478',
          background: '#eff6ff',
          padding: '3px 8px',
          borderRadius: 4,
          width: 'fit-content',
          marginBottom: 12
        }}>{t("XUSH KELIBSIZ")}</span>
          <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 800,
          color: '#254638',
          margin: '0 0 6px'
        }}>{t("Ish maydoniga kirish")}</h2>
          <p style={{
          fontSize: 13,
          color: '#6e8578',
          margin: '0 0 24px'
        }}>{t("Operator hisobingiz orqali davom eting.")}</p>

          <label className="field-label" style={{
          marginBottom: 16
        }}>{t("Login")}<input name="username" autoComplete="username" required placeholder="admin yoki rahima" defaultValue="admin" />
          </label>

          <label className="field-label" style={{
          marginBottom: 20
        }}>{t("Parol")}<input name="password" type="password" autoComplete="current-password" required placeholder="Parolingizni kiriting" defaultValue="12345678910" />
          </label>

          {error && <p style={{
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          marginBottom: 16
        }}>
              {t(error)}
            </p>}

          <button className="btn-primary" style={{
          width: '100%',
          justifyContent: 'center',
          padding: '12px'
        }} disabled={busy}>
            {busy ? <LoadingText text={t("Kirilmoqda...")} /> : t("Kirish")}
            <ArrowUpRight size={17} />
          </button>

          <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'stretch'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#657e70'
          }}>
              <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
                <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#16a34a',
                display: 'inline-block'
              }}></span>
                Backend server:
              </span>

            </div>
            <code style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '5px 8px',
            borderRadius: 4,
            color: '#248478',
            fontSize: 11,
            wordBreak: 'break-all',
            textAlign: 'center'
          }}>
              {getApiUrl()}
            </code>
            <small style={{
            color: '#94a3b8',
            fontSize: 10,
            textAlign: 'center'
          }}>
              Backend manzili sozlangan; ulanish login yoki health so‘rovida tekshiriladi.
            </small>
          </div>
        </form>
      </div>
    </div>;
}
createRoot(document.getElementById('root')).render(<><RequestLoading /><App /></>);
function ConflictDialog({
  conflict,
  users
}) {
  const [choices, setChoices] = useState({});
  const names = {
    fullName: t("Ism va familiya"),
    company: t("Korxona"),
    industry: t("Faoliyat sohasi"),
    region: t("Hudud"),
    city: t("Shahar / tuman"),
    customerType: t("Mijoz turi"),
    products: t("Mahsulotlar"),
    paymentType: t("To\u2018lov turi"),
    offerSent: t("Taklif"),
    rejectionReason: t("Rad etish sababi"),
    rejectionOther: t("Sabab izohi"),
    phone: t("Telefon"),
    source: t("Manba"),
    sourceOther: t("Manba izohi"),
    operatorId: t("Operator"),
    status: t("Status"),
    notes: t("Izoh"),
    followUpAt: t("Keyingi aloqa"),
    amount: t("Summa")
  };
  const format = (key, value) => {
    if (key === 'products') return (value || []).map(p => p.name).join(', ') || t("Bo\u2018sh");
    if (key === 'operatorId') return users.find(u => u.id === value)?.name || value;
    if (key === 'status') return stages.find(s => s[0] === value)?.[1] || value;
    return label(key, value) || t("Bo\u2018sh");
  };
  return <div className="modal-backdrop" style={{
    zIndex: 10000
  }}>
    <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="conflict-title" style={{
      maxWidth: 720
    }}>
      <div className="modal-header"><h2 id="conflict-title">{t("Qaysi qiymat saqlansin?")}</h2></div>
      <div className="modal-body">
        <p>{t("Boshqa operator ham shu maydonlarni o\u2018zgartirgan. Qolgan o\u2018zgarishlar avtomatik birlashtiriladi.")}</p>
        {conflict.keys.map(key => <fieldset key={key} style={{
          marginBottom: 16,
          padding: 12
        }}>
          <legend>{names[key] || key}</legend>
          {['mine', 'remote'].map(side => <label key={side} style={{
            display: 'block',
            padding: 8,
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap'
          }}>
            <input type="radio" name={'conflict-' + key} checked={choices[key] === side} onChange={() => setChoices(old => ({
              ...old,
              [key]: side
            }))} />
            <strong>{side === 'mine' ? t(" Siz kiritgan: ") : t(" Serverdagi: ")}</strong>
            {format(key, side === 'mine' ? conflict.merged[key] : conflict.remote[key])}
          </label>)}
        </fieldset>)}
        <button type="button" onClick={() => conflict.finish(null)}>{t("Bekor qilish")}</button>
        <button type="button" className="btn-primary" disabled={conflict.keys.some(key => !choices[key])} onClick={() => conflict.finish(choices)}>{t("Tanlanganlarni saqlash")}</button>
      </div>
    </section>
  </div>;
}