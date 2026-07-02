import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos los componentes de página que definen las vistas
import HomePage from '/pages/HomePage';
import FavoritesPage from '/pages/FavoritesPage';
import CityDetailPage from '/pages/CityDetailPage';

const App = () => {
  return (
    // BrowserRouter: Permite la navegación en la SPA
    <BrowserRouter basename="/Reactgeoproyect">
      <div className="App w-full min-h-screen">
        {/* Routes: Contenedor para todas las definiciones de ruta */}
        <Routes>
          
          {/* Ruta principal: / */}
          <Route path="/" element={<HomePage />} />
          
          {/* Ruta de favoritos: /favorites */}
          <Route path="/favorites" element={<FavoritesPage />} />
          
          {/* Ruta dinámica: /city/nombre-ciudad (usando el parámetro :cityName) */}
          <Route path="/city/:cityName" element={<CityDetailPage />} />
          
          {/* Ruta de fallback: 404 */}
          <Route path="*" element={<h1 className="text-4xl text-center mt-20">404 - Página no encontrada</h1>} />
        </Routes>
        <p id="cfooter" className="cfooter">
          Alessandro Torres 2025 v.1.0 |
          <a href="https://www.espaciopsicologico.mx/alessandro">&nbsp;Portfolio</a>
        </p>
      </div>
    </BrowserRouter>
    
  );
};

export default App;