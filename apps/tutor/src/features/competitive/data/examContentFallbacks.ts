import type { Question } from './competitiveQuestions';
import { getSyllabusUnits, type ExamDifficulty } from './examSyllabus';
import { lockScienceDiscipline, type ScienceDiscipline } from './competitive/subjectDiscipline';
import { catalogHasSubjectMapping } from '@/features/competitive/services/examSourceValidator';
import { assignDefaultMetadata } from '@/features/competitive/services/examSourceValidator';
import { validateQuestionSubject } from '@/features/competitive/services/examSubjectValidator';
import { getNcertChapters } from './competitive/ncertSyllabus';
import { buildExamSlotPlan, type ExamQuestionSlot, FORMAT_IDS } from '@/features/competitive/services/examSlotPlan';

type FallbackSpec = {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  year: string;
  unit: string;
  difficulty: ExamDifficulty;
  index: number;
  seed: number;
  /** Stable per-paper seed for template rotation across sessions. */
  paperSeed: number;
  scienceDiscipline?: ScienceDiscipline;
  slot?: ExamQuestionSlot;
  attempt?: number;
};

type Built = {
  text: string;
  correct: string;
  distractors: string[];
  explanation: string;
  topic: string;
};

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function irand(r: () => number, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

/** Rotate fallback template families from slot index + seed (cross-paper variation). */
function slotFamily(spec: FallbackSpec, mod: number): number {
  const base = (spec.slot?.index ?? spec.index) + (spec.attempt ?? 0);
  const formatIdx = spec.slot?.format ? Math.max(0, FORMAT_IDS.indexOf(spec.slot.format)) : 0;
  const seedSkew = mod > 0 ? (spec.paperSeed % mod) : 0;
  return (base + formatIdx + seedSkew) % mod;
}

/** Even slot rotation without format skew (for template-cap-limited builders). */
function slotFamilyEven(spec: FallbackSpec, mod: number): number {
  const seedSkew = mod > 0 ? (spec.paperSeed % mod) : 0;
  return ((spec.slot?.index ?? spec.index) + (spec.attempt ?? 0) + seedSkew) % mod;
}

function paperFingerprint(q: Pick<Question, 'text' | 'options'>): string {
  return `${q.text}::${q.options.map((o) => String(o)).join('|')}`;
}

function applySlotContext(spec: FallbackSpec, built: Built): Built {
  const ctx = spec.slot?.chapterTitle ?? spec.slot?.syllabusUnit ?? spec.unit;
  const slotIdx = spec.slot?.index ?? spec.index;
  const paperTag = ((spec.paperSeed % 997) + slotIdx * 13) % 9999;
  if (!ctx) {
    return {
      ...built,
      text: `${built.text.trim()} (ref ${paperTag})`,
    };
  }
  const trimmed = built.text.trim();
  if (trimmed.toLowerCase().includes(ctx.toLowerCase().slice(0, 12))) {
    return {
      ...built,
      text: `${trimmed} (ref ${paperTag})`,
    };
  }
  return {
    ...built,
    text: `${ctx} (ref ${paperTag}): ${trimmed}`,
    topic: built.topic || ctx,
  };
}

function toQuestion(spec: FallbackSpec, built: Built, _r: () => number): Question {
  const contextual = applySlotContext(spec, built);
  const options = [contextual.correct, ...contextual.distractors.slice(0, 3)].map(String);
  const base: Question = {
    id: `content-${spec.examId}-${spec.subjectId}-${spec.index}-${spec.seed.toString(36)}`,
    text: contextual.text,
    options,
    correctAnswer: 0,
    explanation: contextual.explanation,
    topic: contextual.topic,
    difficulty: spec.slot?.difficulty ?? spec.difficulty,
    examYear: spec.year,
    subjectId: spec.subjectId,
    subjectName: spec.subjectName,
    questionFormat: spec.slot?.format ?? (spec.difficulty === 'Hard' ? 'NUMERICAL_WORD' : 'CONCEPTUAL_DIRECT'),
  };
  const chapterId = spec.slot?.topicId;
  const chapters = getNcertChapters(spec.examId, spec.subjectId);
  const chapter = chapterId
    ? chapters.find((c) => c.id === chapterId)
    : chapters[spec.index % Math.max(chapters.length, 1)];
  return assignDefaultMetadata(base, {
    examId: spec.examId,
    subjectId: spec.subjectId,
    defaultTopicId: chapter?.id,
    defaultSyllabusUnit: spec.slot?.chapterTitle ?? chapter?.title ?? spec.unit,
  }) as Question;
}

function mathBuilt(spec: FallbackSpec, r: () => number): Built {
  const family = slotFamilyEven(spec, 15);
  if (family === 0) {
    const p = irand(r, 8, 45);
    const base = irand(r, 5, 16) * 40;
    const ans = (p * base) / 100;
    return {
      text: `${p}% of ${base} equals:`,
      correct: String(ans),
      distractors: [String(ans + p), String(ans - 8), String(p + base / 10)],
      explanation: `${p}% of ${base} = (${p}/100)×${base} = ${ans}.`,
      topic: 'Percentages',
    };
  }
  if (family === 1) {
    const side = irand(r, 4, 14);
    return {
      text: `The area of a square of side ${side} cm is:`,
      correct: `${side * side} cm²`,
      distractors: [`${4 * side} cm²`, `${2 * side} cm²`, `${side * side * 2} cm²`],
      explanation: `Area = side² = ${side}² = ${side * side} cm².`,
      topic: 'Mensuration',
    };
  }
  if (family === 2) {
    const a = irand(r, 2, 9);
    const d = irand(r, 2, 6);
    const n = irand(r, 6, 12);
    const an = a + (n - 1) * d;
    return {
      text: `The ${n}th term of the AP ${a}, ${a + d}, ${a + 2 * d}, … is:`,
      correct: String(an),
      distractors: [String(a + n * d), String(n * d), String(a * n)],
      explanation: `aₙ = a+(n−1)d = ${a}+(${n}−1)${d} = ${an}.`,
      topic: 'Arithmetic progressions',
    };
  }
  if (family === 3) {
    const p = irand(r, 400, 1200);
    const rint = irand(r, 4, 12);
    const t = irand(r, 2, 5);
    const si = Math.round((p * rint * t) / 100);
    return {
      text: `Simple interest on ₹${p} at ${rint}% per annum for ${t} years is:`,
      correct: `₹${si}`,
      distractors: [`₹${p}`, `₹${si + rint}`, `₹${p + si}`],
      explanation: `SI = PRT/100 = ${p}×${rint}×${t}/100 = ${si}.`,
      topic: 'Simple interest',
    };
  }
  if (family === 4) {
    const n = irand(r, 4, 10);
    return {
      text: `The number of subsets of a set with ${n} elements is:`,
      correct: String(2 ** n),
      distractors: [String(n * n), String(2 * n), String(n ** 2 + 1)],
      explanation: `A set of n elements has 2ⁿ subsets, so 2^${n} = ${2 ** n}.`,
      topic: 'Sets',
    };
  }
  if (family === 5) {
    const u = irand(r, 20, 60);
    const t = irand(r, 2, 8);
    const dist = u * t;
    return {
      text: `A vehicle moving at ${u} km/h travels for ${t} hours. Distance covered is:`,
      correct: `${dist} km`,
      distractors: [`${u + t} km`, `${u / t} km`, `${dist + u} km`],
      explanation: `Distance = speed × time = ${u}×${t} = ${dist} km.`,
      topic: 'Time and distance',
    };
  }
  if (family === 6) {
    const x = irand(r, 3, 12);
    return {
      text: `Solve for x: 3x − 5 = ${3 * x - 5}`,
      correct: String(x),
      distractors: [String(x + 1), String(x - 1), String(3 * x)],
      explanation: `3x = ${3 * x - 5}+5 = ${3 * x}, so x = ${x}.`,
      topic: 'Linear equations',
    };
  }
  if (family === 7) {
    const a = irand(r, 1, 5);
    const b = irand(r, a + 1, a + 8);
    return {
      text: `If the roots of x² − ${a + b}x + k = 0 are ${a} and ${b}, then k equals:`,
      correct: String(a * b),
      distractors: [String(a + b), String(a * b + 2), String(Math.abs(a - b))],
      explanation: `Product of roots = k = ${a}×${b} = ${a * b}.`,
      topic: 'Quadratic equations',
    };
  }
  if (family === 8) {
    const l = irand(r, 4, 14);
    const b = irand(r, 3, 10);
    return {
      text: `Area of a rectangle with length ${l} cm and breadth ${b} cm is:`,
      correct: `${l * b} cm²`,
      distractors: [`${2 * (l + b)} cm²`, `${l + b} cm²`, `${l * b + l} cm²`],
      explanation: `Area = l×b = ${l}×${b} = ${l * b} cm².`,
      topic: 'Mensuration',
    };
  }
  if (family === 9) {
    const n = irand(r, 3, 8);
    return {
      text: `LCM of ${n} and ${n + 2} is:`,
      correct: String((n * (n + 2)) / 2),
      distractors: [String(n + 2), String(n * (n + 2)), String(n)],
      explanation: `LCM of consecutive even-offset integers for small n.`,
      topic: 'Number theory',
    };
  }
  if (family === 10) {
    const a = irand(r, 2, 9);
    const b = irand(r, 2, 9);
    return {
      text: `Mean of ${a} and ${b} is:`,
      correct: String((a + b) / 2),
      distractors: [String(a + b), String(a * b), String(Math.abs(a - b))],
      explanation: `Mean = (${a}+${b})/2 = ${(a + b) / 2}.`,
      topic: 'Statistics',
    };
  }
  if (family === 11) {
    const r1 = irand(r, 2, 8);
    return {
      text: `Probability of getting a head in a fair coin toss is:`,
      correct: '1/2',
      distractors: ['1/4', '1', String(r1)],
      explanation: 'A fair coin has two equally likely outcomes.',
      topic: 'Probability',
    };
  }
  if (family === 12) {
    const x = irand(r, 2, 9);
    return {
      text: `Value of sin 30° is:`,
      correct: '1/2',
      distractors: ['√3/2', '1', String(x / 10)],
      explanation: 'sin 30° = 1/2.',
      topic: 'Trigonometry',
    };
  }
  if (family === 13) {
    const n = irand(r, 2, 6);
    return {
      text: `Derivative of x^${n} with respect to x is:`,
      correct: `${n}x^${n - 1}`,
      distractors: [`x^${n - 1}`, `${n}x^${n}`, `${n + 1}x^${n}`],
      explanation: `d/dx(x^n) = nx^(n-1).`,
      topic: 'Calculus',
    };
  }
  const base = irand(r, 10, 40);
  const rate = irand(r, 5, 15);
  return {
    text: `Compound interest on ₹${base} at ${rate}% for 1 year (compounded annually) is closest to:`,
    correct: `₹${Math.round((base * rate) / 100)}`,
    distractors: [`₹${base}`, `₹${rate}`, `₹${base + rate}`],
    explanation: `CI ≈ PRT/100 for one year at small rates.`,
    topic: 'Compound interest',
  };
}

function physicsBuilt(spec: FallbackSpec, r: () => number): Built {
  const family = slotFamilyEven(spec, 15);
  if (family === 0) {
    const m = irand(r, 2, 10);
    const a = irand(r, 2, 8);
    const F = m * a;
    return {
      text: `A ${m} kg body accelerates at ${a} m/s². The net force on it is:`,
      correct: `${F} N`,
      distractors: [`${m + a} N`, `${a / m} N`, `${m * a * a} N`],
      explanation: `F = ma = ${m}×${a} = ${F} N.`,
      topic: 'Newton’s laws',
    };
  }
  if (family === 1) {
    const V = irand(r, 4, 24);
    const R = irand(r, 2, 12);
    const I = +(V / R).toFixed(2);
    return {
      text: `An ideal ${V} V cell is connected across ${R} Ω. The current is:`,
      correct: `${I} A`,
      distractors: [`${V * R} A`, `${V + R} A`, `${(R / V).toFixed(2)} A`],
      explanation: `I = V/R = ${V}/${R} = ${I} A.`,
      topic: 'Current electricity',
    };
  }
  if (family === 2) {
    const R = irand(r, 8, 24) * 2;
    return {
      text: `Using Cartesian sign convention, the focal length of a concave mirror of radius ${R} cm is:`,
      correct: `${-R / 2} cm`,
      distractors: [`${R / 2} cm`, `${R} cm`, `${-R} cm`],
      explanation: `f = −R/2 = −${R}/2 = ${-R / 2} cm for a concave mirror.`,
      topic: 'Ray optics',
    };
  }
  if (family === 3) {
    const v = irand(r, 300, 360);
    const f = irand(r, 2, 8) * 50;
    const lam = +(v / f).toFixed(2);
    return {
      text: `A sound wave of frequency ${f} Hz travels at ${v} m/s. Its wavelength is:`,
      correct: `${lam} m`,
      distractors: [`${v * f} m`, `${(f / v).toFixed(3)} m`, `${v + f} m`],
      explanation: `λ = v/f = ${v}/${f} = ${lam} m.`,
      topic: 'Waves',
    };
  }
  if (family === 4) {
    const m = irand(r, 2, 8);
    const h = irand(r, 4, 20);
    const pe = m * 10 * h;
    return {
      text: `Gravitational potential energy of a ${m} kg mass raised ${h} m (take g = 10 m/s²) is:`,
      correct: `${pe} J`,
      distractors: [`${m * h} J`, `${m + h} J`, `${pe / 10} J`],
      explanation: `PE = mgh = ${m}×10×${h} = ${pe} J.`,
      topic: 'Work, energy, power',
    };
  }
  if (family === 5) {
    const F = irand(r, 10, 50);
    const A = irand(r, 2, 10);
    return {
      text: `Pressure due to a force ${F} N on area ${A} m² is:`,
      correct: `${F / A} Pa`,
      distractors: [`${F * A} Pa`, `${F + A} Pa`, `${A / F} Pa`],
      explanation: `P = F/A = ${F}/${A} = ${F / A} Pa.`,
      topic: 'Pressure',
    };
  }
  if (family === 6) {
    const m = irand(r, 2, 9);
    const v = irand(r, 4, 12);
    const ke = 0.5 * m * v * v;
    return {
      text: `Kinetic energy of a ${m} kg mass moving at ${v} m/s is:`,
      correct: `${ke} J`,
      distractors: [`${m * v} J`, `${m * v * v} J`, `${2 * ke} J`],
      explanation: `KE = ½mv² = 0.5×${m}×${v}² = ${ke} J.`,
      topic: 'Work, energy, power',
    };
  }
  const u = irand(r, 5, 15);
  const a = irand(r, 2, 6);
  const t = irand(r, 2, 6);
  const v = u + a * t;
  if (family === 7) {
    return {
      text: `A body starts with ${u} m/s and accelerates at ${a} m/s² for ${t} s. Final velocity is:`,
      correct: `${v} m/s`,
      distractors: [`${u * t} m/s`, `${a * t} m/s`, `${u + a} m/s`],
      explanation: `v = u+at = ${u}+${a}×${t} = ${v} m/s.`,
      topic: 'Kinematics',
    };
  }
  if (family === 8) {
    const R = irand(r, 4, 20);
    const I = irand(r, 2, 8);
    return {
      text: `Power dissipated in a ${R} Ω resistor carrying ${I} A current is:`,
      correct: `${R * I * I} W`,
      distractors: [`${R * I} W`, `${R + I} W`, `${I / R} W`],
      explanation: `P = I²R = ${I}²×${R} = ${R * I * I} W.`,
      topic: 'Current electricity',
    };
  }
  if (family === 9) {
    const m = irand(r, 2, 10);
    const c = 4200;
    const dt = irand(r, 2, 8);
    const q = m * c * dt;
    return {
      text: `Heat required to raise temperature of ${m} kg water by ${dt} °C (c = 4200 J kg⁻¹ K⁻¹) is:`,
      correct: `${q} J`,
      distractors: [`${m * dt} J`, `${c * dt} J`, `${q / 2} J`],
      explanation: `Q = mcΔT = ${m}×4200×${dt} = ${q} J.`,
      topic: 'Thermodynamics',
    };
  }
  if (family === 10) {
    const f = irand(r, 2, 8);
    const d = irand(r, 1, 5);
    return {
      text: `Work done by a constant force ${f} N through displacement ${d} m is:`,
      correct: `${f * d} J`,
      distractors: [`${f + d} J`, `${f / d} J`, `${d - f} J`],
      explanation: `W = Fd = ${f}×${d} = ${f * d} J.`,
      topic: 'Work, energy, power',
    };
  }
  if (family === 11) {
    const v = irand(r, 10, 30);
    const t = irand(r, 2, 6);
    return {
      text: `A wave on a string has speed ${v} m/s and period ${t} s. Its frequency is:`,
      correct: `${(1 / t).toFixed(2)} Hz`,
      distractors: [`${v * t} Hz`, `${v / t} Hz`, `${t / v} Hz`],
      explanation: `f = 1/T = 1/${t} = ${(1 / t).toFixed(2)} Hz.`,
      topic: 'Waves',
    };
  }
  if (family === 12) {
    const e = irand(r, 2, 6);
    return {
      text: `Photons of energy ${e} eV correspond to photon energy in joules (1 eV = 1.6×10⁻¹⁹ J) as:`,
      correct: `${(e * 1.6e-19).toExponential(1)} J`,
      distractors: [`${e} J`, `${e / 1.6e-19} J`, `${(e * 1.6e-18).toExponential(1)} J`],
      explanation: `E = ${e} eV × 1.6×10⁻¹⁹ J/eV.`,
      topic: 'Modern physics',
    };
  }
  if (family === 13) {
    const m = irand(r, 2, 8);
    const v = irand(r, 3, 9);
    const p = m * v;
    return {
      text: `Linear momentum of a ${m} kg mass moving at ${v} m/s is:`,
      correct: `${p} kg·m/s`,
      distractors: [`${m + v} kg·m/s`, `${m / v} kg·m/s`, `${2 * p} kg·m/s`],
      explanation: `p = mv = ${m}×${v} = ${p} kg·m/s.`,
      topic: 'Laws of motion',
    };
  }
  if (family === 14) {
    const h = irand(r, 2, 8);
    const g = 10;
    const v = Math.sqrt(2 * g * h);
    return {
      text: `Speed of a body falling freely from height ${h} m (g = 10 m/s²) is:`,
      correct: `${v.toFixed(1)} m/s`,
      distractors: [`${h * g} m/s`, `${h + g} m/s`, `${(h / g).toFixed(1)} m/s`],
      explanation: `v = √(2gh) = √(2×10×${h}) = ${v.toFixed(1)} m/s.`,
      topic: 'Kinematics',
    };
  }
  return {
    text: `A body starts with ${u} m/s and accelerates at ${a} m/s² for ${t} s. Final velocity is:`,
    correct: `${v} m/s`,
    distractors: [`${u * t} m/s`, `${a * t} m/s`, `${u + a} m/s`],
    explanation: `v = u+at = ${u}+${a}×${t} = ${v} m/s.`,
    topic: 'Kinematics',
  };
}

const CHEM_FACTS: Built[] = [
  { text: 'The oxidation number of oxygen in H₂O₂ is:', correct: '−1', distractors: ['−2', '0', '+1'], explanation: 'In peroxides oxygen is −1.', topic: 'Redox' },
  { text: 'Which is an intensive property?', correct: 'Temperature', distractors: ['Mass', 'Volume', 'Enthalpy'], explanation: 'Intensive properties do not depend on amount.', topic: 'Thermodynamics' },
  { text: 'pH of a neutral aqueous solution at 298 K is:', correct: '7', distractors: ['0', '1', '14'], explanation: '[H⁺]=10⁻⁷ M at 298 K.', topic: 'Equilibrium' },
  { text: 'Gas evolved when zinc reacts with dilute H₂SO₄ is:', correct: 'Hydrogen', distractors: ['Oxygen', 'Chlorine', 'Nitrogen'], explanation: 'Zn + H₂SO₄ → ZnSO₄ + H₂.', topic: 'Metals' },
  { text: 'The most electronegative element is:', correct: 'Fluorine', distractors: ['Chlorine', 'Oxygen', 'Nitrogen'], explanation: 'Fluorine has the highest electronegativity.', topic: 'Periodic table' },
  { text: 'Which compound does not undergo Friedel–Crafts alkylation easily?', correct: 'Nitrobenzene', distractors: ['Toluene', 'Anisole', 'Chlorobenzene'], explanation: '−NO₂ strongly deactivates the ring.', topic: 'Organic chemistry' },
  { text: 'Number of moles in 18 g of water is:', correct: '1 mol', distractors: ['2 mol', '0.5 mol', '18 mol'], explanation: 'Molar mass of H₂O is 18 g mol⁻¹.', topic: 'Mole concept' },
  { text: 'Hybridisation of carbon in CH₄ is:', correct: 'sp³', distractors: ['sp²', 'sp', 'dsp²'], explanation: 'Four equivalent C–H bonds: tetrahedral sp³.', topic: 'Chemical bonding' },
];

function chemistryFamily(spec: FallbackSpec): number {
  return slotFamilyEven(spec, 15);
}

function chemistryBuilt(spec: FallbackSpec, r: () => number): Built {
  const kind = chemistryFamily(spec);
  if (kind === 0) {
    const mass = irand(r, 2, 12) * 8;
    const moles = mass / 16;
    return {
      text: `Methane (CH₄): how many moles are present in ${mass} g (C=12, H=1)?`,
      correct: `${Number.isInteger(moles) ? moles : moles.toFixed(2)} mol`,
      distractors: [`${mass} mol`, `${mass * 16} mol`, `${(16 / mass).toFixed(2)} mol`],
      explanation: `Molar mass of CH₄ = 16 g mol⁻¹. n = ${mass}/16 = ${moles} mol.`,
      topic: 'Mole concept',
    };
  }
  if (kind === 1) {
    const n = irand(r, 2, 6);
    return {
      text: `Avogadro count: number of molecules in ${n} mol of N₂ is:`,
      correct: `${n} Nₐ`,
      distractors: [`Nₐ / ${n}`, `${n + 1} Nₐ`, `${2 * n} Nₐ`],
      explanation: '1 mol contains Nₐ molecules, so n mol contains n Nₐ molecules.',
      topic: 'Mole concept',
    };
  }
  if (kind === 2) {
    const v = irand(r, 1, 4);
    return {
      text: `Solution molarity: ${v} mol solute in 1 L solution equals:`,
      correct: `${v} M`,
      distractors: [`${v + 1} M`, `${2 * v} M`, `${v / 2} M`],
      explanation: 'Molarity = moles of solute / volume of solution in litres.',
      topic: 'Solutions',
    };
  }
  if (kind === 3) {
    const mass = irand(r, 4, 20) * 9;
    const moles = +(mass / 18).toFixed(2);
    return {
      text: `Water (H₂O): how many moles are present in ${mass} g (molar mass 18 g mol⁻¹)?`,
      correct: `${moles} mol`,
      distractors: [`${mass} mol`, `${(18 / mass).toFixed(2)} mol`, `${mass * 18} mol`],
      explanation: `n = mass/molar mass = ${mass}/18 = ${moles} mol.`,
      topic: 'Mole concept',
    };
  }
  if (kind === 4) {
    const v = irand(r, 2, 8);
    return {
      text: `Ideal gas at STP: volume occupied by ${v} mol (22.4 L mol⁻¹) is:`,
      correct: `${(v * 22.4).toFixed(1)} L`,
      distractors: [`${v} L`, `${(v / 22.4).toFixed(2)} L`, `${v * 2} L`],
      explanation: `V = n × 22.4 L = ${v} × 22.4 L.`,
      topic: 'Gaseous state',
    };
  }
  if (kind === 5) {
    const h = irand(r, 1, 14);
    return {
      text: `pH of a solution with [H⁺] = 10^${-h} M is:`,
      correct: String(h),
      distractors: [String(h + 1), String(Math.max(0, h - 1)), String(14 - h)],
      explanation: `pH = −log[H⁺] = ${h}.`,
      topic: 'Equilibrium',
    };
  }
  if (kind === 6) {
    const elements: Array<{ z: number; name: string; wrong: [string, string, string] }> = [
      { z: 6, name: 'Carbon', wrong: ['Helium', 'Oxygen', 'Neon'] },
      { z: 8, name: 'Oxygen', wrong: ['Nitrogen', 'Fluorine', 'Carbon'] },
      { z: 11, name: 'Sodium', wrong: ['Magnesium', 'Potassium', 'Chlorine'] },
      { z: 17, name: 'Chlorine', wrong: ['Argon', 'Sulphur', 'Fluorine'] },
    ];
    const item = elements[slotFamily(spec, elements.length)];
    return {
      text: `Atomic number ${item.z} corresponds to which element?`,
      correct: item.name,
      distractors: [...item.wrong],
      explanation: `Atomic number ${item.z} is ${item.name}.`,
      topic: 'Periodic table',
    };
  }
  if (kind === 7) {
    const w = irand(r, 2, 10);
    return {
      text: `Mass percent of oxygen in CO₂ (C=12, O=16) is approximately:`,
      correct: `${Math.round((32 / 44) * 100)}%`,
      distractors: ['50%', '25%', `${w * 10}%`],
      explanation: 'Mass % = (mass of O in formula / molar mass) × 100.',
      topic: 'Mole concept',
    };
  }
  if (kind === 8) {
    const n = irand(r, 1, 4);
    return {
      text: `Normality of ${n} M H₂SO₄ (dibasic acid) is:`,
      correct: `${2 * n} N`,
      distractors: [`${n} N`, `${n / 2} N`, `${n + 2} N`],
      explanation: 'For H₂SO₄, normality = 2 × molarity.',
      topic: 'Solutions',
    };
  }
  if (kind === 9) {
    const p = irand(r, 2, 5);
    return {
      text: `If equilibrium constant K = 10^${p} for a reaction, the reaction favors:`,
      correct: 'Products',
      distractors: ['Reactants only', 'Neither side', 'Catalyst'],
      explanation: 'K >> 1 indicates product-favored equilibrium.',
      topic: 'Equilibrium',
    };
  }
  if (kind === 10) {
    return {
      text: `For a monatomic ideal gas, Cp − Cv equals (in universal gas constant units):`,
      correct: 'R',
      distractors: ['2R', 'R/2', 'Cv'],
      explanation: "Mayer's relation: Cp − Cv = R for an ideal gas.",
      topic: 'Thermodynamics',
    };
  }
  if (kind === 11) {
    const n = irand(r, 2, 6);
    return {
      text: `Number of σ bonds in ethane (C₂H₆) is:`,
      correct: '7',
      distractors: ['6', '8', String(n)],
      explanation: 'Ethane has 1 C–C σ bond and 6 C–H σ bonds.',
      topic: 'Organic chemistry',
    };
  }
  if (kind === 12) {
    const v = irand(r, 2, 8);
    return {
      text: `Oxidation state of Cr in K₂Cr₂O₇ is:`,
      correct: '+6',
      distractors: ['+3', '+4', `+${v}`],
      explanation: 'In dichromate, chromium is in the +6 oxidation state.',
      topic: 'Redox',
    };
  }
  if (kind === 13) {
    const t = irand(r, 300, 400);
    return {
      text: `Boiling point of water at 1 atm is closest to:`,
      correct: '100 °C',
      distractors: ['0 °C', '273 °C', `${t} °C`],
      explanation: 'Water boils at 100 °C at standard atmospheric pressure.',
      topic: 'States of matter',
    };
  }
  if (kind === 14) {
    const n = irand(r, 2, 5);
    return {
      text: `In ${n} mol of CO₂, total moles of atoms is:`,
      correct: `${3 * n} mol`,
      distractors: [`${n} mol`, `${2 * n} mol`, `${4 * n} mol`],
      explanation: 'Each CO₂ has 3 atoms; total = 3n mol atoms.',
      topic: 'Mole concept',
    };
  }
  return CHEM_FACTS[
    (slotFamily(spec, CHEM_FACTS.length) + irand(r, 0, Math.max(CHEM_FACTS.length - 1, 0))) %
      CHEM_FACTS.length
  ];
}

const BIO_FACTS: Built[] = [
  { text: 'The natural pacemaker of the human heart is the:', correct: 'SA node', distractors: ['AV node', 'Purkinje fibres', 'Bundle of His'], explanation: 'SA node initiates the cardiac impulse.', topic: 'Circulation' },
  { text: 'Powerhouse of the cell is the:', correct: 'Mitochondria', distractors: ['Nucleus', 'Ribosome', 'Golgi apparatus'], explanation: 'Mitochondria generate most cellular ATP.', topic: 'Cell biology' },
  { text: 'Green pigment that traps solar energy in leaves is:', correct: 'Chlorophyll', distractors: ['Haemoglobin', 'Carotene', 'Xanthophyll'], explanation: 'Chlorophyll absorbs light for photosynthesis.', topic: 'Photosynthesis' },
  { text: 'Peat formation is associated with:', correct: 'Sphagnum', distractors: ['Marchantia', 'Riccia', 'Funaria'], explanation: 'Sphagnum moss forms peat.', topic: 'Plant kingdom' },
  { text: 'Site of protein synthesis in a cell is the:', correct: 'Ribosome', distractors: ['Lysosome', 'Vacuole', 'Centrosome'], explanation: 'Ribosomes translate mRNA into protein.', topic: 'Cell organelles' },
  { text: 'Which blood cells help in clotting?', correct: 'Platelets', distractors: ['RBC', 'Lymphocytes', 'Monocytes'], explanation: 'Platelets release clotting factors.', topic: 'Human physiology' },
  { text: 'Basic unit of classification is the:', correct: 'Species', distractors: ['Genus', 'Family', 'Order'], explanation: 'Species is the lowest principal taxonomic rank used as the basic unit.', topic: 'Diversity' },
  { text: 'DNA replication is:', correct: 'Semi-conservative', distractors: ['Conservative', 'Dispersive', 'Non-conservative'], explanation: 'Each new DNA has one parental and one new strand.', topic: 'Genetics' },
  { text: 'Normal human diploid chromosome number is:', correct: '46', distractors: ['23', '44', '48'], explanation: 'Somatic cells have 46 chromosomes; gametes have 23.', topic: 'Genetics' },
  { text: 'Functional unit of the kidney is the:', correct: 'Nephron', distractors: ['Neuron', 'Alveolus', 'Osteon'], explanation: 'Nephrons filter blood and form urine.', topic: 'Excretion' },
  { text: 'Gas essential for photosynthesis is:', correct: 'Carbon dioxide', distractors: ['Nitrogen', 'Hydrogen', 'Ozone'], explanation: 'CO₂ is fixed into sugars during photosynthesis.', topic: 'Plant physiology' },
  { text: 'Insulin is secreted by:', correct: 'Pancreas', distractors: ['Thyroid', 'Adrenal', 'Pituitary'], explanation: 'β-cells of islets of Langerhans secrete insulin.', topic: 'Endocrine' },
  { text: 'Largest gland in the human body is the:', correct: 'Liver', distractors: ['Pancreas', 'Thyroid', 'Spleen'], explanation: 'The liver is the largest gland.', topic: 'Human physiology' },
  { text: 'Xylem mainly transports:', correct: 'Water and minerals', distractors: ['Food', 'Hormones only', 'Oxygen'], explanation: 'Xylem conducts water and minerals upward.', topic: 'Plant anatomy' },
  { text: 'Which blood group is called the universal donor?', correct: 'O negative', distractors: ['AB positive', 'A positive', 'B negative'], explanation: 'O negative lacks A, B and Rh antigens.', topic: 'Circulation' },
  { text: 'Phloem mainly transports:', correct: 'Food (sucrose)', distractors: ['Water only', 'Minerals only', 'Oxygen'], explanation: 'Phloem translocates organic food, mainly sucrose.', topic: 'Plant anatomy' },
  { text: 'Stomata are primarily involved in:', correct: 'Gaseous exchange', distractors: ['Nitrogen fixation', 'Pollination', 'Seed dispersal'], explanation: 'Stomata allow CO₂ in and O₂/water vapour out.', topic: 'Plant physiology' },
  { text: 'The structural and functional unit of the nervous system is the:', correct: 'Neuron', distractors: ['Nephron', 'Alveolus', 'Osteon'], explanation: 'Neurons conduct nerve impulses.', topic: 'Human physiology' },
  { text: 'Which organelle contains chlorophyll?', correct: 'Chloroplast', distractors: ['Mitochondrion', 'Nucleus', 'Ribosome'], explanation: 'Chloroplasts house chlorophyll for photosynthesis.', topic: 'Cell organelles' },
  { text: 'Double circulation in humans means blood passes twice through the:', correct: 'Heart', distractors: ['Liver', 'Kidney', 'Lungs only'], explanation: 'Pulmonary and systemic circuits both go through the heart.', topic: 'Circulation' },
  { text: 'Mendel’s law of segregation is demonstrated by a:', correct: 'Monohybrid cross', distractors: ['Food chain', 'Food web', 'Nitrogen cycle'], explanation: 'A monohybrid cross tracks one trait through segregation of alleles.', topic: 'Genetics' },
  { text: 'The largest part of the human brain is the:', correct: 'Cerebrum', distractors: ['Cerebellum', 'Medulla', 'Pons'], explanation: 'The cerebrum is the largest brain region.', topic: 'Human physiology' },
  { text: 'Which vitamin is synthesised in human skin in sunlight?', correct: 'Vitamin D', distractors: ['Vitamin C', 'Vitamin K', 'Vitamin B12'], explanation: 'UV light helps form vitamin D in the skin.', topic: 'Human physiology' },
  { text: 'Root hairs mainly help in:', correct: 'Absorption of water', distractors: ['Photosynthesis', 'Transpiration from leaves', 'Pollination'], explanation: 'Root hairs increase surface area for water and mineral uptake.', topic: 'Plant physiology' },
  { text: 'The process of conversion of glucose to ethanol in yeast is:', correct: 'Fermentation', distractors: ['Photosynthesis', 'Transpiration', 'Nitrification'], explanation: 'Anaerobic respiration in yeast yields ethanol and CO₂.', topic: 'Respiration' },
  { text: 'Which blood vessel carries oxygenated blood from lungs to the heart?', correct: 'Pulmonary vein', distractors: ['Pulmonary artery', 'Vena cava', 'Hepatic vein'], explanation: 'Pulmonary veins return oxygen-rich blood to the left atrium.', topic: 'Circulation' },
  { text: 'Cell wall of plants is mainly made of:', correct: 'Cellulose', distractors: ['Chitin', 'Peptidoglycan', 'Keratin'], explanation: 'Plant cell walls are cellulose-based.', topic: 'Cell biology' },
  { text: 'Which plant hormone is mainly responsible for cell elongation?', correct: 'Auxin', distractors: ['Insulin', 'Adrenaline', 'Thyroxine'], explanation: 'Auxins promote stem elongation and tropisms.', topic: 'Plant physiology' },
  { text: 'Alveoli in lungs are the site of:', correct: 'Gaseous exchange', distractors: ['Protein digestion', 'Urine formation', 'Bile storage'], explanation: 'Alveoli provide a large surface for O₂–CO₂ exchange.', topic: 'Human physiology' },
];

function biologyFamily(spec: FallbackSpec): number {
  return slotFamilyEven(spec, 15);
}

function biologyBuilt(spec: FallbackSpec, r: () => number): Built {
  const isBot = spec.subjectId === 'bot';
  const isZoo = spec.subjectId === 'zoo';
  const family = isBot || isZoo || spec.subjectId === 'bio' ? biologyFamily(spec) : slotFamily(spec, 12);
  if (family === 0) {
    if (isBot) {
      const pairs: Array<[number, string, string]> = [
        [12, 'haploid gamete', 'chromosome number in a haploid plant cell'],
        [24, 'diploid somatic cell', 'chromosome number in a diploid plant cell'],
        [6, 'haploid endosperm (typical angiosperm)', 'chromosome number'],
        [18, 'triploid endosperm cell', 'chromosome number'],
      ];
      const [baseN, subject, topic] = pairs[slotFamily(spec, pairs.length)];
      const n = baseN + irand(r, 0, 5) * 2;
      return {
        text: `The ${topic} in a ${subject} is:`,
        correct: String(n),
        distractors: [String(n + 2), String(n - 2 || n + 4), String(n * 2)],
        explanation: `Plant cells follow standard ploidy rules; this ${subject} has ${n} chromosomes.`,
        topic: 'Plant genetics',
      };
    }
    const pairs: Array<[number, string, string]> = [
      [46, 'human somatic cell', 'diploid chromosome number'],
      [23, 'human gamete', 'haploid chromosome number'],
      [44, 'human autosome count in a somatic cell', 'autosomes'],
      [22, 'human autosome pairs', 'autosome pairs'],
    ];
    const [baseN, subject, topic] = pairs[slotFamily(spec, pairs.length)];
    const n = baseN + irand(r, 0, 5) * 2;
    return {
      text: `The ${topic} in a ${subject} is:`,
      correct: String(n),
      distractors: [String(n + 2), String(n - 2 || n + 4), String(n * 2)],
      explanation: `Standard human karyotype: 46 chromosomes (23 pairs) in somatic cells; gametes are haploid.`,
      topic: 'Genetics',
    };
  }
  if (family === 1) {
    const n = irand(r, 2, 6);
    return {
      text: `If a diploid cell has 2n = ${2 * n} chromosomes, each gamete after meiosis has:`,
      correct: String(n),
      distractors: [String(2 * n), String(4 * n), String(n + 1)],
      explanation: `Meiosis halves the chromosome number: 2n = ${2 * n} ⇒ n = ${n}.`,
      topic: isBot ? 'Plant genetics' : 'Genetics',
    };
  }
  if ((isBot || isZoo) && family === 2) {
    const n = irand(r, 4, 20);
    return isBot
      ? {
          text: `In a plant cell, if ${n} chloroplasts are observed in a leaf mesophyll cell, the organelle responsible for photosynthesis is:`,
          correct: 'Chloroplast',
          distractors: ['Mitochondrion', 'Nucleus', 'Ribosome'],
          explanation: 'Chloroplasts contain chlorophyll for photosynthesis.',
          topic: 'Plant physiology',
        }
      : {
          text: `A human heart beats approximately ${n * 4} times per minute at rest. The chamber that receives oxygenated blood from lungs is:`,
          correct: 'Left atrium',
          distractors: ['Right atrium', 'Right ventricle', 'Left ventricle'],
          explanation: 'Oxygenated blood from pulmonary veins enters the left atrium.',
          topic: 'Circulation',
        };
  }
  if ((isBot || isZoo) && family === 3) {
    const n = irand(r, 2, 10);
    return isBot
      ? {
          text: `Root hairs increase surface area for absorption. If length increases by ${n} times, absorption area scales roughly as:`,
          correct: `~${n} times (linear dimension)`,
          distractors: [`~${n * n} times`, `~${n + 1} times`, 'Unchanged'],
          explanation: 'Absorptive area is proportional to extensions of root epidermal surface.',
          topic: 'Plant anatomy',
        }
      : {
          text: `If ${n} L of oxygen is consumed per minute during respiration, the primary gas exchange organ is:`,
          correct: 'Lungs',
          distractors: ['Liver', 'Kidney', 'Stomach'],
          explanation: 'Alveoli in lungs are the main site of gas exchange.',
          topic: 'Human physiology',
        };
  }
  if ((isBot || isZoo) && family === 4) {
    const n = irand(r, 2, 8);
    return isBot
      ? {
          text: `During photosynthesis, ${n} molecules of CO₂ are fixed per cycle reference. The primary site is:`,
          correct: 'Chloroplast',
          distractors: ['Mitochondrion', 'Nucleus', 'Ribosome'],
          explanation: 'Photosynthesis occurs in chloroplasts.',
          topic: 'Photosynthesis',
        }
      : {
          text: `If ${n} units of oxygen are delivered to tissues per cycle, the blood pigment carrying it is:`,
          correct: 'Haemoglobin',
          distractors: ['Chlorophyll', 'Melanin', 'Keratin'],
          explanation: 'Haemoglobin transports oxygen in blood.',
          topic: 'Circulation',
        };
  }
  if ((isBot || isZoo) && family === 5) {
    const n = irand(r, 3, 12);
    return isBot
      ? {
          text: `Transpiration pull helps move water up xylem. If ${n} stomata are open, the main driving force is:`,
          correct: 'Evaporation from leaves',
          distractors: ['Root pressure only', 'Gravity', 'Photosynthesis in roots'],
          explanation: 'Transpiration creates tension that pulls water upward.',
          topic: 'Plant physiology',
        }
      : {
          text: `If ${n} nephrons filter blood per kidney reference unit, the functional unit of the kidney is:`,
          correct: 'Nephron',
          distractors: ['Neuron', 'Alveolus', 'Osteon'],
          explanation: 'Nephrons filter blood and form urine.',
          topic: 'Excretion',
        };
  }
  if ((isBot || isZoo || spec.subjectId === 'bio') && family >= 6) {
    const botStems: Built[] = [
      {
        text: `Which tissue transports water in plants?`,
        correct: 'Xylem',
        distractors: ['Phloem', 'Epidermis', 'Cork'],
        explanation: 'Xylem conducts water and minerals.',
        topic: 'Plant anatomy',
      },
      {
        text: `Which part of the flower develops into fruit after fertilisation?`,
        correct: 'Ovary',
        distractors: ['Stamen', 'Petal', 'Sepal'],
        explanation: 'The ovary ripens into fruit.',
        topic: 'Plant reproduction',
      },
      {
        text: `Stomata open mainly to allow entry of:`,
        correct: 'Carbon dioxide',
        distractors: ['Nitrogen', 'Methane', 'Helium'],
        explanation: 'CO₂ enters for photosynthesis.',
        topic: 'Plant physiology',
      },
      {
        text: `Which plant hormone promotes cell division?`,
        correct: 'Cytokinin',
        distractors: ['Auxin', 'Ethylene', 'Abscisic acid'],
        explanation: 'Cytokinins stimulate cell division.',
        topic: 'Plant physiology',
      },
      {
        text: `Bryophytes are commonly called:`,
        correct: 'Amphibians of plant kingdom',
        distractors: ['Fishes of plant kingdom', 'Reptiles of plant kingdom', 'Birds of plant kingdom'],
        explanation: 'Bryophytes need water for reproduction.',
        topic: 'Plant kingdom',
      },
      {
        text: `Double fertilisation is characteristic of:`,
        correct: 'Angiosperms',
        distractors: ['Bryophytes', 'Pteridophytes', 'Gymnosperms only'],
        explanation: 'Angiosperms show double fertilisation.',
        topic: 'Plant reproduction',
      },
      {
        text: `In C₄ plants, initial CO₂ fixation occurs in:`,
        correct: 'Mesophyll cells',
        distractors: ['Bundle sheath only', 'Root cortex', 'Epidermis'],
        explanation: 'C₄ pathway fixes CO₂ in mesophyll first.',
        topic: 'Photosynthesis',
      },
      {
        text: `Which structure anchors the plant and absorbs minerals?`,
        correct: 'Root',
        distractors: ['Leaf', 'Flower', 'Fruit'],
        explanation: 'Roots anchor and absorb water/minerals.',
        topic: 'Plant morphology',
      },
      {
        text: `Pollen grains are produced in the:`,
        correct: 'Anther',
        distractors: ['Stigma', 'Ovule', 'Style'],
        explanation: 'Anthers produce pollen.',
        topic: 'Plant reproduction',
      },
      {
        text: `Companion cells are associated with:`,
        correct: 'Sieve tube elements',
        distractors: ['Tracheids', 'Vessels', 'Sclereids'],
        explanation: 'Companion cells support sieve tube elements in phloem.',
        topic: 'Plant anatomy',
      },
      {
        text: `The male gametophyte in angiosperms is represented by:`,
        correct: 'Pollen grain',
        distractors: ['Embryo sac', 'Megaspore', 'Zygote'],
        explanation: 'Pollen is the male gametophyte.',
        topic: 'Plant reproduction',
      },
      {
        text: `Peristome teeth help in spore dispersal in:`,
        correct: 'Bryophytes',
        distractors: ['Algae', 'Pteridophytes only', 'Gymnosperms'],
        explanation: 'Moss capsules have peristome for spore release.',
        topic: 'Plant kingdom',
      },
      {
        text: `Lenticels are primarily involved in:`,
        correct: 'Gaseous exchange in stems',
        distractors: ['Water absorption', 'Photosynthesis', 'Pollination'],
        explanation: 'Lenticels permit gas exchange in woody stems.',
        topic: 'Plant anatomy',
      },
      {
        text: `The endosperm in most angiosperms is:`,
        correct: 'Triploid',
        distractors: ['Haploid', 'Diploid', 'Tetraploid'],
        explanation: 'Double fertilisation yields triploid endosperm.',
        topic: 'Plant reproduction',
      },
      {
        text: `Which meristem is responsible for increase in girth?`,
        correct: 'Lateral meristem (cambium)',
        distractors: ['Apical meristem', 'Intercalary meristem only', 'Root cap'],
        explanation: 'Vascular cambium increases stem/root diameter.',
        topic: 'Plant growth',
      },
      {
        text: `In legumes, root nodules contain bacteria that fix:`,
        correct: 'Nitrogen',
        distractors: ['Carbon dioxide', 'Oxygen', 'Sulphur'],
        explanation: 'Rhizobium fixes atmospheric nitrogen.',
        topic: 'Plant physiology',
      },
      {
        text: `Apomixis in plants refers to:`,
        correct: 'Seed formation without fertilisation',
        distractors: ['Cross pollination', 'Vegetative propagation only', 'Double fertilisation'],
        explanation: 'Apomixis produces seeds asexually.',
        topic: 'Plant reproduction',
      },
      {
        text: `Which plant tissue provides mechanical support and is dead at maturity?`,
        correct: 'Sclerenchyma',
        distractors: ['Parenchyma', 'Collenchyma', 'Meristem'],
        explanation: 'Sclerenchyma cells are lignified and dead.',
        topic: 'Plant anatomy',
      },
      {
        text: `Photoperiodism primarily influences:`,
        correct: 'Flowering',
        distractors: ['Root growth only', 'Transpiration rate only', 'Mineral absorption only'],
        explanation: 'Day length cues flowering in many plants.',
        topic: 'Plant physiology',
      },
    ];
    const zooStems: Built[] = [
      {
        text: `Which chamber pumps oxygenated blood to the body?`,
        correct: 'Left ventricle',
        distractors: ['Right atrium', 'Right ventricle', 'Left atrium'],
        explanation: 'Left ventricle pumps systemic circulation.',
        topic: 'Circulation',
      },
      {
        text: `Insulin deficiency causes:`,
        correct: 'Diabetes mellitus',
        distractors: ['Goitre', 'Rickets', 'Scurvy'],
        explanation: 'Insulin regulates blood glucose.',
        topic: 'Endocrine',
      },
      {
        text: `Which blood cells are involved in immunity?`,
        correct: 'Lymphocytes',
        distractors: ['RBC', 'Platelets', 'Neutrophils only'],
        explanation: 'Lymphocytes mediate adaptive immunity.',
        topic: 'Immunity',
      },
      {
        text: `The functional unit of excretion in humans is:`,
        correct: 'Nephron',
        distractors: ['Neuron', 'Alveolus', 'Villus'],
        explanation: 'Nephrons filter blood in kidneys.',
        topic: 'Excretion',
      },
      {
        text: `Which part of the brain controls balance?`,
        correct: 'Cerebellum',
        distractors: ['Cerebrum', 'Medulla', 'Hypothalamus'],
        explanation: 'Cerebellum coordinates balance.',
        topic: 'Human physiology',
      },
      {
        text: `Haemoglobin is found in:`,
        correct: 'Red blood cells',
        distractors: ['Platelets', 'Plasma only', 'Lymph'],
        explanation: 'RBCs contain haemoglobin.',
        topic: 'Circulation',
      },
      {
        text: `Which gland is known as the master gland?`,
        correct: 'Pituitary',
        distractors: ['Thyroid', 'Adrenal', 'Pancreas'],
        explanation: 'Pituitary regulates many endocrine glands.',
        topic: 'Endocrine',
      },
      {
        text: `Exchange of gases in lungs occurs in:`,
        correct: 'Alveoli',
        distractors: ['Bronchi', 'Trachea', 'Larynx'],
        explanation: 'Alveoli provide gas exchange surface.',
        topic: 'Human physiology',
      },
      {
        text: `Which connective tissue stores fat?`,
        correct: 'Adipose tissue',
        distractors: ['Cartilage', 'Bone', 'Blood'],
        explanation: 'Adipose tissue stores lipids.',
        topic: 'Human physiology',
      },
    ];
    const stems = isBot ? botStems : isZoo ? zooStems : [...botStems, ...zooStems];
    const pick =
      (family - 6 + irand(r, 0, Math.max(stems.length - 1, 0)) + (spec.paperSeed % stems.length)) %
      stems.length;
    return stems[pick];
  }
  const pool =
    spec.subjectId === 'bio'
      ? BIO_FACTS.filter((f) =>
          /cell|genetics|physiology|circulation|photosynthesis/i.test(`${f.topic} ${f.text}`),
        )
      : BIO_FACTS;
  const list = pool.length >= 4 ? pool : BIO_FACTS;
  return list[
    (slotFamily(spec, list.length) +
      (spec.attempt ?? 0) * 3 +
      irand(r, 0, Math.max(list.length - 1, 0)) +
      (spec.paperSeed % list.length)) %
      list.length
  ];
}

function reasoningBuilt(spec: FallbackSpec, r: () => number): Built {
  const kind = slotFamily(spec, 12);
  if (kind === 0) {
    const start = irand(r, 2, 9);
    const terms = [start];
    for (let i = 0; i < 4; i++) terms.push(terms[i] * 2 + 1);
    const next = terms[4] * 2 + 1;
    return {
      text: `Find the next term in the series: ${terms.join(', ')}, …`,
      correct: String(next),
      distractors: [String(next - 2), String(next + 6), String(terms[4] * 2)],
      explanation: `Each term = 2×previous + 1, so next = 2×${terms[4]}+1 = ${next}.`,
      topic: 'Number series',
    };
  }
  if (kind === 1) {
    const a = irand(r, 3, 12);
    return {
      text: `If in a certain code CAT is written as ${a + 3}, ${a + 1}, ${a + 20}, how is the positional shift best described?`,
      correct: `Each letter +${a} in alphabet position, then written as numbers`,
      distractors: ['Letters reversed', 'Vowels dropped', 'Opposite letters used'],
      explanation: 'Coding-decoding items map letters to shifted alphabet positions.',
      topic: 'Coding-decoding',
    };
  }
  const ages = [irand(r, 12, 18), irand(r, 20, 28), irand(r, 30, 40)];
  if (kind === 2) {
    return {
      text: `Find the odd one out: ${ages[0]}, ${ages[1]}, ${ages[2]}, potato`,
      correct: 'potato',
      distractors: [String(ages[0]), String(ages[1]), String(ages[2])],
      explanation: 'The numbers are ages; potato is not a number.',
      topic: 'Classification',
    };
  }
  return mathBuilt(spec, r);
}

const LANG_FACTS: Built[] = [
  { text: 'Identify the error: “He go to school every day.” The verb should be:', correct: 'goes', distractors: ['going', 'gone', 'goed'], explanation: 'Third person singular present takes -s/-es.', topic: 'Subject-verb agreement' },
  { text: 'Passive of “They are painting the wall” is:', correct: 'The wall is being painted', distractors: ['The wall painted', 'The wall was painted', 'The wall has painted'], explanation: 'Present continuous passive: is/are being + V3.', topic: 'Voice' },
  { text: 'Choose the correct preposition: interested ___ music', correct: 'in', distractors: ['on', 'at', 'for'], explanation: 'The collocation is interested in.', topic: 'Prepositions' },
  { text: 'Choose the correctly spelt word:', correct: 'Accommodation', distractors: ['Accomodation', 'Acommodation', 'Acomodation'], explanation: 'Double c and double m.', topic: 'Spelling' },
  { text: 'Synonym of HAPPY:', correct: 'Joyful', distractors: ['Sad', 'Angry', 'Tired'], explanation: 'Joyful means very happy.', topic: 'Vocabulary' },
  { text: 'Antonym of BENEVOLENT:', correct: 'Malevolent', distractors: ['Kind', 'Generous', 'Friendly'], explanation: 'Malevolent is the opposite of kindly.', topic: 'Vocabulary' },
  { text: 'Identify the tense: “She has finished the work.”', correct: 'Present perfect', distractors: ['Simple past', 'Past perfect', 'Future perfect'], explanation: 'has/have + past participle = present perfect.', topic: 'Grammar' },
  { text: 'Choose the correct article: ___ honest man', correct: 'an', distractors: ['a', 'the', 'no article'], explanation: 'honest begins with a vowel sound.', topic: 'Articles' },
  { text: 'Plural of “child” is:', correct: 'children', distractors: ['childs', 'childes', 'childrens'], explanation: 'Child takes the irregular plural children.', topic: 'Nouns' },
  { text: 'The reported speech of “He said, ‘I am tired’” is:', correct: 'He said that he was tired', distractors: ['He said that I am tired', 'He said that he is tired', 'He said he tired'], explanation: 'Present changes to past in reported speech.', topic: 'Narration' },
  { text: 'Find the synonym of QUICK:', correct: 'Rapid', distractors: ['Slow', 'Lazy', 'Late'], explanation: 'Rapid means fast/quick.', topic: 'Vocabulary' },
  { text: '“She sings well.” The adverb is:', correct: 'well', distractors: ['She', 'sings', 'none'], explanation: 'Well modifies the verb sings.', topic: 'Adverbs' },
  { text: 'Correct form: Neither of the boys ___ present.', correct: 'is', distractors: ['are', 'were', 'have'], explanation: 'Neither takes a singular verb.', topic: 'Concord' },
  { text: 'Antonym of ANCIENT:', correct: 'Modern', distractors: ['Old', 'Historic', 'Aged'], explanation: 'Ancient means very old; modern is the opposite.', topic: 'Vocabulary' },
  { text: 'The feminine of “actor” is:', correct: 'actress', distractors: ['actorless', 'actrine', 'actora'], explanation: 'Actress is the feminine form.', topic: 'Gender' },
  { text: 'Choose the correct conjunction: I waited ___ the train arrived.', correct: 'until', distractors: ['unless', 'since to', 'because of'], explanation: 'Until marks the waiting end-point.', topic: 'Conjunctions' },
  { text: 'Identify the error: “She don’t like tea.” Correct verb:', correct: 'doesn’t', distractors: ['don’t', 'didn’t not', 'not does'], explanation: 'Third person singular present uses does not / doesn’t.', topic: 'Subject-verb agreement' },
  { text: 'One-word substitution: a person who loves books', correct: 'Bibliophile', distractors: ['Auditor', 'Carnivore', 'Misanthrope'], explanation: 'Bibliophile means a lover of books.', topic: 'Vocabulary' },
  { text: 'Choose the correct form: The news ___ true.', correct: 'is', distractors: ['are', 'were', 'have'], explanation: 'News is uncountable and takes a singular verb.', topic: 'Concord' },
  { text: 'Idiom “once in a blue moon” means:', correct: 'Very rarely', distractors: ['Very often', 'At night', 'In anger'], explanation: 'A blue moon is infrequent, so the idiom means rarely.', topic: 'Idioms' },
  { text: 'Comparative of “good” is:', correct: 'better', distractors: ['gooder', 'more good', 'bestest'], explanation: 'Good–better–best is irregular.', topic: 'Adjectives' },
  { text: 'Passive of “Someone stole my bag” is:', correct: 'My bag was stolen', distractors: ['My bag stole', 'My bag is steal', 'My bag has steal'], explanation: 'Past simple passive: was/were + V3.', topic: 'Voice' },
];

function languageBuilt(spec: FallbackSpec, r: () => number): Built {
  if (spec.subjectId === 'hin') {
    return hindiBuilt(spec, r);
  }
  const family = spec.index % 5;
  if (family === 0) {
    const items: Array<[string, 'a' | 'an']> = [
      ['book', 'a'],
      ['apple', 'an'],
      ['umbrella', 'an'],
      ['hour', 'an'],
      ['honest man', 'an'],
      ['university', 'a'],
      ['European country', 'a'],
      ['MLA', 'an'],
      ['one-rupee note', 'a'],
      ['heir', 'an'],
    ];
    const [noun, correct] = items[spec.index % items.length];
    const other = correct === 'a' ? 'an' : 'a';
    return {
      text: `Choose the correct article: ___ ${noun}`,
      correct,
      distractors: [other, 'the only', 'no article'],
      explanation: 'Use a/an according to the sound that follows, not always the first letter.',
      topic: 'Articles',
    };
  }
  if (family === 1) {
    const pairs: Array<[string, string, string[], 'syn' | 'ant']> = [
      ['HAPPY', 'Joyful', ['Sad', 'Angry', 'Tired'], 'syn'],
      ['QUICK', 'Rapid', ['Slow', 'Lazy', 'Late'], 'syn'],
      ['ANCIENT', 'Modern', ['Old', 'Historic', 'Aged'], 'ant'],
      ['BENEVOLENT', 'Malevolent', ['Kind', 'Generous', 'Friendly'], 'ant'],
      ['BRAVE', 'Cowardly', ['Bold', 'Fearless', 'Heroic'], 'ant'],
      ['EXPAND', 'Contract', ['Grow', 'Widen', 'Increase'], 'ant'],
      ['SCARCE', 'Plentiful', ['Rare', 'Little', 'Few'], 'ant'],
      ['TRANSPARENT', 'Opaque', ['Clear', 'See-through', 'Lucid'], 'ant'],
      ['BEGIN', 'Commence', ['End', 'Halt', 'Pause'], 'syn'],
      ['FAMOUS', 'Renowned', ['Unknown', 'Hidden', 'Silent'], 'syn'],
    ];
    const [word, ans, distractors, kind] = pairs[spec.index % pairs.length];
    return {
      text: kind === 'ant' ? `Antonym of ${word}:` : `Synonym of ${word}:`,
      correct: ans,
      distractors,
      explanation: kind === 'ant'
        ? `${ans} is the standard exam-key opposite of ${word}.`
        : `${ans} is a close synonym of ${word}.`,
      topic: 'Vocabulary',
    };
  }
  return LANG_FACTS[(spec.index + irand(r, 0, LANG_FACTS.length - 1)) % LANG_FACTS.length];
}

const HINDI_VILOM: Array<[string, string, string[]]> = [
  ['आकाश', 'पाताल', ['पृथ्वी', 'वायु', 'सागर']],
  ['सुख', 'दुख', ['आनंद', 'हर्ष', 'शांति']],
  ['दिन', 'रात', ['सुबह', 'शाम', 'दोपहर']],
  ['मित्र', 'शत्रु', ['बंधु', 'सखा', 'मित्रता']],
  ['जन्म', 'मृत्यु', ['जीवन', 'आयु', 'उत्सव']],
  ['सत्य', 'असत्य', ['निष्ठा', 'धर्म', 'ज्ञान']],
  ['स्वर्ग', 'नरक', ['पृथ्वी', 'आकाश', 'सागर']],
  ['अंधकार', 'प्रकाश', ['छाया', 'धुंध', 'रात्रि']],
  ['आशा', 'निराशा', ['विश्वास', 'प्रेम', 'धैर्य']],
  ['ऊँचा', 'नीचा', ['मध्य', 'सरल', 'गहन']],
];

const HINDI_PARYAY: Array<[string, string, string[]]> = [
  ['जल', 'नीर', ['अग्नि', 'वायु', 'धरा']],
  ['सूर्य', 'रवि', ['चंद्र', 'रात्रि', 'मेघ']],
  ['पृथ्वी', 'धरा', ['आकाश', 'अग्नि', 'वायु']],
  ['अग्नि', 'पावक', ['जल', 'हिम', 'वायु']],
  ['वायु', 'पवन', ['पर्वत', 'नदी', 'अग्नि']],
  ['चंद्र', 'शशि', ['सूर्य', 'अग्नि', 'धरा']],
  ['पुष्प', 'सुमन', ['पत्थर', 'काष्ठ', 'लौह']],
  ['गृह', 'सदन', ['वन', 'नदी', 'पर्वत']],
  ['अश्व', 'घोड़ा', ['गौ', 'मेष', 'सिंह']],
  ['नयन', 'नेत्र', ['कर्ण', 'नासिका', 'दंत']],
];

const HINDI_SANDHI: Array<[string, string, string[]]> = [
  ['विद्यालय', 'विद्या + आलय', ['विद् + यालय', 'वि + द्यालय', 'विद्य + आलय']],
  ['विद्यार्थी', 'विद्या + अर्थी', ['विद् + यार्थी', 'वि + द्यार्थी', 'विद्य + अर्थी']],
  ['देवेंद्र', 'देव + इंद्र', ['देव +ेंद्र', 'दे + वेंद्र', 'देवे + इंद्र']],
  ['सूर्योदय', 'सूर्य + उदय', ['सूर + योदय', 'सु + र्योदय', 'सूर्यो + दय']],
  ['महात्मा', 'महा + आत्मा', ['मह + आत्मा', 'महात् + मा', 'म + हात्मा']],
  ['परमेश्वर', 'परम + ईश्वर', ['पर + मेश्वर', 'परमे + श्वर', 'परमेश + वर']],
  ['हिमालय', 'हिम + आलय', ['हि + मालय', 'हिमा + लय', 'हिमाल + य']],
  ['त्रिनेत्र', 'त्रि + नेत्र', ['त्रिन + एत्र', 'त्री + नेत्र', 'त्रिने + त्र']],
];

function hindiBuilt(spec: FallbackSpec, _r: () => number): Built {
  const family = spec.index % 6;
  if (family === 0) {
    const [word, antonym, distractors] = HINDI_VILOM[spec.index % HINDI_VILOM.length];
    return {
      text: `“${word}” शब्द का विलोम है:`,
      correct: antonym,
      distractors,
      explanation: `${word} का विलोम ${antonym} है।`,
      topic: 'विलोम',
    };
  }
  if (family === 1) {
    const [word, syn, distractors] = HINDI_PARYAY[spec.index % HINDI_PARYAY.length];
    return {
      text: `“${word}” का पर्यायवाची है:`,
      correct: syn,
      distractors,
      explanation: `${syn} ${word} का पर्याय है।`,
      topic: 'पर्यायवाची',
    };
  }
  if (family === 2) {
    const [word, sandhi, distractors] = HINDI_SANDHI[spec.index % HINDI_SANDHI.length];
    return {
      text: `संधि विच्छेद: ${word}`,
      correct: sandhi,
      distractors,
      explanation: `${sandhi} = ${word}।`,
      topic: 'संधि',
    };
  }
  if (family === 3) {
    const nouns: Array<[string, string, string[]]> = [
      ['गंगा', 'एकवचन', ['बहुवचन', 'द्विवचन', 'नपुंसक']],
      ['लड़के', 'बहुवचन', ['एकवचन', 'स्त्रीलिंग', 'नपुंसक']],
      ['पुस्तक', 'एकवचन', ['बहुवचन', 'पुल्लिंग', 'द्विवचन']],
      ['नदियाँ', 'बहुवचन', ['एकवचन', 'नपुंसक', 'क्रिया']],
    ];
    const [word, ans, distractors] = nouns[spec.index % nouns.length];
    return {
      text: `“${word}” शब्द का वचन है:`,
      correct: ans,
      distractors,
      explanation: `${word} ${ans} है।`,
      topic: 'वचन',
    };
  }
  if (family === 4) {
    const idioms: Array<[string, string, string[]]> = [
      ['नाक कटना', 'इज्जत जाना', ['सुंदर होना', 'दौड़ना', 'सो जाना']],
      ['अंधे की लकड़ी', 'एकमात्र सहारा', ['अंधेरा होना', 'लकड़ी बेचना', 'मार्ग भूलना']],
      ['आँख का तारा', 'बहुत प्रिय', ['देखना', 'रोशनी', 'चश्मा लगाना']],
      ['दाल न गलना', 'बात न बनना', ['खाना पकाना', 'मिर्च डालना', 'जलना']],
      ['होश उड़ना', 'बहुत डर जाना', ['सो जाना', 'पढ़ना', 'दौड़ना']],
      ['पेट में चूहे दौड़ना', 'बहुत भूख लगना', ['बीमार होना', 'हँसना', 'सोना']],
    ];
    const [idiom, meaning, distractors] = idioms[spec.index % idioms.length];
    return {
      text: `मुहावरा “${idiom}” का अर्थ है:`,
      correct: meaning,
      distractors,
      explanation: `${idiom} अर्थात् ${meaning}।`,
      topic: 'मुहावरे',
    };
  }
  const visheshan: Array<[string, string, string[]]> = [
    ['सुंदर फूल', 'सुंदर', ['फूल', 'है', 'का']],
    ['लाल गुलाब', 'लाल', ['गुलाब', 'एक', 'यह']],
    ['ऊँचा पर्वत', 'ऊँचा', ['पर्वत', 'है', 'वह']],
    ['मीठा फल', 'मीठा', ['फल', 'खाओ', 'ने']],
  ];
  const [phrase, ans, distractors] = visheshan[spec.index % visheshan.length];
  return {
    text: `विशेषण शब्द चुनिए: ${phrase}`,
    correct: ans,
    distractors,
    explanation: `${ans} विशेषता बताता है।`,
    topic: 'विशेषण',
  };
}

const SST_FACTS: Built[] = [
  { text: 'The Himalayas were formed due to collision of the Indian plate with the:', correct: 'Eurasian plate', distractors: ['Pacific plate', 'African plate', 'American plate'], explanation: 'Indian–Eurasian collision raised the Himalayas.', topic: 'Geography' },
  { text: 'Fundamental Rights are listed in which part of the Indian Constitution?', correct: 'Part III', distractors: ['Part II', 'Part IV', 'Part I'], explanation: 'Part III contains Articles 12–35.', topic: 'Civics' },
  { text: 'The Revolt of 1857 began at:', correct: 'Meerut', distractors: ['Delhi', 'Kanpur', 'Lucknow'], explanation: 'Sepoys at Meerut rose on 10 May 1857.', topic: 'Modern India' },
  { text: 'The French Revolution began in:', correct: '1789', distractors: ['1776', '1804', '1815'], explanation: 'Bastille, 1789.', topic: 'World history' },
  { text: 'First Governor-General of Bengal (Regulating Act 1773):', correct: 'Warren Hastings', distractors: ['Lord Canning', 'Lord Dalhousie', 'Lord Mountbatten'], explanation: 'Hastings was appointed in 1773.', topic: 'Modern India' },
  { text: 'The Constitution of India came into force on:', correct: '26 January 1950', distractors: ['15 August 1947', '26 November 1949', '2 October 1947'], explanation: 'Republic Day marks 26 January 1950.', topic: 'Civics' },
  { text: 'The Tropic of Cancer passes through how many Indian states (present count used in school texts)?', correct: '8', distractors: ['5', '6', '10'], explanation: 'School SST conventionally lists eight states.', topic: 'Geography' },
  { text: 'Who is called the Father of the Indian Constitution?', correct: 'B. R. Ambedkar', distractors: ['Jawaharlal Nehru', 'Rajendra Prasad', 'Sardar Patel'], explanation: 'Ambedkar chaired the Drafting Committee.', topic: 'Civics' },
  { text: 'The Prime Meridian passes through:', correct: 'Greenwich', distractors: ['Paris', 'New Delhi', 'New York'], explanation: '0° longitude is measured from Greenwich.', topic: 'Geography' },
  { text: 'Which is the longest river in India?', correct: 'Ganga', distractors: ['Yamuna', 'Godavari', 'Narmada'], explanation: 'The Ganga is India’s longest river.', topic: 'Geography' },
  { text: 'The Directive Principles of State Policy are in:', correct: 'Part IV', distractors: ['Part III', 'Part II', 'Part I'], explanation: 'Part IV contains Articles 36–51.', topic: 'Civics' },
  { text: 'Who founded the Maurya Empire?', correct: 'Chandragupta Maurya', distractors: ['Ashoka', 'Bindusara', 'Harsha'], explanation: 'Chandragupta Maurya founded the empire with Chanakya’s help.', topic: 'Ancient India' },
  { text: 'The Tropic of Capricorn does NOT pass through India. The Tropic of Cancer latitude is about:', correct: '23½° N', distractors: ['0°', '66½° N', '90° N'], explanation: 'The Tropic of Cancer is approximately 23½° north.', topic: 'Geography' },
  { text: 'Jallianwala Bagh massacre took place in:', correct: '1919', distractors: ['1857', '1905', '1942'], explanation: '13 April 1919 in Amritsar.', topic: 'Modern India' },
  { text: 'Which planet is known as the Red Planet?', correct: 'Mars', distractors: ['Venus', 'Jupiter', 'Mercury'], explanation: 'Iron oxide gives Mars a reddish appearance.', topic: 'Geography' },
  { text: 'The first battle of Panipat (1526) was fought between Babur and:', correct: 'Ibrahim Lodi', distractors: ['Rana Sanga', 'Sher Shah', 'Hemu'], explanation: 'Babur defeated Ibrahim Lodi in 1526.', topic: 'Medieval India' },
  { text: 'Which is the highest peak in India (within the Indian territory commonly cited in school texts)?', correct: 'Kangchenjunga', distractors: ['Mount Everest', 'K2', 'Nanda Devi'], explanation: 'Kangchenjunga is the highest peak wholly in India as taught in many school texts.', topic: 'Geography' },
  { text: 'Panchayati Raj was constitutionalised by the:', correct: '73rd Amendment', distractors: ['42nd Amendment', '44th Amendment', '86th Amendment'], explanation: 'The 73rd Amendment (1992) gave constitutional status to Panchayats.', topic: 'Civics' },
  { text: 'The Quit India Movement was launched in:', correct: '1942', distractors: ['1919', '1920', '1930'], explanation: 'Gandhi launched Quit India in August 1942.', topic: 'Modern India' },
  { text: 'Which gas is a major greenhouse gas?', correct: 'Carbon dioxide', distractors: ['Oxygen', 'Nitrogen', 'Argon'], explanation: 'CO₂ traps heat and drives greenhouse warming.', topic: 'Geography' },
  { text: 'The President of India is elected by:', correct: 'An electoral college', distractors: ['The Lok Sabha only', 'Direct public vote', 'The Supreme Court'], explanation: 'MPs and MLAs form the electoral college.', topic: 'Civics' },
  { text: 'Chipko movement is associated with:', correct: 'Forest conservation', distractors: ['Nuclear energy', 'Space research', 'Banking reform'], explanation: 'Chipko was a tree-hugging forest protection movement.', topic: 'Civics' },
  { text: 'The Dandi March (Salt Satyagraha) began in:', correct: '1930', distractors: ['1915', '1922', '1942'], explanation: 'Gandhi marched from Sabarmati to Dandi in 1930.', topic: 'Modern India' },
  { text: 'Which ocean lies to the south of India?', correct: 'Indian Ocean', distractors: ['Atlantic Ocean', 'Pacific Ocean', 'Arctic Ocean'], explanation: 'India’s southern boundary is the Indian Ocean.', topic: 'Geography' },
  { text: 'The Planning Commission of India was replaced by:', correct: 'NITI Aayog', distractors: ['Election Commission', 'Finance Commission', 'UPSC'], explanation: 'NITI Aayog was formed in 2015.', topic: 'Civics' },
  { text: 'Mohenjo-daro belonged to the:', correct: 'Indus Valley Civilisation', distractors: ['Vedic Age', 'Mauryan Empire', 'Gupta Empire'], explanation: 'Mohenjo-daro is a major Harappan site.', topic: 'Ancient India' },
  { text: 'Which latitude is called the Equator?', correct: '0°', distractors: ['23½°', '66½°', '90°'], explanation: 'The Equator is 0° latitude.', topic: 'Geography' },
  { text: 'Right to Education was added as a Fundamental Right by the:', correct: '86th Amendment', distractors: ['42nd Amendment', '44th Amendment', '73rd Amendment'], explanation: 'Article 21A was inserted by the 86th Amendment.', topic: 'Civics' },
  { text: 'The capital of India is:', correct: 'New Delhi', distractors: ['Mumbai', 'Kolkata', 'Chennai'], explanation: 'New Delhi is the national capital.', topic: 'Civics' },
];

function sstBuilt(spec: FallbackSpec, r: () => number): Built {
  return SST_FACTS[(spec.index + irand(r, 0, SST_FACTS.length - 1)) % SST_FACTS.length];
}

function aptitudeBuilt(spec: FallbackSpec, r: () => number): Built {
  const kind = slotFamily(spec, 15);
  if (kind === 0) {
    const men = 6 + (spec.slot?.index ?? spec.index) % 12;
    const days = 8 + (spec.slot?.index ?? spec.index) % 10;
    const men2 = Math.max(2, men - 2 - ((spec.slot?.index ?? spec.index) % 4));
    const ans = Math.round((men * days) / men2);
    return {
      text: `If ${men} workers finish a job in ${days} days, ${men2} workers will take:`,
      correct: `${ans} days`,
      distractors: [`${ans + 4} days`, `${days} days`, `${men2} days`],
      explanation: `M₁D₁=M₂D₂ ⇒ ${men}×${days}=${men2}×D ⇒ D=${ans}.`,
      topic: 'Time and work',
    };
  }
  return mathBuilt(spec, r);
}

function scienceBuilt(spec: FallbackSpec, r: () => number): Built {
  const discipline = spec.scienceDiscipline ?? lockScienceDiscipline(String(spec.seed));
  if (discipline === 'physics') {
    return physicsBuilt(spec, r);
  }
  if (discipline === 'chemistry') {
    return chemistryBuilt(spec, r);
  }
  return biologyBuilt({ ...spec, subjectId: 'bio' }, r);
}

function gateCoreBuilt(spec: FallbackSpec, r: () => number): Built {
  if (slotFamily(spec, 3) === 0) {
    const sigma = 40 + ((spec.slot?.index ?? spec.index) % 12) * 7;
    const area = 2 + ((spec.slot?.index ?? spec.index) % 6);
    return {
      text: `A bar of cross-section ${area} cm² carries an axial load producing stress ${sigma} N/mm². The load is proportional to:`,
      correct: 'stress × area',
      distractors: ['stress / area', 'area / stress', 'stress − area'],
      explanation: 'Axial load P = σA.',
      topic: 'Strength of materials',
    };
  }
  return physicsBuilt(spec, r);
}

function pickBuilder(subjectId: string): (spec: FallbackSpec, r: () => number) => Built {
  const id = subjectId.toLowerCase();
  if (id === 'phy') return physicsBuilt;
  if (id === 'chem') return chemistryBuilt;
  if (id === 'bot' || id === 'zoo' || id === 'bio') return biologyBuilt;
  if (id === 'mat' || id === 'intel') return reasoningBuilt;
  if (id === 'lang' || id === 'eng' || id === 'hin') return languageBuilt;
  if (id === 'sst' || id === 'gk' || id === 'sat-sst') return sstBuilt;
  if (id === 'ga' || id === 'arith') return aptitudeBuilt;
  if (id === 'sci' || id === 'sat-sci') return scienceBuilt;
  if (id === 'eng-core') return gateCoreBuilt;
  if (id === 'math' || id === 'sat-math' || id === 'eng-math') return mathBuilt;
  if (id === 'cs') return gateCoreBuilt;
  throw new Error(`INSUFFICIENT_CONTENT: no fallback builder for subject "${subjectId}"`);
}

export function generateContentFallbackQuestions(args: {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  count: number;
  year: string;
  difficulties: ExamDifficulty[];
  seed?: number;
  usedFingerprints?: Set<string>;
  scienceDiscipline?: ScienceDiscipline;
}): Question[] {
  if (!catalogHasSubjectMapping(args.examId, args.subjectId)) {
    throw new Error('INSUFFICIENT_CONTENT: no syllabus mapping for exam/subject');
  }
  const units = getSyllabusUnits(args.examId, args.subjectId);
  if (!units.length) {
    throw new Error('INSUFFICIENT_CONTENT: no syllabus units for exam/subject');
  }
  let builder: (spec: FallbackSpec, r: () => number) => Built;
  try {
    builder = pickBuilder(args.subjectId);
  } catch (err) {
    throw err instanceof Error ? err : new Error('INSUFFICIENT_CONTENT');
  }
  const scienceDiscipline =
    args.scienceDiscipline ??
    (args.subjectId === 'sci' || args.subjectId === 'sat-sci'
      ? lockScienceDiscipline(`${args.examId}:${args.subjectId}:${args.seed ?? 0}`)
      : undefined);
  const baseSeed = args.seed ?? Date.now();
  const slots = buildExamSlotPlan(args.examId, args.subjectId, args.count, baseSeed);
  const out: Question[] = [];
  const used = args.usedFingerprints ?? new Set<string>();
  const validationCtx = {
    examId: args.examId,
    subjectId: args.subjectId,
    subjectName: args.subjectName,
    scienceDiscipline,
  };

  for (let i = 0; i < args.count; i++) {
    const slot = slots[i];
    const difficulty = slot?.difficulty ?? args.difficulties[i] ?? 'Medium';
    let chosen: Question | null = null;
    for (let attempt = 0; attempt < 48; attempt++) {
      const seed = (baseSeed + i * 10007 + attempt * 7919) >>> 0;
      const r = mulberry32(seed);
      const spec: FallbackSpec = {
        examId: args.examId,
        examName: args.examName,
        subjectId: args.subjectId,
        subjectName: args.subjectName,
        year: args.year,
        unit: slot?.syllabusUnit ?? units[(i + attempt) % units.length],
        difficulty,
        index: i + attempt * 31,
        seed,
        paperSeed: baseSeed,
        scienceDiscipline,
        slot,
        attempt,
      };
      const q = toQuestion(spec, builder(spec, r), r);
      const subjectOk = validateQuestionSubject(q, validationCtx);
      if (!subjectOk.valid) continue;
      const fp = paperFingerprint(q);
      if (used.has(fp)) continue;
      used.add(fp);
      chosen = q;
      break;
    }
    if (chosen) out.push(chosen);
  }
  return out;
}
