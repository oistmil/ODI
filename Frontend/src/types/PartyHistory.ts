import { ILocation } from '@/stores/usePartyStore';

interface IUser {
  id: number;
  role: string;
  nickname: string;
  gender: string;
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
  departuresLocation: ILocation;
  departuresName: string;
  genderRestriction: string;
  maxParticipants: number;
  currentParticipants: number;
  createAt: string;
  modifiedAt: string;
  organizer: IUser;
  partyMemberDTOList: IUser[];
}
