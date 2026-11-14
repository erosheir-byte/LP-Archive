# 바이닐 일괄 등록용 엑셀 양식(templates/turnit-import-template.xlsx)을 만든다.
# 앱의 등록 화면과 같은 항목·값(컬러·상태·RPM·인치·장르)을 드롭다운으로 넣고, 날짜 칸에는 입력 안내를 단다.
# 사용: pip install openpyxl && python3 scripts/make-import-template.py
# 컬러·장르 목록은 index.html 의 PALETTE·GENRES 와 맞춘다. 첫 시트(LP 목록)를 앱이 읽는다.
import datetime, os
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(__file__), '..', 'templates', 'turnit-import-template.xlsx')
ROWS = 2000   # 드롭다운·서식을 미리 걸어 둘 행 수

COLORS = ['블랙', '레드', '오렌지', '옐로우', '그린', '블루', '네이비', '퍼플', '핑크', '골드', '실버',
          '투명', '연보라', '연두', '하늘', '화이트', '그레이', '브라운', '마블', '스플래터']
STATUS = ['미개봉', '개봉', '배송전', '위시']
RPMS = ['33', '45']
INCHES = ['12"', '10"', '7"']
GENRES = ['가요', '팝', '록', '얼터너티브', 'R&B/소울', '힙합/랩', '일렉트로닉', '댄스', '재즈', '블루스', '클래식',
          '사운드트랙', '애니메이션', '싱어송라이터', '포크', '컨트리', 'J-Pop', '뉴에이지', '월드', '라틴', '레게', '홀리데이', '기타']

# (머리글, 필수?, 너비, 안내 메모, 종류)
COLS = [
    ('가수 (필수)', True, 16, '가수·밴드 이름', 'text'),
    ('앨범명 (필수)', True, 24, '앨범 제목', 'text'),
    ('컬러 (필수)', True, 12, '목록에서 고르세요. 목록에 없는 색(예: 클리어 그린)은 그대로 적어도 돼요.', 'color'),
    ('상태 (필수)', True, 12, '미개봉 / 개봉 / 배송전 / 위시 중에서 고르세요.', 'status'),
    ('구매처', False, 12, '예: yes24, 알라딘, 레코드샵 이름 (위시는 비워도 돼요)', 'text'),
    ('구매가 (원)', False, 12, '숫자만 적으세요. 예: 38000 (쉼표·원은 있어도 돼요)', 'money'),
    ('정가 (선택)', False, 12, '숫자만 적으세요. 예: 45000', 'money'),
    ('구매일', False, 12, '날짜는 2024-03-05 처럼 적으세요.\n2024.3.5 · 2024년 3월 5일도 돼요.', 'date'),
    ('도착일 (선택)', False, 14, '받은 날. 날짜는 2024-03-05 처럼 적으세요.', 'date'),
    ('개봉일 (선택)', False, 14, '뜯은 날 (상태가 개봉일 때). 날짜는 2024-03-05 처럼 적으세요.', 'date'),
    ('RPM (선택)', False, 12, '33 또는 45', 'rpm'),
    ('인치 (선택)', False, 12, '12" / 10" / 7" (대부분 12")', 'inch'),
    ('장르 (선택)', False, 13, '목록에서 고르거나 직접 적어도 돼요.', 'genre'),
    ('발매년도 (선택)', False, 15, '4자리 숫자. 예: 2018', 'year'),
    ('비고 (선택)', False, 28, '메모 (예: 한정반, 사인반)', 'text'),
]

wb = Workbook()
ws = wb.active
ws.title = 'LP 목록'
lists = wb.create_sheet('목록')        # 드롭다운 값 (숨김)
guide = wb.create_sheet('작성 방법')

# --- 드롭다운 값 시트
for c, (name, vals) in enumerate([('컬러', COLORS), ('상태', STATUS), ('RPM', RPMS), ('인치', INCHES), ('장르', GENRES)], start=1):
    lists.cell(row=1, column=c, value=name)
    for r, v in enumerate(vals, start=2):
        lists.cell(row=r, column=c, value=v)
lists.sheet_state = 'hidden'
rng = lambda col, n: f"'목록'!${col}$2:${col}${n + 1}"

# --- 머리글
REQ = PatternFill('solid', fgColor='E8643C'); OPT = PatternFill('solid', fgColor='3A3842'); OPT2 = PatternFill('solid', fgColor='6B6874')
thin = Side(style='thin', color='D9D6DE')
for i, (title, req, width, tip, kind) in enumerate(COLS, start=1):
    cell = ws.cell(row=1, column=i, value=title)
    cell.font = Font(bold=True, color='FFFFFF', size=11)
    cell.fill = REQ if req else (OPT2 if '(선택)' in title else OPT)
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = Border(bottom=thin)
    cm = Comment(tip, 'Turnit'); cm.width = 260; cm.height = 90
    cell.comment = cm
    letter = cell.column_letter
    ws.column_dimensions[letter].width = width
    area = f'{letter}2:{letter}{ROWS + 1}'

    def dv(**kw):
        d = DataValidation(allow_blank=True, showInputMessage=True, promptTitle=title.split(' (')[0][:32], prompt=tip[:255], **kw)
        ws.add_data_validation(d); d.add(area); return d

    if kind == 'color':  dv(type='list', formula1=rng('A', len(COLORS)), errorStyle='information', showErrorMessage=False)
    elif kind == 'status': dv(type='list', formula1=rng('B', len(STATUS)), errorStyle='stop', showErrorMessage=True,
                              errorTitle='상태', error='미개봉 / 개봉 / 배송전 / 위시 중에서 골라 주세요.')
    elif kind == 'rpm':  dv(type='list', formula1=rng('C', len(RPMS)), errorStyle='warning', showErrorMessage=True, errorTitle='RPM', error='33 또는 45 를 골라 주세요.')
    elif kind == 'inch': dv(type='list', formula1=rng('D', len(INCHES)), errorStyle='warning', showErrorMessage=True, errorTitle='인치', error='12" / 10" / 7" 중에서 골라 주세요.')
    elif kind == 'genre': dv(type='list', formula1=rng('E', len(GENRES)), errorStyle='information', showErrorMessage=False)
    elif kind == 'date':
        dv(type='date', operator='greaterThan', formula1='DATE(1950,1,1)', errorStyle='warning', showErrorMessage=True,
           errorTitle='날짜', error='날짜는 2024-03-05 처럼 적어 주세요.')
        for r in range(2, ROWS + 2): ws.cell(row=r, column=i).number_format = 'yyyy-mm-dd'
    elif kind == 'money':
        dv(type='whole', operator='greaterThanOrEqual', formula1='0', errorStyle='warning', showErrorMessage=True, errorTitle='금액', error='숫자만 적어 주세요. 예: 38000')
        for r in range(2, ROWS + 2): ws.cell(row=r, column=i).number_format = '#,##0'
    elif kind == 'year':
        dv(type='whole', operator='between', formula1='1900', formula2='2100', errorStyle='warning', showErrorMessage=True, errorTitle='발매년도', error='4자리 숫자로 적어 주세요. 예: 2018')
    elif kind == 'text':
        dv(type='none')

