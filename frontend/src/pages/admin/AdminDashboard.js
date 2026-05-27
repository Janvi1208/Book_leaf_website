import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { ticketsApi } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      ticketsApi.getStats(),
      ticketsApi.all({ sort: 'created_at', order: 'DESC' })
    ]).then(([s, t]) => {
      setStats(s.data);
      setRecentTickets(t.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
    </div>
  );

  const statusMap = {};
  stats?.statusCounts?.forEach(s => statusMap[s.status] = s.count);

  const priorityMap = {};
  stats?.priorityCounts?.forEach(p => priorityMap[p.priority] = p.count);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Overview of all support activity</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{stats?.totalTickets}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value" style={{ color: 'var(--info)' }}>{statusMap['Open'] || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{statusMap['In Progress'] || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical / High</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {(priorityMap['Critical'] || 0) + (priorityMap['High'] || 0)}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col">
            <div className="card">
              <div className="card-header">
                <h3>Recent Tickets</h3>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/tickets')}>View All</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Author</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map(t => (
                      <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                        <td><strong style={{ fontSize: '13px' }}>{t.subject}</strong></td>
                        <td className="text-muted">{t.author_name}</td>
                        <td>
                          <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3 style={{ fontSize: '15px' }}>By Category</h3></div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {stats?.categoryCounts?.map(c => (
                  <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--gray-600)' }}>{c.category}</span>
                    <strong>{c.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: '15px' }}>By Priority</h3></div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {['Critical','High','Medium','Low'].map(p => (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '13px' }}>
                    <span className={`badge badge-${p.toLowerCase()}`}>{p}</span>
                    <strong>{priorityMap[p] || 0}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
