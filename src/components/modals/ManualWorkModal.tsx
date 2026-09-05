import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Sparkles, BookOpen, Link, Tag as TagIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Author, WorkType, InclusionStatus, ReadStatus } from '../../types';

interface ManualWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualWorkModal: React.FC<ManualWorkModalProps> = ({ isOpen, onClose }) => {
  const { addWorkToProject, tags: projectTags } = useApp();
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [venue, setVenue] = useState('');
  const [type, setType] = useState<WorkType>('journal-article');
  const [doi, setDoi] = useState('');
  const [openAlexId, setOpenAlexId] = useState('');
  const [semanticScholarId, setSemanticScholarId] = useState('');
  const [isbn, setIsbn] = useState('');
  const [abstract, setAbstract] = useState('');
  const [citationCount, setCitationCount] = useState<number>(0);
  const [referenceCount, setReferenceCount] = useState<number>(0);
  const [openAccessUrl, setOpenAccessUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  
  const [authors, setAuthors] = useState<Author[]>([
    { name: '', affiliation: '', orcid: '' }
  ]);
  
  const [inclusionStatus, setInclusionStatus] = useState<InclusionStatus>('included');
  const [readStatus, setReadStatus] = useState<ReadStatus>('unread');
  const [personalNotes, setPersonalNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAuthor = () => {
    setAuthors([...authors, { name: '', affiliation: '', orcid: '' }]);
  };

  const handleRemoveAuthor = (idx: number) => {
    if (authors.length <= 1) return;
    setAuthors(authors.filter((_, i) => i !== idx));
  };

  const handleAuthorChange = (idx: number, field: keyof Author, value: string) => {
    const updated = [...authors];
    updated[idx] = { ...updated[idx], [field]: value };
    setAuthors(updated);
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const validAuthors = authors.filter(a => a.name.trim().length > 0);
    if (validAuthors.length === 0) {
      setError('At least one author name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await addWorkToProject({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        year: Number(year) || new Date().getFullYear(),
        venue: venue.trim() || undefined,
        type,
        doi: doi.trim() || undefined,
        openAlexId: openAlexId.trim() || undefined,
        semanticScholarId: semanticScholarId.trim() || undefined,
        isbn: isbn.trim() || undefined,
        abstract: abstract.trim() || undefined,
        citationCount: Number(citationCount) || 0,
        referenceCount: Number(referenceCount) || 0,
        references: [],
        citedBy: [],
        openAccessUrl: openAccessUrl.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        pdfUrl: pdfUrl.trim() || undefined,
        authors: validAuthors,
        provenance: {
          provider: 'Manual Entry',
          retrievedAt: new Date().toISOString(),
          confidenceScore: 1.0
        }
      }, {
        inclusionStatus,
        readStatus,
        notes: personalNotes.trim(),
        tags: selectedTags
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add work');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-scholarly text-stone-900">
                Manual Scholarly Work Entry
              </h2>
              <p className="text-xs text-stone-500">
                Normalized domain schema with field-level provenance recording
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Work Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Deep Residual Learning for Image Recognition"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g., An Empirical Investigation into Gradient Highway Topologies"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden"
              />
            </div>
          </div>

          {/* Authors List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Authors ({authors.length}) *
              </label>
              <button
                type="button"
                onClick={handleAddAuthor}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Author
              </button>
            </div>

            <div className="space-y-2">
              {authors.map((author, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={author.name}
                      onChange={e => handleAuthorChange(idx, 'name', e.target.value)}
                      placeholder="Author Name (e.g., Kaiming He)"
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900 outline-hidden"
                    />
                    <input
                      type="text"
                      value={author.affiliation || ''}
                      onChange={e => handleAuthorChange(idx, 'affiliation', e.target.value)}
                      placeholder="Affiliation (e.g., FAIR / MIT)"
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900 outline-hidden"
                    />
                    <input
                      type="text"
                      value={author.orcid || ''}
                      onChange={e => handleAuthorChange(idx, 'orcid', e.target.value)}
                      placeholder="ORCID (e.g., 0000-0002-1825-0097)"
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900 outline-hidden font-mono"
                    />
                  </div>
                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Remove author"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Year, Venue, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Publication Year *
              </label>
              <input
                type="number"
                min="1800"
                max="2100"
                required
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Venue / Journal
              </label>
              <input
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g., CVPR / Nature / JMLR"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Publication Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as WorkType)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              >
                <option value="journal-article">Journal Article</option>
                <option value="conference-paper">Conference Paper</option>
                <option value="preprint">Preprint (arXiv/bioRxiv)</option>
                <option value="review">Systematic Review</option>
                <option value="book-chapter">Book Chapter</option>
                <option value="book">Book</option>
                <option value="dissertation">Dissertation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                DOI
              </label>
              <input
                type="text"
                value={doi}
                onChange={e => setDoi(e.target.value)}
                placeholder="10.1109/CVPR.2016.90"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                OpenAlex ID
              </label>
              <input
                type="text"
                value={openAlexId}
                onChange={e => setOpenAlexId(e.target.value)}
                placeholder="W2964344569"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Semantic Scholar ID
              </label>
              <input
                type="text"
                value={semanticScholarId}
                onChange={e => setSemanticScholarId(e.target.value)}
                placeholder="204e3073870f..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-mono outline-hidden"
              />
            </div>
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Abstract
            </label>
            <textarea
              rows={4}
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              placeholder="Paste full paper abstract here..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-hidden"
            />
          </div>

          {/* Citation & Reference Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Citation Count
              </label>
              <input
                type="number"
                min="0"
                value={citationCount}
                onChange={e => setCitationCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Open Access URL / PDF
              </label>
              <input
                type="url"
                value={openAccessUrl}
                onChange={e => setOpenAccessUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/1512.03385"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 outline-hidden"
              />
            </div>
          </div>

          {/* Project Inclusion & Review Settings */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              Project Library Assignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Inclusion Status</label>
                <select
                  value={inclusionStatus}
                  onChange={e => setInclusionStatus(e.target.value as InclusionStatus)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900"
                >
                  <option value="included">Included in Synthesis</option>
                  <option value="candidate">Candidate for Review</option>
                  <option value="excluded">Excluded / Borderline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Read Status</label>
                <select
                  value={readStatus}
                  onChange={e => setReadStatus(e.target.value as ReadStatus)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900"
                >
                  <option value="unread">Unread</option>
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed / Annotated</option>
                </select>
              </div>
            </div>

            {projectTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Assign Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {projectTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                          isSelected 
                            ? 'bg-emerald-800 text-white border-emerald-800 font-medium'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Initial Research Notes</label>
              <textarea
                rows={2}
                value={personalNotes}
                onChange={e => setPersonalNotes(e.target.value)}
                placeholder="Methodological significance, empirical flags, or synthesis notes..."
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-md text-xs text-stone-900 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Work...' : 'Save to Project Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
