import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            padding: '12px 16px',
          },
          success: { style: { background: '#16a34a', color: '#fff' } },
          error:   { style: { background: '#dc2626', color: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
