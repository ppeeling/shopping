import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  title,
  onClose
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <a
            href={imageUrl}
            download={title ? `${title.replace(/\s+/g, '_')}_photo.jpg` : 'grocery_photo.jpg'}
            className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors border border-slate-700"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors border border-slate-700"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main image */}
        <div className="bg-slate-900 rounded-3xl p-2 border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center max-h-[85vh]">
          <img
            src={imageUrl}
            alt={title || 'Grocery photo'}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl select-none"
          />
          {title && (
            <p className="text-slate-300 font-semibold text-sm mt-3 mb-1 px-2 text-center truncate max-w-full">
              {title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
