export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  label: string;
  color: string;
  feedback: string[];
}

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

export class SmartPasswordGenerator {
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private static readonly SIMILAR_CHARS = 'il1Lo0O';
  private static readonly AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;.<>';

  /**
   * For compatibility: generate password variations
   * @param options PasswordOptions
   * @param count Number of variations
   */
  static generateVariations(options: PasswordOptions, count: number = 5): string[] {
    return this.generateMultiplePasswords(options, count);
  }

  /**
   * Generate a password from a prompt (for compatibility)
   */
  static generateFromPrompt(options: PasswordOptions): string {
    return this.generatePassword(options);
  }

  /**
   * Evaluate password strength (for compatibility)
   */
  static evaluateStrength(password: string): PasswordStrength {
    return this.assessPasswordStrength(password);
  }

  /**
   * Get strength percentage for UI (for compatibility)
   */
  static getStrengthPercentage(score: number): number {
    // Map 0-4 score to 0-100%
    return Math.round((score / 4) * 100);
  }
  static generatePassword(options: PasswordOptions): string {
    let charset = '';
    
    if (options.includeLowercase) {
      charset += options.excludeSimilar ? 
        this.LOWERCASE.replace(/[il]/g, '') : 
        this.LOWERCASE;
    }
    
    if (options.includeUppercase) {
      charset += options.excludeSimilar ? 
        this.UPPERCASE.replace(/[LO]/g, '') : 
        this.UPPERCASE;
    }
    
    if (options.includeNumbers) {
      charset += options.excludeSimilar ? 
        this.NUMBERS.replace(/[10]/g, '') : 
        this.NUMBERS;
    }
    
    if (options.includeSymbols) {
      let symbols = this.SYMBOLS;
      if (options.excludeAmbiguous) {
        symbols = symbols.replace(/[{}[\]()/\\'"` ~,;.<>]/g, '');
      }
      charset += symbols;
    }

    if (!charset) {
      throw new Error('At least one character type must be selected');
    }

    // Generate password ensuring at least one character from each selected type
    let password = '';
    const requiredChars: string[] = [];

    if (options.includeLowercase) {
      const lowerChars = options.excludeSimilar ? 
        this.LOWERCASE.replace(/[il]/g, '') : 
        this.LOWERCASE;
      requiredChars.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]);
    }

    if (options.includeUppercase) {
      const upperChars = options.excludeSimilar ? 
        this.UPPERCASE.replace(/[LO]/g, '') : 
        this.UPPERCASE;
      requiredChars.push(upperChars[Math.floor(Math.random() * upperChars.length)]);
    }

    if (options.includeNumbers) {
      const numberChars = options.excludeSimilar ? 
        this.NUMBERS.replace(/[10]/g, '') : 
        this.NUMBERS;
      requiredChars.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
    }

    if (options.includeSymbols) {
      let symbols = this.SYMBOLS;
      if (options.excludeAmbiguous) {
        symbols = symbols.replace(/[{}[\]()/\\'"` ~,;.<>]/g, '');
      }
      requiredChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    // Add required characters
    password += requiredChars.join('');

    // Fill the rest with random characters
    for (let i = password.length; i < options.length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  static generateMultiplePasswords(options: PasswordOptions, count: number = 5): string[] {
    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generatePassword(options));
    }
    return passwords;
  }

  static assessPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Pattern checks
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeating characters');

    if (!/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      score += 1;
    } else {
      feedback.push('Avoid common sequences');
    }

    // Common password check
    const commonPasswords = ['password', 'password123', '123456', 'qwerty', 'admin', 'letmein'];
    if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score += 1;
    } else {
      feedback.push('Avoid common passwords');
    }

    // Determine strength label and color
    let label: string;
    let color: string;

    if (score <= 2) {
      label = 'Very Weak';
      color = '#ef4444'; // red-500
    } else if (score <= 4) {
      label = 'Weak';
      color = '#f97316'; // orange-500
    } else if (score <= 6) {
      label = 'Fair';
      color = '#eab308'; // yellow-500
    } else if (score <= 8) {
      label = 'Good';
      color = '#22c55e'; // green-500
    } else {
      label = 'Very Strong';
      color = '#16a34a'; // green-600
    }

    return {
      score: Math.min(score, 4), // Normalize to 0-4 scale
      label,
      color,
      feedback
    };
  }

  private static shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  static getPasswordEntropy(password: string): number {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32; // Approximate symbol count
    
    return Math.log2(Math.pow(charsetSize, password.length));
  }

  static estimateCrackTime(password: string): string {
    const entropy = this.getPasswordEntropy(password);
    const guessesPerSecond = 1000000000; // 1 billion guesses per second (modern hardware)
    const seconds = Math.pow(2, entropy - 1) / guessesPerSecond;

    if (seconds < 60) return 'Less than a minute';
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} days`;
    if (seconds < 31536000000) return `${Math.ceil(seconds / 31536000)} years`;
    return 'Centuries';
  }
}
