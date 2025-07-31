import { Quotation } from '../types/quotation.types';
import { formatCurrency } from './formatters';
import { convertMarkdownToHtml } from './markdownUtils';
import logoRk from '../assets/logork.jpg'
// Elegant quotation styles with maroon/brownish accent colors
const quotationStyles = `
:root {
  --maroon-primary: #8B4513;
  --maroon-secondary: #A0522D;
  --maroon-light: #CD853F;
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
  --bg-subtle: rgba(139, 69, 19, 0.05);
}

body {
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  margin: 1.5cm;
  color: var(--text-primary);
  line-height: 1.6;
  background: white;
}

.quotation-container {
  max-width: 100%;
  margin: 0 auto;
  background: white;
}

/* Elegant Header */
.quotation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid var(--maroon-primary);
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.logo-section {
  flex-shrink: 0;
}

.logo {
  max-width: 220px;
  height: auto;
  border-radius: 8px;
}

.header-title {
  flex: 1;
  text-align: center;
}

.header-title h1 {
  font-size: 2.2em;
  color: var(--maroon-primary);
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: bold;
}

.document-info {
  text-align: right;
  flex-shrink: 0;
}

.quotation-number {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 5px;
}

.quotation-date {
  font-size: 1em;
  color: var(--text-secondary);
  margin: 0;
}


/* Client Section */
.client-section {
  margin: 30px 0;
  padding: 15px;
  background: var(--bg-subtle);
  border-left: 4px solid var(--maroon-primary);
  border-radius: 0 8px 8px 0;
}

.client-section p {
  margin: 0;
  font-size: 1.1em;
}

/* Elegant Items Table */
.items-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 30px 0;
  border: 2px solid var(--maroon-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.items-table th {
  background: linear-gradient(135deg, var(--maroon-primary), var(--maroon-secondary));
  color: white;
  font-weight: 600;
  font-size: 0.95em;
  text-align: left;
  padding: 15px 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-table th:first-child {
  width: 50%;
}

.items-table th.qty-col {
  width: 15%;
  text-align: center;
}

.items-table th.price-col,
.items-table th.total-col {
  width: 17.5%;
  text-align: right;
}

.items-table td {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.2);
  font-size: 0.95em;
}

.items-table tbody tr:nth-child(even) {
  background-color: var(--bg-subtle);
}

.items-table tbody tr:hover {
  background-color: rgba(139, 69, 19, 0.08);
}

.description-col {
  vertical-align: top;
  line-height: 1.5;
}

.qty-col {
  text-align: center;
  font-weight: 600;
}

.price-col,
.total-col {
  text-align: right;
  font-weight: 600;
  color: var(--maroon-primary);
}

/* Total Section */
.total-section {
  margin: 40px 0;
  padding: 25px;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.05), rgba(160, 82, 45, 0.05));
  border: 2px solid var(--maroon-light);
  border-radius: 12px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 1.1em;
}

.total-line:not(:last-child) {
  border-bottom: 1px solid rgba(139, 69, 19, 0.2);
}

.final-total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 3px double var(--maroon-primary) !important;
  font-size: 1.3em;
  font-weight: bold;
}

.total-label {
  color: var(--text-primary);
  font-weight: 600;
}

.total-amount {
  color: var(--maroon-primary);
  font-weight: bold;
  font-size: 1.1em;
}

/* Banking Note */
.banking-note {
  margin-top: 30px;
  padding: 20px;
  background: rgba(139, 69, 19, 0.03);
  border: 1px solid var(--maroon-light);
  border-radius: 8px;
  font-size: 0.85em;
  line-height: 1.3;
}

/* Signature Section */
.signature-section {
  margin-top: 40px;
  padding: 25px;
  background: rgba(139, 69, 19, 0.02);
  border: 2px solid var(--maroon-light);
  border-radius: 12px;
  text-align: center;
}

.signature-title {
  color: var(--maroon-primary);
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 10px;
}

.signature-client-name {
  color: var(--text-primary);
  font-size: 1em;
  margin-bottom: 30px;
}

.signature-line {
  border-bottom: 2px solid var(--maroon-primary);
  width: 300px;
  margin: 0 auto 10px;
  height: 40px;
}

.signature-label {
  color: var(--text-secondary);
  font-size: 0.9em;
  font-style: italic;
}

.banking-note-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  align-items: start;
}

.notes-section h4 {
  color: var(--maroon-primary);
  margin: 0 0 10px;
  font-size: 1em;
  font-weight: 600;
}

.notes-section p {
  margin: 6px 0;
  line-height: 1.3;
}

.bank-details {
  background: white;
  padding: 15px;
  border: 2px solid var(--maroon-light);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.bank-details h5 {
  color: var(--maroon-primary);
  margin: 0 0 10px;
  font-size: 1em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bank-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  align-items: center;
}

.bank-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9em;
}

.bank-value {
  color: var(--text-secondary);
  font-size: 0.9em;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 768px) {
  .banking-note-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

/* Print Optimizations */
@media print {
  body {
    margin: 1cm;
    font-size: 12pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .quotation-container {
    break-inside: avoid;
  }
  
  .items-table {
    break-inside: avoid;
  }
  
  .total-section {
    break-inside: avoid;
  }
  
  .banking-note {
    break-inside: avoid;
  }
  
  .signature-section {
    break-inside: avoid;
  }
  
  /* Ensure backgrounds print */
  .items-table th {
    background: var(--maroon-primary) !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .items-table tbody tr:nth-child(even) {
    background-color: var(--bg-subtle) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

// Generate quotation number
function generateQuotationNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `COT-${year}${month}${day}-${time}`;
}

// Format date in Spanish
function formatSpanishDate(date: Date): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} de ${month} del ${year}`;
}

