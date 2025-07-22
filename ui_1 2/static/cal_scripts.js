// 중간 표시한 부분 빼고 모두 정지원이 작성한 코드입니다 (정지원, 이선영, 이제우)
// 페이지의 모든 HTML 요소가 로딩 완료되었을 때 실행될 함수를 등록한다.
document.addEventListener('DOMContentLoaded', () => {
    // 현재 날짜(today)를 Date 객체로 생성한다.
    const today = new Date();
    // URL에서 'date' 파라미터를 가져온다(예: ?date=2024-12-31)
    const urlParams = new URLSearchParams(window.location.search);
    const selectedDateParam = urlParams.get('date');

    // URL에 'date' 파라미터가 있으면 해당 날짜로, 없으면 오늘 날짜로 초기 날짜 설정
    const initialDate = selectedDateParam ? new Date(selectedDateParam) : today;

    // 초기 달력 렌더링: 년도와 월을 전달해 달력을 만든다.
    renderCalendar(initialDate.getFullYear(), initialDate.getMonth());
    // 초기 날짜 선택 기능: 선택된 날짜를 표시하고 해당 날짜의 이벤트(타임라인) 로드
    selectDate(initialDate);
});

// 전역 변수 선언: 현재 연도, 현재 월, 선택된 날짜 저장용
let currentYear, currentMonth, selectedDate;

/**
 * 달력을 렌더링하는 함수
 * @param {number} year - 렌더링할 달력의 연도
 * @param {number} month - 렌더링할 달력의 월 (0부터 시작, 0 = 1월)
 */
function renderCalendar(year, month) {
    // 현재 연도, 월을 전역 변수에 저장
    currentYear = year;
    currentMonth = month;

    // 월 이름 배열
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // 현재 월 표시 영역에 월 이름 업데이트
    document.getElementById("month-display").innerText = monthNames[month];

    // 달력을 표시할 요소를 가져온 뒤 내부를 비운다.
    const calendarElement = document.getElementById('calendar');
    calendarElement.innerHTML = '';

    // 해당 달의 첫 번째 날의 요일(0=일요일,1=월요일...)을 가져온다.
    const firstDay = new Date(year, month, 1).getDay();
    // 해당 달의 마지막 날짜를 구한다. (다음 달 0일 = 이번 달 마지막 날)
    const lastDate = new Date(year, month + 1, 0).getDate();

    // 달력의 첫 번째 줄에 첫날 이전의 공백 칸 추가
    for (let i = 0; i < firstDay; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'date-box empty';
        calendarElement.appendChild(emptyBox);
    }

    // 실제 날짜 칸을 생성
    for (let day = 1; day <= lastDate; day++) {
        const dateBox = document.createElement('div');
        dateBox.className = 'date-box';
        dateBox.innerText = day;

        // 날짜 클릭 시 해당 날짜를 선택하는 함수 연결
        dateBox.onclick = () => selectDate(new Date(year, month, day));
        calendarElement.appendChild(dateBox);
    }
}

/**
 * 날짜를 선택하는 함수
 * @param {Date} date - 선택할 날짜 객체
 */
function selectDate(date) {
    // 선택된 날짜를 전역 변수에 저장
    selectedDate = date;
    console.log('Selected date:', selectedDate); // 디버깅용 콘솔 출력

    // 기존에 선택되었던 날짜 강조 해제
    document.querySelectorAll('.date-box').forEach(box => box.classList.remove('selected'));

    // 선택된 날짜와 동일한 박스를 찾아 'selected' 클래스를 부여해 강조 표시
    const day = date.getDate();
    const selectedDateBox = Array.from(document.querySelectorAll('.date-box')).find(
        box => parseInt(box.innerText) === day && !box.classList.contains('empty')
    );
    if (selectedDateBox) selectedDateBox.classList.add('selected');

    // 주간 범위 표시 업데이트
    updateWeekDisplay(date);
    // 선택된 날짜 기준으로 타임라인(일정) 로딩
    loadTimeline(date);
}

/**
 * 주간 표시를 업데이트하는 함수
 * @param {Date} date - 기준 날짜
 */
function updateWeekDisplay(date) {
    const weekDisplay = document.getElementById('week-display');

    // 기준 날짜의 주 시작일(일요일)을 계산한다. (getDay()는 0=일요일)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    // 주 끝 날짜(토요일)을 계산한다. 시작일에서 6일 뒤가 주말
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    let weekDays = [];
    // 시작일부터 끝일까지 하루씩 순회하며 주간 날짜를 생성
    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
        const dayDisplay = d.getDate();
        const isSelected = d.toDateString() === date.toDateString(); // 현재 선택된 날짜와 동일한지
        const isDimmed = d.getMonth() !== date.getMonth(); // 현재 달과 다른 달의 날짜는 흐리게

        // 날짜를 클릭하면 해당 날짜로 selectDate 호출
        weekDays.push(`<span class="${isDimmed ? 'dimmed' : ''} ${isSelected ? 'selected' : ''}"
                        onclick="selectDate(new Date(${d.getFullYear()}, ${d.getMonth()}, ${dayDisplay}))">
                        ${dayDisplay}</span>`);
    }

    // 주간 날짜 표시 영역에 HTML 반영
    weekDisplay.innerHTML = weekDays.join(' ');
}


