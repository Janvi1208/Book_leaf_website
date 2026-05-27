import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { booksApi } from '../../services/api';
import { format } from 'date-fns';

function fmt(n) { return new Intl.NumberFormat('en-IN').format(n || 0); }
function fmtRs(n) { return '₹' + fmt(n); }

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    booksApi.allBooks().then(r => setBooks(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>All Books</h1>
          <p>Published titles across all authors</p>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Genre</th>
                    <th>Status</th>
                    <th>MRP</th>
                    <th>Copies Sold</th>
                    <th>Royalty Earned</th>
                    <th>Royalty Pending</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b.id}>
                      <td><strong style={{ fontSize: '13px' }}>{b.title}</strong></td>
                      <td>{b.author_name}</td>
                      <td className="text-muted" style={{ fontSize: '12px', fontFamily: 'monospace' }}>{b.isbn}</td>
                      <td><span className="chip">{b.genre}</span></td>
                      <td>
                        <span className={`badge ${b.status === 'Published' ? 'badge-resolved' : 'badge-in-progress'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>{fmtRs(b.mrp)}</td>
                      <td>{fmt(b.copies_sold)}</td>
                      <td>{fmtRs(b.total_royalty_earned)}</td>
                      <td style={{ color: b.royalty_pending > 0 ? 'var(--warning)' : 'inherit' }}>
                        {fmtRs(b.royalty_pending)}
                      </td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>
                        {b.publication_date ? format(new Date(b.publication_date), 'dd MMM yyyy') : '—'}
                      </td>
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
