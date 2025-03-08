import React from 'react';
import { X } from 'lucide-react';

const FilterPanel = ({ 
  isOpen, 
  onClose, 
  filterOptions, 
  activeFilters, 
  toggleFilter, 
  clearFilters, 
  countActiveFilters 
}) => {
  return (
    <div 
      className={`filter-panel transition-all duration-300 ${
        isOpen 
          ? 'max-h-[2000px] opacity-100 border-gray-200' 
          : 'max-h-0 opacity-0 border-transparent overflow-hidden'
      } bg-white rounded-lg border mt-4 mb-6`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Filtrera seminarier</h3>
          <div className="flex gap-4 items-center">
            <button 
              onClick={clearFilters} 
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={countActiveFilters() === 0}
            >
              Rensa alla filter
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Stäng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mobile-optimized filter layout */}
        <div className="space-y-6">
          {/* Language filter */}
          <div>
            <h4 className="font-medium mb-2 text-blue-700">Språk</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.språk.map(språk => (
                <label 
                  key={språk} 
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                    activeFilters.språk.includes(språk)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.språk.includes(språk)}
                    onChange={() => toggleFilter('språk', språk)}
                    className="sr-only"
                  />
                  {språk}
                </label>
              ))}
            </div>
          </div>

          {/* Topic filter */}
          <div>
            <h4 className="font-medium mb-2 text-blue-700">Ämne</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.ämne.map(ämne => (
                <label 
                  key={ämne} 
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                    activeFilters.ämne.includes(ämne)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.ämne.includes(ämne)}
                    onChange={() => toggleFilter('ämne', ämne)}
                    className="sr-only"
                  />
                  {ämne}
                </label>
              ))}
            </div>
          </div>

          {/* Target audience filter */}
          <div>
            <h4 className="font-medium mb-2 text-blue-700">Målgrupp</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.målgrupp.map(målgrupp => (
                <label 
                  key={målgrupp} 
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                    activeFilters.målgrupp.includes(målgrupp)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.målgrupp.includes(målgrupp)}
                    onChange={() => toggleFilter('målgrupp', målgrupp)}
                    className="sr-only"
                  />
                  {målgrupp}
                </label>
              ))}
            </div>
          </div>

          {/* Knowledge level filter */}
          <div>
            <h4 className="font-medium mb-2 text-blue-700">Kunskapsnivå</h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.kunskapsnivå.map(nivå => (
                <label 
                  key={nivå} 
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                    activeFilters.kunskapsnivå.includes(nivå)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.kunskapsnivå.includes(nivå)}
                    onChange={() => toggleFilter('kunskapsnivå', nivå)}
                    className="sr-only"
                  />
                  {nivå}
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile-friendly filter summary and apply button */}
        <div className="mt-6 pt-4 border-t border-gray-200 md:hidden">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">
                {countActiveFilters()} filter aktiva
              </span>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Tillämpa filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
