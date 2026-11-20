import { useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';

export function useHeartbeat(isAuthenticated: boolean) {
  const lastActiveTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;

    // Track user activity (throttled + passive to avoid main-thread scroll/mousemove overhead)
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActiveTimeRef.current > 1000) {
        lastActiveTimeRef.current = now;
      }
    };

    // Listen for common activity events
    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    // Send heartbeat every 60 seconds
    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActiveTimeRef.current;
      
      // If the user has been completely inactive in the browser for more than 15 minutes,
      // stop sending heartbeats (the backend will log them out on the next request).
      // Otherwise, we send a heartbeat as long as they are active or have been active within 15 minutes.
      if (timeSinceLastActivity < 15 * 60 * 1000) {
        apiClient.post('/auth/heartbeat').catch(() => {
          // Ignore heartbeat errors (e.g., if they are already logged out)
        });
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [isAuthenticated]);
}
