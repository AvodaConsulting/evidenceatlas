import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Quote, 
  BookOpen, 
  User, 
  Clock, 
  Tag as TagIcon,
  Sparkles, 
  HelpCircle,
  CornerDownRight,
  Send,
  AtSign,
  Users
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ClaimType } from '../../../types';

export const NotesTab: React.FC = () => {
  const { 
    annotations, 
    createAnnotation, 
    addAnnotationReply,
    deleteAnnotation, 
    activeProjectWorksList, 
    currentUser, 
    permissions,
    activeProject,
    workspaceMembers,
    works
  } = useApp();

  const [selectedWorkId, setSelectedWorkId] = useState<string>(activeProjectWorksList[0]?.workId || '');
  const [claimType, setClaimType] = useState<ClaimType>('methodological');
  const [quoteText, setQuoteText] = useState('');
  const [passageReference, setPassageReference] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thread reply states
  const [activeReplyAnnId, setActiveReplyAnnId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyMentions, setReplyMentions] = useState<string[]>([]);

  const projectAnnotations = annotations.filter(a => a.projectId === activeProject?.id);

  const toggleMention = (email: string) => {
    setSelectedMentions(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleReplyMention = (email: string) => {
    setReplyMentions(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId) {
      setError('Please select a scholarly work from your library.');
      return;
    }
    if (!annotationText.trim()) {
      setError('Annotation note text is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createAnnotation({
        workId: selectedWorkId,
        text: annotationText.trim(),
        quoteText: quoteText.trim() || undefined,
        passageReference: passageReference.trim() || undefined,
        claimType,
        mentions: selectedMentions.length > 0 ? selectedMentions : undefined
      });
      setAnnotationText('');
      setQuoteText('');
      setPassageReference('');
      setSelectedMentions([]);
    } catch (err: any) {
      setError(err.message || 'Failed to post annotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReply = async (annotationId: string) => {
    if (!replyText.trim()) return;
    try {
      await addAnnotationReply(annotationId, replyText.trim(), replyMentions);
      setReplyText('');
      setReplyMentions([]);
      setActiveReplyAnnId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to post reply');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left 2 Cols: Collaborative Annotation Stream */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold font-serif-scholarly text-slate-900">
              Collaborative Annotation Stream ({projectAnnotations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Real-time peer commentary & threaded notes
          </span>
        </div>

        {projectAnnotations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold font-serif-scholarly text-slate-800">
              No passage annotations recorded yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the composer on the right to annotate methodology, tag collaborators with @-mentions, or record author inferences.
            </p>
          </div>
        ) : (
          projectAnnotations.map(ann => {
            const matchedWork = works.find(w => w.id === ann.workId);
            const isOwner = ann.userId === currentUser.id;

            let badgeColor = 'bg-slate-100 text-slate-800';
            if (ann.claimType === 'support') badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (ann.claimType === 'contradict') badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
            if (ann.claimType === 'methodological') badgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
            if (ann.claimType === 'author_inference') badgeColor = 'bg-sky-50 text-sky-900 border-sky-200';

            return (
              <div 
                key={ann.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {ann.userAvatar ? (
                      <img src={ann.userAvatar} alt="" className="w-7 h-7 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {ann.userName[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          {ann.userName}
                        </span>
                        {ann.userEmail && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({ann.userEmail})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {ann.claimType.replace('_', ' ')}
                    </span>

                    {(isOwner || permissions.canDeleteAnyAnnotation) && (
                      <button
                        onClick={() => deleteAnnotation(ann.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete annotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Referenced Work */}
                {matchedWork && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Referenced Literature
                    </span>
                    <span className="font-bold font-serif-scholarly text-slate-900 block">
                      {matchedWork.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {matchedWork.authors[0]?.name} et al., {matchedWork.year} {ann.passageReference && `• ${ann.passageReference}`}
                    </span>
                  </div>
                )}

                {/* Verbatim quote */}
                {ann.quoteText && (
                  <div className="bg-amber-50/50 border-l-2 border-amber-600 p-2.5 rounded-r-lg text-xs italic font-serif-scholarly text-slate-800">
                    "{ann.quoteText}"
                  </div>
                )}

                {/* Annotation Text */}
                <p className="text-xs text-slate-800 leading-relaxed">
                  {ann.text}
                </p>

                {/* Mentions Tags */}
                {ann.mentions && ann.mentions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> Notified:
                    </span>
                    {ann.mentions.map(email => (
                      <span key={email} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">
                        {email}
                      </span>
                    ))}
                  </div>
                )}

                {/* THREADED REPLIES */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {ann.replies && ann.replies.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                      {ann.replies.map(reply => (
                        <div key={reply.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{reply.userName}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-700">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Button / Box */}
                  {activeReplyAnnId === ann.id ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span>Replying to thread</span>
                        <button 
                          onClick={() => setActiveReplyAnnId(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Mention:</span>
                          {workspaceMembers.filter(m => m.userEmail !== currentUser.email).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleReplyMention(m.userEmail)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                replyMentions.includes(m.userEmail)
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              @{m.userName}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handlePostReply(ann.id)}
                          disabled={!replyText.trim()}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActiveReplyAnnId(ann.id); setReplyText(''); setReplyMentions([]); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 pt-1"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Reply to thread ({ann.replies?.length || 0})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Right Col: New Annotation Composer */}
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-20 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold font-serif-scholarly text-slate-900">
              New Annotation
            </h4>
          </div>

          <form onSubmit={handleAddAnnotation} className="space-y-3 text-xs">
            {error && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Literature *
              </label>
              <select
                value={selectedWorkId}
                onChange={e => setSelectedWorkId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              >
                {activeProjectWorksList.length === 0 ? (
                  <option value="">No works available in library</option>
                ) : (
                  activeProjectWorksList.map(pw => (
                    <option key={pw.workId} value={pw.workId}>
                      {pw.work.title.substring(0, 45)}... ({pw.work.year})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Claim Annotation Type *
              </label>
              <select
                value={claimType}
                onChange={e => setClaimType(e.target.value as ClaimType)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              >
                <option value="methodological">Methodological Critique</option>
                <option value="support">Supporting Evidence</option>
                <option value="contradict">Contradictory / Disputing</option>
                <option value="author_inference">[AUTHOR INFERENCE] Reasoning</option>
                <option value="contextual">Contextual Background</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verbatim Quote (Optional)
              </label>
              <textarea
                rows={2}
                value={quoteText}
                onChange={e => setQuoteText(e.target.value)}
                placeholder="Exact snippet from paper..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 italic font-serif-scholarly"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Page / Section Reference
              </label>
              <input
                type="text"
                value={passageReference}
                onChange={e => setPassageReference(e.target.value)}
                placeholder="e.g., Section 4.1, Table 2"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Commentary / Synthesis Note *
              </label>
              <textarea
                required
                rows={3}
                value={annotationText}
                onChange={e => setAnnotationText(e.target.value)}
                placeholder="Synthesize finding, note potential confounders, or compare with other works..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
            </div>

            {/* Mention Teammates */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-slate-400" />
                <span>Mention Workspace Collaborators</span>
              </label>
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {workspaceMembers.filter(m => m.userEmail !== currentUser.email).length === 0 ? (
                  <span className="text-slate-400 text-[11px] italic">No other members in workspace</span>
                ) : (
                  workspaceMembers.filter(m => m.userEmail !== currentUser.email).map(m => {
                    const isSelected = selectedMentions.includes(m.userEmail);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMention(m.userEmail)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>@{m.userName}</span>
                        <span className="opacity-60 text-[9px]">({m.role})</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {permissions.canCreateAnnotations ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Annotation'}
              </button>
            ) : (
              <p className="text-center text-xs text-slate-400 italic">
                Viewers cannot submit annotations.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
