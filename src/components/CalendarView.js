// Calendar View Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedSeminarId, setExpandedSeminarId] = useState(null);
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
  
  // Function to toggle seminar details expansion
  const toggleSeminarDetails = (seminarId, event) => {
    // Prevent the click from propagating to select the seminar
    if (event) {
      event.stopPropagation();
    }
    
    setExpandedSeminarId(prevId => prevId === seminarId ? null : seminarId);
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
  
  // Find the actual end time of the last seminar without rounding
  let actualEndMinutes = dayStart;
  filteredSeminars.forEach(seminar => {
    const parts = seminar.date_time.split(activeDay);
    if (parts.length < 2) return;
    
    const timeStr = parts[1].trim();
    const times = timeStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    
    if (times) {
      const endMinutes = parseInt(times[3]) * 60 + parseInt(times[4]);
      actualEndMinutes = Math.max(actualEndMinutes, endMinutes);
    }
  });
  
  // Add only 15 minutes after the last seminar
  let dayEnd = actualEndMinutes + 15;
  
  // Round to the nearest half hour if needed for cleaner display
  if (dayEnd % 30 !== 0) {
    dayEnd = Math.ceil(dayEnd / 30) * 30;
  }

  // Get unique locations for column headers
  const locations = _.uniq(filteredSeminars.map(seminar => seminar.location)).sort();

  // Group seminars by location
  const seminarsByLocation = {};
  locations.forEach(location => {
    seminarsByLocation[location] = filteredSeminars.filter(seminar => seminar.location === location);
  });

  // Calculate the total number of hours to display
  const totalHours = (dayEnd - dayStart) / 60;
  
  // Define pixel height per hour (increased for more height in seminars)
  const pixelsPerHour = 180;

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
          <span className="absolute -top-3 -left-2 text-xs text-gray-500 bg-white px-1 z-10">
            {hour.toString().padStart(2, '0')}:00
          </span>
        )}
        {!isHour && (
          <span className="absolute -top-3 -left-2 text-xs text-gray-400 bg-white px-1 z-10">
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
                  <span className="absolute -top-3 left-1 text-xs text-gray-500 bg-white px-1 z-10">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                )}
                {!isHour && (
                  <span className="absolute -top-3 left-1 text-xs text-gray-400 bg-white px-1 z-10">
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
                  style={{ 
                    top: `${(index * 30 / 60) * pixelsPerHour}px`,
                    width: `${locations.length * 200}px`, // Make sure lines extend across all locations
                    minWidth: '100%' // Ensure it's at least as wide as the container
                  }}
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
                  const hasConflict = checkSeminarConflict(seminar);
                  
                  return (
                    <div 
                      key={seminar.id}
                      className={`seminar-card absolute left-1 right-1 p-2 rounded-md shadow-sm ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 border' 
                          : hasConflict
                          ? 'border-gray-200 bg-white border opacity-50 cursor-not-allowed'
                          : expandedSeminarId === seminar.id
                            ? 'border-blue-300 bg-blue-50 border cursor-pointer z-20'
                            : 'border-gray-200 bg-white border hover:border-blue-300 cursor-pointer'
                      }`}
                      style={{ 
                        top: `${top}px`, 
                        height: expandedSeminarId === seminar.id ? 'auto' : `${height}px`,
                        maxHeight: expandedSeminarId === seminar.id ? '400px' : `${height}px`,
                        overflowY: expandedSeminarId === seminar.id ? 'auto' : 'hidden',
                        zIndex: expandedSeminarId === seminar.id ? 50 : 10
                      }}
                    >
                      <div 
                        className={expandedSeminarId === seminar.id ? '' : 'h-full'}
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
                        
                        {seminar.speakers && seminar.speakers.length > 0 && height > 60 && expandedSeminarId !== seminar.id && (
                          <div className={`mt-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap ${
                            hasConflict ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {seminar.speakers[0].name}
                            {seminar.speakers.length > 1 && ", ..."}
                          </div>
                        )}
                        
                        {height > 80 && seminar.metadata?.Språk && expandedSeminarId !== seminar.id && (
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
                        onClick={(e) => toggleSeminarDetails(seminar.id, e)}
                        className={`absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center rounded-full border ${
                          hasConflict 
                            ? 'bg-gray-100 text-gray-400 border-gray-300'
                            : expandedSeminarId === seminar.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-100 text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                        title={
                          hasConflict 
                            ? "Överlappar med valt seminarium" 
                            : expandedSeminarId === seminar.id
                              ? "Dölj detaljer"
                              : "Visa detaljer"
                        }
                        aria-label={
                          hasConflict 
                            ? "Överlappar med valt seminarium" 
                            : expandedSeminarId === seminar.id
                              ? "Dölj detaljer"
                              : "Visa detaljer"
                        }
                      >
                        {expandedSeminarId === seminar.id ? (
                          <ChevronUp size={10} />
                        ) : (
                          <ChevronDown size={10} />
                        )}
                      </button>
                      
                      {/* Seminar details */}
                      {expandedSeminarId === seminar.id && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{seminar.location}</span>
                          </div>
                          
                          {seminar.speakers && seminar.speakers.length > 0 && (
                            <div className="mb-2">
                              <div className="flex items-start gap-1 text-sm text-gray-600 mb-1">
                                <Users size={16} className="mt-0.5 flex-shrink-0" />
                                <span className="font-medium">Föreläsare:</span>
                              </div>
                              <div className="flex -space-x-2 overflow-hidden ml-6 mb-2">
                                {seminar.speakers.slice(0, 3).map((speaker, idx) => (
                                  speaker.name && (
                                    <div key={idx} className="relative z-0" style={{ zIndex: 10 - idx }}>
                                      {speaker.image_url ? (
                                        <img 
                                          src={speaker.image_url} 
                                          alt={speaker.name}
                                          className="w-8 h-8 rounded-full border border-white object-cover"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                                          !speaker.image_url ? 'flex' : 'hidden'
                                        }`}
                                        style={{ 
                                          backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
                                          display: speaker.image_url ? 'none' : 'flex'
                                        }}
                                      >
                                        {getInitials(speaker.name)}
                                      </div>
                                    </div>
                                  )
                                ))}
                                {seminar.speakers.length > 3 && (
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white bg-gray-400 border border-white"
                                  >
                                    +{seminar.speakers.length - 3}
                                  </div>
                                )}
                              </div>
                              <ul className="pl-6 text-sm text-gray-600">
                                {seminar.speakers.slice(0, 3).map((speaker, index) => (
                                  speaker.name && (
                                    <li key={index} className="mb-1">
                                      {speaker.name}
                                      {speaker.title && ` (${speaker.title})`}
                                    </li>
                                  )
                                ))}
                                {seminar.speakers.length > 3 && (
                                  <li>+ {seminar.speakers.length - 3} till...</li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {seminar.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              <p className="line-clamp-3">{seminar.description}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {seminar.metadata?.Språk && (
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                                {seminar.metadata.Språk}
                              </span>
                            )}
                            
                            {seminar.metadata?.Ämne && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 rounded">
                                {seminar.metadata.Ämne}
                              </span>
                            )}
                            
                            {seminar.metadata?.Kunskapsnivå && (
                              <span className="inline-block px-2 py-1 text-xs bg-green-100 rounded">
                                {seminar.metadata.Kunskapsnivå}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => {
                                const timeSlot = seminar.date_time.split(activeDay)[1].trim();
                                if (!checkSeminarConflict(seminar) || selectedSeminars[timeSlot] === seminar.id) {
                                  toggleSeminarSelection(timeSlot, seminar.id);
                                }
                                toggleSeminarDetails(seminar.id);
                              }}
                              className={`px-3 py-1 rounded-md text-sm ${
                                selectedSeminars[seminar.date_time.split(activeDay)[1].trim()] === seminar.id
                                  ? "bg-blue-600 text-white"
                                  : checkSeminarConflict(seminar)
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white"
                              }`}
                              disabled={checkSeminarConflict(seminar) && 
                                selectedSeminars[seminar.date_time.split(activeDay)[1].trim()] !== seminar.id}
                            >
                              {selectedSeminars[seminar.date_time.split(activeDay)[1].trim()] === seminar.id
                                ? "Avmarkera"
                                : checkSeminarConflict(seminar)
                                  ? "Tid överlappar med annat valt seminarium"
                                  : "Lägg till i schema"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
