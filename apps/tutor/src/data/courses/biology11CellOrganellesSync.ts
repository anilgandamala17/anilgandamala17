import type { TeachingStep } from '../../types';

const CHL = '8_chloroplast_c.8_chloroplast_d';
const PRO = '8_prokaryotic_cell_c.8_prokaryotic_cell_d';
const MEM = '8_cell_membrane_c.8_cell_membrane_d';

const chloroplastSpoken = `[VISUAL:${CHL}.overview] Welcome to the chloroplast — the organelle where photosynthesis turns light energy into chemical energy. You will see the envelope, stacked thylakoids called grana, connecting lamellae, and the fluid stroma where the Calvin cycle runs. The board highlights each region as we go.

[VISUAL:${CHL}.envelope] The chloroplast is bounded by a double membrane envelope. The outer membrane is permeable to small molecules; the inner membrane is more selective and contains transporters for metabolites such as phosphate, sugars, and ions. Together these membranes separate the stroma from the cytosol and maintain the internal environment needed for photosynthetic enzymes.

[VISUAL:${CHL}.grana] Inside the chloroplast, thylakoids are membranous sacs. Many thylakoids stack into columns called grana. The thylakoid membrane holds chlorophyll and the protein complexes of photosystems I and II, the cytochrome complex, and ATP synthase. Light-dependent reactions occur here: light excites electrons, water is split, oxygen is released, and ATP and NADPH are produced for the next stage.

[VISUAL:${CHL}.lamellae] Stroma lamellae — also called stromal lamellae — are thylakoid regions that connect one granum to another. They help integrate electron flow and proton movement across the thylakoid system so the whole granum stack behaves as a functional unit for light reactions.

[VISUAL:${CHL}.stroma] The stroma is the dense fluid surrounding the thylakoids. It contains enzymes of the Calvin cycle — carbon fixation, reduction, and regeneration of RuBP — using ATP and NADPH from the thylakoids to build sugars from carbon dioxide. The stroma also holds chloroplast DNA, ribosomes, and starch grains in some cells.

[VISUAL:${CHL}.overview] In summary: envelope encloses the organelle; grana and lamellae host light reactions; stroma completes carbon fixation. You should now connect membrane structure to the flow of energy from photons to sugars.`;

const chloroplastContent = `## Chloroplast (Grade 11 Biology)

### Learning focus
- Double envelope; grana and lamellae
- Light reactions vs Calvin cycle in stroma

### Takeaway
Photosynthesis splits between thylakoid membranes (light) and stroma (dark reactions).`;

const prokaryoticSpoken = `[VISUAL:${PRO}.overview] This lesson surveys a typical prokaryotic cell — often a bacterium — without a membrane-bound nucleus. You will see surface layers, the nucleoid, ribosomes, and motility structures. Highlights track each labeled region.

[VISUAL:${PRO}.capsule] Some bacteria secrete a polysaccharide capsule outside the cell wall. It resists desiccation and phagocytosis and can help adherence to surfaces. Not all species have a thick capsule, but when present it often contributes to virulence.

[VISUAL:${PRO}.wall] Beneath the capsule lies the cell wall, which maintains shape and protects against osmotic lysis. In many bacteria peptidoglycan gives rigidity; archaea use different polymers. Antibiotics such as penicillin target wall synthesis in many bacteria.

[VISUAL:${PRO}.membrane] The plasma membrane is a phospholipid bilayer with embedded proteins. It regulates transport, houses respiratory and photosynthetic complexes in some species, and anchors the chromosome during segregation. There is no nuclear envelope — DNA sits in the cytoplasm.

[VISUAL:${PRO}.nucleoid] The bacterial chromosome is usually a single circular DNA molecule concentrated in the nucleoid region — not a membrane-bound nucleus. Supercoiling and nucleoid-associated proteins compact the genome. Plasmids may add extra small circles of DNA.

[VISUAL:${PRO}.ribosomes] Prokaryotic ribosomes are 70S particles — smaller than eukaryotic 80S ribosomes — and synthesize proteins in the cytoplasm. Translation can begin on mRNAs while transcription is still finishing because there is no nuclear compartmentalization.

[VISUAL:${PRO}.flagellum] Where present, the flagellum is a rotary motor that propels the cell toward nutrients or away from stress. It differs in structure from eukaryotic flagella and is built from flagellin protein.

[VISUAL:${PRO}.pili] Pili or fimbriae are hair-like appendages for attachment — important for biofilms and infection — distinct from the thicker conjugation pilus used in DNA transfer between cells.

[VISUAL:${PRO}.overview] You should now map capsule, wall, membrane, nucleoid, ribosomes, flagellum, and pili to their roles in bacterial form and function.`;

