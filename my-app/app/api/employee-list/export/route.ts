import ExcelJS from 'exceljs';
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    // You can add authentication/authorization here if needed
    const employees = await User.find({}).lean();

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Directory');

    // Define columns
    worksheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date of Joining', key: 'createdAt', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
    ];

    // Add rows
    employees.forEach(emp => {
      worksheet.addRow({
        name: emp.name || emp.fullName || '',
        department: emp.department || '',
        role: emp.role || '',
        status: emp.status || '',
        createdAt: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
        email: emp.email || '',
      });
    });

    // Format header row
    worksheet.getRow(1).font = { bold: true };

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Employee-Directory-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('❌ Excel export error:', error);
    return NextResponse.json({ error: 'Failed to export Excel' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";


// Function to load NGS logo from workspace
async function loadNGSLogo(): Promise<string | null> {
  try {
    // Try to load PNG logo first (user's preferred logo)
    const pngPath = path.join(process.cwd(), 'public', 'NGSlogo.png');
    if (fs.existsSync(pngPath)) {
      const pngBuffer = fs.readFileSync(pngPath);
      const base64PNG = pngBuffer.toString('base64');
      console.log('✅ Loaded NGS logo from my-app/public/NGSlogo.png');
      return `data:image/png;base64,${base64PNG}`;
    }
    
    console.log('⚠️ NGS logo not found, using text fallback');
    return null;
  } catch (error) {
    console.error('❌ Error loading NGS logo:', error);
    return null;
  }
}

// Extend jsPDF type to include autoTable for version 5.x
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][];
      body?: string[][];
      startY?: number;
      styles?: object;
      headStyles?: object;
      alternateRowStyles?: object;
      margin?: object;
      didDrawPage?: (data: { pageNumber: number }) => void;
      didDrawCell?: (data: { 
        column: { index: number }; 
        row: { index: number }; 
        cell: { 
          text: string[]; 
          styles: { 
            textColor?: number[]; 
            fillColor?: number[]; 
            fontStyle?: string;
            halign?: string;
          } 
        } 
      }) => void;
    }) => jsPDF;
  }
}

// Helper function to check if content fits on current page and add page break if needed
function checkPageBreak(doc: jsPDF, currentY: number, requiredHeight: number, margin: number = 20): number {
  const pageHeight = doc.internal.pageSize.height;
  const availableSpace = pageHeight - currentY - 30; // 30px footer space
  
  if (availableSpace < requiredHeight) {
    doc.addPage();
    return margin + 50; // Start position after header on new page
  }
  
  return currentY;
}

// TODO (Copilot): Use this truncate helper to prevent text overflow
// Helper function to truncate text for better fit
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// Helper function to format status with proper casing
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Helper function to add consistent page header
function addPageHeader(doc: jsPDF, title: string, subtitle: string, pageNumber: number, totalPages: number): number {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Professional header with consistent branding
  doc.setFillColor(25, 55, 109);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 22, { align: 'center' });
  
  // Subtitle with page info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let pageText = `${subtitle} | Page ${pageNumber} of ${totalPages}`;
  if (title === 'EXECUTIVE SUMMARY' && subtitle === 'Departmental Distribution') pageText = `${subtitle} | Page 3 of 11`;
  doc.text(pageText, pageWidth / 2, 35, { align: 'center' });
  
  return 65; // Return Y position after header
}

// ✨ SAFE SECTION RENDERER - Never gets cut off! ✨
interface SafeSectionOptions {
  title: string;
  sectionNumber?: number;
  description?: string;
  requiredHeight: number;
  contentRenderer: (doc: jsPDF, startX: number, startY: number, maxWidth: number, maxHeight: number) => number;
}

function renderSafeSection(
  doc: jsPDF, 
  currentY: number, 
  options: SafeSectionOptions,
  margin: number = 20
): number {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const usableWidth = pageWidth - (margin * 2);
  
  // Calculate total section height (header + content + padding)
  const headerHeight = options.title ? 55 : 0;
  const totalRequiredHeight = headerHeight + options.requiredHeight + 20; // 20px padding
  
  // Check if section fits, add page break if needed
  currentY = checkPageBreak(doc, currentY, totalRequiredHeight, margin);
  
  let workingY = currentY;
  
  // Render section header if provided
  if (options.title) {
    // Professional section header with enhanced styling
    doc.setFillColor(245, 248, 252); // Subtle blue background
    doc.rect(margin, workingY, usableWidth, 40, 'F');
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(2);
    doc.rect(margin, workingY, usableWidth, 40, 'S');
    
    // Add section number icon if provided
    if (options.sectionNumber) {
      doc.setFillColor(25, 55, 109);
      doc.circle(margin + 20, workingY + 20, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(options.sectionNumber.toString(), margin + 20, workingY + 22, { align: 'center' });
    }
    
    // Section title
    doc.setTextColor(25, 55, 109);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titleX = options.sectionNumber ? margin + 40 : margin + 10;
    doc.text(options.title, titleX, workingY + 18);
    
    // Section description if provided
    if (options.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(options.description, titleX, workingY + 32);
    }
    
    workingY += headerHeight;
  }
  
  // Calculate available space for content
  const availableHeight = pageHeight - workingY - 50; // 50px footer space
  const maxContentHeight = Math.min(options.requiredHeight, availableHeight);
  
  // Render the actual content using the provided renderer
  const contentEndY = options.contentRenderer(
    doc, 
    margin, 
    workingY, 
    usableWidth, 
    maxContentHeight
  );
  
  // Return the Y position after this section
  return Math.max(contentEndY, workingY + options.requiredHeight) + 20; // 20px spacing after section
}

// ✨ SAFE CHART RENDERER - Auto-scales charts to fit perfectly ✨
function renderSafeChart(
  doc: jsPDF,
  currentY: number,
  chartType: 'pie' | 'bar' | 'line' | 'stacked',
  data: Record<string, unknown>,
  options: {
    title: string;
    sectionNumber?: number;
    description?: string;
    preferredWidth?: number;
    preferredHeight?: number;
  },
  margin: number = 20
): number {
  const pageWidth = doc.internal.pageSize.width;
  const usableWidth = pageWidth - (margin * 2);
  
  // Auto-scale dimensions to fit page
  const maxChartWidth = Math.min(options.preferredWidth || 500, usableWidth - 40);
  const maxChartHeight = Math.min(options.preferredHeight || 120, 150);
  
  return renderSafeSection(doc, currentY, {
    title: options.title,
    sectionNumber: options.sectionNumber,
    description: options.description,
    requiredHeight: maxChartHeight + 40, // Chart + legend space
    contentRenderer: (doc, startX, startY, maxWidth) => {
      const chartX = startX + 10;
      const chartY = startY + 10;
      const chartWidth = Math.min(maxChartWidth, maxWidth - 20);
      const chartHeight = Math.min(maxChartHeight, 120);
      
      // Render chart based on type
      switch (chartType) {
        case 'pie':
          const pieRadius = Math.min(chartHeight / 3, chartWidth / 6, 40);
          const pieX = chartX + pieRadius + 20;
          const pieY = chartY + chartHeight / 2;
          const chartData = drawAccountStatusPieChart(doc, pieX, pieY, pieRadius, data as { active: number; inactive: number; suspended: number; total: number });
          
          // Auto-positioned legend
          const legendX = pieX + pieRadius + 50;
          const legendY = pieY - 30;
          if (chartData) {
            renderPieLegend(doc, legendX, legendY, chartData, data as { total: number });
          }
          break;
          
        case 'bar':
          drawDepartmentBarChart(doc, chartX, chartY, chartWidth, chartHeight, data as Record<string, number>);
          break;
          
        case 'line':
          drawMonthlyJoinersChart(doc, chartX, chartY, chartWidth, chartHeight, data as Record<string, number>);
          break;
          
        case 'stacked':
          drawStatusByDepartmentChart(doc, chartX, chartY, chartWidth, chartHeight, data as Record<string, { active: number; inactive: number; suspended: number }>);
          break;
      }
      
      return startY + maxChartHeight + 20;
    }
  }, margin);
}

// ✨ SAFE TABLE RENDERER - Auto-sizes tables for perfect fit ✨
function renderSafeTable(
  doc: jsPDF,
  currentY: number,
  headers: string[],
  rows: string[][],
  options: {
    title?: string;
    statusColumnIndex?: number;
  },
  margin: number = 20
): number {
  return renderSafeSection(doc, currentY, {
    title: options.title || '',
    requiredHeight: Math.min(rows.length * 12 + 50, 400), // Estimate table height
    contentRenderer: (doc, startX, startY, maxWidth) => {
      // Auto-size table to fit within bounds
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: startY,
        styles: { 
          fontSize: Math.min(8, maxWidth / 80), // Scale font based on width
          cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          textColor: [33, 37, 41],
          valign: 'middle',
          overflow: 'linebreak',
          cellWidth: 'wrap',
          minCellHeight: 8
        },
        headStyles: { 
          fillColor: [25, 55, 109],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: Math.min(9, maxWidth / 70),
          cellPadding: { top: 5, right: 2, bottom: 5, left: 2 },
          minCellHeight: 12
        },
        alternateRowStyles: { 
          fillColor: [248, 249, 250]
        },
        columnStyles: (() => {
          const styles: Record<number, object> = {};
          
          // Status column styling
          if (options.statusColumnIndex !== undefined && options.statusColumnIndex >= 0) {
            styles[options.statusColumnIndex] = {
              fontStyle: 'bold',
              halign: 'center',
              cellWidth: Math.max(18, maxWidth / 20),
              minCellWidth: 15
            };
          }
          
          // Auto-size other columns
          headers.forEach((header, index) => {
            if (index !== options.statusColumnIndex) {
              styles[index] = {
                cellWidth: 'auto',
                minCellWidth: Math.max(20, maxWidth / headers.length / 2)
              };
            }
          });
          
          return styles;
        })(),
        margin: { left: startX, right: doc.internal.pageSize.width - startX - maxWidth },
        theme: 'grid',
        tableWidth: maxWidth - 20,
        willDrawCell: function(data) {
          // Color status cells based on value
          if (data.column.index === options.statusColumnIndex && data.cell.section === 'body') {
            const status = data.cell.text[0]?.toLowerCase();
            if (status) {
              if (status === 'active') {
                data.cell.styles.fillColor = [220, 252, 231]; // Light green
                data.cell.styles.textColor = [5, 150, 105]; // Dark green
              } else if (status === 'inactive') {
                data.cell.styles.fillColor = [255, 243, 224]; // Light orange
                data.cell.styles.textColor = [234, 88, 12]; // Orange
              } else if (status === 'suspended') {
                data.cell.styles.fillColor = [254, 226, 226]; // Light red
                data.cell.styles.textColor = [220, 38, 38]; // Red
              }
            }
          }
        }
      });
      
      // Return final Y position
      return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || (startY + 100);
    }
  }, margin);
}

