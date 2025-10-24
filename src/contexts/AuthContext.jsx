import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../services/api";


const AuthContext = createContext();


export const useAuth = () => useContext(AuthContext);


export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(() => {
try {
const raw = localStorage.getItem('user');
return raw ? JSON.parse(raw) : null;
} catch (e) {
return null;
}
});


const [token, setToken] = useState(() => localStorage.getItem('token'));
const [loading, setLoading] = useState(false);


useEffect(() => {
if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
}, [token]);


useEffect(() => {
if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
}, [user]);


const login = async (email, password) => {
setLoading(true);
try {
const res = await api.post('/user/login', { email, password });
// adapt based on your backend response shape
const { token: t, user: u } = res.data;
setToken(t);
setUser(u);
setLoading(false);
return { ok: true };
} catch (err) {
setLoading(false);
return { ok: false, error: err.response?.data?.message || err.message };
}
};


const register = async (payload) => {
setLoading(true);
try {
const res = await api.post('/user/register', payload);
const { token: t, user: u } = res.data;
setToken(t);
setUser(u);
setLoading(false);
return { ok: true };
} catch (err) {
setLoading(false);
return { ok: false, error: err.response?.data?.message || err.message };
}
};


const logout = () => {
setUser(null);
setToken(null);
localStorage.removeItem('token');
localStorage.removeItem('user');
};


return (
<AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
{children}
</AuthContext.Provider>
);
};