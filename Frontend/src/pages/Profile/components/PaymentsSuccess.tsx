import axios from 'axios';
import { ViteConfig } from '@/apis/ViteConfig';
import { getCookie } from '@/utils/CookieUtil';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentsSuccess = () => {
  const searchParams = new URLSearchParams(location.search);
  const successModalRef = useRef<HTMLDialogElement>(null);
  const nav = useNavigate();

  const requestSuccess = async () => {
    try {
      const { data } = await axios.post(
        `${ViteConfig.VITE_BASE_URL}/api/payments/success`,
        {
          paymentKey: searchParams.get('paymentKey'),
          orderId: searchParams.get('orderId'),
          amount: searchParams.get('amount'),
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            AUTHORIZATION: 'Bearer ' + getCookie('Authorization'),
          },
        },
      );
      // console.log('Success request result:', data);
      return true;
    } catch (error) {
      console.error('Failed to success request post:', error);
    }
  };

  useEffect(() => {
    if (
      searchParams.has('paymentKey') &&
      searchParams.has('orderId') &&
      searchParams.has('amount')
    ) {
      const result = requestSuccess();
      if (!!result) {
        if (successModalRef.current) {
          successModalRef.current.showModal();
        }
        setTimeout(() => {
          nav('/profile');
        }, 5000);
      }
    }
  }, [searchParams]);

  return (
    <>
      <div className='w-[100%] h-[100%] bg-white'>
        <dialog ref={successModalRef} id='my_modal_4' className='modal'>
          <div className='modal-box w-11/12'>
            <h3 className='font-bold text-black text-[20px]'>결제성공</h3>
            <div className='mt-1 border border-gray-500'></div>
            <div className='flex flex-col justify-center items-center'>
              <div className='flex justify-center items-center w-[150px] h-[150px] my-5'>
                <img
                  src='https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Hugging%20Face.png'
                  alt='Hugging Face'
                  width='100%'
                  height='100%'
                />
              </div>

              <div className='text-gray-400 font-semibold text-[20px] my-2'>결제에 성공했어요!</div>
            </div>
            <div className='modal-action'>
              <form method='dialog'>
                <button
                  className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5'
                  onClick={() => nav('/profile')}>
                  ✕
                </button>
                <button className='btn bg-OD_PURPLE text-white' onClick={() => nav('/profile')}>
                  확인
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
};

export default PaymentsSuccess;
