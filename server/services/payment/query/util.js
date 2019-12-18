const fetch = require("node-fetch");
const formurlencoded = require("form-urlencoded").default;
const { KAKAO_PAY_CALLBACK_URL, KAKAO_ADMIN_KEY } = process.env;

const avoidTimeCollision = weekTable => compareElement =>
  compareElement.reservationInfo.day.every((d, idx) => {
    if (!weekTable[0][d]) return true;

    return (
      weekTable[1][d] <= compareElement.reservationInfo.startTime[idx] ||
      compareElement.reservationInfo.endTime[idx] <= weekTable[0][d]
    );
  });

function avoidReservationCollision(
  { day, startTime, endTime },
  sameRoomIdInPayQueue
) {
  const weekTable = [[], []];

  day.forEach((d, idx) => {
    weekTable[0][d] = startTime[idx];
    weekTable[1][d] = endTime[idx];
  });

  return sameRoomIdInPayQueue.every(avoidTimeCollision(weekTable));
}

async function getNextUrl(roomId, userId, paymentInfo) {
  const callbackUrls = {
    approval_url: KAKAO_PAY_CALLBACK_URL + `/approval/${roomId}/${userId}`,
    cancel_url: KAKAO_PAY_CALLBACK_URL + `/cancel/${roomId}/${userId}`,
    fail_url: KAKAO_PAY_CALLBACK_URL + `/fail/${roomId}/${userId}`
  };
  const form = formurlencoded({ ...paymentInfo, ...callbackUrls });
  const url = "https://kapi.kakao.com/v1/payment/ready";
  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`
    },
    body: form
  };

  const fetchResult = await fetch(url, options);

  if (fetchResult.ok) {
    const response = await fetchResult.json();

    return response.next_redirect_pc_url;
  }

  return "";
}

module.exports = { avoidReservationCollision, getNextUrl };
