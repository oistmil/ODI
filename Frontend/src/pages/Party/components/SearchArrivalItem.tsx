import SvgGoInside from '@/assets/svg/SvgGoInside';
import { IPlaceInfo } from '@/types/Party';
import { FC, useRef } from 'react';
import partyStore from '@/stores/usePartyStore';
import autoPartyStore from '@/stores/useAutoPartyStore';

interface IArrivalProps extends IPlaceInfo {
  setIsSearch: React.Dispatch<React.SetStateAction<boolean>>;
  from: string;
}

const SearchArrivalItem: FC<IArrivalProps> = ({ setIsSearch, from, ...props }) => {
  const dataModalRef = useRef<HTMLDialogElement>(null);
  const { setArrivals } = partyStore();
  const { setArr } = autoPartyStore();

  const openSetArrivalModal = () => {
    if (dataModalRef.current) {
      dataModalRef.current.showModal();
    }
  };

  const setData = () => {
    if (from === '/home') {
      setArr?.(
        props.placeName === null
          ? props.buildingName === null
            ? '장소 또는 건물명 미제공'
            : (props.buildingName as string)
          : (props.placeName as string),
        {
          latitude: props.geoPoint!.latitude,
          longitude: props.geoPoint!.longitude,
        },
      );
    } else {
      setArrivals?.(
        props.placeName === null
          ? props.buildingName === null
            ? '장소 또는 건물명 미제공'
            : (props.buildingName as string)
          : (props.placeName as string),
        {
          latitude: props.geoPoint!.latitude,
          longitude: props.geoPoint!.longitude,
        },
      );
    }
    setIsSearch(false);
  };

  let setDepartureModal = (
    <>
      <dialog ref={dataModalRef} id='my_modal_4' className='modal'>
        <div className='modal-box w-11/12'>
          <h3 className='font-bold text-[20px]'>도착지로 설정하시겠습니까?</h3>
          <div className='mt-1 border border-gray-500'></div>
          <h4 className='mt-3 text-lg'>
            {props.placeName === null
              ? props.buildingName === null
                ? '장소 또는 건물명 미제공'
                : props.buildingName
              : props.placeName}
          </h4>
          <p className='flex py-2 justify-end'>설정 이후 지도를 통해 정확하게 설정해 주세요.</p>
          <div className='modal-action'>
            <form method='dialog'>
              <button className='btn btn-sm btn-circle btn-ghost absolute right-5 top-5 border-none'>
                ✕
              </button>
              <button className='btn bg-OD_PURPLE text-white' onClick={setData}>
                설정하기
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );

  return (
    <>
      {'도착지 검색을 통해 출발지 설정하는 모달' && setDepartureModal}
      <div className='w-[100%] h-[10%] flex justify-center border-b border-slate-700 hover:bg-slate-500'>
        <div className='w-[90%]' onClick={openSetArrivalModal}>
          <div className='w-[100%] flex justify-between my-2'>
            <div className='font-semibold'>
              {props.placeName === null
                ? props.buildingName
                : props.placeName === null
                  ? '장소 또는 건물명 미제공'
                  : props.placeName}
            </div>
            <div className='w-[10%] flex justify-center items-center'>
              <SvgGoInside />
            </div>
          </div>
          <div>{props.roadNameAddress}</div>
        </div>
      </div>
    </>
  );
};

export default SearchArrivalItem;