ws.row_dimensions[1].height = 34
ws.freeze_panes = 'A2'
ws.sheet_view.zoomScale = 110

# --- 작성 방법 시트: 위에서 아래로 (설명 → 예시 표). 열 너비는 「LP 목록」과 같게
H = Font(bold=True, size=15, color='E8643C'); B = Font(bold=True, size=11); G = Font(size=10, color='6B6874')
for i, col in enumerate(COLS, start=1):
    guide.column_dimensions[ws.cell(row=1, column=i).column_letter].width = col[2]
LAST = len(COLS)
def line(r, label, text, font=None):
    guide.cell(row=r, column=1, value=label).font = font or B
    if text:
        guide.merge_cells(start_row=r, start_column=2, end_row=r, end_column=LAST)
        c = guide.cell(row=r, column=2, value=text); c.alignment = Alignment(wrap_text=True, vertical='top')
guide['A1'] = 'Turnit 바이닐 일괄 등록 양식'; guide['A1'].font = H
guide.merge_cells(start_row=2, start_column=1, end_row=2, end_column=LAST)
guide['A2'] = '「LP 목록」 시트의 2번째 줄부터 한 줄에 한 장씩 적고, 앱의 설정 > 엑셀·CSV 파일로 한번에 등록 에서 이 파일을 올리세요.'; guide['A2'].font = G
r = 4
line(r, '꼭 지켜 주세요', None); r += 1
for t in ['「LP 목록」 시트의 첫 줄(머리글)은 지우거나 순서를 바꾸지 마세요.',
          '주황색 머리글(필수) 칸은 꼭 채워 주세요: 가수, 앨범명, 컬러, 상태',
          '같은 앨범을 여러 장 가지고 있다면 줄을 나눠 따로 적으세요.']:
    line(r, '', '· ' + t); r += 1
r += 1
line(r, '칸 설명', None); r += 1
for a, t in [('컬러', '드롭다운에서 고르세요. 목록에 없는 색(예: 클리어 그린)은 그대로 적어도 돼요.'),
             ('상태', '미개봉 / 개봉 / 배송전 / 위시 중에서 고르세요.'),
             ('구매가 · 정가', '숫자만 적으세요 (예: 38000). 위시는 비워도 돼요.'),
             ('날짜 칸', '구매일 · 도착일 · 개봉일 — 2024-03-05 처럼 적으세요. 2024.3.5 · 2024년 3월 5일도 돼요.'),
             ('RPM · 인치', '모르면 비워 두세요. 대부분 33 RPM · 12" 예요.'),
             ('장르 · 발매년도', '비워 두면 앱이 앨범을 찾으며 채워 주기도 해요.')]:
    line(r, a, t); r += 1
r += 1
line(r, '예시', None); r += 1
for i, col in enumerate(COLS, start=1):
    c = guide.cell(row=r, column=i, value=col[0])
    c.font = Font(bold=True, color='FFFFFF', size=10); c.fill = REQ if col[1] else (OPT2 if '(선택)' in col[0] else OPT)
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
guide.row_dimensions[r].height = 30
examples = [
    ['검정치마', 'TEAM BABY', '블랙', '개봉', 'yes24', 38000, 45000, datetime.date(2024, 3, 5), datetime.date(2024, 3, 8), datetime.date(2024, 3, 10), '33', '12"', '가요', 2017, '첫 바이닐'],
    ['AKMU', '항해', '투명', '배송전', '알라딘', 52000, None, datetime.date(2024, 11, 1), None, None, '', '', '가요', 2019, ''],
    ['Tom Misch', 'Geography', '레드', '위시', '', None, None, None, None, None, '', '', '팝', 2018, '사고 싶은 앨범'],
]
for row in examples:
    r += 1
    for i, v in enumerate(row, start=1):
        c = guide.cell(row=r, column=i, value=v)
        if isinstance(v, datetime.date): c.number_format = 'yyyy-mm-dd'
        if COLS[i - 1][4] == 'money' and v is not None: c.number_format = '#,##0'
r += 2
guide.cell(row=r, column=1, value='이 시트는 앱이 읽지 않아요. 지워도 괜찮아요.').font = G
guide.sheet_view.zoomScale = 110

wb.active = 0
os.makedirs(os.path.dirname(OUT), exist_ok=True)
wb.save(OUT)
print('saved', os.path.abspath(OUT))
