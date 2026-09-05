import { 
  User, 
  Workspace, 
  WorkspaceMember, 
  Project, 
  Work, 
  ProjectWork, 
  Annotation, 
  Tag, 
  SearchLog, 
  EvidenceRecord, 
  AuditEvent,
  ProjectCandidateState,
  StudyQueueItem
} from '../types';

export const SAMPLE_USER: User = {
  id: 'usr_andy_01',
  email: 'andy@avoda.hk',
  displayName: 'Dr. Andy Vance',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  affiliation: 'Institute for Epistemic Systems & Research Integrity',
  orcid: '0000-0002-1825-0097',
  createdAt: '2026-01-10T08:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z'
};

export const SAMPLE_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem_01',
    workspaceId: 'ws_epistemic_01',
    userId: 'usr_andy_01',
    userEmail: 'andy@avoda.hk',
    userName: 'Dr. Andy Vance',
    role: 'owner',
    joinedAt: '2026-01-10T08:00:00.000Z',
    invitedBy: 'system'
  },
  {
    id: 'mem_02',
    workspaceId: 'ws_epistemic_01',
    userId: 'usr_elena_02',
    userEmail: 'elena.rostova@cam.ac.uk',
    userName: 'Dr. Elena Rostova',
    role: 'editor',
    joinedAt: '2026-01-15T14:30:00.000Z',
    invitedBy: 'usr_andy_01'
  },
  {
    id: 'mem_03',
    workspaceId: 'ws_epistemic_01',
    userId: 'usr_marcus_03',
    userEmail: 'm.chen@stanford.edu',
    userName: 'Marcus Chen',
    role: 'commenter',
    joinedAt: '2026-02-01T10:00:00.000Z',
    invitedBy: 'usr_andy_01'
  },
  {
    id: 'mem_04',
    workspaceId: 'ws_epistemic_01',
    userId: 'usr_sarah_04',
    userEmail: 's.jenkins@ox.ac.uk',
    userName: 'Sarah Jenkins',
    role: 'viewer',
    joinedAt: '2026-02-10T09:15:00.000Z',
    invitedBy: 'usr_andy_01'
  }
];

export const SAMPLE_WORKSPACE: Workspace = {
  id: 'ws_epistemic_01',
  name: 'AI Rigor & Metascience Lab',
  description: 'Evidence-grounded workspace dedicated to systematic literature synthesis, citation integrity auditing, and reproducibility verification.',
  ownerId: 'usr_andy_01',
  isPrivate: true,
  providerSettings: {
    openAlexEnabled: true,
    crossrefEnabled: true,
    semanticScholarEnabled: true,
    sciteEnabled: true,
    politeEmail: 'andy@avoda.hk',
    rateLimitPerMinute: 60
  },
  createdAt: '2026-01-10T08:00:00.000Z',
  updatedAt: '2026-09-02T16:00:00.000Z',
  deletedAt: null
};

export const SAMPLE_PROJECT: Project = {
  id: 'proj_citation_dynamics_01',
  workspaceId: 'ws_epistemic_01',
  title: 'Foundation Model Evaluation & Reproducibility Synthesis',
  researchQuestion: 'How do evaluation metric choices and reporting protocols influence claims of emergent capabilities in foundation models?',
  discipline: 'Computer Science / Machine Learning & Metascience',
  description: 'A systematic evidence audit and citation synthesis tracing transformer architectures, capability metrics, reproducibility checklists, and citation classification.',
  initialKeywords: ['Emergent Abilities', 'Foundation Models', 'Reproducibility', 'Evaluation Metrics', 'Self-Attention'],
  isPrivate: true,
  createdBy: 'usr_andy_01',
  status: 'active',
  createdAt: '2026-01-12T10:00:00.000Z',
  updatedAt: '2026-09-03T11:20:00.000Z',
  deletedAt: null
};

export const SAMPLE_TAGS: Tag[] = [
  { id: 'tag_1', projectId: 'proj_citation_dynamics_01', name: 'Foundational Architecture', color: '#059669', description: 'Core benchmark or fundamental architecture paper', createdAt: '2026-01-12T10:00:00.000Z' },
  { id: 'tag_2', projectId: 'proj_citation_dynamics_01', name: 'Evaluation & Metrics', color: '#d97706', description: 'Capability benchmarks and metric sensitivity analyses', createdAt: '2026-01-12T10:05:00.000Z' },
  { id: 'tag_3', projectId: 'proj_citation_dynamics_01', name: 'Reproducibility', color: '#2563eb', description: 'Empirical protocols, checklists, and verification standards', createdAt: '2026-01-12T10:10:00.000Z' },
  { id: 'tag_4', projectId: 'proj_citation_dynamics_01', name: 'Evidence Synthesis', color: '#7c3aed', description: 'Systematic reviews, PRISMA guidelines, and citation indexing', createdAt: '2026-01-12T10:15:00.000Z' }
];

