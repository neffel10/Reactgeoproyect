import React, { useState, useEffect } from 'react';
import { Trash2, Wind, Droplet, Gauge } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const handleApiError = (response) => {
    if (response.status === 401) {
        throw new Error('Error 401: Invalid API Key.');
    }
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
};


const FavoriteCityCard = ({ city, onRemove, onCardClick }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDark } = useTheme();

    // useEffect para obtener el clima inmediatamente después de que el componente se monta
    useEffect(() => {
        const fetchWeather = async () => {
            const { lat, lon } = city;
            // Usamos la API de clima actual, que es más rápida que el forecast si solo queremos el clima actual
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
            
            try {
                const response = await fetch(weatherUrl);
                handleApiError(response);
                
                const data = await response.json();
                setWeatherData(data); 
            } catch (err) {
                console.error(`Error trying to get weather for ${city.name}:`, err);
                setError(`Error: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [city]); // Ejecutar solo si el objeto city cambia

    if (error) {
        return (
            <div className={`${
                isDark
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-red-100 border-red-300 text-red-700'
            } border rounded-2xl p-6 relative backdrop-blur-xl`}>
                <h3 className="text-lg font-bold mb-2">{city.name}, {city.country}</h3>
                <p className="text-sm">Unable to load weather data.</p>
                <button 
                    onClick={onRemove}
                    className={`absolute top-3 right-3 p-2 rounded-full transition ${
                        isDark
                            ? 'bg-red-500/20 hover:bg-red-500/30'
                            : 'bg-red-200/50 hover:bg-red-300/50'
                    }`}
                    title="Remove from favorites"
                >
                    <Trash2 className={`w-5 h-5 ${
                        isDark ? 'text-red-400' : 'text-red-700'
                    }`} />
                </button>
            </div>
        );
    }
    
    if (isLoading) {
        return (
            <div className={`${
                isDark
                    ? 'bg-white/10 border-white/10'
                    : 'bg-slate-200/30 border-slate-300'
            } backdrop-blur-xl p-6 rounded-2xl border flex items-center justify-center h-48`}>
                <p className={`animate-pulse ${
                    isDark ? 'text-sky-400' : 'text-sky-600'
                }`}>Loading...</p>
            </div>
        );
    }
    
    const temp = weatherData?.main?.temp;
    const weatherDescription = weatherData?.weather?.[0]?.description;
    const weatherIcon = weatherData?.weather?.[0]?.icon;

    return (
        <div 
            className={`${
                isDark
                    ? 'bg-gradient-to-br from-sky-600/20 to-cyan-600/20 border-sky-400/30 hover:border-sky-400/50 hover:from-sky-600/30 hover:to-cyan-600/30'
                    : 'bg-gradient-to-br from-sky-100/50 to-cyan-100/50 border-sky-200 hover:border-sky-300 hover:from-sky-100 hover:to-cyan-100'
            } backdrop-blur-xl border rounded-2xl p-6 relative cursor-pointer transition-all duration-300 group`}
            onClick={onCardClick}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className={`absolute top-3 right-3 p-2 rounded-full border transition-all ${
                    isDark
                        ? 'bg-white/10 border-white/20 hover:bg-red-500/20 hover:border-red-500/30'
                        : 'bg-slate-200/50 border-slate-300 hover:bg-red-200/50 hover:border-red-300'
                }`}
                title="Remove from favorites"
            >
                <Trash2 className={`w-5 h-5 group-hover:text-red-500 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                }`} />
            </button>

            <h3 className={`text-xl font-bold mb-1 ${
                isDark ? 'text-white' : 'text-slate-900'
            }`}>{city.name}</h3>
            <p className={`text-sm mb-4 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>{city.country}</p>

            <div className={`flex items-center justify-between mb-4 pb-4 ${
                isDark ? 'border-white/10' : 'border-slate-300'
            } border-b`}>
                {weatherIcon && (
                    <img 
                        src={getWeatherIconUrl(weatherIcon)} 
                        alt={weatherDescription} 
                        className="w-14 h-14 filter drop-shadow-lg"
                    />
                )}
                <div className="text-right">
                    <p className={`text-4xl font-extrabold ${
                        isDark ? 'text-cyan-300' : 'text-cyan-600'
                    }`}>
                        {Math.round(temp)}°
                    </p>
                    <p className={`text-xs capitalize ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                        {weatherDescription}
                    </p>
                </div>
            </div>
            
            <div className={`space-y-2 text-sm ${
                isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
                <div className={`flex items-center justify-between rounded-lg p-2 px-3 ${
                    isDark ? 'bg-white/5' : 'bg-slate-200/30'
                }`}>
                    <div className="flex items-center gap-2">
                        <Wind className={`w-4 h-4 ${
                            isDark ? 'text-cyan-400' : 'text-cyan-600'
                        }`} />
                        <span>Wind</span>
                    </div>
                    <span className={`font-semibold ${
                        isDark ? 'text-cyan-300' : 'text-cyan-700'
                    }`}>{weatherData?.wind?.speed.toFixed(1)} m/s</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg p-2 px-3 ${
                    isDark ? 'bg-white/5' : 'bg-slate-200/30'
                }`}>
                    <div className="flex items-center gap-2">
                        <Droplet className={`w-4 h-4 ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                        <span>Humidity</span>
                    </div>
                    <span className={`font-semibold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>{weatherData?.main?.humidity}%</span>
                </div>
                <div className={`flex items-center justify-between rounded-lg p-2 px-3 ${
                    isDark ? 'bg-white/5' : 'bg-slate-200/30'
                }`}>
                    <div className="flex items-center gap-2">
                        <Gauge className={`w-4 h-4 ${
                            isDark ? 'text-sky-400' : 'text-sky-600'
                        }`} />
                        <span>Pressure</span>
                    </div>
                    <span className={`font-semibold ${
                        isDark ? 'text-sky-300' : 'text-sky-700'
                    }`}>{weatherData?.main?.pressure} hPa</span>
                </div>
            </div>
        </div>
    );
};

export default FavoriteCityCard;