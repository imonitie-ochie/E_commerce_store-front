import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import  {ProductProvider} from "./contexts/StoreContext copy"

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <StoreProvider>
        <ProductProvider>
        <App />
        </ProductProvider>
      </StoreProvider>
    </AuthProvider>
  </BrowserRouter>
);
