import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ILocation } from '@/types/Map';

interface IAutoMatchState {
  isAutoMatch: boolean;
  depName?: string;
  depLoc?: ILocation;
  arrName?: string;
  arrLoc?: ILocation;
  setIsAutoMatch: (isAutoMatch: boolean) => void;
  setDep?: (name: string, location: ILocation) => void;
  setArr?: (name: string, location: ILocation) => void;
}

const usePartyStore = create(
  persist<IAutoMatchState>(
    set => ({
      isAutoMatch: false,
      depName: '',
      depLoc: { longitude: 0.0, latitude: 0.0 },
      arrName: '도착지를 설정해 주세요.',
      arrLoc: { longitude: 0.0, latitude: 0.0 },
      setIsAutoMatch: (isAutoMatch: boolean) => set(() => ({ isAutoMatch })),
      setDep: (name, location) => set(() => ({ depName: name, depLoc: location })),
      setArr: (name, location) => set(() => ({ arrName: name, arrLoc: location })),
    }),
    {
      name: 'RsvAutoParty',
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
