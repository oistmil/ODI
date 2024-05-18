import { ILocation } from '@/stores/usePartyStore';

interface IUser {
  id: number;
  role: 'ORGANIZER' | 'PARTICIPANT';
  nickname: string;
  gender: 'M' | 'F';
  ageGroup: string;
  profileImage?: string;
  brix?: number;
  isPaid?: boolean;
  paidAmount?: number | null;
  settleAmount?: number | null;
}

export interface IPartyHistory {
  id: number | null;
  title: string;
  category: string;
  state: string;
  arrivalsLocation: ILocation;
  arrivalsName: string;
  departuresDate: string;
  departuresLocation: Location;
  departuresName: string;
  genderRestriction: 'ANY' | 'M' | 'F';
  maxParticipants: number;
  currentParticipants: number;
  createAt: string;
  modifiedAt: string;
  organizer: IUser;
  partyMemberDTOList: IUser[];
}
