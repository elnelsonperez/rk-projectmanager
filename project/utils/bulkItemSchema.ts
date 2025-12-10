import { z } from 'zod';

export const csvItemSchema = z.object({
  area: z.string().optional().default(''),
  item_name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().default(''),
  category: z.string()
    .transform(val => val?.trim() || 'Otro')
    .pipe(z.string().min(1, 'Categoría requerida')),
  cost: z.string()
    .transform(val => {
      const num = parseFloat(val || '0');
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().min(0, 'Costo debe ser ≥ 0'))
});

export type CSVItemRow = z.infer<typeof csvItemSchema>;
