import React from 'react';
import { Calendar } from 'lucide-react';

const DaySelector = ({ days, activeDay, setActiveDay }) => {
  return (
    <div className="mb-6 overflow-x-auto flex items-center gap-2 pb-2">
      <Calendar className="text-blue-600 mr-2" size={20} />
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => setActiveDay(day.date)}
          className={`py-2 px-4 rounded-full whitespace-nowrap ${
            activeDay === day.date 
              ? 'bg-blue-600 text-white font-medium' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {day.dayName} {day.date.split(' ')[1]}
        </button>
      ))}
    </div>
  );
};

export default DaySelector;
