import jsPDF from 'jspdf';
import { WorkoutSession, MUSCLE_CATEGORY_LABELS } from './types';
import { getExerciseById } from './exercises';

export function exportSessionToPDF(session: WorkoutSession) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Helper to add text with automatic page break
  const addText = (text: string, x: number, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);

    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    doc.text(text, x, yPos);
    yPos += size * 0.6;
  };

  // Title
  addText('FitTracker - Rapport de Séance', margin, 18, 'bold');
  yPos += 5;

  // Session Info
  addText(`Template: ${session.templateName}`, margin, 14, 'bold');
  addText(`Date: ${new Date(session.startedAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, margin, 10);

  if (session.completedAt) {
    const duration = Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60);
    addText(`Durée: ${Math.floor(duration / 60)}h ${duration % 60}min`, margin, 10);
  }

  addText(`Statut: ${
    session.status === 'completed' ? 'Terminé' :
    session.status === 'abandoned' ? 'Abandonné' : 'En cours'
  }`, margin, 10);

  yPos += 5;

  // Overall Stats
  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets, 0);
  const completedSets = session.exercises.reduce((sum, e) => sum + e.completedSets, 0);
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  addText('Statistiques Globales', margin, 12, 'bold');
  addText(`Séries complétées: ${completedSets} / ${totalSets} (${completionRate}%)`, margin, 10);
  addText(`Exercices: ${session.exercises.length}`, margin, 10);

  yPos += 10;

  // Exercises
  addText('Exercices', margin, 14, 'bold');
  yPos += 2;

  session.exercises.forEach((exercise, index) => {
    const exerciseInfo = getExerciseById(exercise.exerciseId);
    if (!exerciseInfo) return;

    // Exercise header
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    addText(`${index + 1}. ${exerciseInfo.name}`, margin + 2, 11, 'bold');
    doc.setTextColor(0, 0, 0);
    yPos += 2;

    // Category
    addText(`Groupe: ${MUSCLE_CATEGORY_LABELS[exerciseInfo.category]}`, margin + 2, 9);

    // Sets info
    const weights = exercise.actualWeightsPerSet ||
                   exercise.weightsPerSet ||
                   [exercise.actualWeight || exercise.weight];

    addText(`Séries: ${exercise.completedSets} / ${exercise.sets}`, margin + 2, 9);

    // Weights per set
    if (weights.length > 0) {
      const weightsText = weights.slice(0, exercise.completedSets)
        .map((w, i) => `S${i + 1}: ${w}kg`)
        .join(', ');
      addText(`Charges: ${weightsText}`, margin + 2, 9);
    }

    addText(`Répétitions: ${exercise.reps}`, margin + 2, 9);
    addText(`Repos: ${exercise.restTime}s`, margin + 2, 9);

    // Notes
    if (exercise.notes || exercise.formCues) {
      yPos += 2;
      if (exercise.formCues) {
        doc.setFont('helvetica', 'italic');
        addText(`Form cues: ${exercise.formCues}`, margin + 2, 8);
        doc.setFont('helvetica', 'normal');
      }
      if (exercise.notes) {
        doc.setFont('helvetica', 'italic');
        addText(`Notes: ${exercise.notes}`, margin + 2, 8);
        doc.setFont('helvetica', 'normal');
      }
    }

    // Superset
    if (exercise.supersetExerciseId) {
      const supersetInfo = getExerciseById(exercise.supersetExerciseId);
      if (supersetInfo) {
        yPos += 2;
        doc.setTextColor(138, 92, 246); // Purple
        addText(`+ Superset: ${supersetInfo.name}`, margin + 4, 9);
        doc.setTextColor(0, 0, 0);

        const supersetWeights = exercise.actualSupersetWeightsPerSet ||
                               exercise.supersetWeightsPerSet ||
                               [exercise.supersetWeight || 0];

        const supersetWeightsText = supersetWeights.slice(0, exercise.completedSets)
          .map((w, i) => `S${i + 1}: ${w}kg`)
          .join(', ');
        addText(`Charges: ${supersetWeightsText}`, margin + 4, 8);
        addText(`Répétitions: ${exercise.supersetReps}`, margin + 4, 8);
      }
    }

    yPos += 8;
  });

  // Session Notes
  if (session.notes) {
    yPos += 5;
    addText('Notes de Séance', margin, 12, 'bold');

    // Split notes into lines if too long
    const notesLines = doc.splitTextToSize(session.notes, pageWidth - 2 * margin);
    notesLines.forEach((line: string) => {
      addText(line, margin, 9);
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} / ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `FitTracker_${session.templateName.replace(/[^a-z0-9]/gi, '_')}_${new Date(session.startedAt).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function exportMultipleSessionsToPDF(sessions: WorkoutSession[], title: string = 'Historique') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`FitTracker - ${title}`, margin, yPos);
  yPos += 15;

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre de séances: ${sessions.length}`, margin, yPos);
  yPos += 6;

  const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);
  const totalSets = sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((eSum, e) => eSum + e.completedSets, 0), 0
  );

  doc.text(`Total exercices: ${totalExercises}`, margin, yPos);
  yPos += 6;
  doc.text(`Total séries: ${totalSets}`, margin, yPos);
  yPos += 15;

  // Sessions list
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Séances', margin, yPos);
  yPos += 8;

  sessions.forEach((session, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    const totalSets = session.exercises.reduce((sum, e) => sum + e.sets, 0);
    const completedSets = session.exercises.reduce((sum, e) => sum + e.completedSets, 0);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${session.templateName}`, margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(session.startedAt).toLocaleDateString('fr-FR')}`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Séries: ${completedSets}/${totalSets} - Exercices: ${session.exercises.length}`, margin + 5, yPos);
    yPos += 10;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} / ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `FitTracker_${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
