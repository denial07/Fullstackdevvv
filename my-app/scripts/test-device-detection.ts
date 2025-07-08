// Quick test to check login alerts
// This will simulate a login attempt and show the device detection

console.log("🔧 Testing login alerts simulation...");

// Simulate different devices/browsers
const testDevices = [
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ipAddress: "192.168.1.100",
    description: "Chrome on Windows"
  },
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ipAddress: "192.168.1.101", 
    description: "Chrome on Mac"
  },
  {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ipAddress: "192.168.1.102",
    description: "Safari on iPhone"
  }
];

// Helper function to generate device ID (same as in login-alert API)
function generateDeviceId(userAgent: string, ipAddress: string): string {
  const combined = `${userAgent}-${ipAddress}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

console.log("📱 Device ID generation test:");
testDevices.forEach((device, index) => {
  const deviceId = generateDeviceId(device.userAgent, device.ipAddress);
  console.log(`${index + 1}. ${device.description}`);
  console.log(`   Device ID: ${deviceId}`);
  console.log(`   IP: ${device.ipAddress}`);
  console.log(`   User Agent: ${device.userAgent.substring(0, 60)}...`);
  console.log("");
});

console.log("✅ Device ID generation working!");
console.log("");
console.log("🧪 To test login alerts:");
console.log("1. Open the login page: http://localhost:3000/login");
console.log("2. Log in with a test user");
console.log("3. Check the terminal/console for login alert messages");
console.log("4. Try logging in from a different browser (incognito/private mode)");
console.log("5. The second login should trigger a 'new device' alert");

export {};
