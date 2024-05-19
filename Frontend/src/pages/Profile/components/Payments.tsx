import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import { loadTossPayments, TossPaymentsInstance } from '@tosspayments/payment-sdk';
import userStore from '@/stores/useUserStore';
import { ViteConfig } from '@/apis/ViteConfig';
import COIN from '@/assets/image/icons/COIN.png';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getCookie } from '@/utils/CookieUtil';

const Payments = () => {
  const nav = useNavigate();
  const { point, name } = userStore();
  const clientKey = ViteConfig.VITE_TOSS_PAYMENTS_CLIENT_KEY;
  const [tosspayments, setTosspayments] = useState<TossPaymentsInstance | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<string>('0');

  useEffect(() => {
    (async () => {
      try {
        const instance = await loadTossPayments(clientKey);
        setTosspayments(instance);
      } catch (error) {
        console.error('Failed to load TossPayments:', error);
      }
    })();
  }, [clientKey]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setTotalAmount((amount + parseInt(totalAmount, 10)).toString());
  };

  const handleCustomAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(0);
    setTotalAmount(event.target.value);
  };

  const handleCharge = async () => {
    const point = parseInt(totalAmount);
    if (isNaN(point) || point <= 0) {
      toast.error('충전 금액을 확인해주세요.');
      setTotalAmount('0');
      return;
    }

    try {
      const { data } = await axios.post(
        `${ViteConfig.VITE_BASE_URL}/api/payments`,
        {
          orderName: '포인트 충전',
          amount: point,
          payType: 'CARD',
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            AUTHORIZATION: 'Bearer ' + getCookie('Authorization'),
            'TossPayments-Test-Code': 'INVALID_CARD_EXCEPTION',
          },
        },
      );

      tosspayments!
        .requestPayment(data.data.payType, {
          amount: data.data.amount,
          orderId: data.data.orderId,
          orderName: data.data.orderName,
          customerName: name,
          successUrl: `${ViteConfig.VITE_PAY_URL}/profile/payments/success`,
          failUrl: `${ViteConfig.VITE_PAY_URL}/profile/payments/fail`,
        })
        .catch(function (error) {
          if (error.code === 'USER_CANCEL') {
            console.log('사용자가 결제를 취소했습니다.');
          } else if (error.code === 'INVALID_CARD_COMPANY') {
            console.log('해당 카드사는 결제를 지원하지 않습니다.');
          }
        });
    } catch (error) {
      console.error('Failed to request payment:', error);
    }
  };

  return (
    <>
      <div className='w-[100%] h-[100%] bg-white'>
        <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
          <div
            className='px-4 z-10'
            onClick={() => {
              nav(-1);
            }}>
            <SvgGoBack />
          </div>
          <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-black'>
            포인트 충전
          </div>
        </div>
        <div className='w-[100%] h-[95%] flex flex-col items-center'>
          <div className='w-[100%] h-[15%] flex flex-col justify-evenly my-3 px-5'>
            <div className='flex font-semibold text-black text-[20px]'>
              <div className='self-center w-[22px] h-[22px] mx-2'>
                <img src={COIN} alt='동전' />
              </div>
              내 포인트
            </div>
            <div className='font-semibold text-black text-[18px] flex justify-end'>
              {point?.toLocaleString()}
              <span className='text-slate-500 px-2'>오디</span>
            </div>
          </div>
          <div className='w-[90%] border-b-2 border-gray-500'></div>
          <div className='w-[90%] px-2 my-4 '>
            <div className='font-semibold text-[20px] text-black self-center'>충전금액</div>
            <div className='flex justify-between'>
              <input
                type='text'
                className='input input-bordered w-[80%] mt-2'
                placeholder='충전 금액을 선택하거나 입력하세요'
                value={totalAmount}
                onChange={handleCustomAmountChange}
              />
              <button
                className='btn w-[10%] mt-2 bg-gray-300 text-black hover:bg-red-500 font-semibold text-[18px]'
                onClick={() => setTotalAmount('0')}>
                X
              </button>
            </div>
          </div>
          <div className='w-[90%] border-b-2 border-gray-500'></div>
          {[5000, 10000, 30000, 50000].map(amount => (
            <div key={amount} className='w-[90%] flex justify-between px-2 my-8'>
              <div className='font-semibold text-[20px] text-black self-center'>
                {amount.toLocaleString()}
                <span className='text-slate-500 px-2'>오디</span>
              </div>
              <button
                className='btn bg-gray-300 text-black font-semibold text-[18px] hover:bg-OD_YELLOW'
                onClick={() => handleAmountSelect(amount)}>
                선택
              </button>
            </div>
          ))}
          <div className='w-[90%] border-b-2 border-gray-500'></div>
          <button
            className='btn w-[50%] bg-OD_YELLOW hover:bg-OD_GREEN hover:text-white text-black font-semibold text-[18px] my-4'
            onClick={handleCharge}>
            충전하기
          </button>
        </div>
      </div>
    </>
  );
};

export default Payments;
