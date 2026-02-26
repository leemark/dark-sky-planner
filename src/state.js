/**
 * Central application state + simple event emitter.
 */

import { todayISO } from './utils/time.js';

const listeners = {};

const state = {
  location: null,     // { lat, lng, name } or null
  date: todayISO(),   // ISO date string YYYY-MM-DD
  timezone: 'UTC',    // IANA timezone string from tz-lookup
  nightData: null,    // computed NightCalculation object or null

  on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => {
      listeners[event] = listeners[event].filter(f => f !== cb);
    };
  },

  emit(event, payload) {
    (listeners[event] || []).forEach(cb => cb(payload));
  },

  setLocation(loc) {
    this.location = loc;
    this.emit('change');
  },

  setDate(isoDate) {
    this.date = isoDate;
    this.emit('change');
  },

  setNightData(data) {
    this.nightData = data;
    this.emit('change');
  },
};

export default state;
