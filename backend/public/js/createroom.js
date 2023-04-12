import { MultiChoice, TrueFalse } from "./question_module.js";
localStorage.setItem("searchedId", "[]");
$("#finish-button").on("click", async () => {
  // 這邊到時候要把savetoquizzapi做好
  const result = await axios.post("/api/1.0/game/roomupdate", object);
  const { data } = result;
  if (data.error) return console.log(data.error);
  window.location.href = `/game/room/${roomId}`;
});

$("#create-by-system").on("change", function () {
  if ($(this).is(":checked")) {
    $("#search-result").show();
    $(".create-container").empty();
    $(".create-container").html(`
  <label class="label-for-question" for="question-type">選擇題型：</label>
  <input type="radio" name="question-type" id="single-choice" value="MC" checked>
  <label class="label-for-question" for="single-choice">單一選擇題</label>
  <input type="radio" id="true-false" name="question-type" value="TF">
  <label class="label-for-question" for="true-false">是非題</label>
  <input type="radio" id="multiple-choice" name="question-type" value="MCS">
  <label class="label-for-question" for="multiple-choice">多選題</label>
  <div class="quizz">
    <label for="search-input">請搜尋題目：</label>
    <div class="search-container">
      <input type="text" id="search-input">
      <div id="search-submit"></div>
    </div>
    <div class="search-container">
      <div id="search-submit-by-ai-pic"></div>
      <button id="search-submit-by-ai"> AI 生成 </button>
    </div>
    <div class="content"></div>
  </div>`);
  }
});

$("#create-by-hand").on("change", function () {
  if ($(this).is(":checked")) {
    $("#search-result").hide();
    $(".create-container").empty();
    $(".create-container").html(`
      <label for="question-type">選擇題型：</label>
      <input type="radio" name="question-type" class="MC-handy" id="single-choice" value="MC" />
      <label class="label-for-question" for="single-choice">單一選擇題</label>
      <input type="radio" id="true-false" class="TF-handy" name="question-type" value="TF" />
      <label class="label-for-question" for="true-false">是非題</label>
      <input
        type="radio" 
        id="multiple-choice"
        class="MCS-handy"
        name="question-type"
        value="MCS"
      />
      <label class="label-for-question" for="multiple-choice">多選題</label>
      <br />
        <div class="quizz-handy-container">
        </div>
      `);
  }
});

$(".create-container").on("click", ".MC-handy", function () {
  $(".quizz-handy-container").html(`<div class="mcs-options">
  <label>輸入題目:</label>
  <input type="text" class="question-text">
  <label>A</label>
  <input type="radio" id="radioA" name="answer" value="A">
  <input type="text" id="optionA" name="optionA">
  <label>B</label>
  <input type="radio" id="radioB" name="answer" value="B">
  <input type="text" id="optionB" name="optionB">
  <label>C</label>
  <input type="radio" id="radioC" name="answer" value="C">
  <input type="text" id="optionC" name="optionC">
  <label>D</label>
  <input type="radio" id="radioD" name="answer" value="D">
  <input type="text" id="optionD" name="optionD">
  <label>答案解釋:</label>
  <textarea class= "explain-text"></textarea>
  <button type="submit" class="create-quizz-btn">確認送出</button>
</div>`);
});

$(".create-container").on("click", ".MCS-handy", function () {
  $(".quizz-handy-container").html(`<div class="mcs-options">
  <label>輸入題目:</label>
  <input type="text" class="question-text">
  <label>A</label>
  <input type="checkbox" id="checkA" name="answer" value="A">
  <input type="text" id="optionA" name="optionA">
  <label>B</label>
  <input type="checkbox" id="checkB" name="answer" value="B">
  <input type="text" id="optionB" name="optionB">
  <label>C</label>
  <input type="checkbox" id="checkC" name="answer" value="C">
  <input type="text" id="optionC" name="optionC">
  <label>D</label>
  <input type="checkbox" id="checkD" name="answer" value="D">
  <input type="text" id="optionD" name="optionD">
  <label>答案解釋:</label>
  <textarea class= "explain-text"></textarea>
  <button type="submit" class="create-quizz-btn">確認送出</button>
</div>`);
});

$(".create-container").on("click", ".TF-handy", function () {
  $(".quizz-handy-container").html(`<div class="tf-options">
  <label>輸入題目:</label>
  <input type="text" class="question-text">
  <label>True</label>
  <input type="radio" name="answer" value="true">
  <label>False</label>
  <input type="radio" name="answer" value="false">
  <br>
  <label>答案解釋:</label>
  <textarea class= "explain-text"></textarea>
  <button type="submit" class="create-quizz-btn">確認送出</button>
</div>`);
});

