'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Fab, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
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

const FLY_DURATION_MS = 3000;
const DWELL_MS = 10000; // time at each location before flying to next

function getArcPosition(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RADIUS * Math.cos(rad),
    y: -RADIUS * Math.sin(rad),
  };
}

export default function BookmarkDial({ mode }) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const map = useMapInstance();
  const isDark = mode === "theme-dark";
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  const flyToBookmark = useCallback((bookmark) => {
    if (!map) return;
    map.flyTo({
      center: bookmark.center,
      zoom: bookmark.zoom,
      pitch: bookmark.pitch,
      bearing: bookmark.bearing,
      duration: FLY_DURATION_MS,
      essential: true,
    });
  }, [map]);

  const stopDemo = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!map) return;

    if (isPlaying) {
      flyToBookmark(BOOKMARKS[indexRef.current]);

      intervalRef.current = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % BOOKMARKS.length;
        flyToBookmark(BOOKMARKS[indexRef.current]);
      }, DWELL_MS);

      map.on('dragstart', stopDemo);
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      map.off('dragstart', stopDemo);
    }

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      map.off('dragstart', stopDemo);
    };
  }, [isPlaying, map, flyToBookmark, stopDemo]);

  const handleClick = (bookmark) => {
    if (!map) return;
    setIsPlaying(false);
    map.jumpTo({
      center: bookmark.center,
      zoom: bookmark.zoom,
      pitch: bookmark.pitch,
      bearing: bookmark.bearing,
    });
    setOpen(false);
  };

  const toggleDemo = () => {
    if (!isPlaying) {
      indexRef.current = 0;
    }
    setIsPlaying((prev) => !prev);
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
              bgcolor: isDark ? '#000000' : '#ffffff',
              color: isDark ? '#ffffff' : '#000000',
              fontWeight: 600,
              cursor: 'pointer',
              maxWidth: 'none',
              '& .MuiChip-label': { overflow: 'visible' },
              '&:hover': { bgcolor: isDark ? '#222222' : '#f0f0f0' },
            }}
          />
        );
      })}
      <Fab
        aria-label={isPlaying ? 'Stop demo' : 'Start demo'}
        onClick={toggleDemo}
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(calc(-50% - 68px), -50%)',
          bgcolor: isPlaying ? (isDark ? '#1a3a1a' : '#e8f5e9') : (isDark ? '#000000' : '#ffffff'),
          color: isDark ? '#ffffff' : '#000000',
          '&:hover': { bgcolor: isDark ? '#222222' : '#f0f0f0' },
        }}
      >
        {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
      </Fab>
      <Fab
        aria-label="Bookmarks"
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
