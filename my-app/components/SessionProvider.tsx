"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSessionTimeout } from '@/lib/hooks/useSessionTimeout';

interface SessionContextType {
  sessionTimeout: number;
  setSessionTimeout: (timeout: number) => void;
  refreshSession: () => void;
  isSessionActive: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionTimeout, setSessionTimeoutState] = useState<number>(30); // Default 30 minutes
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Custom timeout handler
  const handleTimeout = () => {
    console.log('🚪 Session timed out - logging out user');
    // You can add custom logic here before logout
  };

  // Use the session timeout hook
  const { refreshSession } = useSessionTimeout({
    timeoutMinutes: sessionTimeout,
    onTimeout: handleTimeout,
    isEnabled: isSessionActive
  });

  // Load user session timeout from the database when component mounts
  useEffect(() => {
    const loadUserSessionTimeout = async () => {
      try {
        // Check if user is logged in
        const userData = localStorage.getItem('user');
        if (!userData) {
          setIsSessionActive(false);
          return;
        }

        setIsSessionActive(true);

        // Fetch user's session timeout preference
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (response.ok && data.user.sessionTimeout) {
          setSessionTimeoutState(data.user.sessionTimeout);
          console.log(`⏱️ Loaded session timeout: ${data.user.sessionTimeout} minutes`);
        }
      } catch (error) {
        console.error('Failed to load session timeout:', error);
      }
    };

    loadUserSessionTimeout();
  }, []);

  // Update session timeout
  const setSessionTimeout = (timeout: number) => {
    setSessionTimeoutState(timeout);
    console.log(`⏱️ Session timeout updated to: ${timeout} minutes`);
  };

  const value = {
    sessionTimeout,
    setSessionTimeout,
    refreshSession,
    isSessionActive
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