$(".create-container").on("click", "#search-submit", async function () {
  const quizzes = await search();
  if (!quizzes[0]) return;
  quizzes.forEach((quizz) => {
    const searched = JSON.parse(localStorage.getItem("searchedId"));
    if (["MC-CH", "MC-EN", "MCS-CH", "MCS-EN"].includes(quizz.type)) {
      const question = new MultiChoice(
        quizz.question,
        quizz.answer,
        quizz.explain,
        quizz.options,
        quizz.id
      );
      searched.push(quizz.id);
      localStorage.setItem("searchedId", JSON.stringify(searched));
      const html = question.html;
      $("#search-result").append(html);
    } else if (["TF-CH", "TF-EN"].includes(quizz.type)) {
      const question = new TrueFalse(
        quizz.question,
        quizz.answer,
        quizz.explain,
        quizz.id
      );
      searched.push(quizz.id);
      localStorage.setItem("searchedId", JSON.stringify(searched));
      const html = question.html;
      $("#search-result").append(html);
    }
  });
});

$(".create-container").on("keydown", "#search-input", async function (e) {
  if (e.keyCode == 13) {
    const quizzes = await search();
    console.log(quizzes);
    if (!quizzes[0]) return;
    quizzes.forEach((quizz) => {
      const searched = JSON.parse(localStorage.getItem("searchedId"));
      if (["MC-CH", "MC-EN", "MCS-CH", "MCS-EN"].includes(quizz.type)) {
        const question = new MultiChoice(
          quizz.question,
          quizz.answer,
          quizz.explain,
          quizz.options,
          quizz.id
        );
        searched.push(quizz.id);
        localStorage.setItem("searchedId", JSON.stringify(searched));
        const html = question.html;
        $("#search-result").append(html);
      } else if (["TF-CH", "TF-EN"].includes(quizz.type)) {
        const question = new TrueFalse(
          quizz.question,
          quizz.answer,
          quizz.explain,
          quizz.id
        );
        searched.push(quizz.id);
        localStorage.setItem("searchedId", JSON.stringify(searched));
        const html = question.html;
        $("#search-result").append(html);
      }
    });
  }
});

$(".create-container").on("click", "#search-submit-by-ai", async function () {
  const data = await searchByAI();
  console.log("data", data);
  if (["TF-CH", "TF-EN"].includes(data.type)) {
    const quizz = new TrueFalse(
      data.question,
      data.answer,
      data.explain,
      data.id
    );
    const html = quizz.html;
    $("#search-result").append(html);
  }
  if (["MC-CH", "MC-EN", "MCS-CH", "MCS-EN"].includes(data.type)) {
    const quizz = new MultiChoice(
      data.question,
      data.answer,
      data.explain,
      data.options,
      data.id
    );
    const html = quizz.html;
    $("#search-result").append(html);
  }
});

$(".create-container").on("click", ".create-quizz-btn", async () => {
  const language = $("#search-language").val();
  const create = $("input[name='question-type']:checked").val();
  const type = `${create}-${language}`;
  const question = $(".question-text").val();
  const explain = $(".explain-text").val();
  if (["TF-CH", "TF-EN"].includes(type)) {
    const answer = $("input[name='answer']:checked").val();
    const quizzObj = {
      question,
      answer: [transToBoolean(answer)],
      type,
      explain,
    };
    const data = await generateQuizzData(quizzObj);
    const quizz = new TrueFalse(
      data.question,
      data.answer,
      data.explain,
      data.id
    );
    const html = quizz.html;
    $(".container-right").append(html);
  }
  if (["MC-CH", "MC-EN"].includes(type)) {
    const answer = $("input[name='answer']:checked").val();
    const optionA = $("#optionA").val();
    const optionB = $("#optionB").val();
    const optionC = $("#optionC").val();
    const optionD = $("#optionD").val();
    const quizzObj = {
      question,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      answer: [answer],
      type,
      explain,
    };
    const data = await generateQuizzData(quizzObj);
    const quizz = new MultiChoice(
      data.question,
      data.answer,
      data.explain,
      data.options,
      data.id
    );
    const html = quizz.html;
    $(".container-right").append(html);
  }
  if (["MCS-CH", "MCS-EN"].includes(type)) {
    const answerArray = [];
    $('input[name="answer"]:checked').each(function () {
      answerArray.push($(this).val());
    });
    const optionA = $("#optionA").val();
    const optionB = $("#optionB").val();
    const optionC = $("#optionC").val();
    const optionD = $("#optionD").val();
    const quizzObj = {
      question,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      answer: answerArray,
      type,
      explain,
    };
    const data = await generateQuizzData(quizzObj);
    const quizz = new MultiChoice(
      data.question,
      data.answer,
      data.explain,
      data.options,
      data.id
    );
    const html = quizz.html;
    $(".container-right").append(html);
  }
});

const generateQuizzData = async (quizzObj) => {
  const result = await axios.post("/api/1.0/question/createmanual", quizzObj);
  const { data } = result.data;
  return data;
};

const search = async () => {
  const language = $("#search-language").val();
  const create = $("input[name='question-type']:checked").val();
  const type = `${create}-${language}`;
  const query = $("#search-input").val();
  let searchedArray;
  const resultArray = localStorage.getItem("searchedId");
  if (!resultArray) {
    searchedArray = [];
  } else {
    searchedArray = resultArray;
  }
  const searchObj = { q: query, type, excludeIds: searchedArray };
  const result = await axios.post(`/api/1.0/question/search`, searchObj);
  const { data } = result.data;
  return data;
};

