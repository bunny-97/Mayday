# 여기부터 이선영 코드
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from dotenv import load_dotenv
load_dotenv()

import subprocess
import os

# 동적 라이브러리 경로 설정
os.environ['DYLD_LIBRARY_PATH'] = '/opt/homebrew/lib:' + os.environ.get('DYLD_LIBRARY_PATH', '')

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Flask 세션을 위한 비밀 키 설정

# 현재 디렉토리 및 프로젝트 관련 디렉토리 경로 설정
current_directory = os.getcwd()
PROJECT_ROOT = current_directory
TRANSIT_DIR = os.path.join(PROJECT_ROOT, "transit")  # 대중교통 C 프로그램 디렉토리
DB_DIR = os.path.join(PROJECT_ROOT, "db_manager", "db_manager")  # 데이터베이스 관리 C 프로그램 디렉토리

# 홈 페이지 라우트: 로그인 페이지 렌더링
@app.route('/')
def home():
    return render_template('login.html')

# C 프로그램 경로 설정 (db_manager 실행 파일 경로)
db_manager_path = os.path.abspath(DB_DIR)

# 회원가입 처리 라우트
@app.route('/register', methods=['POST'])
def register():
    # 클라이언트에서 JSON 데이터 가져오기
    data = request.get_json()
    username = data['username'].strip()  # 사용자 이름 공백 제거
    password = data['password'].strip()  # 비밀번호 공백 제거

    try:
        # C 프로그램 실행하여 회원가입 처리
        result = subprocess.check_output([db_manager_path, 'register', username, password], text=True).strip()
        # 결과에 따라 JSON 응답 반환
        return jsonify({'status': 'success', 'message': '회원가입이 완료되었습니다!'}) if result == 'success' else jsonify({'status': 'fail', 'message': '이미 존재하는 아이디입니다.'})
    except subprocess.CalledProcessError as e:
        return jsonify({'status': 'fail', 'message': f'회원가입 중 오류가 발생했습니다: {e.output}'})

# 로그인 처리 라우트
@app.route('/login', methods=['POST'])
def login():
    # 클라이언트에서 JSON 데이터 가져오기
    data = request.get_json()
    username = data['username'].strip()  # 사용자 이름 공백 제거
    password = data['password'].strip()  # 비밀번호 공백 제거

    try:
        # C 프로그램 실행하여 로그인 처리
        result = subprocess.check_output([db_manager_path, 'login', username, password], text=True).strip()
        if result == 'success':
            session['username'] = username  # 로그인 성공 시 세션에 사용자 이름 저장
            return jsonify({'status': 'success', 'redirect': url_for('calendar')})
        else:
            return jsonify({'status': 'fail', 'message': '아이디 또는 비밀번호가 잘못되었습니다.'})
    except subprocess.CalledProcessError as e:
        return jsonify({'status': 'fail', 'message': f'로그인 중 오류가 발생했습니다: {e.output}'})

# 달력 페이지 라우트: calendar.html 렌더링
@app.route('/calendar')
def calendar():
    return render_template('calendar.html')

# 특정 날짜에 대한 달력 페이지 렌더링
@app.route('/cal')
def cal():
    selected_date = request.args.get('date')
    return render_template('cal.html', date=selected_date)

