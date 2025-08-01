"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wand2, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Brain
} from 'lucide-react'
import { SmartPasswordGenerator, PasswordStrength } from '@/lib/password-generator'

interface PasswordGeneratorProps {
  onPasswordSelect: (password: string) => void
  className?: string
}

type ObfuscationLevel = 'medium' | 'strong'

export function PasswordGenerator({ onPasswordSelect, className }: PasswordGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([])
  const [selectedPassword, setSelectedPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState('')
  const [showGenerator, setShowGenerator] = useState(false)
  const [obfuscationLevel, setObfuscationLevel] = useState<ObfuscationLevel>('medium')
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])

  const examplePrompts = [
    "I love anime, coffee, and Paris",
    "My cat Luna loves pizza and sunshine",
    "I'm a developer who enjoys hiking and jazz music",
    "Traveling to Japan, coding React, playing guitar",
    "Beach volleyball, sushi, and morning runs"
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract keywords using AI-like logic
    function extractKeywords(prompt: string): string[] {
      const stopwords = new Set([
        'i', 'the', 'and', 'a', 'my', 'to', 'is', 'in', 'of', 'on', 'for', 
        'who', 'with', 'love', 'enjoys', 'am', 'are', 'have', 'has', 'like', 
        'likes', 'will', 'would', 'can', 'could', 'should', 'that', 'this',
        'from', 'at', 'by', 'it', 'an', 'as', 'be', 'or', 'but', 'not'
      ]);
      
      const keywords = prompt
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2 && !stopwords.has(word))
        .slice(0, 8); // Limit to 8 keywords for UI
      
      return keywords;
    }

    // Enhanced symbol mapping with better visual similarity
    const symbolMap: { [key: string]: [string, string] } = {
      'a': ['a', '^'],
      'b': ['b', '8'],
      'c': ['c', '('],
      'd': ['d', ')'],
      'e': ['e', '3'],
      'f': ['f', '='],
      'g': ['g', '6'],
      'h': ['h', '#'],
      'i': ['i', '!'],
      'j': ['j', ';'],
      'k': ['k', '<'],
      'l': ['l', '1'],
      'm': ['m', '^^'],
      'n': ['n', '/\\/'],
      'o': ['o', '0'],
      'p': ['p', '°'],
      'q': ['q', '0,'],
      'r': ['r', '2'],
      's': ['s', '$'],
      't': ['t', '+'],
      'u': ['u', '_'],
      'v': ['v', '\\/'],
      'w': ['w', 'VV'],
      'x': ['x', '*'],
      'y': ['y', '¥'],
      'z': ['z', '2']
    };

    // Transform word based on obfuscation level
    function leetTransform(word: string, level: ObfuscationLevel): string {
      if (word.length === 0) return word;
      
      const chars = word.split('');
      const transformedChars = chars.map((char) => {
        const lowerChar = char.toLowerCase();
        const options = symbolMap[lowerChar];
        if (!options) return char; // Keep non-alphabetic characters
        
        const firstOption = options[0]; // letter
        const secondOption = options[1]; // symbol
        
        let transformed;
        switch (level) {
          case 'medium':
            // 50/50 letter vs symbol for medium
            transformed = Math.random() < 0.5 ? firstOption : secondOption;
            break;
          case 'strong':
            // Mostly symbols for strong (80% symbols)
            transformed = Math.random() < 0.2 ? firstOption : secondOption;
            break;
          default:
            transformed = firstOption;
        }
        
        return transformed;
      });
      
      return transformedChars.join('');
    }

    // Generate password with new logic
    function generatePassword(prompt: string, level: ObfuscationLevel): string {
      const keywords = extractKeywords(prompt);
      
      // Choose keywords based on level
      const keywordCount = level === 'strong' ? 2 : 1;
      const chosenWords = keywords.length > 0 
        ? keywords.slice(0, Math.min(keywordCount, keywords.length))
        : (level === 'strong' ? ['secure', 'pass'] : ['secure']); // fallback if no keywords
      
      // Apply substitution based on level
      const transformed = chosenWords.map(word => leetTransform(word, level)).join('');
      
      // Add mandatory characters (1 each of uppercase, lowercase, digit, symbol)
      const mandatoryChars = [
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)], // uppercase
        'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)], // lowercase
        '0123456789'[Math.floor(Math.random() * 10)], // digit
        '!@#$%^&*'[Math.floor(Math.random() * 8)] // symbol
      ];
      
      // Random padding based on level
      const padLength = level === 'strong' 
        ? Math.floor(Math.random() * 3) + 6 // 6-8 random characters
        : Math.floor(Math.random() * 3) + 3; // 3-5 random characters
      
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let padding = '';
      for (let i = 0; i < padLength; i++) {
        padding += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Combine all parts
      let password = transformed + mandatoryChars.join('') + padding;
      
      // Ensure minimum length for strong mode
      if (level === 'strong') {
        while (password.length < 14) {
          password += charset[Math.floor(Math.random() * charset.length)];
        }
      }
      
      // Shuffle final password for better entropy and to avoid patterns
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      return password;
    }

    // Validate password meets strength requirements
    function validatePassword(password: string, level: ObfuscationLevel): boolean {
      const strength = SmartPasswordGenerator.evaluateStrength(password);
      
      if (level === 'medium') {
        // Accept "Good" and above (score >= 3)
        return strength.score >= 3;
      } else {
        // Strong mode: must be "Very Strong" (score >= 4) and at least 14 characters
        return strength.score >= 4 && password.length >= 14;
      }
    }

    try {
      // Extract and set keywords for display
      const keywords = extractKeywords(prompt);
      setExtractedKeywords(keywords);

      // Generate multiple password variations with new logic
      const variations: string[] = [];
      let attempts = 0;
      const maxAttempts = 50; // Generous attempt limit
      
      while (variations.length < 3 && attempts < maxAttempts) {
        const candidate = generatePassword(prompt, obfuscationLevel);
        
        // Validate strength
        if (validatePassword(candidate, obfuscationLevel)) {
          // Avoid duplicates
          if (!variations.includes(candidate)) {
            variations.push(candidate);
          }
        }
        attempts++;
      }

      setGeneratedPasswords(variations);

      // Auto-select first password and evaluate it
      if (variations.length > 0) {
        handlePasswordSelect(variations[0]);
      }
    } catch (error) {
      console.error('Password generation error:', error);
      // Fallback to basic generation only for medium mode
      // For strong mode, we don't provide fallback if we can't generate very strong passwords
      if (obfuscationLevel === 'medium') {
        const fallback = SmartPasswordGenerator.generatePassword({
          length: 12,
          includeLowercase: true,
          includeUppercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: false,
          excludeAmbiguous: false,
        });
        setGeneratedPasswords([fallback]);
        handlePasswordSelect(fallback);
      } else {
        // For strong mode, show empty results if we can't generate very strong passwords
        setGeneratedPasswords([]);
      }
    }

    setIsGenerating(false);
  }

  const handlePasswordSelect = (password: string) => {
    setSelectedPassword(password)
    const strength = SmartPasswordGenerator.evaluateStrength(password)
    setPasswordStrength(strength)
  }

  const handleUsePassword = () => {
    if (selectedPassword) {
      onPasswordSelect(selectedPassword)
      setShowGenerator(false)
    }
  }

  const handleCopyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(password)
      setTimeout(() => setCopiedPassword(''), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  const handlePromptExample = (example: string) => {
    setPrompt(example)
  }

  if (!showGenerator) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowGenerator(true)}
          className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Generate Smart Password with AI
        </Button>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          Smart Password Generator
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <CardDescription>
          Describe yourself in natural language and get personalized secure passwords. Medium: Good-Very Strong, Strong: Always Very Strong (≥14 chars).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Natural Language Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Tell us about yourself</Label>
          <div className="space-y-2">
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I love anime, coffee, and Paris..."
              className="font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-2">Try:</span>
              {examplePrompts.slice(0, 2).map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePromptExample(example)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Obfuscation Level Control */}
        <div className="space-y-2">
          <Label>Password Style</Label>
          <div className="flex gap-2">
            {(['medium', 'strong'] as ObfuscationLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setObfuscationLevel(level)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  obfuscationLevel === level
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {obfuscationLevel === 'medium' && '1 keyword + mandatory chars + 3-5 random chars (Good to Very Strong)'}
            {obfuscationLevel === 'strong' && '2 keywords + mandatory chars + 6-8 random chars, ≥14 chars (Always Very Strong)'}
          </div>
        </div>

        {/* Extracted Keywords Display */}
        {extractedKeywords.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              AI Detected Keywords
            </Label>
            <div className="flex flex-wrap gap-1">
              {extractedKeywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              These keywords from your input will be used to create memorable passwords
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating AI passwords...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Smart Passwords
            </>
          )}
        </Button>

        {/* Generated Passwords */}
        {generatedPasswords.length > 0 && (
          <div className="space-y-3">
            <Label>Generated Password Options</Label>
            <div className="space-y-2">
              {generatedPasswords.map((password, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPassword === password 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePasswordSelect(password)}
                >
                  <div className="flex-1 font-mono text-sm break-all">
                    {password}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyPassword(password)
                    }}
                  >
                    {copiedPassword === password ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Strong Passwords Message */}
        {generatedPasswords.length === 0 && obfuscationLevel === 'strong' && !isGenerating && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>No Very Strong passwords could be generated</strong> from your input with the current settings. 
              Try using a longer description with more varied words, or switch to Medium style for more options.
            </AlertDescription>
          </Alert>
        )}

        {/* Password Strength Analysis */}
        {passwordStrength && selectedPassword && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Password Strength</Label>
              <Badge 
                style={{ backgroundColor: passwordStrength.color, color: 'white' }}
                className="font-medium"
              >
                {passwordStrength.label}
              </Badge>
            </div>
            
            <Progress 
              value={SmartPasswordGenerator.getStrengthPercentage(passwordStrength.score)}
              className="h-2"
              style={{
                background: `linear-gradient(to right, ${passwordStrength.color}20, ${passwordStrength.color}40)`
              }}
            />
            
            {passwordStrength.feedback.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} className="text-sm">• {feedback}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {selectedPassword && (
          <div className="flex gap-2">
            <Button onClick={handleUsePassword} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Use This Password
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowGenerator(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> Extracts keywords from your description, applies leet transformations, 
            adds mandatory character types (uppercase, lowercase, digit, symbol), and pads with random characters. 
            Medium: 1 keyword + 3-5 padding, Strong: 2 keywords + 6-8 padding. All shuffled for security!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
