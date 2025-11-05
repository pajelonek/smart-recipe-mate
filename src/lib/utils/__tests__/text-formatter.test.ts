import { describe, it, expect } from "vitest";
import { truncate } from "../text-formatter";

describe("text-formatter", () => {
  describe("truncate - basic functionality", () => {
    it("should return original text when text is shorter than length", () => {
      const text = "short";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("short");
    });

    it("should return original text when text length equals length", () => {
      const text = "exactly10";
      const result = truncate(text, { length: 9 });
      expect(result).toBe("exactly10");
    });

    it("should truncate text when text is longer than length", () => {
      const text = "very long text that exceeds limit";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("very long ...");
      expect(result.length).toBe(13); // 10 + 3 (suffix)
    });

    it("should use default suffix '...' when not specified", () => {
      const text = "long text";
      const result = truncate(text, { length: 4 });
      expect(result).toBe("long...");
    });
  });

  describe("truncate - custom suffix", () => {
    it("should use custom suffix when provided", () => {
      const text = "very long text";
      const result = truncate(text, { length: 4, suffix: "..." });
      expect(result).toBe("very...");
    });

    it("should use empty suffix when provided", () => {
      const text = "very long text";
      const result = truncate(text, { length: 4, suffix: "" });
      expect(result).toBe("very");
    });

    it("should use custom suffix with multiple characters", () => {
      const text = "very long text";
      const result = truncate(text, { length: 4, suffix: " [more]" });
      expect(result).toBe("very [more]");
    });

    it("should use single character suffix", () => {
      const text = "very long text";
      const result = truncate(text, { length: 4, suffix: "…" });
      expect(result).toBe("very…");
    });
  });

  describe("truncate - edge cases", () => {
    it("should handle empty string", () => {
      const text = "";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("");
    });

    it("should handle length of 0", () => {
      const text = "some text";
      const result = truncate(text, { length: 0 });
      expect(result).toBe("...");
    });

    it("should handle length of 1", () => {
      const text = "some text";
      const result = truncate(text, { length: 1 });
      expect(result).toBe("s...");
    });

    it("should handle very long text", () => {
      const text = "a".repeat(1000);
      const result = truncate(text, { length: 100 });
      expect(result).toBe("a".repeat(100) + "...");
    });

    it("should handle text with special characters", () => {
      const text = "Hello @world! #test";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("Hello @wor...");
    });

    it("should handle text with unicode characters", () => {
      const text = "Cześć Świat! 你好";
      const result = truncate(text, { length: 5 });
      expect(result).toBe("Cześć...");
    });

    it("should handle text with emojis", () => {
      const text = "Hello 👋 World 🌍";
      const result = truncate(text, { length: 8 });
      // Note: Emoji might count as multiple characters
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(8);
    });

    it("should handle text with newlines", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("Line 1\nLin...");
    });

    it("should handle text with tabs", () => {
      const text = "Column1\tColumn2\tColumn3";
      const result = truncate(text, { length: 10 });
      // Tab character counts as 1 character
      expect(result).toContain("Column1\t");
      expect(result.length).toBe(13); // 10 + 3 (suffix)
    });
  });

  describe("truncate - boundary conditions", () => {
    it("should handle length exactly equal to text length", () => {
      const text = "exact";
      const result = truncate(text, { length: 5 });
      expect(result).toBe("exact");
    });

    it("should handle length one less than text length", () => {
      const text = "exact";
      const result = truncate(text, { length: 4 });
      expect(result).toBe("exac...");
    });

    it("should handle length one more than text length", () => {
      const text = "exact";
      const result = truncate(text, { length: 6 });
      expect(result).toBe("exact");
    });
  });

  describe("truncate - whitespace handling", () => {
    it("should preserve leading whitespace when truncated", () => {
      const text = "   some text";
      const result = truncate(text, { length: 5 });
      expect(result).toBe("   so...");
    });

    it("should preserve trailing whitespace when not truncated", () => {
      const text = "short   ";
      const result = truncate(text, { length: 10 });
      expect(result).toBe("short   ");
    });

    it("should handle text with only whitespace", () => {
      const text = "   ";
      const result = truncate(text, { length: 2 });
      expect(result).toBe("  ...");
    });
  });

  describe("truncate - real-world scenarios", () => {
    it("should truncate recipe title", () => {
      const title = "Delicious Homemade Chocolate Chip Cookies Recipe";
      const result = truncate(title, { length: 30 });
      expect(result).toBe("Delicious Homemade Chocolate C...");
      expect(result.length).toBe(33); // 30 + 3 (suffix)
    });

    it("should truncate recipe summary", () => {
      const summary = "This is a long recipe summary that describes the dish in detail...";
      const result = truncate(summary, { length: 50 });
      expect(result).toBe("This is a long recipe summary that describes the d...");
      expect(result.length).toBe(53); // 50 + 3 (suffix)
    });

    it("should handle ingredient list truncation", () => {
      const ingredients = "Flour, Sugar, Butter, Eggs, Vanilla, Chocolate Chips";
      const result = truncate(ingredients, { length: 20 });
      expect(result).toBe("Flour, Sugar, Butter...");
      expect(result.length).toBe(23); // 20 + 3 (suffix)
    });
  });

  describe("truncate - suffix length considerations", () => {
    it("should account for suffix length in truncation", () => {
      const text = "very long text";
      // Total length will be truncation length + suffix length
      const result = truncate(text, { length: 4, suffix: "..." });
      expect(result).toBe("very...");
      expect(result.length).toBe(7); // 4 + 3
    });

    it("should handle very long suffix", () => {
      const text = "text";
      const result = truncate(text, { length: 2, suffix: " [read more]" });
      expect(result).toBe("te [read more]");
    });

    it("should handle suffix longer than truncation length", () => {
      const text = "abc";
      const result = truncate(text, { length: 1, suffix: " [very long suffix]" });
      expect(result).toBe("a [very long suffix]");
    });
  });
});