// Banking note content
const bankingNote = `
<div class="banking-note-container">
  <div class="notes-section">
    <h4>Nota:</h4>
    <p>• Para comenzar el diseño del proyecto se requiere un 50% del total a pagar como avance. A la entrega del documento final, se requiere el saldo pendiente.</p>
    <p>• Ni cobros ni comisiones ocultas, el cobro es por paquete, haciendo que no tomemos ninguna comisión ni agrandamos el presupuesto. La transparencia es parte crucial en este proceso.</p>
    <p>• Creamos según gusto y presupuesto, deseamos que cada diseño sea una experiencia personalizada para los clientes.</p>
  </div>
  
  <div class="bank-details">
    <h5>Detalles Bancarios</h5>
    <div class="bank-info">
      <span class="bank-label">Banco:</span>
      <span class="bank-value">Banco Popular Dominicano</span>
      <span class="bank-label">Tipo de Cuenta:</span>
      <span class="bank-value">Cuenta de Corriente</span>
      <span class="bank-label">Número:</span>
      <span class="bank-value">844163782</span>
      <span class="bank-label">Titular:</span>
      <span class="bank-value">Reyka Kawashiro</span>
      <span class="bank-label">Cédula:</span>
      <span class="bank-value">402-2781561-6</span>
    </div>
  </div>
</div>
`;

// Generate and open quotation document
export async function generateQuotationDocument(quotation: Quotation): Promise<void> {
  const quotationNumber = generateQuotationNumber();
  const formattedDate = formatSpanishDate(quotation.createdAt);

  // Generate items HTML
  let itemsHtml = '';
  quotation.items.forEach((item, index) => {
    const descriptionHtml = convertMarkdownToHtml(item.description);
    const rowClass = index % 2 === 0 ? '' : 'class="even-row"';
    
    itemsHtml += `
      <tr ${rowClass}>
        <td class="description-col">${descriptionHtml}</td>
        <td class="qty-col">1</td>
        <td class="price-col">${formatCurrency(item.amount)}</td>
        <td class="total-col">${formatCurrency(item.amount)}</td>
      </tr>
    `;
  });
  
  // Create complete HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización - ${quotation.clientName}</title>
      <style>${quotationStyles}</style>
    </head>
    <body>
      <div class="quotation-container">
        <!-- Header -->
        <div class="quotation-header">
          <div class="logo-section">
            <img src="${logoRk}" alt="RKArtSide" class="logo" />
          </div>
          <div class="header-title">
            <h1>COTIZACIÓN</h1>
          </div>
          <div class="document-info">
            <p class="quotation-number">Presupuesto No. ${quotationNumber}</p>
            <p class="quotation-date">${formattedDate}</p>
          </div>
        </div>
        
        <!-- Client Information -->
        <div class="client-section">
          <p><strong>Cliente:</strong> ${quotation.clientName}</p>
        </div>
        
        <!-- Items Table -->
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
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Total Section -->
        <div class="total-section">
          <div class="total-line">
            <span class="total-label">Subtotal:</span>
            <span class="total-amount">${formatCurrency(quotation.total)}</span>
          </div>
          <div class="total-line final-total">
            <span class="total-label">TOTAL A PAGAR:</span>
            <span class="total-amount">${formatCurrency(quotation.total)}</span>
          </div>
        </div>
        
        <!-- Banking Note -->
        <div class="banking-note">
          ${bankingNote}
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-title">Firma del Cliente</div>
          <div class="signature-client-name">${quotation.clientName}</div>
          <div class="signature-line"></div>
          <div class="signature-label">Firma y Fecha</div>
        </div>
      </div>
      
      <script>
        // Auto-print when loaded
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;
  
  // Open in new window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}