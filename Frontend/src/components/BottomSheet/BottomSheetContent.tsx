import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IParty } from '@/types/Party';
import SvgRouteIcon from '@/assets/svg/SvgRouteIcon';
import SvgTimerIcon from '@/assets/svg/SvgTimerIcon';
import SvgParticipantsIcon from '@/assets/svg/SvgParticipantsIcon';
import PartyItemMap from '@/pages/Home/components/PartyItemMap';

interface IPartyListProps {
  partyList: IParty[];
}

export const categoryList: { [key: string]: string } = {
  DAILY: '일상',
  UNIVERSITY: '대학교',
  COMMUTE: '출퇴근',
  CONCERT: '콘서트',
  AIRPORT: '공항',
  TRAVEL: '여행',
  RESERVIST: '예비군',
  MATCHING: '자동매칭',
};

export const categoryColorList: { [key: string]: string } = {
  DAILY: 'border-OD_GREEN text-green-500 bg-OD_GREEN bg-opacity-30',
  UNIVERSITY: 'border-OD_JORDYBLUE text-OD_JORDYBLUE bg-OD_JORDYBLUE bg-opacity-30',
  COMMUTE: 'border-OD_YELLOW text-OD_ORANGE bg-OD_YELLOW bg-opacity-30',
  CONCERT: 'border-OD_PINK text-OD_PINK bg-OD_PINK bg-opacity-30',
  AIRPORT: 'border-OD_SKYBLUE text-gray-500 bg-OD_SKYBLUE bg-opacity-30',
  TRAVEL: 'border-OD_ORANGE text-OD_ORANGE bg-OD_ORANGE bg-opacity-30',
  RESERVIST: 'border-OD_SCARLET text-OD_SCARLET bg-OD_SCARLET bg-opacity-30',
  MATCHING: 'border-OD_SKYBLUE text-blue-500 bg-OD_SKYBLUE bg-opacity-30',
};

export const genderRestrictionList: { [key: string]: string } = {
  ANY: '성별무관',
  M: '남자만',
  F: '여자만',
};

export const partyStateList: { [key: string]: string } = {
  GATHERING: '모집중',
  COMPLETED: '모집 완료',
  SETTLING: '정산중',
  SETTLED: '정산완료',
};

export const stateColorList: { [key: string]: string } = {
  GATHERING: 'text-green-500 bg-OD_GREEN bg-opacity-30',
  COMPLETED: 'text-OD_ORANGE bg-OD_YELLOW bg-opacity-30',
  SETTLING: 'text-OD_JORDYBLUE bg-OD_JORDYBLUE bg-opacity-30',
  SETTLED: 'border-gray-200 bg-gray-200 text-gray-500',
};

// NOTE : 이용내역의 출발일 형식과 목록조회의 출발일 형식이 다름
// const formatDateString = (dateString: string) => {
//   const date = new Date(dateString);

//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   const hours = String(date.getHours()).padStart(2, '0');
//   const minutes = String(date.getMinutes()).padStart(2, '0');

//   return `${year}-${month}-${day} ${hours}:${minutes}`;
// };

