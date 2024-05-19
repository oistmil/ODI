import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import { Transition } from 'react-transition-group';

interface IPerson {
  id: number;
  nickname: string;
  profileImage: string;
}

interface IScores {
  kindScore: number;
  promiseScore: number;
  fastChatScore: number;
}

interface IEvaluationFormProps {
  person: IPerson;
  onNext: (scores: IScores) => void;
  initialScores?: IScores; // 새로운 prop
}

const duration = 500;

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 0,
};

const transitionStyles: { [id: string]: React.CSSProperties } = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

const EvaluationForm: React.FC<IEvaluationFormProps> = ({ person, onNext, initialScores }) => {
  const [scores, setScores] = useState<IScores>(
    initialScores || {
      kindScore: 1,
      promiseScore: 1,
      fastChatScore: 1,
    },
  );

  useEffect(() => {
    setScores(
      initialScores || {
        kindScore: 1,
        promiseScore: 1,
        fastChatScore: 1,
      },
    );
  }, [initialScores]);

  const nodeRef = useRef(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numValue = Number(value);

    setScores({ ...scores, [name]: numValue });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // console.log('현재 평가 값:', scores);
    onNext(scores);
  };

  return (
    <Transition in appear timeout={duration} nodeRef={nodeRef}>
      {state => (
        <div
          ref={nodeRef}
          style={{
            ...defaultStyle,
            ...transitionStyles[state],
          }}>
          <div className='p-4 bg-white border rounded-lg shadow-md mx-auto max-w-md'>
            <div className='text-xl font-bold mb-4 flex justify-center items-center'>
              {person.nickname}
            </div>
            <div className='flex justify-center items-center'>
              <img
                src={person.profileImage}
                alt={person.nickname}
                className='w-[60px] h-[60px] rounded-full mb-4'
              />
            </div>
            <form onSubmit={handleSubmit}>
              <div className='mb-4'>
                <label className='block text-gray-600'>{`${person.nickname}님은 친절한가요?`}</label>
                <input
                  type='range'
                  name='kindScore'
                  min='1'
                  max='5'
                  step='1'
                  value={scores.kindScore}
                  onChange={handleChange}
                  className='range range-success'
                />
                <div className='w-full flex justify-between text-xs px-2'>
                  {[...Array(5)].map((_, index) => (
                    <span key={index}>|</span>
                  ))}
                </div>
              </div>
              <div className='mb-4'>
                <label className='block text-gray-600'>{`${person.nickname}님은 약속을 잘 지키나요?`}</label>
                <input
                  type='range'
                  name='promiseScore'
                  min='1'
                  max='5'
                  step='1'
                  value={scores.promiseScore}
                  onChange={handleChange}
                  className='range range-success'
                />
                <div className='w-full flex justify-between text-xs px-2'>
                  {[...Array(5)].map((_, index) => (
                    <span key={index}>|</span>
                  ))}
                </div>
              </div>
              <div className='mb-4'>
                <label className='block text-gray-600'>{`${person.nickname}님은 응답이 빠른가요?`}</label>
                <input
                  type='range'
                  name='fastChatScore'
                  min='1'
                  max='5'
                  step='1'
                  value={scores.fastChatScore}
                  onChange={handleChange}
                  className='range range-success'
                />
                <div className='w-full flex justify-between text-xs px-2'>
                  {[...Array(5)].map((_, index) => (
                    <span key={index}>|</span>
                  ))}
                </div>
              </div>
              <div
                className='tooltip tooltip-bottom w-[100%]'
                data-tip={`평가는 수정할 수 없어요!`}>
                <button
                  type='submit'
                  className='w-[100%] py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300'>
                  평가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Transition>
  );
};

export default EvaluationForm;
