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
  // Phases
  phasesGanttTitle: string;
  addPhaseLabel: string;
  phaseNameLabel: string;
  plannedStartLabel: string;
  plannedEndLabel: string;
  actualStartLabel: string;
  actualEndLabel: string;
  statusLabel: string;
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
  // Phases
  phasesGanttTitle: "Phases du projet",
  addPhaseLabel: "Ajouter une phase",
  phaseNameLabel: "Nom de la phase",
  plannedStartLabel: "Début planifié",
  plannedEndLabel: "Fin planifiée",
  actualStartLabel: "Début réel",
  actualEndLabel: "Fin réelle",
  statusLabel: "Statut",
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
  sectorLabel: "Secteur"
} as const;

export type StringKey = keyof typeof STRINGS;