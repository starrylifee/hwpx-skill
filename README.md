# hwpx 스킬

AI 코딩 에이전트(Claude Code, Codex)가 한글 문서(.hwpx)를 만들고, 고치고, 한글로 열어 확인하게 해 주는 스킬입니다.

학교에서 공문 첨부, 교수학습과정안, 보고서, 신청서를 hwpx로 만들다가 겪은 오류와 해결법을 모았습니다. "긴 문단이 한 줄로 그려진다", "표 칸이 통째로 사라진다", "한글에서 파일이 안 열린다" 같은 문제를 AI가 미리 피하도록 규칙으로 적어 두었습니다.

## 할 수 있는 일

- 양식 채우기: 한글에서 만든 양식에 `{{키}}`를 넣어 두면 AI가 내용을 채워 hwpx로 저장합니다. 여러 줄 내용, 행 수가 바뀌는 표도 다룹니다.
- 새 문서 만들기: 제목, 본문, 그림이 있는 단순한 문서를 처음부터 조립합니다.
- 기존 hwpx 고치기: 글자색 표시, 표 서식 통일, 차례 쪽수 맞추기 등.
- 열어서 확인하기: 만든 파일을 한글로 열어 PDF·PNG로 바꾼 뒤 줄바꿈과 표가 제대로 나왔는지 눈으로 봅니다.

## 설치

`hwpx` 폴더를 통째로 아래 위치에 복사하면 됩니다. 저장소를 내려받는 방법은 둘 중 편한 쪽으로 하세요.

- 초록색 Code 버튼 → Download ZIP → 압축 풀기
- `git clone https://github.com/starrylifee/hwpx-skill.git`

| 쓰는 도구 | 복사할 위치 |
|---|---|
| Claude Code | `C:\Users\사용자이름\.claude\skills\hwpx\` |
| Codex | `C:\Users\사용자이름\.codex\skills\hwpx\` |

복사한 뒤 에이전트를 새로 열고 "hwpx로 안내문 만들어줘"처럼 말하면 스킬이 쓰입니다.

## 준비물

- 파일 만들기: Node.js(`npm i jszip`) 또는 Python. 에이전트가 상황에 맞게 고릅니다.
- 한글로 열어 확인하기: 한글(한컴오피스)이 설치된 Windows PC, Python 패키지 `pip install pywin32 pymupdf`
  - 한글이 없으면 파일은 만들어지지만 확인 단계는 건너뜁니다.
  - 확인 단계에서 에이전트가 한글을 실행해도 되는지 물을 수 있습니다. 허용하면 됩니다.

## 폴더 구성

```
hwpx/
├─ SKILL.md          AI가 읽는 설명서 (규칙, 절차, 실전 교훈)
├─ hwpx.js           새 문서 조립 코드 (예시는 특허 명세서)
├─ template/         hwpx.js가 쓰는 한글 기본 틀
├─ node_example.js   Node에서 hwpx.js로 파일 만드는 예시
└─ render_check.py   hwpx → PDF → PNG 변환 (한글 COM)
```

직접 시험해 보려면:

```
cd hwpx
npm i jszip
node node_example.js 예시.hwpx
python render_check.py 예시.hwpx
```

## 알려진 한계

- 한글로 열어 확인하는 기능은 Windows + 한글에서만 됩니다.
- `hwpx.js`의 문서 구성은 특허 명세서 예시입니다. 다른 문서는 AI가 같은 부품으로 새로 짭니다.
- 한글 버전에 따라 결과가 조금 다를 수 있습니다. 한글 2022(12.0)에서 확인했습니다.

## 라이선스

MIT. 자유롭게 쓰고 고치고 나눠도 됩니다. 출처만 남겨 주세요.
