import React from 'react';
import logoInternacional from '../assets/internacional_logo.png';

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
    <img
      src={logoInternacional}
      alt="Logo Sport Club Internacional"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};
