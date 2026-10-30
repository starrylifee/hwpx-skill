---
name: hwpx
description: 검증된 코드로 한글 hwpx 파일을 생성·수정·렌더검증하는 스킬. "hwpx 만들어줘", "hwpx로 문서 생성", "한글 파일 만들어", "hwpx 수정해줘", "hwpx 안 열려", "hwpx 검증", "양식 채워줘", "교수학습과정안 양식", "lineseg", "HWP 파일" 같은 요청에 사용. 표·양식이 복잡한 문서는 템플릿 채우기 방식, 간단한 문서는 밑바탕 조립 방식으로 처리하고 마지막에 한글 COM으로 실제 렌더를 확인한다.
---

# hwpx 생성·수정·검증

실제 서비스에서 한글로 열리는 것까지 확인한 hwpx 코드와 규칙을 모았다. 이 폴더의 자산 파일에서 출발한다.

## 방식 선택

| 문서 성격 | 방식 | 자산 |
|---|---|---|
| 표·양식·복잡한 레이아웃 (교수학습과정안, 보고서 양식) | **템플릿 채우기** — 한글에서 만든 실제 template.hwpx에 {{키}}를 박고 문자열 치환 | 아래 «템플릿 채우기 절차» |
| 제목+본문+이미지 같은 단순 문서 (명세서, 안내문) | **밑바탕 조립** — `template/` 파트 + section0.xml 코드 생성 | `hwpx.js` + `template/` (Node는 `node_example.js`) |
| 어느 쪽이든 마지막 | **렌더 검증** — 한글 COM으로 PDF→PNG | `render_check.py` |

## 절대 규칙 (어기면 한글에서 안 열리거나 렌더가 깨진다)

1. **mimetype은 첫 항목 + STORE 압축.** JSZip: `zip.file('mimetype', txt, {compression:'STORE'})`. .NET ZipArchive는 `NoCompression`을 지정해도 무시하고 DEFLATE로 쓰므로, .NET으로 hwpx zip을 새로 만들면 한글이 거부한다.
2. **텍스트를 바꾼 문단의 `<hp:linesegarray>`는 전부 제거.** lineseg는 레이아웃 캐시(textpos/vertpos)라서 텍스트 길이가 바뀌면 무효가 되고, 한글이 긴 셀의 레이아웃을 못 잡아 표 셀이 통째로 누락된다. 제거하면 한글이 열 때 재계산한다.
   `xml = xml.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g, "").replace(/<hp:linesegarray\s*\/>/g, "");`
3. **맨바닥 조립으로 새 문단을 만들 때는 줄마다 lineseg를 직접 생성.** `hwpx.js`의 `linesegs()`가 그 구현이다: 글자 폭 근사(전각 1200, 반각 600), 본문 폭 44000(HWPUNIT, 실제 46772보다 좁게), vertpos `i*3360`. 문단마다 `<hp:linesegarray>`에 줄 수만큼 `<hp:lineseg>` — 이걸 빼면 긴 문단이 한 줄로 그려진다. (원본 hwpx를 껍데기로 쓸 때는 반대로 빼는 편이 낫다 — 아래 «원본 서식으로 초안 만들기»)
4. **XML escape:** `& < >` (그리고 `"`도) — `hwpx.js`의 `esc()`.
5. **여러 줄 텍스트는 {{키}}가 든 가장 안쪽 `<hp:p>`를 줄 수만큼 통째로 복제**해 복제본마다 한 줄씩 넣는다 — 줄바꿈 문자를 그대로 넣으면 한글이 죽거나 깨진다.
6. **표 행을 복제할 때는 4종 보정:** 셀 `cellAddr`의 `rowAddr`, 표 `rowCnt`, 위 병합 셀의 `rowSpan`, 복제본 `<hp:p>` id(`900000000` 같은 별도 범위).
7. `<hp:p id>`는 문서 안에서 유니크해야 한다.
8. **검증은 눈으로 끝낸다.** `render_check.py 생성물.hwpx` → PDF/PNG가 나오면(변환 성공 = 한글이 열었다는 뜻) PNG를 열어 줄바꿈·표·빈칸·{{키}} 잔여를 확인한다. {{키}} 잔여는 `/\{\{.*?\}\}/` 정규식으로도 검사.

