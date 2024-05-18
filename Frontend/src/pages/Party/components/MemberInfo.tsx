import { useEffect, useState } from 'react';
import jwtAxios from '@/utils/JWTUtil';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from '@/context/webSocketProvider';
import { getCookie } from '@/utils/CookieUtil';
import { IParticipant } from '@/types/Party';
interface IMemberInfoProps {
  hostName: string;
  hostGender: string;
  hostAge: string;
  hostImgUrl: string;
  hostBrix: number;
  participants: any;
  guests: any;
  role: string;
  partyId: number;
  roomId: string;
}

const MemberInfo: React.FC<IMemberInfoProps & { fetchData: () => void }> = ({
  hostName,
  hostGender,
  hostAge,
  hostImgUrl,
  hostBrix,
  participants,
  guests,
  role,
  partyId,
  roomId,
  fetchData,
}) => {
  const [userId, setUserId] = useState<number | null>(null);
  const { client, isConnected } = useWebSocket();

  useEffect(() => {
    const myData = localStorage.getItem('User');
    if (myData) {
      const userData = JSON.parse(myData);
      setUserId(userData.state.id); // 상태 업데이트
    }
  }, []);

  // 개인 알림 보내주는 거
  const handleSendAlarm = (type: string, id: number) => {
    if (client && client.connected) {
      client.publish({
        destination: `/pub/notification/${id}`,
        body: JSON.stringify({
          partyId: partyId,
          type: type,
        }),
        headers: {
          token: `${getCookie('Authorization')}`,
        },
      });
    } else {
      alert('서버와의 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
    }
  };
  // 채팅 보내주는거
  const handleSendMessage = (type: string, nickname: string, memberId: number) => {
    if (client && client.connected) {
      client?.publish({
        destination: `/pub/chat/message`,
        body: JSON.stringify({
          partyId: partyId,
          roomId: roomId,
          type,
          targetId: memberId,
        }),
        headers: {
          token: `${getCookie('Authorization')}`,
        },
      });
    } else {
      alert('서버와의 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 파티 신청 수락
  const acceptEnterParty = (memberId: number, nickname: string) => () => {
    jwtAxios
      .put(`api/parties/${partyId}/${memberId}`, {})
      .then(res => {
        console.log(res.data);
        if (res.data.status === 201) {
          toast.success(`${res.data.message}`, { position: 'top-center' });
          handleSendMessage('ENTER', nickname, memberId);
          handleSendAlarm('ACCEPT', memberId);
        }
        fetchData();
      })
      .catch(err => {
        console.error(err);
      });
  };

  // 파티 신청 거절
  const rejectEnterParty = (memberId: number) => () => {
    jwtAxios
      .delete(`api/parties/${partyId}/${memberId}`, {})
      .then(res => {
        console.log(res.data);
        if (res.data.status === 204) {
          toast.success(`${res.data.message}`, { position: 'top-center' });
          handleSendAlarm('REJECT', memberId);
        }
        fetchData();
      })
      .catch(err => {
        console.error(err);
      });
  };

  // 파티원 추방
  const banParticipant = (memberId: number, nickname: string) => () => {
    jwtAxios
      .delete(`api/parties/${partyId}/${memberId}`, {})
      .then(res => {
        console.log(res.data);
        if (res.data.status === 204) {
          toast.success(`${res.data.message}`, { position: 'top-center' });
          handleSendMessage('KICK', nickname, memberId);
          handleSendAlarm('KICK', memberId);
        }
        fetchData();
      })
      .catch(err => {
        console.error(err);
      });
  };

  // 파티원 목록
  const participantsList = participants
    .filter((person: IParticipant) => person.role !== 'ORGANIZER')
    .map((person: IParticipant) => (
      <li className='flex justify-between my-4' key={person.id}>
        <div className='flex gap-x-2 items-center'>
          <img className='rounded-full w-10 h-10' src={person.profileImage} alt='' />
          <div className='mx-4 font-bold flex flex-col gap-x-2'>
            <p>{person.nickname}</p>
            <div className='flex gap-x-1'>
              <div
                className={`badge text-white ${person.gender === 'M' ? 'bg-blue-500' : 'bg-red-500'}`}>
                {person.gender === 'M' ? '남' : '여'}
              </div>
              <div className='badge bg-purple-400 text-white'>{person.ageGroup}</div>
            </div>
          </div>
        </div>
        <div className='w-max'>
          <p className='text-xl font-bold'>당도</p>
          <p className='font-bold'>{person.brix.toFixed(1)}° Bx</p>
          <div className='w-full'>
            <progress
              className='progress progress-error w-full bg-purple-100'
              value={person.brix}
              max='100'></progress>
          </div>
        </div>
        {role === 'ORGANIZER' && ( // role이 'ORGANIZER'일 때만 버튼 렌더링
          <div className='content-center'>
            <div className='content-center'>
              <button
                onClick={banParticipant(person.id, person.nickname)}
                className='content-center w-16 h-10 rounded bg-red-500 text-white'>
                <p className='content-center text-center'>추방하기</p>
              </button>
            </div>
          </div>
        )}
        {person.id === userId && (
          <div className='content-center'>
            <div className='content-center rounded-full w-10 h-10 bg-purple-100'>
              <p className='content-center text-center '>나</p>
            </div>
          </div>
        )}
      </li>
    ));

  // 팟장에게 보일 파티 신청자 목록
  const applicantList = guests?.map((applicant: IParticipant) => (
    <li className='flex justify-between my-2' key={applicant.id}>
      <div className='user-profile flex gap-x-4 items-center'>
        <img src={applicant.profileImage} alt='user-img' className='rounded-full w-10 h-10' />
        <div className=' font-bold'>
          <div>{applicant.nickname}</div>
          <div className='flex'>
            <div
              className={`badge text-white ${applicant.gender === 'M' ? 'bg-blue-500' : 'bg-red-500'}`}>
              {applicant.gender === 'M' ? '남' : '여'}
            </div>
            <div className='badge bg-'>{applicant.ageGroup}</div>
          </div>
        </div>
      </div>
      <div className='w-max'>
        <p className='text-xl font-bold'>당도</p>
        <p className='font-bold'>{hostBrix.toFixed(1)}° Bx</p>
        <div className='w-full'>
          <progress
            className='progress progress-error w-full bg-purple-100'
            value={hostBrix}
            max='100'></progress>
        </div>
      </div>
      {role === 'ORGANIZER' && (
        <div className='flex items-center gap-x-2'>
          <button
            onClick={acceptEnterParty(applicant.id, applicant.nickname)}
            className='btn btn-info btn-square rounded  text-white'>
            <p>수락</p>
          </button>
          <button
            onClick={rejectEnterParty(applicant.id)}
            className='btn btn-error btn-square rounded bg-red-500 text-white'>
            거절
          </button>
        </div>
      )}
    </li>
  ));

  return (
    <div className='container p-2'>
      <div className='host-info mb-5'>
        <div className='flex justify-between items-center'>
          <p className='font-bold text-xl'>팟장</p>
          {role === 'ORGANIZER' && (
            <span className='flex items-center justify-center h-10 w-10 rounded-full bg-blue-100'>
              나
            </span>
          )}
        </div>

        <div className='card card-side'>
          <figure className='w-1/3'>
            <img className='' src={hostImgUrl} alt='hostImg' />
          </figure>
          <div className='card-body p-4'>
            <h2 className='card-title'>{hostName}</h2>
            <div className='flex gap-x-2'>
              <div
                className={`badge text-white ${hostGender === 'M' ? 'bg-blue-500' : 'bg-red-500'}`}>
                {hostGender === 'M' ? '남' : '여'}
              </div>
              <div className='badge bg-purple-400 text-white'>{hostAge}</div>
            </div>
            <div className='justify-end'>
              <div className='w-full'>
                <p className='text-xl font-bold'>
                  당도 <span className='text-lg'>{hostBrix.toFixed(1)}° Bx</span>
                </p>

                <div className='w-full'>
                  <progress
                    className='progress progress-error w-full bg-purple-100'
                    value={hostBrix}
                    max='100'></progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='members'>
        <div className='mb-4 font-bold text-xl'>파티원</div>
        <div>
          {participantsList.length != 0 && <ul>{participantsList}</ul>}
          {participantsList.length == 0 && (
            <div className='h-56 flex justify-center '>
              <p className='content-center'>아직 파티원이 없어요</p>
            </div>
          )}
        </div>

        {/* 조회자가 팟장이고 파티신청자가 있으면 */}
        {applicantList && applicantList.length != 0 && (
          <div className='mt-4 mb-20'>
            <div>
              <p className='font-bold text-xl'>파티 신청자 목록</p>
            </div>
            <div className='p-1 mt-4 applicant-list'>
              <ul>{applicantList}</ul>
            </div>
          </div>
        )}
        {applicantList && applicantList.length == 0 && (
          <div className=' mt-4'>
            <div>
              <p className='font-bold text-xl'>매칭신청</p>
            </div>
            <div className='flex h-56 applicant-list justify-center items-center '>
              <p className='font-bold text-gray-400'>매칭 신청한 파티원이 없어요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MemberInfo;
