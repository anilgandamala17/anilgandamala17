import type { TeachingStep } from '../../types';

const MEND = '2_mendelism_c.2_mendelism_d';
const DNA = '2_dna_structure_c.2_dna_structure_d';

const mendelismSpoken = `[VISUAL:${MEND}.overview] Welcome to Mendel’s laws of inheritance. We use the board to separate monohybrid and dihybrid patterns — dominance, segregation, and independent assortment.

[VISUAL:${MEND}.monohybrid] In a monohybrid cross we track one gene with two alleles — here tall versus dwarf. Parental generation TT is homozygous tall and tt is homozygous dwarf. All F1 offspring are heterozygous Tt and show the dominant phenotype because dominant alleles mask recessive ones in the heterozygote.

[VISUAL:${MEND}.monohybrid] In F2, selfing F1 produces a three-to-one phenotypic ratio — tall to dwarf — reflecting segregation of alleles into gametes and random fusion. Genotypically you see one TT to two Tt to one tt — the famous one-two-one ratio.

[VISUAL:${MEND}.dihybrid] A dihybrid cross follows two genes on different chromosomes — for example seed shape and colour. F1 is uniformly RrYy when parents are homozygous for opposite traits. In F2, independent assortment gives a nine-three-three-one phenotypic ratio when alleles sort independently into gametes.

[VISUAL:${MEND}.overview] You should now connect each region — monohybrid Punnett and dihybrid grid — with segregation and independent assortment.`;

const mendelismContent = `## Mendelism (Grade 12 Biology)

### Learning focus
- Monohybrid vs dihybrid; 9:3:3:1

### Takeaway
Alleles segregate; genes on different chromosomes assort independently.`;

const dnaSpoken = `[VISUAL:${DNA}.overview] DNA stores genetic information in a double helix. We will highlight the sugar-phosphate backbones, complementary base pairs, and the legend for A–T and G–C pairing.

[VISUAL:${DNA}.helix] Two antiparallel strands run in opposite directions. Each strand is a polymer of nucleotides with deoxyribose sugar and phosphate forming the backbone outside the helix.

[VISUAL:${DNA}.pairing] Complementary bases face inward: adenine pairs with thymine using two hydrogen bonds; guanine pairs with cytosine using three hydrogen bonds. This complementarity underlies replication and transcription.

[VISUAL:${DNA}.legend] The legend summarizes base pairing rules and backbone versus hydrogen-bonded pairs. Remember that sequence specificity is encoded in the order of bases along each strand.

[VISUAL:${DNA}.overview] DNA’s stable structure and complementary pairing enable faithful copying and expression of genetic information.`;

const dnaContent = `## DNA Structure (Grade 12 Biology)

### Learning focus
- Antiparallel strands; complementary base pairing

### Takeaway
A–T and G–C pairing stabilizes the double helix and enables replication.`;

export const biology12MendelismSteps: TeachingStep[] = [
    {
        id: 'bio-12-2-mendelism-sync',
        stepNumber: 1,
        title: 'Mendelism — Laws of Inheritance',
        content: mendelismContent,
        spokenContent: mendelismSpoken,
        visualType: 'diagram',
        visualId: 'bio-12-2-mendelism',
        durationSeconds: 720,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 12,
        type: 'concept',
        keyConcepts: ['Segregation', 'Independent assortment', '9:3:3:1'],
        visualDomain: 'Biology',
    },
];

export const biology12DnaStructureSteps: TeachingStep[] = [
    {
        id: 'bio-12-2-dna-structure-sync',
        stepNumber: 1,
        title: 'DNA Structure — Double Helix',
        content: dnaContent,
        spokenContent: dnaSpoken,
        visualType: 'diagram',
        visualId: 'bio-12-2-dna-structure',
        durationSeconds: 600,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 10,
        type: 'concept',
        keyConcepts: ['Base pairing', 'Backbone', 'Complementarity'],
        visualDomain: 'Biology',
    },
];
