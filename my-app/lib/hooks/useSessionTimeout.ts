import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseSessionTimeoutProps {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  isEnabled?: boolean;
}

export function useSessionTimeout({ 
  timeoutMinutes = 30, 
  onTimeout,
  isEnabled = true 
}: UseSessionTimeoutProps = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Call custom onTimeout callback if provided
      if (onTimeout) {
        onTimeout();
      }

      // Clear localStorage
      localStorage.removeItem('user');
      
      // Call logout API to clear cookies
      await fetch('/api/logout', { method: 'POST' });
      
      // Redirect to login
      router.push('/login?reason=timeout');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      localStorage.removeItem('user');
      router.push('/login?reason=timeout');
    }
  }, [router, onTimeout]);

  const resetTimeout = useCallback(() => {
    if (!isEnabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout
    const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    timeoutRef.current = setTimeout(() => {
      console.log(`🕐 Session timeout after ${timeoutMinutes} minutes of inactivity`);
      logout();
    }, timeoutMs);

    console.log(`⏱️ Session timeout set for ${timeoutMinutes} minutes`);
  }, [timeoutMinutes, logout, isEnabled]);

  const checkActivity = useCallback(() => {
    if (!isEnabled) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    // If we've been inactive for longer than the timeout, logout immediately
    if (timeSinceLastActivity >= timeoutMs) {
      console.log(`🕐 Session expired (inactive for ${Math.round(timeSinceLastActivity / 1000 / 60)} minutes)`);
      logout();
    } else {
      // Reset the timeout with remaining time
      const remainingTime = timeoutMs - timeSinceLastActivity;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        console.log(`🕐 Session timeout after ${timeoutMinutes} minutes of inactivity`);
        logout();
      }, remainingTime);
    }
  }, [timeoutMinutes, logout, isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Reset timeout on any user activity
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check for activity when the page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout, checkActivity, isEnabled]);

  // Provide manual refresh function
  const refreshSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  return {
    refreshSession,
    timeoutMinutes,
    isEnabled
  };
}
