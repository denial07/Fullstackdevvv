// Quick debug test for Excel date parsing
console.log("Testing date parsing...")

// Test the date format from the Excel file
const testDate = "20/12/2025"

// dd/mm/yyyy format parsing
const m = testDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
if (m) {
  const [_, d, mo, y] = m
  console.log("Parsed components:", { day: d, month: mo, year: y })
  
  const yyyy = Number(y.length === 2 ? (Number(y) >= 70 ? "19" + y : "20" + y) : y)
  const mm = String(Number(mo)).padStart(2, "0")
  const dd = String(Number(d)).padStart(2, "0")
  
  console.log("Formatted components:", { year: yyyy, month: mm, day: dd })
  
  if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
    const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
    console.log("Final date:", dt.toISOString().slice(0, 10))
  } else {
    console.log("Invalid date components")
  }
} else {
  console.log("Date format not matched")
}

// Test cost parsing
console.log("\nTesting cost parsing...")
const testCost = "65"
const numVal = parseFloat(String(testCost).replace(/[^\d.-]/g, ''))
console.log("Parsed cost:", numVal, "isNaN:", isNaN(numVal))
