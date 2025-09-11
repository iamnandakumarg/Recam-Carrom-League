
import { useState, useEffect } from 'react';

interface CurrentUser {
    id: string;
}

function useCurrentUser(): CurrentUser {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    try {
      const item = window.localStorage.getItem('carrom-currentUser');
      if (item) {
          return JSON.parse(item);
      } else {
          const newUserId = crypto.randomUUID();
          const newUser = { id: newUserId };
          window.localStorage.setItem('carrom-currentUser', JSON.stringify(newUser));
          return newUser;
      }
    } catch (error) {
      console.error("Error accessing current user from localStorage", error);
      return { id: crypto.randomUUID() }; // Fallback
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'carrom-currentUser') {
            try {
                if (e.newValue) {
                    setCurrentUser(JSON.parse(e.newValue));
                }
            } catch (error) {
                console.error(error);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return currentUser;
}

export default useCurrentUser;
