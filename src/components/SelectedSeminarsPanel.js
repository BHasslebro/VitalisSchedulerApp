import React from 'react';
import { MapPin, X, Clock, Info } from 'lucide-react';

const SelectedSeminarsPanel = ({ 
  selectedSeminars, 
  seminars, 
  toggleSeminarSelection,
  isFullView = false
}) => {
  if (Object.keys(selectedSeminars).length === 0) {
    return null;
  }

  // Function to format time slot by removing month and year
  const formatTimeSlot = (timeSlot) => {
    // Extract just the time part (e.g., "15:00 - 17:00" from "maj 2025 15:00 - 17:00")
    const match = timeSlot.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
    return match ? match[0] : timeSlot;
  };

  // Function to get seminar date and time for sorting
  const getSeminarDateTime = (timeSlot, seminarId) => {
    const seminar = seminars.find(s => s.id === seminarId);
    if (!seminar) return { date: '', time: 0 };
    
    // Extract date parts for sorting
    const dateMatch = seminar.date_time.match(/([^\d]+)(\d+)\s+(\w+)\s+(\d{4})/);
    const dayOfWeek = dateMatch ? dateMatch[1].trim() : '';
    const dayNumber = dateMatch ? parseInt(dateMatch[2]) : 0;
    const month = dateMatch ? dateMatch[3] : '';
    const year = dateMatch ? parseInt(dateMatch[4]) : 0;
    
    // Get month number for sorting
    const monthMap = {
      'januari': 1, 'februari': 2, 'mars': 3, 'april': 4, 'maj': 5, 'juni': 6,
      'juli': 7, 'augusti': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
    };
    const monthNumber = monthMap[month.toLowerCase()] || 0;
    
    // Extract time for sorting
    const timeMatch = timeSlot.match(/(\d{2}):(\d{2})/);
    const minutes = timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : 0;
    
    return {
      date: `${year}-${monthNumber.toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`,
      time: minutes
    };
  };

  // Group seminars by date for the full view
  const groupSeminarsByDate = () => {
    const grouped = {};
    
    Object.entries(selectedSeminars).forEach(([timeSlot, seminarId]) => {
      const seminar = seminars.find(s => s.id === seminarId);
      if (!seminar) return;
      
      // Extract date from seminar.date_time
      const dateMatch = seminar.date_time.match(/([^\d]+)(\d+)\s+(\w+)\s+(\d{4})/);
      if (!dateMatch) return;
      
      const dayOfWeek = dateMatch[1].trim();
      const dayNumber = dateMatch[2];
      const month = dateMatch[3];
      const year = dateMatch[4];
      const dateStr = `${dayOfWeek} ${dayNumber} ${month} ${year}`;
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      
      grouped[dateStr].push({ timeSlot, seminarId });
    });
    
    return grouped;
  };

  const renderSeminarItem = (timeSlot, seminarId, showDate = true) => {
    const seminar = seminars.find(s => s.id === seminarId);
    
    if (!seminar) return null;
    
    // Extract date from seminar.date_time
    const dateMatch = seminar.date_time.match(/([^\d]+)(\d+)\s+\w+\s+\d{4}/);
    const dayOfWeek = dateMatch ? dateMatch[1].trim() : '';
    const dayNumber = dateMatch ? dateMatch[2] : '';
    const dateStr = dayOfWeek && dayNumber ? `${dayOfWeek} ${dayNumber}` : '';
    
    return (
      <div key={timeSlot} className={`flex flex-col sm:flex-row sm:items-start gap-2 p-3 bg-white rounded border border-gray-200 ${isFullView ? 'mb-3' : ''}`}>
        <div className="font-medium text-blue-800 w-32 flex-shrink-0">
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            {formatTimeSlot(timeSlot)}
          </div>
          {showDate && dateStr && <div className="text-sm text-gray-600 mt-1">{dateStr}</div>}
        </div>
        <div className="flex-grow">
          <h3 className="font-medium">{seminar.title}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <MapPin size={14} /> {seminar.location}
          </p>
          
          {isFullView && seminar.description && (
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 flex items-center gap-1">
                  <Info size={14} />
                  Visa beskrivning
                </summary>
                <p className="mt-2 text-gray-700 p-2 bg-gray-50 rounded">
                  {seminar.description}
                </p>
              </details>
            </div>
          )}
          
          {isFullView && seminar.speakers && seminar.speakers.length > 0 && (
            <div className="mt-2 text-sm text-gray-700">
              <strong>Talare:</strong> {seminar.speakers.map(s => s.name).filter(Boolean).join(', ')}
            </div>
          )}
          
          {isFullView && seminar.metadata && (
            <div className="mt-2 flex flex-wrap gap-1">
              {seminar.metadata.Språk && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                  {seminar.metadata.Språk}
                </span>
              )}
              {seminar.metadata.Ämne && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 rounded">
                  {seminar.metadata.Ämne}
                </span>
              )}
              {seminar.metadata.Kunskapsnivå && (
                <span className="inline-block px-2 py-1 text-xs bg-green-100 rounded">
                  {seminar.metadata.Kunskapsnivå}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => toggleSeminarSelection(timeSlot, seminarId)}
          className="self-end sm:self-start text-red-500 hover:text-red-700 p-1"
          title="Ta bort från schema"
        >
          <X size={18} />
        </button>
      </div>
    );
  };

  // Render the full view with seminars grouped by date
  if (isFullView) {
    const groupedSeminars = groupSeminarsByDate();
    
    return (
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-6 text-blue-800">Mitt schema</h2>
        
        {Object.entries(groupedSeminars).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, seminars]) => (
          <div key={date} className="mb-8">
            <h3 className="text-lg font-medium mb-3 pb-2 border-b border-gray-200">{date}</h3>
            <div className="space-y-3">
              {seminars.sort((a, b) => {
                const seminarA = getSeminarDateTime(a.timeSlot, a.seminarId);
                const seminarB = getSeminarDateTime(b.timeSlot, b.seminarId);
                return seminarA.time - seminarB.time;
              }).map(({ timeSlot, seminarId }) => renderSeminarItem(timeSlot, seminarId, false))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render the compact summary view
  return (
    <div className="mt-10 p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h2 className="text-lg font-semibold mb-4 text-blue-800">Ditt schema</h2>
      
      <div className="space-y-4">
        {Object.entries(selectedSeminars).sort((a, b) => {
          // Sort by date first, then by time
          const seminarA = getSeminarDateTime(a[0], a[1]);
          const seminarB = getSeminarDateTime(b[0], b[1]);
          
          // Compare dates first
          if (seminarA.date !== seminarB.date) {
            return seminarA.date.localeCompare(seminarB.date);
          }
          
          // If dates are the same, compare times
          return seminarA.time - seminarB.time;
        }).map(([timeSlot, seminarId]) => renderSeminarItem(timeSlot, seminarId))}
      </div>
    </div>
  );
};

export default SelectedSeminarsPanel;