export const calcDate = (dateString: string) => {
  // let convertedDate = dateString;
  // if (convertedDate.includes('T')) {
  //   convertedDate = formatDateString(dateString);
  // }
  // const date = new Date(convertedDate.replace(' ', 'T') + '+09:00');
  const date = new Date(dateString.replace(' ', 'T') + '+09:00');
  const now = new Date();

  const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;

  const elapsed = dateUTC - nowUTC;

  if (elapsed > 0) {
    const daysElapsed = Math.floor(elapsed / msPerDay);
    if (daysElapsed === 0) {
      return '오늘';
    } else if (daysElapsed === 1) {
      return '1일 후';
    } else if (daysElapsed < 7) {
      return `${daysElapsed}일 후`;
    } else if (daysElapsed < 30) {
      const weeksElapsed = Math.floor(daysElapsed / 7);
      return `${weeksElapsed}주 후`;
    } else {
      const monthsElapsed = Math.floor(daysElapsed / 30);
      return `${monthsElapsed}달 후`;
    }
  } else {
    const daysElapsed = Math.floor(Math.abs(elapsed) / msPerDay);
    if (daysElapsed === 0) {
      return '오늘';
    } else if (daysElapsed === 1) {
      return '1일 전';
    } else if (daysElapsed < 7) {
      return `${daysElapsed}일 전`;
    } else if (daysElapsed < 30) {
      const weeksElapsed = Math.floor(daysElapsed / 7);
      return `${weeksElapsed}주 전`;
    } else {
      const monthsElapsed = Math.floor(daysElapsed / 30);
      return `${monthsElapsed}달 전`;
    }
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString.replace(' ', 'T') + ':00');

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = daysOfWeek[date.getDay()];

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 (${dayOfWeek}) ${hours}:${minutes} 출발`;
};

const BottomSheetContent: React.FC<IPartyListProps> = ({ partyList }) => {
  const nav = useNavigate();
  const partyModalRef = useRef<HTMLDialogElement>(null);
  const [selectedParty, setSelectedParty] = useState<IParty | null>(null);

  const openModal = (party: IParty) => {
    setSelectedParty(party);
  };

  const closeModal = () => {
    setSelectedParty(null);
  };

  useEffect(() => {
    if (selectedParty && partyModalRef.current) {
      partyModalRef.current.showModal();
    } else if (!selectedParty && partyModalRef.current) {
      partyModalRef.current.close();
    }
  }, [selectedParty]);

  const totalData = partyList.length > 0;

  return (
    <>
      {totalData ? (
        partyList.map(party => (
          <div
            key={party.id}
            className='w-[100%] h-[50%] border rounded-xl my-5 p-3 cursor-pointer'
            onClick={() => openModal(party)}>
            <div className='w-[100%] h-[15%] flex items-center gap-4'>
              <div
                className={`py-[2px] px-1 border ${categoryColorList[party.category]} rounded-lg text-[13px] font-semibold`}>
                {categoryList[party.category]}
              </div>
              <div className='py-[2px] px-1 border border-gray-200 bg-gray-200 rounded-lg text-gray-500 text-[13px] font-semibold'>
                {genderRestrictionList[party.genderRestriction]}
              </div>
              <div className='py-[2px] px-1 text-gray-500 text-[13px] ml-auto '>
                {calcDate(party.departuresDate)}
              </div>
            </div>
            <div className='w-[100%] h-[25%] flex items-center text-[18px] font-bold'>
              {party.title}
            </div>
            <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
              <SvgRouteIcon />
              <div>{party.departuresName}</div>
              <div>{'->'}</div>
              <div>{party.arrivalsName}</div>
            </div>
            <div className='w-[100%] h-[15%] flex items-center gap-2 text-gray-500'>
              <SvgTimerIcon />
              <div>{formatDate(party.departuresDate)}</div>
            </div>
            <div className='w-[100%] h-[30%] flex items-center gap-4'>
              <div className='w-[40px] h-[40px] flex items-center rounded-full overflow-hidden'>
                <img src={party.organizer.profileImage} alt='파티장 프로필' />
              </div>
              <div
                className={`py-[2px] px-1 border ${stateColorList[party.state]} rounded-lg text-[13px] font-semibold`}>
                {partyStateList[party.state]}
              </div>
              <div className='w-[40%] h-[15%] flex justify-end items-center gap-2 text-gray-500 ml-auto mr-4'>
                <SvgParticipantsIcon />
                <div className='text-[13px]'>{`${party.currentParticipants} / ${party.maxParticipants}`}</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className='flex flex-col items-center justify-center mt-3 gap-6 w-[100%]'>
          <div className='text-lg text-gray-400'>게시글이 없습니다 :(</div>
        </div>
      )}

      {selectedParty && (
        <dialog ref={partyModalRef} className='modal'>
          <div className='modal-box w-11/12 h-[60%] bg-white flex flex-col'>
            <h3 className='font-bold text-black text-[20px]'>경로</h3>
            <div className='mt-1 border border-gray-300'></div>

            <div className='w-[100%] h-[100%] flex flex-col items-center'>
              <div className='w-[100%] h-[70%] mx-8 mt-8 rounded-xl flex flex-col items-center justify-center overflow-hidden'>
                <PartyItemMap
                  departuresLocation={selectedParty.departuresLocation}
                  arrivalsLocation={selectedParty.arrivalsLocation}
                />
              </div>

              <button
                className='btn mt-8 w-[40%] bg-OD_GREEN text-black font-bold border-none'
                onClick={() => nav(`/party/${selectedParty.id}`)}>
                자세히 보기
              </button>
            </div>

            <div className='modal-action'>
              <button
                className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5 text-black'
                onClick={closeModal}>
                ✕
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default BottomSheetContent;
