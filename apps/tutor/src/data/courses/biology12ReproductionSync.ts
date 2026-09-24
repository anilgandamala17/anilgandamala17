import type { TeachingStep } from '@/types';

/** Registry diagram keys — must match visualRegistry concept_id.diagram_id (not topic_id). */
const SR = '1_sexual_reproduction_c.1_sexual_reproduction_d';
const EMB = '1_embryogenesis_c.1_embryogenesis_d';

/**
 * Grade 12 Biology — Sexual Reproduction in Flowering Plants
 * [VISUAL:...] markers align TTS with SVG highlights (data-mito-part).
 */
const sexualReproductionSpoken = `[VISUAL:${SR}.overview] Welcome to this lesson on sexual reproduction in flowering plants. You will see how the male and female parts of a flower work together, how pollen reaches the stigma, how the pollen tube grows, and how double fertilization produces the embryo and endosperm. Watch the board: each highlighted region matches what you hear.

[VISUAL:${SR}.male] Let us start with the male reproductive whorl — the androecium. Stamens are the male organs. Each stamen has a slender filament and an anther at the tip. Inside the anther, microsporangia undergo meiosis and produce haploid pollen grains. Pollen is the male gametophyte in miniature form; it carries the cells that will eventually deliver male nuclei to the female tissue.

[VISUAL:${SR}.pollination] Pollination is the transfer of pollen from the anther to the stigma of a flower. It may be self-pollination within the same flower or cross-pollination between flowers, often aided by wind, water, or animals. Successful pollination is only the first step — the pollen must later germinate and grow a tube toward the ovule.

[VISUAL:${SR}.female] The female whorl is the gynoecium. The stigma receives pollen; the style is the stalk; and the ovary at the base encloses one or more ovules. Each ovule contains a megasporangium where meiosis produces the embryo sac — the female gametophyte. The embryo sac typically has seven cells and eight nuclei, including the egg cell and the central cell that will participate in double fertilization.

[VISUAL:${SR}.tube] After compatible pollen lands on the stigma, the pollen grain hydrates and germinates. A pollen tube grows down through the style, guided by chemical signals, toward the ovule’s micropyle. The tube carries two male gametes — the male nuclei — from the pollen grain toward the embryo sac. This pathway links the male gametophyte to the female gametophyte inside the ovule.

[VISUAL:${SR}.double] Double fertilization is unique to angiosperms. One male nucleus fuses with the egg cell to form the diploid zygote, which develops into the embryo. The other male nucleus fuses with the polar nuclei — often two — in the central cell to form the primary endosperm nucleus, which develops into nutritive endosperm for the seed. Thus one pollen tube delivers two sperm cells and enables two coordinated fusion events.

[VISUAL:${SR}.overview] In summary: stamens make pollen; the carpel receives pollen and houses ovules; the pollen tube delivers male gametes; double fertilization yields embryo plus endosperm. You should now connect each structure on the diagram with its role in completing the plant life cycle.`;

const sexualReproductionContent = `## Sexual Reproduction (Grade 12 Biology)

### Learning focus
- Flower structure: androecium vs gynoecium
- Pollination and pollen-tube growth
- Embryo sac and double fertilization

### Takeaway
Angiosperms package the gametophytes within flowers; double fertilization produces both embryo and endosperm.`;

/**
 * Grade 12 Biology — Fertilization
 * Video-only lesson: board plays Human Fertilisation MP4. No SVG, no AI TTS, no [VISUAL:] sync.
 */
const fertilizationContent = `## Fertilization (Grade 12 Biology)

### Learning focus
- Gamete interaction and zona penetration
- Acrosome reaction and membrane fusion
- Zygote formation and onset of cleavage

### Teaching video
This lesson is the **Human Fertilisation Process** video (6:23) on the board. Use the player captions if you want subtitles. There is no diagram view and no AI voice for this topic. After fullscreen, open Settings → Language to change the soundtrack (same video, new audio).

### Takeaway
Fertilization unites haploid pronuclei into a diploid zygote and starts development.`;

/**
 * Grade 12 Biology — Embryogenesis (early development)
 */
