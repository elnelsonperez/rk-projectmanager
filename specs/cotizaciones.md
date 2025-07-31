,# Technical Specification: Quotation System

## Overview
A new quotation generation utility will be implemented to create personalized quotations. This functionality will be independent of existing projects and will generate professional quotation documents with elegant print-optimized formatting.

## Project Scope

### Core Functionality
- **New quotation form**: Interface for creating quotations with dynamic items
- **Document generation**: Creation of elegantly styled HTML optimized for printing
- **Integrated navigation**: New access point in the main menu
- **Markdown support**: Conversion of markdown to HTML in descriptions

### Document Specifications
- **Document type**: Quotation (Cotización)
- **Logo**: RKArtSide from assets folder, positioned in top left corner
- **Date format**: "30 de Julio del 2025" (full Spanish format)
- **Structure**: Client name, itemized list with amounts, total, banking note
- **Design**: Elegant, professional layout with subtle maroon/brownish accents
- **Background**: Clean white background with elegant typography and subtle color highlights

## Technical Architecture

### Existing Technology Stack
- **Frontend**: React 19 with TypeScript
- **Router**: React Router DOM v7
- **UI**: TailwindCSS with custom components
- **State**: Zustand for local state management
- **Forms**: React Hook Form with Zod validation
- **Bundler**: Vite

### Proposed File Structure

```
frontend/src/
├── components/
│   └── quotations/
│       ├── QuotationForm.tsx      # Main form component
│       ├── QuotationItemInput.tsx # Individual item component
│       └── QuotationPreview.tsx   # Optional preview component
├── pages/
│   └── QuotationPage.tsx          # Main quotations page
├── utils/
│   └── quotationUtils.ts         # Generation and formatting utilities
└── types/
    └── quotation.types.ts        # TypeScript types
```

### Main Components

#### 1. QuotationPage.tsx
**Responsibility**: Main container page
- Renders the quotation form
- Handles navigation and page state
- Integrates all quotation components

#### 2. QuotationForm.tsx
**Responsibility**: Main quotation form
- Fields: Client name
- Dynamic item management (add/remove)
- Automatic total calculations
- Document generation button
- Validation with React Hook Form + Zod

#### 3. QuotationItemInput.tsx
**Responsibility**: Individual item line component
- Description field with Markdown support
- Numeric amount field
- Item deletion button
- Optional markdown preview

### Data Types

```typescript
interface QuotationItem {
  id: string;
  description: string; // Supports Markdown
  amount: number;
}

interface Quotation {
  clientName: string;
  items: QuotationItem[];
  total: number;
  createdAt: Date;
}
```

### Sidebar Integration
A new link will be added to the `Sidebar.tsx` component:
- Position: Between "Registro de Cambios" and "Proyectos"
- Icon: Document/invoice
- Text: "Cotizaciones"
- Route: `/cotizaciones`

### Document Generation Functionality

