import { IPlaceInfo } from '@/types/Party';
import { FC } from 'react';

interface SearchDataItemProps extends IPlaceInfo {
  setSelectedLocation: (location: IPlaceInfo) => void;
}

const SearchDataItem: FC<SearchDataItemProps> = ({ setSelectedLocation, ...props }) => {
  const setData = () => {
    setSelectedLocation(props);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div
      className='w-[100%] h-[15%] flex justify-center border-b border-slate-700 hover:bg-purple-100'
      onClick={setData}>
      <div className='w-[90%]'>
        <div className='w-[100%] flex justify-between my-2'>
          <div className='font-semibold'>
            {props.placeName || props.buildingName || '장소 또는 건물명 미제공'}
          </div>
        </div>
        <div>{truncateText(props.roadNameAddress || '', 20)}</div>
      </div>
    </div>
  );
};

export default SearchDataItem;
