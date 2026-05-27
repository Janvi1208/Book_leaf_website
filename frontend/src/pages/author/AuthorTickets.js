import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { ticketsApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

function statusBadge(s) {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-in-progress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed' };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
}

function priorityBadge(p) {
  const map = { 'Critical': 'badge-critical', 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
  return <span className={`badge ${map[p] || ''}`}>{p}</span>;
}

export default function AuthorTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    ticketsApi.myTickets().then(r => setTickets(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Poll every 15s for near-real-time updates
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>My Tickets</h1>
            <p>Support queries you've submitted · auto-refreshes every 15s</p>
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/author/submit')}>+ New Query</button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>No tickets yet. Submit a query to get started.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/author/tickets/${t.id}`)}>
                      <td>
                        <strong>{t.subject}</strong>
                        <div className="text-muted" style={{ marginTop: 2 }}>
                          {t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}
                        </div>
                      </td>
                      <td className="text-muted">{t.book_title || 'General'}</td>
                      <td><span className="chip">{t.category}</span></td>
                      <td>{priorityBadge(t.priority)}</td>
                      <td>{statusBadge(t.status)}</td>
                      <td className="text-muted">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</td>
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
