'use client';
import { useState } from 'react';
import { Fab, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useMapInstance } from '@/lib/MapContext';

const BOOKMARKS = [
  {
    name: 'Paris',
    center: [2.3417, 48.8552],
    zoom: 11.73,
    pitch: 12,
    bearing: 15.3,
  },
  {
    name: 'NYC',
    center: [-73.99768, 40.75332],
    zoom: 14.22,
    pitch: 60,
    bearing: 60.6,
  },
  {
    name: 'London',
    center: [-0.091217, 51.514511],
    zoom: 16.02,
    pitch: 50,
    bearing: -24,
  },
  {
    name: 'Boston',
    center: [-71.065192, 42.353714],
    zoom: 15.94,
    pitch: 52,
    bearing: 0,
  },
];

// Spread 5 items in an arc above the button (160° to 20°, left to right)
const RADIUS = 90;
const ANGLES = [155, 115, 65, 25];

function getArcPosition(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RADIUS * Math.cos(rad),
    y: -RADIUS * Math.sin(rad),
  };
}

export default function BookmarkDial({ mode }) {
  const [open, setOpen] = useState(false);
  const map = useMapInstance();
  const isDark = mode === "theme-dark";

  const handleClick = (bookmark) => {
    if (!map) return;
    map.jumpTo({
      center: bookmark.center,
      zoom: bookmark.zoom,
      pitch: bookmark.pitch,
      bearing: bookmark.bearing,
    });
    setOpen(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
      {BOOKMARKS.map((bookmark, i) => {
        const pos = getArcPosition(ANGLES[i]);
        return (
          <Chip
            key={bookmark.name}
            label={bookmark.name}
            onClick={() => handleClick(bookmark)}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: open
                ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(1)`
                : 'translate(-50%, -50%) scale(0)',
              opacity: open ? 1 : 0,
              transition: `transform 0.3s ${i * 0.03}s, opacity 0.2s ${i * 0.03}s`,
              bgcolor: '#1976d2',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              maxWidth: 'none',
              '& .MuiChip-label': { overflow: 'visible' },
              '&:hover': { bgcolor: '#1565c0' },
            }}
          />
        );
      })}
      <Fab
        onClick={() => setOpen(!open)}
        sx={{
          bgcolor: isDark ? '#000000' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
          '&:hover': { bgcolor: isDark ? '#222222' : '#f0f0f0' },
        }}
      >
        <StarIcon sx={{ fontSize: 28 }} />
      </Fab>
    </div>
  );
}