const embryogenesisSpoken = `[VISUAL:${EMB}.overview] Embryogenesis is the sequence of events that turns a zygote into a structured embryo. We will move from cleavage to morula, blastocyst, gastrula, and early organogenesis, then summarize what the three germ layers produce. Follow the highlights from left to right on the timeline.

[VISUAL:${EMB}.zygote] The zygote is the starting point: diploid, formed at fertilization. It is large compared to later blastomeres because early divisions cleave the cytoplasm without increasing total mass much — the embryo partitions the zygote into many smaller cells.

[VISUAL:${EMB}.cleavage] Cleavage is rapid mitotic division. In many species the embryo remains roughly the same size while cell number increases, producing two cells, then four, and so on. Pattern and timing vary by organism, but the principle is the same: genome replication and partitioning without large growth.

[VISUAL:${EMB}.morula] As cleavage continues, the embryo becomes a solid ball of cells called a morula — like a little mulberry. Compaction and cell signaling begin to specify which cells will form outer versus inner lineages in the next stage.

[VISUAL:${EMB}.blastocyst] The blastocyst — or blastula in other groups — forms when a fluid-filled cavity called the blastocoel appears inside the cell mass. In mammals, an outer trophectoderm and an inner cell mass arise; the ICM contributes to the embryo proper while extraembryonic tissues support pregnancy.

[VISUAL:${EMB}.gastrula] Gastrulation rearranges the blastula into three germ layers: ectoderm on the outside, endoderm lining the primitive gut, and mesoderm between them. The primitive streak and invagination movements drive this reorganization and establish the body plan.

[VISUAL:${EMB}.embryo] During organogenesis, the embryo folds and organ primordia form from the germ layers. The neural tube, heart tube, limb buds, and other structures appear in a characteristic sequence over weeks. This stage bridges early patterning to fetal growth.

[VISUAL:${EMB}.germlayers] Remember the fates: ectoderm gives rise to epidermis, nervous system, and many sense organs; mesoderm to muscle, bone, heart, blood, kidneys, and gonads; endoderm to gut lining and associated glands such as liver and pancreas. This chart unifies anatomy with embryonic origin.

[VISUAL:${EMB}.overview] You should now trace development from zygote through cleavage, blastocyst, gastrulation, and organogenesis, and name major derivatives of ectoderm, mesoderm, and endoderm.`;

const embryogenesisContent = `## Embryogenesis (Grade 12 Biology)

### Learning focus
- Cleavage, morula, blastocyst
- Gastrulation and germ layers
- Early organogenesis

### Takeaway
The body plan emerges from cleavage, cavitation, gastrulation, then organ formation from three germ layers.`;

export const biology12SexualReproductionSteps: TeachingStep[] = [
    {
        id: 'bio-12-1-sexual-reproduction-sync',
        stepNumber: 1,
        title: 'Sexual Reproduction in Flowering Plants',
        content: sexualReproductionContent,
        spokenContent: sexualReproductionSpoken,
        visualType: 'diagram',
        visualId: 'bio-12-1-sexual-reproduction',
        durationSeconds: 780,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 13,
        type: 'concept',
        keyConcepts: ['Stamen', 'Carpel', 'Pollen tube', 'Double fertilization'],
        visualDomain: 'Biology',
    },
];

export const biology12FertilizationSteps: TeachingStep[] = [
    {
        id: 'bio-12-1-fertilization-sync',
        stepNumber: 1,
        title: 'Fertilization — Gamete Fusion and Zygote',
        content: fertilizationContent,
        spokenContent: '',
        visualType: 'animation',
        visualId: 'bio-12-1-fertilization',
        durationSeconds: 383,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 7,
        type: 'concept',
        keyConcepts: ['Acrosome reaction', 'Membrane fusion', 'Zygote', 'Cleavage'],
        visualDomain: 'Biology',
    },
];

export const biology12EmbryogenesisSteps: TeachingStep[] = [
    {
        id: 'bio-12-1-embryogenesis-sync',
        stepNumber: 1,
        title: 'Embryogenesis — Early Development',
        content: embryogenesisContent,
        spokenContent: embryogenesisSpoken,
        visualType: 'diagram',
        visualId: 'bio-12-1-embryogenesis',
        durationSeconds: 900,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 15,
        type: 'concept',
        keyConcepts: ['Cleavage', 'Blastocyst', 'Gastrulation', 'Germ layers'],
        visualDomain: 'Biology',
    },
];
