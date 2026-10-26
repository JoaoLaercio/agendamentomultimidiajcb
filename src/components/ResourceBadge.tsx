import React from 'react';
import { Resource } from '../types';
import { ResourceIcon } from './ResourceIcon';

interface ResourceBadgeProps {
  resource?: Resource;
  resourceId: string;
  quantity?: number;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const ResourceBadge: React.FC<ResourceBadgeProps> = ({
  resource,
  resourceId,
  quantity,
  size = 'sm',
}) => {
  const name = resource ? resource.name : resourceId;
  const color = resource?.color || 'blue';
  const styles = colorMap[color] || colorMap.blue;

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md ${styles.bg} ${styles.text} ${styles.border} ${
        isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      }`}
    >
      <ResourceIcon id={resourceId} className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{name}</span>
      {quantity && quantity > 1 && (
        <span className="font-bold opacity-80">({quantity}x)</span>
      )}
    </span>
  );
};
