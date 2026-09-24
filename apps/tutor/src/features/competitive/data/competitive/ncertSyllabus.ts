/**
 * Structured NCERT / syllabus chapter mappings for competitive exam generation.
 * Chapter titles align with standard NCERT Class 9–12 unit names referenced in examSyllabus.ts.
 * Do not embed copyrighted book text — titles and concept labels only.
 */

export interface NcertChapter {
  id: string;
  title: string;
  classLevel: 9 | 10 | 11 | 12;
  concepts: string[];
  syllabusUnitIds: string[];
}

export interface SubjectSyllabusMap {
  subjectId: string;
  chapters: NcertChapter[];
}

const JEE_PHY_11: NcertChapter[] = [
  { id: 'phy-11-units', title: 'Units and Measurements', classLevel: 11, concepts: ['dimensions', 'errors', 'significant figures'], syllabusUnitIds: ['mechanics'] },
  { id: 'phy-11-kinematics', title: 'Kinematics', classLevel: 11, concepts: ['motion in a straight line', 'motion in a plane', 'projectile'], syllabusUnitIds: ['mechanics'] },
  { id: 'phy-11-laws', title: 'Laws of Motion', classLevel: 11, concepts: ['newton laws', 'friction', 'circular motion'], syllabusUnitIds: ['mechanics'] },
  { id: 'phy-11-wep', title: 'Work, Energy and Power', classLevel: 11, concepts: ['work', 'kinetic energy', 'potential energy', 'power'], syllabusUnitIds: ['mechanics'] },
  { id: 'phy-11-rotation', title: 'System of Particles and Rotational Motion', classLevel: 11, concepts: ['centre of mass', 'torque', 'angular momentum'], syllabusUnitIds: ['mechanics'] },
  { id: 'phy-11-grav', title: 'Gravitation', classLevel: 11, concepts: ['universal law', 'kepler', 'orbital velocity'], syllabusUnitIds: ['gravitation'] },
  { id: 'phy-11-solids', title: 'Mechanical Properties of Solids', classLevel: 11, concepts: ['stress', 'strain', 'young modulus'], syllabusUnitIds: ['properties-of-matter'] },
  { id: 'phy-11-fluids', title: 'Mechanical Properties of Fluids', classLevel: 11, concepts: ['pressure', 'bernoulli', 'viscosity'], syllabusUnitIds: ['properties-of-matter'] },
  { id: 'phy-11-thermo', title: 'Thermodynamics', classLevel: 11, concepts: ['heat', 'first law', 'second law', 'carnot'], syllabusUnitIds: ['thermodynamics'] },
  { id: 'phy-11-kinetic', title: 'Kinetic Theory', classLevel: 11, concepts: ['gas laws', 'rms speed', 'degrees of freedom'], syllabusUnitIds: ['thermodynamics'] },
  { id: 'phy-11-osc', title: 'Oscillations', classLevel: 11, concepts: ['shm', 'pendulum', 'energy in shm'], syllabusUnitIds: ['waves'] },
  { id: 'phy-11-waves', title: 'Waves', classLevel: 11, concepts: ['wave motion', 'sound', 'doppler'], syllabusUnitIds: ['waves'] },
];

