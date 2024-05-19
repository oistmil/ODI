import { Status, Wrapper } from '@googlemaps/react-wrapper';
import { ViteConfig } from '@/apis/ViteConfig';
import { useEffect, useRef } from 'react';
import watchPositionHook from '@/hooks/useRefreshLocation';
import partyStore from '@/stores/usePartyStore';
import LatLngAddStore from '@/stores/useLatLngAddStore';
import DarkModeStyle from '@/components/Maps/DarkModeStyle';
import DEPARTURE from '@/assets/image/icons/departureMarker.png';
import ARRIVAL from '@/assets/image/icons/arrivalMarker.png';
import jwtAxios from '@/utils/JWTUtil';
import { ILocation } from '@/types/Map';

const MapRef = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { currentLat, currentLng } = LatLngAddStore();
  const { departuresName, departuresLocation, arrivalsName, arrivalsLocation } = partyStore();

  useEffect(() => {
    if (!ref.current) return;

    const map = new window.google.maps.Map(ref.current, {
      disableDefaultUI: true,
      // styles: DarkModeStyle,
      zoom: 16,
      minZoom: 5,
      maxZoom: 18,
      draggable: false,
      restriction: {
        latLngBounds: {
          north: 43,
          south: 33,
          west: 124,
          east: 132,
        },
        strictBounds: true,
      },
    });

    const bounds = new google.maps.LatLngBounds();

    const convertPathFormat = (pathList: [number, number][]) => {
      return pathList.map(
        point =>
          ({
            lat: point[1], // 두 번째 항목이 위도
            lng: point[0], // 첫 번째 항목이 경도
          }) as google.maps.LatLngLiteral,
      );
    };

    const updateBoundsWithPath = (path: google.maps.LatLngLiteral[]) => {
      path.forEach(location => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
    };

    const startMarker = new window.google.maps.Marker({
      icon: {
        url: DEPARTURE,
        scaledSize: new window.google.maps.Size(40, 40),
      },
      zIndex: 10,
      animation: google.maps.Animation.DROP,
    });

    const endMarker = new window.google.maps.Marker({
      icon: {
        url: ARRIVAL,
        scaledSize: new window.google.maps.Size(40, 40),
      },
      zIndex: 10,
      animation: google.maps.Animation.DROP,
    });

    const directionRoute = async (start: ILocation, end: ILocation) => {
      try {
        const result = await jwtAxios.get(
          `/api/maps/path-info?departuresX=${start.longitude}&departuresY=${start.latitude}&arrivalsX=${end.longitude}&arrivalsY=${end.latitude}`,
        );
        const pathData = JSON.parse(result.data.data).route.traoptimal[0].path;
        const pathList = convertPathFormat(pathData);
        new google.maps.Polyline({
          map: map,
          path: pathList,
          geodesic: true,
          strokeColor: '#2196F3',
          strokeOpacity: 1.0,
          strokeWeight: 4,
        });

        // 출발지와 도착지 경계를 맞추기 위해 경계 확장
        bounds.extend(new google.maps.LatLng(start.latitude, start.longitude));
        bounds.extend(new google.maps.LatLng(end.latitude, end.longitude));
        map.fitBounds(bounds);
      } catch (error) {
        console.error(error);
      }
    };

    // 초기 위치 설정과 마커 추가
    if (
      departuresLocation &&
      departuresLocation.latitude !== 0 &&
      departuresLocation.longitude !== 0
    ) {
      const startPos = new google.maps.LatLng(
        departuresLocation.latitude,
        departuresLocation.longitude,
      );
      startMarker.setPosition(startPos);
      startMarker.setMap(map);
      bounds.extend(startPos);
    }

    if (
      departuresLocation &&
      departuresLocation.latitude !== 0 &&
      departuresLocation.longitude !== 0 &&
      arrivalsLocation &&
      arrivalsLocation.latitude !== 0 &&
      arrivalsLocation.longitude !== 0
    ) {
      const endPos = new google.maps.LatLng(arrivalsLocation.latitude, arrivalsLocation.longitude);
      endMarker.setPosition(endPos);
      endMarker.setMap(map);
      bounds.extend(endPos);
      directionRoute(departuresLocation, arrivalsLocation);
    }

    // 모든 마커가 추가된 후, 맵 경계를 조정
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [departuresLocation, arrivalsLocation]);

  return <div ref={ref} id='map' className='w-[100%] h-[100%]' />;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <>
          <span className='loading loading-dots loading-lg'></span>
        </>
      );
    case Status.FAILURE:
      return <>에러 발생</>;
    case Status.SUCCESS:
      return <MapRef />;
  }
};

/**
 * NOTE :
 * 구글 맵으로 열심히 커스텀해서 만들었는데...
 * 충격적이게도 구글 맵은 자바스크립트를 이용한 경로 생성을 지원하지 않습니다...
 * 그래서 출발지와 도착지가 다 생성이 되었다면, 네이버 맵을 이용하여 컴포넌트를 만들어야 할 것 같습니다.
 */

const PartyMap = () => {
  return (
    <Wrapper apiKey={ViteConfig.VITE_GOOGLE_MAP_API_KEY} render={render} libraries={['marker']} />
  );
};

export default PartyMap;