// 여기부터 이선영 코드
/**
 * 특정 날짜에 해당하는 타임라인(일정)을 서버에서 로딩하는 함수
 * @param {Date} date - 로딩할 날짜
 */
function loadTimeline(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 월을 2자리로
    const day = ('0' + date.getDate()).slice(-2); // 일을 2자리로
    const formattedDate = `${year}-${month}-${day}`;

    console.log('Loading timeline for date:', formattedDate);

    // 서버에 해당 날짜의 이벤트를 요청한다.
    fetch('/loadTimeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sDate: formattedDate })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Received data:', data); // 디버깅용
        if (data.status === 'success') {
            // 기존 타임라인 삭제
            clearTimeline();
            // 받아온 이벤트 리스트를 순회하며 타임라인 블록을 렌더링
            data.events.forEach(e => {
                console.log(`Title: ${e.title}, Start: ${e.start_time}, End: ${e.end_time}, Is Transit: ${e.is_transit}`);
                timelineRendering(e.title, e.start_time, e.end_time, e.is_transit);
            });
        } else {
            console.error(data.message);
        }
    });
}

/**
 * 타임라인을 초기화하는 함수
 * 기존의 일정 블록을 모두 제거한다.
 */
function clearTimeline() {
    const timelineAm = document.getElementById('timeline-am');
    const timelinePm = document.getElementById('timeline-pm');
    timelineAm.querySelectorAll('.time-block').forEach(block => block.remove());
    timelinePm.querySelectorAll('.time-block').forEach(block => block.remove());
}
// 여기까지 이선영 코드

/**
 * 일정 추가 팝업을 띄우는 함수
 * 일정 제목, 시작 시간, 종료 시간을 입력받는 팝업을 화면에 생성한다.
 */
function openPopup() {
    const popupBackground = document.createElement('div');
    popupBackground.className = 'popup-background schedule-popup';

    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';

    // 팝업 내부 HTML
    popupContainer.innerHTML = `
        <h2>일정 추가</h2>
        <form id="event-form">
            <div class="form-row">
                <label for="event-title">일정 제목</label>
                <input type="text" id="event-title" placeholder="일정 제목 입력">
            </div>
            <div class="form-row">
                <label for="start-time">시작 시간</label>
                <input type="time" id="start-time">
                <input type="hidden" id="hid_start-time" />
            </div>
            <div class="form-row">
                <label for="end-time">종료 시간</label>
                <input type="time" id="end-time">
                <input type="hidden" id="transit_time" />
            </div>
            <div class="form-buttons">
                <button type="button" onclick="addEventToTimelineFromPopup()">추가</button>
                <button type="button" onclick="openTransportPopup()">교통</button>
                <button type="button" onclick="closePopup('schedule-popup')">취소</button>
            </div>
        </form>
    `;

    popupBackground.appendChild(popupContainer);
    document.body.appendChild(popupBackground);
}

// 여기부터 이제우 코드
/**
 * 교통 시간 계산 후 타임라인에 추가하는 함수
 * 사용자가 교통 소요 시간(최단 시간)을 검색한 뒤 '추가' 버튼을 누르면
 * 시작 시간에서 이동 시간을 빼서 이동 시작 시간을 계산하고 타임라인에 렌더링한다.
 */
