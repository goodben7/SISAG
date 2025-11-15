import React from "react";

interface ProjectMiniMapProps {
  latitude?: number;
  longitude?: number;
  city?: string;
}

export const ProjectMiniMap: React.FC<ProjectMiniMapProps> = ({ latitude, longitude, city }) => {
  // Placeholder for map integration (e.g., Google Maps, Mapbox)
  // For now, display coordinates and city
  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
        Localisation non disponible
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow p-2 flex flex-col items-center">
      <div className="text-sm text-gray-700 mb-1">{city ? city : "Ville inconnue"}</div>
      <div className="text-xs text-gray-500">Lat: {latitude}, Lng: {longitude}</div>
      {/* Intégration future d'une carte interactive ici */}
      <div className="mt-2 w-32 h-20 bg-blue-100 rounded flex items-center justify-center text-blue-700">
        Mini-carte
      </div>
    </div>
  );
}