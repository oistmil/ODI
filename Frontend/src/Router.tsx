import { Navigate, createBrowserRouter } from 'react-router-dom';
import SplashPage from './pages/Splash/SplashPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import userStore from './stores/useUserStore';
import useAuth from '@/hooks/queries/useAuth';
import { useEffect } from 'react';
import loadingStore from './stores/useLoadingStore';
import NaverLoginRedirect from './pages/Login/components/NaverLoginRedirect';
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';
import ProfilePage from './pages/Profile/ProfilePage';
import ProfileDetail from './pages/Profile/components/ProfileDetail';
import Payments from './pages/Profile/components/Payments';
import PaymentsSuccess from './pages/Profile/components/PaymentsSuccess';
import PaymentsFail from './pages/Profile/components/PaymentsFail';
import PartyHistory from './pages/Profile/components/PartyHistory';
import PaymentsHistory from './pages/Profile/components/PaymentsHistory';
import PartyCreatePage from './pages/Party/PartyCreatePage';
import SetDeparture from './pages/Party/components/SetDeparture';
import SetArrival from './pages/Party/components/SetArrival';
import PartyDetailPage from './pages/Party/PartyDetailPage';
import ChatListPage from './pages/Chat/ChatListPage';
import ChatPage from './pages/Chat/ChatPage';
import ChatDetailPage from './pages/Chat/ChatDetailPage';

import { WebSocketProvider } from './context/webSocketProvider';
import { MatchSocketProvider } from './context/matchSocketProvider';

type AuthWrapperProps = {
  children: React.ReactNode;
};

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isLogin, loginUser } = userStore();
  const { refreshTokenQuery, getUserInfoQuery } = useAuth();

  useEffect(() => {
    if (refreshTokenQuery.isSuccess && getUserInfoQuery.isSuccess) {
      console.log('회원정보 조회 및 저장 완료');
      loginUser(getUserInfoQuery.userData);
    }
  }, [getUserInfoQuery.isSuccess]);

  if (!isLogin) {
    return <Navigate to='/login' replace={true} />;
  }

  return (
    <WebSocketProvider>
      <MatchSocketProvider>{children}</MatchSocketProvider>
    </WebSocketProvider>
  );
};

// const spinner = () => {
//   const { isLoading } = loadingStore();

//   if (isLoading) {
//     return (
//       <>
//         <div
//           className='absolute h-full w-full bg-white/50 z-20'
//           onClick={e => e.stopPropagation()}
//         />
//         <div className='z-50 absolute left-0 right-0 top-0 bottom-0 flex justify-center items-center'>
//           <svg className='animate-spin h-5 w-5 mr-3 bg-yellow-500' viewBox='0 0 24 24'></svg>
//         </div>
//       </>
//     );
//   } else {
//     return <></>;
//   }
// };

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={'/welcome'} replace={true} />,
  },
  {
    path: '/*',
    element: <NotFoundPage />,
  },
  {
    path: '/welcome',
    element: <SplashPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth',
    element: <NaverLoginRedirect />,
  },
  {
    path: '/home',
    element: (
      <AuthWrapper>
        <HomePage />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile',
    element: (
      <AuthWrapper>
        <ProfilePage />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/detail',
    element: (
      <AuthWrapper>
        <ProfileDetail />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/payments',
    element: (
      <AuthWrapper>
        <Payments />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/payments/success',
    element: (
      <AuthWrapper>
        <PaymentsSuccess />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/payments/fail',
    element: (
      <AuthWrapper>
        <PaymentsFail />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/party/history',
    element: (
      <AuthWrapper>
        <PartyHistory />
      </AuthWrapper>
    ),
  },
  {
    path: '/profile/payments/history',
    element: (
      <AuthWrapper>
        <PaymentsHistory />
      </AuthWrapper>
    ),
  },
  {
    path: '/party',
    element: (
      <AuthWrapper>
        <PartyCreatePage />
      </AuthWrapper>
    ),
  },
  {
    path: '/party/departure',
    element: (
      <AuthWrapper>
        <SetDeparture />
      </AuthWrapper>
    ),
  },
  {
    path: '/party/arrival',
    element: (
      <AuthWrapper>
        <SetArrival />
      </AuthWrapper>
    ),
  },
  {
    path: '/party/:partyId',
    element: (
      <AuthWrapper>
        <PartyDetailPage></PartyDetailPage>
      </AuthWrapper>
    ),
  },
  {
    path: '/party/chat/:partyId',
    element: (
      <AuthWrapper>
        <ChatPage></ChatPage>
      </AuthWrapper>
    ),
  },
  {
    path: '/chatlist',
    element: (
      <AuthWrapper>
        <ChatListPage></ChatListPage>
      </AuthWrapper>
    ),
  },
  {
    path: '/chat/detail/:partyId',
    element: (
      <AuthWrapper>
        <ChatDetailPage></ChatDetailPage>
      </AuthWrapper>
    ),
  },
]);

export default router;
