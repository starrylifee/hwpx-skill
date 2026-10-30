// Node에서 hwpx.js로 hwpx 만들기 예시
// 준비: npm i jszip   실행: node node_example.js 결과.hwpx
// hwpx.js는 원래 브라우저용이라 fetch(base + '/hwpx/' + 파일)로 틀을 읽는다 → 여기서는 template 폴더를 읽게 바꿔 끼운다
const fs = require('fs');
const path = require('path');
global.JSZip = require('jszip');

const TEMPLATE = path.join(__dirname, 'template');
global.fetch = async (url) => {
  const p = path.join(TEMPLATE, url.replace(/^.*\/hwpx\//, ''));
  return { ok: fs.existsSync(p), text: async () => fs.readFileSync(p, 'utf8') };
};

const { buildHwpxBlob } = require('./hwpx.js');

(async () => {
  const out = process.argv[2] || '예시.hwpx';
  const blob = await buildHwpxBlob({
    title: '물을 주면 알려 주는 화분',
    problem: '화분에 물을 언제 주어야 하는지 잊어버려 식물이 마르거나, 반대로 물을 너무 자주 주어 뿌리가 썩는 일이 많다. 특히 방학처럼 오랫동안 교실을 비울 때는 누가 언제 물을 주었는지 알기 어렵다.',
    solution: '흙의 젖은 정도를 재는 막대와 색이 바뀌는 표시판을 화분에 꽂는다.\n흙이 마르면 표시판이 노란색으로, 물이 충분하면 초록색으로 바뀐다.',
    effect: '누구나 표시판 색만 보고 물 줄 때를 알 수 있다.',
    core: '흙의 수분을 재는 막대; 및 상기 막대와 연결되어 수분에 따라 색이 바뀌는 표시판을 포함하는 화분.',
  }, null);
  fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
  console.log('만듦:', path.resolve(out));
})();
