import React from 'react';

interface InterLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const InterLogo: React.FC<InterLogoProps> = ({ 
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
      {/* Círculo externo */}
      <circle
        cx="100"
        cy="100"
        r="95"
        fill="none"
        stroke="#E53E3E"
        strokeWidth="4"
      />
      
      {/* Círculo interno vermelho */}
      <circle
        cx="100"
        cy="100"
        r="75"
        fill="#E53E3E"
      />
      
      {/* Texto S.C.INTERNACIONAL */}
      <path
        d="M 30 45 A 70 70 0 0 1 170 45"
        id="top-curve"
        fill="none"
      />
      <text fontSize="14" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">
        <textPath href="#top-curve" startOffset="50%" textAnchor="middle">
          S.C.INTERNACIONAL
        </textPath>
      </text>
      
      {/* Símbolo central estilizado */}
      <g transform="translate(100,100)">
        {/* Base do símbolo */}
        <path
          d="M -25 -10 L 25 -10 L 25 10 L -25 10 Z"
          fill="white"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Elementos decorativos */}
        <path
          d="M -20 -25 L -10 -15 L 0 -25 L 10 -15 L 20 -25"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        <path
          d="M -20 25 L -10 15 L 0 25 L 10 15 L 20 25"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Símbolo central */}
        <text
          x="0"
          y="5"
          fontSize="24"
          fill="#E53E3E"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="serif"
        >
          $
        </text>
      </g>
      
      {/* Texto 1909 */}
      <path
        d="M 30 155 A 70 70 0 0 0 170 155"
        id="bottom-curve"
        fill="none"
      />
      <text fontSize="16" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">
        <textPath href="#bottom-curve" startOffset="50%" textAnchor="middle">
          1909
        </textPath>
      </text>
    </svg>
  );
};

export default InterLogo;