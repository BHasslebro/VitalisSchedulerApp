import React, { useState, useEffect, useRef } from 'react';
import { Filter, List, LayoutGrid, Check } from 'lucide-react';
import _ from 'lodash';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import SelectedSeminarsPanel from './components/SelectedSeminarsPanel';
import DaySelector from './components/DaySelector';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';

// Utility functions for URL state compression
const compressState = (state) => {
  const compressed = {
    s: state.selections,  // seminars
    f: {},               // filters
    d: state.day,        // day
    v: state.view,       // view
    q: state.query       // search query
  };
  
  // Only include non-empty filters
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value.length > 0) {
      compressed.f[key[0]] = value; // Use first letter of filter key
    }
  });
  
  return btoa(JSON.stringify(compressed));
};

const decompressState = (compressed) => {
  try {
    const state = JSON.parse(atob(compressed));
    return {
      selections: state.s || {},
      filters: {
        språk: (state.f?.s || []),      // s for språk
        ämne: (state.f?.a || []),       // a for ämne
        målgrupp: (state.f?.m || []),   // m for målgrupp
        kunskapsnivå: (state.f?.k || []) // k for kunskapsnivå
      },
      day: state.d || null,
      view: state.v || 'list',
      query: state.q || ''
    };
  } catch (e) {
    console.error('Failed to decompress state:', e);
    return null;
  }
};

