import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  LoadScript,
  RectangleF,
} from "@react-google-maps/api";
import axios from "axios";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

const buttonStyle = {
  position: "absolute",
  bottom: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1000,
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  zIndex: 999,
};

const toolbarStyle = {
  position: "absolute",
  top: "10px", // 지도 위에서 10px 떨어진 곳에 위치
  left: "10px", // 왼쪽에서 10px 떨어진 곳에 위치
  zIndex: 1, // 지도의 UI 요소들 위에 나타나도록 설정
  backgroundColor: "white",
  padding: "10px",
  borderRadius: "5px",
  boxShadow: "0px 2px 6px rgba(0,0,0,0.3)",
};

const InfoBar = ({ locationInfo }) => {
  console.log(locationInfo);
  return (
    <div style={toolbarStyle}>
      {locationInfo.map((data) => {
        return (
          <p>
            {data.lat} , {data.lng}
          </p>
        );
      })}
    </div>
  );
};

const MyMapComponent = ({ userId }) => {
  const [mapInfoList, setmapInfoList] = useState([]);
  const rectangleRefs = useRef([]); // Ref 배열을 만들어 각 RectangleF의 참조를 저장

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBGJzK8dNlyQOfzT8cq1taKMrEsR8GCd-8", // 구글 맵 API 키 입력
  });

  const [location, setLocation] = useState(null); // 내 위치
  const [allLocations, setAllLocations] = useState([]); // 모든 유저 위치

  const [socket, setSocket] = useState(null);
  const fetchRectangleInfo = () => {
    axios.get("http://localhost:3001/rectangles").then(({ data }) => {
      setmapInfoList(createRectanglePosition(data));
    });
  };
  const createRectanglePosition = (toParseData) => {
    return toParseData.map((item) => ({
      ...item,
      rectangleBounds: {
        north: item.north,
        south: item.south,
        east: item.east,
        west: item.west,
      },
    }));
  };

  const onRectangleLoad = (rectangle, index) => {
    rectangleRefs.current[index] = rectangle; // 로드 시 해당 사각형을 참조 배열에 저장
  };

  // 현재 위치 가져오기
  useEffect(() => {
    fetchRectangleInfo();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // 웹소켓 연결 및 위치 전송
  useEffect(() => {
    const ws = new WebSocket("ws://118.33.19.20:8080");
    setSocket(ws);

    // 서버로부터 모든 클라이언트의 위치 데이터를 수신
    ws.onmessage = (event) => {
      const locations = JSON.parse(event.data);
      setAllLocations(locations);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // 내 위치를 서버에 전송
  useEffect(() => {
    if (socket && location) {
      const intervalId = setInterval(() => {
        socket.send(
          JSON.stringify({
            userId,
            location,
          })
        );
      }, 5000); // 5초마다 위치 전송

      return () => clearInterval(intervalId);
    }
  }, [socket, location, userId]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps</div>;

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("새로운 위치를 가져옴: ", newLocation);

          setLocation(newLocation);

          // 서버에 새로운 위치를 즉시 전송
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                userId,
                location: newLocation,
              })
            );
          }
        },
        (error) => {
          // 에러 처리
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("사용자가 위치 접근 권한을 거부했습니다.");
              break;
            case error.POSITION_UNAVAILABLE:
              alert("위치 정보를 사용할 수 없습니다.");
              break;
            case error.TIMEOUT:
              alert("위치 정보를 가져오는 요청이 시간 초과되었습니다.");
              break;
            default:
              alert("알 수 없는 오류가 발생했습니다.");
              break;
          }
        },
        {
          enableHighAccuracy: true, // 더 높은 정확도를 위해 설정
          timeout: 5000, // 5초 이내에 위치 정보가 없으면 타임아웃
          maximumAge: 0, // 캐시된 위치 정보를 사용하지 않도록 설정
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleDrag = (index) => {
    const rectangle = rectangleRefs.current[index]; // 참조 배열에서 해당 사각형을 가져옴
    if (rectangle) {
      const bounds = rectangle.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();

      console.log("Rectangle bounds changed:");
      console.log("North-East:", northEast.lat(), northEast.lng());
      console.log("South-West:", southWest.lat(), southWest.lng());
    }
  };

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={20}
        center={location || { lat: 37.5555, lng: 126.9292 }} // 기본 위치
        options={options}
      >
        {/* 자신의 위치 마커 */}
        {location && <MarkerF position={location} />}

        {/* 모든 사용자의 위치를 마커로 표시 */}
        {allLocations.map((loc, index) => (
          <MarkerF key={index} position={loc} />
        ))}
        {mapInfoList.map((data, index) => {
          return (
            <RectangleF
              bounds={data.rectangleBounds}
              options={data.options}
              onLoad={(rectangle) => onRectangleLoad(rectangle, index)} // Rectangle이 로드될 때 참조 저장
              onBoundsChanged={() => handleDrag(index)} // 경계가 변경될 때 참조 사용
            />
          );
        })}
      </GoogleMap>
      <InfoBar locationInfo={allLocations}></InfoBar>
      <button style={buttonStyle} onClick={updateLocation}>
        Update My Location
      </button>
    </>
  );
};

export default MyMapComponent;
