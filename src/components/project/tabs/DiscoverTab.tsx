import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  Plus, 
  Check, 
  Filter, 
  Upload, 
  SlidersHorizontal,
  ExternalLink, 
  Sparkles, 
  Info, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  RotateCcw,
  X,
  HelpCircle,
  Trash2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Work } from '../../../types';
import { PaperExplorer } from '../../explorer/PaperExplorer';
import { ManualWorkModal } from '../../modals/ManualWorkModal';
import { ImportPapersModal } from '../../modals/ImportPapersModal';
import { SciteStatementsDrawer } from '../../evidence/SciteStatementsDrawer';

export const DiscoverTab: React.FC = () => {
  const { 
    executeSearch, 
    works, 
    addWorkToProject, 
    removeWorkFromProject, 
    activeProjectWorksList, 
    studyQueue, 
    addToStudyQueue, 
    explorerWork, 
    openPaperInExplorer, 
    setExplorerWork, 
    showToast, 
    activeProject,
    dismissedGuide,
    setDismissedGuide,
    dismissedCandidateHint,
    setDismissedCandidateHint,
    dismissedFirstAddHint,
    setDismissedFirstAddHint,
    loadDemonstrationData,
    removeDemonstrationData,
    hasDemonstrationData,
    setIsHelpModalOpen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Work[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Filters (collapsed by default)
  const [showFilters, setShowFilters] = useState(false);
  const [filterYearMin, setFilterYearMin] = useState<number>(2015);
  const [filterYearMax, setFilterYearMax] = useState<number>(new Date().getFullYear());
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Drawer for Scite Evidence
  const [drawerWork, setDrawerWork] = useState<Work | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Expanded abstract per result
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Expanded details per result
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Handle Search Execution
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);
      setVisibleCount(12);

      const results = await executeSearch(searchQuery.trim(), {
        yearMin: filterYearMin,
        yearMax: filterYearMax,
        openAccessOnly
      });

      let filtered = results;
      if (openAccessOnly) {
        filtered = filtered.filter(w => !!w.openAccessUrl || !!w.pdfUrl);
      }
      if (filterYearMin) {
        filtered = filtered.filter(w => !w.year || w.year >= filterYearMin);
      }
      if (filterYearMax) {
        filtered = filtered.filter(w => !w.year || w.year <= filterYearMax);
      }

      setSearchResults(filtered);
    } catch (err: any) {
      setSearchError('We could not retrieve papers right now. Your saved project is unchanged.');
    } finally {
      setIsSearching(false);
    }
  };

  // Quick Add to My Papers
  const handleAddToMyPapers = async (targetWork: Work) => {
    const isFirstAdd = activeProjectWorksList.length === 0 || !dismissedFirstAddHint;
    try {
      await addWorkToProject(targetWork, { inclusionStatus: 'included' });
      if (isFirstAdd) {
        showToast('Good. Your project is now growing from papers you chose.');
        setDismissedFirstAddHint(true);
      } else {
        showToast(
          'Added to My Papers.',
          'Undo',
          async () => {
            const match = activeProjectWorksList.find(pw => pw.workId === targetWork.id);
            if (match) {
              await removeWorkFromProject(match.id);
              showToast('Removed from My Papers.');
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Error adding to My Papers:', err);
    }
  };

  // Quick Add to Read Next
  const handleAddToReadNext = async (targetWork: Work) => {
    if (studyQueue.length >= 20) {
      showToast('You already have a substantial reading list. Review it before adding more.');
    }
    try {
      await addToStudyQueue(targetWork, undefined, undefined, 'Selected from search results');
      showToast('Added to Read Next.');
    } catch (err: any) {
      console.error('Error adding to Read Next:', err);
    }
  };

  // If Paper Explorer is active, render PaperExplorer
  if (explorerWork) {
    return (
      <PaperExplorer 
        work={explorerWork} 
        onBackToSearch={() => setExplorerWork(null)} 
      />
    );
  }

  const displayedResults = searchResults.slice(0, visibleCount);
  const isProjectEmpty = activeProjectWorksList.length === 0;

  return (
    <div className="space-y-6">
      {/* Demonstration Data Banner */}
      {hasDemonstrationData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-indigo-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Demonstration Mode Active:</strong> You are viewing example papers. You can remove them at any time to start your own research.
            </span>
          </div>
          <button
            type="button"
            onClick={removeDemonstrationData}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-md font-semibold shrink-0 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Remove demo data</span>
          </button>
        </div>
      )}

      {/* 1. Header / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        {!hasSearched ? (
          /* Empty / Initial State */
          <div className="space-y-8">
            <div className={`grid grid-cols-1 ${isProjectEmpty && !dismissedGuide ? 'lg:grid-cols-12 gap-8 items-start' : 'max-w-2xl mx-auto'}`}>
              {/* Main Search Column */}
              <div className={`${isProjectEmpty && !dismissedGuide ? 'lg:col-span-7' : 'w-full'} text-center lg:text-left space-y-6`}>
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif-scholarly text-slate-900 tracking-tight">
                    Start with one paper
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                    Search by title, DOI, author, or keywords. Then explore what it builds on, what builds on it, and related work.
                  </p>
                </div>

                {/* Single Large Search Field */}
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a paper, DOI, author, or topic..."
                      className="w-full pl-12 pr-28 py-3.5 text-sm sm:text-base bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl shadow-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </form>

                {/* Actions Row */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={loadDemonstrationData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg font-semibold transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Try with an example</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Import Zotero / BibTeX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span>Add manually</span>
                  </button>
                </div>
              </div>

              {/* 4-Step Visual Guide for Empty Projects */}
              {isProjectEmpty && !dismissedGuide && (
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100/80 rounded-xl p-5 shadow-2xs relative">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      How It Works
                    </span>
                    <button
                      type="button"
                      onClick={() => setDismissedGuide(true)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                      title="Dismiss guide"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <strong className="text-xs text-slate-900 block font-semibold">1. Find a paper</strong>
                        <p className="text-[11px] text-slate-600 leading-snug">Search for one key paper you know or want to begin with.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <strong className="text-xs text-slate-900 block font-semibold">2. Explore from it</strong>
                        <p className="text-[11px] text-slate-600 leading-snug">Branch into what it cites, what cites it, or related papers.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <strong className="text-xs text-slate-900 block font-semibold">3. Keep useful papers</strong>
                        <p className="text-[11px] text-slate-600 leading-snug">Save only the essential papers into your project.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        <strong className="text-xs text-slate-900 block font-semibold">4. Read and write with evidence</strong>
                        <p className="text-[11px] text-slate-600 leading-snug">Take notes and ground claims directly in verified literature.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Search Bar in Header */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a paper, DOI, author, or topic..."
                  className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    showFilters 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter results</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasSearched(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Published from year
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={new Date().getFullYear()}
                    value={filterYearMin}
                    onChange={(e) => setFilterYearMin(parseInt(e.target.value) || 2010)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Published up to year
                  </label>
                  <input
                    type="number"
                    min={1950}
                    max={new Date().getFullYear()}
                    value={filterYearMax}
                    onChange={(e) => setFilterYearMax(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={openAccessOnly}
                      onChange={(e) => setOpenAccessOnly(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Open Access PDFs only</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Search Results List */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Contextual Hint on Candidate List */}
          {!dismissedCandidateHint && searchResults.length > 0 && !isSearching && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-indigo-950 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-indigo-900">Orientation Guide</span>
                  <span className="text-indigo-800">
                    Keep only the papers you may genuinely want to study. You can always explore further later.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedCandidateHint(true)}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded transition-colors"
                title="Dismiss hint"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isSearching ? 'Searching literature...' : `${searchResults.length} papers found`}
            </span>
          </div>

          {isSearching ? (
            <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying OpenAlex, Crossref, and citation databases...</span>
            </div>
          ) : searchError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              {searchError}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
              <p>No papers found matching "{searchQuery}".</p>
              <p className="text-slate-400">Try broadening your search terms or adjusting the year filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedResults.map((work) => {
                const inProject = activeProjectWorksList.some(pw => pw.workId === work.id);
                const inQueue = studyQueue.some(item => item.workId === work.id);
                const isAbstractExpanded = !!expandedAbstracts[work.id];
                const isDetailsExpanded = !!expandedDetails[work.id];

                return (
                  <div
                    key={work.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs transition-all space-y-3"
                  >
                    {/* Header: Year & Venue */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {work.year || 'Unknown Year'}
                      </span>
                      {work.venue && (
                        <span className="text-[11px] font-medium text-slate-500 italic truncate max-w-md">
                          {work.venue}
                        </span>
                      )}
                      {work.citationCount > 0 && (
                        <span className="text-[11px] font-medium text-slate-500 ml-auto">
                          {work.citationCount.toLocaleString()} Citations
                        </span>
                      )}
                    </div>

                    {/* Title & Authors */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-serif-scholarly text-slate-900 leading-snug">
                        {work.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {(work.authors || []).map(a => a?.name).filter(Boolean).join(', ') || 'Unknown Authors'}
                      </p>
                    </div>

                    {/* Abstract Preview */}
                    {work.abstract && (
                      <div className="text-xs text-slate-700 leading-relaxed font-serif-scholarly">
                        <p className={isAbstractExpanded ? '' : 'line-clamp-2'}>
                          {work.abstract}
                        </p>
                        {work.abstract.length > 180 && (
                          <button
                            type="button"
                            onClick={() => setExpandedAbstracts(prev => ({ ...prev, [work.id]: !prev[work.id] }))}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold mt-1 inline-flex items-center"
                          >
                            {isAbstractExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {/* Left: Primary "Open paper" and "Add to My Papers" */}
                      <div className="flex items-center gap-2">
                        {/* Primary Action: Open paper -> launches Paper Explorer */}
                        <button
                          type="button"
                          onClick={() => openPaperInExplorer(work)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Open paper</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Secondary Quick Add */}
                        {inProject ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            In My Papers
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToMyPapers(work)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-600" />
                            Add to My Papers
                          </button>
                        )}

                        {inQueue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            In Read Next
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToReadNext(work)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
                          >
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Read Next
                          </button>
                        )}
                      </div>

                      {/* Right: Details & Evidence */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerWork(work);
                            setDrawerOpen(true);
                          }}
                          className="text-xs text-slate-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Evidence</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedDetails(prev => ({ ...prev, [work.id]: !prev[work.id] }))}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-0.5"
                        >
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isDetailsExpanded ? 'Hide details' : 'Details'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isDetailsExpanded && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1 animate-in fade-in">
                        <div>
                          <span className="font-semibold text-slate-500">DOI: </span>
                          {work.doi ? (
                            <a 
                              href={`https://doi.org/${work.doi}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-600 hover:underline font-mono"
                            >
                              {work.doi}
                            </a>
                          ) : 'Not available'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Source: </span>
                          <span>{work.provenance?.provider || 'OpenAlex'}</span>
                        </div>
                        {work.openAccessUrl && (
                          <div className="pt-1">
                            <a 
                              href={work.openAccessUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Open Access PDF
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Safeguard: Showing initial 12 candidates message & Load more */}
              {searchResults.length > visibleCount && (
                <div className="pt-4 pb-2 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Showing the most relevant starting set. Load more only if needed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Show more results ({searchResults.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Work Modal */}
      <ManualWorkModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
      />

      {/* Import Papers Modal */}
      <ImportPapersModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />

      {/* Scite Evidence Drawer */}
      {drawerWork && (
        <SciteStatementsDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          work={drawerWork}
        />
      )}
    </div>
  );
};
