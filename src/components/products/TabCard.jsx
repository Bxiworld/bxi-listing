import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '@mui/material';
import {
  CheckCircle2,
  FileEdit,
  Clock,
  XCircle,
  Archive,
  Layers
} from 'lucide-react';

const tabIcons = {
  'Live': CheckCircle2,
  'In Draft': FileEdit,
  'Admin Review': Clock,
  'Delist': Archive,
  'Rejected': XCircle,
  'All': Layers,
};

const tabColors = {
  'Live': '#10B981',
  'In Draft': '#F59E0B',
  'Admin Review': '#3B82F6',
  'Delist': '#6B7280',
  'Rejected': '#EF4444',
  'All': '#C64091',
};

export const TabCard = ({
  tab,
  count = 0,
  isActive,
  onClick,
  isMedia = false
}) => {
  const Icon = tabIcons[tab] || Layers;
  const iconColor = tabColors[tab] || '#C64091';

  // Adjust label for Media company type
  const getLabel = () => {
    if (!isMedia) return `${tab} Products`;

    switch (tab) {
      case 'Live': return 'Live Media';
      case 'In Draft': return 'In Draft Media';
      case 'Admin Review': return 'Admin Review';
      case 'Delist': return 'Delisted Media';
      case 'Rejected': return 'Rejected Media';
      case 'All': return 'All Media';
      default: return tab;
    }
  };

  return (
    <button
      className={cn('tab-card', isActive && 'active')}
      onClick={onClick}
      data-testid={`tab-card-${tab.toLowerCase().replace(' ', '-')}`}
    >
      <div
        className="tab-card-icon rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon
          className="w-7 h-7"
          style={{ color: iconColor }}
        />
      </div>
      <span className="tab-card-count">{count}</span>
      <span className="tab-card-label">{getLabel()}</span>
      <Button
        variant="outlined"
        size="small"
        className="tab-card-btn"
        sx={{
          border: '1px solid',
          borderRadius: 2,
          textTransform: 'none',
          color: isActive ? '#fff' : '#C83184',
          borderColor: '#C83184',
          backgroundColor: isActive ? '#C83184' : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? '#a9276d' : 'rgba(200, 49, 132, 0.04)',
            borderColor: '#C83184',
          },
          mt: 2,
          fontWeight: 600,
        }}
      >
        Tap to View
      </Button>
    </button>
  );
};

export default TabCard;
