// Test script to verify cost per unit parsing
const { validateInventoryData } = require('./lib/excel-parser.ts')

// Test data with various cost formats
const testData = [
  {
    id: "TEST001",
    item: "Test Item 1",
    category: "Test",
    quantity: 100,
    unit: "pcs",
    minStock: 10,
    maxStock: 500,
    location: "A1",
    supplier: "Test Supplier",
    costPerUnit: "25.50"  // String number
  },
  {
    id: "TEST002", 
    item: "Test Item 2",
    category: "Test",
    quantity: 50,
    unit: "pcs",
    minStock: 5,
    maxStock: 200,
    location: "A2",
    supplier: "Test Supplier",
    costPerUnit: "$15.75"  // With currency symbol
  },
  {
    id: "TEST003",
    item: "Test Item 3", 
    category: "Test",
    quantity: 75,
    unit: "pcs",
    minStock: 15,
    maxStock: 300,
    location: "A3",
    supplier: "Test Supplier",
    costPerUnit: "S$12.25"  // Singapore dollar
  },
  {
    id: "TEST004",
    item: "Test Item 4",
    category: "Test", 
    quantity: 200,
    unit: "pcs",
    minStock: 20,
    maxStock: 1000,
    location: "A4",
    supplier: "Test Supplier",
    costPerUnit: 42.99  // Already a number
  }
]

console.log("Testing cost per unit parsing...")
const result = validateInventoryData(testData)

console.log("Validation result:", {
  valid: result.valid,
  validCount: result.validItems.length,
  invalidCount: result.invalidItems.length
})

console.log("\nProcessed cost values:")
result.validItems.forEach(item => {
  console.log(`${item.id}: costPerUnit = ${item.costPerUnit} (type: ${typeof item.costPerUnit})`)
})

if (result.errors.length > 0) {
  console.log("\nErrors found:")
  result.errors.forEach(error => {
    console.log(`Row ${error.row}: ${error.errors.join(', ')}`)
  })
}