function plusTimeblock() {
    // 팝업에서 선택한 이동 시간(예: "1시간 30분") 가져오기
    const t_time = document.getElementById('popup-minimum-time').value;
    document.getElementById('transit_time').value = t_time;

    // 사용자가 입력한 시작 시간(실제 일정 시작시간)
    const sTime = document.getElementById('start-time').value;

    // 이벤트 제목 (비어있으면 "이동"으로 설정)
    const eventTitle = document.getElementById('event-title')?.value || "이동";

    // 문자열에서 시간/분 추출하여 총 이동 시간을 분으로 환산
    let totalMinutes = 0;
    const hourMatch = t_time.match(/(\d+)시간/); // "??시간" 형태 추출
    const minuteMatch = t_time.match(/(\d+)분/); // "??분" 형태 추출

    if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1], 10) * 60;
    }
    if (minuteMatch) {
        totalMinutes += parseInt(minuteMatch[1], 10);
    }

    // 시작 시간(sTime, 예: "14:30")을 분으로 변환
    const [startHour, startMinute] = sTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    // 이동 시간을 빼서 출발 시간 계산
    const newTotalMinutes = startTotalMinutes - totalMinutes;
    if (newTotalMinutes < 0) {
        alert("시간 계산 결과가 음수입니다. 입력값을 확인해주세요.");
        return;
    }

    // 다시 시:분 형태로 변환
    const newHour = Math.floor(newTotalMinutes / 60);
    const newMinute = newTotalMinutes % 60;
    const newTimeFormatted = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

    // 계산된 출발 시간을 숨겨진 필드에 저장
    document.getElementById('hid_start-time').value = newTimeFormatted;
    console.log(`계산된 출발 시간: ${newTimeFormatted}`);

    // 타임라인에 이동 일정 블록을 렌더링 (isTransitTime = true)
    timelineRendering(eventTitle, newTimeFormatted, sTime, true);

    // 교통 팝업 닫기
    closePopup('transport-popup');
}
// 여기까지 이제우 코드


/**
 * 교통 추가 팝업 열기
 * 출발지/도착지, 출발 시간, 교통수단(대중교통/자가용)을 입력받고
 * 검색을 통해 최단 이동 시간을 가져올 수 있는 팝업 창을 띄운다.
 */
function openTransportPopup() {
    const transportPopupBackground = document.createElement('div');
    transportPopupBackground.className = 'popup-background transport-popup';

    const transportPopupContainer = document.createElement('div');
    transportPopupContainer.className = 'popup-container';

    // 교통 검색 관련 팝업 HTML
    transportPopupContainer.innerHTML = `
        <!-- 출발지 입력 -->
        <div class="input-row2">
            <label for="popup-departure">출발지</label>
            <input type="text" id="popup-departure" placeholder="출발지 입력">
        </div>
        <!-- 도착지 입력 -->
        <div class="input-row2">
            <label for="popup-destination">도착지</label>
            <input type="text" id="popup-destination" placeholder="도착지 입력">
        </div>
        <!-- 출발 시간 입력 -->
        <div class="input-row2">
            <label for="popup-departure-time">출발 시간</label>
            <input type="time" id="popup-departure-time" step="600">
        </div>

        <!-- 대중교통/자가용 선택 -->
        <div class="transport-options2">
            <label><input type="checkbox" id="popup-public-transport"> 대중교통</label>
            <label><input type="checkbox" id="popup-private-vehicle"> 자가용</label>
            <!-- 검색 버튼 -->
            <button type="button" class="search-button" onclick="searchRouteFromPopup()">검색</button>
            <!-- 타임라인에 추가 버튼 -->
            <button type="button" class="plus-button" onclick="plusTimeblock(); return false;">추가</button>
        </div>
        <!-- 최단 시간 결과 -->
        <div id="shortest-time2">
            <button id="close-transport-button" type="button" onclick="closePopup('transport-popup')">닫기</button>
            <label>최단 시간</label>
            <input type="text" id="popup-minimum-time" readonly placeholder="결과가 여기에 표시됩니다">
        </div>
    `;

    transportPopupBackground.appendChild(transportPopupContainer);
    document.body.appendChild(transportPopupBackground);
}

/**
 * 교통 경로를 검색하는 함수 (팝업 내부에서 호출)
 * 출발지, 도착지, 출발 시간, 교통수단(대중/자가용)을 서버에 전송하여 최단 이동 시간 조회
 */
function searchRouteFromPopup() {
    const departure = document.getElementById("popup-departure").value.trim();
    const destination = document.getElementById("popup-destination").value.trim();
    const departureTime = document.getElementById("popup-departure-time").value;
    const isPublicTransport = document.getElementById("popup-public-transport").checked;
    const transportMode = isPublicTransport ? "public" : "private";

    if (!departure || !destination || !departureTime) {
        alert("출발지, 도착지, 출발 시간을 모두 입력해주세요.");
        return;
    }

    // 시간:분 분리
    const [hour, minute] = departureTime.split(":");

    // 서버에 경로 시간 요청
    fetch("/get-route-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            departure,
            destination,
            hour,
            minute,
            transport_mode: transportMode,
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log("Response Data:", data);
        if (data.success) {
            // 최단 시간을 결과 필드에 표시
            document.getElementById("popup-minimum-time").value = data.time;
        } else {
            alert(data.error);
        }
    })
    .catch((error) => {
        console.error("Error fetching route time:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
    });
}

/**
 * 팝업 창을 닫는 함수
 * @param {string} popupClass - 닫을 팝업의 클래스명 (예: 'schedule-popup', 'transport-popup')
 */
function closePopup(popupClass) {
    const popupBackground = document.querySelector(`.${popupClass}`);
    if (popupBackground) {
        document.body.removeChild(popupBackground);
    }
}

