import React, { useState } from 'react';
import userStore from '@/stores/useUserStore';
import { useNavigate } from 'react-router-dom';
import SvgGoBack from '@/assets/svg/SvgGoBack';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { IUser } from '@/types/User';
import { ViteConfig } from '@/apis/ViteConfig';
import { getCookie } from '@/utils/CookieUtil';
import { toast } from 'react-toastify';

const ProfileDetail: React.FC = () => {
  const nav = useNavigate();
  const { id, name, nickname, image, email, gender, birth, ageGroup, brix, point } = userStore();
  const [user, setUser] = useState<IUser>({
    id: id,
    name: name,
    nickname: nickname,
    image: image,
    email: email,
    gender: gender,
    birth: birth,
    ageGroup: ageGroup,
    brix: brix,
    point: point,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNickname] = useState<string | undefined>(user.nickname);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | undefined>(user.image);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handlePreview = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 500,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const compressedImageUrl = URL.createObjectURL(compressedFile);
        setPreviewImage(compressedImageUrl);

        const newFile = new File([compressedFile], file.name, { type: file.type });
        setImgFile(newFile);
      } catch (error) {
        console.error('미리보기 이미지 압축 실패 : ', error);
      }
    }
  };

  const handleEditData = async () => {
    try {
      const formData = new FormData();
      if (newNickname !== user.nickname) {
        formData.append('newNickname', newNickname as string);
      }
      if (previewImage !== user.image) {
        formData.append('newImage', imgFile as File);
      }

      if (newNickname === user.nickname && previewImage === user.image) {
        toast.error('변경된 정보가 없습니다.');
        return;
      }

      // for (let pair of formData.entries()) {
      //   console.log(pair[0] + ', ' + pair[1]);
      // }

      const response = await axios.put(`${ViteConfig.VITE_BASE_URL}/api/members/me`, formData, {
        headers: {
          AUTHORIZATION: `Bearer ${getCookie('Authorization')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        toast.success('회원정보 수정이 완료되었습니다.');
        setUser({
          ...user,
          nickname: newNickname,
          image: previewImage || user.image,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('회원정보 수정 실패 : ', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNickname(user.nickname);
    setPreviewImage(user.image as string);
    setImgFile(null);
  };

  return (
    <>
      <div className='w-[100%] h-[100%]'>
        <div className='relative w-[100%] h-[5%] bg-black z-10 flex items-center'>
          <div
            className='px-4 z-10'
            onClick={() => {
              nav('/profile', { replace: true });
            }}>
            <SvgGoBack />
          </div>
          <div className='absolute w-[100%] flex justify-center text-[18px] font-semibold text-white'>
            {isEditing ? '회원정보 수정' : '회원정보'}
          </div>
        </div>
        <div className='w-[100%] h-[95%] flex flex-col items-center'>
          {isEditing ? (
            <>
              <div className='flex w-[90%] h-[10%] items-center'>
                <div className='w-[20%] flex justify-center text-[18px] font-semibold text-gray-500'>
                  닉네임 :{' '}
                </div>
                <label className='w-[70%] input input-bordered flex items-center mx-4'>
                  <input
                    type='text'
                    className='grow'
                    placeholder='변경할 닉네임을 입력해 주세요!'
                    value={newNickname}
                    onChange={e => setNickname(e.target.value)}
                  />
                </label>
              </div>
              <div className='flex w-[90%] h-[10%] items-center'>
                <div className='w-[20%] flex justify-center text-[18px] font-semibold text-gray-500'>
                  프로필 :{' '}
                </div>
                <label className='w-[70%] input input-bordered flex items-center border-none p-0 mx-4'>
                  <input
                    type='file'
                    accept='image/*'
                    className='file-input file-input-bordered'
                    onChange={handlePreview}
                  />
                </label>
              </div>
              <div className='w-[90%] border-b-2 border-gray-300 mx-5'></div>
              {previewImage ? (
                <div className='w-[90%] h-[30%] flex flex-col justify-center items-center mt-5'>
                  <div className='w-[100%] h-[20%] flex justify-center text-gray-500 font-semibold text-[18px]'>
                    프로필 미리보기
                  </div>
                  <div className='w-[200px] h-[200px] flex justify-center items-center overflow-hidden border border-black rounded-full'>
                    <img src={previewImage} alt='미리보기' width='100%' height='100%' />
                  </div>
                </div>
              ) : (
                <div className='w-[90%] h-[30%] flex flex-col justify-center items-center mt-5'>
                  <div className='w-[100%] h-[20%] flex justify-center text-gray-500 font-semibold text-[18px]'>
                    현재 이미지
                  </div>
                  <div className='w-[200px] h-[200px] flex justify-center items-center overflow-hidden border border-black rounded-full'>
                    <img src={user.image} alt={`${user.nickname}의 프로필`} />
                  </div>
                </div>
              )}
              <div className='w-[70%] h-[10%] flex justify-between items-end'>
                <button onClick={handleCancel} className='btn hover:bg-gray-500'>
                  취소
                </button>
                <button
                  onClick={handleEditData}
                  className='btn w-[40%] bg-green-500 text-white font-semibold hover:bg-green-600'>
                  수정하기
                </button>
              </div>
            </>
          ) : (
            <>
              <div className='w-[90%] h-[30%] flex flex-col justify-center items-center my-5'>
                <div className='w-[100%] h-[20%] flex justify-center items-center text-gray-500 font-semibold text-[18px]'>
                  내 프로필{' '}
                </div>
                <div className='w-[200px] h-[200px] flex justify-center items-center overflow-hidden border border-black rounded-full'>
                  <img src={user.image} alt={`${user.nickname}의 프로필`} />
                </div>
              </div>
              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  이름 :
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>{user.name}</div>
              </div>
              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  닉네임 :
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>
                  {user.nickname}
                </div>
              </div>
              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  이메일 :{' '}
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>{user.email}</div>
              </div>
              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  나이대 :
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>
                  {user.ageGroup}
                </div>
              </div>

              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  당도 :
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>{user.brix}</div>
              </div>
              <div className='w-[70%] h-[5%] flex'>
                <div className='w-[30%] h-[100%] flex items-center text-gray-500 text-[18px]'>
                  포인트 :
                </div>
                <div className='w-[70%] h-[100%] flex items-center text-[18px]'>
                  {user.point} 오디
                </div>
              </div>

              <button
                onClick={handleEditClick}
                className='btn mt-10 bg-OD_PURPLE w-[70%] rounded-full font-semibold text-[18px] text-white'>
                수정하기
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileDetail;
