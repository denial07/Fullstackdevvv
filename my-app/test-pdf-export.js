const jsPDF = require('jspdf');
require('jspdf-autotable');

// Test PDF with color-coding
const doc = new jsPDF();

// Add title
doc.setFontSize(20);
doc.text("Test Employee Directory", 14, 22);

// Sample data with different statuses
const headers = ["Name", "Department", "Status"];
const rows = [
  ["John Doe", "Engineering", "Active"],
  ["Jane Smith", "Marketing", "Suspended"], 
  ["Bob Johnson", "Sales", "Inactive"],
  ["Alice Brown", "Engineering", "Active"]
];

// Status column index (2 in this case)
const statusColumnIndex = 2;

// Add table with color-coding
doc.autoTable({
  head: [headers],
  body: rows,
  startY: 40,
  styles: { 
    fontSize: 10,
    cellPadding: 3,
    lineColor: [0, 0, 0],
    lineWidth: 0.1
  },
  headStyles: { 
    fillColor: [66, 139, 202],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    halign: 'center'
  },
  alternateRowStyles: { fillColor: [245, 245, 245] },
  columnStyles: {
    [statusColumnIndex]: {
      fontStyle: 'bold',
      halign: 'center'
    }
  },
  didDrawCell: (data) => {
    // Color-code the status column
    if (data.column.index === statusColumnIndex && data.row.index >= 0) {
      const cellText = data.cell.text.join('').toLowerCase().trim();
      
      console.log(`🎨 Processing status: "${cellText}"`);
      
      // Clear existing styles and apply new ones
      data.cell.styles = data.cell.styles || {};
      
      if (cellText === 'active') {
        data.cell.styles.textColor = [34, 139, 34]; // Green
        data.cell.styles.fontStyle = 'bold';
        console.log('✅ Applied GREEN');
      } else if (cellText === 'inactive') {
        data.cell.styles.textColor = [105, 105, 105]; // Grey
        data.cell.styles.fontStyle = 'bold';
        console.log('⚫ Applied GREY');
      } else if (cellText === 'suspended') {
        data.cell.styles.textColor = [178, 34, 34]; // Red
        data.cell.styles.fillColor = [255, 228, 225]; // Light red background
        data.cell.styles.fontStyle = 'bold';
        console.log('🔴 Applied RED with background');
      }
    }
  }
});

// Save the PDF
doc.save('test-colored-pdf.pdf');
console.log('🎨 Test PDF generated: test-colored-pdf.pdf');
