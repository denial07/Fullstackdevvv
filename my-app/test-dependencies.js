// Test script to verify speakeasy installation
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

console.log('✅ speakeasy imported successfully');
console.log('✅ qrcode imported successfully');

// Test basic functionality
const secret = speakeasy.generateSecret({
  name: 'Test App',
  length: 20
});

console.log('✅ speakeasy generateSecret works');
console.log('Secret:', secret.base32);

console.log('🎉 All 2FA dependencies are working correctly!');
