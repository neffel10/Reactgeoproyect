import React, { useState, useEffect } from 'react';

// Nombre de la clave en localStorage
const FAVORITES_STORAGE_KEY = 'weatherAppFavorites';

/**
 * Custom Hook para gestionar el estado de las ciudades favoritas y su persistencia en localStorage.
 * Las ciudades se guardarán como objetos { name, country, lat, lon }.
 */
const useFavorites = () => {
    // Estado para almacenar la lista de favoritos
    const [favorites, setFavorites] = useState(() => {
        try {
            // Intentar cargar los favoritos de localStorage al inicio
            const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
            return storedFavorites ? JSON.parse(storedFavorites) : [];
        } catch (error) {
            console.error("Error al cargar favoritos de localStorage:", error);
            return [];
        }
    });

    // useEffect para guardar los favoritos en localStorage cada vez que el estado cambie
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error("Error al guardar favoritos en localStorage:", error);
        }
    }, [favorites]);

    /**
     * Función para añadir una ciudad a la lista de favoritos.
     * @param {object} city - Objeto con { name, country, lat, lon }.
     */
    const addFavorite = (city) => {
        // Verificar si la ciudad ya está en favoritos para evitar duplicados
        const exists = favorites.some(fav => fav.name === city.name && fav.country === city.country);
        if (!exists) {
            // Añadir la ciudad al inicio de la lista
            setFavorites(prev => [city, ...prev]);
        }
    };

    /**
     * Función para eliminar una ciudad de la lista de favoritos.
     * @param {string} cityName - Nombre de la ciudad a eliminar.
     */
    const removeFavorite = (cityName) => {
        setFavorites(prev => prev.filter(fav => fav.name !== cityName));
    };

    /**
     * Función para verificar si una ciudad ya está en la lista.
     * @param {string} cityName - Nombre de la ciudad a verificar.
     * @returns {boolean} - true si es favorita, false en caso contrario.
     */
    const isFavorite = (cityName) => {
        return favorites.some(fav => fav.name === cityName);
    };

    // Devolvemos el estado y las funciones que los componentes usarán
    return {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
    };
};

export default useFavorites;