const JEE_PHY_12: NcertChapter[] = [
  { id: 'phy-12-elec', title: 'Electric Charges and Fields', classLevel: 12, concepts: ['coulomb', 'electric field', 'gauss law'], syllabusUnitIds: ['electrostatics'] },
  { id: 'phy-12-potential', title: 'Electrostatic Potential and Capacitance', classLevel: 12, concepts: ['potential', 'capacitors', 'dielectrics'], syllabusUnitIds: ['electrostatics'] },
  { id: 'phy-12-current', title: 'Current Electricity', classLevel: 12, concepts: ['ohm law', 'kirchhoff', 'wheatstone'], syllabusUnitIds: ['current-electricity'] },
  { id: 'phy-12-magnetism', title: 'Moving Charges and Magnetism', classLevel: 12, concepts: ['biot savart', 'ampere law', 'force on conductor'], syllabusUnitIds: ['magnetism'] },
  { id: 'phy-12-emi', title: 'Electromagnetic Induction', classLevel: 12, concepts: ['faraday', 'lenz', 'inductance'], syllabusUnitIds: ['emi-ac'] },
  { id: 'phy-12-ac', title: 'Alternating Current', classLevel: 12, concepts: ['ac circuits', 'resonance', 'transformer'], syllabusUnitIds: ['emi-ac'] },
  { id: 'phy-12-emwaves', title: 'Electromagnetic Waves', classLevel: 12, concepts: ['maxwell', 'displacement current', 'spectrum'], syllabusUnitIds: ['modern-physics'] },
  { id: 'phy-12-optics-ray', title: 'Ray Optics and Optical Instruments', classLevel: 12, concepts: ['reflection', 'refraction', 'lens', 'microscope'], syllabusUnitIds: ['optics'] },
  { id: 'phy-12-optics-wave', title: 'Wave Optics', classLevel: 12, concepts: ['interference', 'diffraction', 'polarisation'], syllabusUnitIds: ['optics'] },
  { id: 'phy-12-dual', title: 'Dual Nature of Radiation and Matter', classLevel: 12, concepts: ['photoelectric', 'de broglie'], syllabusUnitIds: ['modern-physics'] },
  { id: 'phy-12-atoms', title: 'Atoms', classLevel: 12, concepts: ['bohr model', 'hydrogen spectrum'], syllabusUnitIds: ['modern-physics'] },
  { id: 'phy-12-nuclei', title: 'Nuclei', classLevel: 12, concepts: ['radioactivity', 'nuclear fission', 'binding energy'], syllabusUnitIds: ['modern-physics'] },
  { id: 'phy-12-semi', title: 'Semiconductor Electronics', classLevel: 12, concepts: ['pn junction', 'diode', 'transistor'], syllabusUnitIds: ['modern-physics'] },
];