## 템플릿 채우기 절차

1. 한글에서 양식을 만들고 채울 자리에 `{{키}}`를 입력해 template.hwpx로 저장한다.
2. JSZip(또는 Python zipfile)으로 열어 `Contents/section0.xml`을 문자열로 꺼낸다. 치환 전에 `{{키}}`가 문자열 검색으로 그대로 찾아지는지 먼저 확인한다.
3. 치환한다.
   - 한 줄 값: `{{키}}`를 XML escape한 값으로 바꾼다.
   - 여러 줄 값: 규칙 5대로 `{{키}}`가 든 가장 안쪽 `<hp:p>`(정규식 `<hp:p\b[^>]*>(?:(?!<hp:p\b)[\s\S])*?키(?:(?!<hp:p\b)[\s\S])*?</hp:p>`)를 줄 수만큼 복제한다. 못 찾으면 줄바꿈을 공백으로 바꿔 한 줄로 넣는다.
   - 행 수가 바뀌는 표(평가 기준표 등): 기준 행 하나에 `{{항목}}`을 박아 두고, 그 `<hp:tr>`을 n개로 복제하면서 규칙 6의 4종 보정을 하고 복제본의 키에 번호를 붙인다(`{{평가1_범주}}` …). 그다음 번호 붙은 키를 치환한다.
4. 치환이 끝난 xml에서 linesegarray를 전부 제거한다(규칙 2).
5. `zip.file('Contents/section0.xml', xml)` 후 mimetype STORE를 지켜 다시 묶는다(`generateAsync({type, mimeType: 'application/hwp+zip'})`).
6. `render_check.py`로 연다.

## 밑바탕 조립 (`hwpx.js` + `template/`)

- `template/`은 한글에서 저장한 hwpx의 공통 파트(mimetype, version.xml, settings.xml, META-INF, Contents/header.xml)와 section0.xml의 머리 부분(`sec-prefix.xml`: `<hs:sec>` + secPr 첫 문단)이다. `hwpx.js`가 그 뒤에 문단을 붙이고 content.hpf를 만들어 zip으로 묶는다.
- 들어 있는 `buildSection0`은 특허 명세서용 예시(【발명의 명칭】 등)다. 다른 문서는 `pHead`(제목 문단, paraPrIDRef=2)·`pBody`(본문 문단, paraPrIDRef=3)·`pPic`(그림 문단)를 조합해 새로 짠다. `sec-prefix.xml` 첫 문단의 글자(【발명의 설명】)도 문서에 맞게 바꾼다.
- 브라우저: `template/` 내용을 사이트의 `/hwpx/` 경로로 서빙하고 `buildHwpxBlob(fields, drawing)`. Node: `node_example.js`처럼 fetch를 template 폴더 읽기로 바꿔 끼운다(`npm i jszip`).

## 기존 hwpx를 수정(수술)할 때의 함정

