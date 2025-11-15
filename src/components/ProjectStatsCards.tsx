import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  link?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, link }) => (
  <div className={`rounded-xl shadow-sm p-4 flex flex-col items-start transition-transform duration-200 hover:scale-105 ${color}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-lg">{title}</span>
    </div>
    <div className="text-3xl font-extrabold mb-1">{value}</div>
    {subtitle && <div className="text-sm text-gray-700 mb-2">{subtitle}</div>}
    {link && <a href={link} className="text-blue-700 text-xs underline">Voir tous les projets</a>}
  </div>
);

interface ProjectStatsCardsProps {
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    delayed: number;
    delayedPercent: number;
  };
}

export const ProjectStatsCards: React.FC<ProjectStatsCardsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <StatCard
      title="Total projets"
      value={stats.total}
      icon={<span role="img" aria-label="Tableau">📊</span>}
      color="bg-gray-50"
      link="#projects"
    />
    <StatCard
      title="En cours"
      value={stats.inProgress}
      icon={<span role="img" aria-label="En cours">🏗️</span>}
      color="bg-blue-50"
      link="#projects-in-progress"
    />
    <StatCard
      title="Terminés"
      value={stats.completed}
      icon={<span role="img" aria-label="Terminé">✅</span>}
      color="bg-green-50"
      link="#projects-completed"
    />
    <StatCard
      title="En retard"
      value={stats.delayed}
      icon={<span role="img" aria-label="En retard">🚩</span>}
      color="bg-red-50"
      subtitle={`${stats.delayedPercent}% en retard`}
      link="#projects-delayed"
    />
  </div>
);