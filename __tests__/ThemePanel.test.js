import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemePanel from "@/components/inspector_panel/ThemePanel";

const GERS_ID = "3b115ca6-ca2e-4704-9d05-941563714caf";

function renderPanel(entity) {
  return render(
    <ThemePanel
      mode="light"
      entity={{ theme: "places", type: "place", ...entity }}
      tips={{}}
    />
  );
}

describe("ThemePanel GERS ID", () => {
  it("links the GERS ID to its gers.page page in a new tab", () => {
    renderPanel({ id: GERS_ID });

    expect(screen.getByText(GERS_ID)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: `View GERS ID ${GERS_ID} on gers.page` });
    expect(link).toHaveAttribute("href", `https://gers.page/id/${GERS_ID}`);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the gers.page link when the feature has no ID", () => {
    renderPanel({});

    expect(screen.queryByRole("link", { name: /gers\.page/ })).not.toBeInTheDocument();
  });
});
