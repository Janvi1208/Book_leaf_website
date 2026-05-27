import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { booksApi } from '../../services/api';
import { format } from 'date-fns';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
}

function fmtRs(n) {
  return '₹' + fmt(n);
}

export default function AuthorBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    booksApi.myBooks().then(r => setBooks(r.data)).finally(() => setLoading(false));
  }, []);

  const totalEarned = books.reduce((s, b) => s + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((s, b) => s + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((s, b) => s + (b.royalty_pending || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>My Books</h1>
          <p>Your published titles and royalty earnings</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Books</div>
            <div className="stat-value">{books.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Royalty Earned</div>
            <div className="stat-value" style={{ fontSize: '22px' }}>{fmtRs(totalEarned)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Royalty Paid</div>
            <div className="stat-value" style={{ fontSize: '22px', color: 'var(--success)' }}>{fmtRs(totalPaid)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Royalty Pending</div>
            <div className="stat-value" style={{ fontSize: '22px', color: 'var(--warning)' }}>{fmtRs(totalPending)}</div>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : books.length === 0 ? (
          <div className="empty-state"><p>No books found.</p></div>
        ) : (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-card-header">
                  <h3>{book.title}</h3>
                  <p>{book.genre} · {book.isbn}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${book.status === 'Published' ? 'badge-resolved' : 'badge-in-progress'}`}>
                      {book.status}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                      {book.publication_date ? format(new Date(book.publication_date), 'dd MMM yyyy') : '—'}
                    </span>
                  </div>
                </div>
                <div className="book-card-body">
                  <div className="royalty-row">
                    <span>MRP</span>
                    <span>{fmtRs(book.mrp)}</span>
                  </div>
                  <div className="royalty-row">
                    <span>Copies Sold</span>
                    <span>{fmt(book.copies_sold)}</span>
                  </div>
                  <div className="royalty-row">
                    <span>Royalty Rate</span>
                    <span>{(book.royalty_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="royalty-row">
                    <span>Total Royalty Earned</span>
                    <span>{fmtRs(book.total_royalty_earned)}</span>
                  </div>
                  <div className="royalty-row">
                    <span>Royalty Paid</span>
                    <span style={{ color: 'var(--success)' }}>{fmtRs(book.royalty_paid)}</span>
                  </div>
                  <div className="royalty-row">
                    <span>Royalty Pending</span>
                    <span className="royalty-pending">{fmtRs(book.royalty_pending)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
