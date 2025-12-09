import Papa from 'papaparse';

export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
}

// Parse CSV from File (current flow)
export function parseCSVFile<T>(
  file: File,
  expectedHeaders: string[]
): Promise<CSVParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (results) => {
        resolve(validateCSVResults(results, expectedHeaders));
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [`Error al leer el archivo: ${error.message}`]
        });
      }
    });
  });
}

// Parse CSV from string (future OCR flow)
export function parseCSVString<T>(
  csvString: string,
  expectedHeaders: string[]
): CSVParseResult<T> {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });

  return validateCSVResults(results, expectedHeaders);
}

// Shared validation logic
function validateCSVResults<T>(
  results: Papa.ParseResult<any>,
  expectedHeaders: string[]
): CSVParseResult<T> {
  const errors: string[] = [];

  // Validate headers
  const headers = results.meta.fields || [];
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

  if (missingHeaders.length > 0) {
    errors.push(`Columnas faltantes: ${missingHeaders.join(', ')}`);
  }

  if (results.data.length === 0) {
    errors.push('El archivo no contiene datos');
  }

  return {
    data: results.data as T[],
    errors
  };
}
