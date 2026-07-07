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

const RADIUS = 90;
const ANGLES = [155, 115, 65, 25];

const FLY_DURATION_MS = 4000;
const DWELL_MS = 10000;
const ROTATION_DEGREES = 25;
const OVERLAY_FADE_IN_DELAY = 2000; // show city name mid-fly for context
const SLIDER_SWEEP_START = 4500;   // ms after flyTo begins to start slider sweep
const SLIDER_SWEEP_DURATION = 2500; // ms for each sweep leg
const SLIDER_HOLD_MS = 800;        // ms to hold at the edge before sweeping back

function getArcPosition(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RADIUS * Math.cos(rad),
    y: -RADIUS * Math.sin(rad),
  };
}

export default function BookmarkDial({ mode, animateSlider }) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const map = useMapInstance();
  const isDark = mode === "theme-dark";
  const indexRef = useRef(0);
  const intervalRef = useRef(null);
  const rotateTimeoutRef = useRef(null);
  const overlayTimeoutRef = useRef(null);
  const sliderSweepRef = useRef(null);
  const sliderReturnRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(rotateTimeoutRef.current);
    clearTimeout(overlayTimeoutRef.current);
    clearTimeout(sliderSweepRef.current);
    clearTimeout(sliderReturnRef.current);
    intervalRef.current = null;
    rotateTimeoutRef.current = null;
    overlayTimeoutRef.current = null;
    sliderSweepRef.current = null;
    sliderReturnRef.current = null;
  }, []);

  const flyToBookmark = useCallback((bookmark) => {
    if (!map) return;

    setShowOverlay(false);

    map.flyTo({
      center: bookmark.center,
      zoom: bookmark.zoom,
      pitch: bookmark.pitch,
      bearing: bookmark.bearing,
      duration: FLY_DURATION_MS,
      essential: true,
    });

    // Fade in city name card while fly is still in progress
    overlayTimeoutRef.current = setTimeout(() => {
      setCurrentCity(bookmark.name);
      setShowOverlay(true);
    }, OVERLAY_FADE_IN_DELAY);

    // Slowly orbit after landing
    rotateTimeoutRef.current = setTimeout(() => {
      map.easeTo({
        bearing: bookmark.bearing + ROTATION_DEGREES,
        duration: DWELL_MS - FLY_DURATION_MS,
        easing: (t) => t,
      });
    }, FLY_DURATION_MS);

    // Alternate between sweeping to inspect (0) and explore (1)
    if (animateSlider) {
      const sweepTarget = indexRef.current % 2 === 0 ? 0 : 1;
      sliderSweepRef.current = setTimeout(() => {
        animateSlider(sweepTarget, SLIDER_SWEEP_DURATION);
        sliderReturnRef.current = setTimeout(() => {
          animateSlider(0.5, SLIDER_SWEEP_DURATION);
        }, SLIDER_SWEEP_DURATION + SLIDER_HOLD_MS);
      }, SLIDER_SWEEP_START);
    }
  }, [map, animateSlider]);

  const stopDemo = useCallback(() => {
    setIsPlaying(false);
    setShowOverlay(false);
    animateSlider?.(0.5, 600);
  }, [animateSlider]);

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
      clearAllTimers();
      setShowOverlay(false);
      animateSlider?.(0.5, 600);
      map.off('dragstart', stopDemo);
    }

    return () => {
      clearAllTimers();
      map.off('dragstart', stopDemo);
      map.stop();
    };
  }, [isPlaying, map, flyToBookmark, stopDemo, clearAllTimers]);

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
    <>
      {/* City name overlay card */}
      <div
        style={{
          position: 'fixed',
          bottom: 110,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 1.2s ease',
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 20,
            padding: '18px 48px 16px',
            color: isDark ? '#ffffff' : '#000000',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
            {currentCity}
          </div>
          <div style={{ fontSize: 13, opacity: 0.5, marginTop: 8, letterSpacing: 3, textTransform: 'uppercase' }}>
            Overture Maps
          </div>
        </div>
      </div>

      {/* Bookmark dial */}
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
    </>
  );
}
