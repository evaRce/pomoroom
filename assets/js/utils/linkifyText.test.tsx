import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { linkifyText } from "./linkifyText";

describe("linkifyText", () => {
  it("returns the plain text unchanged when there is no URL", () => {
    render(<div>{linkifyText("hola sin enlaces")}</div>);
    expect(screen.getByText("hola sin enlaces")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("turns a bare URL into a link", () => {
    render(<div>{linkifyText("mira https://example.com genial")}</div>);
    const link = screen.getByRole("link", { name: "https://example.com" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("strips trailing punctuation from the link but keeps it in the text", () => {
    const { container } = render(<div>{linkifyText("visita (https://example.com).")}</div>);
    const link = screen.getByRole("link", { name: "https://example.com" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(container.textContent).toBe("visita (https://example.com).");
  });

  it("linkifies multiple URLs in the same text", () => {
    render(<div>{linkifyText("https://a.com y https://b.com")}</div>);
    expect(screen.getByRole("link", { name: "https://a.com" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://b.com" })).toBeInTheDocument();
  });

  it("does not linkify non-http(s) protocols", () => {
    render(<div>{linkifyText("ftp://example.com no es un link")}</div>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
