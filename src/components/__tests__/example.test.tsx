import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Example unit test
 * This is a placeholder test file demonstrating the structure
 * You can delete this file once you start writing real tests
 */
describe("Example Test", () => {
  it("should render a simple component", () => {
    render(<div>Hello World</div>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
