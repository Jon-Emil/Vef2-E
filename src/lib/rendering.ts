import path from "path";
import fs from "fs";
import { readFile } from "fs/promises";
import ejs from "ejs";
import type { RenderingData } from "./validation.js";

export async function makeHTML(
  fileName: string,
  params: RenderingData | {}
): Promise<string> {
  const ejsPath = path.join(process.cwd(), "src", "views", fileName);
  if (!fs.existsSync(ejsPath)) {
    console.error("no file found for: ", ejsPath);
  }
  const template = await readFile(ejsPath, "utf-8");
  const renderedHTML = ejs.render(template, params, { filename: ejsPath });
  return renderedHTML;
}
