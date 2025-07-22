// 전체 이제우 코드
// 현재 연도와 월을 추적하는 변수
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 (January)부터 시작

// 2024, 2025, 2026년의 주요 공휴일을 객체로 정의
const holidays = {
    '2024-01-01': '신정',
    '2024-02-10': '설날',
    '2024-02-11': '설날 연휴',
    '2024-02-12': '대체휴일(설날)',
    '2024-03-01': '삼일절',
    '2024-05-05': '어린이날',
    '2024-05-06': '대체휴일(어린이날)',
    '2024-06-06': '현충일',
    '2024-08-15': '광복절',
    '2024-09-17': '추석 연휴',
    '2024-09-18': '추석',
    '2024-09-19': '추석 연휴',
    '2024-10-03': '개천절',
    '2024-10-09': '한글날',
    '2024-12-25': '성탄절',

    '2025-01-01': '신정',
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '대체휴일(설날)',
    '2025-03-01': '삼일절',
    '2025-05-05': '어린이날',
    '2025-05-06': '대체휴일(어린이날)',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-10-06': '추석 연휴',
    '2025-10-07': '추석',
    '2025-10-08': '추석 연휴',
    '2025-10-03': '개천절',
    '2025-10-09': '한글날',
    '2025-12-25': '성탄절',

    '2026-01-01': '신정',
    '2026-02-16': '설날 연휴',
    '2026-02-17': '설날',
    '2026-02-18': '대체휴일(설날)',
    '2026-03-01': '삼일절',
    '2026-05-05': '어린이날',
    '2026-05-06': '대체휴일(어린이날)',
    '2026-06-06': '현충일',
    '2026-08-15': '광복절',
    '2026-09-24': '추석 연휴',
    '2026-09-25': '추석',
    '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절',
    '2026-10-09': '한글날',
    '2026-12-25': '성탄절'
};

// 달력 렌더링 함수
function renderCalendar(year, month) {
    console.log(`달력 렌더링: ${year}-${month + 1}`); // 콘솔에 현재 연/월 표시
    const monthDisplay = document.getElementById('month-display');
    const calendarGrid = document.getElementById('calendar-grid');
    // 이전 달력 내용 초기화
    calendarGrid.innerHTML = '';

    // 월 이름 배열
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // 현재 월/연도 표시
    monthDisplay.innerText = `${monthNames[month]} ${year}`;

    // 해당 월의 첫날과 마지막 날 객체 생성
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // 해당 월 첫 날의 요일(0:일요일~6:토요일)
    const firstDayWeekday = firstDayOfMonth.getDay();

    // 첫 주의 빈칸(이전 달 날짜들 공백 처리)
    for (let i = 0; i < firstDayWeekday; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'date-box empty';
        calendarGrid.appendChild(emptyBox);
    }

    // 날짜 채우기 (1일부터 마지막 날까지)
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dateBox = document.createElement('div');
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dateBox.className = 'date-box';
        dateBox.innerText = day;

        // 날짜 클릭 시 openSchedule 호출 (특정 날짜로 이동)
        dateBox.onclick = () => openSchedule(day);

        // 공휴일 확인 후 스타일 적용 및 툴팁 표시
        if (holidays[dateStr]) {
            dateBox.classList.add('holiday');
            dateBox.title = holidays[dateStr];
        }

        calendarGrid.appendChild(dateBox);
    }
}

// 특정 날짜를 선택 시 실행되는 함수
function openSchedule(day) {
    // 현재 연/월과 선택한 일을 합쳐서 YYYY-MM-DD 형식으로 만듦
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 해당 날짜를 쿼리 파라미터로 포함하여 cal.html로 이동
    window.location.href = `/cal?date=${formattedDate}`;
}

// 이전 달 버튼 클릭 시 이전 달로 이동
document.getElementById('prev-month').onclick = () => {
    console.log("이전 달로 이동");
    currentMonth--;
    // 이전 해로 넘어가는 경우 처리
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
};

// 다음 달 버튼 클릭 시 다음 달로 이동
document.getElementById('next-month').onclick = () => {
    console.log("다음 달로 이동");
    currentMonth++;
    // 다음 해로 넘어가는 경우 처리
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
};

// 초기 달력 렌더링
renderCalendar(currentYear, currentMonth);