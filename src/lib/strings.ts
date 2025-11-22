export interface UiStrings {
  // Commun
  savingLabel: string;
  saveLabel: string;
  cancelLabel: string;
  loadingLabel: string;
  // Projet
  addProject: string;
  cannotCreate: string;
  successProjectAdded: string;
  errorProjectCreate: string;
  ministryLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  // Alertes
  addAlertTitle: string;
  projectLabel: string;
  selectProjectPlaceholder: string;
  typeLabel: string;
  severityLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  errorNoRightsAlert: string;
  errorSelectProjectMessage: string;
  successAlertCreated: string;
  planningAlertsTitle: string;
  phaseLabel: string;
  selectPhasePlaceholder: string;
  selectPhaseOptional: string;
  alertTypeLabels: Record<string, string>;
  alertSeverityLabels: Record<string, string>;
  planningAlertTypeLabels: Record<string, string>;
  // Phases
  phasesGanttTitle: string;
  addPhaseLabel: string;
  phaseNameLabel: string;
  plannedStartLabel: string;
  plannedEndLabel: string;
  actualStartLabel: string;
  actualEndLabel: string;
  statusLabel: string;
  phaseStatusLabels: Record<string, string>;
  projectStatusLabels: Record<string, string>;
  editLabel: string;
  deleteLabel: string;
  deletePhaseConfirm: string;
  noPhases: string;
  // Alignement
  scoreLabel: string;
  redundancyLabel: string;
  objectivesLabel: string;
  weightLabel: string;
  suggestionsLabel: string;
  emptyAlignmentLabel: string;
  addObjectiveLabel: string;
  unlinkObjectiveLabel: string;
  pagObjectivesLabel: string;
  noObjectivesLabel: string;
  codeLabel: string;
  titleLabel: string;
  levelLabel: string;
  sectorLabel: string;
  // Aide et explications
  alignmentHelp: string;
  weightHelp: string;
  redundancyHelp: string;
  viewDetailsLabel: string;
  objectiveDetailsTitle: string;
  indicatorsLabel: string;
  learnMoreLabel: string;
  // Indicateurs supplémentaires
  additionalIndicatorsTitle: string;
  alignmentTitle: string;
  alignedProjectsLabel: string;
  varianceTitle: string;
  underUtilizationLabel: string;
  atRiskTitle: string;
  trendTitle: string;
  topSpendersTitle: string;
}

export const STRINGS = {
  // Commun
  savingLabel: "Enregistrement...",
  saveLabel: "Enregistrer",
  cancelLabel: "Annuler",
  loadingLabel: "Chargement...",
  // Projet
  addProject: "Ajouter un projet",
  cannotCreate: "Votre rôle ne permet pas d’ajouter des projets.",
  successProjectAdded: "Projet ajouté avec succès.",
  errorProjectCreate: "Une erreur est survenue lors de la création.",
  ministryLabel: "Ministère*",
  startDateLabel: "Date de début*",
  endDateLabel: "Date de fin*",
  // Alertes
  addAlertTitle: "Ajouter une alerte",
  projectLabel: "Projet*",
  selectProjectPlaceholder: "Sélectionnez un projet",
  typeLabel: "Type*",
  severityLabel: "Sévérité*",
  messageLabel: "Message*",
  messagePlaceholder: "Décrivez l\u0027alerte",
  errorNoRightsAlert: "Vous n’avez pas les droits pour créer une alerte.",
  errorSelectProjectMessage: "Veuillez sélectionner un projet et saisir un message.",
  successAlertCreated: "Alerte créée avec succès.",
  planningAlertsTitle: "Alertes de planification",
  phaseLabel: "Phase",
  selectPhasePlaceholder: "Sélectionner une phase",
  selectPhaseOptional: "Sélectionnez une phase (optionnel)",
  alertTypeLabels: { budget_overrun: "Dépassement de budget", delay: "Retard", milestone_missed: "Jalon non atteint" },
  alertSeverityLabels: { low: "Faible", medium: "Moyenne", high: "Élevée", critical: "Critique" },
  planningAlertTypeLabels: { delay: "Retard", blocked: "Blocage", budget_drift: "Dérive budgétaire" },
  // Phases
  phasesGanttTitle: "Phases du projet",
  addPhaseLabel: "Ajouter une phase",
  phaseNameLabel: "Nom de la phase",
  plannedStartLabel: "Début planifié",
  plannedEndLabel: "Fin planifiée",
  actualStartLabel: "Début réel",
  actualEndLabel: "Fin réelle",
  statusLabel: "Statut",
  phaseStatusLabels: { planned: "Planifiée", in_progress: "En cours", completed: "Terminée", blocked: "Bloquée" },
  projectStatusLabels: { planned: "Planifié", in_progress: "En cours", completed: "Terminé", delayed: "En retard", cancelled: "Annulé" },
  editLabel: "Modifier",
  deleteLabel: "Supprimer",
  deletePhaseConfirm: "Supprimer cette phase ?",
  noPhases: "Aucune phase définie.",
  // Alignement
  scoreLabel: "Score d\'alignement",
  redundancyLabel: "Redondance",
  objectivesLabel: "Objectifs liés",
  weightLabel: "Poids",
  suggestionsLabel: "Suggestions",
  emptyAlignmentLabel: "Aucune donnée d\u0027alignement.",
  addObjectiveLabel: "Ajouter",
  unlinkObjectiveLabel: "Retirer",
  pagObjectivesLabel: "Objectifs PAG (optionnel)",
  noObjectivesLabel: "Aucun objectif disponible",
  codeLabel: "Code",
  titleLabel: "Titre",
  levelLabel: "Niveau",
  sectorLabel: "Secteur",
  alignmentHelp: "Ce score reflète la contribution du projet aux objectifs nationaux du PAG.",
  weightHelp: "Le poids (1 à 5) indique le niveau de contribution du projet aux indicateurs de l\u0027objectif.",
  redundancyHelp: "Nombre de fois où ce projet est comptabilisé dans différents objectifs.",
  viewDetailsLabel: "Voir les détails",
  objectiveDetailsTitle: "Détails de l\u0027objectif",
  indicatorsLabel: "Indicateurs",
  learnMoreLabel: "En savoir plus",
  // Indicateurs supplémentaires
  additionalIndicatorsTitle: "Indicateurs supplémentaires",
  alignmentTitle: "Alignement au PAG",
  alignedProjectsLabel: "Projets alignés (≥ 70%)",
  varianceTitle: "Variance budgétaire",
  underUtilizationLabel: "Sous-utilisation: ",
  atRiskTitle: "Projets à risque",
  trendTitle: "Tendance des alertes",
  topSpendersTitle: "Secteurs les plus dépensiers"
} as const;

export type StringKey = keyof typeof STRINGS;

export function normalizeApostrophes(s: string): string {
  return s.replace(/\\u0027/g, "'").replace(/u0027/g, "'");
}