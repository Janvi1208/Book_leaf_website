import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { booksApi, ticketsApi } from '../../services/api';

export default function SubmitTicket() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ book_id: '', subject: '', description: '' });
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    booksApi.myBooks().then(r => setBooks(r.data));
  }, []);

  function set(k) {
    return e => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        subject: form.subject,
        description: form.description,
      };
      if (form.book_id) payload.book_id = form.book_id;
      const { data } = await ticketsApi.create(payload);
      navigate(`/author/tickets/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to submit ticket';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Submit a Support Query</h1>
          <p>Our team typically responds within 1–2 business days</p>
        </div>

        <div className="card" style={{ maxWidth: '680px' }}>
          <div className="card-header">
            <h3>New Support Ticket</h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Related Book</label>
                <select className="form-control" value={form.book_id} onChange={set('book_id')}>
                  <option value="">General / Account Level</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brief summary of your issue"
                  value={form.subject}
                  onChange={set('subject')}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Describe your issue in detail. Include relevant dates, amounts, or reference numbers."
                  value={form.description}
                  onChange={set('description')}
                  style={{ minHeight: '140px' }}
                  required
                  minLength={10}
                />
              </div>

              <div className="form-group">
                <label>Attachment (optional)</label>
                <div style={{
                  border: '2px dashed var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  fontSize: '14px',
                  transition: 'var(--transition)',
                }}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  {fileName ? (
                    <span style={{ color: 'var(--navy)' }}>📎 {fileName}</span>
                  ) : (
                    <>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>📎</div>
                      Click or drag to attach a file (PDF, image, etc.)
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => setFileName(e.target.files[0]?.name || '')}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
                <p className="text-muted" style={{ marginTop: '6px' }}>File attachment is UI-only in this demo</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/author/tickets')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
