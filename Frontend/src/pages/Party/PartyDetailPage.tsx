import { useNavigate, useParams, useLocation } from 'react-router-dom';
import MemberInfo from './components/MemberInfo';
import PartyInfo from './components/PartyInfo';
import PathMap from './components/PathMap';
import { useEffect, useState } from 'react';
import BottomButton from './components/BottomButton';
import jwtAxios from '@/utils/JWTUtil';
import { getCookie } from '@/utils/CookieUtil';
import TopNav from './components/TopNav';
import StateBadge from './components/StateBadge';
import { IInfo } from '@/types/Party';
import { useWebSocket } from '@/context/webSocketProvider';
import userStore from '@/stores/useUserStore';
import './partyDetail.css';

const PartyDetailPage = () => {
  const location = useLocation();
  const { from } = (location.state as { from: string }) || {};
  const { client, isConnected } = useWebSocket();
  const { id } = userStore();
  const { partyId } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<IInfo>({
    id: 0,
    roomId: '',
    createAt: '',
    modifiedAt: '',
    title: 'OD!',
    departuresName: 'OD!',
    departuresLocation: {
      latitude: 0,
      longitude: 0,
    },
    arrivalsName: 'OD!',
    arrivalsLocation: {
      latitude: 0,
      longitude: 0,
    },
    expectedCost: 0,
    expectedDuration: 0,
    departuresDate: '',
    currentParticipants: 0,
    maxParticipants: 0,
    category: '',
    genderRestriction: '',
    state: '',
    content: '',
    viewCount: 0,
    requestCount: 0,
    role: '',
    participants: [
      {
        id: 0,
        role: '',
        nickname: '',
        gender: '',
        ageGroup: '',
        brix: 30,
        profileImage: '',
        isPaid: false,
      },
    ],
    guests: [
      {
        id: 0,
        role: '0',
        nickname: '',
        brix: 30,
        gender: '0',
        ageGroup: '',
        profileImage: '',
        isPaid: false,
      },
    ],
    distance: 0,
    path: [
      [0, 0],
      [0, 0],
    ],
  });

  const [hostInfo, setHostInfo] = useState({
    id: 0,
    brix: 30,
    nickname: '',
    gender: '',
    ageGroup: '',
    profileImage: '',
  });

  // 파티 정보 에서 파티장 찾는거
  const FindHost = (participants: any) => {
    return participants.find((p: { role: string }) => p.role === 'ORGANIZER');
  };

  // 파티 정보 조회
  const fetchData = async () => {
    await jwtAxios
      .get(`api/party-boards/${partyId}`, {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
        },
      })
      .then(res => {
        console.log(res.data);
        const pathInfoObject = JSON.parse(res.data.data.pathInfo);
        const data = pathInfoObject.route.traoptimal[0].summary;
        const path = pathInfoObject.route.traoptimal[0].path;

        setInfo(prevInfo => ({
          ...prevInfo,
          ...res.data.data,
          expectedCost: data.taxiFare,
          expectedDuration: Math.floor(data.duration / 60000),
          path: path,
          distance: data.distance / 1000,
        }));

        setHostInfo(FindHost(res.data.data.participants));
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (client && client.connected) {
      const subscription = client.subscribe(
        `/sub/notification/${id}`,
        msg => {
          console.log(JSON.parse(msg.body));
          fetchData();
        },
        {
          token: `${getCookie('Authorization')}`,
        },
      );

      return () => subscription.unsubscribe();
    }
  }, [client, isConnected, partyId, fetchData]);

  // 날짜형태변환 "2024-05-10 15:34" -> 5월 10일 (요일) 오후 03:34
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  };

  // 현재시간과 글 생성시간과의 차이
  function formatTimeDifference(createAt: string) {
    const now: Date = new Date();
    const createdTime: Date = new Date(createAt);
    const timeDifference: number = now.getTime() - createdTime.getTime();
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
    const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference >= 1) {
      return `${daysDifference}일 전`;
    } else if (hoursDifference >= 1) {
      return `${hoursDifference}시간 전`;
    } else if (minutesDifference >= 1) {
      return `${minutesDifference}분 전`;
    } else {
      return '방금 전';
    }
  }

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
    <div className='container'>
      <TopNav
        role={info.role}
        state={info.state}
        partyId={partyId}
        roomId={info.roomId}
        title={info.title}
        currentParticipants={info.currentParticipants}
        expectedCost={info.expectedCost}
        fetchData={fetchData}
        from={from}
      />

      <div className='party-info justify-between p-4 mt-14'>
        <StateBadge state={info.state} category={info.category} />
        <p className='font-bold text-xl'>
          {info.category === 'MATCHING'
            ? `매칭시간 : ${formatDate(info.createAt)}`
            : formatDate(info.departuresDate)}
        </p>
      </div>
      <div className='divider m-0'></div>
      {/* <p>{formatTimeDifference(info.createAt)}</p>
      <p>조회수: {info.viewCount}</p> */}
      <div className='path-map p-4'>
        <PathMap
          departuresName={info.departuresName}
          arrivalsName={info.arrivalsName}
          departuresX={info.departuresLocation.latitude}
          departuresY={info.departuresLocation.longitude}
          arrivalsX={info.arrivalsLocation.latitude}
          arrivalsY={info.arrivalsLocation.longitude}
          distance={info.distance}
          path={info.path}
        />
      </div>
      <div className='h-5 bg-slate-100'></div>
      <div className=''>
        <PartyInfo
          category={info.category}
          state={info.state}
          currentParticipants={info.currentParticipants}
          maxParticipants={info.maxParticipants}
          departuresDate={info.departuresDate}
          expectedCost={info.expectedCost}
          expectedTime={info.expectedDuration}
          content={info.content}
          genderRestriction={info.genderRestriction}
          hostName={hostInfo.nickname}
          hostImgUrl={hostInfo.profileImage}
        />
      </div>
      <div className='h-5 bg-slate-100'></div>

      <div className=''>
        <MemberInfo
          hostName={hostInfo.nickname}
          hostGender={hostInfo.gender}
          hostAge={hostInfo.ageGroup}
          hostImgUrl={hostInfo.profileImage}
          hostBrix={hostInfo.brix}
          participants={info.participants}
          guests={info.guests}
          role={info.role}
          partyId={info.id}
          roomId={info.roomId}
          fetchData={fetchData}
        />
      </div>

      <div className='divider h-16'></div>
      <BottomButton
        state={info.state}
        role={info.role}
        partyId={partyId}
        roomId={info.roomId}
        expectedCost={info.expectedCost}
        fetchData={fetchData}
        hostGender={hostInfo.gender}
        hostId={hostInfo.id}
        genderRestriction={info.genderRestriction}
      />
    </div>
  );
};
export default PartyDetailPage;
