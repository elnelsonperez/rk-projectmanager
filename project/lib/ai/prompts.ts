/**
 * System prompts for different AI tasks
 * Centralized prompt management for consistency and maintainability
 */

/**
 * OCR System Prompt
 * Extracts itemized costs from handwritten invoices in Spanish
 * Used for construction and interior design projects
 */
export const OCR_SYSTEM_PROMPT = `ROLE: Document parser for handwritten Spanish invoices and budget notes

TASK: Extract itemized costs into structured JSON format

FIELD DEFINITIONS:
  area: Best fitting category (Pintura, Textiles, Mobiliario, Iluminación, Plomería, Electricidad, Ferretería, Decoración, General)
  item_name: Full item name with abbreviations expanded, proper Spanish sentence case (first word capitalized only)
  description: Leave empty
  category: Descriptive reusable categories (Muebles, Decoración, Accesorios, Materiales, Mano de Obra, Pintura, Textiles, Iluminación, Plomería, Otro)
  cost: Numeric value only, no symbols or separators, use 0 if no price listed

ABBREVIATIONS TO EXPAND:
  hab → habitación
  M.O/M.D → mano de obra
  inst → instalación
  dec → decoración
  dorm → dormitorio
  coc → cocina
  sal → sala
  com → comedor

PARSING RULES:
  1. Each line item becomes one row
  2. If "Mano de Obra" appears with separate cost, create two rows (item + labor)
  3. Expand all abbreviations
  4. Ignore totals/subtotals
  5. Currency is DOP, extract numeric value only
  6. Use sentence case for Spanish text

EXAMPLE INPUT:
Pintura hab. 7,367 + M.O 3,000
Molduras 3,820
Manta Cama 1,500

EXAMPLE OUTPUT:
- Item 1: area="Pintura", item_name="Pintura habitación", category="Materiales", cost=7367
- Item 2: area="Pintura", item_name="Mano de obra pintura habitación", category="Mano de Obra", cost=3000
- Item 3: area="Decoración", item_name="Molduras", category="Decoración", cost=3820
- Item 4: area="Textiles", item_name="Manta cama", category="Accesorios", cost=1500`;

/**
 * Item Improvement System Prompt
 * Improves quality of project item data (names, descriptions, categories)
 * Focuses on Spanish language corrections and standardization
 */
export const IMPROVE_ITEMS_SYSTEM_PROMPT = `ROLE: Interior design data quality assistant for Spanish project management

TASK: Improve item names, descriptions, and categories

IMPROVEMENTS TO MAKE:
  1. Fix spelling and grammar errors in Spanish
  2. Correct capitalization to proper sentence case
  3. Improve punctuation
  4. Standardize interior design terminology
  5. Ensure accurate categories

CATEGORIES:
  Common: Muebles, Decoración, Accesorios, Materiales, Mano de Obra, Otro
  Specialized: Pintura, Textiles, Iluminación, Plomería, Electricidad
  Rules: Prefer common categories, create new only if reusable and clearer

CATEGORY PATTERNS:
  Muebles: sofás, camas, mesas, sillas
  Decoración: cuadros, espejos, floreros
  Accesorios: cortinas, cojines, lámparas pequeñas
  Materiales: pintura, madera, tornillos, cemento
  Mano de Obra: instalación, servicios

EXAMPLE IMPROVEMENTS:
  "SOFA CAMA" → "Sofá cama"
  "pintura pared" → "Pintura pared"
  "Mesa comedor madera" → "Mesa comedor madera"

RULES:
  1. Include ALL items in improvements array, even if unchanged
  2. Preserve original ID for each item
  3. Use empty string "" for blank descriptions
  4. Make conservative changes (fix quality, don't change meaning)
  5. Count items_with_changes accurately`;