const JEE_CHEM_11: NcertChapter[] = [
  { id: 'chem-11-basic', title: 'Some Basic Concepts of Chemistry', classLevel: 11, concepts: ['mole concept', 'stoichiometry'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-11-structure', title: 'Structure of Atom', classLevel: 11, concepts: ['quantum numbers', 'electronic configuration'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-11-periodic', title: 'Classification of Elements and Periodicity', classLevel: 11, concepts: ['periodic trends', 'ionization energy'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-11-bonding', title: 'Chemical Bonding and Molecular Structure', classLevel: 11, concepts: ['vsepr', 'hybridization', 'molecular orbital'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-11-states', title: 'States of Matter', classLevel: 11, concepts: ['gas laws', 'kinetic theory of gases'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-11-thermo', title: 'Thermodynamics', classLevel: 11, concepts: ['enthalpy', 'entropy', 'gibbs energy'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-11-equilibrium', title: 'Equilibrium', classLevel: 11, concepts: ['chemical equilibrium', 'ionic equilibrium', 'ph'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-11-redox', title: 'Redox Reactions', classLevel: 11, concepts: ['oxidation number', 'balancing redox'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-11-organic-intro', title: 'Organic Chemistry — Some Basic Principles', classLevel: 11, concepts: ['nomenclature', 'isomerism', 'inductive effect'], syllabusUnitIds: ['organic-chemistry'] },
  { id: 'chem-11-hydrocarbons', title: 'Hydrocarbons', classLevel: 11, concepts: ['alkanes', 'alkenes', 'alkynes', 'aromatics'], syllabusUnitIds: ['organic-chemistry'] },
];

const JEE_CHEM_12: NcertChapter[] = [
  { id: 'chem-12-solutions', title: 'Solutions', classLevel: 12, concepts: ['raoult law', 'colligative properties'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-12-electrochem', title: 'Electrochemistry', classLevel: 12, concepts: ['nernst equation', 'electrolysis', 'cells'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-12-kinetics', title: 'Chemical Kinetics', classLevel: 12, concepts: ['rate law', 'activation energy'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-12-surface', title: 'Surface Chemistry', classLevel: 12, concepts: ['adsorption', 'colloids', 'catalysis'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'chem-12-pblock', title: 'The p-Block Elements', classLevel: 12, concepts: ['group 15', 'group 16', 'group 17', 'group 18'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-12-dfblock', title: 'The d- and f-Block Elements', classLevel: 12, concepts: ['transition metals', 'lanthanides'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-12-coordination', title: 'Coordination Compounds', classLevel: 12, concepts: ['ligands', 'cft', 'isomerism'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'chem-12-halo', title: 'Haloalkanes and Haloarenes', classLevel: 12, concepts: ['sn1 sn2', 'elimination'], syllabusUnitIds: ['organic-chemistry'] },
  { id: 'chem-12-alcohols', title: 'Alcohols, Phenols and Ethers', classLevel: 12, concepts: ['preparation', 'reactions'], syllabusUnitIds: ['organic-chemistry'] },
  { id: 'chem-12-aldehydes', title: 'Aldehydes, Ketones and Carboxylic Acids', classLevel: 12, concepts: ['nucleophilic addition', 'oxidation'], syllabusUnitIds: ['organic-chemistry'] },
  { id: 'chem-12-amines', title: 'Amines', classLevel: 12, concepts: ['basicity', 'diazonium salts'], syllabusUnitIds: ['organic-chemistry'] },
  { id: 'chem-12-biomolecules', title: 'Biomolecules', classLevel: 12, concepts: ['carbohydrates', 'proteins', 'nucleic acids'], syllabusUnitIds: ['organic-chemistry'] },
];

const JEE_MATH_11: NcertChapter[] = [
  { id: 'math-11-sets', title: 'Sets', classLevel: 11, concepts: ['set operations', 'venn diagrams'], syllabusUnitIds: ['algebra'] },
  { id: 'math-11-relations', title: 'Relations and Functions', classLevel: 11, concepts: ['domain', 'range', 'types of functions'], syllabusUnitIds: ['algebra'] },
  { id: 'math-11-trig', title: 'Trigonometric Functions', classLevel: 11, concepts: ['identities', 'graphs', 'inverse trig'], syllabusUnitIds: ['trigonometry'] },
  { id: 'math-11-complex', title: 'Complex Numbers and Quadratic Equations', classLevel: 11, concepts: ['argand plane', 'roots'], syllabusUnitIds: ['algebra'] },
  { id: 'math-11-sequences', title: 'Sequences and Series', classLevel: 11, concepts: ['ap', 'gp', 'hp'], syllabusUnitIds: ['algebra'] },
  { id: 'math-11-straight', title: 'Straight Lines', classLevel: 11, concepts: ['slope', 'distance', 'section formula'], syllabusUnitIds: ['coordinate-geometry'] },
  { id: 'math-11-conics', title: 'Conic Sections', classLevel: 11, concepts: ['parabola', 'ellipse', 'hyperbola'], syllabusUnitIds: ['coordinate-geometry'] },
  { id: 'math-11-limits', title: 'Limits and Derivatives', classLevel: 11, concepts: ['limits', 'continuity', 'derivative'], syllabusUnitIds: ['calculus'] },
  { id: 'math-11-stats', title: 'Statistics', classLevel: 11, concepts: ['mean', 'median', 'mode', 'deviation'], syllabusUnitIds: ['probability'] },
  { id: 'math-11-probability', title: 'Probability', classLevel: 11, concepts: ['events', 'conditional probability'], syllabusUnitIds: ['probability'] },
];

const JEE_MATH_12: NcertChapter[] = [
  { id: 'math-12-relations', title: 'Relations and Functions', classLevel: 12, concepts: ['inverse functions', 'composition'], syllabusUnitIds: ['algebra'] },
  { id: 'math-12-inverse-trig', title: 'Inverse Trigonometric Functions', classLevel: 12, concepts: ['principal value', 'properties'], syllabusUnitIds: ['trigonometry'] },
  { id: 'math-12-matrices', title: 'Matrices', classLevel: 12, concepts: ['operations', 'determinants'], syllabusUnitIds: ['algebra'] },
  { id: 'math-12-continuity', title: 'Continuity and Differentiability', classLevel: 12, concepts: ['chain rule', 'implicit differentiation'], syllabusUnitIds: ['calculus'] },
  { id: 'math-12-aod', title: 'Application of Derivatives', classLevel: 12, concepts: ['tangents', 'maxima minima'], syllabusUnitIds: ['calculus'] },
  { id: 'math-12-integrals', title: 'Integrals', classLevel: 12, concepts: ['definite integral', 'indefinite integral'], syllabusUnitIds: ['calculus'] },
  { id: 'math-12-aoc', title: 'Application of Integrals', classLevel: 12, concepts: ['area under curve'], syllabusUnitIds: ['calculus'] },
  { id: 'math-12-diffeq', title: 'Differential Equations', classLevel: 12, concepts: ['order degree', 'variable separable'], syllabusUnitIds: ['calculus'] },
  { id: 'math-12-vectors', title: 'Vector Algebra', classLevel: 12, concepts: ['dot product', 'cross product'], syllabusUnitIds: ['vectors-3d'] },
  { id: 'math-12-3d', title: 'Three Dimensional Geometry', classLevel: 12, concepts: ['lines', 'planes', 'distance'], syllabusUnitIds: ['vectors-3d'] },
  { id: 'math-12-lp', title: 'Linear Programming', classLevel: 12, concepts: ['feasible region', 'optimization'], syllabusUnitIds: ['algebra'] },
  { id: 'math-12-probability', title: 'Probability', classLevel: 12, concepts: ['bayes theorem', 'random variables'], syllabusUnitIds: ['probability'] },
];

const NEET_BOT: NcertChapter[] = [
  { id: 'bot-cell', title: 'Cell: The Unit of Life', classLevel: 11, concepts: ['cell organelles', 'prokaryote eukaryote'], syllabusUnitIds: ['cell-biology'] },
  { id: 'bot-tissues', title: 'Anatomy of Flowering Plants', classLevel: 11, concepts: ['plant tissues', 'root stem leaf'], syllabusUnitIds: ['plant-anatomy'] },
  { id: 'bot-morphology', title: 'Morphology of Flowering Plants', classLevel: 11, concepts: ['inflorescence', 'flower', 'fruit'], syllabusUnitIds: ['plant-morphology'] },
  { id: 'bot-photosynthesis', title: 'Photosynthesis in Higher Plants', classLevel: 11, concepts: ['light reaction', 'calvin cycle'], syllabusUnitIds: ['plant-physiology'] },
  { id: 'bot-respiration', title: 'Respiration in Plants', classLevel: 11, concepts: ['glycolysis', 'krebs cycle'], syllabusUnitIds: ['plant-physiology'] },
  { id: 'bot-reproduction', title: 'Sexual Reproduction in Flowering Plants', classLevel: 12, concepts: ['pollination', 'double fertilization'], syllabusUnitIds: ['plant-reproduction'] },
  { id: 'bot-genetics', title: 'Principles of Inheritance and Variation', classLevel: 12, concepts: ['mendel', 'linkage', 'mutations'], syllabusUnitIds: ['genetics'] },
  { id: 'bot-ecology', title: 'Organisms and Populations', classLevel: 12, concepts: ['population ecology', 'growth models'], syllabusUnitIds: ['ecology'] },
];

const NEET_ZOO: NcertChapter[] = [
  { id: 'zoo-biomolecules', title: 'Biomolecules', classLevel: 11, concepts: ['proteins', 'enzymes', 'nucleic acids'], syllabusUnitIds: ['biomolecules'] },
  { id: 'zoo-cell-cycle', title: 'Cell Cycle and Cell Division', classLevel: 11, concepts: ['mitosis', 'meiosis'], syllabusUnitIds: ['cell-biology'] },
  { id: 'zoo-breathing', title: 'Breathing and Exchange of Gases', classLevel: 11, concepts: ['respiratory system', 'gas exchange'], syllabusUnitIds: ['human-physiology'] },
  { id: 'zoo-circulation', title: 'Body Fluids and Circulation', classLevel: 11, concepts: ['heart', 'blood', 'ecg'], syllabusUnitIds: ['human-physiology'] },
  { id: 'zoo-excretion', title: 'Excretory Products and their Elimination', classLevel: 11, concepts: ['nephron', 'osmoregulation'], syllabusUnitIds: ['human-physiology'] },
  { id: 'zoo-evolution', title: 'Evolution', classLevel: 12, concepts: ['natural selection', 'hardy weinberg'], syllabusUnitIds: ['evolution'] },
  { id: 'zoo-human-repro', title: 'Human Reproduction', classLevel: 12, concepts: ['gametogenesis', 'pregnancy'], syllabusUnitIds: ['reproduction'] },
  { id: 'zoo-health', title: 'Human Health and Disease', classLevel: 12, concepts: ['immunity', 'aids', 'cancer'], syllabusUnitIds: ['health'] },
];

const EAMCET_MATH: NcertChapter[] = [
  { id: 'eam-math-algebra', title: 'Intermediate Algebra', classLevel: 12, concepts: ['quadratic', 'progressions', 'binomial'], syllabusUnitIds: ['algebra'] },
  { id: 'eam-math-trig', title: 'Intermediate Trigonometry', classLevel: 12, concepts: ['trigonometric equations', 'inverse trig'], syllabusUnitIds: ['trigonometry'] },
  { id: 'eam-math-coord', title: 'Coordinate Geometry', classLevel: 12, concepts: ['straight lines', 'circles', 'conics'], syllabusUnitIds: ['coordinate-geometry'] },
  { id: 'eam-math-calculus', title: 'Calculus', classLevel: 12, concepts: ['limits', 'differentiation', 'integration'], syllabusUnitIds: ['calculus'] },
  { id: 'eam-math-probability', title: 'Probability and Statistics', classLevel: 12, concepts: ['probability', 'mean variance'], syllabusUnitIds: ['probability'] },
];

const EAMCET_PHY: NcertChapter[] = [
  { id: 'eam-phy-mechanics', title: 'Intermediate Mechanics', classLevel: 12, concepts: ['kinematics', 'laws of motion', 'work energy'], syllabusUnitIds: ['mechanics'] },
  { id: 'eam-phy-thermo', title: 'Heat and Thermodynamics', classLevel: 12, concepts: ['thermal expansion', 'laws of thermodynamics'], syllabusUnitIds: ['thermodynamics'] },
  { id: 'eam-phy-waves', title: 'Waves and Sound', classLevel: 12, concepts: ['shm', 'sound waves', 'doppler'], syllabusUnitIds: ['waves'] },
  { id: 'eam-phy-electricity', title: 'Electricity and Magnetism', classLevel: 12, concepts: ['current electricity', 'magnetism', 'electromagnetic induction'], syllabusUnitIds: ['electricity'] },
  { id: 'eam-phy-optics', title: 'Optics and Modern Physics', classLevel: 12, concepts: ['ray optics', 'wave optics', 'atoms nuclei'], syllabusUnitIds: ['optics'] },
];

const EAMCET_CHEM: NcertChapter[] = [
  { id: 'eam-chem-physical', title: 'Intermediate Physical Chemistry', classLevel: 12, concepts: ['solutions', 'electrochemistry', 'chemical kinetics'], syllabusUnitIds: ['physical-chemistry'] },
  { id: 'eam-chem-inorganic', title: 'Intermediate Inorganic Chemistry', classLevel: 12, concepts: ['periodic table', 'coordination compounds'], syllabusUnitIds: ['inorganic-chemistry'] },
  { id: 'eam-chem-organic', title: 'Intermediate Organic Chemistry', classLevel: 12, concepts: ['reaction mechanisms', 'functional groups'], syllabusUnitIds: ['organic-chemistry'] },
];

/** examId → subjectId → syllabus map */
export const NCERT_SYLLABUS_MAP: Record<string, Record<string, SubjectSyllabusMap>> = {
  'jee-main': {
    phy: { subjectId: 'phy', chapters: [...JEE_PHY_11, ...JEE_PHY_12] },
    chem: { subjectId: 'chem', chapters: [...JEE_CHEM_11, ...JEE_CHEM_12] },
    math: { subjectId: 'math', chapters: [...JEE_MATH_11, ...JEE_MATH_12] },
  },
  'jee-advanced': {
    phy: { subjectId: 'phy', chapters: [...JEE_PHY_11, ...JEE_PHY_12] },
    chem: { subjectId: 'chem', chapters: [...JEE_CHEM_11, ...JEE_CHEM_12] },
    math: { subjectId: 'math', chapters: [...JEE_MATH_11, ...JEE_MATH_12] },
  },
  neet: {
    phy: { subjectId: 'phy', chapters: [...JEE_PHY_11, ...JEE_PHY_12] },
    chem: { subjectId: 'chem', chapters: [...JEE_CHEM_11, ...JEE_CHEM_12] },
    bot: { subjectId: 'bot', chapters: NEET_BOT },
    zoo: { subjectId: 'zoo', chapters: NEET_ZOO },
  },
  eamcet: {
    math: { subjectId: 'math', chapters: EAMCET_MATH },
    phy: { subjectId: 'phy', chapters: EAMCET_PHY },
    chem: { subjectId: 'chem', chapters: EAMCET_CHEM },
    bot: { subjectId: 'bot', chapters: NEET_BOT },
    zoo: { subjectId: 'zoo', chapters: NEET_ZOO },
  },
  olympiad: {
    sci: {
      subjectId: 'sci',
      chapters: [
        { id: 'ol-sci-phy', title: 'Mechanics and Energy', classLevel: 10, concepts: ['force', 'motion', 'energy'], syllabusUnitIds: ['physics'] },
        { id: 'ol-sci-chem', title: 'Matter and Reactions', classLevel: 10, concepts: ['atoms', 'reactions', 'acids'], syllabusUnitIds: ['chemistry'] },
        { id: 'ol-sci-bio', title: 'Life Processes', classLevel: 10, concepts: ['nutrition', 'respiration', 'excretion'], syllabusUnitIds: ['biology'] },
      ],
    },
    math: { subjectId: 'math', chapters: JEE_MATH_11.slice(0, 8) },
  },
  nmms: {
    'sat-sci': {
      subjectId: 'sat-sci',
      chapters: [
        { id: 'nmms-sci-phy', title: 'Class 8 Physics', classLevel: 9, concepts: ['force', 'friction', 'sound'], syllabusUnitIds: ['physics'] },
        { id: 'nmms-sci-chem', title: 'Class 8 Chemistry', classLevel: 9, concepts: ['materials', 'combustion'], syllabusUnitIds: ['chemistry'] },
        { id: 'nmms-sci-bio', title: 'Class 8 Biology', classLevel: 9, concepts: ['cell', 'microorganisms'], syllabusUnitIds: ['biology'] },
      ],
    },
  },
};

export function getNcertChapters(examId: string, subjectId: string): NcertChapter[] {
  return NCERT_SYLLABUS_MAP[examId]?.[subjectId]?.chapters ?? [];
}

export function hasNcertMapping(examId: string, subjectId: string): boolean {
  return getNcertChapters(examId, subjectId).length > 0;
}

export function findChapterById(
  examId: string,
  subjectId: string,
  topicId: string,
): NcertChapter | null {
  const chapters = getNcertChapters(examId, subjectId);
  return chapters.find((c) => c.id === topicId) ?? null;
}

export function getAllowedTopicIds(examId: string, subjectId: string, filterIds?: string[]): string[] {
  const all = getNcertChapters(examId, subjectId).map((c) => c.id);
  if (!filterIds?.length) return all;
  const allowed = new Set(filterIds);
  return all.filter((id) => allowed.has(id));
}

export function getSyllabusUnitTitles(examId: string, subjectId: string): string[] {
  const chapters = getNcertChapters(examId, subjectId);
  const units = new Set<string>();
  for (const ch of chapters) {
    units.add(ch.title);
    for (const sid of ch.syllabusUnitIds) units.add(sid);
  }
  return [...units];
}

export function formatNcertBlock(examId: string, subjectId: string, topicIds?: string[]): string {
  let chapters = getNcertChapters(examId, subjectId);
  if (topicIds?.length) {
    const allowed = new Set(topicIds);
    chapters = chapters.filter((c) => allowed.has(c.id));
  }
  if (!chapters.length) return '';
  return chapters
    .map(
      (c) =>
        `- [${c.id}] ${c.title} (Class ${c.classLevel}): ${c.concepts.join(', ')}`,
    )
    .join('\n');
}
