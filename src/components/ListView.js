import React from 'react';
import { Clock, MapPin, Users, Check } from 'lucide-react';

const ListView = ({ 
  timeSlots, 
  getSeminarsForTimeSlot, 
  selectedSeminars, 
  toggleSeminarSelection, 
  checkSeminarConflict,
  activeDay}) => {
  
  // Function to format time slot by removing month and year
  const formatTimeSlot = (timeSlot) => {
    // Extract just the time part (e.g., "15:00 - 17:00" from "maj 2025 15:00 - 17:00")
    const match = timeSlot.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
    return match ? match[0] : timeSlot;
  };
  
  return (
    <div className="space-y-8">
      {timeSlots.map(slot => {
        const slotSeminars = getSeminarsForTimeSlot(slot.timeSlot);
        
        return (
          <div key={slot.timeSlot} className="border-b pb-6">
            <div className="flex items-center mb-4">
              <Clock size={20} className="text-blue-600 mr-2" />
              <div>
                <h2 className="text-lg font-semibold">{formatTimeSlot(slot.timeSlot)}</h2>
                {activeDay && <p className="text-sm text-gray-600">
                  {activeDay.split(' ')[0]} {activeDay.split(' ')[1]}
                </p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slotSeminars.map(seminar => {
                const isSelected = selectedSeminars[slot.timeSlot] === seminar.id;
                const hasConflict = checkSeminarConflict(seminar);
                
                return (
                  <div 
                    key={seminar.id} 
                    className={`p-4 rounded-lg border ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500' 
                        : hasConflict
                        ? 'bg-white opacity-50 cursor-not-allowed border-gray-200'
                        : 'bg-white hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-grow pr-2">
                        <h3 className={`font-medium mb-2 ${
                          hasConflict ? 'text-gray-500' : 'text-blue-800'
                        }`}>{seminar.title}</h3>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <button 
                          onClick={() => !hasConflict && toggleSeminarSelection(slot.timeSlot, seminar.id)}
                          className={`p-1 rounded-full ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : hasConflict
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          disabled={hasConflict}
                          title={
                            hasConflict 
                              ? "Överlappar med valt seminarium" 
                              : isSelected 
                              ? "Avmarkera" 
                              : "Välj detta seminarium"
                          }
                        >
                          {isSelected ? (
                            <Check size={18} />
                          ) : (
                            <span className="block w-[18px] h-[18px]"></span>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{seminar.location}</span>
                    </div>
                    
                    {seminar.speakers && seminar.speakers.length > 0 && seminar.speakers[0].name && (
                      <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                        <Users size={16} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {seminar.speakers.slice(0, 2).map(s => s.name).filter(Boolean).join(', ')}
                          {seminar.speakers.length > 2 && ', ...'}
                        </span>
                      </div>
                    )}
                    
                    {seminar.metadata?.Språk && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                          {seminar.metadata.Språk}
                        </span>
                        
                        {seminar.metadata?.Ämne && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 rounded ml-1">
                            {seminar.metadata.Ämne}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
