import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '@/context/webSocketProvider';
import { getCookie } from '@/utils/CookieUtil';
import { IUser, IMessage } from '@/types/Chat';
import jwtAxios from '@/utils/JWTUtil';

interface ChatProps {
  roomId: string;
  me: IUser;
  fetchData: () => void;
}

interface ChatMessageProps {
  msg: IMessage;
  isOwnMessage: boolean;
  showImage: boolean;
  showTime: boolean;
}

const Chat: React.FC<ChatProps> = ({ roomId, me, fetchData }) => {
  const { partyId } = useParams();
  const { client, isConnected } = useWebSocket();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await jwtAxios.get(`api/chat/room/${roomId}`);
      const beforeChat = res.data.chatMessages;
      setMessages(prevMessages => [...prevMessages, ...beforeChat]);
      setLoading(false); // 메시지 불러오기가 끝난 후 로딩 상태를 false로 설정
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (client && client.connected) {
      fetchMessages();
      const subscription = client.subscribe(
        `/sub/chat/room/${roomId}`,
        message => {
          const newMessage = JSON.parse(message.body);
          if (
            ['SETTLEMENT_REQUEST', 'SETTLEMENT_SUCCESS', 'ENTER', 'QUIT', 'CONFIRM'].includes(
              newMessage.type,
            )
          ) {
            fetchData();
          }

          setMessages(prevMessages => [...prevMessages, newMessage]);
        },
        {
          token: `${getCookie('Authorization')}`,
        },
      );

      return () => subscription.unsubscribe();
    }
  }, [isConnected]);

  const handleSendMessage = () => {
    const messageContent = inputRef.current?.value;
    if (client && client.connected && messageContent?.trim()) {
      client.publish({
        destination: `/pub/chat/message`,
        body: JSON.stringify({
          partyId,
          roomId,
          content: messageContent,
          type: 'TALK',
        }),
        headers: {
          token: `${getCookie('Authorization')}`,
        },
      });
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } else {
      alert('서버와의 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const NewTimeFormat = (time: string) => {
    const date = new Date(time);
    const hour = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minutes}`;
  };

  const isDifferentTime = (time1: string, time2: string) => {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return (
      date1.getFullYear() !== date2.getFullYear() ||
      date1.getMonth() !== date2.getMonth() ||
      date1.getDate() !== date2.getDate() ||
      date1.getHours() !== date2.getHours() ||
      date1.getMinutes() !== date2.getMinutes()
    );
  };

  const ChatMessage: React.FC<ChatMessageProps> = ({ msg, isOwnMessage, showImage, showTime }) => (
    <div className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}>
      {!isOwnMessage && (
        <div className='chat-image avatar'>
          {showImage ? (
            <div className='w-10 rounded-full'>
              <img alt='img' src={msg.senderImage} />
            </div>
          ) : (
            <div className='w-10 rounded-full'></div>
          )}
        </div>
      )}
      {!isOwnMessage && showImage && <div className='chat-header'>{msg.senderNickname}</div>}
      <div
        className={`chat-bubble ${isOwnMessage ? 'chat-bubble-primary bg-purple-500' : 'chat-bubble-secondary bg-black'}`}>
        <p className='break-words text-white text-xl'>{msg.content}</p>
      </div>
      {showTime && <time className='chat-footer opacity-50'>{NewTimeFormat(msg.sendTime)}</time>}
    </div>
  );

  return (
    <div className='flex flex-col h-full'>
      {loading ? (
        <div className='flex justify-center items-center h-full'>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <div className='flex-grow overflow-y-auto mt-20 mb-12 p-4'>
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];
              const showImage =
                !prevMsg ||
                prevMsg.senderNickname !== msg.senderNickname ||
                prevMsg?.type !== 'TALK' ||
                isDifferentTime(prevMsg.sendTime, msg.sendTime);
              const showTime =
                !nextMsg ||
                nextMsg.senderNickname !== msg.senderNickname ||
                nextMsg?.type !== 'TALK' ||
                isDifferentTime(msg.sendTime, nextMsg.sendTime);

              return msg.type === 'TALK' ? (
                <ChatMessage
                  key={index}
                  msg={msg}
                  isOwnMessage={msg.senderNickname === me.nickname}
                  showImage={showImage}
                  showTime={showTime}
                />
              ) : (
                <div key={index} className='flex justify-center my-4'>
                  <span className='badge badge-lg'>{msg.content}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className='fixed bottom-0 bg-white flex w-screen'>
            <input
              type='text'
              ref={inputRef}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder='메세지를 입력하세요'
              className='input flex-grow mr-2'
            />
            <button className='btn' onClick={handleSendMessage}>
              전송
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
