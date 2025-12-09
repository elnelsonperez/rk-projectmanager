import { z } from 'zod';

const categoryEnum = z.enum([
  'Muebles',
  'Decoración',
  'Accesorios',
  'Materiales',
  'Mano de Obra',
  'Otro'
]);

export const csvItemSchema = z.object({
  area: z.string().optional().default(''),
  item_name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional().default(''),
  category: z.string()
    .optional()
    .transform(val => (val?.trim() || 'Otro') as any)
    .pipe(categoryEnum.catch('Otro' as any)),
  cost: z.string()
    .transform(val => {
      const num = parseFloat(val || '0');
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().min(0, 'Costo debe ser ≥ 0'))
});

export type CSVItemRow = z.infer<typeof csvItemSchema>;
