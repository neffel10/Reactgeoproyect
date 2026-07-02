import React, { useState } from 'react';

// Este componente solo se encarga de la interfaz y de pasar el valor de búsqueda
// Recibe una función (onSearchCity) como prop
const Search = ({ onSearchCity }) => { 
  // Estado local para el texto en el input
  const [searchTerm, setSearchTerm] = useState('');

  // Actualiza el estado con cada cambio en el input
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Maneja el envío del formulario
  const handleSubmit = (event) => {
    event.preventDefault(); 
    
    // Si hay un término de búsqueda y se pasó la función, la llamamos.
    if (searchTerm.trim() !== '' && onSearchCity) {
        // Llama a la función del padre con el término de búsqueda
        onSearchCity(searchTerm.trim());
        setSearchTerm(''); // Limpiar el input para una nueva búsqueda
    } else {
        console.log("The field is empty or the function onSearchCity was not provided.");
    }
  };

  return (
    <form 
        onSubmit={handleSubmit} 
        class="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
  <input 
    placeholder="Enter a city name..." 
    class="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-black-200" 
    type="text" 
    value=""
  />
  <button 
    type="submit" 
    class="shrink-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 transform hover:scale-105"
  >
    Search Weather
  </button>
</form>
  );
};

export default Search;