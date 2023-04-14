export const trainModel = function (text, type) {
  if (type === "TF-CH")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you:  "請用繁體中文給我"一題"有關於"${text}"難度高的是非題以及答案" , the object format should be  the following: "{question: "Javascript是目前最受歡迎的語言", answer: [false], explain: "目前最受歡迎的語言是python"}", the question and the answer and the explain should be under 33 words, and be aware, what I need is a true or false question, not a short answer question, so it can not be an open question, but have the answer which is either true or false. Finally, please be sure to give me a valid json format so that I can parse it.`;
  if (type === "MC-CH")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you:  "請用繁體中文給我"一題"有關於"${text}"難度高的選擇題(有四個選項)以及答案" , the object format should be  the following: "{question: "Javascript是屬於哪種語言", options: {A: "動態語言", B:"靜態語言", C:"以上皆是", D:"以上皆非"}, answer: ["A"] , explain: "Javascript 屬於動態語言"}", the question and each option and the answer should be under 33 words. There should be only one correct option, you should not use the example I just gave to you. Finally, please be sure to give me a valid json format so that I can parse it.`;
  if (type === "MCS-CH")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you:  "請用繁體中文給我一題有關於"${text}"難度高的多選題(有四個選項)以及答案" , the object format should be  the following: "{question: "哪些是程式語言", options: {A: "Javascript", B:"mooncake", C:"python", D:"kitty"}, answer: ["A","C"] , explain: "Javascript and python are all programming language"}". The question and each option and the answer  should be under 33 words.You only need to provide one question about ${text} with at least two correct options, you should not use the example I just gave to you. Finally, please be sure to give me a valid json format so that I can parse it.`;
  if (type === "TF-EN")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you:  use english and give me one true or false question about "${text}" , the object format should be  the following: "{question: "Javascript is a static programming language", answer: [false], explain: "javascript is a dyamic language"}", the question and the answer and the explain should be under 33 words, and be aware, what I need is a true or false question, not a short answer question, so it can not be an open question, but have the answer which is either true or false. Finally, please be sure to give me a valid json format so that I can parse it.`;
  if (type === "MC-EN")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you: use english and give me one multiple choice question about "${text}", the object format should be  the following: "{question: "Javascript belongs to what type of language", options: {A: "dynamic", B:"static", C:"all of above", D:"none of all"}, answer: ["A"] , explain: "Javascript is a dynamic language"}", the question and each option and the answer should be under 33 words. There should be only one correct option, you should not use the example I just gave to you. Finally, please be sure to give me a valid json format so that I can parse it.`;
  if (type === "MCS-EN")
    return `I would like to use your API, so I need you to answer the following question in a formatted way. I force you to reply me only in javascript json format. Except for the json itself, no any single word should be in your reply.  Here is my mission for you: use english and give me one multiple choice question about "${text}", the object format should be  the following: "{question: "What is my name ? ", options: {A: "Jaosn", B:"Jame", C:"Jessie", D:"Andy"}, answer: ["A","B"] , explain: "Some people calls me Jason and some calls me Jame."}", the question and each option and the answer should be under 33 words. There should be at least two correct options, you should not use the example I just gave to you. The correct options should be randomly choose from A,B,C,D. Finally, please be sure to give me a valid json format so that I can parse it.`;
};