#### Elegant Styling Approach
Unlike the existing `printUtils.ts`, this will feature an elegant, professional design:
- Clean white background with sophisticated typography
- Subtle maroon/brownish accent colors (#8B4513, #A0522D, #CD853F)
- Professional fonts and spacing optimized for print
- Minimalist borders and elegant table design
- Logo integration from assets folder

#### Generated HTML Document Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Quotation - [Client]</title>
  <style>[Elegant CSS optimized for printing]</style>
</head>
<body>
  <div class="quotation-container">
    <!-- Elegant header with logo and company info -->
    <div class="quotation-header">
      <div class="logo-section">
        <img src="[logo-path]" alt="RKArtSide" class="logo" />
      </div>
      <div class="company-info">
        <h1 class="company-name">RK</h1>
        <p class="tagline">Panel descriptivo</p>
      </div>
      <div class="document-info">
        <p class="quotation-number">Presupuesto No. [number]</p>
        <p class="quotation-date">[formatted date]</p>
      </div>
    </div>
    
    <div class="document-title">
      <h2>COTIZACIÓN</h2>
    </div>
    
    <!-- Client information -->
    <div class="client-section">
      <p><strong>Cliente:</strong> [client name]</p>
    </div>
    
    <!-- Elegant items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="description-col">Descripción</th>
          <th class="qty-col">QTY</th>
          <th class="price-col">Precio</th>
          <th class="total-col">Total</th>
        </tr>
      </thead>
      <tbody>
        <!-- Dynamic items with converted markdown -->
      </tbody>
    </table>
    
    <!-- Total section -->
    <div class="total-section">
      <div class="total-line">
        <span class="total-label">Total:</span>
        <span class="total-amount">[amount]</span>
      </div>
      <div class="total-line final-total">
        <span class="total-label">TOTAL A PAGAR:</span>
        <span class="total-amount">[amount]</span>
      </div>
    </div>
    
    <!-- Banking note -->
    <div class="banking-note">
      [banking note content]
    </div>
  </div>
</body>
</html>
```

### Markdown Processing
A lightweight Markdown to HTML conversion library will be used:
- **Option 1**: `marked` (popular in React ecosystem)
- **Option 2**: `markdown-it` (more configurable)
- **Alternative**: Simple implementation for basic cases

**Supported Markdown Features**:
- **Bold/Italic**: `**text**`, `*text*`
- **Lists**: `- item`, `1. item`
- **Line breaks**: Double enter
- **Links**: `[text](url)` (optional)

### Navigation and Routing
Update in `App.tsx`:
```tsx
<Route path="/cotizaciones" element={<QuotationPage />} />
```

Update in `Sidebar.tsx`:
```tsx
<NavLink to="/cotizaciones" className="[classes]">
  <span>Cotizaciones</span>
</NavLink>
```

## Implementation Details

### Form Validation
```typescript
const quotationSchema = z.object({
  clientName: z.string().min(1, "Client name required"),
  items: z.array(z.object({
    description: z.string().min(1, "Description required"),
    amount: z.number().min(0, "Amount must be positive")
  })).min(1, "At least one item required")
});
```

### Local State Management
Using useState for temporary form state:
- No database persistence required
- State resets when generating document
- Optional Zustand for global state if history needed

### Automatic Calculations
- Real-time total recalculation
- Currency formatting consistent with existing `formatCurrency()`
- Numeric amount validation

### Responsive Design
- Adaptive form for desktop and tablet
- Optional preview for large screens
- Generated document optimized for print only

### Elegant Print Styling
```css
/* Color Palette */
:root {
  --maroon-primary: #8B4513;
  --maroon-secondary: #A0522D;
  --maroon-light: #CD853F;
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
}

/* Typography */
.quotation-container {
  font-family: 'Georgia', 'Times New Roman', serif;
  color: var(--text-primary);
  line-height: 1.6;
}

/* Header styling */
.quotation-header {
  border-bottom: 2px solid var(--maroon-primary);
  padding-bottom: 20px;
  margin-bottom: 30px;
}

/* Table styling */
.items-table {
  border: 1px solid var(--maroon-light);
  border-collapse: separate;
  border-spacing: 0;
}

.items-table th {
  background-color: var(--maroon-primary);
  color: white;
  font-weight: 600;
}

/* Subtle alternating rows */
.items-table tbody tr:nth-child(even) {
  background-color: rgba(139, 69, 19, 0.05);
}
```

## Design Considerations

### Visual Consistency
- Follow existing application design patterns
- Use existing UI components (`button.tsx`, `CurrencyInput.tsx`)
- Maintain consistency with TailwindCSS

### User Experience
- Temporary form auto-save (localStorage)
- Confirmation before leaving with unsaved data
- Loading states during document generation
- Clear and specific error messages

### Accessibility
- Proper form labels
- Keyboard navigation
- Adequate contrast in printed document
- Screen reader friendly

### Professional Document Features
- Automatic quotation numbering
- Elegant typography hierarchy
- Professional spacing and margins
- Print-optimized layout with proper page breaks
- Watermark or subtle background pattern (optional)

## Banking Note (Static Content)

```
Nota:
• Ni cobros ni comisiones ocultas, el cobro es por paquete, haciendo que no tomemos ninguna comisión ni agrandamos el presupuesto. La transparencia es parte crucial en este proceso.
• Creamos según gusto y presupuesto, quiero que cada diseño sea una experiencia para los clientes.

Detalles bancarios:
Banco Popular Dominicano
Cuenta de Corriente 
816055909 
Reyka Kawashiro
Cédula: 402-2781561-6
```

## Development Plan

### Phase 1: Base Structure
1. Create TypeScript types
2. Implement base components
3. Add sidebar navigation
4. Configure routing

### Phase 2: Core Functionality
1. Implement form with validation
2. Add dynamic item management
3. Implement automatic calculations
4. Integrate Markdown conversion

### Phase 3: Document Generation
1. Create elegant print utilities for quotations
2. Design professional HTML template
3. Implement generation and window opening
4. Test printing across different browsers

### Phase 4: Polish and Testing
1. Improve UX and validations
2. Add loading states
3. Responsive testing
4. Final documentation

## Risks and Mitigations

### Risk: Print Compatibility
**Mitigation**: Use proven CSS print media queries, create dedicated elegant styling

### Risk: Markdown Conversion
**Mitigation**: Implement basic subset initially, expand gradually

### Risk: Spanish Date Formatting
**Mitigation**: Use `Intl.DateTimeFormat` with Spanish locale

### Risk: Professional Appearance
**Mitigation**: Follow established design principles, test with real client scenarios

## Conclusion

This implementation will provide a complete and professional tool for generating elegant quotations, maintaining consistency with existing architecture while introducing sophisticated styling that reflects the quality of RKArtSide's design services.