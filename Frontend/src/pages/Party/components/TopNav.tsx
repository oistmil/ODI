import React, { useState, useEffect, MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jwtAxios from '@/utils/JWTUtil';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from '@/context/webSocketProvider';
import userStore from '@/stores/useUserStore';
import { getCookie } from '@/utils/CookieUtil';

interface ModalProps {
  isVisible: boolean;
  role: string;
  state: string;
  partyId: string | undefined;
  roomId: string;
  expectedCost: number;
  currentParticipants: number;
  onClose: () => void;
}

interface INavProps {
  role: string;
  state: string;
  title: string;
  partyId: string | undefined;
  roomId: string;
  expectedCost: number;
  currentParticipants: number;
  from: string | undefined;
}

const Modal: React.FC<ModalProps & { fetchData: () => void }> = ({
  isVisible,
  onClose,
  role,
  state,
  partyId,
  roomId,
  expectedCost,
  currentParticipants,
  fetchData,
}) => {
  if (!isVisible) return null;
  const { client, isConnected } = useWebSocket();
  const { id } = userStore();
  const nav = useNavigate();
  // Handle outside click to close modal
  const handleOutsideClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).id === 'modal-overlay') {
      onClose(); // Close modal on outside click
    }
  };

  const successParty = () => {
    jwtAxios
      .post(
        `/api/parties/${partyId}/success`,
        {},
        {
          params: {
            expected_cost: expectedCost,
          },
        },
      )
      .then(res => {
        console.log(res.data);
        if (res.data.status === 204) {
          toast.success(
            `${res.data.message} 선 차감된 금액: ${res.data.data.prepaidCost / currentParticipants}`,
            {
              position: 'top-center',
            },
          );
          if (client && client.connected) {
            client.publish({
              destination: `/pub/chat/message`,
              body: JSON.stringify({
                partyId,
                roomId,
                type: 'TALK',
              }),
              headers: {
                token: `${getCookie('Authorization')}`,
              },
            });
          }
        }
        fetchData();
      })
      .catch(err => {
        console.error(err);
        toast.error(`${err.response.data.message} ${err.response.data.reason}`, {
          position: 'top-center',
        });
      });
  };

  function deleteParty() {
    jwtAxios
      .delete(`api/party-boards/${partyId}`, {})
      .then(res => {
        console.log(res.data);
        if (res.data.status === 204) {
          toast.success(`${res.data.message}`, { position: 'top-center' });
          nav('/home', { replace: true });
        }
        fetchData();
      })
      .catch(err => {
        console.log(err);
      });
  }

  return (
    <div
      id='modal-overlay'
      className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end'
      onClick={handleOutsideClick}>
      <div
        className='bg-white p-4 w-full md:max-w-md mx-auto rounded shadow-lg flex flex-col space-y-2'
        onClick={e => e.stopPropagation()}>
        {role === 'ORGANIZER' && state === 'GATHERING' && (
          <button onClick={successParty} className='btn btn-ghost text-blue-500'>
            팟 확정하기
          </button>
        )}
        <button className='btn btn-ghost text-black'>팟 수정하기</button>
        <button onClick={deleteParty} className='btn btn-ghost text-red-500'>
          팟 삭제하기
        </button>
        <button onClick={onClose} className='btn btn-ghost text-gray-500'>
          취소
        </button>
      </div>
    </div>
  );
};

const TopNav: React.FC<INavProps & { fetchData: () => void }> = ({
  role,
  state,
  partyId,
  roomId,
  title,
  expectedCost,
  currentParticipants,
  fetchData,
  from,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Lock or unlock body scroll based on modal visibility
    document.body.style.overflow = modalVisible ? 'hidden' : 'auto';
  }, [modalVisible]);

  const goHome = () => {
    if (from === '/profile/party/history') {
      nav('/profile/party/history', { replace: true });
      return;
    }
    nav('/home');
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <div className='fixed top-0 bg-white w-screen z-[1000]'>
      <div className='flex items-center justify-between px-4 py-2'>
        <button onClick={goHome} className='btn btn-square btn-ghost text-3xl'>
          {'<'}
        </button>
        <p className='text-xl font-bold flex-grow text-center'>
          {title.length > 10 ? `${title.substring(0, 8)}...` : title}
        </p>
        {role === 'ORGANIZER' ? (
          <button onClick={toggleModal} className='btn btn-square btn-ghost'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              className='inline-block w-6 h-6 stroke-current'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0 a1 1 0 11-2 0 1 1 0 012 0zm7 0 a1 1 0 11-2 0 1 1 0 012 0z'></path>
            </svg>
          </button>
        ) : (
          <div className='w-12'></div> // 빈 공간 유지
        )}
      </div>
      {modalVisible && (
        <Modal
          role={role}
          state={state}
          partyId={partyId}
          roomId={roomId}
          expectedCost={expectedCost}
          currentParticipants={currentParticipants}
          fetchData={fetchData}
          isVisible={modalVisible}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TopNav;
