import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { ticketsApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

function priorityBadge(p) {
  const map = { 'Critical': 'badge-critical', 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
  return <span className={`badge ${map[p] || ''}`}>{p}</span>;
}

function statusBadge(s) {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-in-progress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed' };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', sort: 'priority' });
  const navigate = useNavigate();

  const load = useCallback(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    params.sort = filters.sort;
    ticketsApi.all(params).then(r => setTickets(r.data)).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  function setFilter(k) {
    return e => setFilters(f => ({ ...f, [k]: e.target.value }));
  }

  const CATEGORIES = ['Royalty & Payments','ISBN & Metadata Issues','Printing & Quality','Distribution & Availability','Book Status & Production Updates','General Inquiry'];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Ticket Queue</h1>
          <p>All incoming author support queries</p>
        </div>

        <div className="filters-bar">
          <select value={filters.status} onChange={setFilter('status')}>
            <option value="">All Statuses</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>

          <select value={filters.category} onChange={setFilter('category')}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <select value={filters.priority} onChange={setFilter('priority')}>
            <option value="">All Priorities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <select value={filters.sort} onChange={setFilter('sort')}>
            <option value="priority">Sort: Priority</option>
            <option value="created_at">Sort: Newest</option>
            <option value="updated_at">Sort: Recently Updated</option>
          </select>

          <span className="text-muted" style={{ marginLeft: 'auto' }}>{tickets.length} tickets</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Author</th>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>No tickets match filters</td></tr>
                  ) : tickets.map(t => (
                    <tr
                      key={t.id}
                      style={{ cursor: 'pointer', borderLeft: t.priority === 'Critical' ? '3px solid var(--danger)' : t.priority === 'High' ? '3px solid var(--warning)' : '3px solid transparent' }}
                      onClick={() => navigate(`/admin/tickets/${t.id}`)}
                    >
                      <td>
                        <strong style={{ fontSize: '13px' }}>{t.subject}</strong>
                        <div className="text-muted">{t.description.slice(0, 50)}…</div>
                      </td>
                      <td>{t.author_name}</td>
                      <td className="text-muted" style={{ fontSize: '13px' }}>{t.book_title || 'General'}</td>
                      <td><span className="chip" style={{ fontSize: '11px' }}>{t.category}</span></td>
                      <td>{priorityBadge(t.priority)}</td>
                      <td>{statusBadge(t.status)}</td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>{t.assigned_to_name || '—'}</td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
