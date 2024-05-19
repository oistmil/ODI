export interface IChatInfo {
  partyId: number;
  roomId: string;
  title: string;
  currentParticipants: number;
  departuresName: string;
  arrivalsName: string;
  departuresDate: string;
  state: string;
  receiptImage: string | null;
  me: {
    id: number;
    role: string;
    nickname: string;
    gender: string;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
    paidAmount: number | null;
    settleAmount: number | null;
  };
  organizer: {
    id: number;
    role: string;
    nickname: string;
    gender: string;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
  };
  participants: {
    id: number;
    role: string;
    nickname: string;
    gender: string;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
  }[];
}
export interface IUser {
  id: number;
  role: string;
  nickname: string;
  gender: string;
  ageGroup: string;
  profileImage: string;
  isPaid: boolean;
  paidAmount: number | null;
  settleAmount: number | null;
}

export interface IMessage {
  senderNickname: string;
  content: string;
  timestamp: string; // 메시지 수신 또는 발신 시간
  senderImage: string;
  sendTime: string;
  type: string;
}

export interface IEvaluation {
  reviewee_id: number;
  kindScore: number;
  promiseScore: number;
  fastChatScore: number;
}
