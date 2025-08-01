// Test script to verify strong mode password requirements
function testPasswordRequirements() {
  const testPasswords = [
    "Abc123!@",      // Should pass - has all 4 types
    "abc123!@",      // Should fail - no uppercase
    "ABC123!@",      // Should fail - no lowercase
    "Abcdef!@",      // Should fail - no numbers
    "Abc12345",      // Should fail - no special chars
    "A8#b",          // Should fail - too short
    "a8#bC2$9xZ!",   // Should pass - has all 4 types
  ];

  function validateStrongModeRequirements(password) {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    
    return hasLowercase && hasUppercase && hasNumbers && hasSpecialChars;
  }

  console.log("Testing strong mode password requirements:");
  console.log("Password must have: uppercase, lowercase, numbers, and special characters\n");

  testPasswords.forEach((password, index) => {
    const result = validateStrongModeRequirements(password);
    const status = result ? "✅ PASS" : "❌ FAIL";
    
    const analysis = {
      lowercase: /[a-z]/.test(password) ? "✓" : "✗",
      uppercase: /[A-Z]/.test(password) ? "✓" : "✗", 
      numbers: /[0-9]/.test(password) ? "✓" : "✗",
      special: /[^a-zA-Z0-9]/.test(password) ? "✓" : "✗"
    };
    
    console.log(`${index + 1}. "${password}" - ${status}`);
    console.log(`   Lower: ${analysis.lowercase} | Upper: ${analysis.uppercase} | Numbers: ${analysis.numbers} | Special: ${analysis.special}\n`);
  });
}

testPasswordRequirements();
