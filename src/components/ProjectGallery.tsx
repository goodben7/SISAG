import React from "react";

interface ProjectGalleryProps {
  images: string[];
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ images }) => {
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
        Aucune image disponible pour ce projet.
      </div>
    );
  }
  return (
    <div className="flex gap-3 overflow-x-auto py-2">
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Projet image ${idx + 1}`}
          className="h-32 w-48 object-cover rounded-lg shadow transition-transform duration-200 hover:scale-105 border border-gray-200"
        />
      ))}
    </div>
  );
}