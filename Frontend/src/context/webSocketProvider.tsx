import React, { createContext, useContext, useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getCookie } from '@/utils/CookieUtil';
import { ViteConfig } from '@/apis/ViteConfig';
import userStore from '@/stores/useUserStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// 타입 정의
interface WebSocketContextType {
  client: Client | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 프로퍼티 타입 정의
interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false); // 연결 상태를 추적하는 상태
  const { id } = userStore();
  const BASE_URI = ViteConfig.VITE_BASE_URL;
  const broker = ViteConfig.VITE_SOCK_URL;
  const nav = useNavigate();

  function GoPartyPage(id: number) {
    nav(`/party/${id}`);
  }

  useEffect(() => {
    const token = getCookie('Authorization');
    if (!token) {
      console.error('Authorization token is missing');
      return;
    }

    // WebSocket 및 STOMP 클라이언트 설정
    const client = new Client({
      brokerURL: `${broker}`,
      connectHeaders: {
        AUTHORIZATION: `Bearer ${token}`,
        token: `${token}`,
      },
      heartbeatIncoming: 20000, // 20초
      heartbeatOutgoing: 20000, // 20초
      webSocketFactory: () => new SockJS(`${BASE_URI}/ws-stomp`),
      // debug: str => console.log('STOMP Debug:', str),
      onConnect: () => {
        console.log('Client CONNECT');
        setIsConnected(true);
        // TODO 개인별 알림 구독
        client.subscribe(
          `/sub/notification/${id}`,
          msg => {
            console.log(JSON.parse(msg.body));
            const message = JSON.parse(msg.body);
            if (message.type === 'APPLY') {
              toast.info(`${message.content}`, { onClick: () => GoPartyPage(message.partyId) });
            } else if (message.type === 'ACCEPT') {
              toast.info(`${message.content}`, { onClick: () => GoPartyPage(message.partyId) });
            } else if (message.type === 'KICK') {
              toast.error(`${message.content}`, { onClick: () => GoPartyPage(message.partyId) });
            } else {
              toast.info(`${message.content}`, {});
            }
          },
          {
            token: `${getCookie('Authorization')}`,
          },
        );
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false); // 연결 해제시 상태 업데이트
      },
      onStompError: frame => {
        console.error('Stomp Error:', frame.headers['message']);
        setIsConnected(false); // 에러 발생시 연결 상태 업데이트
      },
      onWebSocketError: err => {
        console.error('WebSocket Error:', err);
        setIsConnected(false); // 에러 발생시 연결 상태 업데이트
      },
    });

    setStompClient(client);
    client.activate();

    // 클라이언트 비활성화 및 정리
    return () => {
      client.deactivate();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ client: stompClient, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// 컨텍스트 훅
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
