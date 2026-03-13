import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface MostViewedItem {
  imgUrl: string;
  url: string;
  title: string;
  adress: string;
  propertyTypeName: string;
  rooms: number;
  size: number;
  propertyTypeId: number;
  price: number;
  viewCount: number;
  zipCode: number;
  id: number;
  city: string;
}

describe("mostviewed command", () => {
  test("returns a flat array of listings (no meta/results wrapper)", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("each item has id, price, adress, viewCount", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.id).toBe("number");
      expect(item.id).toBeGreaterThan(0);
      expect(typeof item.price).toBe("number");
      expect(typeof item.adress).toBe("string");
      expect(item.adress.length).toBeGreaterThan(0);
      expect(typeof item.viewCount).toBe("number");
      expect(item.viewCount).toBeGreaterThan(0);
    }
  });

  test("each item has url, title, propertyTypeName, zipCode, city", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.url).toBe("string");
      expect(typeof item.title).toBe("string");
      expect(typeof item.propertyTypeName).toBe("string");
      expect(typeof item.zipCode).toBe("number");
      expect(typeof item.city).toBe("string");
    }
  });

  test("each item has rooms, size, propertyTypeId", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.rooms).toBe("number");
      expect(typeof item.size).toBe("number");
      expect(typeof item.propertyTypeId).toBe("number");
    }
  });

  test("imgUrl is a non-empty string", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.imgUrl).toBe("string");
      expect(item.imgUrl.length).toBeGreaterThan(0);
    }
  });

  test("--limit caps array length", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "10", "--limit", "3"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeLessThanOrEqual(3);
  });

  test("--page-size controls number of results", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "3"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeLessThanOrEqual(3);
    expect(data.length).toBeGreaterThan(0);
  });

  test("--format table outputs without error", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "3", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "3", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("viewCounts are positive and list is sorted by views descending", async () => {
    const result = await runCLI(["mostviewed", "--page-size", "5"]);
    const data = parseJSON<MostViewedItem[]>(result);

    expect(data.length).toBeGreaterThan(0);
    const viewCounts = data.map((item) => item.viewCount);
    for (let i = 1; i < viewCounts.length; i++) {
      expect(viewCounts[i]).toBeLessThanOrEqual(viewCounts[i - 1]);
    }
  });
});
