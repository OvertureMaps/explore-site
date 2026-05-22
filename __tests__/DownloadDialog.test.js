/**
 * Tests for components/nav/DownloadDialog.jsx
 *
 * Covers: rendering layers, bbox display, confirm/cancel callbacks,
 * disabled state when no types, and closed state.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DownloadDialog from "@/components/nav/DownloadDialog";

const TYPES = ["buildings", "places", "transportation"];
const BBOX = [-77.69, 39.13, -77.68, 39.15];

function renderDialog(props = {}) {
  const defaults = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    visibleTypes: TYPES,
    bbox: BBOX,
  };
  return render(<DownloadDialog {...defaults} {...props} />);
}

describe("DownloadDialog", () => {
  describe("rendering", () => {
    it("shows the dialog title", () => {
      renderDialog();
      expect(screen.getByText("Confirm Download")).toBeInTheDocument();
    });

    it("lists all visible layer types", () => {
      renderDialog();
      for (const type of TYPES) {
        expect(screen.getByText(type)).toBeInTheDocument();
      }
    });

    it("shows the bounding box", () => {
      renderDialog();
      const bboxEl = screen.getByTestId("download-dialog-bbox");
      expect(bboxEl).toHaveTextContent("W -77.6900");
      expect(bboxEl).toHaveTextContent("S 39.1300");
      expect(bboxEl).toHaveTextContent("E -77.6800");
      expect(bboxEl).toHaveTextContent("N 39.1500");
    });

    it("omits bbox section when bbox is not provided", () => {
      renderDialog({ bbox: null });
      expect(screen.queryByTestId("download-dialog-bbox")).not.toBeInTheDocument();
    });

    it("mentions GeoJSON and ZIP in the format line", () => {
      renderDialog();
      expect(screen.getByText(/Format:.*GeoJSON.*ZIP/i)).toBeInTheDocument();
    });

    it("shows a message when visibleTypes is empty", () => {
      renderDialog({ visibleTypes: [] });
      expect(
        screen.getByText(/No visible layers available/i)
      ).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Confirm Download")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when Cancel button is clicked", () => {
      const onCancel = jest.fn();
      renderDialog({ onCancel });
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onConfirm when Download button is clicked", () => {
      const onConfirm = jest.fn();
      renderDialog({ onConfirm });
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when the dialog backdrop is clicked (Escape / outside click)", () => {
      const onCancel = jest.fn();
      renderDialog({ onCancel });
      // MUI Dialog fires onClose (mapped to onCancel) on Escape keydown
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("disables the Download button when visibleTypes is empty", () => {
      renderDialog({ visibleTypes: [] });
      expect(
        screen.getByRole("button", { name: /download/i })
      ).toBeDisabled();
    });

    it("enables the Download button when visibleTypes is non-empty", () => {
      renderDialog();
      expect(
        screen.getByRole("button", { name: /download/i })
      ).not.toBeDisabled();
    });
  });
});
