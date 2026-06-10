import { inflateRawSync } from "zlib";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { importCustomers, type CustomerImportRow } from "../store";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";

export const dynamic = "force-dynamic";

type TableRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function splitList(value: string) {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "si", "sí", "y", "consent", "ok"].includes(value.trim().toLowerCase());
}

function normalizeDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const excelSerial = Number(trimmed);

  if (Number.isFinite(excelSerial) && excelSerial > 20000 && excelSerial < 90000) {
    const date = new Date(Math.round((excelSerial - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10);
}

function rowsToImportRows(rows: TableRow[]): CustomerImportRow[] {
  return rows.map((row) => {
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const normalized = normalizeHeader(key);
        const match = Object.entries(row).find(([rowKey]) => normalizeHeader(rowKey) === normalized);

        if (match) {
          return match[1] ?? "";
        }
      }

      return "";
    };

    return {
      firstName: get("firstName", "first name", "nombre", "name").trim(),
      phone: get("phone", "telefono", "teléfono", "whatsapp").trim(),
      tags: splitList(get("tags", "tag", "segment")),
      lastVisit: normalizeDate(get("lastVisit", "last visit", "ultima visita", "última visita")),
      requestedService: get("requestedService", "requested service", "servicio", "service").trim(),
      consentWhatsapp: parseBoolean(get("consentWhatsapp", "consent whatsapp", "whatsapp consent", "consentimiento")),
    };
  }).filter((row) => row.phone);
}

function parseCsv(text: string): TableRow[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  rows.push(row);

  const [headers = [], ...records] = rows.filter((items) => items.some((item) => item.trim()));
  return records.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), items[index]?.trim() ?? ""]))
  );
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  const signature = 0x02014b50;
  const endSignature = 0x06054b50;
  let endOffset = -1;

  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === endSignature) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset === -1) {
    return entries;
  }

  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  let offset = centralDirectoryOffset;

  while (offset < buffer.length && buffer.readUInt32LE(offset) === signature) {
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compression === 8 ? inflateRawSync(compressed) : compressed;

    entries.set(fileName, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function columnIndex(cellRef: string) {
  const letters = cellRef.replace(/\d+/g, "");
  return letters.split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseXlsx(buffer: Buffer): TableRow[] {
  const entries = readZipEntries(buffer);
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const sharedStrings = [...sharedXml.matchAll(/<si[\s\S]*?<\/si>/g)].map(([item]) =>
    decodeXml([...item.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join(""))
  );
  const sheetName = [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  const sheetXml = sheetName ? entries.get(sheetName)?.toString("utf8") ?? "" : "";
  const rows = [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const values: string[] = [];

    for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*r="([A-Z]+\d+)"[^>]*?(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g)) {
      const ref = cellMatch[1];
      const type = cellMatch[2];
      const cellXml = cellMatch[3];
      const rawValue = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
      const value = type === "s" ? sharedStrings[Number(rawValue)] ?? "" : decodeXml(rawValue);
      values[columnIndex(ref)] = value;
    }

    return values;
  }).filter((items) => items.some(Boolean));
  const [headers = [], ...records] = rows;

  return records.map((items) =>
    Object.fromEntries(headers.map((header, index) => [String(header).trim(), String(items[index] ?? "").trim()]))
  );
}

function parseTableRows(fileName: string, buffer: Buffer) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "xlsx" ? parseXlsx(buffer) : parseCsv(buffer.toString("utf8"));
}

export async function POST(request: Request) {
  const { ctx } = await requireTenantFromNativeRequest(request);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();

    if (body?.source !== "wsp") {
      return NextResponse.json({ ok: false, error: "Unsupported import source" }, { status: 400 });
    }

    const wspDir = path.join(process.cwd(), "wsp");
    const files = await fs.readdir(wspDir).catch(() => []);
    const importFiles = files.filter((fileName) => /\.(csv|xlsx)$/i.test(fileName));
    const tableRows: TableRow[] = [];

    for (const fileName of importFiles) {
      const buffer = await fs.readFile(path.join(wspDir, fileName));
      tableRows.push(...parseTableRows(fileName, buffer));
    }

    const rows = rowsToImportRows(tableRows);
    const result = await importCustomers(rows, ctx?.tenantId);

    return NextResponse.json({
      ok: true,
      source: "wsp",
      files: importFiles,
      parsedRows: tableRows.length,
      importedRows: rows.length,
      ...result,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing import file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const tableRows = parseTableRows(file.name, buffer);
  const rows = rowsToImportRows(tableRows);
  const result = await importCustomers(rows, ctx?.tenantId);

  return NextResponse.json({
    ok: true,
    fileName: file.name,
    parsedRows: tableRows.length,
    importedRows: rows.length,
    ...result,
  });
}
