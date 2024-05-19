import React, { useState, useEffect } from 'react';
import jwtAxios from '@/utils/JWTUtil';
import { motion } from 'framer-motion';
import mapStore from '@/stores/useMapStore';
import useBottomSheet from '@/hooks/useBottomSheet.ts';
import BottomSheetContent from '@/components/BottomSheet/BottomSheetContent.tsx';
import BottomSheetHandle from '@/components/BottomSheet/BottomSheetHandle.tsx';
import SvgList from '@/assets/svg/SvgList';
import SelectFilter from '@/pages/Home/components/SelectFilter';
import { IParty } from '@/types/Party';

const BottomSheet: React.FC = () => {
  const { googleMap, latitude, longitude } = mapStore();
  const { sheet, handleUp, content } = useBottomSheet();
  const [isToday, setIsToday] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('');
  const [distance, setDistance] = useState<string>('distance,asc');
  const [gender, setGender] = useState<string>('');
  const [departuresDate, setDeparturesDate] = useState<Date | string>('');
  const [listData, setListData] = useState<IParty[]>([]);

  const getListData = async () => {
    if (googleMap === null) return;
    try {
      const response = await jwtAxios.get(
        `api/party-boards?page=0&size=10&sort=${distance}&isToday=${isToday}&departuresDate=${departuresDate}&gender=${gender}&category=${category}&longitude=${longitude}&latitude=${latitude}`,
      );
      const { content } = response.data.data;
      setListData(content);
    } catch (error) {
      console.error('FILTER DATA LIST ERROR', error);
    }
  };

  useEffect(() => {
    getListData();
  }, [googleMap, latitude, longitude, isToday, category, distance, gender, departuresDate]);

  return (
    <>
      <motion.div
        className='fixed top-[90%] flex flex-col z-50 w-[100%] h-[100%] transition-transform duration-400'
        ref={sheet}>
        <div
          className='flex self-center items-center justify-center w-[30%] h-[4%] bg-black rounded-full z-50 gap-2 text-white cursor-pointer'
          onClick={handleUp}>
          <SvgList className='w-[20%] h-[80%]' />
          <p className='flex justify-center items-center'>목록 보기</p>
        </div>
        <div className='mt-4 bg-white rounded-t-3xl w-[100%] h-[90%]'>
          <BottomSheetHandle />
          <div className='w-[100%] bg-white z-auto'>
            <SelectFilter
              setIsToday={setIsToday}
              setCategory={setCategory}
              setDistance={setDistance}
              setGender={setGender}
              setDeparturesDate={setDeparturesDate}
            />
          </div>
          <div
            ref={content}
            className='w-[100%] h-dvh flex justify-center bg-white overflow-scroll'>
            <div className='w-[85%] h-[50%] overflow-scroll'>
              {listData.length > 0 ? (
                <BottomSheetContent partyList={listData} />
              ) : (
                <div className='flex flex-col items-center justify-center mt-3 gap-6 w-[100%]'>
                  <div className='text-lg text-gray-400'>게시글이 없습니다 :(</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default BottomSheet;
