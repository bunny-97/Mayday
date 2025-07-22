// 마지막 표시한 부분 빼고 모두 이제우가 작성한 코드입니다 (47~68줄: 이선영)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const message = document.createElement('p');
    loginForm.appendChild(message);

    // 로그인 폼 제출 이벤트 처리
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침) 방지

        // 입력 필드에서 사용자명과 비밀번호를 가져옴
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 서버에 로그인 요청
        fetch('/login', {
            method: 'POST', // POST 메소드 사용
            headers: { 'Content-Type': 'application/json' }, // 요청을 JSON 형식으로 보냄
            body: JSON.stringify({ username, password }) // 사용자명, 비밀번호를 JSON으로 직렬화하여 전송
        })
        .then(response => response.json()) // 응답을 JSON으로 파싱
        .then(data => {
            // 로그인 성공 시
            if (data.status === 'success') {
                // 서버에서 제공한 redirect URL로 페이지 이동
                window.location.href = data.redirect;
            } else {
                // 로그인 실패 시 메시지 표시
                message.style.color = 'red';
                message.textContent = data.message;
            }
        });
    });
});

// 회원가입 팝업 열기
function openSignup() {
    document.getElementById('signupPopup').style.display = 'flex';
}

// 회원가입 팝업 닫기
function closeSignup() {
    document.getElementById('signupPopup').style.display = 'none';
}

// 여기부터 이선영 코드
// 서버에 회원가입 요청을 보내고 응답 처리
function submitSignup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    // 서버에 회원가입 요청
    fetch('/register', {
        method: 'POST', // POST 메소드로 회원가입 정보 전송
        headers: { 'Content-Type': 'application/json' }, // 요청을 JSON 형식으로 전송
        body: JSON.stringify({ username, password }) // 사용자명, 비밀번호를 JSON으로 직렬화하여 전송
    })
    .then(response => response.json()) // 응답을 JSON으로 파싱
    .then(data => {
        // 서버 응답 메시지를 얼럿으로 표시
        alert(data.message);
        // 회원가입 성공 시 팝업을 닫음
        if (data.status === 'success') {
            closeSignup();
        }
    });
}
// 여기까지 이선영 코드