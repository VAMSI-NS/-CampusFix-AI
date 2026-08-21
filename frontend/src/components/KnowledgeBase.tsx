import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  BookOpen,
  Wifi,
  KeyRound,
  Printer,
  ShieldCheck,
  Gamepad2,
  Shield,
  Mail,
  PlusCircle,
  ThumbsUp,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Check,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { KBArticle, KBSearchResponse, UserRole } from '../types/chat';
import { INITIAL_MOCK_KB_ARTICLES } from '../data/mockData';

interface KnowledgeBaseProps {
  userRole: UserRole;
  onOpenInResolverWithTopic?: (topicPrompt: string) => void;
}

const CATEGORIES = [
  'All',
  'Wi-Fi',
  'Password & Account',
  'Canvas & Courses',
  'Printing',
  'Duo & MFA',
  'Residence ResNet',
  'VPN',
  'Email',
];

export default function KnowledgeBase({
  userRole,
  onOpenInResolverWithTopic,
}: KnowledgeBaseProps) {
  const [articles, setArticles] = useState<KBArticle[]>(() => INITIAL_MOCK_KB_ARTICLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [votedArticleIds, setVotedArticleIds] = useState<Set<string>>(new Set());

  // Admin Article Modal State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Wi-Fi');
  const [formTags, setFormTags] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/kb');
      if (res.ok) {
        const data: KBSearchResponse = await res.json();
        if (data && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        }
      }
    } catch (err) {
      console.error('Failed to load KB articles (using default articles):', err);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (selectedCategory !== 'All') {
        const cat = a.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (!cat.includes(sel.split(' ')[0].toLowerCase()) && !sel.includes(cat)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content_markdown.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, searchQuery]);

  const handleVoteHelpful = async (articleId: string) => {
    if (votedArticleIds.has(articleId)) return;
    try {
      const res = await fetch(`/api/kb/${articleId}/helpful`, { method: 'POST' });
      if (res.ok) {
        const updated: KBArticle = await res.json();
        setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        if (selectedArticle?.id === updated.id) {
          setSelectedArticle(updated);
        }
        setVotedArticleIds((prev) => new Set(prev).add(articleId));
      }
    } catch (err) {
      console.error('Failed to vote article:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingArticleId(null);
    setFormTitle('');
    setFormCategory('Wi-Fi');
    setFormTags('wifi, eduroam');
    setFormSummary('');
    setFormContent('');
    setIsArticleModalOpen(true);
  };

  const handleOpenEditModal = (art: KBArticle) => {
    setEditingArticleId(art.id);
    setFormTitle(art.title);
    setFormCategory(art.category);
    setFormTags(art.tags.join(', '));
    setFormSummary(art.summary);
    setFormContent(art.content_markdown);
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) return;

    const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editingArticleId) {
        const res = await fetch(`/api/kb/${editingArticleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            category: formCategory,
            tags: tagsArray,
            summary: formSummary.trim(),
            content_markdown: formContent.trim(),
          }),
        });
        if (res.ok) {
          const updated: KBArticle = await res.json();
          setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          if (selectedArticle?.id === updated.id) setSelectedArticle(updated);
          setIsArticleModalOpen(false);
        }
      } else {
        const res = await fetch('/api/kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            category: formCategory,
            tags: tagsArray,
            summary: formSummary.trim(),
            content_markdown: formContent.trim(),
            is_published: true,
          }),
        });
        if (res.ok) {
          const created: KBArticle = await res.json();
          setArticles((prev) => [created, ...prev]);
          setIsArticleModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save article:', err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;
    try {
      const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        if (selectedArticle?.id === id) setSelectedArticle(null);
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  const renderCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi size={16} />;
    if (lower.includes('password') || lower.includes('netid')) return <KeyRound size={16} />;
    if (lower.includes('print')) return <Printer size={16} />;
    if (lower.includes('duo') || lower.includes('mfa')) return <ShieldCheck size={16} />;
    if (lower.includes('resnet')) return <Gamepad2 size={16} />;
    if (lower.includes('canvas')) return <BookOpen size={16} />;
    if (lower.includes('vpn')) return <Shield size={16} />;
    if (lower.includes('email') || lower.includes('mail')) return <Mail size={16} />;
    return <BookOpen size={16} />;
  };

  return (
    <div className="kb-wrapper">
      {selectedArticle ? (
        /* Single Article Reader View */
        <div className="article-reader-container">
          <div className="reader-toolbar">
            <button
              className="btn-secondary-sm"
              onClick={() => setSelectedArticle(null)}
            >
              <ArrowLeft size={14} />
              <span>Back to Help Center</span>
            </button>

            {userRole === 'admin' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary-sm"
                  onClick={() => handleOpenEditModal(selectedArticle)}
                >
                  <Edit size={13} />
                  <span>Edit Guide</span>
                </button>
                <button
                  className="btn-secondary-sm"
                  style={{ color: 'var(--danger-600)' }}
                  onClick={() => handleDeleteArticle(selectedArticle.id)}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          <article className="article-reader-card">
            <header className="article-reader-header">
              <div className="article-badge-row">
                <span className="category-tag">
                  {renderCategoryIcon(selectedArticle.category)}
                  <span style={{ marginLeft: 4 }}>{selectedArticle.category}</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {selectedArticle.read_time_mins} min read • Updated {new Date(selectedArticle.updated_at).toLocaleDateString()}
                </span>
              </div>

              <h1 className="article-headline">{selectedArticle.title}</h1>
              <p className="article-summary-lead">{selectedArticle.summary}</p>
            </header>

            <div className="article-markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedArticle.content_markdown}
              </ReactMarkdown>
            </div>

            <footer className="article-feedback-footer">
              <div className="feedback-question">
                <span>Was this guide helpful?</span>
                <button
                  className={`helpful-btn ${votedArticleIds.has(selectedArticle.id) ? 'voted' : ''}`}
                  onClick={() => handleVoteHelpful(selectedArticle.id)}
                  disabled={votedArticleIds.has(selectedArticle.id)}
                >
                  <ThumbsUp size={14} />
                  <span>
                    {votedArticleIds.has(selectedArticle.id)
                      ? `Helpful (${selectedArticle.helpful_count})`
                      : `Yes (${selectedArticle.helpful_count})`}
                  </span>
                </button>
              </div>

              {onOpenInResolverWithTopic && (
                <button
                  className="btn-primary-sm"
                  onClick={() => onOpenInResolverWithTopic(`I need help following the steps for: ${selectedArticle.title}`)}
                >
                  <Sparkles size={13} />
                  <span>Troubleshoot this with AI Assistant</span>
                </button>
              )}
            </footer>
          </article>
        </div>
      ) : (
        /* Directory View */
        <div className="kb-directory-container">
          {/* Header Banner */}
          <div className="kb-header-banner">
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Student IT Help Center</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Step-by-step connection instructions, password recovery, and software guides
              </p>
            </div>

            {userRole === 'admin' && (
              <button className="btn-primary-sm" onClick={handleOpenCreateModal}>
                <PlusCircle size={14} />
                <span>Publish New Guide</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="kb-search-bar-wrap">
            <div className="kb-search-input-box">
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search solutions (e.g. 'Eduroam iPhone', 'Canvas submit error', 'Duo push')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="kb-category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`kb-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="kb-articles-grid">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="kb-article-card"
                  onClick={() => setSelectedArticle(art)}
                >
                  <div className="kb-card-top">
                    <span className="category-tag">
                      {renderCategoryIcon(art.category)}
                      <span style={{ marginLeft: 4 }}>{art.category}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {art.read_time_mins}m read
                    </span>
                  </div>

                  <h3 className="kb-card-title">{art.title}</h3>
                  <p className="kb-card-desc">{art.summary}</p>

                  <div className="kb-card-footer">
                    <span>{art.helpful_count} students found this helpful</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      Read Guide <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="history-empty-state" style={{ gridColumn: '1 / -1' }}>
                <LifeBuoy size={36} style={{ color: 'var(--text-muted)' }} />
                <h3>No Help Guides Found</h3>
                <p>No guides match your search query. Try another keyword or open a diagnostic chat.</p>
                <button
                  className="btn-secondary-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Reset Search
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Article Create / Edit Modal */}
      {isArticleModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsArticleModalOpen(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <BookOpen size={18} style={{ color: 'var(--primary-600)' }} />
                <h3>{editingArticleId ? 'Edit IT Guide' : 'Publish New Help Guide'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsArticleModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Article Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Eduroam Wi-Fi Setup on Android 15"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="Wi-Fi">Wi-Fi</option>
                      <option value="Password">Password</option>
                      <option value="Canvas / LMS">Canvas / LMS</option>
                      <option value="Printing">Printing</option>
                      <option value="MFA / Duo">MFA / Duo</option>
                      <option value="ResNet">ResNet</option>
                      <option value="VPN">VPN</option>
                      <option value="Email">Email</option>
                      <option value="Software">Software</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="wifi, eduroam, android"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Summary Lead</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief 1-line overview of the solution"
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Guide Content (Markdown Supported)</label>
                  <textarea
                    rows={8}
                    className="form-textarea"
                    placeholder="### Step-by-step Instructions&#10;1. Open Settings -> Wi-Fi...&#10;2. Select Eduroam..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsArticleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!formTitle.trim() || !formSummary.trim() || !formContent.trim()}
                >
                  <Check size={14} />
                  <span>{editingArticleId ? 'Save Changes' : 'Publish Guide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
