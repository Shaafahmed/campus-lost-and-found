import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token is saved, fetch the logged-in user
  useEffect(() => {
    const token = localStorage.getItem('lf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('lf_token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem('lf_token', token);
    setUser(u);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    saveSession(res.data);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('lf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
