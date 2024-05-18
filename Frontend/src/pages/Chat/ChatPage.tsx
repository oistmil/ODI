import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jwtAxios from '@/utils/JWTUtil';
import { getCookie } from '@/utils/CookieUtil';
import NavBar from './components/NavBar';
import Chat from './components/Chat';
import { IChatInfo } from '@/types/Chat';
import { useWebSocket } from '@/context/webSocketProvider';

const ChatPage = () => {
  const { partyId } = useParams();
  const [info, setInfo] = useState<IChatInfo>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [taxifare, setTaxifare] = useState(0);
  const navigate = useNavigate();
  const { client, isConnected } = useWebSocket();
  function goBack() {
    navigate(`/home`);
  }

  const sendAlarmToParticipants = async (type: string) => {
    try {
      if (info && client && client.connected) {
        info.participants.forEach(participant => {
          client.publish({
            destination: `/pub/notification/${participant.id}`,
            body: JSON.stringify({
              partyId,
              roomId: info.roomId,
              type,
            }),
            headers: {
              token: `${getCookie('Authorization')}`,
            },
          });
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      } else {
        console.error('Unexpected error', err);
        setError('Unexpected error occurred');
      }
    }
  };
  const sendAlarmToOrganizer = async (type: string) => {
    try {
      if (info && client && client.connected) {
        client.publish({
          destination: `/pub/notification/${info.organizer.id}`,
          body: JSON.stringify({
            partyId,
            roomId: info.roomId,
            type,
          }),
          headers: {
            token: `${getCookie('Authorization')}`,
          },
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      } else {
        console.error('Unexpected error', err);
        setError('Unexpected error occurred');
      }
    }
  };

  const fetchData = async () => {
    try {
      const res = await jwtAxios.get(`api/party-boards/${partyId}/chat-info`, {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
        },
      });
      setInfo(res.data.data);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      } else {
        console.error('Unexpected error', err);
        setError('Unexpected error occurred');
      }
    }
  };

  const fetchTaxifare = async () => {
    try {
      const res = await jwtAxios.get(`/api/maps/${partyId}/taxi-fare`, {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
        },
      });
      setTaxifare(res.data.data);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setError(err.message);
      } else {
        console.error('Unexpected error', err);
        setError('Unexpected error occurred');
      }
    }
  };

  useEffect(() => {
    const fetchDataAndFare = async () => {
      await fetchData();
      await fetchTaxifare();
      setIsLoading(false);
    };

    fetchDataAndFare();
  }, [partyId]);

  if (isLoading)
    return (
      <div className='flex h-screen justify-center items-center'>
        <span className='loading loading-ball loading-lg'></span>
      </div>
    );

  if (error)
    return (
      <div
        role='alert'
        className='alert alert-error bg-white h-screen flex flex-col items-center justify-center'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='stroke-current shrink-0 h-12 w-12 text-red-600'
          fill='none'
          viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <div>
          <h3 className='font-bold'>Error!</h3>
          <div className='text-xs'>{error}</div>
        </div>
        <button onClick={goBack} className='btn btn-sm'>
          돌아가기
        </button>
      </div>
    );

  return (
    <div className='chat-page h-screen flex flex-col'>
      {info && (
        <div className='fixed top-0 bg-white w-full z-10'>
          <NavBar
            info={info}
            title={info.title}
            departuresName={info.departuresName}
            arrivalsName={info.arrivalsName}
            departuresDate={info.departuresDate}
            state={info.state}
            me={info.me}
            roomId={info.roomId}
            currentParticipants={info.currentParticipants}
            taxifare={taxifare}
            fetchData={fetchData}
            sendAlarmToParticipants={sendAlarmToParticipants}
            sendAlarmToOrganizer={sendAlarmToOrganizer}
          />
        </div>
      )}

      <div className='flex-grow pt-24 overflow-hidden'>
        <div className='divider p-5'></div>
        {info && <Chat roomId={info.roomId} me={info.me} fetchData={fetchData} />}
      </div>
    </div>
  );
};

export default ChatPage;
