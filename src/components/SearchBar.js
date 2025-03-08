import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery, resultsCount }) => {
  return (
    <div className="relative mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-gray-500" />
        </div>
        <input
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          placeholder="Sök efter seminarier eller talare..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setSearchQuery('')}
            aria-label="Rensa sökning"
          >
            <X size={18} className="text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>
      {searchQuery && (
        <div className="text-sm text-gray-600 mt-1">
          {resultsCount} träffar för "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;
