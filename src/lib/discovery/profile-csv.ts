export type CsvProfile = {
  rowCount: number;
  columnCount: number;
  columns: Array<{
    name: string;
    inferredType: "number" | "date" | "boolean" | "text" | "empty";
    nullCount: number;
    distinctCount: number;
    duplicateCount: number;
    sampleValues: string[];
  }>;
  findings: string[];
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function inferType(values: string[]): "number" | "date" | "boolean" | "text" | "empty" {
  const populated = values.filter((v) => v !== "");
  if (!populated.length) return "empty";
  if (populated.every((v) => /^-?\d+(\.\d+)?$/.test(v.replace(/,/g, "")))) return "number";
  if (populated.every((v) => /^(true|false|yes|no)$/i.test(v))) return "boolean";
  if (populated.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)))) return "date";
  return "text";
}

export function profileCsv(input: string): CsvProfile {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  const headers = parseCsvLine(lines[0]).map((h, i) => h || `column_${i + 1}`);
  if (headers.length > 250) throw new Error("CSV exceeds the 250-column profiling limit.");
  const rows = lines.slice(1).map(parseCsvLine);
  if (rows.length > 100000) throw new Error("CSV exceeds the 100,000-row browser profiling limit.");
  const findings: string[] = [];
  if (new Set(headers).size !== headers.length) findings.push("Duplicate column names detected.");
  const columns = headers.map((name, index) => {
    const values = rows.map((row) => row[index] ?? "");
    const populated = values.filter((v) => v !== "");
    const distinct = new Set(populated);
    return {
      name,
      inferredType: inferType(values),
      nullCount: values.length - populated.length,
      distinctCount: distinct.size,
      duplicateCount: populated.length - distinct.size,
      sampleValues: [...distinct].slice(0, 5)
    };
  });
  columns.forEach((column) => {
    if (column.nullCount > 0) findings.push(`${column.name}: ${column.nullCount} blank value(s).`);
    if (column.duplicateCount > 0 && column.distinctCount < 10) {
      findings.push(`${column.name}: repeated values detected; review whether duplicates are expected.`);
    }
  });
  return { rowCount: rows.length, columnCount: headers.length, columns, findings };
}