/**
 * 팝업창에서 일정 추가를 완료하는 함수
 * 입력받은 일정 정보를 서버에 저장 요청한 뒤, 성공 시 타임라인을 재로드한다.
 */
function addEventToTimelineFromPopup() {
    const title = document.getElementById('event-title').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const transTime = document.getElementById('hid_start-time').value;

    console.log(title, startTime, endTime, transTime);

    if (!title || !startTime || !endTime) {
        alert("모든 필드를 입력해 주세요.");
        return;
    }

    const year = selectedDate.getFullYear();
    const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
    const day = ('0' + selectedDate.getDate()).slice(-2);
    const formattedDate = `${year}-${month}-${day}`;

    // 일정 데이터 서버에 저장
    fetch('/saveTimeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 쿠키 포함 요청
        body: JSON.stringify({
            title,
            date: formattedDate,
            startTime,
            endTime,
            transTime // 계산된 출발 시간(교통)
        })
    })
    .then(response => {
        if (response.status === 401) {
            // 인증 필요 시 로그인 페이지로 이동
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // 저장 성공 시 타임라인 다시 불러오기
            loadTimeline(selectedDate);
            // 일정 추가 팝업 닫기
            closePopup('schedule-popup');
        } else {
            alert(data.message);
        }
    });
}

/**
 * (사용되지 않는 듯 하지만 코드 내 존재) 검색 관련 함수
 * 메인 페이지에서 출발지/도착지/시간/교통수단 입력 후 경로 조회 요청
 */
function searchRoute() {
    const departure = document.getElementById("departure").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const departureTime = document.getElementById("departure-time").value;
    const isPublicTransport = document.getElementById("public-transport").checked;
    const transportMode = isPublicTransport ? "public" : "private";

    if (!departure || !destination || !departureTime) {
        alert("출발지, 도착지, 출발 시간을 모두 입력해주세요.");
        return;
    }

    const [hour, minute] = departureTime.split(":");

    fetch("/get-route-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            departure,
            destination,
            hour,
            minute,
            transport_mode: transportMode,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById("minimum-time").value = data.time;
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        console.error("Error fetching route time:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
    });
}

// 여기부터 이제우 코드
/**
 * 타임라인에 일정(블록) 렌더링 함수
 * @param {string} title - 일정 제목
 * @param {string} startTime - 시작 시간 (HH:MM 형식)
 * @param {string} endTime - 종료 시간 (HH:MM 형식)
 * @param {boolean} isTransitTime - 이동 일정 여부(true 시 이동 색상)
 */
function timelineRendering(title, startTime, endTime, isTransitTime=false) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // 타임라인에서 1시간당 높이(px)
    const hourHeight = 50;
    // 1분당 높이(px)
    const minuteHeight = hourHeight / 60;

    let timelineContainer;
    let startHourInTimeline;
    let endHourInTimeline;

    // AM/PM 영역 구분: 0~11시는 AM, 12~23시는 PM
    if (startHour < 12) {
        timelineContainer = document.getElementById('timeline-am');
        startHourInTimeline = startHour;
    } else {
        timelineContainer = document.getElementById('timeline-pm');
        startHourInTimeline = startHour - 12;
    }

    if (endHour < 12) {
        endHourInTimeline = endHour;
    } else {
        endHourInTimeline = endHour - 12;
    }

    // 시작 시간 상단 offset 계산
    const startTopOffset =
        startHourInTimeline * hourHeight + startMinute * minuteHeight;
    // 종료 시간 상단 offset 계산
    const endTopOffset =
        endHourInTimeline * hourHeight + endMinute * minuteHeight;

    // 블록 높이
    const blockHeight = endTopOffset - startTopOffset;

    // 일정 블록 생성 및 스타일 설정
    const timeBlock = document.createElement('div');
    timeBlock.className = 'time-block';
    timeBlock.style.position = 'absolute';
    timeBlock.style.top = `${startTopOffset}px`;
    timeBlock.style.height = `${blockHeight}px`;
    timeBlock.style.left = '12%';
    timeBlock.style.width = '85%';
    timeBlock.style.backgroundColor = isTransitTime ? '#d4a5a5' : '#708aa0'; 
    timeBlock.style.color = 'white';
    timeBlock.style.padding = '5px';
    timeBlock.style.borderRadius = '4px';
    timeBlock.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    timeBlock.style.display = 'flex';
    timeBlock.style.alignItems = 'center';
    timeBlock.style.justifyContent = 'center';
    timeBlock.style.flexDirection = 'column';
    timeBlock.innerText = `${title}\n(${startTime} - ${endTime})`;

    // 타임라인 컨테이너에 일정 블록 추가
    timelineContainer.appendChild(timeBlock);
}
// 여기까지 이제우 코드