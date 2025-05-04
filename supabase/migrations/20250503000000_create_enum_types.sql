-- Create enum types for the application
-- Project Status enum
CREATE TYPE estado_proyecto AS ENUM (
  'Planificación',
  'En Progreso',
  'En Pausa',
  'Completado'
);

-- Item Category enum
CREATE TYPE categoria_item AS ENUM (
  'Muebles',
  'Decoración',
  'Accesorios',
  'Materiales',
  'Mano de Obra',
  'Otro'
);

-- Payment Method enum
CREATE TYPE metodo_pago AS ENUM (
  'Efectivo',
  'Transferencia',
  'Tarjeta de Credito',
  'Otros'
);