# 타임라인 이벤트 저장 라우트
@app.route('/saveTimeline', methods=['POST'])
def save_timeline():
    # 사용자가 로그인하지 않은 경우 401 상태 코드 반환
    if 'username' not in session:
        return jsonify({'status': 'fail', 'message': '로그인이 필요합니다.'}), 401

    # 세션에서 사용자 이름 가져오기
    username = session['username']
    # 클라이언트에서 JSON 데이터 가져오기
    data = request.get_json()
    title = str(data.get('title', ''))
    date = str(data.get('date', ''))
    start_time = str(data.get('startTime', ''))
    end_time = str(data.get('endTime', ''))
    trans_time = str(data.get('transTime', ''))

    try:
        # C 프로그램 실행하여 이벤트 저장
        cmd = [
            db_manager_path,
            'save_event',
            username,
            date,
            title,
            start_time,
            end_time,
            trans_time
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        # 결과에 따라 JSON 응답 반환
        if result.returncode == 0 and result.stdout.strip() == 'success':
            return jsonify({'status': 'success'})
        else:
            error_output = result.stderr.strip() or result.stdout.strip()
            return jsonify({'status': 'fail', 'message': f'이벤트 저장에 실패했습니다: {error_output}'})
    except Exception as e:
        return jsonify({'status': 'fail', 'message': f'이벤트 저장 중 오류가 발생했습니다: {str(e)}'})

# 타임라인 이벤트 로드 라우트
@app.route('/loadTimeline', methods=['POST'])
def load_timeline():
    # 사용자가 로그인하지 않은 경우 401 상태 코드 반환
    if 'username' not in session:
        return jsonify({'status': 'fail', 'message': '로그인이 필요합니다.'}), 401

    # 세션에서 사용자 이름 가져오기
    username = session['username']
    # 클라이언트에서 JSON 데이터 가져오기
    data = request.get_json()
    date = str(data.get('sDate', ''))

    try:
        # C 프로그램 실행하여 이벤트 로드
        cmd = [db_manager_path, 'load_events', username, date]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            output = result.stdout.strip()
            lines = output.split('\n')
            if lines[0] == 'success':  # 로드 성공 시 이벤트 목록 반환
                events = []
                for line in lines[1:]:
                    if line:
                        fields = line.strip().split(';')
                        if len(fields) == 3:
                            title, start_time, end_time = fields
                            is_transit = "이동시간" in title  # 이동시간 여부 확인
                            events.append({'title': title, 'start_time': start_time, 'end_time': end_time, 'is_transit': is_transit})
                return jsonify({'status': 'success', 'events': events})
            else:
                return jsonify({'status': 'fail', 'message': '이벤트 로드에 실패했습니다.'})
        else:
            error_output = result.stderr.strip() or result.stdout.strip()
            return jsonify({'status': 'fail', 'message': f'이벤트 로드에 실패했습니다: {error_output}'})
    except Exception as e:
        return jsonify({'status': 'fail', 'message': f'이벤트 로드 중 오류가 발생했습니다: {str(e)}'})
# 여기까지 이선영 코드

##############################################################################################################

#여기부터 권여준 코드
# 좌표 가져오기 함수: C 프로그램 실행
def get_coordinates(departure, destination):
    os.chdir(TRANSIT_DIR)  # C 프로그램이 위치한 디렉토리로 변경
    try:
        # C 프로그램 실행하여 좌표 가져오기
        result = subprocess.check_output(['./get_coordinates', departure, destination], text=True)
        lines = result.strip().splitlines()
        if len(lines) < 2:
            raise ValueError("C 프로그램 출력이 예상보다 적습니다.")
        return {'success': True, 'start_coords': lines[0], 'end_coords': lines[1]}
    except subprocess.CalledProcessError as e:
        return {'success': False, 'error': f"C 프로그램 실행 실패: {e}"}
    except ValueError as ve:
        return {'success': False, 'error': str(ve)}

# 대중교통 소요 시간 가져오기
def get_transit_time(start_coords, end_coords, hour, minute):
    try:
        # Python 스크립트 실행하여 대중교통 소요 시간 계산
        result = subprocess.check_output(['python3', 'get_transit_time.py', start_coords, end_coords, hour, minute], text=True)
        return {'success': True, 'time': result.strip()}
    except subprocess.CalledProcessError as e:
        return {'success': False, 'error': str(e)}

# 자가용 소요 시간 가져오기
def get_car_duration(start_coords, end_coords):
    try:
        # C 프로그램 실행하여 자가용 소요 시간 계산
        result = subprocess.check_output(['./get_route_info', start_coords, end_coords], text=True)
        return {'success': True, 'time': result.strip()}
    except subprocess.CalledProcessError as e:
        return {'success': False, 'error': str(e)}

# 경로 소요 시간 계산 라우트
@app.route('/get-route-time', methods=['POST'])
def get_route_time():
    # 클라이언트에서 JSON 데이터 가져오기
    data = request.json
    departure = data.get('departure')
    destination = data.get('destination')
    hour = data.get('hour')
    minute = data.get('minute')
    transport_mode = data.get('transport_mode')

    # 필수 입력값 확인
    if not departure or not destination or not hour or not minute:
        return jsonify({'success': False, 'error': '모든 입력값을 제공해야 합니다.'})

    # 좌표 가져오기
    coords = get_coordinates(departure, destination)
    if not coords['success']:
        return jsonify({'success': False, 'error': coords['error']})

    start_coords = coords['start_coords']
    end_coords = coords['end_coords']

    # 교통수단에 따른 소요 시간 계산
    if transport_mode == 'public':
        transit_result = get_transit_time(start_coords, end_coords, hour, minute)
        if transit_result['success']:
            return jsonify({'success': True, 'time': transit_result['time']})
        return jsonify({'success': False, 'error': transit_result['error']})
    else:
        car_result = get_car_duration(start_coords, end_coords)
        if car_result['success']:
            return jsonify({'success': True, 'time': car_result['time']})
        return jsonify({'success': False, 'error': car_result['error']})
    
# 여기까지 권여준 코드
##############################################################################################################

# 애플리케이션 실행
if __name__ == '__main__':
    app.run(debug=True)