- **`<hh:charPr>` 클론(글자색 변경용)은 반드시 `<hh:charProperties>` 목록의 맨 끝(마지막 id 뒤)에 삽입**하고 itemCnt를 늘린다. 한글은 charPrIDRef를 id 속성이 아니라 **목록 위치**로 해석한다 — 목록 중간에 끼워 넣으면 참조 전체가 어긋나서, 빨간색이 엉뚱한 문단에 칠해지고 실제 편집 글자는 검정으로 남는다.
- **텍스트 길이가 바뀐 문단만 골라 linesegarray를 제거**한다. 이미지 문단의 lineseg는 그림 높이 정보라 보존해야 한다. 이걸 안 하면 렌더가 중간 페이지에서 통째로 끊긴다(원본 42쪽이 34쪽에서 잘리는 증상).
- **렌더 검증은 기계로 먼저:** render_check.py로 PDF를 뽑고, PyMuPDF(fitz)로 ①페이지 수·전체 텍스트량(원본과 대조) ②핵심 문자열 존재 ③색상 span(0xff0000) 목록을 검사한 뒤 눈으로 최종 확인. PDF 텍스트 추출은 줄바꿈이 끼므로 긴 문구는 짧은 조각으로 검색할 것.
- .NET으로 zip을 재조립할 때: EOCD(22바이트)는 CD 끝 바로 다음에, CD offset 필드(+16)만 새 값으로. 원본 뒤에 붙은 찌꺼기 데이터는 복사하지 않는다.
- CRC·deflate는 .NET ZipArchive가 **직접 쓰게 한다**: 임시 zip에 항목을 만들어(`CreateEntry`+Dispose) 그 결과의 로컬영역 바이트와 CD 레코드 값을 통째로 가져온다. 수식으로 CRC를 구하면 RtlComputeCrc32는 표준 CRC32와 규약이 달라 실패한다. (Python zipfile로 다시 묶는 편이 훨씬 쉽다 — mimetype STORED 첫 항목만 지키면 된다.)
- **PowerShell은 변수 대소문자를 구분하지 않는다.** `foreach($rec in $REC)`는 같은 변수다 — 루프 안 `$REC.Count`가 엉뚱한 값으로 평가돼 조용히 틀린 결과를 낸다. 루프 변수는 반드시 다른 이름($ent 등).
- .ps1 파일에 한글이 들어가면 UTF-8 BOM 필수. 파일 쓰기 도구가 BOM 없이 저장하면 BOM을 앞에 붙여라.
- 한글 COM 자동화: ProgID `HWPFrame.HWPObject`, 열기 전 `RegisterModule('FilePathCheckDLL','FilePathCheckerModule')`, `Open(path,'','forceopen:true')`. 한글 버전에 따라 SaveAs로 DOCX/DOC가 막혀 있을 수 있고 HWPX·RTF·PDF는 된다. PDF 내보내기는 `HParameterSet.HFileOpenSave` 경로(`render_check.py` 참고).
- hwpx "안 열림"의 원인 후보 우선순위: ①mimetype 압축 ②linesegarray ③XML 구조(charPrIDRef 등 참조 id) ④zip 항목 순서/EOCD.

## 원본 서식으로 초안 만들기

- 사용자가 검토할 초안은 **그 문서의 원본 hwpx 서식**으로 만들어야 한다. 다른 문서의 껍데기로 만들면 "서식이 안 들어갔네"가 된다.
- 방법: 원본 hwpx의 header.xml·표지 section·문단 틀을 그대로 가져온다. 상위 문단만 depth 카운트로 분리해 번호 박스 표·음영 소제목 표·굵은 머리말 문단·글머리 문단·그림 문단을 인덱스로 집어 텍스트만 치환(표 id·문단 id는 새로 발급).
- 새로 만든 텍스트 문단은 **linesegarray를 아예 넣지 않아도** 한글이 열 때 재계산해 줄바꿈이 정상이었다(원본 header를 쓰는 경우). 반대로 글자 폭 근사로 lineseg를 넣으면 한글이 그 위치대로 줄을 끊어 "실시하였다 / . 연구"처럼 어색해진다. 원본 껍데기를 쓸 때는 빼는 쪽이 낫고, `hwpx.js`식 맨바닥 조립 때만 규칙 3(lineseg 생성)이 필요하다.
- 번호 박스처럼 셀 폭이 제목 길이에 맞춰진 표는 같은 번호의 원본 문단을 그대로 쓴다(1번 박스를 복제해 긴 제목을 넣으면 글자가 겹친다).
- 문자열 검색으로 삽입 위치를 잡을 때 `rfind('<hp:p id=')`는 표 셀 안의 문단을 잡는다. 블록 리스트 단계에서 끼워 넣어라.
- BinData가 100MB인 원본이라도 참조하는 이미지만 골라 담고 content.hpf의 item을 그에 맞춰 지우면 4MB로 줄어든다.

## 기존 hwpx를 껍데기로 조립할 때

- **첫 문단(secPr 문단)에는 빈 텍스트 run(`<hp:run charPrIDRef="0"><hp:t/></hp:run>`)과 lineseg를 넣어라.** secPr run만 있으면 한글이 여는 단계에서 멈춘다(대화상자 없이 무한 대기).
- **쪽을 넘어가는 긴 상자(읽을거리 박스)는 `treatAsChar="0"` + outMargin 4294967295 + cellSz height 282로.** treatAsChar=1이면 상자를 통째로 다음 쪽으로 밀고 넘치는 내용은 잘린다(첫 쪽 백지 증상).
- 글자처럼 취급(treatAsChar=1)하는 표는 쪽 안에 통째로 들어가야 하므로, 8행짜리 표는 두 개로 나눠야 제목과 같은 쪽에 놓인다.
- 한글이 멈추면 COM 재시도가 RPC 오류만 반복한다. 렌더는 제한 시간을 두고 실행하고, 넘기면 그 렌더용 한글 프로세스만 정리한다(사용자가 열어 둔 한글 창까지 닫지 않게 주의).

