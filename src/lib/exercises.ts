import { Exercise, MuscleCategory } from './types';

export const exercises: Exercise[] = [
  // Pectoraux
  { id: 'bench-press', name: 'Développé couché', category: 'chest', description: 'Exercice de base pour les pectoraux' },
  { id: 'incline-bench-press', name: 'Développé incliné', category: 'chest', description: 'Cible le haut des pectoraux' },
  { id: 'decline-bench-press', name: 'Développé décliné', category: 'chest', description: 'Cible le bas des pectoraux' },
  { id: 'dumbbell-fly', name: 'Écarté haltères', category: 'chest', description: 'Isolation des pectoraux' },
  { id: 'cable-crossover', name: 'Crossover poulie', category: 'chest', description: 'Finition pectoraux' },
  { id: 'push-ups', name: 'Pompes', category: 'chest', description: 'Exercice au poids du corps' },
  { id: 'dips-chest', name: 'Dips (pectoraux)', category: 'chest', description: 'Dips penché en avant' },

  // Dos
  { id: 'pull-ups', name: 'Tractions', category: 'back', description: 'Exercice de base pour le dos' },
  { id: 'lat-pulldown', name: 'Tirage vertical', category: 'back', description: 'Alternative aux tractions' },
  { id: 'barbell-row', name: 'Rowing barre', category: 'back', description: 'Épaisseur du dos' },
  { id: 'dumbbell-row', name: 'Rowing haltère', category: 'back', description: 'Rowing unilatéral' },
  { id: 'cable-row', name: 'Tirage horizontal', category: 'back', description: 'Machine câble' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'back', description: 'Rowing avec T-bar' },
  { id: 'deadlift', name: 'Soulevé de terre', category: 'back', description: 'Exercice composé' },
  { id: 'face-pull', name: 'Face Pull', category: 'back', description: 'Arrière d\'épaules et trapèzes' },

  // Épaules
  { id: 'overhead-press', name: 'Développé militaire', category: 'shoulders', description: 'Exercice de base épaules' },
  { id: 'dumbbell-press', name: 'Développé haltères', category: 'shoulders', description: 'Développé assis' },
  { id: 'lateral-raise', name: 'Élévations latérales', category: 'shoulders', description: 'Isolation deltoïde moyen' },
  { id: 'front-raise', name: 'Élévations frontales', category: 'shoulders', description: 'Isolation deltoïde antérieur' },
  { id: 'rear-delt-fly', name: 'Oiseau', category: 'shoulders', description: 'Deltoïde postérieur' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'shoulders', description: 'Variation du développé' },
  { id: 'shrugs', name: 'Shrugs', category: 'shoulders', description: 'Trapèzes supérieurs' },

  // Biceps
  { id: 'barbell-curl', name: 'Curl barre', category: 'biceps', description: 'Exercice de base biceps' },
  { id: 'dumbbell-curl', name: 'Curl haltères', category: 'biceps', description: 'Curl alterné ou simultané' },
  { id: 'hammer-curl', name: 'Curl marteau', category: 'biceps', description: 'Biceps et avant-bras' },
  { id: 'preacher-curl', name: 'Curl pupitre', category: 'biceps', description: 'Isolation stricte' },
  { id: 'incline-curl', name: 'Curl incliné', category: 'biceps', description: 'Étirement maximal' },
  { id: 'concentration-curl', name: 'Curl concentration', category: 'biceps', description: 'Finition biceps' },
  { id: 'cable-curl', name: 'Curl poulie', category: 'biceps', description: 'Tension constante' },

  // Triceps
  { id: 'close-grip-bench', name: 'Développé serré', category: 'triceps', description: 'Exercice composé triceps' },
  { id: 'tricep-pushdown', name: 'Pushdown poulie', category: 'triceps', description: 'Isolation triceps' },
  { id: 'overhead-extension', name: 'Extension verticale', category: 'triceps', description: 'Longue portion' },
  { id: 'skull-crusher', name: 'Skull Crusher', category: 'triceps', description: 'Extension couché' },
  { id: 'dips-triceps', name: 'Dips (triceps)', category: 'triceps', description: 'Corps droit' },
  { id: 'kickback', name: 'Kickback', category: 'triceps', description: 'Isolation triceps' },
  { id: 'diamond-pushups', name: 'Pompes diamant', category: 'triceps', description: 'Au poids du corps' },

  // Jambes
  { id: 'squat', name: 'Squat', category: 'legs', description: 'Exercice roi des jambes' },
  { id: 'front-squat', name: 'Front Squat', category: 'legs', description: 'Accent quadriceps' },
  { id: 'leg-press', name: 'Presse à cuisses', category: 'legs', description: 'Machine guidée' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'legs', description: 'Isolation quadriceps' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'legs', description: 'Isolation ischio-jambiers' },
  { id: 'lunges', name: 'Fentes', category: 'legs', description: 'Exercice unilatéral' },
  { id: 'romanian-deadlift', name: 'Soulevé de terre roumain', category: 'legs', description: 'Ischio-jambiers' },
  { id: 'calf-raise', name: 'Mollets debout', category: 'legs', description: 'Gastrocnémiens' },
  { id: 'seated-calf', name: 'Mollets assis', category: 'legs', description: 'Soléaire' },

  // Fessiers
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'glutes', description: 'Exercice principal fessiers' },
  { id: 'glute-bridge', name: 'Pont fessier', category: 'glutes', description: 'Version au sol' },
  { id: 'cable-kickback', name: 'Kickback poulie', category: 'glutes', description: 'Isolation fessiers' },
  { id: 'sumo-deadlift', name: 'Soulevé sumo', category: 'glutes', description: 'Fessiers et adducteurs' },
  { id: 'step-ups', name: 'Step-ups', category: 'glutes', description: 'Montée sur banc' },
  { id: 'bulgarian-split', name: 'Bulgarian Split Squat', category: 'glutes', description: 'Squat bulgare' },

  // Abdominaux
  { id: 'crunch', name: 'Crunch', category: 'abs', description: 'Exercice de base abdos' },
  { id: 'plank', name: 'Planche', category: 'abs', description: 'Gainage frontal' },
  { id: 'leg-raise', name: 'Relevé de jambes', category: 'abs', description: 'Abdos inférieurs' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'abs', description: 'Obliques' },
  { id: 'cable-crunch', name: 'Crunch poulie', category: 'abs', description: 'Avec résistance' },
  { id: 'hanging-leg-raise', name: 'Relevé jambes suspendu', category: 'abs', description: 'Exercice avancé' },
  { id: 'ab-wheel', name: 'Roue abdominale', category: 'abs', description: 'Exercice complet' },
  { id: 'side-plank', name: 'Planche latérale', category: 'abs', description: 'Obliques et gainage' },

  // Cardio
  { id: 'treadmill', name: 'Tapis de course', category: 'cardio', description: 'Course ou marche' },
  { id: 'bike', name: 'Vélo elliptique', category: 'cardio', description: 'Faible impact' },
  { id: 'rowing-machine', name: 'Rameur', category: 'cardio', description: 'Cardio complet' },
  { id: 'jump-rope', name: 'Corde à sauter', category: 'cardio', description: 'HIIT efficace' },
  { id: 'burpees', name: 'Burpees', category: 'cardio', description: 'Exercice complet' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'cardio', description: 'Cardio et abdos' },
  { id: 'stair-climber', name: 'Escalier', category: 'cardio', description: 'Machine simulateur' },
];

export function getExercisesByCategory(category: MuscleCategory): Exercise[] {
  return exercises.filter((exercise) => exercise.category === category);
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.id === id);
}

export function getAllCategories(): MuscleCategory[] {
  return [...new Set(exercises.map((e) => e.category))];
}
