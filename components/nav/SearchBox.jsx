"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { useMapInstance } from "@/lib/MapContext";
import PropTypes from "prop-types";

const GEOCODER_BASE = "https://geocoder.bradr.dev";

const TYPE_LABELS = {
  locality: "City",
  localadmin: "Local Admin",
  county: "County",
  region: "Region",
  country: "Country",
  neighbourhood: "Neighborhood",
};

const SEARCH_MODES = [
  { value: "locality", label: "Locality" },
  { value: "country", label: "Country" },
  { value: "gers", label: "GERS", disabled: true },
];

const PLACEHOLDER = {
  locality: "Search places…",
  country: "Search countries…",
  gers: "Enter GERS ID…",
};

export default function SearchBox({ mode }) {
  const isDark = mode === "theme-dark";
  const map = useMapInstance();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("locality");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const currentLabel = SEARCH_MODES.find((m) => m.value === searchMode)?.label;
  const buttonLabel = searchMode === "locality" ? "Search Type" : currentLabel;

  const search = useCallback(async (q, sMode) => {
    if (abortRef.current) abortRef.current.abort();
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (sMode === "gers") {
        const res = await fetch(
          `${GEOCODER_BASE}/id/${encodeURIComponent(q.trim())}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.bbox) {
          setResults([{ gers_id: data.id, name: data.id, type: "gers", bbox: [data.bbox.xmin, data.bbox.ymin, data.bbox.xmax, data.bbox.ymax] }]);
          setOpen(true);
        } else {
          setResults([]);
          setOpen(false);
        }
      } else {
        const res = await fetch(
          `${GEOCODER_BASE}/search?q=${encodeURIComponent(q)}&limit=6&autocomplete=true`,
          { signal: controller.signal }
        );
        const data = await res.json();
        let items = data.results || [];
        if (sMode === "country") {
          items = items.filter((r) => r.type === "country");
        }
        setResults(items);
        setOpen(items.length > 0);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Geocoder search failed:", err);
      }
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val, searchMode), searchMode === "gers" ? 500 : 200);
  };

  const handleModeChange = (newMode) => {
    setSearchMode(newMode);
    setMenuAnchor(null);
    setResults([]);
    setOpen(false);
    if (query.length >= 2) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(query, newMode), 200);
    }
  };

  const handleSelect = (result) => {
    setQuery(result.name);
    setOpen(false);
    setResults([]);

    if (!map) return;

    if (searchMode === "country" && result.lat != null && result.lon != null) {
      map.jumpTo({ center: [result.lon, result.lat], zoom: 4 });
    } else if (result.bbox && result.bbox.length === 4 &&
      Math.abs(result.bbox[2] - result.bbox[0]) > 0.001 &&
      Math.abs(result.bbox[3] - result.bbox[1]) > 0.001) {
      map.fitBounds(
        [[result.bbox[0], result.bbox[1]], [result.bbox[2], result.bbox[3]]],
        { padding: 60, maxZoom: 14.5, animate: false }
      );
    } else if (result.lat != null && result.lon != null) {
      map.jumpTo({ center: [result.lon, result.lat], zoom: 14.5 });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative", ml: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
        <Button
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-controls={menuOpen ? "search-type-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          size="small"
          sx={{
            color: "inherit",
            fontSize: "0.8rem",
            textTransform: "none",
            padding: "4px 10px",
            minWidth: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {buttonLabel}
          <span style={{
            display: "inline-block",
            width: 0,
            height: 0,
            marginLeft: 6,
            verticalAlign: "middle",
            borderTop: "4px solid",
            borderRight: "4px solid transparent",
            borderLeft: "4px solid transparent",
          }} />
        </Button>
        <Menu
          id="search-type-menu"
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={() => setMenuAnchor(null)}
          MenuListProps={{ dense: true }}
        >
          {SEARCH_MODES.map((m) => (
            <MenuItem
              key={m.value}
              selected={m.value === searchMode}
              disabled={m.disabled}
              onClick={() => handleModeChange(m.value)}
            >
              {m.label}
            </MenuItem>
          ))}
        </Menu>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderRadius: 1,
            px: 1.5,
            py: 0.25,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, opacity: 0.5, marginRight: 6 }}
          >
            find_replace
          </span>
          <InputBase
            placeholder={PLACEHOLDER[searchMode]}
            value={query}
            onChange={handleInput}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            sx={{
              fontSize: 14,
              color: "inherit",
              "& .MuiInputBase-input": {
                padding: "4px 0",
                width: 280,
              },
            }}
          />
        </Box>

        {open && results.length > 0 && (
          <Paper
            elevation={6}
            sx={{
              position: "absolute",
              top: "100%",
              right: 0,
              width: 320,
              mt: 0.5,
              zIndex: 1300,
              maxHeight: 320,
              overflow: "auto",
              bgcolor: isDark ? "#2a2a2a" : "#fff",
            }}
          >
            <List dense disablePadding>
              {results.map((r, i) => (
                <ListItemButton
                  key={r.gers_id || i}
                  onClick={() => handleSelect(r)}
                  sx={{
                    "&:hover": {
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <ListItemText
                    primary={r.name}
                    secondary={
                      r.type === "gers" ? (
                        <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                          GERS ID
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                          {TYPE_LABELS[r.type] || r.type}
                          {r.region ? `, ${r.region}` : ""}
                          {r.country ? ` · ${r.country}` : ""}
                        </Typography>
                      )
                    }
                    primaryTypographyProps={{
                      fontSize: 14,
                      color: isDark ? "#fff" : "#000",
                      ...(r.type === "gers" && { fontFamily: "monospace", fontSize: 12 }),
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}

SearchBox.propTypes = {
  mode: PropTypes.string.isRequired,
};
