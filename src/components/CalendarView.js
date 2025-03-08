// Calendar View Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, MapPin, Users } from 'lucide-react';
import _ from 'lodash';

const CalendarView = ({ 
  seminars, 
  activeDay, 
  activeFilters, 
  selectedSeminars, 
  toggleSeminarSelection,
  checkSeminarConflict,
  searchQuery  
}) => {
  // State for seminar details popup
  const [detailsPopup, setDetailsPopup] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);
  const headerContainerRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Sync header scroll with calendar grid scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && headerContainerRef.current) {
        headerContainerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
      }
    };
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  // Close details popup when clicking elsewhere
  const handleClosePopup = useCallback((event) => {
    if (detailsPopup && !event.target.closest('.seminar-card') && !event.target.closest('.details-popup')) {
      setDetailsPopup(null);
    }
  }, [detailsPopup]);

  // Add click event listener to close popup
  useEffect(() => {
    document.addEventListener('click', handleClosePopup);
    return () => {
      document.removeEventListener('click', handleClosePopup);
    };
  }, [handleClosePopup]);

  // Function to handle showing details
  const handleShowDetails = (seminar, position, event) => {
    // Prevent the click from propagating to select the seminar
    if (isMobile) {
      event.stopPropagation();
    }
    
    if (detailsPopup && detailsPopup.seminar.id === seminar.id) {
      // If clicking the same seminar, close the popup
      setDetailsPopup(null);
    } else {
      // Otherwise show the popup for this seminar
      setDetailsPopup({ seminar, position });
    }
  };

  // Early return if no active day is selected
  if (!activeDay) {
    return <div className="mt-6 p-4 text-center text-gray-500">Please select a day to view the calendar.</div>;
  }

  // Get filtered seminars for the active day
  const filteredSeminars = seminars.filter(seminar => 
    seminar.date_time && seminar.date_time.startsWith(activeDay)
  ).filter(seminar => {
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
    
    // Apply search query filter
    const passesSearch = !searchQuery || searchQuery.trim() === '' || (() => {
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
        for (const [key, value] of Object.entries(seminar.metadata)) {
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

  // Calculate the earliest and latest times for the day
  let dayStart = 8 * 60; // Default 08:00
  let dayEnd = 18 * 60;  // Default 18:00

  filteredSeminars.forEach(seminar => {
    const parts = seminar.date_time.split(activeDay);
    if (parts.length < 2) return;
    
    const timeStr = parts[1].trim();
    const times = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    
    if (times) {
      const startMinutes = parseInt(times[1]) * 60 + parseInt(times[2]);
      const endMinutes = parseInt(times[3]) * 60 + parseInt(times[4]);
      
      dayStart = Math.min(dayStart, startMinutes);
      dayEnd = Math.max(dayEnd, endMinutes);
    }
  });

  // Round dayStart down to nearest hour and dayEnd up to nearest hour
  dayStart = Math.floor(dayStart / 60) * 60;
  dayEnd = Math.ceil(dayEnd / 60) * 60;

  // Get unique locations for column headers
  const locations = _.uniq(filteredSeminars.map(seminar => seminar.location)).sort();

  // Group seminars by location
  const seminarsByLocation = {};
  locations.forEach(location => {
    seminarsByLocation[location] = filteredSeminars.filter(seminar => seminar.location === location);
  });

  // Calculate the total number of hours to display
  const totalHours = (dayEnd - dayStart) / 60;
  
  // Define pixel height per hour (increased from 90 to 120)
  const pixelsPerHour = 120;

  // Generate hour and half-hour markers
  const timeMarkers = [];
  for (let i = 0; i <= totalHours * 2; i++) {
    const minutes = i * 30;
    const hour = Math.floor((dayStart + minutes) / 60);
    const minute = (dayStart + minutes) % 60;
    const isHour = minute === 0;
    
    timeMarkers.push(
      <div 
        key={`time-${hour}-${minute}`} 
        className={`absolute w-full ${isHour ? 'border-t border-gray-300' : 'border-t border-gray-200 border-dashed'}`} 
        style={{ top: `${(minutes / 60) * pixelsPerHour}px` }}
      >
        {isHour && (
          <span className="absolute -top-3 -left-2 text-xs text-gray-500">
            {hour.toString().padStart(2, '0')}:00
          </span>
        )}
        {!isHour && (
          <span className="absolute -top-3 -left-2 text-xs text-gray-400">
            {hour.toString().padStart(2, '0')}:30
          </span>
        )}
      </div>
    );
  }

  // Width of the time sidebar
  const timeSidebarWidth = 50;

  return (
    <div className="mt-6 relative">
      {/* Fixed time sidebar */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-white z-10"
        style={{ width: `${timeSidebarWidth}px`, height: `${totalHours * pixelsPerHour + 20 + 36}px` }} // 36px for header height
      >
        <div className="h-9"></div> {/* Space for header alignment */}
        <div className="relative" style={{ height: `${totalHours * pixelsPerHour + 20}px` }}>
          {timeMarkers.map((marker, index) => {
            const hour = Math.floor((dayStart + index * 30) / 60);
            const minute = (dayStart + index * 30) % 60;
            const isHour = minute === 0;
            
            return (
              <div 
                key={`time-label-${hour}-${minute}`} 
                className={`absolute w-full ${isHour ? 'border-t border-gray-300' : 'border-t border-gray-200 border-dashed'}`} 
                style={{ top: `${(index * 30 / 60) * pixelsPerHour}px` }}
              >
                {isHour && (
                  <span className="absolute -top-3 left-1 text-xs text-gray-500">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                )}
                {!isHour && (
                  <span className="absolute -top-3 left-1 text-xs text-gray-400">
                    {hour.toString().padStart(2, '0')}:30
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main content with left padding for time sidebar */}
      <div style={{ marginLeft: `${timeSidebarWidth}px` }}>
        {/* Location headers container */}
        <div 
          ref={headerContainerRef}
          className="overflow-hidden"
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${locations.length}, minmax(200px, 1fr))` }}>
            {locations.map(location => (
              <div key={location} className="p-2 bg-blue-100 text-center border-r border-blue-200 font-medium truncate h-9">
                {location}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main calendar container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto" 
          style={{ height: `${totalHours * pixelsPerHour + 20}px` }}
        >
          {/* Calendar grid */}
          <div 
            className="grid relative" 
            style={{ 
              gridTemplateColumns: `repeat(${locations.length}, minmax(200px, 1fr))`,
              backgroundSize: `1px ${pixelsPerHour / 2}px`,
              backgroundImage: 'linear-gradient(to bottom, rgba(226, 232, 240, 0.3) 1px, transparent 1px)',
            }}
          >
            {/* Time markers for the grid (without labels) */}
            {timeMarkers.map((_, index) => {
              const hour = Math.floor((dayStart + index * 30) / 60);
              const minute = (dayStart + index * 30) % 60;
              const isHour = minute === 0;
              
              return (
                <div 
                  key={`grid-time-${hour}-${minute}`} 
                  className={`absolute left-0 right-0 ${isHour ? 'border-t border-gray-300' : 'border-t border-gray-200 border-dashed'}`} 
                  style={{ top: `${(index * 30 / 60) * pixelsPerHour}px` }}
                />
              );
            })}
            
            {/* Location columns */}
            {locations.map((location, index) => (
              <div 
                key={location} 
                className={`relative border-r ${index === locations.length - 1 ? '' : 'border-gray-200'}`}
              >
                {/* Seminars in this location */}
                {seminarsByLocation[location].map(seminar => {
                  const parts = seminar.date_time.split(activeDay);
                  if (parts.length < 2) return null;
                  
                  const timeStr = parts[1].trim();
                  const times = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
                  
                  if (!times) return null;
                  
                  const startMinutes = parseInt(times[1]) * 60 + parseInt(times[2]);
                  const endMinutes = parseInt(times[3]) * 60 + parseInt(times[4]);
                  const duration = endMinutes - startMinutes;
                  
                  // Calculate position
                  const top = (startMinutes - dayStart) / 60 * pixelsPerHour;
                  const height = duration / 60 * pixelsPerHour;
                  
                  // Find the time slot for this seminar (for selection purposes)
                  const timeSlot = parts[1].trim();
                  const isSelected = selectedSeminars[timeSlot] === seminar.id;
                  const isShowingDetails = detailsPopup && detailsPopup.seminar.id === seminar.id;
                  const hasConflict = checkSeminarConflict(seminar);
                  
                  return (
                    <div 
                      key={seminar.id}
                      className={`seminar-card absolute left-1 right-1 p-2 rounded-md overflow-hidden shadow-sm ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 border' 
                          : hasConflict
                          ? 'border-gray-200 bg-white border opacity-50 cursor-not-allowed'
                          : isShowingDetails
                            ? 'border-blue-300 bg-blue-50 border cursor-pointer'
                            : 'border-gray-200 bg-white border hover:border-blue-300 cursor-pointer'
                      }`}
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                      }}
                    >
                      <div 
                        className="h-full" 
                        onClick={() => !hasConflict && toggleSeminarSelection(timeSlot, seminar.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className={`font-medium text-sm mb-1 line-clamp-2 ${
                            hasConflict ? 'text-gray-500' : 'text-blue-800'
                          }`}>
                            {seminar.title}
                          </h3>
                          {isSelected && (
                            <span className="bg-blue-600 text-white rounded-full p-1 flex-shrink-0">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        
                        <div className={`text-xs ${hasConflict ? 'text-gray-400' : 'text-gray-600'}`}>
                          {times[1]}:{times[2]} - {times[3]}:{times[4]}
                        </div>
                        
                        {seminar.speakers && seminar.speakers.length > 0 && seminar.speakers[0].name && height > 60 && (
                          <div className={`mt-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap ${
                            hasConflict ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {seminar.speakers[0].name}
                            {seminar.speakers.length > 1 && ", ..."}
                          </div>
                        )}
                        
                        {height > 80 && seminar.metadata?.Språk && (
                          <div className="mt-1">
                            <span className={`inline-block px-1 py-0.5 text-xs rounded text-xs ${
                              hasConflict ? 'bg-gray-100 text-gray-400' : 'bg-gray-100'
                            }`}>
                              {seminar.metadata.Språk}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Info button for mobile or desktop */}
                      <button
                        onClick={(e) => handleShowDetails(seminar, { top, left: index * 200 }, e)}
                        className={`absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center rounded-full border ${
                          hasConflict 
                            ? 'bg-gray-100 text-gray-400 border-gray-300'
                            : 'bg-gray-100 text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                        title={
                          hasConflict 
                            ? "Överlappar med valt seminarium" 
                            : "Visa detaljer"
                        }
                        aria-label={
                          hasConflict 
                            ? "Överlappar med valt seminarium" 
                            : "Visa detaljer"
                        }
                      >
                        {isShowingDetails ? (
                          <X size={10} />
                        ) : (
                          <span className="text-xs font-semibold">i</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Details popup */}
            {detailsPopup && (
              <div 
                className="details-popup absolute z-10 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80"
                style={{ 
                  top: `${detailsPopup.position.top + 20}px`, 
                  left: `${Math.min(detailsPopup.position.left + 100, window.innerWidth - 340)}px`,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                <button 
                  onClick={() => setDetailsPopup(null)}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 rounded-full"
                  aria-label="Stäng"
                >
                  <X size={16} />
                </button>
                
                <h3 className="font-medium text-blue-800 mb-2 pr-6">{detailsPopup.seminar.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{detailsPopup.seminar.date_time}</p>
                
                <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{detailsPopup.seminar.location}</span>
                </div>
                
                {detailsPopup.seminar.speakers && detailsPopup.seminar.speakers.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-start gap-1 text-sm text-gray-600 mb-1">
                      <Users size={16} className="mt-0.5 flex-shrink-0" />
                      <span className="font-medium">Föreläsare:</span>
                    </div>
                    <ul className="pl-6 text-sm text-gray-600">
                      {detailsPopup.seminar.speakers.slice(0, 3).map((speaker, index) => (
                        speaker.name && (
                          <li key={index} className="mb-1">
                            {speaker.name}
                            {speaker.title && ` (${speaker.title})`}
                          </li>
                        )
                      ))}
                      {detailsPopup.seminar.speakers.length > 3 && (
                        <li>+ {detailsPopup.seminar.speakers.length - 3} till...</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {detailsPopup.seminar.description && (
                  <div className="text-sm text-gray-600 mb-2">
                    <p className="line-clamp-3">{detailsPopup.seminar.description}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {detailsPopup.seminar.metadata?.Språk && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {detailsPopup.seminar.metadata.Språk}
                    </span>
                  )}
                  
                  {detailsPopup.seminar.metadata?.Ämne && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 rounded">
                      {detailsPopup.seminar.metadata.Ämne}
                    </span>
                  )}
                  
                  {detailsPopup.seminar.metadata?.Kunskapsnivå && (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 rounded">
                      {detailsPopup.seminar.metadata.Kunskapsnivå}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      const timeSlot = detailsPopup.seminar.date_time.split(activeDay)[1].trim();
                      if (!checkSeminarConflict(detailsPopup.seminar) || selectedSeminars[timeSlot] === detailsPopup.seminar.id) {
                        toggleSeminarSelection(timeSlot, detailsPopup.seminar.id);
                      }
                      setDetailsPopup(null);
                    }}
                    className={`px-3 py-1 rounded-md text-sm ${
                      selectedSeminars[detailsPopup.seminar.date_time.split(activeDay)[1].trim()] === detailsPopup.seminar.id
                        ? "bg-blue-600 text-white"
                        : checkSeminarConflict(detailsPopup.seminar)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white"
                    }`}
                    disabled={checkSeminarConflict(detailsPopup.seminar) && 
                      selectedSeminars[detailsPopup.seminar.date_time.split(activeDay)[1].trim()] !== detailsPopup.seminar.id}
                  >
                    {selectedSeminars[detailsPopup.seminar.date_time.split(activeDay)[1].trim()] === detailsPopup.seminar.id
                      ? "Avmarkera"
                      : checkSeminarConflict(detailsPopup.seminar)
                        ? "Tid överlappar med annat valt seminarium"
                        : "Lägg till i schema"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
