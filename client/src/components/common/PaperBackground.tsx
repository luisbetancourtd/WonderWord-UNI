import React from 'react';

export const PaperBackground: React.FC = () => {
  return (
    <>
      {/* Filtres SVG pour effet aquarelle */}
      <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="wc-vignette-heavy" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={4} seed={31} result="noise" />
            <feDisplacementMap in="blur" in2="noise" scale={58} xChannelSelector="R" yChannelSelector="G" result="disp" />
            <feComponentTransfer in="disp">
              <feFuncA type="table" tableValues="0 0.45 0.78 0.94 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Textura de papel prensado */}
      <div className="paper-texture" />

      {/* Marco de acuarela en 4 esquinas */}
      <div className="vignette-container">
        <div className="corner-top-left" />
        <div className="corner-top-right" />
        <div className="corner-bottom-left" />
        <div className="corner-bottom-right" />
      </div>
    </>
  );
};