const parseDateTime = (dateTimeStr) => {
  const match = dateTimeStr.match(/([^\d]+\d+\s+\w+\s+\d{4})\s+(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (!match) return null;
  
  return {
    day: match[1],
    startTime: parseInt(match[2]) * 60 + parseInt(match[3]),
    endTime: parseInt(match[4]) * 60 + parseInt(match[5])
  };
};

const doTimeRangesOverlap = (start1, end1, start2, end2) => {
  // Two time ranges overlap if one range's start is before the other's end
  // and that same range's end is after the other's start
  return start1 < end2 && end1 > start2;
};

const VitalisScheduler = () => {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeminars, setSelectedSeminars] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    språk: [],
    ämne: [],
    målgrupp: [],
    kunskapsnivå: []
  });
  const [filterOptions, setFilterOptions] = useState({
    språk: [],
    ämne: [],
    målgrupp: [],
    kunskapsnivå: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const filterDialogRef = useRef(null);

  // Handle click outside filter dialog
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDialogRef.current && !filterDialogRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Function to update URL with current state
  const updateURL = (selections, filters, day, view) => {
    const state = {
      selections,
      filters,
      day,
      view,
      query: searchQuery
    };
    
    const compressed = compressState(state);
    const encoded = encodeURIComponent(compressed);
    window.history.replaceState({}, '', `${window.location.pathname}?s=${encoded}`);
  };

  // Function to load state from URL
  const loadStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');

    if (encoded) {
      const compressed = decodeURIComponent(encoded);
      const state = decompressState(compressed);
      if (state) {
        setSelectedSeminars(state.selections);
        setActiveFilters(state.filters);
        if (state.day) setActiveDay(state.day);
        if (state.view) setViewMode(state.view);
        if (state.query) setSearchQuery(state.query);
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    // Load data and initialize state
    const loadData = async () => {
      try {
        const response = await fetch('/vitalis_seminars.json');
        const text = await response.text();
        const data = JSON.parse(text);
        setSeminars(data);
        
        // Extract unique days from the data
        const allDays = _.uniqBy(data.map(seminar => {
          const dateStr = seminar.date_time.split(' ')[0] + ' ' + seminar.date_time.split(' ')[1];
          return {
            date: dateStr,
            dayName: getDayName(dateStr)
          };
        }), 'date');
        
        setDays(allDays);
        
        // Extract filter options
        const språkOptions = _.uniq(data.filter(s => s.metadata?.Språk).map(s => s.metadata.Språk));
        const ämneOptions = _.uniq(data.filter(s => s.metadata?.Ämne).map(s => s.metadata.Ämne));
        
        let målgruppOptions = [];
        data.forEach(s => {
          if (Array.isArray(s.metadata?.Målgrupp)) {
            målgruppOptions = [...målgruppOptions, ...s.metadata.Målgrupp];
          } else if (s.metadata?.Målgrupp) {
            målgruppOptions.push(s.metadata.Målgrupp);
          }
        });
        
        const kunskapsnivåOptions = _.uniq(data.filter(s => s.metadata?.Kunskapsnivå).map(s => s.metadata.Kunskapsnivå));
        
        setFilterOptions({
          språk: språkOptions,
          ämne: ämneOptions,
          målgrupp: _.uniq(målgruppOptions),
          kunskapsnivå: kunskapsnivåOptions
        });

        // First try to load state from URL
        loadStateFromURL();
        
        // If no day is set from URL, set the first day
        if (!window.location.search.includes('s') && allDays.length > 0) {
          setActiveDay(allDays[0].date);
        }
        
        // If nothing was loaded from URL, try localStorage
        if (!window.location.search.includes('s')) {
          const savedSelections = localStorage.getItem('vitalisSelectedSeminars');
          if (savedSelections) {
            setSelectedSeminars(JSON.parse(savedSelections));
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Kunde inte ladda seminariedata. Försök igen senare.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update URL and localStorage when state changes
  useEffect(() => {
    if (!loading) {
      updateURL(selectedSeminars, activeFilters, activeDay, viewMode);
      localStorage.setItem('vitalisSelectedSeminars', JSON.stringify(selectedSeminars));
    }
  }, [selectedSeminars, activeFilters, activeDay, viewMode, loading, searchQuery, updateURL]);

  // Get seminars for a specific time slot
  const getSeminarsForTimeSlot = (timeSlot) => {
    return seminars.filter(seminar => {
      // First check if the seminar is for the active day and matches the time slot
      const isCorrectTimeSlot = seminar.date_time.includes(timeSlot) && 
                               seminar.date_time.startsWith(activeDay);
      
      if (!isCorrectTimeSlot) return false;
      
      // Then apply all filters including search
      // Apply active filters
      const passesSpråk = activeFilters.språk.length === 0 || 
        (seminar.metadata?.Språk && activeFilters.språk.includes(seminar.metadata.Språk));
      
      const passesÄmne = activeFilters.ämne.length === 0 || 
        (seminar.metadata?.Ämne && activeFilters.ämne.includes(seminar.metadata.Ämne));
      
      const passesMålgrupp = activeFilters.målgrupp.length === 0 || 
        (seminar.metadata?.Målgrupp && (
          (Array.isArray(seminar.metadata.Målgrupp) && 
            seminar.metadata.Målgrupp.some(m => activeFilters.målgrupp.includes(m))) ||
          activeFilters.målgrupp.includes(seminar.metadata.Målgrupp)
        ));
      
      const passesKunskapsnivå = activeFilters.kunskapsnivå.length === 0 || 
        (seminar.metadata?.Kunskapsnivå && activeFilters.kunskapsnivå.includes(seminar.metadata.Kunskapsnivå));
      
      // Apply search query
      const passesSearch = !searchQuery.trim() || (() => {
        const query = searchQuery.toLowerCase().trim();
        
        // Search in title
        if (seminar.title.toLowerCase().includes(query)) return true;
        
        // Search in location
        if (seminar.location.toLowerCase().includes(query)) return true;
        
        // Search in speakers
        if (seminar.speakers && seminar.speakers.length > 0) {
          for (const speaker of seminar.speakers) {
            if (speaker.name && speaker.name.toLowerCase().includes(query)) return true;
            if (speaker.title && speaker.title.toLowerCase().includes(query)) return true;
            if (speaker.organization && speaker.organization.toLowerCase().includes(query)) return true;
          }
        }
        
        // Search in metadata
        if (seminar.metadata) {
          for (const [_key, value] of Object.entries(seminar.metadata)) {
            if (typeof value === 'string' && value.toLowerCase().includes(query)) return true;
            if (Array.isArray(value)) {
              for (const item of value) {
                if (typeof item === 'string' && item.toLowerCase().includes(query)) return true;
              }
            }
          }
        }
        
        return false;
      })();
      
      return passesSpråk && passesÄmne && passesMålgrupp && passesKunskapsnivå && passesSearch;
    });
  };

  // Update timeSlots when activeDay, seminars, activeFilters, or searchQuery change
  useEffect(() => {
    if (activeDay && seminars.length > 0) {
      // Filter seminars for the active day
      const daySeminars = seminars.filter(seminar => 
        seminar.date_time.startsWith(activeDay)
      );
      
      // Apply active filters and search
      const filteredSeminars = daySeminars.filter(seminar => {
        // If no filters are active in a category, all seminars pass
        const passesSpråk = activeFilters.språk.length === 0 || 
          (seminar.metadata?.Språk && activeFilters.språk.includes(seminar.metadata.Språk));
        
        const passesÄmne = activeFilters.ämne.length === 0 || 
          (seminar.metadata?.Ämne && activeFilters.ämne.includes(seminar.metadata.Ämne));
        
        const passesMålgrupp = activeFilters.målgrupp.length === 0 || 
          (seminar.metadata?.Målgrupp && (
            (Array.isArray(seminar.metadata.Målgrupp) && 
              seminar.metadata.Målgrupp.some(m => activeFilters.målgrupp.includes(m))) ||
            activeFilters.målgrupp.includes(seminar.metadata.Målgrupp)
          ));
        
        const passesKunskapsnivå = activeFilters.kunskapsnivå.length === 0 || 
          (seminar.metadata?.Kunskapsnivå && activeFilters.kunskapsnivå.includes(seminar.metadata.Kunskapsnivå));
        
        // Apply search query
        const passesSearch = !searchQuery.trim() || (() => {
          const query = searchQuery.toLowerCase().trim();
          
          // Search in title
          if (seminar.title.toLowerCase().includes(query)) return true;
          
          // Search in location
          if (seminar.location.toLowerCase().includes(query)) return true;
          
          // Search in speakers
          if (seminar.speakers && seminar.speakers.length > 0) {
            for (const speaker of seminar.speakers) {
              if (speaker.name && speaker.name.toLowerCase().includes(query)) return true;
              if (speaker.title && speaker.title.toLowerCase().includes(query)) return true;
              if (speaker.organization && speaker.organization.toLowerCase().includes(query)) return true;
            }
          }
          
          // Search in metadata
          if (seminar.metadata) {
            for (const [_key, value] of Object.entries(seminar.metadata)) {
              if (typeof value === 'string' && value.toLowerCase().includes(query)) return true;
              if (Array.isArray(value)) {
                for (const item of value) {
                  if (typeof item === 'string' && item.toLowerCase().includes(query)) return true;
                }
              }
            }
          }
          
          return false;
        })();
        
        return passesSpråk && passesÄmne && passesMålgrupp && passesKunskapsnivå && passesSearch;
      });
      
      // Extract time slots from the filtered seminars
      const slots = _.uniqBy(filteredSeminars.map(seminar => {
        const timePart = seminar.date_time.split(activeDay)[1].trim();
        return {
          timeSlot: timePart,
          startTime: getStartTime(timePart)
        };
      }), 'timeSlot');
      
      // Sort time slots by start time
      const sortedSlots = _.sortBy(slots, 'startTime');
      
      setTimeSlots(sortedSlots);
    }
  }, [activeDay, seminars, activeFilters, searchQuery]);

  // Save selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('vitalisSelectedSeminars', JSON.stringify(selectedSeminars));
  }, [selectedSeminars]);

  // Helper function to get day name
  const getDayName = (dateStr) => {
    const days = {
      'Måndag': 'Måndag',
      'Tisdag': 'Tisdag',
      'Onsdag': 'Onsdag',
      'Torsdag': 'Torsdag',
      'Fredag': 'Fredag',
      'Lördag': 'Lördag',
      'Söndag': 'Söndag'
    };
    
    return days[dateStr.split(' ')[0]] || dateStr.split(' ')[0];
  };

  // Helper function to extract start time for sorting
  const getStartTime = (timeStr) => {
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  };
  
  // Helper function to parse time into minutes for calendar view
  const parseTimeToMinutes = (timeStr) => {
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  };
  
  // Helper function to get seminar duration in minutes
  const getSeminarDuration = (timeStr) => {
    // Extract start and end times from format like "10:30 - 11:00"
    const times = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (times) {
      const startMinutes = parseInt(times[1]) * 60 + parseInt(times[2]);
      const endMinutes = parseInt(times[3]) * 60 + parseInt(times[4]);
      return endMinutes - startMinutes;
    }
    // Default to 60 minutes if we can't parse the format
    return 60;
  };

  const toggleSeminarSelection = (timeSlot, seminarId) => {
    setSelectedSeminars(prev => {
      const newSelections = { ...prev };
      
      if (newSelections[timeSlot] === seminarId) {
        // Deselect if already selected
        delete newSelections[timeSlot];
      } else {
        // Select new seminar
        newSelections[timeSlot] = seminarId;
      }
      
      return newSelections;
    });
  };

  const checkSeminarConflict = (seminar) => {
    if (!seminar?.date_time || Object.keys(selectedSeminars).length === 0) {
      return false;
    }

    try {
      // Parse the candidate seminar's date and time
      const candidateDateTime = parseDateTime(seminar.date_time);
      if (!candidateDateTime) {
        console.warn('Failed to parse datetime for seminar:', seminar.id);
        return false;
      }

      // Check against each selected seminar
      for (const selectedSeminarId of Object.values(selectedSeminars)) {
        if (!selectedSeminarId || selectedSeminarId === seminar.id) continue;

        const selectedSeminar = seminars.find(s => s.id === selectedSeminarId);
        if (!selectedSeminar?.date_time) continue;

        // Parse the selected seminar's date and time
        const selectedDateTime = parseDateTime(selectedSeminar.date_time);
        if (!selectedDateTime) continue;

        // Only check conflicts for seminars on the same day
        if (candidateDateTime.day === selectedDateTime.day) {
          // Check if time ranges overlap
          if (doTimeRangesOverlap(
            candidateDateTime.startTime,
            candidateDateTime.endTime,
            selectedDateTime.startTime,
            selectedDateTime.endTime
          )) {
            // Log the conflict for debugging
            console.debug('Conflict detected:', {
              candidate: {
                id: seminar.id,
                time: `${Math.floor(candidateDateTime.startTime/60)}:${candidateDateTime.startTime%60} - ${Math.floor(candidateDateTime.endTime/60)}:${candidateDateTime.endTime%60}`
              },
              selected: {
                id: selectedSeminar.id,
                time: `${Math.floor(selectedDateTime.startTime/60)}:${selectedDateTime.startTime%60} - ${Math.floor(selectedDateTime.endTime/60)}:${selectedDateTime.endTime%60}`
              }
            });
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking seminar conflicts:', error);
      return false;
    }
  };

  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      if (newFilters[category].includes(value)) {
        // Remove filter if already active
        newFilters[category] = newFilters[category].filter(v => v !== value);
      } else {
        // Add filter
        newFilters[category] = [...newFilters[category], value];
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      språk: [],
      ämne: [],
      målgrupp: [],
      kunskapsnivå: []
    });
  };

  const countActiveFilters = () => {
    return Object.values(activeFilters).reduce((sum, filters) => sum + filters.length, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Laddar seminarier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600 p-4 max-w-md">
          <p className="text-lg font-semibold">Något gick fel</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Vitalis 2025 Seminarschema</h1>
        <p className="text-gray-600">Planera dina seminarier och skapa ditt personliga schema</p>
      </header>

      {/* Day selector */}
      <DaySelector 
        days={days}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />

      {/* View toggle and filter buttons */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg border ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <List size={18} />
            <span>Listvy</span>
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg border ${
              viewMode === 'calendar' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Kalendervy</span>
          </button>
          <button 
            onClick={() => setViewMode('mySchedule')}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg border ${
              viewMode === 'mySchedule' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <Check size={18} />
            <span>Mitt schema</span>
          </button>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 py-2 px-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 w-full sm:w-auto justify-center sm:justify-start"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <Filter size={18} />
          <span>Filter</span>
          {countActiveFilters() > 0 && (
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {countActiveFilters()}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel - now using the dedicated component */}
      <FilterPanel 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        countActiveFilters={countActiveFilters}
      />

      {/* Search Bar */}
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        resultsCount={timeSlots.reduce((count, slot) => count + getSeminarsForTimeSlot(slot.timeSlot).length, 0)}
      />

      {/* Time slots and seminars */}
      {timeSlots.length === 0 && viewMode !== 'mySchedule' ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Inga seminarier matchar dina filter för den valda dagen.</p>
          {countActiveFilters() > 0 && (
            <button 
              onClick={clearFilters}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Rensa filter
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        // LIST VIEW
        <ListView 
          timeSlots={timeSlots}
          getSeminarsForTimeSlot={getSeminarsForTimeSlot}
          selectedSeminars={selectedSeminars}
          toggleSeminarSelection={toggleSeminarSelection}
          checkSeminarConflict={checkSeminarConflict}
          clearFilters={clearFilters}
          countActiveFilters={countActiveFilters}
          activeDay={activeDay}
        />
      ) : viewMode === 'calendar' ? (
        // CALENDAR VIEW
        <CalendarView 
          seminars={seminars}
          activeDay={activeDay}
          activeFilters={activeFilters}
          selectedSeminars={selectedSeminars}
          toggleSeminarSelection={toggleSeminarSelection}
          parseTimeToMinutes={parseTimeToMinutes}
          getSeminarDuration={getSeminarDuration}
          checkSeminarConflict={checkSeminarConflict}
          searchQuery={searchQuery}  
        />
      ) : (
        // MY SCHEDULE VIEW - Show only selected seminars
        <div className="mt-4">
          {Object.keys(selectedSeminars).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Du har inte valt några seminarier än.</p>
              <p className="text-sm text-gray-500 mt-2">Använd Listvy eller Kalendervy för att välja seminarier.</p>
            </div>
          ) : (
            <SelectedSeminarsPanel 
              selectedSeminars={selectedSeminars}
              seminars={seminars}
              toggleSeminarSelection={toggleSeminarSelection}
              isFullView={true}
            />
          )}
        </div>
      )}

      {/* Selected seminars summary - only show in list and calendar views */}
      {viewMode !== 'mySchedule' && (
        <SelectedSeminarsPanel 
          selectedSeminars={selectedSeminars}
          seminars={seminars}
          toggleSeminarSelection={toggleSeminarSelection}
          isFullView={false}
        />
      )}
      
      {/* Disclaimer footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>This application is not affiliated with, endorsed by, or connected to Vitalis in any way.</p>
        <p>It is an independent tool created for educational and personal use only.</p>
      </div>
    </div>
  );
};

export default VitalisScheduler;
