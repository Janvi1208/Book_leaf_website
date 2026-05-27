import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { ticketsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

function statusBadge(s) {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-in-progress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed' };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
}

function priorityBadge(p) {
  const map = { 'Critical': 'badge-critical', 'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low' };
  return <span className={`badge ${map[p] || ''}`}>{p}</span>;
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin draft state
  const [draft, setDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [showDraft, setShowDraft] = useState(false);

  // Admin edit controls
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const threadRef = useRef(null);

  const load = useCallback(() => {
    ticketsApi.getTicket(id).then(r => {
      setTicket(r.data);
      setMessages(r.data.messages || []);
      setEditStatus(r.data.status);
      setEditPriority(r.data.priority);
      setEditCategory(r.data.category);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      await ticketsApi.sendMessage(id, { message: msgText.trim(), is_internal_note: isInternal });
      setMsgText('');
      setIsInternal(false);
      load();
    } finally {
      setSending(false);
    }
  }

  async function loadDraft() {
    setDraftLoading(true);
    setDraftError('');
    setShowDraft(true);
    try {
      const { data } = await ticketsApi.getDraft(id);
      if (data.draft) {
        setDraft(data.draft);
      } else {
        setDraftError(data.error || 'AI draft unavailable. Please write manually.');
        setDraft('');
      }
    } catch {
      setDraftError('Could not load AI draft. Please write manually.');
    } finally {
      setDraftLoading(false);
    }
  }

  function useDraft() {
    setMsgText(draft);
    setIsInternal(false);
    setShowDraft(false);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await ticketsApi.update(id, { status: editStatus, priority: editPriority, category: editCategory });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function assignToMe() {
    await ticketsApi.update(id, { assigned_to: user.id });
    load();
  }

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
    </div>
  );

  if (!ticket) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content"><div className="alert alert-error">Ticket not found.</div></main>
    </div>
  );

  const backPath = isAdmin ? '/admin/tickets' : '/author/tickets';

  const CATEGORIES = ['Royalty & Payments','ISBN & Metadata Issues','Printing & Quality','Distribution & Availability','Book Status & Production Updates','General Inquiry'];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(backPath)}>← Back</button>
          <span className="text-muted">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="row" style={{ gap: '24px', alignItems: 'flex-start' }}>
          {/* Main ticket column */}
          <div style={{ flex: 1 }}>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div>
                  <h3 style={{ marginBottom: '6px' }}>{ticket.subject}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {statusBadge(ticket.status)}
                    {priorityBadge(ticket.priority)}
                    <span className="chip">{ticket.category}</span>
                  </div>
                </div>
              </div>

              <div className="ticket-meta-grid">
                <div className="ticket-meta-item">
                  <label>Author</label>
                  <span>{ticket.author_name}</span>
                </div>
                <div className="ticket-meta-item">
                  <label>Book</label>
                  <span>{ticket.book_title || 'General'}</span>
                </div>
                <div className="ticket-meta-item">
                  <label>Submitted</label>
                  <span>{format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                <div className="ticket-meta-item">
                  <label>Last Updated</label>
                  <span>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                </div>
                {isAdmin && ticket.ai_category && (
                  <div className="ticket-meta-item">
                    <label>AI Classification</label>
                    <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                      {ticket.ai_category} · {ticket.ai_priority}
                    </span>
                  </div>
                )}
              </div>

              <div className="ticket-description">
                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)' }}>Description</strong>
                {ticket.description}
              </div>

              {/* Messages thread */}
              <div className="messages-thread" ref={threadRef}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '14px', padding: '20px' }}>
                    No messages yet. Be the first to reply.
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id}>
                    <div className={`message-bubble ${m.is_internal_note ? 'internal' : m.sender_role}`}>
                      {m.is_internal_note && <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#b45309' }}>🔒 Internal Note</div>}
                      {m.message}
                      <div className="message-meta">
                        {m.sender_name} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        {m.ai_drafted ? ' · ✨ AI-drafted' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Draft box (admin only) */}
              {isAdmin && showDraft && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)', background: 'var(--white)' }}>
                  <div className="ai-draft-box">
                    <div className="ai-draft-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      AI-Generated Draft Response
                    </div>
                    {draftLoading ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--gray-600)' }}>
                        <div className="spinner" style={{ width: 16, height: 16 }} />
                        Generating response…
                      </div>
                    ) : draftError ? (
                      <div className="alert alert-error" style={{ margin: 0 }}>{draftError}</div>
                    ) : (
                      <>
                        <textarea
                          style={{ width: '100%', minHeight: '140px', border: '1px solid #c7d2fe', borderRadius: 'var(--radius)', padding: '10px 14px', fontFamily: 'inherit', fontSize: '14px', background: 'white', resize: 'vertical' }}
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button className="btn btn-gold btn-sm" onClick={useDraft}>Use This Draft</button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setShowDraft(false); setDraft(''); }}>Dismiss</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Message composer */}
              <div className="message-composer">
                <div style={{ flex: 1 }}>
                  {isAdmin && (
                    <div style={{ marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        Internal note (not visible to author)
                      </label>
                      {!showDraft && (
                        <button className="btn btn-sm" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '12px' }} onClick={loadDraft}>
                          ✨ AI Draft
                        </button>
                      )}
                    </div>
                  )}
                  <textarea
                    placeholder={isInternal ? 'Add an internal note…' : 'Write a reply…'}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage(); }}
                  />
                  <div className="text-muted" style={{ marginTop: '4px' }}>Ctrl+Enter to send</div>
                </div>
                <button className="btn btn-primary" onClick={sendMessage} disabled={sending || !msgText.trim()}>
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Admin sidebar panel */}
          {isAdmin && (
            <div style={{ width: '260px', flexShrink: 0 }}>
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header"><h3 style={{ fontSize: '15px' }}>Manage Ticket</h3></div>
                <div className="card-body" style={{ padding: '16px' }}>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      {['Open','In Progress','Resolved','Closed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                      {['Critical','High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveChanges} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {!ticket.assigned_to && (
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={assignToMe}>
                      Assign to Me
                    </button>
                  )}
                  {ticket.assigned_to && (
                    <div className="text-muted" style={{ marginTop: '8px', fontSize: '12px' }}>
                      Assigned to: {ticket.assigned_to_name || 'Admin'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
