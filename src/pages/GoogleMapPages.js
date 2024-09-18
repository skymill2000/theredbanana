import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, RectangleF } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const mapOption = {
  disableDefaultUI: false,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  gestureHandling: "auto",
  draggable: false,
};

const center = {
  lat: 37.5555, // 지도 중심의 위도
  lng: 126.9292, // 지도 중심의 경도
};

const rectangleBounds = {
  north: 37.549679,
  south: 37.549679,
  east: 126.925313,
  west: 126.925313,
};

const options = {
  fillColor: "blue",
  fillOpacity: 0.2,
  strokeColor: "blue",
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: true,
  editable: true,
  visible: true,
  bounds: false,
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

const ToolBar = () => {
  return (
    <div style={toolbarStyle}>
      <button onClick={() => alert("Rectangle Added")}>지역 추가</button>
      <button onClick={() => alert("Rectangle Removed")}>지역 제거</button>
    </div>
  );
};

function MyMap() {
  const [mapInfoList, setmapInfoList] = useState([]);
  const [userList, setUserList] = useState([]);
  const rectangleRefs = useRef([]); // Ref 배열을 만들어 각 RectangleF의 참조를 저장
  const token = process.env.REACT_APP_GOOGLE_MAP_TOKEN;
  const onRectangleLoad = (rectangle, index) => {
    rectangleRefs.current[index] = rectangle; // 로드 시 해당 사각형을 참조 배열에 저장
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

  useEffect(() => {
    fetchRectangleInfo();
    const socket = new WebSocket("ws://your-websocket-url");
  }, []);

  useEffect(() => {
    console.log(mapInfoList);
  }, [mapInfoList]);

  return (
    <LoadScript googleMapsApiKey={token}>
      <GoogleMap
        options={mapOption}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={20}
      >
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
      <ToolBar />
    </LoadScript>
  );
}

export default React.memo(MyMap);
