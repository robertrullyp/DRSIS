function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells.map((value) => value.trim());
}

export type CsvTable = {
  header: string[];
  rows: string[][];
};

export function parseCsvTable(input: string): CsvTable {
  const text = input.replace(/^\uFEFF/, "").trim();
  const lines = text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { header: [], rows: [] };
  }

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  return { header, rows };
}