// Helper function to render pie chart legend
function renderPieLegend(
  doc: jsPDF, 
  startX: number, 
  startY: number, 
  chartData: { color: number[]; label: string; value: number }[] | undefined, 
  stats: { total: number }
) {
  if (!chartData) return;
  
  // Legend container background
  doc.setFillColor(250, 251, 252);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(1);
  doc.rect(startX - 5, startY - 10, 90, chartData.length * 25 + 35, 'FD');
  
  // Legend header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('STATUS BREAKDOWN', startX, startY);
  
  let legendY = startY + 20;
  
  chartData.forEach((item) => {
    // Professional legend items with enhanced boxes
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(startX, legendY - 5, 14, 10, 'F');
    doc.setDrawColor(75, 85, 99);
    doc.setLineWidth(0.5);
    doc.rect(startX, legendY - 5, 14, 10, 'S');
    
    // Status label with enhanced typography
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    const percentage = ((item.value / stats.total) * 100).toFixed(1);
    doc.text(`${item.label}:`, startX + 22, legendY);
    
    // Count and percentage with professional styling
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`${item.value} employees (${percentage}%)`, startX + 22, legendY + 10);
    
    legendY += 22;
  });
}

// Function to draw a pie chart for account status breakdown
function drawAccountStatusPieChart(
  doc: jsPDF, 
  centerX: number, 
  centerY: number, 
  radius: number, 
  stats: { active: number; inactive: number; suspended: number; total: number }
) {
  // Data for the pie chart
  const data = [
    { label: 'Active', value: stats.active, color: [34, 139, 34] },     // Green
    { label: 'Inactive', value: stats.inactive, color: [105, 105, 105] }, // Grey
    { label: 'Suspended', value: stats.suspended, color: [178, 34, 34] }   // Red
  ].filter(item => item.value > 0); // Only include non-zero values

  if (data.length === 0) return;

  let currentAngle = -Math.PI / 2; // Start at top

  // Draw each slice
  data.forEach((item) => {
    const sliceAngle = (item.value / stats.total) * 2 * Math.PI;
    
    // Set fill color
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    
    // Create points for the slice
    const points: [number, number][] = [[centerX, centerY]]; // Start at center
    
    // Add points along the arc
    const numPoints = Math.max(5, Math.floor(sliceAngle * 10));
    for (let i = 0; i <= numPoints; i++) {
      const angle = currentAngle + (sliceAngle * i) / numPoints;
      const pointX = centerX + radius * Math.cos(angle);
      const pointY = centerY + radius * Math.sin(angle);
      points.push([pointX, pointY]);
    }
    
    // Draw the slice using triangle method
    for (let i = 1; i < points.length - 1; i++) {
      const triangle = [points[0], points[i], points[i + 1]];
      
      // Draw triangle manually using lines
      doc.moveTo(triangle[0][0], triangle[0][1]);
      doc.lineTo(triangle[1][0], triangle[1][1]);
      doc.lineTo(triangle[2][0], triangle[2][1]);
      doc.lineTo(triangle[0][0], triangle[0][1]);
      doc.fill();
    }
    
    currentAngle += sliceAngle;
  });
  
  // Draw outer circle border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(1);
  doc.circle(centerX, centerY, radius, 'S');
  
  // Add center text showing total
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(stats.total.toString(), centerX, centerY - 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total', centerX, centerY + 8, { align: 'center' });
  
  return data; // Return data for legend
}

// Function to draw a bar chart for employees by department
function drawDepartmentBarChart(
  doc: jsPDF,
  startX: number,
  startY: number,
  width: number,
  height: number,
  departmentData: Record<string, number>
) {
  // TODO (Copilot): Wrap or truncate text so it never overflows table/cell width
  // - Use truncate(text, maxLength) helper for labels
  // - For emails, max length = 20 chars + "..." suffix
  // - For department names in charts, max length = 6 chars
  
  const departments = Object.keys(departmentData);
  const values = Object.values(departmentData);
  const maxValue = Math.max(...values);
  
  if (departments.length === 0) return;
  
  // Draw professional chart frame with shadow effect
  doc.setFillColor(245, 245, 245);
  doc.rect(startX + 2, startY + 2, width, height, 'F'); // Shadow
  doc.setFillColor(255, 255, 255);
  doc.rect(startX, startY, width, height, 'F'); // Background
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(startX, startY, width, height, 'S'); // Border
  
  // Calculate bar dimensions with minimum width constraints for A4 fit
  const barWidth = Math.max((width - 20) / departments.length, 15); // Minimum 15px bar width
  const chartHeight = height - 40;
  
  // Draw bars
  departments.forEach((dept, index) => {
    const value = departmentData[dept];
    const barHeight = (value / maxValue) * chartHeight;
    const barX = startX + 10 + (index * barWidth);
    const barY = startY + height - 20 - barHeight;
    
    // Bar shadow
    doc.setFillColor(200, 200, 200);
    doc.rect(barX + 3, barY + 1, barWidth - 4, barHeight, 'F');
    
    // Main bar with professional blue
    doc.setFillColor(59, 130, 246); // Professional blue
    doc.rect(barX + 2, barY, barWidth - 4, barHeight, 'F');
    
    // Bar top highlight
    doc.setFillColor(96, 165, 250); // Lighter blue for highlight
    doc.rect(barX + 2, barY, barWidth - 4, Math.min(barHeight, 4), 'F');
    
    // Bar border
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.rect(barX + 2, barY, barWidth - 4, barHeight, 'S');
    
    // Add value label on top of bar - optimized for smaller charts
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Slightly smaller font
    doc.text(value.toString(), barX + barWidth / 2, barY - 5, { align: 'center' });
    
    // Add department label at bottom - optimized for narrow bars
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Smaller font for better fit
    const maxLabelLength = Math.max(4, Math.floor(barWidth / 4)); // Dynamic label length based on bar width
    const deptLabel = dept.length > maxLabelLength ? dept.substring(0, maxLabelLength) + '...' : dept;
    doc.text(deptLabel, barX + barWidth / 2, startY + height - 5, { align: 'center' });
  });
  
  // Add professional Y-axis labels and grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  
  for (let i = 0; i <= 5; i++) {
    const yValue = Math.round((maxValue / 5) * i);
    const yPos = startY + height - 20 - (i * chartHeight / 5);
    
    // Y-axis label
    doc.text(yValue.toString(), startX - 8, yPos + 2, { align: 'right' });
    
    // Professional grid lines
    if (i > 0) { // Skip bottom line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(startX + 1, yPos, startX + width - 1, yPos);
    }
  }
  
  // Add chart title and subtitle
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('', startX - 8, startY - 10, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Department', startX + width / 2, startY + height + 15, { align: 'center' });
}

// Function to draw a line chart for new joiners by month
function drawMonthlyJoinersChart(
  doc: jsPDF,
  startX: number,
  startY: number,
  width: number,
  height: number,
  monthlyData: Record<string, number>
) {
  const months = Object.keys(monthlyData).sort();
  const values = months.map(month => monthlyData[month]);
  const maxValue = Math.max(...values, 1);
  
  if (months.length === 0) return;
  
  // Draw chart frame
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(1);
  doc.rect(startX, startY, width, height);
  
  const chartWidth = width - 20;
  const chartHeight = height - 40;
  const pointSpacing = chartWidth / Math.max(months.length - 1, 1);
  
  // Calculate points
  const points = months.map((month, index) => {
    const x = startX + 10 + (index * pointSpacing);
    const y = startY + height - 20 - ((values[index] / maxValue) * chartHeight);
    return { x, y, value: values[index] };
  });
  
  // Draw line and points
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(2);
  
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
  
  // Draw points and values
  points.forEach((point, index) => {
    // Draw point
    doc.setFillColor(220, 53, 69);
    doc.circle(point.x, point.y, 2, 'F');
    
    // Add value label
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(point.value.toString(), point.x, point.y - 8, { align: 'center' });
    
    // Add month label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const monthLabel = months[index].substring(0, 3);
    doc.text(monthLabel, point.x, startY + height - 5, { align: 'center' });
  });
  
  // Add Y-axis labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let i = 0; i <= 4; i++) {
    const yValue = Math.round((maxValue / 4) * i);
    const yPos = startY + height - 20 - (i * chartHeight / 4);
    doc.text(yValue.toString(), startX - 5, yPos + 2, { align: 'right' });
  }
}

// Function to draw stacked bar chart for status by department
function drawStatusByDepartmentChart(
  doc: jsPDF,
  startX: number,
  startY: number,
  width: number,
  height: number,
  departmentStatusData: Record<string, { active: number; inactive: number; suspended: number }>
) {
  const departments = Object.keys(departmentStatusData);
  if (departments.length === 0) return;
  
  // Calculate max total for scaling
  const maxTotal = Math.max(...departments.map(dept => {
    const data = departmentStatusData[dept];
    return data.active + data.inactive + data.suspended;
  }));
  
  // Draw chart frame
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(1);
  doc.rect(startX, startY, width, height);
  
  // Calculate bar dimensions with minimum width constraints for A4 fit
  const barWidth = Math.max((width - 20) / departments.length, 15); // Minimum 15px bar width
  const chartHeight = height - 40;
  
  // Draw stacked bars
  departments.forEach((dept, index) => {
    const data = departmentStatusData[dept];
    const total = data.active + data.inactive + data.suspended;
    const barX = startX + 10 + (index * barWidth);
    const barY = startY + height - 20;
    
    let currentY = barY;
    
    // Draw suspended (bottom, red)
    if (data.suspended > 0) {
      const segmentHeight = (data.suspended / maxTotal) * chartHeight;
      doc.setFillColor(178, 34, 34);
      doc.rect(barX + 2, currentY - segmentHeight, barWidth - 4, segmentHeight, 'F');
      currentY -= segmentHeight;
    }
    
    // Draw inactive (middle, grey)
    if (data.inactive > 0) {
      const segmentHeight = (data.inactive / maxTotal) * chartHeight;
      doc.setFillColor(105, 105, 105);
      doc.rect(barX + 2, currentY - segmentHeight, barWidth - 4, segmentHeight, 'F');
      currentY -= segmentHeight;
    }
    
    // Draw active (top, green)
    if (data.active > 0) {
      const segmentHeight = (data.active / maxTotal) * chartHeight;
      doc.setFillColor(34, 139, 34);
      doc.rect(barX + 2, currentY - segmentHeight, barWidth - 4, segmentHeight, 'F');
    }
    
    // Add total label on top
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(total.toString(), barX + barWidth / 2, barY - (total / maxTotal) * chartHeight - 5, { align: 'center' });
    
    // Add department label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const deptLabel = dept.length > 6 ? dept.substring(0, 6) + '...' : dept;
    doc.text(deptLabel, barX + barWidth / 2, startY + height - 5, { align: 'center' });
  });
}

export async function POST(request: NextRequest) {
  try {
    // TODO (Copilot): Clean up PDF layout so nothing gets cut off or squeezed
    // 1. Use margin = 20, calculate usableWidth/usableHeight from page size
    // 2. For each chart, check available height with checkPageBreak and move to new page if needed
    // 3. Scale charts to max usableWidth and max usableHeight/2
    // 4. For tables, use autoTable with tableWidth: 'wrap' or usableWidth
    // 5. Reduce font size to 8-9 for dense tables, and set columnStyles to keep Email ≤ 60px
    // 6. Truncate long labels in charts (>6 chars) and emails (>20 chars) with "..."
    // 7. Add page breaks: Page 1 = Summary, Page 2 = Charts, Page 3+ = Directory
    // 8. Ensure autoTable rows split across pages automatically (no cut-off rows)

    // Check authentication
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode the session token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired (24 hours)
    if (Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }

    const { filters, includeFields } = await request.json();
    
    console.log('📋 PDF Export - Include Fields:', includeFields);
    console.log('📋 PDF Export - Filters:', filters);
    console.log('🔄 Full name fix applied - generating names from emails if needed');
    
    await connectToDatabase();

    // Get the current user to check their role and department
    const currentUser = await User.findById(decoded.userId).select("role department");
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to export employee directory
    if (!['Administrator', 'Manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only administrators and managers can export employee directory." },
        { status: 403 }
      );
    }

    // Build query based on filters
    const query: Record<string, unknown> = {};
    
    // Managers can only export employees from their own department
    if (currentUser.role === 'Manager') {
      query.department = currentUser.department;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.department && currentUser.role === 'Administrator') {
      query.department = filters.department;
    }

    if (filters.status) {
      if (filters.status === "active") {
        query.status = "active";
      } else if (filters.status === "inactive") {
        query.status = { $in: ["suspended", "inactive"] };
      }
    }

    if (filters.role) {
      query.role = filters.role;
    }

    // Build sort criteria based on dateSort parameter
    let sortCriteria: Record<string, 1 | -1> = {};
    if (filters.dateSort === "earliest") {
      sortCriteria = { createdAt: 1 };
    } else if (filters.dateSort === "latest") {
      sortCriteria = { createdAt: -1 };
    } else {
      sortCriteria = { createdAt: -1 };
    }

    // Fetch all matching employees
    const employees = await User.find(query).sort(sortCriteria).lean();

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "No employees found matching the criteria" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = {
      total: employees.length,
      active: employees.filter(emp => emp.status === 'active').length,
      inactive: employees.filter(emp => emp.status === 'inactive').length,
      suspended: employees.filter(emp => emp.status === 'suspended').length,
      departments: [...new Set(employees.map(emp => emp.department))].length,
      departmentBreakdown: {} as Record<string, number>
    };

    // Calculate department breakdown
    employees.forEach(emp => {
      const dept = emp.department as string;
      stats.departmentBreakdown[dept] = (stats.departmentBreakdown[dept] || 0) + 1;
    });

    // Create PDF with professional corporate report styling
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // TODO (Copilot): Always calculate usable page width and height
    // - Set margin = 20
    // - usableWidth = doc.internal.pageSize.width - (margin * 2)
    // - usableHeight = doc.internal.pageSize.height - (margin * 2)
    // Use usableWidth/usableHeight instead of hard-coded values
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);
    
    // Export date for use throughout the document
    const exportDate = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // ===== PROFESSIONAL COVER PAGE =====
    // Corporate header with gradient-like effect
    doc.setFillColor(25, 55, 109); // Professional dark blue
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // Add subtle secondary color band
    doc.setFillColor(66, 139, 202); // Lighter blue accent
    doc.rect(0, 80, pageWidth, 8, 'F');
    
  // ...logo section removed...
    
    // Main title with professional typography
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE DIRECTORY', pageWidth / 2, 35, { align: 'center' });
    
    // Subtitle with elegant spacing
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPREHENSIVE BUSINESS REPORT', pageWidth / 2, 55, { align: 'center' });
    
    // Document metadata section
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 250, 252); // Light background
    doc.rect(margin, 100, pageWidth - (2 * margin), 100, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, 100, pageWidth - (2 * margin), 100, 'S');
    
    // Document info with professional layout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DOCUMENT INFORMATION', pageWidth / 2, 120, { align: 'center' });

      // Create two-column layout for metadata
      const leftCol = margin + 10;
      const rightCol = pageWidth / 2 + 10;
      let metaY = 140;

      // Left column
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Report Date:', leftCol, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(exportDate, leftCol + 35, metaY);

      metaY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Generated By:', leftCol, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${currentUser.role}`, leftCol + 35, metaY);

      metaY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Records:', leftCol, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${stats.total} Employees`, leftCol + 35, metaY);

      // Right column
      metaY = 140;
      doc.setFont('helvetica', 'bold');
      doc.text('Report Type:', rightCol, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text('Executive Analytics', rightCol + 35, metaY);

      metaY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Departments:', rightCol, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${stats.departments} Active`, rightCol + 35, metaY);

      metaY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Scope:', rightCol, metaY);
      doc.setFont('helvetica', 'normal');
      if (currentUser.role === 'Manager') {
        doc.text(`${currentUser.department} Dept.`, rightCol + 35, metaY);
      } else {
        doc.text('Organization-wide', rightCol + 35, metaY);
      }
    
    // Add confidentiality notice
    doc.setFillColor(255, 243, 205); // Light yellow
    doc.rect(margin, 210, pageWidth - (2 * margin), 60, 'F');
    doc.setDrawColor(255, 193, 7);
    doc.rect(margin, 210, pageWidth - (2 * margin), 60, 'S');

    // Multi-line confidential info
    const confY = 220;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(133, 77, 14); // Dark yellow
    doc.text('CONFIDENTIAL', pageWidth / 2, confY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 60, 20);
    doc.text('This report contains proprietary and confidential information intended only for internal use by NGS.', pageWidth / 2, confY + 12, { align: 'center', maxWidth: pageWidth - (2 * margin) - 10 });
    doc.text('Unauthorized copying, disclosure, or distribution is strictly prohibited.', pageWidth / 2, confY + 22, { align: 'center', maxWidth: pageWidth - (2 * margin) - 10 });
    doc.text('Access is restricted to authorized personnel only.', pageWidth / 2, confY + 32, { align: 'center', maxWidth: pageWidth - (2 * margin) - 10 });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 40);
    doc.text('Version: 1.0 | Date: 18 Aug 2025', pageWidth / 2, confY + 44, { align: 'center' });
    doc.setFontSize(9);
    doc.text('This report contains sensitive employee information. Handle according to company data policy.', pageWidth / 2, 255, { align: 'center' });
    
    // Page footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // ===== PAGE 2: EXECUTIVE SUMMARY =====
    doc.addPage();
    
    // Use helper function for consistent header
    let yPos = addPageHeader(doc, 'EXECUTIVE SUMMARY', 'Overview & Key Metrics', 2, 6);
    
    // Summary stats with professional cards
    doc.setTextColor(0, 0, 0);
    
    // Check if metrics cards section fits, if not start new page
    yPos = checkPageBreak(doc, yPos, 150, margin);
    
    // Key Metrics Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KEY WORKFORCE METRICS', margin, yPos);
    
  yPos += 5; // Shift boxes up by another 10px (total 20px)
    
    // Create metric cards with borders and backgrounds
    const cardHeight = 50;
    const cardWidth = (pageWidth - (3 * margin)) / 2;
    
  // Card 1: Total Employees
  doc.setFillColor(240, 248, 255); // Light blue
  doc.rect(margin, yPos + 3, cardWidth, cardHeight, 'F');
  doc.setDrawColor(66, 139, 202);
  doc.setLineWidth(1);
  doc.rect(margin, yPos + 3, cardWidth, cardHeight, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(25, 55, 109);
  doc.text(stats.total.toString(), margin + 15, yPos + 23);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Total Employees', margin + 15, yPos + 38);

  // Card 2: Active Rate
  const summaryActiveRate = ((stats.active / stats.total) * 100).toFixed(1);
  doc.setFillColor(240, 255, 240); // Light green
  doc.rect(margin + cardWidth + 10, yPos + 3, cardWidth, cardHeight, 'F');
  doc.setDrawColor(40, 167, 69);
  doc.rect(margin + cardWidth + 10, yPos + 3, cardWidth, cardHeight, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(34, 139, 34);
  doc.text(`${summaryActiveRate}%`, margin + cardWidth + 25, yPos + 23);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Active Account Rate', margin + cardWidth + 25, yPos + 38);
    
    yPos += 70;
    
    // Check if breakdown section fits
    yPos = checkPageBreak(doc, yPos, 120, margin);
    
    // Detailed breakdown with professional styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ACCOUNT STATUS BREAKDOWN', margin, yPos + 10);
    
    yPos += 20;
    
    // Create a table-like structure for status breakdown
    doc.setFillColor(248, 249, 250); // Very light gray
    doc.rect(margin, yPos, pageWidth - (2 * margin), 80, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 80, 'S');
    
    // Table headers
    const colWidth = (pageWidth - (2 * margin)) / 4;
    doc.setFillColor(25, 55, 109);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('STATUS', margin + 10, yPos + 13);
    doc.text('COUNT', margin + colWidth + 10, yPos + 13);
    doc.text('PERCENTAGE', margin + (2 * colWidth) + 10, yPos + 13);
    doc.text('SECURITY LEVEL', margin + (3 * colWidth) + 10, yPos + 13);
    
    // Table rows
    yPos += 20;
    
    // Active row
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Active status indicator
  doc.setFillColor(34, 139, 34);
  doc.circle(margin + 5, yPos + 12, 3, 'F');
    doc.text('Active', margin + 15, yPos + 13);
    doc.text(stats.active.toString(), margin + colWidth + 10, yPos + 13);
    doc.text(`${((stats.active / stats.total) * 100).toFixed(1)}%`, margin + (2 * colWidth) + 10, yPos + 13);
    doc.setTextColor(34, 139, 34);
    doc.text('Secure', margin + (3 * colWidth) + 10, yPos + 13);
    
    yPos += 15;
    
    // Inactive row
    doc.setTextColor(0, 0, 0);
  doc.setFillColor(105, 105, 105);
  doc.circle(margin + 5, yPos + 12, 3, 'F');
    doc.text('Inactive', margin + 15, yPos + 13);
    doc.text(stats.inactive.toString(), margin + colWidth + 10, yPos + 13);
    doc.text(`${((stats.inactive / stats.total) * 100).toFixed(1)}%`, margin + (2 * colWidth) + 10, yPos + 13);
    doc.setTextColor(255, 140, 0);
    doc.text('Review Required', margin + (3 * colWidth) + 10, yPos + 13);
    
    yPos += 15;
    
    // Suspended row
    doc.setTextColor(0, 0, 0);
  doc.setFillColor(178, 34, 34);
  doc.circle(margin + 5, yPos + 12, 3, 'F');
    doc.text('Suspended', margin + 15, yPos + 13);
    doc.text(stats.suspended.toString(), margin + colWidth + 10, yPos + 13);
    doc.text(`${((stats.suspended / stats.total) * 100).toFixed(1)}%`, margin + (2 * colWidth) + 10, yPos + 13);
    doc.setTextColor(178, 34, 34);
    doc.text('Critical Action', margin + (3 * colWidth) + 10, yPos + 13);
    
    yPos += 40;
  doc.setFillColor(34, 139, 34); // Active green
  doc.rect(20, yPos - 3, 10, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.text(`Active: ${stats.active}`, 35, yPos + 2);

  yPos += 15;
  doc.setFillColor(105, 105, 105); // Inactive grey
  doc.rect(20, yPos - 3, 10, 8, 'F');
  doc.text(`Inactive: ${stats.inactive}`, 35, yPos + 2);

  yPos += 15;
  doc.setFillColor(178, 34, 34); // Suspended red
  doc.rect(20, yPos - 3, 10, 8, 'F');
  doc.text(`Suspended: ${stats.suspended}`, 35, yPos + 2);

  yPos += 15;
    
    // Check if department breakdown section fits
    const deptEntries = Object.entries(stats.departmentBreakdown);
    const deptTableHeight = Math.min(deptEntries.length * 20 + 25, 120) + 80; // Include header and insights
    yPos = checkPageBreak(doc, yPos, deptTableHeight, margin);
    
    // Department breakdown with professional table format
  // Full header for department distribution page
  yPos = addPageHeader(doc, 'EXECUTIVE SUMMARY', 'Departmental Distribution', 2, 11);
    
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('DEPARTMENT DISTRIBUTION', margin, yPos);
  yPos += 10;
    
    // Create professional table for departments
    if (deptEntries.length > 0) {
      doc.setFillColor(248, 249, 250);
      const tableHeight = Math.min(deptEntries.length * 20 + 25, 120);
      doc.rect(margin, yPos, pageWidth - (2 * margin), tableHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, pageWidth - (2 * margin), tableHeight, 'S');
      
      // Table header
      doc.setFillColor(25, 55, 109);
      doc.rect(margin, yPos, pageWidth - (2 * margin), 20, 'F');
      
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  // Columns spaced 10px apart
  const col1X = margin + 10;
  const col2X = col1X + 80;
  const col3X = col2X + 50;
  doc.text('DEPARTMENT', col1X, yPos + 13);
  doc.text('EMPLOYEES', col2X, yPos + 13);
  doc.text('% OF TOTAL', col3X, yPos + 13);
      
      // Department rows
      yPos += 20;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      deptEntries.forEach(([dept, count], index) => {
        // Alternate row colors
        if (index % 2 === 1) {
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPos, pageWidth - (2 * margin), 15, 'F');
        }
        
  const percentage = ((count / stats.total) * 100).toFixed(1);
  // Columns spaced 10px apart
  doc.text(dept, col1X, yPos + 10);
  doc.text(count.toString(), col2X, yPos + 10);
  doc.text(`${percentage}%`, col3X, yPos + 10);
        
        yPos += 15;
      });
    }
    
    // Add executive insights section
    yPos += 30;
    doc.setFillColor(245, 248, 250);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 60, 'F');
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 60, 'S');
    
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(25, 55, 109);
    doc.text('EXECUTIVE INSIGHTS', margin + 10, yPos);
    
    yPos += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Dynamic insights based on data
    const summaryActivePercentage = ((stats.active / stats.total) * 100).toFixed(1);
    if (parseFloat(summaryActivePercentage) >= 90) {
      doc.setTextColor(34, 139, 34);
      doc.text(`Excellent workforce health: ${summaryActivePercentage}% active accounts indicate strong engagement`, margin + 10, yPos);
    } else if (parseFloat(summaryActivePercentage) >= 80) {
      doc.setTextColor(255, 140, 0);
      doc.text(`Good workforce health: ${summaryActivePercentage}% active - monitor inactive accounts`, margin + 10, yPos);
    } else {
      doc.setTextColor(178, 34, 34);
      doc.text(`Attention required: ${summaryActivePercentage}% active - review account management policies`, margin + 10, yPos);
    }
    
    yPos += 12;
    doc.setTextColor(0, 0, 0);
    const largestDept = deptEntries.sort((a, b) => b[1] - a[1])[0];
    doc.text(`• Largest department: ${largestDept[0]} (${largestDept[1]} employees, ${((largestDept[1]/stats.total)*100).toFixed(1)}%)`, margin + 10, yPos);

    // ===== COMPREHENSIVE CHARTS & ANALYTICS SECTION =====
    // Calculate additional data needed for comprehensive analytics

    // Calculate monthly joiners data (simulate from createdAt dates)
    const monthlyJoiners: Record<string, number> = {};
    const departmentStatusData: Record<string, { active: number; inactive: number; suspended: number }> = {};
    
    employees.forEach(emp => {
      // Process monthly joiners
      if (emp.createdAt) {
        const joinDate = new Date(emp.createdAt as Date);
        const monthKey = joinDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyJoiners[monthKey] = (monthlyJoiners[monthKey] || 0) + 1;
      }
      
      // Process department status breakdown
      const dept = emp.department as string;
      if (!departmentStatusData[dept]) {
        departmentStatusData[dept] = { active: 0, inactive: 0, suspended: 0 };
      }
      const status = emp.status as string;
      if (status === 'active') departmentStatusData[dept].active++;
      else if (status === 'inactive') departmentStatusData[dept].inactive++;
      else if (status === 'suspended') departmentStatusData[dept].suspended++;
    });

    // Calculate new joiners in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentJoiners = employees.filter(emp => 
      emp.createdAt && new Date(emp.createdAt as Date) >= thirtyDaysAgo
    ).length;

  // Always start dashboard section on new page
  doc.addPage();

  // Use helper function for consistent header
  yPos = addPageHeader(doc, 'BUSINESS INTELLIGENCE DASHBOARD', 'Executive KPIs & Visual Analytics', 3, 6);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // ===== EXECUTIVE KPIs SECTION =====
    // Check if KPIs section fits
    yPos = checkPageBreak(doc, yPos, 150, margin);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(25, 55, 109);
    doc.text('KEY PERFORMANCE INDICATORS', pageWidth / 2, yPos, { align: 'center' });
    
    // Add description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Real-time workforce metrics for strategic decision making', pageWidth / 2, yPos + 15, { align: 'center' });
    
    yPos += 35;
    
    // Enhanced KPI Cards Layout with professional styling
    const kpiCardWidth = (pageWidth - 80) / 4;
    const kpiCardHeight = 70;
    let cardX = 25;
    
    // Card 1: Total Employees with enhanced design
    doc.setFillColor(245, 248, 255);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'F');
    doc.setDrawColor(52, 144, 220);
    doc.setLineWidth(2);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'S');
    
    // Icon area
    doc.setFillColor(52, 144, 220);
    doc.rect(cardX + 5, yPos + 5, 25, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('', cardX + 17, yPos + 18, { align: 'center' });
    
    // Value
    doc.setTextColor(52, 144, 220);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(stats.total.toString(), cardX + kpiCardWidth/2, yPos + 35, { align: 'center' });
    
    // Label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL EMPLOYEES', cardX + kpiCardWidth/2, yPos + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Workforce Size', cardX + kpiCardWidth/2, yPos + 62, { align: 'center' });
    
    // Card 2: Active Accounts
    cardX += kpiCardWidth + 15;
    doc.setFillColor(240, 255, 244);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'F');
    doc.setDrawColor(40, 167, 69);
    doc.setLineWidth(2);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'S');
    
    // Icon area
    doc.setFillColor(40, 167, 69);
    doc.rect(cardX + 5, yPos + 5, 25, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('', cardX + 17, yPos + 18, { align: 'center' });
    
    // Value
    doc.setTextColor(40, 167, 69);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(stats.active.toString(), cardX + kpiCardWidth/2, yPos + 35, { align: 'center' });
    
    // Label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVE ACCOUNTS', cardX + kpiCardWidth/2, yPos + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const executiveActiveRate = ((stats.active / stats.total) * 100).toFixed(1);
    doc.text(`${executiveActiveRate}% Active Rate`, cardX + kpiCardWidth/2, yPos + 62, { align: 'center' });
    
    // Card 3: Risk Accounts (Inactive + Suspended)
    cardX += kpiCardWidth + 15;
    const riskAccounts = stats.inactive + stats.suspended;
    doc.setFillColor(255, 243, 243);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'F');
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(2);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'S');
    
    // Icon area
    doc.setFillColor(220, 53, 69);
    doc.rect(cardX + 5, yPos + 5, 25, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('', cardX + 17, yPos + 18, { align: 'center' });
    
    // Value
    doc.setTextColor(220, 53, 69);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(riskAccounts.toString(), cardX + kpiCardWidth/2, yPos + 35, { align: 'center' });
    
    // Label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RISK ACCOUNTS', cardX + kpiCardWidth/2, yPos + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Requires Attention', cardX + kpiCardWidth/2, yPos + 62, { align: 'center' });
    
    // Card 4: New Joiners (Last 30 Days)
    cardX += kpiCardWidth + 15;
    doc.setFillColor(248, 243, 255);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'F');
    doc.setDrawColor(111, 66, 193);
    doc.setLineWidth(2);
    doc.rect(cardX, yPos, kpiCardWidth, kpiCardHeight, 'S');
    
    // Icon area
    doc.setFillColor(111, 66, 193);
    doc.rect(cardX + 5, yPos + 5, 25, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('', cardX + 17, yPos + 18, { align: 'center' });
    
    // Value
    doc.setTextColor(111, 66, 193);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(recentJoiners.toString(), cardX + kpiCardWidth/2, yPos + 35, { align: 'center' });
    
    // Label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NEW JOINERS', cardX + kpiCardWidth/2, yPos + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Last 30 Days', cardX + kpiCardWidth/2, yPos + 62, { align: 'center' });
    
    yPos += 100;
    
    // ===== 1. ACCOUNT STATUS BREAKDOWN (PIE CHART) =====
  // Check if pie chart section fits (header + chart + legend = ~150px)
  yPos = checkPageBreak(doc, yPos, 150, margin);

  // Add header for ACCOUNT STATUS DISTRIBUTION ANALYSIS page only
  yPos = addPageHeader(doc, 'BUSINESS INTELLIGENCE DASHBOARD', 'Executive KPIs & Visual Analytics', 3, 6);

  // Professional section header with enhanced styling
  doc.setFillColor(245, 248, 252); // Subtle blue background
  doc.rect(margin, yPos, pageWidth - (2 * margin), 40, 'F');
  doc.setDrawColor(25, 55, 109);
  doc.setLineWidth(2);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 40, 'S');

  // Add icon area
  doc.setFillColor(25, 55, 109);
  doc.circle(margin + 20, yPos + 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1', margin + 20, yPos + 22, { align: 'center' });

  // Section title
  doc.setTextColor(25, 55, 109);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ACCOUNT STATUS DISTRIBUTION ANALYSIS', margin + 40, yPos + 18);

  // Section description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Visual overview of employee account health - Critical for security risk management', margin + 40, yPos + 32);

  yPos += 55; // Adjusted for new header height
    
    // Draw pie chart with professional styling - optimized for A4 width
    const pieChartX = pageWidth / 2 - 50;
    const pieChartY = yPos + 35;
    const pieRadius = 30; // Reduced radius to fit better
    
    doc.setTextColor(0, 0, 0);
    const chartData = drawAccountStatusPieChart(doc, pieChartX, pieChartY, pieRadius, stats);
    
    // Enhanced legend with professional styling - positioned closer for A4 fit
    const legendStartX = pieChartX + pieRadius + 20;
    let legendStartY = pieChartY - 25;
    
    // Legend container background
    doc.setFillColor(250, 251, 252);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.rect(legendStartX - 5, legendStartY - 10, 90, chartData ? chartData.length * 25 + 35 : 50, 'FD');
    
    // Legend header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text('STATUS BREAKDOWN', legendStartX, legendStartY);
    
    legendStartY += 20;
    
    if (chartData) {
      chartData.forEach((item) => {
        // Professional legend items with enhanced boxes
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(legendStartX, legendStartY - 5, 14, 10, 'F');
        doc.setDrawColor(75, 85, 99);
        doc.setLineWidth(0.5);
        doc.rect(legendStartX, legendStartY - 5, 14, 10, 'S');
        
        // Status label with enhanced typography
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);
        const percentage = ((item.value / stats.total) * 100).toFixed(1);
        doc.text(`${item.label}:`, legendStartX + 22, legendStartY);
        
        // Count and percentage with professional styling
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.text(`${item.value} employees (${percentage}%)`, legendStartX + 22, legendStartY + 10);
        
        legendStartY += 22;
      });
    }

    // ===== PAGE 4: DEPARTMENT ANALYTICS =====
    doc.addPage();
    
    // Use helper function for consistent header
    yPos = addPageHeader(doc, 'DEPARTMENT ANALYTICS', 'Team Distribution & Performance Analysis', 4, 6);
    
    doc.setTextColor(0, 0, 0);
    
    // ===== 2. EMPLOYEES BY DEPARTMENT (BAR CHART) =====
    // Check if bar chart section fits
    yPos = checkPageBreak(doc, yPos, 200, margin);
    
    // Professional section header for department chart
    doc.setFillColor(245, 248, 252);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 40, 'F');
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(2);
    doc.rect(margin, yPos, pageWidth - (2 * margin), 40, 'S');
    
    // Add icon area
    doc.setFillColor(25, 55, 109);
    doc.circle(margin + 20, yPos + 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2', margin + 20, yPos + 22, { align: 'center' });
    
    // Section title
    doc.setTextColor(25, 55, 109);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EMPLOYEES BY DEPARTMENT', margin + 40, yPos + 18);
    
    // Section description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Visual snapshot of department sizes - Comparison of team sizes and workloads', margin + 40, yPos + 32);
    
    yPos += 55;
    
    // Draw department bar chart - optimized for A4 width (max 500px)
    const chartWidth = Math.min(pageWidth - 60, 500); // Max 500px width
    drawDepartmentBarChart(doc, 30, yPos, chartWidth, 100, stats.departmentBreakdown);
    
    yPos += 140;
    
    // ===== 4. STATUS BY DEPARTMENT (STACKED BAR CHART) =====
  // Check if stacked chart section fits
  yPos = checkPageBreak(doc, yPos, 220, margin);

  // Add header for 4. Status by Department (Advanced) page only
  yPos = addPageHeader(doc, 'DEPARTMENT ANALYTICS', 'Status by Department (Advanced)', 4, 6);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('4. Status by Department (Advanced)', 30, yPos);
    
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Shows active/inactive/suspended breakdown by department - Spot departmental issues', 30, yPos);
    
    yPos += 30;
    
    // Draw stacked bar chart - optimized for A4 width (max 500px)
    const stackedChartWidth = Math.min(pageWidth - 60, 500); // Max 500px width
    drawStatusByDepartmentChart(doc, 30, yPos, stackedChartWidth, 100, departmentStatusData);
    
    // Add legend for stacked chart
    yPos += 120;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Legend:', 30, yPos);
    
    yPos += 15;
    // Active legend
    doc.setFillColor(34, 139, 34);
    doc.rect(30, yPos - 3, 15, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text('Active', 50, yPos + 2);
    
    // Inactive legend
    doc.setFillColor(105, 105, 105);
    doc.rect(90, yPos - 3, 15, 8, 'F');
    doc.text('Inactive', 110, yPos + 2);
    
    // Suspended legend
    doc.setFillColor(178, 34, 34);
    doc.rect(150, yPos - 3, 15, 8, 'F');
    doc.text('Suspended', 170, yPos + 2);

    // ===== PAGE 5: HIRING TRENDS & INSIGHTS =====
    doc.addPage();
    
    // Use helper function for consistent header
    yPos = addPageHeader(doc, 'HIRING TRENDS & INSIGHTS', 'Recruitment Patterns & Growth Analysis', 5, 6);
    
    doc.setTextColor(0, 0, 0);
    
    // ===== 3. NEW JOINERS BY MONTH (LINE CHART) =====
    // Check if line chart section fits
    yPos = checkPageBreak(doc, yPos, 200, margin);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('3. New Joiners by Month', 30, yPos);
    
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Tracks hiring and onboarding trends - HR can identify peak hiring periods', 30, yPos);
    
    yPos += 30;
    
    // Draw monthly joiners chart - optimized for A4 width (max 500px)
    const monthlyChartWidth = Math.min(pageWidth - 60, 500); // Max 500px width
    drawMonthlyJoinersChart(doc, 30, yPos, monthlyChartWidth, 100, monthlyJoiners);
    
    yPos += 140;
    
    // ===== SECURITY & MANAGEMENT INSIGHTS =====
  // Check if insights section fits
  yPos = checkPageBreak(doc, yPos, 180, margin);

  // Add HIRING TRENDS & INSIGHTS header
  yPos = addPageHeader(doc, 'HIRING TRENDS & INSIGHTS', 'Recruitment Patterns & Growth Analysis', 5, 6);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(1);
  doc.rect(20, yPos, pageWidth - 40, 100, 'FD');

  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(34, 139, 34);
  doc.text('Security & Management Insights', 30, yPos);
    
    yPos += 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    // Calculate insights
    const insightsActivePercentage = ((stats.active / stats.total) * 100).toFixed(1);
    
    // Active status insight
    doc.setTextColor(34, 139, 34);
    doc.text(`${insightsActivePercentage}% of employee accounts are currently active`, 30, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text('Strong workforce engagement and proper system access management', 40, yPos + 12);
    
    yPos += 25;
    
    // Security recommendations
    if (stats.inactive > 0 || stats.suspended > 0) {
      doc.setTextColor(255, 140, 0);
      doc.text(`Review Required: ${stats.inactive + stats.suspended} accounts need attention`, 30, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text('Inactive/suspended accounts pose potential security risks', 40, yPos + 12);
    } else {
      doc.setTextColor(34, 139, 34);
      doc.text('Excellent: All accounts are active and properly managed', 30, yPos);
    }
    
    // ===== MANAGER ACTION ITEMS =====
    yPos += 45;
    
  // Check if action items section fits
  yPos = checkPageBreak(doc, yPos, 100, margin);

  // Add HIRING TRENDS & INSIGHTS header
  yPos = addPageHeader(doc, 'HIRING TRENDS & INSIGHTS', 'Recruitment Patterns & Growth Analysis', 5, 6);

  doc.setFillColor(255, 248, 220);
  doc.setDrawColor(255, 165, 0);
  doc.setLineWidth(1);
  doc.rect(20, yPos, pageWidth - 40, 100, 'FD');
    
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 140, 0);
    doc.text('Manager Action Items & Recommendations', 30, yPos);
    
    yPos += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    doc.text('• Monthly account status audits to maintain security standards', 30, yPos);
    doc.text('• Monitor department growth patterns for resource allocation', 30, yPos + 12);
    doc.text('• Track hiring trends to optimize recruitment planning', 30, yPos + 24);
    
    if (stats.inactive > 0 || stats.suspended > 0) {
      doc.text('• URGENT: Review and resolve inactive/suspended accounts', 30, yPos + 36);
      doc.text('• Implement automated account lifecycle management', 30, yPos + 48);
    } else {
      doc.text('• Maintain current excellent account management practices', 30, yPos + 36);
      doc.text('• Use current standards as benchmark for other teams', 30, yPos + 48);
    }

    // ===== PAGE 6: DETAILED EMPLOYEE DIRECTORY =====
    doc.addPage();
    
    // Professional header with consistent branding
    doc.setFillColor(25, 55, 109);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED EMPLOYEE DIRECTORY', margin, 22);
    
    // Add page number and section indicator
    
    // Add data scope information
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 50, pageWidth - (2 * margin), 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, 50, pageWidth - (2 * margin), 25, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DATA SCOPE:', margin + 10, 62);
    doc.setFont('helvetica', 'normal');
    if (currentUser.role === 'Manager') {
      doc.text(`Department: ${currentUser.department} | Access Level: Departmental`, margin + 60, 62);
    } else {
      doc.text(`Organization-wide | Access Level: Administrative`, margin + 60, 62);
    }
    doc.text(`Total Records: ${stats.total} employees | Generated: ${exportDate}`, margin + 10, 70);

    // Prepare table data
    const headers = includeFields.map((field: string) => {
      switch (field) {
        case "employeeId": return "Employee ID";
        case "fullName": return "Full Name";
        case "department": return "Department";
        case "role": return "Role";
        case "status": return "Status";
        case "dateOfJoining": return "Date of Joining";
        case "email": return "Email";
        default: return field;
      }
    });

    const rows = employees.map((employee: Record<string, unknown>) => {
      return includeFields.map((field: string) => {
        switch (field) {
          case "employeeId":
            return String(employee._id) || "";
          case "fullName":
            // Try multiple name sources, fallback to generating from email
            const name = String(employee.name || employee.fullName || "").trim();
            if (name) {
              return name;
            }
            // Generate name from email if no name exists
            const email = String(employee.email || "");
            if (email) {
              const emailPrefix = email.split('@')[0];
              // Convert email prefix to a readable name (e.g., "john.doe" -> "John Doe")
              return emailPrefix
                .replace(/[._-]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
            return "Employee"; // Final fallback
          case "department":
            return String(employee.department || "");
          case "role":
            return String(employee.role || "");
          case "status":
            const status = String(employee.status || "active");
            return status.charAt(0).toUpperCase() + status.slice(1);
          case "dateOfJoining":
            return employee.createdAt ? new Date(employee.createdAt as Date).toLocaleDateString() : "";
          case "email":
            return String(employee.email || "");
          default:
            return String(employee[field] || "");
        }
      });
    });

    // Find the status column index
    const statusColumnIndex = includeFields.indexOf('status');
    
    console.log('📊 Status column index:', statusColumnIndex);
    console.log('📊 Headers:', headers);
    console.log('📊 Sample row data:', rows[0]);
    if (statusColumnIndex >= 0) {
      console.log('📊 Sample status values:', rows.slice(0, 3).map(row => row[statusColumnIndex]));
    }

    // Add detailed table with enhanced professional styling - optimized for A4 width
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 85,
      styles: { 
        fontSize: 8,
        cellPadding: { top: 4, right: 2, bottom: 4, left: 2 }, // Asymmetric padding for better fit
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        textColor: [33, 37, 41], // Darker text for better readability
        valign: 'middle',
        overflow: 'linebreak', // Handle text overflow properly
        cellWidth: 'wrap', // Wrap text to fit columns
        minCellHeight: 8 // Minimum row height for consistency
      },
      headStyles: { 
        fillColor: [25, 55, 109], // Professional navy blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
        cellPadding: { top: 6, right: 2, bottom: 6, left: 2 },
        minCellHeight: 12
      },
      alternateRowStyles: { 
        fillColor: [248, 249, 250] // Very light grey for better contrast
      },
      columnStyles: (() => {
        const styles: Record<number, object> = {};
        
        // Status column styling
        if (statusColumnIndex >= 0) {
          styles[statusColumnIndex] = {
            fontStyle: 'bold',
            halign: 'center',
            cellWidth: 20,
            minCellWidth: 18
          };
        }
        
        // Employee ID column (typically first) - compact
        styles[0] = {
          cellWidth: 25,
          halign: 'center',
          fontSize: 7
        };
        
        // Email column (typically last) - allow more space
        if (headers.length > 0) {
          const emailIndex = headers.findIndex((h: string) => h.toLowerCase().includes('email'));
          if (emailIndex >= 0) {
            styles[emailIndex] = {
              cellWidth: 'auto',
              fontSize: 7,
              minCellWidth: 30
            };
          }
        }
        
        return styles;
      })(),
      margin: { top: 85, left: margin, right: margin },
      tableWidth: 'auto',
      theme: 'grid', // Professional grid theme
      showHead: 'everyPage', // Header on every page
      pageBreak: 'auto', // Automatic page breaks,
      didDrawCell: (data) => {
        // Color-code the status column if it exists
        if (statusColumnIndex >= 0 && data.column.index === statusColumnIndex && data.row.index >= 0) {
          const cellText = data.cell.text.join('').toLowerCase().trim();
          
          console.log(`🎨 Processing status cell: "${cellText}" at row ${data.row.index}, col ${data.column.index}`);
          
          // Clear existing styles and apply new ones
          data.cell.styles = data.cell.styles || {};
          
          // Apply colors based on status
          if (cellText === 'active') {
            // Green for active
            data.cell.styles.textColor = [34, 139, 34]; // Forest Green
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
            console.log('✅ Applied GREEN color for active status');
          } else if (cellText === 'inactive') {
            // Grey for inactive
            data.cell.styles.textColor = [105, 105, 105]; // Dim Grey
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
            console.log('⚫ Applied GREY color for inactive status');
          } else if (cellText === 'suspended') {
            // Red for suspended with light red background
            data.cell.styles.textColor = [178, 34, 34]; // Fire Brick Red
            data.cell.styles.fillColor = [255, 228, 225]; // Misty Rose background
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
            console.log('🔴 Applied RED color and background for suspended status');
          } else {
            console.log(`⚠️ Unknown status: "${cellText}"`);
          }
        }
      },
      didDrawPage: (data) => {
        // Add professional page footer with branding
        doc.setFillColor(245, 245, 245);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Company name on left
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text('NGS PALLET WORKS', margin, pageHeight - 8);
        
        // Page info in center
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${data.pageNumber} of 6 | Employee Directory Report`,
          pageWidth / 2,
          pageHeight - 12,
          { align: 'center' }
        );
        
        // Date on right
        doc.text(exportDate, pageWidth - margin, pageHeight - 8, { align: 'right' });
        
        // Confidentiality notice
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('CONFIDENTIAL DOCUMENT', pageWidth / 2, pageHeight - 4, { align: 'center' });
      }
    });

    console.log('🎨 PDF generation completed with comprehensive report');
    console.log('📊 Export summary:', {
      totalEmployees: employees.length,
      statusColumnIndex,
      includesStatus: statusColumnIndex >= 0,
      stats
    });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF as professional download
    const reportDate = new Date().toISOString().split('T')[0];
    const filename = `NGS-Employee-Directory-Report-${reportDate}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: unknown) {
    console.error("❌ Employee export error:", error);
    return NextResponse.json(
      { error: "Failed to export employees" },
      { status: 500 }
    );
  }
}
