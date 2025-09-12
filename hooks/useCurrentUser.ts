
import useLocalStorage from './useLocalStorage';
import { User } from '../types';
import { useEffect } from 'react';

export function useAuth() {
    const [users, setUsers] = useLocalStorage<User[]>('carrom-users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('carrom-currentUser', null);

    // Seed a default user for the dummy data. In a real app, this would be handled by a proper backend.
    useEffect(() => {
        if (!users.find(u => u.id === 'dummy-owner-user-id')) {
            setUsers(prev => [...prev, { id: 'dummy-owner-user-id', email: 'admin@example.com', password: 'password' }]);
        }
    }, [setUsers, users]);

    const login = (email: string, password: string):boolean => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const register = (email: string, password: string): boolean => {
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            alert('User with this email already exists.');
            return false;
        }
        const newUser: User = { id: crypto.randomUUID(), email, password };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        return true;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    return { currentUser, users, login, register, logout, setUsers };
}
