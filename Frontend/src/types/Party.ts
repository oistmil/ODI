import { ILocation } from '@/stores/usePartyStore';

export interface IPlaceInfo {
  buildingName?: string | null;
  geoPoint?: {
    latitude: number;
    longitude: number;
  };
  id?: string;
  distance?: number;
  jibunAddress?: string;
  majorCategory?: string;
  placeName?: string | null;
  postalCode?: number;
  roadNameAddress?: string;
  sido?: string;
  sigungu?: string;
  subCategory?: string;
}

export interface IPostParty {
  title: string;
  departuresName: string;
  departuresLocation: ILocation;
  arrivalsName: string;
  arrivalsLocation: ILocation;
  departuresDate: string;
  maxParticipants: number;
  category: string;
  genderRestriction: boolean;
  content?: string;
}

export interface IInfo {
  id: number;
  roomId: string;
  createAt: string;
  modifiedAt: string;
  title: string;
  departuresName: string;
  departuresLocation: {
    latitude: number;
    longitude: number;
  };
  arrivalsName: string;
  arrivalsLocation: {
    latitude: number;
    longitude: number;
  };
  expectedCost: number;
  expectedDuration: number;
  departuresDate: string;
  currentParticipants: number;
  maxParticipants: number;
  category: string;
  genderRestriction: string;
  state: string;
  content: string;
  viewCount: number;
  requestCount: number;
  role: string;
  participants: {
    id: number;
    role: string;
    nickname: string;
    brix: number;
    gender: string;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
  }[];
  guests: {
    id: number;
    role: string;
    nickname: string;
    gender: string;
    brix: number;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
  }[];
  distance: number;
  path: number[][];
}

export interface IParticipant {
  id: number;
  role: string;
  nickname: string;
  brix: number;
  gender: string;
  ageGroup: string;
  profileImage: string;
  isPaid: boolean;
}

/**
 * @description
 * 파티 조회 - 파티장 정보 타입
 * */
export interface IOrganizer {
  ageGroup: string;
  brix: number;
  gender: string;
  id: number;
  isPaid: boolean;
  nickname: string;
  paidAmount: number | null;
  profileImage: string;
  role: string;
  settleAmount: number | null;
}

/**
 * @description
 * 파티 조회 - 파티 정보 타입
 * */
export interface IParty {
  id: number;
  distance: number;
  category: string;
  genderRestriction: string;
  createAt: string;
  currentParticipants: number;
  departuresDate: string;
  departuresLocation: ILocation;
  departuresName: string;
  arrivalsLocation: ILocation;
  arrivalsName: string;
  maxParticipants: number;
  modifiedAt: string;
  organizer: IOrganizer;
  requestCount: number;
  roomId: string;
  state: string;
  title: string;
  viewCount: number;
}

/**
 * @description
 * 파티 조회 - 페이지 정보 타입
 * */
export interface IPageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * @description
 * 파티 조회 - 응답 타입
 * */
export interface IPartyListResponse {
  content: IParty[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: IPageable;
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  message: string;
  status: number;
}
