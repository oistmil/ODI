import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtAxios from '@/utils/JWTUtil';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from '@/context/webSocketProvider';
import { getCookie } from '@/utils/CookieUtil';

interface IButtonProps {
  state: string;
  role: string;
  partyId: string | undefined;
  roomId: string;
  expectedCost: number;
  hostGender: string;
  hostId: number;
  genderRestriction: string;
}

const Button: React.FC<IButtonProps & { fetchData: () => void }> = ({
  state,
  role,
  partyId,
  roomId,
  expectedCost,
  hostGender,
  hostId,
  genderRestriction,
  fetchData,
}) => {
  const nav = useNavigate();
  const { client, isConnected } = useWebSocket();
  const [gender, setGender] = useState<string | undefined>();
  const [myNickName, setMyNickName] = useState('');
  const [myId, setMyID] = useState(0);

  useEffect(() => {
    const userDataJSON = localStorage.getItem('User');
    if (userDataJSON) {
      const userData = JSON.parse(userDataJSON);
      const nickname = userData?.state?.nickname;
      const id = userData?.state?.id;
      const userGender = userData?.state?.gender;
      setGender(userGender);
      setMyNickName(nickname);
      setMyID(id);
    }
  }, []);

  // 개인알림 보내주는거
  const handleSendAlarm = (type: string) => {
    if (client && client.connected) {
      client.publish({
        destination: `/pub/notification/${hostId}`,
        body: JSON.stringify({
          partyId: partyId,
          content: `${myNickName}님이 파티 참여를 요청했어요!`,
          type,
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
  const handleSendMessage = (type: string) => {
    if (client && client.connected) {
      client?.publish({
        destination: `/pub/chat/message`,
        body: JSON.stringify({
          partyId: partyId,
          roomId: roomId,
          type,
        }),
        headers: {
          token: `${getCookie('Authorization')}`,
        },
      });
    } else {
      alert('서버와의 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  function RequestDisplay() {
    return (
      <div className=''>
        <div className='text-center font-bold'>
          <p>매칭 신청 완료</p>
          <p>팟장에게 매칭 신청 알림을 보냈어요</p>
        </div>
      </div>
    );
  }

  // 동승 참여 요청
  function RequestMatching() {
    jwtAxios
      .post(`api/parties/${partyId}`, {})
      .then(res => {
        // console.log(res.data);
        if (res.data.status === 201) {
          toast(<RequestDisplay />);
          handleSendAlarm('APPLY');
        }
        fetchData();
      })
      .catch(err => {
        console.log(err);
      });
  }
  // 동승 참여 요청 취소
  function CancelMatching() {
    jwtAxios
      .delete(`api/parties/${partyId}`)
      .then(res => {
        // console.log(res);
        if (res.data.status === 204) {
          toast.success(`${res.data.message}`, { position: 'top-center' });
          if (role === 'PARTICIPANT') {
            handleSendMessage('QUIT');
            handleSendAlarm('QUIT');
          } else {
            handleSendAlarm('QUIT');
          }
        }
        fetchData();
      })
      .catch(err => {
        console.log(err);
        fetchData();
        toast.error(`${err.data.message}`, { position: 'top-center' });
      });
  }

  // 채팅방으로 routing
  function GoChat() {
    nav(`/party/chat/${partyId}`);
  }

  let buttonComponent;

  if (state === 'GATHERING') {
    if (role === 'ORGANIZER') {
      buttonComponent = (
        <div>
          <button
            onClick={GoChat}
            className='btn w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4'>
            <p>팟 채팅</p>
          </button>
        </div>
      );
    } else if (role === 'PARTICIPANT') {
      buttonComponent = (
        <div className='flex justify-between gap-x-4'>
          <button
            onClick={GoChat}
            className='w-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
            <p>팟 채팅</p>
          </button>
          <button
            onClick={CancelMatching}
            className='w-1/2 bg-gray-200 hover:bg-gray-700 text-purple font-bold py-2 px-4 rounded'>
            <p>파티 나가기</p>
          </button>
        </div>
      );
    } else if (role === null) {
      if (genderRestriction === 'ANY' || (genderRestriction !== 'ANY' && gender === hostGender)) {
        buttonComponent = (
          <div>
            <button onClick={RequestMatching} className='btn btn-block h-12 bg-blue-600 text-white'>
              <p>매칭 신청하기</p>
            </button>
          </div>
        );
      } else {
        buttonComponent = (
          <div className=''>
            <button className='btn btn-ghost btn-block no-animation btn-disabled'>
              같은 성별끼리만 매칭이 가능해요
            </button>
          </div>
        );
      }
    } else if (role === 'REQUESTER') {
      buttonComponent = (
        <div>
          <button onClick={CancelMatching} className='btn btn-block h-12 bg-red-600 text-white'>
            <p>신청 취소하기</p>
          </button>
        </div>
      );
    }
  } else if (state === 'COMPLETED') {
    if (role === 'ORGANIZER' || role === 'PARTICIPANT') {
      buttonComponent = (
        <div className='flex justify-between'>
          <button
            onClick={GoChat}
            className='btn btn-block bg-blue-500 hover:bg-blue-700 text-white font-bold '>
            <p>팟 채팅</p>
          </button>
        </div>
      );
    } else if (role === null) {
      buttonComponent = (
        <div className=''>
          <button className='btn btn-ghost btn-block no-animation btn-disabled'>모집마감</button>
        </div>
      );
    }
  } else if (state === 'SETTLING') {
    if (role === 'ORGANIZER' || role === 'PARTICIPANT') {
      buttonComponent = (
        <div className='flex justify-between'>
          <button
            onClick={GoChat}
            className='btn  bg-blue-500 hover:bg-blue-700 text-white font-bold w-7/12'>
            <p>팟 채팅</p>
          </button>
          <button
            onClick={GoChat}
            className='btn btn-ghost btn-block no-animation btn-disabled w-4/12'>
            <p>정산중</p>
          </button>
        </div>
      );
    } else if (role === null) {
      buttonComponent = (
        <div className=''>
          <button className='btn btn-ghost btn-block no-animation btn-disabled'>모집마감</button>
        </div>
      );
    }
  } else if (state === 'SETTLED') {
    if (role === 'ORGANIZER' || role === 'PARTICIPANT') {
      buttonComponent = (
        <div className='flex justify-between'>
          <button
            onClick={GoChat}
            className='btn  bg-blue-500 hover:bg-blue-700 text-white font-bold w-7/12'>
            <p>팟 채팅</p>
          </button>
          <button
            onClick={GoChat}
            className='btn btn-ghost btn-block no-animation btn-disabled w-4/12'>
            <p>정산완료</p>
          </button>
        </div>
      );
    } else if (role === null) {
      buttonComponent = (
        <div className=''>
          <button className='btn btn-ghost btn-block no-animation btn-disabled'>모집마감</button>
        </div>
      );
    }
  }

  return <div className=' fixed bottom-0 w-full z-10 bg-white p-3'>{buttonComponent}</div>;
};

export default Button;
