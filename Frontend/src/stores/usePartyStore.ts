import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ILocation {
  longitude: number;
  latitude: number;
}

interface TravelState {
  departuresName?: string;
  departuresLocation?: ILocation;
  arrivalsName?: string;
  arrivalsLocation?: ILocation;
  setDepartures?: (name: string, location: ILocation) => void;
  setArrivals?: (name: string, location: ILocation) => void;
}

const usePartyStore = create(
  persist<TravelState>(
    set => ({
      departuresName: '',
      departuresLocation: { longitude: 0.0, latitude: 0.0 },
      arrivalsName: '도착지를 설정해 주세요.',
      arrivalsLocation: { longitude: 0.0, latitude: 0.0 },
      setDepartures: (name, location) =>
        set(() => ({ departuresName: name, departuresLocation: location })),
      setArrivals: (name, location) =>
        set(() => ({ arrivalsName: name, arrivalsLocation: location })),
    }),
    {
      name: 'RsvParty',
      storage: {
        getItem: name => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          const stringValue = JSON.stringify(value);
          localStorage.setItem(name, stringValue);
        },
        removeItem: name => localStorage.removeItem(name),
      },
    },
  ),
);

export default usePartyStore;
