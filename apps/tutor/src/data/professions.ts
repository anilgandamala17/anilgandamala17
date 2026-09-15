import { Profession } from '../types';


export const professions: Profession[] = [
    {
        id: 'medicine',
        name: 'Medicine',
        icon: 'stethoscope',
        description: 'Medical sciences, clinical practice, healthcare',
        color: '#06b6d4',
        subProfessions: [
            {
                id: 'cardiology',
                name: 'Cardiology',
                description: 'Heart and cardiovascular system',
                subjects: [
                    {
                        id: 'anatomy',
                        name: 'Cardiac Anatomy',
                        icon: 'heart',
                        topics: [
                            { id: 'heart-structure', name: 'Heart Structure', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'valves', name: 'Heart Valves', duration: '30 min', difficulty: 'beginner', progress: 0 },
                            { id: 'blood-flow', name: 'Blood Flow Dynamics', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'coronary-arteries', name: 'Coronary Arteries', duration: '35 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'diagnostics',
                        name: 'Diagnostics',
                        icon: 'activity',
                        topics: [
                            { id: 'ecg-basics', name: 'ECG Basics', duration: '30 min', difficulty: 'beginner', progress: 0 },
                            { id: 'echo', name: 'Echocardiography', duration: '60 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'stress-test', name: 'Stress Testing', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'pathology',
                        name: 'Cardiac Pathology',
                        icon: 'alert-circle',
                        topics: [
                            { id: 'arrhythmias', name: 'Cardiac Arrhythmias', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'heart-failure', name: 'Heart Failure', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'neurology',
                name: 'Neurology',
                description: 'Brain and nervous system',
                subjects: [
                    {
                        id: 'neuroanatomy',
                        name: 'Neuroanatomy',
                        icon: 'brain',
                        topics: [
                            { id: 'brain-structure', name: 'Brain Structure', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'neurons', name: 'Neurons & Synapses', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'spinal-cord', name: 'Spinal Cord Anatomy', duration: '35 min', difficulty: 'beginner', progress: 0 }
                        ]
                    },
                    {
                        id: 'neuropathology',
                        name: 'Neuropathology',
                        icon: 'activity',
                        topics: [
                            { id: 'stroke', name: 'Stroke & Ischemia', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'epilepsy', name: 'Epilepsy & Seizures', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'oncology',
                name: 'Oncology',
                description: 'Cancer diagnosis and treatment',
                subjects: [
                    {
                        id: 'cancer-basics',
                        name: 'Cancer Fundamentals',
                        icon: 'alert-triangle',
                        topics: [
                            { id: 'cancer-biology', name: 'Cancer Biology', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'staging', name: 'Cancer Staging', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'pediatrics',
                name: 'Pediatrics',
                description: 'Child health and development',
                subjects: [
                    {
                        id: 'child-development',
                        name: 'Child Development',
                        icon: 'baby',
                        topics: [
                            { id: 'milestones', name: 'Developmental Milestones', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'vaccines', name: 'Vaccination Schedule', duration: '35 min', difficulty: 'beginner', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'engineering',
        name: 'Engineering',
        icon: 'cog',
        description: 'Technical disciplines and applied sciences',
        color: '#3b82f6',
        subProfessions: [
            {
                id: 'software',
                name: 'Software Engineering',
                description: 'Software development and systems',
                subjects: [
                    {
                        id: 'web-dev',
                        name: 'Web Development',
                        icon: 'globe',
                        topics: [
                            { id: 'react-basics', name: 'React Fundamentals', duration: '50 min', difficulty: 'beginner', progress: 0 },
                            { id: 'state-management', name: 'State Management', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'api-design', name: 'RESTful API Design', duration: '55 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'algorithms',
                        name: 'Algorithms',
                        icon: 'code',
                        topics: [
                            { id: 'sorting', name: 'Sorting Algorithms', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'graphs', name: 'Graph Theory', duration: '60 min', difficulty: 'advanced', progress: 0 },
                            { id: 'dynamic-programming', name: 'Dynamic Programming', duration: '50 min', difficulty: 'advanced', progress: 0 }
                        ]
                    },
                    {
                        id: 'databases',
                        name: 'Databases',
                        icon: 'database',
                        topics: [
                            { id: 'sql-basics', name: 'SQL Fundamentals', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'nosql', name: 'NoSQL Databases', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'mechanical',
                name: 'Mechanical Engineering',
                description: 'Machines and mechanical systems',
                subjects: [
                    {
                        id: 'thermodynamics',
                        name: 'Thermodynamics',
                        icon: 'flame',
                        topics: [
                            { id: 'laws-thermo', name: 'Laws of Thermodynamics', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'heat-transfer', name: 'Heat Transfer', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'entropy', name: 'Entropy & Energy', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'mechanics',
                        name: 'Mechanics',
                        icon: 'settings',
                        topics: [
                            { id: 'statics', name: 'Statics & Equilibrium', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'dynamics', name: 'Dynamics & Motion', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'electrical',
                name: 'Electrical Engineering',
                description: 'Electrical systems and electronics',
                subjects: [
                    {
                        id: 'circuits',
                        name: 'Circuit Analysis',
                        icon: 'zap',
                        topics: [
                            { id: 'dc-circuits', name: 'DC Circuit Analysis', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'ac-circuits', name: 'AC Circuit Analysis', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'civil',
                name: 'Civil Engineering',
                description: 'Infrastructure and construction',
                subjects: [
                    {
                        id: 'structures',
                        name: 'Structural Engineering',
                        icon: 'building',
                        topics: [
                            { id: 'beams', name: 'Beam Analysis', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'foundations', name: 'Foundation Design', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'law',
        name: 'Law',
        icon: 'scale',
        description: 'Legal studies, jurisprudence, practice',
        color: '#8b5cf6',
        subProfessions: [
            {
                id: 'corporate',
                name: 'Corporate Law',
                description: 'Business and commercial law',
                subjects: [
                    {
                        id: 'contracts',
                        name: 'Contract Law',
                        icon: 'file-text',
                        topics: [
                            { id: 'contract-formation', name: 'Formation of Contracts', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'breach', name: 'Breach of Contract', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'remedies', name: 'Contract Remedies', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'corporate-governance',
                        name: 'Corporate Governance',
                        icon: 'briefcase',
                        topics: [
                            { id: 'directors', name: 'Board of Directors', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'shareholders', name: 'Shareholder Rights', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'criminal',
                name: 'Criminal Law',
                description: 'Criminal justice system',
                subjects: [
                    {
                        id: 'procedures',
                        name: 'Criminal Procedure',
                        icon: 'gavel',
                        topics: [
                            { id: 'investigation', name: 'Investigation Phase', duration: '35 min', difficulty: 'beginner', progress: 0 },
                            { id: 'trial', name: 'Trial Process', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'sentencing', name: 'Sentencing & Appeals', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'criminal-theory',
                        name: 'Criminal Theory',
                        icon: 'book',
                        topics: [
                            { id: 'mens-rea', name: 'Mens Rea & Actus Reus', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'defenses', name: 'Criminal Defenses', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'constitutional',
                name: 'Constitutional Law',
                description: 'Constitutional rights and governance',
                subjects: [
                    {
                        id: 'rights',
                        name: 'Constitutional Rights',
                        icon: 'shield',
                        topics: [
                            { id: 'first-amendment', name: 'First Amendment', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'due-process', name: 'Due Process', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'business',
        name: 'Business',
        icon: 'briefcase',
        description: 'Management, finance, entrepreneurship',
        color: '#f59e0b',
        subProfessions: [
            {
                id: 'marketing',
                name: 'Marketing',
                description: 'Marketing strategies and branding',
                subjects: [
                    {
                        id: 'digital-marketing',
                        name: 'Digital Marketing',
                        icon: 'smartphone',
                        topics: [
                            { id: 'seo', name: 'SEO Fundamentals', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'social-media', name: 'Social Media Strategy', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'content-marketing', name: 'Content Marketing', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'branding',
                        name: 'Branding',
                        icon: 'tag',
                        topics: [
                            { id: 'brand-identity', name: 'Brand Identity', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'positioning', name: 'Market Positioning', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'finance',
                name: 'Finance',
                description: 'Financial management and analysis',
                subjects: [
                    {
                        id: 'investing',
                        name: 'Investing',
                        icon: 'trending-up',
                        topics: [
                            { id: 'stocks', name: 'Stock Market Basics', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'bonds', name: 'Bonds & Fixed Income', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'portfolio', name: 'Portfolio Management', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'accounting',
                        name: 'Accounting',
                        icon: 'calculator',
                        topics: [
                            { id: 'financial-statements', name: 'Financial Statements', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'ratio-analysis', name: 'Financial Ratio Analysis', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'management',
                name: 'Management',
                description: 'Leadership and organizational management',
                subjects: [
                    {
                        id: 'leadership',
                        name: 'Leadership',
                        icon: 'users',
                        topics: [
                            { id: 'leadership-styles', name: 'Leadership Styles', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'team-building', name: 'Team Building', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'science',
        name: 'Science',
        icon: 'flask',
        description: 'Natural and physical sciences',
        color: '#10b981',
        subProfessions: [
            {
                id: 'physics',
                name: 'Physics',
                description: 'Study of matter and energy',
                subjects: [
                    {
                        id: 'mechanics',
                        name: 'Classical Mechanics',
                        icon: 'atom',
                        topics: [
                            { id: 'newtons-laws', name: 'Newton\'s Laws', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'kinematics', name: 'Kinematics', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'energy', name: 'Energy & Work', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'electromagnetism',
                        name: 'Electromagnetism',
                        icon: 'zap',
                        topics: [
                            { id: 'electric-fields', name: 'Electric Fields', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'magnetic-fields', name: 'Magnetic Fields', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'biology',
                name: 'Biology',
                description: 'Living organisms and life processes',
                subjects: [
                    {
                        id: 'genetics',
                        name: 'Genetics',
                        icon: 'dna',
                        topics: [
                            { id: 'dna-structure', name: 'DNA Structure', duration: '35 min', difficulty: 'beginner', progress: 0 },
                            { id: 'heredity', name: 'Mendelian Heredity', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'gene-expression', name: 'Gene Expression', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'cell-biology',
                        name: 'Cell Biology',
                        icon: 'circle',
                        topics: [
                            { id: 'cell-structure', name: 'Cell Structure', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'cell-division', name: 'Cell Division', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'chemistry',
                name: 'Chemistry',
                description: 'Matter, atoms, and molecules',
                subjects: [
                    {
                        id: 'organic',
                        name: 'Organic Chemistry',
                        icon: 'flask',
                        topics: [
                            { id: 'hydrocarbons', name: 'Hydrocarbons', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'functional-groups', name: 'Functional Groups', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'arts',
        name: 'Arts',
        icon: 'palette',
        description: 'Creative arts, humanities, culture',
        color: '#ec4899',
        subProfessions: [
            {
                id: 'visual',
                name: 'Visual Arts',
                description: 'Painting, sculpture, photography',
                subjects: [
                    {
                        id: 'art-history',
                        name: 'Art History',
                        icon: 'image',
                        topics: [
                            { id: 'renaissance', name: 'The Renaissance', duration: '50 min', difficulty: 'beginner', progress: 0 },
                            { id: 'modernism', name: 'Modernism', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'contemporary', name: 'Contemporary Art', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'design',
                        name: 'Design Principles',
                        icon: 'palette',
                        topics: [
                            { id: 'color-theory', name: 'Color Theory', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'composition', name: 'Composition & Layout', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'literature',
                name: 'Literature',
                description: 'Literary analysis and writing',
                subjects: [
                    {
                        id: 'literary-analysis',
                        name: 'Literary Analysis',
                        icon: 'book-open',
                        topics: [
                            { id: 'narrative', name: 'Narrative Structure', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'themes', name: 'Themes & Symbolism', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'technology',
        name: 'Technology',
        icon: 'monitor',
        description: 'Software, IT, digital systems',
        color: '#6366f1',
        subProfessions: [
            {
                id: 'ai',
                name: 'Artificial Intelligence',
                description: 'AI and machine learning',
                subjects: [
                    {
                        id: 'ml-basics',
                        name: 'Machine Learning Basics',
                        icon: 'cpu',
                        topics: [
                            { id: 'supervised', name: 'Supervised Learning', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'neural-networks', name: 'Neural Networks', duration: '60 min', difficulty: 'advanced', progress: 0 },
                            { id: 'unsupervised', name: 'Unsupervised Learning', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'nlp',
                        name: 'Natural Language Processing',
                        icon: 'message-square',
                        topics: [
                            { id: 'text-processing', name: 'Text Processing', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'transformers', name: 'Transformers & BERT', duration: '60 min', difficulty: 'advanced', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'cybersecurity',
                name: 'Cybersecurity',
                description: 'Security and protection',
                subjects: [
                    {
                        id: 'network-sec',
                        name: 'Network Security',
                        icon: 'shield',
                        topics: [
                            { id: 'firewalls', name: 'Firewalls & VPNs', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'encryption', name: 'Encryption Basics', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'penetration', name: 'Penetration Testing', duration: '55 min', difficulty: 'advanced', progress: 0 }
                        ]
                    },
                    {
                        id: 'cryptography',
                        name: 'Cryptography',
                        icon: 'lock',
                        topics: [
                            { id: 'symmetric', name: 'Symmetric Encryption', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'asymmetric', name: 'Asymmetric Encryption', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'cloud',
                name: 'Cloud Computing',
                description: 'Cloud services and infrastructure',
                subjects: [
                    {
                        id: 'aws',
                        name: 'AWS Fundamentals',
                        icon: 'cloud',
                        topics: [
                            { id: 'ec2', name: 'EC2 & Compute', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 's3', name: 'S3 Storage', duration: '40 min', difficulty: 'beginner', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'education',
        name: 'Education',
        icon: 'graduation',
        description: 'Teaching, pedagogy, learning sciences',
        color: '#14b8a6',
        subProfessions: [
            {
                id: 'pedagogy',
                name: 'Pedagogy',
                description: 'Theory and practice of teaching',
                subjects: [
                    {
                        id: 'teaching-methods',
                        name: 'Teaching Methods',
                        icon: 'book-open',
                        topics: [
                            { id: 'active-learning', name: 'Active Learning', duration: '35 min', difficulty: 'beginner', progress: 0 },
                            { id: 'assessment', name: 'Assessment Strategies', duration: '40 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'differentiation', name: 'Differentiated Instruction', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'curriculum',
                        name: 'Curriculum Design',
                        icon: 'layout',
                        topics: [
                            { id: 'learning-objectives', name: 'Learning Objectives', duration: '40 min', difficulty: 'beginner', progress: 0 },
                            { id: 'backward-design', name: 'Backward Design', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'special-education',
                name: 'Special Education',
                description: 'Supporting diverse learners',
                subjects: [
                    {
                        id: 'inclusion',
                        name: 'Inclusive Education',
                        icon: 'heart',
                        topics: [
                            { id: 'iep', name: 'IEP Development', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'accommodations', name: 'Accommodations & Modifications', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    },
    {
        id: 'psychology',
        name: 'Psychology',
        icon: 'brain',
        description: 'Human behavior, mental health',
        color: '#a855f7',
        subProfessions: [
            {
                id: 'clinical',
                name: 'Clinical Psychology',
                description: 'Mental health treatment',
                subjects: [
                    {
                        id: 'disorders',
                        name: 'Psychological Disorders',
                        icon: 'activity',
                        topics: [
                            { id: 'anxiety', name: 'Anxiety Disorders', duration: '45 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'depression', name: 'Depression & Mood', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'ptsd', name: 'PTSD & Trauma', duration: '50 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    },
                    {
                        id: 'therapy',
                        name: 'Therapeutic Approaches',
                        icon: 'heart',
                        topics: [
                            { id: 'cbt', name: 'Cognitive Behavioral Therapy', duration: '50 min', difficulty: 'intermediate', progress: 0 },
                            { id: 'psychodynamic', name: 'Psychodynamic Therapy', duration: '45 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            },
            {
                id: 'cognitive',
                name: 'Cognitive Psychology',
                description: 'Mental processes and cognition',
                subjects: [
                    {
                        id: 'memory',
                        name: 'Memory & Learning',
                        icon: 'brain',
                        topics: [
                            { id: 'memory-types', name: 'Types of Memory', duration: '45 min', difficulty: 'beginner', progress: 0 },
                            { id: 'forgetting', name: 'Forgetting & Retrieval', duration: '40 min', difficulty: 'intermediate', progress: 0 }
                        ]
                    }
                ]
            }
        ],
    }
];
