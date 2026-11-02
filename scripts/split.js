// 分帳計算機
// 流程：使用者按「計算」（事件）→ 檢查輸入、算錢（邏輯）→ 改結果框（畫面更新）

// ---- 名牌：用 id 找到畫面上的元素 ----------------------------------
// 這些名字要跟 tools/split.html 裡的 id 一模一樣。
// 對不上的話會拿到 null，接著就會看到 "Cannot read properties of null"。
const form = document.getElementById('split-form');
const totalInput = document.getElementById('total');
const peopleInput = document.getElementById('people');
const calcButton = document.getElementById('calc-button');
const result = document.getElementById('result');
const resultMain = document.getElementById('result-main');
const resultDetail = document.getElementById('result-detail');

// 「還沒填」狀態的提示文字，直接沿用 HTML 一開始寫的那句，改字只要改 HTML
const emptyText = resultMain.textContent;

// ---- 檢查總金額 ----------------------------------------------------
// 沒問題回傳空字串；有問題回傳一句「哪一欄、哪裡不對」的錯誤訊息。
function checkTotal(raw) {
  if (raw === '') {
    return '「總金額」還沒填，請輸入一個數字，例如 1200。';
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return '「總金額」只能填數字，例如 1200，不能有文字、逗號或符號。';
  }
  const total = Number(raw);
  if (!Number.isFinite(total)) {
    return '「總金額」的數字太大了，請確認有沒有多打幾個 0。';
  }
  if (total <= 0) {
    return '「總金額」要大於 0。';
  }
  return '';
}

// ---- 檢查人數 ------------------------------------------------------
// 小數要特別擋：2.5 人不會報錯，只會安靜地算出一個錯的答案。
function checkPeople(raw) {
  if (raw === '') {
    return '「人數」還沒填，請輸入幾個人分，例如 3。';
  }
  if (/^\d+\.\d+$/.test(raw)) {
    return '「人數」要是整數，不能有小數點（沒有 2.5 個人）。';
  }
  if (!/^\d+$/.test(raw)) {
    return '「人數」只能填數字，例如 3，不能有文字或符號。';
  }
  if (Number(raw) === 0) {
    return '「人數」至少要 1 人，填 0 沒辦法分。';
  }
  return '';
}

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

// ---- 事件：使用者在填錯的欄位裡改字 --------------------------------
// 一開始改，那一欄的紅字就消失，不然看起來像是改不好。
// 另一欄如果還是錯的，留下它的訊息；兩欄都改了就回到「還沒填」的提示。
function clearFieldError(input) {
  if (!input.hasAttribute('aria-invalid')) {
    return;
  }
  markField(input, false);

  const messages = [];
  if (totalInput.hasAttribute('aria-invalid')) {
    messages.push(checkTotal(totalInput.value.trim()));
  }
  if (peopleInput.hasAttribute('aria-invalid')) {
    messages.push(checkPeople(peopleInput.value.trim()));
  }

  if (messages.length > 0) {
    showResult('error', messages[0], messages[1]);
  } else {
    showResult('empty', emptyText);
  }
}

totalInput.addEventListener('input', function () {
  clearFieldError(totalInput);
});
peopleInput.addEventListener('input', function () {
  clearFieldError(peopleInput);
});

// ---- 計算：檢查兩欄 → 顯示錯誤或答案 --------------------------------
// 點按鈕、按 Enter 都會走到這裡（事件寫在最下面）
function calculate() {
  const totalRaw = totalInput.value.trim();
  const peopleRaw = peopleInput.value.trim();

  const totalError = checkTotal(totalRaw);
  const peopleError = checkPeople(peopleRaw);
  markField(totalInput, totalError !== '');
  markField(peopleInput, peopleError !== '');

  // 狀態二：填錯了。兩欄都錯就兩句都講，使用者一次改完
  if (totalError || peopleError) {
    const messages = [totalError, peopleError].filter(Boolean);
    showResult('error', messages[0], messages[1]);
    // 游標跳到第一個錯的欄位，手機上不用自己點
    (totalError ? totalInput : peopleInput).focus();
    return;
  }

  // 狀態三：算出來了。每人金額無條件進位到整數元
  const total = Number(totalRaw);
  const people = Number(peopleRaw);
  const each = Math.ceil(total / people);
  const collected = each * people;
  const extra = Math.round((collected - total) * 100) / 100;

  const detail = extra > 0
    ? `${people} 人 × ${each} 元 = ${collected} 元，因為進位會多收 ${extra} 元。`
    : `${people} 人 × ${each} 元 = ${collected} 元，剛好整除。`;

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
