// Utility functions will go here

export const compressState = (state) => {
  const compressed = {
    s: state.selections,  // seminars
    f: {},               // filters
    d: state.day,        // day
    v: state.view        // view
  };
  
  // Only include non-empty filters
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value.length > 0) {
      compressed.f[key[0]] = value; // Use first letter of filter key
    }
  });
  
  return btoa(JSON.stringify(compressed));
};

export const decompressState = (compressed) => {
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
      view: state.v || 'list'
    };
  } catch (e) {
    console.error('Failed to decompress state:', e);
    return null;
  }
};

export const parseTimeToMinutes = (timeStr) => {
  const match = timeStr.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
};

export const parseDateTime = (dateTimeStr) => {
  const match = dateTimeStr.match(/([^\d]+\d+\s+\w+\s+\d{4})\s+(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (!match) return null;
  
  return {
    day: match[1],
    startTime: parseInt(match[2]) * 60 + parseInt(match[3]),
    endTime: parseInt(match[4]) * 60 + parseInt(match[5])
  };
};

export const doTimeRangesOverlap = (start1, end1, start2, end2) => {
  // Two time ranges overlap if one range's start is before the other's end
  // and that same range's end is after the other's start
  return start1 < end2 && end1 > start2;
};
