import React from 'react';
import logoServicoSocial from '../assets/servico_social_logo.png';

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
    <img
      src={logoServicoSocial}
      alt="Logo Serviço Social"
      width={width}
      height={height}
      className={className}
      style={{ 
        objectFit: 'contain',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};
