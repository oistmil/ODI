import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jwtAxios from '@/utils/JWTUtil';
import { getCookie } from '@/utils/CookieUtil';
import ReportModal from './components/ReportModal';

interface IInfo {
  partyId: number;
  roomId: string;
  title: string;
  currentParticipants: number;
  departuresName: string;
  arrivalsName: string;
  departuresDate: string;
  state: string;
  me: {
    id: number;
    role: string;
    nickname: string;
    gender: string;
    ageGroup: string;
    profileImage: string;
    isPaid: boolean;
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

const ChatDetailPage = () => {
  const { partyId } = useParams();
  const [info, setInfo] = useState<IInfo>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const nav = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const toggleisReportModal = () => setIsReportModalOpen(!isReportModalOpen);
  const [reportedId, setReportedId] = useState(0);

  const fetchData = async () => {
    await jwtAxios
      .get(`api/party-boards/${partyId}/chat-info`, {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
        },
      })
      .then(res => {
        // console.log(res.data);
        setInfo(res.data.data);
      })
      .catch(err => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      });

    setIsLoading(false);
  };

  function goBack() {
    nav(-1);
  }

  function Report(memberId: number) {
    setReportedId(memberId);
    toggleisReportModal();
  }

  const organizer = (
    <div className='flex justify-between'>
      <div className='flex gap-x-2 items-center'>
        <img className='rounded-full w-12 h-12' src={info?.organizer.profileImage} alt='' />
        <p className='font-bold'>팟장</p>
        <p>{info?.organizer.nickname}</p>
        <p>{info?.organizer.gender === 'M' ? '남' : '여'}</p>
        <p>{info?.organizer.ageGroup}</p>
      </div>
      <div className='content-center'>
        {info?.organizer.id && info?.organizer.id !== info?.me.id && (
          <button
            onClick={() => Report(info.organizer.id)}
            className='ml-2 py-1 px-3 rounded bg-red-500 text-white'>
            신고하기
          </button>
        )}
      </div>
    </div>
  );

  const myInfo = (
    <div className='flex justify-between'>
      <div className='flex gap-x-2 items-center'>
        <img className='rounded-full w-12 h-12' src={info?.me.profileImage} alt='' />
        <p className='font-bold'>나</p>
        <p>{info?.me.nickname}</p>
        <p>{info?.me.gender === 'M' ? '남' : '여'}</p>
        <p>{info?.me.ageGroup}</p>
      </div>
      <div className='content-center'></div>
    </div>
  );

  // 파티원 목록
  const participantsList = info?.participants.map(person => (
    <li className='flex justify-between ' key={person.id}>
      <div className='flex gap-x-2 items-center'>
        <img className='rounded-full w-12 h-12' src={person.profileImage} alt='' />
        <p>{person.nickname}</p>
        <p>{person.gender === 'M' ? '남' : '여'}</p>
        <p>{person.ageGroup}</p>
      </div>
      <div className='content-center'>
        <button
          onClick={() => Report(person.id)}
          className='ml-2 py-1 px-3 rounded bg-red-500 text-white'>
          신고하기
        </button>
      </div>
      {/* {person.id === userId && (
        <div className='content-center text-center rounded-full w-10 bg-blue-100'>
          <p className='content-center text-center '>나</p>
        </div>
      )} */}
    </li>
  ));

  useEffect(() => {
    if (!info) {
      fetchData();
    }
  }, []);

  if (isLoading)
    return (
      <div className='flex h-screen justify-center'>
        <span className='loading loading-ball loading-xs'></span>
        <span className='loading loading-ball loading-sm'></span>
        <span className='loading loading-ball loading-md'></span>
        <span className='loading loading-ball loading-lg'></span>
      </div>
    );
  if (error) return <p>{error}에런디유? 다시 시도해봐유 </p>;

  return (
    <div className='party-info-page'>
      <div className='flex items-center justify-between'>
        <button onClick={goBack} className='btn btn-ghost btn-circle text-3xl'>
          {'<'}
        </button>

        <p className='font-bold text-xl flex-grow text-center'>팟정보</p>
        <div style={{ width: 48 }}> </div>
      </div>

      <div className='p-4'>
        <div className='participants-list'>
          <p className='font-bold text-xl'>
            참여자 <span className='ml-2 text-gray-200 text-lg'>{info?.currentParticipants}명</span>
          </p>
          <div className='mt-4'>{organizer}</div>
          <div className='mt-4'>{info?.organizer.id != info?.me.id && myInfo}</div>
          <div className='mt-4'>{participantsList}</div>
        </div>
      </div>
      <div className='divider'></div>
      {isReportModalOpen && (
        <ReportModal
          partyId={partyId}
          reportedId={reportedId}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatDetailPage;
