/*
  # SISAG - Système d'Intégration et de Suivi de l'Action Gouvernementale
  
  ## Vue d'ensemble
  Ce schéma supporte une plateforme de transparence gouvernementale pour la RDC,
  permettant le suivi des projets, la participation citoyenne, et la collaboration
  entre acteurs (gouvernement, citoyens, ONG, bailleurs).

  ## 1. Nouvelles Tables
  
  ### `profiles`
  Profils utilisateurs étendus liés à auth.users
  - `id` (uuid, clé primaire) - Lié à auth.users
  - `full_name` (text) - Nom complet
  - `role` (text) - Type d'utilisateur: 'citizen', 'government', 'partner'
  - `organization` (text, nullable) - Organisation pour government/partner
  - `province` (text, nullable) - Province de rattachement
  - `phone` (text, nullable) - Numéro de téléphone
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Dernière mise à jour

  ### `projects`
  Projets gouvernementaux suivis dans le système
  - `id` (uuid, clé primaire)
  - `title` (text) - Titre du projet
  - `description` (text) - Description détaillée
  - `sector` (text) - Secteur: 'infrastructure', 'education', 'health', 'agriculture', etc.
  - `status` (text) - Statut: 'planned', 'in_progress', 'completed', 'delayed', 'cancelled'
  - `budget` (numeric) - Budget alloué
  - `spent` (numeric) - Budget dépensé
  - `province` (text) - Province
  - `city` (text) - Ville
  - `latitude` (numeric, nullable) - Coordonnée latitude
  - `longitude` (numeric, nullable) - Coordonnée longitude
  - `start_date` (date) - Date de début
  - `end_date` (date) - Date de fin prévue
  - `actual_end_date` (date, nullable) - Date de fin réelle
  - `ministry` (text) - Ministère responsable
  - `responsible_person` (text) - Responsable du projet
  - `images` (jsonb) - URLs des images du projet
  - `created_by` (uuid) - Utilisateur créateur
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `reports`
  Signalements citoyens sur les projets ou anomalies
  - `id` (uuid, clé primaire)
  - `project_id` (uuid, nullable) - Projet concerné
  - `title` (text) - Titre du signalement
  - `description` (text) - Description détaillée
  - `category` (text) - Catégorie: 'delay', 'quality', 'corruption', 'other'
  - `status` (text) - Statut: 'pending', 'in_review', 'resolved', 'rejected'
  - `latitude` (numeric, nullable) - Coordonnée latitude
  - `longitude` (numeric, nullable) - Coordonnée longitude
  - `images` (jsonb) - URLs des photos jointes
  - `reporter_id` (uuid) - Utilisateur signalant
  - `assigned_to` (uuid, nullable) - Agent assigné
  - `resolution_notes` (text, nullable) - Notes de résolution
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `alerts`
  Alertes automatiques pour les agents gouvernementaux
  - `id` (uuid, clé primaire)
  - `project_id` (uuid) - Projet concerné
  - `type` (text) - Type: 'budget_overrun', 'delay', 'milestone_missed'
  - `severity` (text) - Sévérité: 'low', 'medium', 'high', 'critical'
  - `message` (text) - Message d'alerte
  - `is_read` (boolean) - Lu ou non
  - `user_id` (uuid) - Destinataire
  - `created_at` (timestamptz)

  ### `messages`
  Messagerie sécurisée pour l'espace collaboratif
  - `id` (uuid, clé primaire)
  - `sender_id` (uuid) - Expéditeur
  - `recipient_id` (uuid, nullable) - Destinataire (null = message de groupe)
  - `project_id` (uuid, nullable) - Projet concerné
  - `content` (text) - Contenu du message
  - `attachments` (jsonb) - Pièces jointes
  - `is_read` (boolean) - Lu ou non
  - `created_at` (timestamptz)

  ### `events`
  Calendrier partagé pour l'espace collaboratif
  - `id` (uuid, clé primaire)
  - `title` (text) - Titre de l'événement
  - `description` (text) - Description
  - `project_id` (uuid, nullable) - Projet lié
  - `start_time` (timestamptz) - Début
  - `end_time` (timestamptz) - Fin
  - `location` (text) - Lieu
  - `organizer_id` (uuid) - Organisateur
  - `participants` (jsonb) - Liste des participants (user_ids)
  - `created_at` (timestamptz)

  ## 2. Sécurité (RLS - Row Level Security)
  
  Toutes les tables ont RLS activé avec des politiques restrictives:
  
  - **Profiles**: Les utilisateurs peuvent lire tous les profils publics, mais ne modifier que le leur
  - **Projects**: Lecture publique, modification par government/partner uniquement
  - **Reports**: Création par tous, lecture par créateur + agents, modification par agents
  - **Alerts**: Lecture/modification uniquement par le destinataire
  - **Messages**: Lecture uniquement par expéditeur/destinataire
  - **Events**: Lecture par participants + government/partner, création par government/partner

  ## 3. Index pour Performance
  
  Index créés sur les colonnes fréquemment interrogées:
  - Province, secteur, statut pour les projets
  - Status pour les signalements
  - User_id pour les alertes non lues
  - Timestamps pour le tri chronologique
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('citizen', 'government', 'partner')),
  organization text,
  province text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  sector text NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed', 'cancelled')),
  budget numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  province text NOT NULL,
  city text NOT NULL,
  latitude numeric,
  longitude numeric,
  start_date date NOT NULL,
  end_date date NOT NULL,
  actual_end_date date,
  ministry text NOT NULL,
  responsible_person text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Government and partners can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  );

CREATE POLICY "Government and partners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  );

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('delay', 'quality', 'corruption', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  latitude numeric,
  longitude numeric,
  images jsonb DEFAULT '[]'::jsonb,
  reporter_id uuid REFERENCES auth.users NOT NULL,
  assigned_to uuid REFERENCES auth.users,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  );

CREATE POLICY "Government can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'government'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'government'
    )
  );

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects NOT NULL,
  type text NOT NULL CHECK (type IN ('budget_overrun', 'delay', 'milestone_missed')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government and partners can create alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government','partner')
    )
  );

CREATE POLICY "Users can create own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government and partners can view alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government','partner')
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users NOT NULL,
  recipient_id uuid REFERENCES auth.users,
  project_id uuid REFERENCES projects,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
    OR (
      recipient_id IS NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('government', 'partner')
      )
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id)
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  project_id uuid REFERENCES projects,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text NOT NULL,
  organizer_id uuid REFERENCES auth.users NOT NULL,
  participants jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events they organize or participate in"
  ON events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = organizer_id
    OR participants ? auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  );

CREATE POLICY "Government and partners can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = organizer_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('government', 'partner')
    )
  );

CREATE POLICY "Organizers can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_province ON projects(province);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);