// 小費計算機
// 流程：使用者按「計算」（事件）→ 檢查輸入、算錢（邏輯）→ 改結果框（畫面更新）

// ---- 名牌：用 id 找到畫面上的元素 ----------------------------------
// 這些名字要跟 tools/tip.html 裡的 id 一模一樣。
// 對不上的話會拿到 null，接著就會看到 "Cannot read properties of null"。
const form = document.getElementById('tip-form');
const billInput = document.getElementById('bill');
const rateInput = document.getElementById('tip-rate');
const peopleInput = document.getElementById('people');
const calcButton = document.getElementById('calc-button');
const result = document.getElementById('result');
const resultMain = document.getElementById('result-main');
const resultDetail = document.getElementById('result-detail');

// 「還沒填」狀態的提示文字，直接沿用 HTML 一開始寫的那句，改字只要改 HTML
const emptyText = resultMain.textContent;

// ---- 檢查消費金額 --------------------------------------------------
// 沒問題回傳空字串；有問題回傳一句「哪一欄、哪裡不對、該怎麼改」的錯誤訊息。
function checkBill(raw) {
  if (raw === '') {
    return '「消費金額」還沒填，請輸入一個數字，例如 1200。';
  }
  if (/^-\d/.test(raw)) {
    return '「消費金額」不能是負數，請輸入大於 0 的數字，例如 1200。';
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return '「消費金額」只能填數字，例如 1200，不能有文字、逗號或符號。';
  }
  const bill = Number(raw);
  if (!Number.isFinite(bill) || bill > 1e12) {
    return '「消費金額」的數字太大了，請確認有沒有多打幾個 0。';
  }
  if (bill <= 0) {
    return '「消費金額」要大於 0，例如 1200。';
  }
  return '';
}

// ---- 檢查小費比例 --------------------------------------------------
// 這一欄可以填 0（不給小費），但不能是負數或文字。
function checkRate(raw) {
  if (raw === '') {
    return '「小費比例」還沒填，請輸入百分比的數字，例如 10；不給小費就填 0。';
  }
  if (/^-\d/.test(raw)) {
    return '「小費比例」不能是負數，請輸入 0 以上的數字，例如 10。';
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return '「小費比例」只能填 0 以上的數字，例如 10，不用打 % 符號。';
  }
  if (Number(raw) > 1000) {
    return '「小費比例」最多 1000%，請確認有沒有多打幾個 0。';
  }
  return '';
}

// ---- 檢查人數 ------------------------------------------------------
// 小數要特別擋：2.5 人不會報錯，只會安靜地算出一個錯的答案。
function checkPeople(raw) {
  if (raw === '') {
    return '「人數」還沒填，請輸入幾個人分，例如 3；自己付就填 1。';
  }
  if (/^-\d/.test(raw)) {
    return '「人數」不能是負數，請輸入 1 以上的整數，例如 3。';
  }
  if (/^\d+\.\d+$/.test(raw)) {
    return '「人數」要是整數，不能有小數點（沒有 2.5 個人），例如 3。';
  }
  if (!/^\d+$/.test(raw)) {
    return '「人數」只能填 1 以上的整數，例如 3，不能有文字或符號。';
  }
  if (Number(raw) === 0) {
    return '「人數」至少要 1 人，填 0 沒辦法分。';
  }
  if (Number(raw) > 10000) {
    return '「人數」最多 10000 人，請確認有沒有多打幾個 0。';
  }
  return '';
}

// 每一欄配上自己的檢查函式，下面清錯誤、計算時都照這個順序跑
const fields = [
  { input: billInput, check: checkBill },
  { input: rateInput, check: checkRate },
  { input: peopleInput, check: checkPeople }
];

// ---- 改結果框 ------------------------------------------------------
// state 是 'empty'、'error'、'success' 三選一，對應 CSS 的三種外觀。
function showResult(state, main, detail) {
  result.className = 'result result--' + state;
  resultMain.textContent = main;
  resultDetail.textContent = detail || '';

  // 重播淡入動畫：先拿掉 class，讓瀏覽器重新量一次版面，再加回去。
  // 沒有中間那行的話，連按兩次只有第一次會動。
  result.classList.remove('is-updated');
  void result.offsetWidth;
  result.classList.add('is-updated');
}

// 把填錯的欄位標紅；沒錯就清掉
function markField(input, hasError) {
  if (hasError) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}

// 錯誤訊息可能有好幾句，第一句放大、其餘併成一行小字
function showErrors(messages) {
  showResult('error', messages[0], messages.slice(1).join(' '));
}

// ---- 事件：使用者在填錯的欄位裡改字 --------------------------------
// 一開始改，那一欄的紅字就消失，不然看起來像是改不好。
// 其他欄如果還是錯的，留下它們的訊息；全部改了就回到「還沒填」的提示。
function clearFieldError(input) {
  if (!input.hasAttribute('aria-invalid')) {
    return;
  }
  markField(input, false);

  const messages = fields
    .filter(function (field) { return field.input.hasAttribute('aria-invalid'); })
    .map(function (field) { return field.check(field.input.value.trim()); });

  if (messages.length > 0) {
    showErrors(messages);
  } else {
    showResult('empty', emptyText);
  }
}

fields.forEach(function (field) {
  field.input.addEventListener('input', function () {
    clearFieldError(field.input);
  });
});

// 金額顯示：整數就不帶小數，有角分才顯示到小數第二位
function formatMoney(cents) {
  return String(cents / 100);
}

// ---- 計算：檢查三欄 → 顯示錯誤或答案 --------------------------------
// 點按鈕、按 Enter 都會走到這裡（事件寫在最下面）
function calculate() {
  const errors = [];
  let firstErrorInput = null;

  fields.forEach(function (field) {
    const message = field.check(field.input.value.trim());
    markField(field.input, message !== '');
    if (message) {
      errors.push(message);
      firstErrorInput = firstErrorInput || field.input;
    }
  });

  // 狀態二：填錯了。好幾欄錯就全部講，使用者一次改完
  if (errors.length > 0) {
    showErrors(errors);
    // 游標跳到第一個錯的欄位，手機上不用自己點
    firstErrorInput.focus();
    return;
  }

  const bill = Number(billInput.value.trim());
  const rate = Number(rateInput.value.trim());
  const people = Number(peopleInput.value.trim());

  // 用「分」當單位算，避開小數誤差：100 元 15% 直接算會變成 115.00000000000001，進位後多收 1 元
  const billCents = Math.round(bill * 100);
  const totalCents = Math.round(bill * (100 + rate));
  const tipCents = totalCents - billCents;

  // 狀態三：算出來了。每人金額無條件進位到整數元
  const each = Math.ceil(totalCents / (people * 100));
  const collected = each * people;
  const extraCents = collected * 100 - totalCents;

  let detail = `小費 ${rate}% 是 ${formatMoney(tipCents)} 元，含小費共 ${formatMoney(totalCents)} 元；`
    + `${people} 人 × ${each} 元 = ${collected} 元`;
  detail += extraCents > 0
    ? `，因為進位會多收 ${formatMoney(extraCents)} 元。`
    : '，剛好整除。';

  showResult('success', `每人 ${each} 元`, detail);
}

// 用滑鼠點「計算」：直接接住點擊，不靠表單送出，在任何瀏覽器都一定會算
calcButton.addEventListener('click', function (event) {
  event.preventDefault();
  calculate();
});

// 在欄位裡按 Enter：同樣去算
form.addEventListener('submit', function (event) {
  // 表單預設會重新整理頁面，要先擋掉
  event.preventDefault();
  calculate();
});
