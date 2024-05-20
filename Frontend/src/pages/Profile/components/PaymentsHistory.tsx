import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IPaymentsHistory } from '@/types/PayHistory';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import axios from 'axios';
import PaymentsHistoryItem from './PaymentsHistoryItem'; // 새로운 컴포넌트 임포트
import { getCookie } from '@/utils/CookieUtil';
import { ViteConfig } from '@/apis/ViteConfig';

/**
 * @description 결제 내역 페이지
 * ENUM : PREPAYMENT, SETTLEMENT, CHARGE
 * PREPAYMENT : 선결제
 * SETTLEMENT : 정산
 * CHARGE : 충전
 */

const PaymentsHistory = () => {
  const nav = useNavigate();
  const [history, setHistory] = useState<IPaymentsHistory[]>([]);

  useEffect(() => {
    const paymentsHistory = async () => {
      const { data } = await axios.get(
        `${ViteConfig.VITE_BASE_URL}/api/point/history?page=0&size=30&sort=createdAt,desc`,
        {
          headers: { AUTHORIZATION: `Bearer ${getCookie('Authorization')}` },
        },
      );
      console.log(data.data.content);
      setHistory(data.data.content);
      // console.log(history);
    };
    paymentsHistory();
  }, []);

  return (
    <>
      <div className='w-[100%] h-[100%]'>
        <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
          <div
            className='px-4 z-10'
            onClick={() => {
              nav(-1);
            }}>
            <SvgGoBack />
          </div>
          <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-white'>
            결제 / 정산 내역
          </div>
        </div>
        <div className='w-[100%] h-[95%]'>
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className='w-[100%] h-[20%] flex justify-center'>
                <PaymentsHistoryItem item={item} />
              </div>
            ))
          ) : (
            <div className='w-[100%] h-[100%] flex justify-center items-center text-[20px] font-bold text-gray-500'>
              결제 / 정산 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentsHistory;
