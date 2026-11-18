import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { DEFAULT_STOCK_SEGMENT, departmentTitle, stockUrl, type StockCard, type StockSection, type StockSections, type StockStyle } from "@/lib/stock";

/*
 * Stock data from the API, cached until staff change something: saving a stock style or color, changing its stock, or
 * changing a department or category refreshes "stock" (and "stock:<slug>" for a style).
 */

/** Every style shown, in stock first and the newest first; the pages filter and sort them. */
export async function getStockStyles(segment?: string): Promise<StockCard[]> {
  "use cache";
  cacheLife("max");
  cacheTag("stock");

  return api<StockCard[]>("/v1/stock/styles", { query: { segment } });
}

export async function getStockStyle(slug: string): Promise<StockStyle | null> {
  "use cache";
  cacheLife("max");
  cacheTag("stock", `stock:${slug}`);

  try {
    return await api<StockStyle>(`/v1/stock/styles/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** The departments and categories, in staff order. */
export async function getStockSections(): Promise<StockSections> {
  "use cache";
  cacheLife("max");
  cacheTag("stock");

  return api<StockSections>("/v1/stock/sections");
}

/** A department with its title ("Men's jeans and cotton pants") and the number of styles shown in it. */
export type StockDepartment = StockSection & { href: string; title: string; styles: number };

/** A department by its slug, whether or not it has styles; null when there is none. */
export async function getStockDepartment(slug: string): Promise<StockDepartment | null> {
  const [sections, styles] = await Promise.all([getStockSections(), getStockStyles()]);
  const department = sections.departments.find((section) => section.slug === slug);
  return department ? withTitle(department, sections, styles) : null;
}

/** The departments for the stock pages' menus: those with styles shown, and the men's (the stock home), in staff order. */
export async function getStockDepartments(): Promise<StockDepartment[]> {
  const [sections, styles] = await Promise.all([getStockSections(), getStockStyles()]);
  return sections.departments
    .map((department) => withTitle(department, sections, styles))
    .filter((department) => department.styles > 0 || department.slug === DEFAULT_STOCK_SEGMENT);
}

function withTitle(department: StockSection, sections: StockSections, styles: StockCard[]): StockDepartment {
  return {
    ...department,
    href: stockUrl(department.slug),
    title: departmentTitle(department, sections.categories, styles),
    styles: styles.filter((style) => style.segment === department.slug).length,
  };
}
