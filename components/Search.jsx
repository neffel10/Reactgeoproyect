import React from 'react';

const Search = ({ searchTerm, onSearchTermChange, onSearchSubmit }) => {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (searchTerm.trim() !== '' && onSearchSubmit) {
      onSearchSubmit(searchTerm);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto"
    >
      <input
        placeholder="Enter a city name..."
        className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-black-200"
        type="text"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
      />
      <button
        type="submit"
        className="shrink-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 transform hover:scale-105"
      >
        Search Weather
      </button>
    </form>
  );
};

export default Search;