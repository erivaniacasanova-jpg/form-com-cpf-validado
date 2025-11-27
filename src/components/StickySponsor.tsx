import React from 'react';

export const StickySponsor: React.FC = () => {
  return (
    <div 
      className="fixed top-24 left-5 z-40 bg-black/70 text-white px-4 py-2 rounded-full border border-dashed border-white text-sm backdrop-blur-sm hidden lg:block"
    >
      <span>Patrocinador: Francisco Eliedisom Dos Santos</span>
    </div>
  );
};
