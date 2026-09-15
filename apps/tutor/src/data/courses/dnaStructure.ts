import { TeachingStep } from '../../types';

export const dnaStructureSteps: TeachingStep[] = [
    // ========================================
    // PART 1: INTRODUCTION (10 minutes)
    // ========================================
    {
        id: 'dna-1',
        stepNumber: 1,
        title: 'Welcome to DNA Structure',
        content: 'DNA (Deoxyribonucleic Acid) is the molecule that carries genetic instructions for all living organisms. It contains the code for building and maintaining life.',
        spokenContent: 'Welcome to our comprehensive lesson on DNA Structure! Over the next 45 minutes, we will explore this remarkable molecule from basic structure to real-world applications. DNA is the blueprint of life, found in every cell of every living organism. This incredible molecule stores all the information needed to build and operate an entire living being.',
        visualType: '3d-model',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Genetic information', 'Heredity', 'Molecular biology'],
        realWorldExamples: [
            'Every human has about 3 billion base pairs of DNA',
            'If stretched out, one cell\'s DNA would be about 2 meters long',
            'DNA evidence is used in criminal investigations and paternity tests'
        ],
    },
    {
        id: 'dna-2',
        stepNumber: 2,
        title: 'Historical Discovery',
        content: 'The structure of DNA was discovered in 1953 by James Watson and Francis Crick, with crucial contributions from Rosalind Franklin\'s X-ray crystallography work.',
        spokenContent: 'Before we dive into the structure, let us appreciate the history. In 1953, James Watson and Francis Crick proposed the double helix model, building on Rosalind Franklin\'s X-ray crystallography images. Photo 51, taken by Franklin, provided crucial evidence for the helical structure. This discovery earned Watson, Crick, and Maurice Wilkins the Nobel Prize in 1962.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Watson and Crick', 'Rosalind Franklin', 'Photo 51', 'X-ray crystallography'],
        realWorldExamples: [
            'Photo 51 is considered one of the most important images in science history',
            'Franklin died before the Nobel Prize was awarded; she was not eligible for posthumous nomination'
        ],
    },
    {
        id: 'dna-3',
        stepNumber: 3,
        title: 'Where is DNA Found?',
        content: 'In eukaryotes, DNA is found in the nucleus, mitochondria, and chloroplasts. In prokaryotes, it exists in the nucleoid region. Human cells contain about 6 billion base pairs of DNA.',
        spokenContent: 'Where exactly is DNA located? In human cells and other eukaryotes, most DNA resides in the nucleus, organized into chromosomes. We also have mitochondrial DNA, inherited only from our mothers. In bacteria and other prokaryotes, DNA floats freely in the cytoplasm in a region called the nucleoid. Your body contains approximately 37 trillion cells, each with a complete copy of your genetic code!',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Nucleus', 'Mitochondria', 'Chromosomes', 'Eukaryotes', 'Prokaryotes'],
        subConcepts: ['Nuclear DNA', 'Mitochondrial DNA', 'Chloroplast DNA'],
    },

    // ========================================
    // PART 2: STRUCTURE DETAILS (15 minutes)
    // ========================================
    {
        id: 'dna-4',
        stepNumber: 4,
        title: 'The Double Helix Structure',
        content: 'DNA forms a double helix - two strands twisted around each other like a spiral staircase. The strands run antiparallel, meaning they run in opposite directions (5\' to 3\' and 3\' to 5\').',
        spokenContent: 'DNA\'s iconic shape is the double helix - two long strands twisted together like a spiral staircase. A key feature is that the strands are antiparallel - they run in opposite directions. One strand runs 5 prime to 3 prime, while the other runs 3 prime to 5 prime. This directionality is crucial for DNA replication and transcription. The helix makes one complete turn every 10 base pairs, spanning about 3.4 nanometers.',
        visualType: '3d-model',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['Double helix', 'Antiparallel strands', '5\' to 3\' direction', 'Helical pitch'],
        realWorldExamples: [
            'The double helix inspired the design of the DNA Building in South Korea',
            'DNA can exist in different forms: A-DNA, B-DNA (most common), and Z-DNA'
        ],
    },
    {
        id: 'dna-5',
        stepNumber: 5,
        title: 'The Four Nitrogenous Bases',
        content: 'DNA has four bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C). Purines (A and G) have two rings; pyrimidines (T and C) have one ring.',
        spokenContent: 'Four chemical bases make up DNA\'s alphabet: Adenine, Thymine, Guanine, and Cytosine. We abbreviate them as A, T, G, and C. These fall into two categories: purines and pyrimidines. Adenine and Guanine are purines with two-ring structures. Thymine and Cytosine are pyrimidines with single-ring structures. This size difference is important for maintaining the consistent width of the DNA helix.',
        visualType: 'diagram',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['Adenine', 'Thymine', 'Guanine', 'Cytosine', 'Purines', 'Pyrimidines'],
        subConcepts: ['Two-ring vs one-ring structure', 'Nitrogen-containing bases'],
    },
    {
        id: 'dna-6',
        stepNumber: 6,
        title: 'Complementary Base Pairing',
        content: 'A always pairs with T (via 2 hydrogen bonds), and G always pairs with C (via 3 hydrogen bonds). This is called Chargaff\'s Rule and is essential for DNA replication.',
        spokenContent: 'Here is the key rule: A always pairs with T, and G always pairs with C. This is called complementary base pairing, discovered by Erwin Chargaff before the structure was known. Adenine and Thymine form two hydrogen bonds between them. Guanine and Cytosine form three hydrogen bonds, making G-C pairs slightly stronger. This complementary pairing ensures that each strand can serve as a template to recreate the other.',
        visualType: 'diagram',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['A-T pairing', 'G-C pairing', 'Hydrogen bonds', 'Chargaff\'s Rule'],
        practicalApplications: [
            'PCR primers are designed based on complementary base pairing',
            'DNA sequencing relies on base pair predictability'
        ],
    },
    {
        id: 'dna-7',
        stepNumber: 7,
        title: 'Sugar-Phosphate Backbone',
        content: 'The backbone of DNA consists of alternating deoxyribose sugar and phosphate groups. The bases attach to the sugar, extending toward the center of the helix.',
        spokenContent: 'Now let us examine the backbone. Each DNA strand has a sugar-phosphate backbone made of alternating deoxyribose sugar molecules and phosphate groups. The sugar is specifically 2-prime-deoxyribose, meaning it lacks an oxygen atom at the 2-prime carbon - this is what makes it deoxy-ribonucleic acid. The nitrogenous bases attach to this backbone and extend inward like rungs on a ladder. The phosphate groups give DNA its slightly negative charge.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Deoxyribose sugar', 'Phosphate group', 'Nucleotide structure', 'Phosphodiester bonds'],
    },

    // ========================================
    // PART 3: FUNCTION & PROCESSES (15 minutes)
    // ========================================
    {
        id: 'dna-8',
        stepNumber: 8,
        title: 'DNA Replication Overview',
        content: 'DNA replication is semi-conservative - each new double helix contains one original strand and one newly synthesized strand. Key enzymes include helicase, primase, and DNA polymerase.',
        spokenContent: 'DNA must replicate before cell division. The process is semi-conservative, meaning each new DNA molecule contains one original strand and one new strand. First, helicase unwinds the double helix at replication origins. Primase adds short RNA primers. Then DNA polymerase adds complementary nucleotides in the 5-prime to 3-prime direction. Leading strand synthesis is continuous, while lagging strand synthesis requires Okazaki fragments.',
        visualType: 'animation',
        durationSeconds: 300,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 5,
        keyConcepts: ['Semi-conservative replication', 'Helicase', 'Primase', 'DNA polymerase', 'Leading strand', 'Lagging strand'],
        subConcepts: ['Okazaki fragments', 'Replication fork', 'Origin of replication'],
        realWorldExamples: [
            'PCR (Polymerase Chain Reaction) mimics DNA replication in the lab',
            'Cancer cells often have defective replication checkpoints'
        ],
    },
    {
        id: 'dna-9',
        stepNumber: 9,
        title: 'Transcription: DNA to mRNA',
        content: 'Transcription converts DNA information into messenger RNA (mRNA). RNA polymerase reads the template strand and creates a complementary mRNA sequence.',
        spokenContent: 'Now we move to transcription - the first step in gene expression. RNA polymerase binds to a promoter region and separates the DNA strands. It reads the template strand in the 3-prime to 5-prime direction and synthesizes mRNA in the 5-prime to 3-prime direction. In RNA, Uracil replaces Thymine. The resulting mRNA carries the genetic message from the nucleus to the ribosome. In eukaryotes, the mRNA is processed before export.',
        visualType: 'animation',
        durationSeconds: 280,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 5,
        keyConcepts: ['RNA polymerase', 'Template strand', 'mRNA', 'Promoter region', 'Uracil'],
        subConcepts: ['5\' cap', 'Poly-A tail', 'Introns and exons', 'Splicing'],
    },
    {
        id: 'dna-10',
        stepNumber: 10,
        title: 'Translation: mRNA to Protein',
        content: 'Translation converts mRNA into proteins at the ribosome. Each three-nucleotide codon specifies an amino acid. tRNA molecules bring the correct amino acids.',
        spokenContent: 'Finally, translation converts the mRNA message into protein. This occurs on ribosomes. Messenger RNA codons - groups of three nucleotides - each specify one amino acid. Transfer RNA molecules recognize codons with their anticodons and deliver the corresponding amino acids. The ribosome moves along the mRNA, linking amino acids into a polypeptide chain. Start codon AUG begins translation; stop codons UAA, UAG, or UGA end it.',
        visualType: 'animation',
        durationSeconds: 280,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 5,
        keyConcepts: ['Codon', 'Anticodon', 'tRNA', 'Ribosome', 'Polypeptide', 'Start codon', 'Stop codon'],
        practicalApplications: [
            'Antibiotics like streptomycin target bacterial ribosomes',
            'Genetic code is nearly universal across all life forms'
        ],
    },

    // ========================================
    // PART 4: MUTATIONS & APPLICATIONS (8 minutes)
    // ========================================
    {
        id: 'dna-11',
        stepNumber: 11,
        title: 'DNA Mutations',
        content: 'Mutations are changes in DNA sequence. Types include point mutations (substitution), insertions, deletions, and frameshift mutations. Some are harmful, some neutral, some beneficial.',
        spokenContent: 'DNA is not always copied perfectly. Mutations are changes in the genetic sequence. Point mutations change a single base - these can be silent, missense, or nonsense mutations. Insertions add extra bases; deletions remove them. Both can cause frameshift mutations that alter the entire downstream sequence. While many mutations are neutral or harmful, some can be beneficial and drive evolution. Sickle cell disease results from a single point mutation.',
        visualType: 'diagram',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['Point mutation', 'Insertion', 'Deletion', 'Frameshift mutation', 'Silent mutation', 'Missense mutation'],
        realWorldExamples: [
            'Sickle cell anemia is caused by a single A to T mutation',
            'Some BRCA1 mutations increase breast cancer risk',
            'Antibiotic resistance often develops through bacterial mutations'
        ],
    },
    {
        id: 'dna-12',
        stepNumber: 12,
        title: 'Real-World Applications: CRISPR',
        content: 'CRISPR-Cas9 is a revolutionary gene editing tool that allows precise modification of DNA sequences. It uses guide RNA to target specific locations.',
        spokenContent: 'Let us explore a cutting-edge application: CRISPR-Cas9. This revolutionary technology allows scientists to edit DNA with unprecedented precision. CRISPR uses a guide RNA to locate a specific DNA sequence, then the Cas9 protein cuts the DNA at that location. Cells then repair the break, either disabling the gene or allowing insertion of new sequences. CRISPR is being used to develop treatments for genetic diseases, create disease-resistant crops, and even eliminate malaria-carrying mosquitoes.',
        visualType: 'diagram',
        durationSeconds: 240,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['CRISPR-Cas9', 'Guide RNA', 'Gene editing', 'DNA repair'],
        practicalApplications: [
            'Clinical trials for sickle cell disease treatment using CRISPR',
            'Development of disease-resistant crops',
            'Research into eliminating genetic diseases before birth'
        ],
    },
    {
        id: 'dna-13',
        stepNumber: 13,
        title: 'DNA in Forensics and Medicine',
        content: 'DNA profiling is used in criminal investigations, paternity tests, and ancestry research. Personalized medicine uses genetic information to tailor treatments.',
        spokenContent: 'DNA has transformed forensic science and medicine. DNA fingerprinting, developed by Alec Jeffreys in 1984, creates unique genetic profiles from samples as small as a hair follicle. This has solved countless crimes and freed wrongly convicted individuals. Ancestry services analyze DNA to trace family histories. In medicine, pharmacogenomics uses genetic information to personalize drug treatments - some people metabolize medications differently based on their genes.',
        visualType: 'diagram',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['DNA profiling', 'Forensic science', 'Pharmacogenomics', 'Ancestry testing'],
        realWorldExamples: [
            'The Golden State Killer was caught using genealogy databases in 2018',
            'Warfarin dosing is now often guided by genetic testing',
            'Ancestry DNA services have identified over 10 million family connections'
        ],
    },

    // ========================================
    // PART 5: REVIEW & ASSESSMENT (5 minutes)
    // ========================================
    {
        id: 'dna-14',
        stepNumber: 14,
        title: 'Summary: Key Points',
        content: 'Review of main concepts: double helix structure, base pairing rules (A-T, G-C), DNA replication, transcription to mRNA, translation to protein, and modern applications.',
        spokenContent: 'Let us summarize what we have learned. DNA is a double helix of antiparallel strands held together by complementary base pairs: A pairs with T, G pairs with C. The sugar-phosphate backbone provides structure. DNA replicates semi-conservatively before cell division. Transcription creates mRNA from DNA; translation creates proteins from mRNA. Mutations can alter function. Modern applications include CRISPR gene editing, forensic DNA profiling, and personalized medicine. You now understand the complete story of DNA from structure to applications!',
        visualType: 'text',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Double helix', 'Base pairing', 'Replication', 'Transcription', 'Translation', 'CRISPR', 'Forensics'],
    },
    {
        id: 'dna-15',
        stepNumber: 15,
        title: 'Comprehensive Quiz',
        content: 'Test your complete understanding of DNA structure, function, and applications.',
        spokenContent: 'Excellent work completing this comprehensive lesson on DNA! Now let us test your knowledge with a quiz covering everything from basic structure to advanced applications.',
        visualType: 'quiz',
        durationSeconds: 300,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 5,
    },
];

// Total estimated duration: approximately 52 minutes
// Coverage: End-to-end from discovery to modern applications
