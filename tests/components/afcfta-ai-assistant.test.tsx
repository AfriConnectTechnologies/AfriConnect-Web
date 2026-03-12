import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AfcftaAiAssistant } from "@/components/compliance/afcfta-ai-assistant";

describe("AfcftaAiAssistant", () => {
  it("renders the assistant scaffold and sample actions", () => {
    render(<AfcftaAiAssistant />);

    expect(
      screen.getByText("Ask AI about AfCFTA compliance")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask ai/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Does AfCFTA automatically make this product duty free today?"
      )
    ).toBeInTheDocument();
  });
});
