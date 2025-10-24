import axios from 'axios';


export const User_api = "https://ecommerce-zv1v.onrender.com/";


const api = axios.create({
baseURL: User_api,
headers: {
'Content-Type': 'application/json'
}
});


// attach token if present
api.interceptors.request.use((config) => {
const token = localStorage.getItem('token');
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});


export default api;