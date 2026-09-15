import type { TeachingStep } from '../../types';

/** Registry diagram key for narration markers — must match visualRegistry concept + diagram ids. */
const D = '8_mitochondria_c.8_mitochondria_d';

/**
 * Grade 11 Biology — Mitochondria
 * Speech is segmented with [VISUAL:...] markers so TTS and diagram highlights stay aligned.
 * Each marker-only segment fires just before the following spoken paragraph (see useSpeech).
 */
const spoken = `[VISUAL:${D}.overview] Welcome to this lesson on the mitochondrion — often called the powerhouse of the cell. You will learn how its membranes create compartments, why folds called cristae matter for energy, what happens in the matrix, and how this organelle links to ATP production. Keep your eyes on the board: each time we move to a new structure, that region will light up to match what you hear.

[VISUAL:${D}.outer] Let us begin with the outer membrane. This smooth envelope surrounds the entire organelle. It is a phospholipid bilayer with integral and peripheral proteins, similar in basic composition to other cell membranes. It is relatively permeable to small molecules and ions, so many metabolites can cross into the intermembrane space between the outer and inner membranes. Think of the outer membrane as the first boundary that separates the mitochondrial interior from the cytosol.

[VISUAL:${D}.inner] Now focus on the inner membrane. Unlike the outer membrane, the inner mitochondrial membrane is highly selective. It contains many transport proteins that control what enters the matrix. This membrane is the main site for the electron transport chain — a series of protein complexes that transfer electrons and pump protons. That selective permeability is essential: it allows the cell to maintain a proton gradient that will later drive ATP synthesis.

[VISUAL:${D}.cristae] The inner membrane folds inward to form shelf-like structures called cristae. These folds dramatically increase surface area. More surface area means more room for electron transport chain complexes and for ATP synthase — the enzyme that makes ATP. In cells with very high energy demand, such as muscle cells, mitochondria often show especially numerous or tightly packed cristae. So when you hear “cristae,” think “more membrane surface for energy conversion.”

[VISUAL:${D}.matrix] The innermost compartment is the matrix — a dense gel-like region enclosed by the inner membrane. The matrix contains mitochondrial DNA, ribosomes of the bacterial type, and enzymes of the Krebs cycle — also called the citric acid cycle. That cycle oxidizes acetyl-CoA to carbon dioxide and transfers high-energy electrons to carriers like NADH and FADH2. Those carriers feed the electron transport chain in the inner membrane. So the matrix is where carbon fuels are fully processed before electrons move to the membrane.

[VISUAL:${D}.mtdna] Finally, notice that mitochondria carry their own small circular DNA and ribosomes that resemble bacterial 70S ribosomes. This supports the endosymbiotic theory: mitochondria likely evolved from ancient bacteria that were engulfed by early eukaryotic cells. Some proteins are still encoded by mitochondrial DNA and translated inside the organelle, though most mitochondrial proteins are encoded by nuclear genes and imported after synthesis in the cytosol.

[VISUAL:${D}.overview] To close: the mitochondrion couples oxidation of nutrients to a proton gradient across the inner membrane, and ATP synthase uses that gradient to phosphorylate ADP to ATP. You should now connect each region — outer membrane, inner membrane, cristae, matrix, and genetic machinery — with its role in cellular respiration.`;

const content = `## Mitochondria (Grade 11 Biology)

### Learning focus
- Double-membrane structure: outer vs inner
- Cristae and surface area
- Matrix: Krebs cycle, mtDNA, ribosomes
- Link to aerobic respiration and ATP

### NCERT-style takeaway
The mitochondrion is the principal site of aerobic respiration. The electron transport chain and chemiosmosis occur at the inner membrane; the matrix hosts the Krebs cycle.`;

export const mitochondriaGrade11Steps: TeachingStep[] = [
    {
        id: 'bio-11-8-mitochondria-masterclass',
        stepNumber: 1,
        title: 'Mitochondria — Structure, compartments, and ATP',
        content,
        spokenContent: spoken,
        visualType: 'diagram',
        visualId: 'bio-11-8-mitochondria',
        durationSeconds: 900,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 15,
        type: 'concept',
        keyConcepts: ['Outer membrane', 'Inner membrane', 'Cristae', 'Matrix', 'Chemiosmosis'],
        visualDomain: 'Biology',
    },
];
