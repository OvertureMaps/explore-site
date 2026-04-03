'use client';

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

export default function TermsOfUse() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            pointerEvents: "auto",
            background: "rgba(0, 0, 0, 0.5)",
            color: "rgba(255, 255, 255, 0.7)",
            border: "none",
            borderRadius: "4px 4px 0 0",
            padding: "2px 12px",
            fontSize: "11px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Terms of Use
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Terms of Use</DialogTitle>
        <DialogContent dividers>
          <Typography paragraph variant="body2">
            By using Overture Maps Explorer (&quot;Explorer&quot;) you acknowledge and agree to (1) the{" "}
            <Link
              href="https://overturemaps.org/terms-of-use/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Overture Maps Foundation Website Terms and Conditions of Use
            </Link>
            , and (2) these additional terms of use.
          </Typography>
          <Typography paragraph variant="body2">
            Explorer is a visualization and inspection tool that helps developers, researchers, and
            data practitioners understand the structure, coverage, and characteristics of Overture
            Maps data and schema. You are permitted to use Explorer solely for these uses.
          </Typography>
          <Typography paragraph variant="body2">
            Explorer is not a product or a service. The tile endpoints powering Explorer are not
            stable production infrastructure and as such you should not use them for any purpose
            other than the purposes described in the prior paragraph. Explorer is not a mapping
            service and is not intended for navigation, routing, or operational use of any kind.
          </Typography>
          <Typography paragraph variant="body2" sx={{ fontWeight: 600 }}>
            EXPLORER IS PROVIDED AS-IS AND WITHOUT WARRANTIES OF ANY KIND.
          </Typography>
          <Typography paragraph variant="body2">
            The datasets displayed in Explorer are subject to the licenses of third party data
            providers. Please see Overture&apos;s{" "}
            <Link
              href="https://docs.overturemaps.org/attribution/"
              target="_blank"
              rel="noopener noreferrer"
            >
              attribution and licensing guide
            </Link>{" "}
            for details.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
