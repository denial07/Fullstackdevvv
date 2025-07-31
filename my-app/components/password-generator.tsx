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

export function PasswordGenerator({ onPasswordSelect, className }: PasswordGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([])
  const [selectedPassword, setSelectedPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState('')
  const [showGenerator, setShowGenerator] = useState(false)

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

    // Always use a password options object with length >= 12
    const passwordOptions = {
      length: 12,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false,
      excludeAmbiguous: false,
    };

    // Custom password generator: replace letters with symbols, mix in numbers/symbols, no full words
    function leetTransform(str: string): string {
      return str
        .replace(/a/gi, '@')
        .replace(/s/gi, '$')
        .replace(/i/gi, '!')
        .replace(/o/gi, '0')
        .replace(/e/gi, '3')
        .replace(/l/gi, '1');
    }

    function generateLeetPassword() {
      // Extract words from prompt
      const words = prompt.split(/\W+/).filter(word => word.length > 2);
      let fragment = '';
      if (words.length > 0) {
        // Use a random word, leet transform, and take up to 6 chars
        const word = words[Math.floor(Math.random() * words.length)];
        fragment = leetTransform(word).slice(0, 6);
      }
      // Pad with random numbers/symbols to reach 12 chars
      let password = fragment;
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      while (password.length < 12) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      // Shuffle password
      password = SmartPasswordGenerator['shuffleString'](password);
      // Ensure no full word from prompt is present
      const lowerPassword = password.toLowerCase();
      if (!words.some(word => word && lowerPassword.includes(word.toLowerCase()))) {
        return password;
      }
      // If a word slipped in, fallback to random
      return SmartPasswordGenerator.generatePassword(passwordOptions);
    }

    try {
      const variations = Array.from({ length: 3 }, generateLeetPassword);
      setGeneratedPasswords(variations);

      // Auto-select first password and evaluate it
      if (variations.length > 0) {
        handlePasswordSelect(variations[0]);
      }
    } catch (error) {
      console.error('Password generation error:', error);
      // Fallback to basic generation
      const fallback = SmartPasswordGenerator.generatePassword(passwordOptions);
      setGeneratedPasswords([fallback]);
      handlePasswordSelect(fallback);
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
          Describe yourself in natural language and get personalized secure passwords
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
            <strong>How it works:</strong> Our AI analyzes your interests and creates 
            memorable yet secure passwords. Each password combines your keywords with 
            symbols, numbers, and smart substitutions for maximum security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