const searchByAI = async () => {
  const language = $("#search-language").val();
  const create = $("input[name='question-type']:checked").val();
  const type = `${create}-${language}`;
  const q = $("#search-input").val();
  const obj = { q, type, mode: "AI" };
  const result = await axios.post("/api/1.0/question/create", obj);
  const { data } = result.data;
  return data;
};

const transToBoolean = (answer) => {
  if (answer === "true") return true;
  return false;
};

// TODO:
// $(document).ready(function () {
//   $("#search-result").on("dragstart", ".quiz-card", function (event) {
//     const dataId = $(event.target).attr("data-id");
//     event.originalEvent.dataTransfer.setData("text/plain", dataId);
//   });

//   $(".container-right").on("dragover", function (event) {
//     event.preventDefault();
//   });

//   $(".container-right").on("drop", function (event) {
//     event.preventDefault();
//     const dataId = event.originalEvent.dataTransfer.getData("text");
//     const draggedElement = $(`[data-id="${dataId}"]`);
//     const containerRight = $(this);
//     const dropTarget = getDropTarget(containerRight, event.pageY);
//     if (dropTarget) {
//       draggedElement.insertBefore(dropTarget);
//     } else {
//       containerRight.append(draggedElement);
//     }
//   });

//   $(".container-right").sortable({
//     axis: "y",
//     containment: "parent",
//     tolerance: "pointer",
//     cursor: "move",
//   });
//   function getDropTarget(container, mouseY) {
//     const children = container.children();
//     for (let i = 0; i < children.length; i++) {
//       const child = $(children[i]);
//       const childTop = child.offset().top;
//       const childHeight = child.outerHeight();
//       if (mouseY >= childTop && mouseY <= childTop + childHeight) {
//         return child;
//       }
//     }
//     return null;
//   }
// });
$(document).ready(function () {
  // Drag quiz cards from search result to container-right
  $("#search-result").on("dragstart", ".quiz-card", function (event) {
    const dataId = $(event.target).attr("data-id");
    event.originalEvent.dataTransfer.setData("text/plain", dataId);
  });

  // Drag quiz cards from container-right to search result
  $(".container-right").on("dragstart", ".quiz-card", function (event) {
    const dataId = $(event.target).attr("data-id");
    event.originalEvent.dataTransfer.setData("text/plain", dataId);
  });

  // Allow dropping on container-right
  $(".container-right").on("dragover", function (event) {
    event.preventDefault();
  });

  // Handle dropping on container-right
  $(".container-right").on("drop", function (event) {
    event.preventDefault();
    const dataId = event.originalEvent.dataTransfer.getData("text");
    const draggedElement = $(`[data-id="${dataId}"]`);
    const containerRight = $(this);
    const dropTarget = getDropTarget(containerRight, event.pageY);
    if (dropTarget) {
      draggedElement.insertBefore(dropTarget);
    } else {
      containerRight.append(draggedElement);
    }
  });

  // Allow dropping on search-result
  $("#search-result").on("dragover", function (event) {
    event.preventDefault();
  });

  // Handle dropping on search-result
  $("#search-result").on("drop", function (event) {
    event.preventDefault();
    const dataId = event.originalEvent.dataTransfer.getData("text");
    const draggedElement = $(`[data-id="${dataId}"]`);
    const searchResult = $(this);
    searchResult.append(draggedElement);
  });

  // Enable draggable and sortable on quiz cards in container-right
  $(".container-right .quiz-card")
    .draggable({
      revert: "invalid",
      helper: "clone",
    })
    .sortable({
      axis: "y",
      containment: "parent",
      tolerance: "pointer",
      cursor: "move",
    });

  // Enable draggable on quiz cards in search-result
  $("#search-result .quiz-card").draggable({
    revert: "invalid",
    helper: "clone",
  });

  // Helper function to find drop target
  function getDropTarget(container, mouseY) {
    const children = container.children();
    for (let i = 0; i < children.length; i++) {
      const child = $(children[i]);
      const childTop = child.offset().top;
      const childHeight = child.outerHeight();
      if (mouseY >= childTop && mouseY <= childTop + childHeight) {
        return child;
      }
    }
    return null;
  }
});

$(".exit-btn").on("click", () => {
  const $popOut = $(`<div class="popup-container">
  <div class="popup">
    <p class="popup-text">是否要保存遊戲模板?</p>
    <div class="popup-buttons">
      <button class="save-and-exit-btn">保存並離開</button>
      <button class="no-save-btn">不保存</button>
      <button class="back-to-game-btn">回到遊戲房間</button>
    </div>
  </div>
</div>`);
  $("body").append($popOut);
});

$("body").on("click", ".back-to-game-btn", () => {
  $(".popup-container").remove();
});

$("body").on("click", ".no-save-btn", () => {
  window.location.href = "/";
});
