// src/components/ProductGallery.jsx
import React, { useState } from "react";

export default function ProductGallery({ images = [], mainImage }) {
  const list = images && images.length ? images : (mainImage ? [mainImage] : []);
  const [idx, setIdx] = useState(0);

  if (!list.length) {
    return <div className="w-full h-64 bg-gray-100 flex items-center justify-center">No images</div>;
  }

  return (
    <div>
      <div className="w-full h-[420px] bg-gray-100 rounded overflow-hidden">
        <img src={list[idx]} alt={`img-${idx}`} className="w-full h-full object-cover" />
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {list.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-20 h-20 rounded overflow-hidden border ${i === idx ? "ring-2 ring-indigo-500" : ""} flex-none`}>
              <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