## 표 서식 통일·문단 이동·빨간 표시

- **같은 문서 안에서 표 서식을 통일할 때는 셀 속성 ID를 본보기 표의 것으로 치환하면 된다.** 본보기 표의 셀을 머리행/첫열/본문으로 나눠 `borderFillIDRef`·`paraPrIDRef`·`charPrIDRef`를 집계하고, 바꿀 표의 셀마다 같은 규칙으로 치환. 표 `outMargin`·`inMargin`, 셀 `hasMargin`·`cellMargin`, 표를 담는 문단의 paraPr/charPr까지 맞춰야 모양이 같아진다. 글꼴이 바뀐 셀의 `linesegarray`는 제거.
- 열이 많은 표(15열 일정표)는 본보기의 넓은 셀 여백(510)을 그대로 주면 ○ 한 글자도 안 들어간다 — 원래 여백(100/60) 유지.
- 표 제목을 "표 위 문단"에서 "표 안 캡션"으로 옮기려면 `<hp:outMargin/>` 뒤·`<hp:inMargin/>` 앞에 `<hp:caption side="BOTTOM" fullSz="0" width="8504" gap="850" lastWidth="표폭">`+subList+문단을 넣고 제목 문단은 지운다(본보기 표의 캡션 XML을 그대로 복사). 새 문단 id는 별도 범위.
- 그림 크기 변경: `curSz`·`sz`·`rotationInfo centerX/Y`·`scaMatrix e1/e5(=새폭/orgSz폭)`을 함께 바꾸고 `imgRect`·`imgClip`·`imgDim`은 그대로. 그림 문단 lineseg의 vertsize/textheight/baseline도 새 높이로.
- **차례(제목<hp:tab/>쪽수 평문)는 자동 갱신이 안 된다.** 원본 차례가 이미 실제와 어긋나 있을 수 있으므로 "변화량만 더하기"는 순서가 뒤집히는 항목을 만든다. 한글 COM 렌더 PDF에서 항목별 실제 쪽(바닥글 "- N -")을 찾아 절대값으로 다시 쓰는 편이 맞다(번호 상자 소제목은 PDF 텍스트에서 "1\n제목"처럼 줄 단위로 찾고, 그림이 섞인 제목은 그림 글자를 지운 뒤 검색).
- 133MB hwpx(BinData 400MB)도 COM 렌더는 1~2분. Python zipfile로 재조립하면 118MB(deflate 기본 압축)로 줄고 한글이 정상으로 연다(mimetype STORED 첫 항목 유지).
- 검증 순서: 문단 텍스트 diff(의도한 변경만) → ET 파싱 → 렌더 → fitz로 빨간 span·쪽수 대조 → PNG 눈 검사.

## 줄나눔: breakNonLatinWord 값은 이름과 반대로 동작

- paraPr의 `breakNonLatinWord="KEEP_WORD"` 문단은 '이은/영'처럼 글자 단위로 끊겼고, 같은 문단을 `BREAK_WORD`로 바꾼 복제본은 어절 단위로 줄을 나눴다(한글 COM 렌더로 확인).
- 표 셀에 이름 목록·짧은 항목을 넣을 때 단어가 중간에 끊기면 paraPr를 복제(목록 맨 끝에 추가, itemCnt+1)해 `BREAK_WORD`로 바꿔 쓴다.

## 자산 파일

- `hwpx.js` — 밑바탕 조립 방식 전체 구현 (특허 명세서 생성기에서 한글 렌더 검증 완료)
- `template/` — hwpx.js가 읽는 한글 기본 틀 파트
- `node_example.js` — Node에서 hwpx.js로 파일 만들기 예시
- `render_check.py` — hwpx→PDF→PNG 변환 (Windows + 한글 설치 필요, `pip install pywin32 pymupdf`)
