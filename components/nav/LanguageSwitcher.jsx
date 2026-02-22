import { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import PropTypes from "prop-types";
import "./LanguageSwitcher.css";

const LANGUAGES = [
  { code: "mul", label: "Default" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "br", label: "Brezhoneg (Breton)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "el", label: "Ελληνικά (Greek)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "he", label: "עברית (Hebrew)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
  { code: "zh-Hans", label: "简体中文 (Chinese Simplified)" },
  { code: "zh-Hant", label: "繁體中文 (Chinese Traditional)" },
  { code: "zh-Hant-CN", label: "繁體中文-CN (Chinese Trad. CN)" },
  { code: "zh-Hant-HK", label: "繁體中文-HK (Chinese Trad. HK)" },
  { code: "zh-Hant-TW", label: "繁體中文-TW (Chinese Trad. TW)" },
];

export default function LanguageSwitcher({ language, setLanguage }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const buttonLabel = language === "mul" ? "Change Map Language" : current.label;
  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (code) => {
    setLanguage(code);
    handleClose();
  };

  return (
    <div className="language-switcher">
      <Button
        onClick={handleClick}
        aria-controls={open ? "language-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        className="language-btn"
        size="small"
      >
        {buttonLabel}
        <span className="mui-caret" />
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ dense: true }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === language}
            onClick={() => handleSelect(lang.code)}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

LanguageSwitcher.propTypes = {
  language: PropTypes.string.isRequired,
  setLanguage: PropTypes.func.isRequired,
};
