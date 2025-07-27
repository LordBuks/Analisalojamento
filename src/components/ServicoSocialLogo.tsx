import React from 'react';

interface ServicoSocialLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const ServicoSocialLogo: React.FC<ServicoSocialLogoProps> = ({ 
  className = "", 
  width = 64, 
  height = 64 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo externo verde */}
      <circle
        cx="100"
        cy="100"
        r="95"
        fill="none"
        stroke="#22C55E"
        strokeWidth="6"
      />
      
      {/* Fundo branco */}
      <circle
        cx="100"
        cy="100"
        r="85"
        fill="white"
      />
      
      {/* Tocha - base */}
      <rect
        x="95"
        y="80"
        width="10"
        height="40"
        fill="#22C55E"
        stroke="#22C55E"
        strokeWidth="2"
      />
      
      {/* Tocha - chama */}
      <path
        d="M 100 80 Q 90 70 95 60 Q 100 55 105 60 Q 110 70 100 80"
        fill="#EF4444"
        stroke="#EF4444"
        strokeWidth="1"
      />
      
      {/* Balança - haste central */}
      <line
        x1="100"
        y1="80"
        x2="100"
        y2="120"
        stroke="#22C55E"
        strokeWidth="3"
      />
      
      {/* Balança - braço horizontal */}
      <line
        x1="70"
        y1="95"
        x2="130"
        y2="95"
        stroke="#22C55E"
        strokeWidth="3"
      />
      
      {/* Balança - prato esquerdo */}
      <ellipse
        cx="75"
        cy="105"
        rx="12"
        ry="4"
        fill="none"
        stroke="#22C55E"
        strokeWidth="2"
      />
      <line x1="70" y1="95" x2="70" y2="101" stroke="#22C55E" strokeWidth="2"/>
      <line x1="80" y1="95" x2="80" y2="101" stroke="#22C55E" strokeWidth="2"/>
      
      {/* Balança - prato direito */}
      <ellipse
        cx="125"
        cy="105"
        rx="12"
        ry="4"
        fill="none"
        stroke="#22C55E"
        strokeWidth="2"
      />
      <line x1="120" y1="95" x2="120" y2="101" stroke="#22C55E" strokeWidth="2"/>
      <line x1="130" y1="95" x2="130" y2="101" stroke="#22C55E" strokeWidth="2"/>
      
      {/* Texto "Serviço Social" */}
      <path
        d="M 25 150 A 75 75 0 0 0 175 150"
        id="text-curve"
        fill="none"
      />
      <text fontSize="16" fill="#22C55E" fontWeight="bold" fontFamily="Arial, sans-serif">
        <textPath href="#text-curve" startOffset="50%" textAnchor="middle">
          Serviço Social
        </textPath>
      </text>
    </svg>
  );
};

export default ServicoSocialLogo;