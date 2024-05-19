import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jwtAxios from '@/utils/JWTUtil';
import axios from 'axios';
import { ViteConfig } from '@/apis/ViteConfig';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { getCookie } from '@/utils/CookieUtil';
import { useWebSocket } from '@/context/webSocketProvider';
import { IEvaluation, IUser } from '@/types/Chat';
import { IChatInfo } from '@/types/Chat';
import SettlementFailModal from './SettlementFailModal';
import SettlementCheckModal from './SettlementCheckModal';
import StatusBar from './StatusBar';
import EvaluationForm from './EvaluationForm';

interface INavBarProps {
  info?: IChatInfo;
  title: string;
  departuresName: string;
  arrivalsName: string;
  departuresDate: string;
  state: string;
  receiptImage: string | null;
  me: IUser;
  roomId: string;
  currentParticipants: number;
  taxifare: number;
  fetchData: () => void;
  sendAlarmToParticipants: (type: string) => Promise<void>;
  sendAlarmToOrganizer: (type: string) => Promise<void>;
}

interface IScores {
  kindScore: number;
  promiseScore: number;
  fastChatScore: number;
}

const NavBar: React.FC<INavBarProps> = ({
  info,
  title,
  departuresName,
  arrivalsName,
  departuresDate,
  state,
  receiptImage,
  me,
  roomId,
  currentParticipants,
  taxifare,
  fetchData,
  sendAlarmToParticipants,
  sendAlarmToOrganizer,
}) => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const { client, isConnected } = useWebSocket();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettleCheckModalOpen, setIsSettleCheckModalOpen] = useState(false);
  const [isSettleFailModalOpen, setIsSettleFailModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleSettleCheckModal = () => setIsSettleCheckModalOpen(!isSettleCheckModalOpen);
  const toggleSettleFailModal = () => setIsSettleFailModalOpen(!isSettleFailModalOpen);
  const [amount, setAmount] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);

  const stateComponents = {
    GATHERING: <div className='badge badge-primary badge-outline'>모집중</div>,
    SETTLING: <div className='badge badge-primary badge-outline'>정산중</div>,
    COMPLETED: <div className='badge badge-error badge-outline'>모집마감</div>,
    SETTLED: <div className='badge badge-error badge-outline'>정산완료</div>,
  };

  let stateComponent = stateComponents[state as keyof typeof stateComponents];

  function sendChatAlarmMessage(type: string) {
    if (client && client.connected) {
      client.publish({
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
  }

  async function handleImageUpload(event: File) {
    const imageFile = event;
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(imageFile, options);
      const file = new File([compressedFile], imageFile.name, { type: imageFile.type });

      return file;
    } catch (error) {
      console.log(error);
    }
  }
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      event.target.files &&
      event.target.files[0] &&
      event.target.files[0].type.startsWith('image/')
    ) {
      try {
        const compressedImage = await handleImageUpload(event.target.files[0]);
        if (compressedImage) {
          setImageFile(compressedImage);
        } else {
          alert('이미지 압축에 실패했습니다.');
          setImageFile(undefined);
        }
      } catch (error) {
        console.error('Error compressing the image:', error);
        alert('Failed to compress image.');
        setImageFile(undefined);
      }
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
      setImageFile(undefined);
    }
  };
  function goDetail() {
    navigate(`/chat/detail/${partyId}`);
  }
  function goBack() {
    navigate(-1);
  }
  function goParty() {
    navigate(`/party/${partyId}`);
  }

  const requestCharge = () => {
    if (!imageFile) {
      alert('영수증을 첨부해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('newImage', imageFile);
    formData.append('cost', amount.toString());

    jwtAxios
      .post(`/api/parties/${partyId}/arriving`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(res => {
        // console.log(res);
        if (res.data.status === 204) {
          toast.success(res.data.message, {
            pauseOnFocusLoss: false,
            hideProgressBar: true,
            closeOnClick: true,
          });
          sendChatAlarmMessage('SETTLEMENT_REQUEST');
          sendAlarmToParticipants('SETTLEMENT_REQUEST');
          if (me.role !== 'ORGANIZER') {
            sendAlarmToOrganizer('SETTLEMENT_REQUEST');
          }
          fetchData();
          toggleModal();
        }
      })
      .then(() => {
        evalOpen();
      })
      .catch(err => {
        toast.error(err.response.data.reason);
        fetchData();
        console.error(err);
      });
  };

  const chargeFee = () => {
    jwtAxios
      .post(`/api/parties/${partyId}/settlement`)
      .then(res => {
        // console.log(res);
        if (res.data.status === 204) {
          toast.success('정산을 완료했습니다');
          fetchData();
          sendChatAlarmMessage('SETTLEMENT_SUCCESS');
          sendAlarmToParticipants('SETTLEMENT_SUCCESS');
          if (me.role !== 'ORGANIZER') {
            sendAlarmToOrganizer('SETTLEMENT_SUCCESS');
          }
        }
      })
      .then(() => {
        evalOpen();
      })
      .catch(err => {
        console.error(err);
        if (err.response.data.status === 402) {
          // console.log(isSettleFailModalOpen);
          toggleSettleFailModal();
        } else {
          toast.error(err.response.data.message);
        }
      });
    fetchData();
  };

  const successParty = () => {
    jwtAxios
      .post(
        `/api/parties/${partyId}/success`,
        {},
        {
          params: {
            expected_cost: taxifare,
          },
        },
      )
      .then(res => {
        // console.log(res.data);
        if (res.data.status === 204) {
          toast.success(
            `${res.data.message} 선 차감된 금액: ${res.data.data.prepaidCost / currentParticipants}`,
            {
              position: 'top-center',
            },
          );
          sendChatAlarmMessage('CONFIRM');
          sendAlarmToParticipants('CONFIRM');
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

  const showDialog = () => {
    const dialog = document.getElementById('my_modal_2') as HTMLDialogElement;
    if (dialog) {
      dialog.showModal();
    }
  };

  /**
   * @description 동승자 평가 여부 및 평가 모달
   */

  const evalModalRef = useRef<HTMLDialogElement>(null);
  const [isEval, setIsEval] = useState(false);

  const evalOpen = () => {
    if (evalModalRef.current) {
      evalModalRef.current.showModal();
    }
  };

  const handleEvaluation = () => {
    setIsEval(true);
  };

  const closeModal = () => {
    if (evalModalRef.current) {
      evalModalRef.current.close();
    }
    setIsEval(false);
  };

  const participants = [info!.organizer, ...info!.participants].filter(
    user => user.id !== info!.me.id,
  );

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [reviews, setReviews] = useState<IEvaluation[]>(
    participants.map(user => ({
      reviewee_id: user.id,
      kindScore: 1,
      promiseScore: 1,
      fastChatScore: 1,
    })),
  );

  const handleNext = (scores: IScores) => {
    const newReviews = [...reviews];
    newReviews[currentStep] = { ...newReviews[currentStep], ...scores };
    setReviews(newReviews);
    if (currentStep < participants.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleEvalSubmit = async () => {
    // console.log('평가 대상 PARTY ID', info!.partyId);
    // console.log('평가 내용', reviews);
    try {
      await axios
        .post(
          `${ViteConfig.VITE_BASE_URL}/api/members/brix`,
          {
            partyId: info!.partyId,
            memberBrixDTOList: reviews,
          },
          {
            headers: {
              AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
            },
          },
        )
        .then(res => {
          // console.log(res.data);
          if (res.data.status === 201) {
            closeModal();
            toast.success('평가가 완료되었습니다.');
          }
        });
    } catch (error) {
      console.error(error);
      toast.error('평가 전송에 실패했습니다.');
    }
  };

  let evalModal = (
    <>
      <dialog ref={evalModalRef} id='my_modal_4' className='modal'>
        <div className='modal-box w-11/12'>
          {isEval === true ? (
            <>
              <h3 className='font-bold text-[20px]'>동승자 평가</h3>
              <div className='mt-1 border border-gray-300'></div>
              <div className='flex flex-col justify-between gap-3'>
                <StatusBar currentStep={currentStep} totalSteps={participants.length} />
                {currentStep < participants.length ? (
                  <EvaluationForm
                    person={participants[currentStep]}
                    onNext={handleNext}
                    initialScores={{
                      kindScore: reviews[currentStep].kindScore,
                      promiseScore: reviews[currentStep].promiseScore,
                      fastChatScore: reviews[currentStep].fastChatScore,
                    }} // initialScores 전달
                  />
                ) : (
                  <button onClick={handleEvalSubmit} className='btn bg-green-500 text-white mt-4'>
                    평가 완료
                  </button>
                )}
              </div>
              <div className='modal-action'>
                <button
                  className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5'
                  onClick={closeModal}
                  type='button'>
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className='font-bold text-[20px]'>동승자 평가</h3>
              <div className='mt-1 border border-gray-300'></div>
              <div className='flex flex-col justify-between'>
                <h4 className='mt-5 text-lg text-black'>평가 진행 상황 </h4>
                <h4 className='mt-5 text-lg text-gray-500'>
                  동승자 평가를 통해 상대방을 평가해 주세요.
                </h4>
              </div>
              <div className='modal-action'>
                <button
                  className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5'
                  onClick={closeModal}
                  type='button'>
                  ✕
                </button>
                <button
                  className='btn bg-green-500 text-white'
                  type='button'
                  onClick={handleEvaluation}>
                  평가하기
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );

  return (
    <div className='container'>
      {evalModal}
      <div className='flex items-center justify-between'>
        <button onClick={goBack} className='btn btn-ghost btn-circle text-3xl'>
          {'<'}
        </button>
        <div
          onClick={goParty}
          className='font-bold text-2xl text-center content-center items-center align-center'>
          <p>{title}</p>
        </div>
        <button onClick={goDetail} className='btn btn-square btn-ghost'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            className='inline-block w-5 h-5 stroke-current'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'></path>
          </svg>
        </button>
      </div>
      <div className='divider my-1'></div>
      <div className='flex justify-between mx-4'>
        <div className='text-xl font-bold'>
          일정 :<p className='badge text-xl'>{departuresDate}</p>
        </div>
        {stateComponent}
      </div>
      <div className='flex'>
        <div className='flex flex-col'>
          <ul className='steps w-screen'>
            <li data-content='●' className='step step-primary'>
              <p>{departuresName}</p>
            </li>
            <li data-content='▶' className='step step-primary'>
              <p>{arrivalsName}</p>
            </li>
          </ul>
        </div>
      </div>
      {state === 'GATHERING' && me.role === 'ORGANIZER' && (
        <div>
          <button
            className='btn btn-block bg-purple-400 text-white text-xl font-bold'
            onClick={showDialog}>
            팟 확정하기
          </button>
          <dialog id='my_modal_2' className='modal'>
            <div className='modal-box'>
              <h3 className='font-bold text-lg'>팟 확정하기!</h3>
              <p className='py-4'>현재 인원으로 파티를 확정하시겠습니까?</p>
              <button onClick={successParty} className='btn'>
                확인
              </button>
            </div>
            <form method='dialog' className='modal-backdrop'>
              <button>close</button>
            </form>
          </dialog>
        </div>
      )}
      {state === 'COMPLETED' && (
        <div onClick={toggleModal} className=' btn btn-block btn-primary'>
          <p className='font-bold text-white'>1/N 정산요청하기</p>
          <div className='divider'></div>
        </div>
      )}
      {state === 'SETTLING' && me.isPaid === false && (
        <div onClick={toggleSettleCheckModal} className=' btn btn-block btn-accent'>
          <p className='font-bold text-xl text-white'>정산하기</p>
          <div className='divider'></div>
        </div>
      )}

      {isModalOpen && (
        <div className='modal modal-open'>
          <div className='modal-box relative'>
            <button className='btn btn-sm btn-circle absolute right-2 top-2' onClick={toggleModal}>
              ✕
            </button>
            <h3 className='font-bold text-lg mb-4'>정산 금액 입력</h3>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>금액</span>
              </label>
              <input
                type='text' // 숫자만 입력받도록 type을 'text'로 설정
                value={amount}
                onChange={handleAmountChange}
                placeholder='금액 입력'
                className='input input-bordered input-primary w-full max-w-xs'
                inputMode='numeric' // 모바일 환경에서 숫자 키보드를 띄움
                pattern='\d*' // 모바일에서도 숫자만 입력받도록 제한
              />
            </div>
            <div className='form-control mt-4'>
              <label className='label'>
                <span className='label-text'>영수증 이미지</span>
              </label>
              <input
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                className='file-input file-input-bordered w-full max-w-xs'
              />
            </div>
            <div className='modal-action'>
              <button onClick={requestCharge} className='btn btn-block btn-primary'>
                요청하기
              </button>
            </div>
          </div>
        </div>
      )}
      {isSettleFailModalOpen && (
        <SettlementFailModal onClose={() => setIsSettleFailModalOpen(false)} />
      )}
      {isSettleCheckModalOpen && (
        <SettlementCheckModal
          info={info}
          paidAmount={me.paidAmount}
          receiptImage={receiptImage}
          settleAmount={me.settleAmount}
          onClose={() => setIsSettleCheckModalOpen(false)}
          chargeFee={chargeFee}
        />
      )}
    </div>
  );
};

export default NavBar;