export const SAMPLE_WORKS: Work[] = [
  {
    id: 'work_vaswani_2017',
    doi: '10.48550/arXiv.1706.03762',
    openAlexId: 'W2964344569',
    semanticScholarId: '204e3073870fae3d05bcbc2f6a8e263d9b72e776',
    sciteId: 'scite_vaswani_2017',
    title: 'Attention Is All You Need',
    subtitle: 'The Architectural Genesis of Modern Sequence Transduction',
    authors: [
      { name: 'Ashish Vaswani', affiliation: 'Google Brain' },
      { name: 'Noam Shazeer', affiliation: 'Google Brain' },
      { name: 'Niki Parmar', affiliation: 'Google Research' },
      { name: 'Jakob Uszkoreit', affiliation: 'Google Research' },
      { name: 'Llion Jones', affiliation: 'Google Research' },
      { name: 'Aidan N. Gomez', affiliation: 'University of Toronto' },
      { name: 'Łukasz Kaiser', affiliation: 'Google Brain' },
      { name: 'Illia Polosukhin', affiliation: '' }
    ],
    year: 2017,
    venue: 'Advances in Neural Information Processing Systems (NeurIPS 30)',
    type: 'conference-paper',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    citationCount: 124500,
    referenceCount: 42,
    references: ['work_bahdanau_2014', 'work_sutskever_2014'],
    citedBy: ['work_devlin_2018', 'work_brown_2020', 'work_bommasani_2021', 'work_schaeffer_2023', 'work_pineau_2021'],
    openAccessUrl: 'https://arxiv.org/abs/1706.03762',
    sourceUrl: 'https://proceedings.neurips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html',
    pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
    disciplines: ['Computer Science', 'Machine Learning', 'Natural Language Processing'],
    keywords: ['Transformer', 'Self-Attention', 'Sequence-to-Sequence', 'Neural Networks'],
    provenance: {
      provider: 'OpenAlex',
      retrievedAt: '2026-01-12T10:02:00.000Z',
      queryId: '10.48550/arXiv.1706.03762',
      rawId: 'W2964344569',
      license: 'CC-BY-4.0',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:02:00.000Z',
    updatedAt: '2026-01-12T10:02:00.000Z'
  },
  {
    id: 'work_devlin_2018',
    doi: '10.48550/arXiv.1810.04805',
    openAlexId: 'W2899478796',
    semanticScholarId: 'df2b0e26d0599ce3e70df8a9da02e51594e0e992',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: [
      { name: 'Jacob Devlin', affiliation: 'Google AI Language' },
      { name: 'Ming-Wei Chang', affiliation: 'Google AI Language' },
      { name: 'Kenton Lee', affiliation: 'Google AI Language' },
      { name: 'Kristina Toutanova', affiliation: 'Google AI Language' }
    ],
    year: 2018,
    venue: 'Proceedings of NAACL-HLT 2019, Minneapolis, USA',
    type: 'conference-paper',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
    citationCount: 78900,
    referenceCount: 45,
    references: ['work_vaswani_2017'],
    citedBy: ['work_brown_2020', 'work_bommasani_2021'],
    openAccessUrl: 'https://arxiv.org/abs/1810.04805',
    sourceUrl: 'https://aclanthology.org/N19-1423/',
    pdfUrl: 'https://arxiv.org/pdf/1810.04805.pdf',
    disciplines: ['Computer Science', 'Natural Language Processing'],
    keywords: ['BERT', 'Bidirectional Encoder', 'Pre-training', 'Transfer Learning'],
    provenance: {
      provider: 'Crossref',
      retrievedAt: '2026-01-12T10:04:00.000Z',
      queryId: '10.48550/arXiv.1810.04805',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:04:00.000Z',
    updatedAt: '2026-01-12T10:04:00.000Z'
  },
  {
    id: 'work_brown_2020',
    doi: '10.48550/arXiv.2005.14165',
    openAlexId: 'W3032734493',
    semanticScholarId: '6b5e43a911765df06e6a12b489a31821df26e821',
    title: 'Language Models are Few-Shot Learners',
    authors: [
      { name: 'Tom B. Brown', affiliation: 'OpenAI' },
      { name: 'Benjamin Mann', affiliation: 'OpenAI' },
      { name: 'Nick Ryder', affiliation: 'OpenAI' },
      { name: 'Melanie Subbiah', affiliation: 'OpenAI' },
      { name: 'Jared Kaplan', affiliation: 'Johns Hopkins University & OpenAI' },
      { name: 'Dario Amodei', affiliation: 'OpenAI' }
    ],
    year: 2020,
    venue: 'Advances in Neural Information Processing Systems (NeurIPS 2020)',
    type: 'conference-paper',
    abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
    citationCount: 31500,
    referenceCount: 82,
    references: ['work_vaswani_2017', 'work_devlin_2018'],
    citedBy: ['work_bommasani_2021', 'work_schaeffer_2023'],
    openAccessUrl: 'https://arxiv.org/abs/2005.14165',
    sourceUrl: 'https://proceedings.neurips.cc/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html',
    pdfUrl: 'https://arxiv.org/pdf/2005.14165.pdf',
    disciplines: ['Computer Science', 'Machine Learning', 'Artificial Intelligence'],
    keywords: ['GPT-3', 'Few-Shot Learning', 'In-Context Learning', 'Scaling Laws'],
    provenance: {
      provider: 'OpenAlex',
      retrievedAt: '2026-01-12T10:06:00.000Z',
      queryId: '10.48550/arXiv.2005.14165',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:06:00.000Z',
    updatedAt: '2026-01-12T10:06:00.000Z'
  },
  {
    id: 'work_schaeffer_2023',
    doi: '10.48550/arXiv.2304.15004',
    openAlexId: 'W4376483921',
    semanticScholarId: 'b78a067ff2d97858c28fa4d764720e9721ee85e1',
    sciteId: 'scite_schaeffer_2023',
    title: 'Are Emergent Abilities of Large Language Models a Mirage?',
    authors: [
      { name: 'Rylan Schaeffer', affiliation: 'Stanford University' },
      { name: 'Brando Miranda', affiliation: 'Stanford University' },
      { name: 'Sanmi Koyejo', affiliation: 'Stanford University' }
    ],
    year: 2023,
    venue: 'Advances in Neural Information Processing Systems (NeurIPS 2023 Outstanding Paper)',
    type: 'conference-paper',
    abstract: 'Recent work claims that large language models display emergent abilities, abilities that are not present in smaller-scale models but are present in larger-scale models. Here we present an alternative explanation: that emergent abilities appear due to the researcher choice of evaluation metric rather than changes in the model family behavior.',
    citationCount: 890,
    referenceCount: 65,
    references: ['work_vaswani_2017', 'work_brown_2020', 'work_bommasani_2021'],
    citedBy: [],
    openAccessUrl: 'https://arxiv.org/abs/2304.15004',
    sourceUrl: 'https://openreview.net/forum?id=ITw9edRDlD',
    pdfUrl: 'https://arxiv.org/pdf/2304.15004.pdf',
    disciplines: ['Machine Learning Theory', 'Benchmarking Heuristics', 'Metascience'],
    keywords: ['Emergence', 'Nonlinear Metrics', 'Resolution Artifacts', 'Epistemic Claims'],
    provenance: {
      provider: 'OpenAlex',
      retrievedAt: '2026-01-12T10:08:00.000Z',
      queryId: '10.48550/arXiv.2304.15004',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:08:00.000Z',
    updatedAt: '2026-01-12T10:08:00.000Z'
  },
  {
    id: 'work_pineau_2021',
    doi: '10.5555/3455716.3455874',
    openAlexId: 'W3125749201',
    semanticScholarId: '8f75b25330349635b7199c15b1bb7ca2cfdbd0a1',
    title: 'Improving Reproducibility in Machine Learning Research',
    subtitle: 'A Report from the NeurIPS 2019 Reproducibility Program',
    authors: [
      { name: 'Joelle Pineau', affiliation: 'McGill University & FAIR' },
      { name: 'Philippe Vincent-Lamarre', affiliation: 'Mila' },
      { name: 'Koustuv Sinha', affiliation: 'McGill University' },
      { name: 'Vincent Larivière', affiliation: 'Université de Montréal' }
    ],
    year: 2021,
    venue: 'Journal of Machine Learning Research (JMLR 22)',
    type: 'journal-article',
    abstract: 'We present the findings of the NeurIPS 2019 Reproducibility Program, which included a reproducibility checklist, a code submission policy, and a community reproducibility challenge. We analyze adherence rates and examine the downstream impacts of standardized disclosure protocols.',
    citationCount: 640,
    referenceCount: 48,
    references: ['work_vaswani_2017'],
    citedBy: ['work_nicholson_2021'],
    openAccessUrl: 'https://jmlr.org/papers/v22/20-303.html',
    sourceUrl: 'https://jmlr.org/papers/v22/20-303.html',
    disciplines: ['Metascience', 'Machine Learning', 'Research Ethics'],
    keywords: ['Reproducibility', 'Checklists', 'Code Sharing', 'Metascience'],
    provenance: {
      provider: 'Crossref',
      retrievedAt: '2026-01-12T10:11:00.000Z',
      queryId: '10.5555/3455716.3455874',
      confidenceScore: 0.97
    },
    createdAt: '2026-01-12T10:11:00.000Z',
    updatedAt: '2026-01-12T10:11:00.000Z'
  },
  {
    id: 'work_bommasani_2021',
    doi: '10.48550/arXiv.2108.07258',
    openAlexId: 'W3196942081',
    semanticScholarId: '097950c40cf1d08bd67634f1ec52c2ad367b613a',
    title: 'On the Opportunities and Risks of Foundation Models',
    subtitle: 'Center for Research on Foundation Models Report',
    authors: [
      { name: 'Rishi Bommasani', affiliation: 'Stanford University' },
      { name: 'Drew A. Hudson', affiliation: 'Stanford University' },
      { name: 'Ehsan Adeli', affiliation: 'Stanford University' },
      { name: 'Percy Liang', affiliation: 'Stanford University' }
    ],
    year: 2021,
    venue: 'Stanford CRFM Technical Report / arXiv:2108.07258',
    type: 'review',
    abstract: 'AI is undergoing a paradigm shift with the rise of models (e.g., BERT, DALL-E, GPT-3) that are trained on broad data at scale and are adaptable to a wide range of downstream tasks. We call these foundation models to underscore their critically central yet incomplete character.',
    citationCount: 3820,
    referenceCount: 840,
    references: ['work_vaswani_2017', 'work_devlin_2018', 'work_brown_2020'],
    citedBy: ['work_schaeffer_2023'],
    openAccessUrl: 'https://arxiv.org/abs/2108.07258',
    sourceUrl: 'https://crfm.stanford.edu/report.html',
    disciplines: ['Artificial Intelligence', 'Ethics of Technology', 'Sociology of Science'],
    keywords: ['Foundation Models', 'Homogenization', 'Epistemic Risk', 'Capability Evaluation'],
    provenance: {
      provider: 'Semantic Scholar',
      retrievedAt: '2026-01-12T10:15:00.000Z',
      queryId: '10.48550/arXiv.2108.07258',
      confidenceScore: 0.98
    },
    createdAt: '2026-01-12T10:15:00.000Z',
    updatedAt: '2026-01-12T10:15:00.000Z'
  },
  {
    id: 'work_page_2021',
    doi: '10.1136/bmj.n71',
    openAlexId: 'W3141592653',
    semanticScholarId: '123456789abcdef0123456789abcdef012345678',
    title: 'The PRISMA 2020 Statement: An Updated Guideline for Reporting Systematic Reviews',
    authors: [
      { name: 'Matthew J. Page', affiliation: 'Monash University' },
      { name: 'Joanne E. McKenzie', affiliation: 'Monash University' },
      { name: 'Patrick M. Bossuyt', affiliation: 'Amsterdam UMC' }
    ],
    year: 2021,
    venue: 'BMJ 2021;372:n71',
    type: 'review',
    abstract: 'The Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA) 2020 statement provides updated reporting guidance that reflects advances in methods to identify, select, appraise, and synthesize studies.',
    citationCount: 41200,
    referenceCount: 32,
    references: [],
    citedBy: [],
    openAccessUrl: 'https://www.bmj.com/content/372/bmj.n71',
    sourceUrl: 'https://www.bmj.com/content/372/bmj.n71',
    disciplines: ['Epidemiology', 'Evidence Synthesis', 'Research Methodology'],
    keywords: ['PRISMA 2020', 'Systematic Review', 'Search Logging', 'Inclusion Protocols'],
    provenance: {
      provider: 'Crossref',
      retrievedAt: '2026-01-12T10:20:00.000Z',
      queryId: '10.1136/bmj.n71',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:20:00.000Z',
    updatedAt: '2026-01-12T10:20:00.000Z'
  },
  {
    id: 'work_nicholson_2021',
    doi: '10.1162/qss_a_00146',
    openAlexId: 'W3172819283',
    semanticScholarId: '789123456abcdef0123456789abcdef012345678',
    sciteId: 'scite_nicholson_2021',
    title: 'Scite: A Smart Citation Index That Displays the Context of Citations and Classifies Their Intent',
    authors: [
      { name: 'Josh M. Nicholson', affiliation: 'Scite.ai' },
      { name: 'Miloš Momeni', affiliation: 'Scite.ai' },
      { name: 'Sean C. Rife', affiliation: 'Murray State University' }
    ],
    year: 2021,
    venue: 'Quantitative Science Studies, 2(3), 882–898',
    type: 'journal-article',
    abstract: 'Traditional citation counts treat all citations equally, obscuring whether a study confirms, disputes, or merely mentions previous findings. Scite uses deep learning to categorize citations into supporting, disputing, or mentioning statements.',
    citationCount: 310,
    referenceCount: 45,
    references: ['work_pineau_2021'],
    citedBy: [],
    openAccessUrl: 'https://doi.org/10.1162/qss_a_00146',
    sourceUrl: 'https://direct.mit.edu/qss/article/2/3/882/107052',
    disciplines: ['Scientometrics', 'Citation Analysis', 'NLP'],
    keywords: ['Smart Citations', 'Claim Validation', 'Disputing Citations', 'Scientometrics'],
    provenance: {
      provider: 'Crossref',
      retrievedAt: '2026-01-12T10:25:00.000Z',
      queryId: '10.1162/qss_a_00146',
      confidenceScore: 0.98
    },
    createdAt: '2026-01-12T10:25:00.000Z',
    updatedAt: '2026-01-12T10:25:00.000Z'
  },
  {
    id: 'work_sutskever_2014',
    doi: '10.48550/arXiv.1409.3215',
    openAlexId: 'W2130386766',
    semanticScholarId: 'dea08dc7bb4e6d3d4bb797f7bb7faebf0be5cb6a',
    title: 'Sequence to Sequence Learning with Neural Networks',
    authors: [
      { name: 'Ilya Sutskever', affiliation: 'Google' },
      { name: 'Oriol Vinyals', affiliation: 'Google' },
      { name: 'Quoc V. Le', affiliation: 'Google' }
    ],
    year: 2014,
    venue: 'Advances in Neural Information Processing Systems 27 (NeurIPS 2014)',
    type: 'conference-paper',
    abstract: 'Deep Neural Networks are powerful models that have achieved excellent performance on difficult learning tasks. In this paper, we show that a multilayered Long Short-Term Memory (LSTM) can map input sequences to vector representations and decode them.',
    citationCount: 22100,
    referenceCount: 29,
    references: [],
    citedBy: ['work_vaswani_2017'],
    openAccessUrl: 'https://arxiv.org/abs/1409.3215',
    sourceUrl: 'https://proceedings.neurips.cc/paper/2014/hash/a14ba3c6141474ed16453b5f6d8224ca-Abstract.html',
    pdfUrl: 'https://arxiv.org/pdf/1409.3215.pdf',
    disciplines: ['Neural Networks', 'Machine Translation', 'Deep Learning'],
    keywords: ['Sequence-to-Sequence', 'RNN', 'LSTM', 'Encoder-Decoder'],
    provenance: {
      provider: 'OpenAlex',
      retrievedAt: '2026-01-12T10:28:00.000Z',
      queryId: '10.48550/arXiv.1409.3215',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:28:00.000Z',
    updatedAt: '2026-01-12T10:28:00.000Z'
  },
  {
    id: 'work_bahdanau_2014',
    doi: '10.48550/arXiv.1409.0473',
    openAlexId: 'W2096338571',
    semanticScholarId: '62243d6a0cfd2c88289895c37f0ef7cb7ea0d5f3',
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
    authors: [
      { name: 'Dzmitry Bahdanau', affiliation: 'Jacobs University Bremen' },
      { name: 'Kyunghyun Cho', affiliation: 'Université de Montréal' },
      { name: 'Yoshua Bengio', affiliation: 'Université de Montréal & CIFAR' }
    ],
    year: 2014,
    venue: 'International Conference on Learning Representations (ICLR 2015)',
    type: 'conference-paper',
    abstract: 'Neural machine translation is a recently proposed approach to machine translation. In this paper, we conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture, and propose an extension which allows a model to automatically search for parts of a source sentence that are relevant to predicting a target word.',
    citationCount: 31200,
    referenceCount: 34,
    references: [],
    citedBy: ['work_vaswani_2017'],
    openAccessUrl: 'https://arxiv.org/abs/1409.0473',
    sourceUrl: 'https://arxiv.org/abs/1409.0473',
    pdfUrl: 'https://arxiv.org/pdf/1409.0473.pdf',
    disciplines: ['Machine Learning', 'Attention Mechanism', 'NLP'],
    keywords: ['Additive Attention', 'Alignment', 'Encoder-Decoder', 'Translation'],
    provenance: {
      provider: 'Crossref',
      retrievedAt: '2026-01-12T10:30:00.000Z',
      queryId: '10.48550/arXiv.1409.0473',
      confidenceScore: 0.99
    },
    createdAt: '2026-01-12T10:30:00.000Z',
    updatedAt: '2026-01-12T10:30:00.000Z'
  }
];

export const SAMPLE_PROJECT_WORKS: ProjectWork[] = [
  {
    id: 'pw_1',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_vaswani_2017',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'Architectural baseline for modern transformer models. Key baseline for attention mechanisms and self-attention scalability.',
    tags: ['Foundational Architecture'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:02:00.000Z',
    updatedAt: '2026-01-14T09:00:00.000Z'
  },
  {
    id: 'pw_2',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_devlin_2018',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'Bidirectional encoder pre-training milestone. Establishes transfer learning protocols across GLUE benchmark tasks.',
    tags: ['Foundational Architecture'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:04:00.000Z',
    updatedAt: '2026-01-14T11:00:00.000Z'
  },
  {
    id: 'pw_3',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_brown_2020',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'Primary benchmark study for in-context few-shot scaling and emergence assertions across multi-task evaluations.',
    tags: ['Evaluation & Metrics'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:06:00.000Z',
    updatedAt: '2026-01-15T10:30:00.000Z'
  },
  {
    id: 'pw_4',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_schaeffer_2023',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'Crucial methodological analysis showing emergent capabilities disappear when evaluating under continuous non-linear metrics (Brier score, cross-entropy).',
    tags: ['Evaluation & Metrics'],
    addedBy: 'usr_elena_02',
    addedAt: '2026-01-16T15:00:00.000Z',
    updatedAt: '2026-01-20T14:30:00.000Z'
  },
  {
    id: 'pw_5',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_pineau_2021',
    readStatus: 'reading',
    inclusionStatus: 'included',
    personalNotes: 'NeurIPS reproducibility protocol standard. Used to evaluate empirical reporting checklists across literature corpus.',
    tags: ['Reproducibility'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:11:00.000Z',
    updatedAt: '2026-01-22T08:15:00.000Z'
  },
  {
    id: 'pw_6',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_bommasani_2021',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'Stanford CRFM foundation model taxonomy and risk synthesis. Key framework for homogenization and capability audits.',
    tags: ['Evidence Synthesis'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:15:00.000Z',
    updatedAt: '2026-01-25T14:00:00.000Z'
  },
  {
    id: 'pw_7',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_page_2021',
    readStatus: 'completed',
    inclusionStatus: 'included',
    personalNotes: 'PRISMA 2020 protocol reference used for systematic search logging, audit trails, and inclusion reporting.',
    tags: ['Evidence Synthesis'],
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-12T10:20:00.000Z',
    updatedAt: '2026-01-25T17:00:00.000Z'
  },
  {
    id: 'pw_8',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_nicholson_2021',
    readStatus: 'reading',
    inclusionStatus: 'candidate',
    personalNotes: 'Smart citation classification framework categorizing citations into supporting, mentioning, and contrasting context.',
    tags: ['Evidence Synthesis'],
    addedBy: 'usr_elena_02',
    addedAt: '2026-02-05T10:00:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z'
  }
];

export const SAMPLE_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann_01',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_schaeffer_2023',
    userId: 'usr_elena_02',
    userName: 'Dr. Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    text: 'The mathematical proof demonstrates that when performance is measured on a continuous metric like cross-entropy or Brier score, improvements scale predictably with compute.',
    quoteText: 'The appearance of emergent abilities is an artifact of nonlinear or discontinuous evaluation metrics.',
    passageReference: 'Section 3.1, p. 4',
    pageNumber: 4,
    claimType: 'contradict',
    createdAt: '2026-01-20T14:35:00.000Z',
    updatedAt: '2026-01-20T14:35:00.000Z'
  },
  {
    id: 'ann_02',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_pineau_2021',
    userId: 'usr_andy_01',
    userName: 'Dr. Andy Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Formalizing code submission standards and reproducibility checklists during conference review directly increases independent artifact verification rates.',
    quoteText: 'Papers that completed all sections of the reproducibility checklist exhibited higher rates of independent verification.',
    passageReference: 'Section 5.2, p. 14',
    pageNumber: 14,
    claimType: 'methodological',
    createdAt: '2026-01-22T08:30:00.000Z',
    updatedAt: '2026-01-22T08:30:00.000Z'
  },
  {
    id: 'ann_03',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_vaswani_2017',
    userId: 'usr_marcus_03',
    userName: 'Marcus Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'Multi-head self-attention replaces sequential recurrence with O(1) sequential operations, enabling parallelized gradient updates across the context window.',
    quoteText: 'The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours.',
    passageReference: 'Section 1, p. 2',
    pageNumber: 2,
    claimType: 'support',
    createdAt: '2026-01-24T11:15:00.000Z',
    updatedAt: '2026-01-24T11:15:00.000Z'
  }
];

export const SAMPLE_EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    id: 'ev_01',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_schaeffer_2023',
    workTitle: 'Are Emergent Abilities of Large Language Models a Mirage?',
    workAuthors: 'Schaeffer, Miranda, & Koyejo',
    workYear: 2023,
    claimStatement: 'Emergent abilities in large language models are mathematical artifacts of discontinuous evaluation metrics rather than fundamental phase transitions in model capabilities.',
    supportStrength: 'strong',
    verbatimPassage: 'For a fixed model output distribution, changing the metric from a discontinuous metric (e.g., Multiple Choice Accuracy) to a continuous metric (e.g., Brier Score) changes the appearance of the ability from emergent to smooth and predictable.',
    pageOrSection: 'Section 3.1, Figure 2, p. 4',
    warrantExplanation: 'When performance metrics preserve continuity of probability distributions, model scaling shows smooth and predictable progress without sharp step changes.',
    verificationStatus: 'verified',
    verifiedBy: 'Dr. Elena Rostova',
    subClaimCategory: 'Evaluation & Metrics',
    createdAt: '2026-01-20T15:00:00.000Z',
    updatedAt: '2026-01-20T15:00:00.000Z'
  },
  {
    id: 'ev_02',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_pineau_2021',
    workTitle: 'Improving Reproducibility in Machine Learning Research',
    workAuthors: 'Pineau et al.',
    workYear: 2021,
    claimStatement: 'Structured reporting protocols, hyperparameter disclosure, and explicit code submission policies significantly improve independent empirical verification in machine learning.',
    supportStrength: 'strong',
    verbatimPassage: 'We present the findings of the NeurIPS 2019 Reproducibility Program, which included a reproducibility checklist, a code submission policy, and a community reproducibility challenge. Standardized disclosure protocols improve clarity and adherence across submissions.',
    pageOrSection: 'Section 5.2, p. 14',
    warrantExplanation: 'Standardized transparency checklists constrain selective reporting and provide verifiable artifact trails.',
    verificationStatus: 'verified',
    verifiedBy: 'Dr. Andy Vance',
    subClaimCategory: 'Reproducibility',
    createdAt: '2026-01-22T08:30:00.000Z',
    updatedAt: '2026-01-22T08:30:00.000Z'
  },
  {
    id: 'ev_03',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_vaswani_2017',
    workTitle: 'Attention Is All You Need',
    workAuthors: 'Vaswani et al.',
    workYear: 2017,
    claimStatement: 'Pure self-attention mechanisms eliminate sequential recurrence constraints while achieving state-of-the-art sequence transduction with lower training FLOPs.',
    supportStrength: 'strong',
    verbatimPassage: 'We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.',
    pageOrSection: 'Abstract, p. 1',
    warrantExplanation: 'Eliminating recurrence allows constant execution time per token during training and unconstrained parallel tensor operations.',
    verificationStatus: 'verified',
    verifiedBy: 'Dr. Andy Vance',
    subClaimCategory: 'Foundational Architecture',
    createdAt: '2026-01-24T12:00:00.000Z',
    updatedAt: '2026-01-24T12:00:00.000Z'
  }
];

export const SAMPLE_SEARCH_LOGS: SearchLog[] = [
  {
    id: 'srch_01',
    projectId: 'proj_citation_dynamics_01',
    queryText: 'emergent abilities evaluation artifacts large language models',
    queryFilters: {
      disciplines: ['Computer Science', 'Machine Learning'],
      yearMin: 2021,
      yearMax: 2026,
      openAccessOnly: true,
      providers: ['OpenAlex', 'Semantic Scholar', 'Crossref']
    },
    providersQueried: ['OpenAlex', 'Semantic Scholar', 'Crossref'],
    providerStatuses: [
      { provider: 'OpenAlex', status: 'success', latencyMs: 220, candidatesCount: 18 },
      { provider: 'Semantic Scholar', status: 'success', latencyMs: 310, candidatesCount: 14 },
      { provider: 'Crossref', status: 'success', latencyMs: 390, candidatesCount: 9 }
    ],
    candidateCount: 41,
    includedCount: 3,
    excludedCount: 2,
    errors: [],
    executedBy: 'usr_andy_01',
    executedByEmail: 'andy@avoda.hk',
    executedAt: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 'srch_02',
    projectId: 'proj_citation_dynamics_01',
    queryText: 'reproducibility checklist empirical machine learning benchmarking',
    queryFilters: {
      disciplines: ['Metascience', 'Computer Science'],
      yearMin: 2019,
      yearMax: 2026,
      openAccessOnly: true,
      providers: ['OpenAlex', 'Crossref']
    },
    providersQueried: ['OpenAlex', 'Crossref'],
    providerStatuses: [
      { provider: 'OpenAlex', status: 'success', latencyMs: 180, candidatesCount: 22 },
      { provider: 'Crossref', status: 'success', latencyMs: 340, candidatesCount: 15 }
    ],
    candidateCount: 37,
    includedCount: 2,
    excludedCount: 1,
    errors: [],
    executedBy: 'usr_elena_02',
    executedByEmail: 'elena.rostova@cam.ac.uk',
    executedAt: '2026-01-16T14:45:00.000Z'
  }
];

export const SAMPLE_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'aud_01',
    workspaceId: 'ws_epistemic_01',
    projectId: 'proj_citation_dynamics_01',
    actorId: 'usr_andy_01',
    actorEmail: 'andy@avoda.hk',
    action: 'CREATE_PROJECT',
    targetType: 'project',
    targetId: 'proj_citation_dynamics_01',
    details: { title: 'Foundation Model Evaluation & Reproducibility Synthesis' },
    isDestructive: false,
    timestamp: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 'aud_02',
    workspaceId: 'ws_epistemic_01',
    projectId: 'proj_citation_dynamics_01',
    actorId: 'usr_andy_01',
    actorEmail: 'andy@avoda.hk',
    action: 'ADD_WORK_TO_PROJECT',
    targetType: 'work',
    targetId: 'work_vaswani_2017',
    details: { doi: '10.48550/arXiv.1706.03762', inclusionStatus: 'included' },
    isDestructive: false,
    timestamp: '2026-01-12T10:02:00.000Z'
  },
  {
    id: 'aud_03',
    workspaceId: 'ws_epistemic_01',
    actorId: 'usr_andy_01',
    actorEmail: 'andy@avoda.hk',
    action: 'INVITE_MEMBER',
    targetType: 'member',
    targetId: 'mem_02',
    details: { email: 'elena.rostova@cam.ac.uk', role: 'editor' },
    isDestructive: false,
    timestamp: '2026-01-15T14:30:00.000Z'
  },
  {
    id: 'aud_04',
    workspaceId: 'ws_epistemic_01',
    projectId: 'proj_citation_dynamics_01',
    actorId: 'usr_elena_02',
    actorEmail: 'elena.rostova@cam.ac.uk',
    action: 'CREATE_ANNOTATION',
    targetType: 'annotation',
    targetId: 'ann_01',
    details: { workId: 'work_schaeffer_2023', claimType: 'contradict' },
    isDestructive: false,
    timestamp: '2026-01-20T14:35:00.000Z'
  }
];

export const SAMPLE_PROJECT_CANDIDATE_STATES: ProjectCandidateState[] = [
  {
    id: 'proj_citation_dynamics_01_work_schaeffer_2023',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_schaeffer_2023',
    work: SAMPLE_WORKS[3],
    state: 'study_next',
    inDiscoveryTray: true,
    tags: ['Evaluation & Metrics'],
    notes: 'Outstanding paper analyzing metric linearity vs discontinuous step-function emergence.',
    dateFound: '2026-01-16T14:30:00.000Z',
    sourceTrailIds: ['trail_01'],
    sourceTrailTitles: ['Transformer Lineage & Evaluation Metrics'],
    reasons: [
      { category: 'contrastive', description: 'Directly analyzes emergence claims from few-shot scaling benchmarks' }
    ],
    feedbackHistory: [
      {
        id: 'fb_01',
        type: 'more_like_this',
        label: 'More like this',
        notes: 'Targeting papers evaluating metric sensitivity and resolution artifacts in ML',
        scope: 'project',
        createdAt: '2026-01-17T09:00:00.000Z'
      }
    ],
    studyPriority: 'high',
    readingProgress: 'in_progress',
    assignedCollaboratorId: 'usr_andy_01',
    assignedCollaboratorName: 'Dr. Andy Vance',
    dueDate: '2026-09-15',
    updatedAt: '2026-01-17T09:00:00.000Z'
  },
  {
    id: 'proj_citation_dynamics_01_work_brown_2020',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_brown_2020',
    work: SAMPLE_WORKS[2],
    state: 'study_next',
    inDiscoveryTray: true,
    tags: ['Evaluation & Metrics'],
    notes: 'Benchmark reference paper for in-context few-shot capabilities across diverse NLP tasks.',
    dateFound: '2026-01-18T11:00:00.000Z',
    sourceTrailIds: ['trail_01'],
    sourceTrailTitles: ['Transformer Lineage & Evaluation Metrics'],
    reasons: [
      { category: 'foundational', description: 'Canonical GPT-3 scaling and few-shot capability demonstration' }
    ],
    feedbackHistory: [],
    studyPriority: 'high',
    readingProgress: 'unread',
    assignedCollaboratorId: 'usr_elena_02',
    assignedCollaboratorName: 'Dr. Elena Rostova',
    dueDate: '2026-09-18',
    updatedAt: '2026-01-18T11:00:00.000Z'
  },
  {
    id: 'proj_citation_dynamics_01_work_pineau_2021',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_pineau_2021',
    work: SAMPLE_WORKS[4],
    state: 'saved_for_later',
    inDiscoveryTray: true,
    tags: ['Reproducibility'],
    notes: 'Standardized ML reproducibility checklists from NeurIPS 2019 reproducibility initiative.',
    dateFound: '2026-01-19T10:00:00.000Z',
    sourceTrailIds: ['trail_01'],
    sourceTrailTitles: ['Transformer Lineage & Evaluation Metrics'],
    reasons: [
      { category: 'methodological', description: 'Reproducibility checklist framework for literature auditing' }
    ],
    feedbackHistory: [],
    studyPriority: 'medium',
    readingProgress: 'unread',
    updatedAt: '2026-01-19T10:00:00.000Z'
  }
];

export const SAMPLE_STUDY_QUEUE: StudyQueueItem[] = [
  {
    id: 'sq_01',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_schaeffer_2023',
    work: SAMPLE_WORKS[3],
    sourceTrailId: 'trail_01',
    sourceTrailTitle: 'Transformer Lineage & Evaluation Metrics',
    addedBy: 'usr_andy_01',
    addedAt: '2026-01-16T14:35:00.000Z',
    status: 'in_progress',
    priority: 'high',
    assignedCollaboratorId: 'usr_andy_01',
    assignedCollaboratorName: 'Dr. Andy Vance',
    dueDate: '2026-09-15',
    notes: 'Verify mathematical analysis of continuous vs discrete accuracy metrics in Section 3.'
  },
  {
    id: 'sq_02',
    projectId: 'proj_citation_dynamics_01',
    workId: 'work_brown_2020',
    work: SAMPLE_WORKS[2],
    sourceTrailId: 'trail_01',
    sourceTrailTitle: 'Transformer Lineage & Evaluation Metrics',
    addedBy: 'usr_elena_02',
    addedAt: '2026-01-18T11:15:00.000Z',
    status: 'pending',
    priority: 'high',
    assignedCollaboratorId: 'usr_elena_02',
    assignedCollaboratorName: 'Dr. Elena Rostova',
    dueDate: '2026-09-18',
    notes: 'Cross-reference arithmetic and multi-digit benchmark evaluation metrics.'
  }
];