const prokaryoticContent = `## Prokaryotic Cell (Grade 11 Biology)

### Learning focus
- Nucleoid vs nucleus; cell envelope; motility and attachment

### Takeaway
Prokaryotes couple transcription and translation and lack membrane-bound organelles.`;

const membraneSpoken = `[VISUAL:${MEM}.overview] The fluid mosaic model describes the plasma membrane as a lipid bilayer studded with proteins. We will walk through the bilayer, then integral and peripheral proteins, and why the membrane is selectively permeable.

[VISUAL:${MEM}.bilayer] Phospholipids arrange with hydrophilic heads toward water and hydrophobic fatty acid tails inward. This bilayer is the barrier that separates the cell interior from the environment. Cholesterol in animal membranes modulates fluidity.

[VISUAL:${MEM}.integral] Integral proteins span part or all of the bilayer. They often form channels, carriers, or receptors. Their hydrophobic regions embed in the core; hydrophilic domains face aqueous compartments on either side.

[VISUAL:${MEM}.peripheral] Peripheral proteins associate with the membrane surface — bound to lipids or to integral proteins — without crossing the bilayer. They participate in signaling, cytoskeletal anchoring, and enzyme complexes.

[VISUAL:${MEM}.overview] Selective permeability arises from the lipid barrier plus protein-mediated transport — passive diffusion, facilitated diffusion, and active transport — allowing the cell to control ions and nutrients precisely.`;

const membraneContent = `## Cell Membrane (Grade 11 Biology)

### Learning focus
- Fluid mosaic model; integral vs peripheral proteins

### Takeaway
Membrane structure underlies transport, signaling, and cell identity.`;

export const biology11ChloroplastSteps: TeachingStep[] = [
    {
        id: 'bio-11-8-chloroplast-sync',
        stepNumber: 1,
        title: 'Chloroplast — Photosynthetic Organelle',
        content: chloroplastContent,
        spokenContent: chloroplastSpoken,
        visualType: 'diagram',
        visualId: 'bio-11-8-chloroplast',
        durationSeconds: 780,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 13,
        type: 'concept',
        keyConcepts: ['Envelope', 'Grana', 'Stroma', 'Calvin cycle'],
        visualDomain: 'Biology',
    },
];

export const biology11ProkaryoticCellSteps: TeachingStep[] = [
    {
        id: 'bio-11-8-prokaryotic-cell-sync',
        stepNumber: 1,
        title: 'Prokaryotic Cell — Structure and Function',
        content: prokaryoticContent,
        spokenContent: prokaryoticSpoken,
        visualType: 'diagram',
        visualId: 'bio-11-8-prokaryotic-cell',
        durationSeconds: 840,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 14,
        type: 'concept',
        keyConcepts: ['Nucleoid', 'Cell wall', '70S ribosomes'],
        visualDomain: 'Biology',
    },
];

export const biology11CellMembraneSteps: TeachingStep[] = [
    {
        id: 'bio-11-8-cell-membrane-sync',
        stepNumber: 1,
        title: 'Cell Membrane — Fluid Mosaic Model',
        content: membraneContent,
        spokenContent: membraneSpoken,
        visualType: 'diagram',
        visualId: 'bio-11-8-cell-membrane',
        durationSeconds: 600,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 10,
        type: 'concept',
        keyConcepts: ['Bilayer', 'Integral proteins', 'Selective permeability'],
        visualDomain: 'Biology',
    },
];
