import fs from "fs";
import path from "path";

interface Frontmatter {
  id?: string;
  type?: string;
  title?: string;
  status?: string;
  last_updated?: string;
  owner?: string;
  tags?: string[];
  [key: string]: unknown;
}

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "knowledge");
const REQUIRED_FIELDS = ["id", "type", "title", "status", "last_updated", "owner"] as const;
const VALID_TYPES = new Set([
  "index",
  "domain",
  "dataset",
  "metric",
  "business_rule",
  "process",
  "glossary",
]);

function getAllMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const rawYaml = match[1];
  const body = match[2];
  const frontmatter: Frontmatter = {};

  const lines = rawYaml.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let val = trimmed.slice(colonIndex + 1).trim();

    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      frontmatter[key] = items;
    } else {
      val = val.replace(/^['"]|['"]$/g, "");
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

function extractMarkdownLinks(body: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(body)) !== null) {
    const href = match[2].trim();
    // Exclude external urls, mailto, and in-page anchor links
    if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("#")) {
      links.push(href);
    }
  }

  return links;
}

function runValidation() {
  console.log("🔍 Validando Base de Conocimiento OKF (Open Knowledge Format)...");
  console.log(`📁 Directorio: ${KNOWLEDGE_DIR}\n`);

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`❌ Error: El directorio ${KNOWLEDGE_DIR} no existe.`);
    process.exit(1);
  }

  const files = getAllMarkdownFiles(KNOWLEDGE_DIR);
  if (files.length === 0) {
    console.error(`❌ Error: No se encontraron archivos Markdown en ${KNOWLEDGE_DIR}.`);
    process.exit(1);
  }

  const seenIds = new Map<string, string>();
  let totalErrors = 0;
  let totalLinksChecked = 0;

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    const fileErrors: string[] = [];

    if (!frontmatter) {
      fileErrors.push("Falta bloque de YAML frontmatter (delimitado por ---).");
    } else {
      // Validate required fields
      for (const field of REQUIRED_FIELDS) {
        if (!frontmatter[field] || String(frontmatter[field]).trim() === "") {
          fileErrors.push(`Campo obligatorio ausente o vacío: '${field}'.`);
        }
      }

      // Validate entity type
      if (frontmatter.type && !VALID_TYPES.has(frontmatter.type)) {
        fileErrors.push(`Tipo de entidad no reconocido: '${frontmatter.type}'. Tipos válidos: ${[...VALID_TYPES].join(", ")}`);
      }

      // Validate ID uniqueness
      if (frontmatter.id) {
        if (seenIds.has(frontmatter.id)) {
          fileErrors.push(`ID duplicado '${frontmatter.id}' (ya usado en ${seenIds.get(frontmatter.id)}).`);
        } else {
          seenIds.set(frontmatter.id, relativePath);
        }
      }

      // Validate date format (YYYY-MM-DD)
      if (frontmatter.last_updated && !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.last_updated)) {
        fileErrors.push(`Formato de 'last_updated' inválido (${frontmatter.last_updated}). Debe ser YYYY-MM-DD.`);
      }
    }

    // Validate relative links
    const links = extractMarkdownLinks(body);
    for (const link of links) {
      totalLinksChecked++;
      const [cleanLink] = link.split("#");
      const targetPath = path.resolve(path.dirname(filePath), cleanLink);

      if (!fs.existsSync(targetPath)) {
        fileErrors.push(`Enlace roto: '${link}' -> no existe '${path.relative(process.cwd(), targetPath)}'.`);
      }
    }

    if (fileErrors.length > 0) {
      totalErrors += fileErrors.length;
      console.log(`❌ ${relativePath}`);
      for (const err of fileErrors) {
        console.log(`   └─ ${err}`);
      }
    } else {
      console.log(`✅ ${relativePath} (id: ${frontmatter?.id}, tipo: ${frontmatter?.type})`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Resumen de Validación OKF:`);
  console.log(`   • Archivos procesados: ${files.length}`);
  console.log(`   • Enlaces entre entidades validados: ${totalLinksChecked}`);
  console.log(`   • Total de errores: ${totalErrors}`);
  console.log("=".repeat(60));

  if (totalErrors > 0) {
    console.error(`\n❌ La validación falló con ${totalErrors} error(es).`);
    process.exit(1);
  } else {
    console.log(`\n✨ ¡Base de conocimiento OKF 100% válida y sin enlaces rotos!\n`);
    process.exit(0);
  }
}

runValidation();
