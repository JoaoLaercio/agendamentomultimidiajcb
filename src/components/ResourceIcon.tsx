import React from 'react';
import {
  Projector,
  Cable,
  Tv,
  Speaker,
  Laptop,
  BookOpen,
  Users,
  MonitorCheck,
  Package,
} from 'lucide-react';

interface ResourceIconProps {
  id: string;
  className?: string;
  size?: number;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ id, className = 'w-4 h-4', size }) => {
  switch (id) {
    case 'datashow':
      return <Projector className={className} size={size} />;
    case 'cabos':
      return <Cable className={className} size={size} />;
    case 'tv':
      return <Tv className={className} size={size} />;
    case 'caixa_som':
      return <Speaker className={className} size={size} />;
    case 'chromebook':
      return <Laptop className={className} size={size} />;
    case 'biblioteca':
      return <BookOpen className={className} size={size} />;
    case 'patio':
      return <Users className={className} size={size} />;
    case 'labin':
      return <MonitorCheck className={className} size={size} />;
    default:
      return <Package className={className} size={size} />;
  }
};
