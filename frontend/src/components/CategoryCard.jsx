import React from "react";

export default function CategoryCard({ name, image, onClick, isActive, isClosed }) {
  return (
    <div 
      onClick={isClosed ? null : onClick}
      className={`relative w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-[24px] shrink-0 overflow-hidden shadow-[0_8px_20px_rgb(0,0,0,0.04)] transition-all duration-400 group ${isClosed ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-[0_20px_30px_rgb(255,77,45,0.15)] hover:-translate-y-1.5 cursor-pointer'} ${isActive ? 'border-[3px] border-[#ff4d2d] scale-105' : 'bg-white border border-gray-100'}`}
    >
      <img
        src={image}
        alt={name}
        className={`w-full h-full object-cover transform transition-transform duration-700 ${isClosed ? '' : 'group-hover:scale-110'}`}
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 ${isActive ? 'opacity-90' : 'opacity-80 group-hover:opacity-100'}`}></div>
      
      {isClosed && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-lg shadow-md z-10 uppercase tracking-wider">
          Closed
        </div>
      )}
      
      <div className={`absolute bottom-3 w-[90%] left-[5%] backdrop-blur-md px-3 py-1.5 rounded-xl text-center shadow-sm text-sm md:text-base font-bold text-white border transition-all duration-300 transform ${isActive ? 'bg-[#ff4d2d]/90 border-[#ff4d2d] translate-y-0' : 'bg-white/20 border-white/30 group-hover:translate-y-0'}`}>
        {name}
      </div>
    </div>
  );
}
