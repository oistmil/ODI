import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '@/utils/CookieUtil';
import jwtAxios from '@/utils/JWTUtil';
import odi from '@/assets/image/logo/odi.png';

interface IMessage {
  roomId: string;
  senderImage: string;
  senderNickname: string;
  content: string;
  sendTime: string;
}

interface IChatRoom {
  partyId: string;
  partyTitle: string;
  roomId: string;
  lastMessage: IMessage | null;
}

const ChatListPage: React.FC = () => {
  const [error, setError] = useState(false);
  const [chatList, setChatList] = useState<IChatRoom[]>([]);
  const nav = useNavigate();

  const fetchData = async () => {
    await jwtAxios
      .get('api/chat/rooms', {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
        },
      })
      .then(res => {
        // console.log(res.data);
        setChatList(res.data);
      })
      .catch(err => {
        console.log(err);
        setError(true);
      });
  };

  const GoChatPage = (id: string) => {
    nav(`/party/chat/${id}`);
  };

  const formatSendTime = (sendTime: string) => {
    const date = new Date(sendTime);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    const isWithinTwoDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 2;

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return '어제';
    } else if (isWithinTwoDays) {
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className='container'>
      <div className='navbar bg-base-100'>
        <div className='navbar-start'>
          <button className='btn btn-square btn-ghost' onClick={() => nav(-1)}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              className='inline-block w-8 h-8 stroke-current'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z'></path>
            </svg>
          </button>
        </div>
        <div className='navbar-center'>
          <a className='text-xl font-bold'>채팅목록</a>
        </div>
        <div className='navbar-end'></div>
      </div>
      {chatList.length > 0 ? (
        <div className='chat-list'>
          <div className='overflow-x-auto'>
            <table className='table'>
              <tbody>
                {chatList.map(chatRoom => (
                  <tr
                    key={chatRoom.roomId}
                    onClick={() => GoChatPage(chatRoom.partyId)}
                    className='cursor-pointer'>
                    <td>
                      <div className='flex items-center gap-3'>
                        <img
                          src={chatRoom.lastMessage?.senderImage || odi}
                          alt='avatar'
                          className=''
                          width={60}
                        />

                        <div className='ml-4'>
                          <div className='font-bold text-xl'>{chatRoom.partyTitle}</div>
                          <div className=''>
                            {chatRoom.lastMessage ? chatRoom.lastMessage.content : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className='w-32 text-center'>
                      {chatRoom.lastMessage ? formatSendTime(chatRoom.lastMessage.sendTime) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='flex justify-center items-center h-64'>
          <span className='text-lg'>채팅 목록이 없습니다.</span>
        </div>
      )}
    </div>
  );
};

export default ChatListPage;
