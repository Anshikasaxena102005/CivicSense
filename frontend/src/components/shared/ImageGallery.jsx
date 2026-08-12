import { useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export const ImageGallery = ({ images = [], className = '' }) => {
  const [lightbox, setLightbox] = useState(null);

  if (!images.length) return null;

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <FiX className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 disabled:opacity-30"
                disabled={lightbox === 0}
                onClick={(e) => { e.stopPropagation(); setLightbox((p) => p - 1); }}
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 disabled:opacity-30"
                disabled={lightbox === images.length - 1}
                onClick={(e) => { e.stopPropagation(); setLightbox((p) => p + 1); }}
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={images[lightbox]}
            alt="Full size"
            className="max-w-4xl max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
