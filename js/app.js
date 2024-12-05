

console.log("接続確認")
// Firebase SDKをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    onChildAdded,
    query,
    orderByChild
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

// Firebase初期化
const firebaseConfig = {


};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, "chatey");
console.log("Firebase initialized successfully!");

// 最新10件を取得するクエリ
// const q = query(dbRef, orderByChild("timestamp"));

// ここからAPI取得
// OpenAI APIキー
const OPENAI_API_KEY = '';
console.log("OPENAI_API_KEY!");

// データ登録（クリックイベント）
$("#push").on("click", function () {
    // 入力したデータを追加
    const msg = {
        sender: "user",
        text: $("#text").val(),//trimで余計な空白を削除
        timestamp: new Date().toLocaleString(), // タイムスタンプ
    };
    // Firebase Realtime Databaseに新しいデータを追加
    const newPostRef = push(dbRef);
    console.log(msg,"newPostRefの中身を確認");
    set(newPostRef, msg);
    // 入力欄をリセット
    $("#text").val("");
    // OpenAIにメッセージを送信
    sendMessageToOpenAI(msg.text);
});


function sendMessageToOpenAI(text) {
    $('#response').append(`...考え中...`).fadeOut(3000); //考え中と表示
    // OpenAI APIにリクエストを送る部分。
    $.ajax({
        url: 'https://api.openai.com/v1/chat/completions',
        type: 'POST',
        headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
        },
        data: JSON.stringify({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'あなたは凄腕のカウンセラーです。悩みを認知行動療法のアプローチにてアドバイスしてください。ただし回答は200文字程度で、回答に「認知行動療法」の文言を入れないでください。また、語りかけるような言葉でお願いします。' },//
            { role: 'user', content: text }//会話履歴。ユーザーとAIのやり取りをここに記録します
        ]
        }),
        // 成功した場合の動作
        success: function (response) {
            const reply = response.choices[0].message.content;  //**response.choices**は応答の選択肢の配列(通常は1つの応答), choices[0] で最初の応答を取得。
            $('#response').val(""); //「考え中」の文言を削除
            //msgの塊を定義
            const msg = {
            sender: "chatey",
            text:reply,//trimで余計な空白を削除
            timestamp: new Date().toLocaleString(), // タイムスタンプ
            };
            // Firebase Realtime Databaseに新しいデータを追加
            const newPostRef = push(dbRef);
            console.log(msg,"newPostRefの中身を確認");
            set(newPostRef, msg);
            //音声出力
            const uttr = new SpeechSynthesisUtterance(msg.text);
            window.speechSynthesis.speak(uttr);
        },
        error: function () {
            $('#response').last().text('エラーが発生しました。').fadeOut(3000);//エラーメッセージを1秒後に非表示
        }
    },
    );
}

// データ取得（リアルタイムで表示）
onChildAdded(dbRef, function (data) {
    const msg = data.val();
    if (msg.sender === "user") {
        console.log(msg.sender); 
        const html = `
        <div class="message">
        <div class="user_text_box"> 
            <p class="text">${msg.text}</p>
        </div>
            <p class="nowDate">${msg.timestamp}</p> 
        </div>
        `;
        // 最新メッセージを先頭に表示
        $("#output").prepend(html);
        console.log(html,"userのメッセージ");
    } else if (msg.sender === "chatey") {
        const html = `
        <div class="message">
        <div class="chatey_text_box"> 
            <p class="text">${msg.text}</p>
        </div>
            <p class="nowDate">${msg.timestamp}</p> 
        </div>
        `; 
        // 最新メッセージを先頭に表示
        $("#output").prepend(html);
        console.log(html,"userのメッセージ");
    }
});


// 過去10件のメッセージを保存するための配列
let UserMessages = [];

// データ取得（リアルタイムで表示）
onChildAdded(dbRef, function (data) {
    const msg = data.val();
    if (msg.sender === "user") {
        console.log(msg.sender);
        // メッセージを配列に追加（10件まで保持）
        UserMessages.push(msg.text);
        if (UserMessages.length > 10) {
            UserMessages.shift(); // 配列の先頭を削除して常に10件保持
        }
    }
    console.log(UserMessages,"中身の確認")
});

// メッセージ分析（ボタン押下でトリガー）
$("#analyze").on("click", function () {
    $('#response').append(`...考え中...`).fadeOut(3000); //考え中と表示
    const timestamp = new Date().toLocaleString()
    console.log(UserMessages.join('\n'), "中身の確認");
    if (UserMessages.length === 0) {
        $("#response").text("十分なメッセージがありません。").fadeOut(3000);
        return;
    }
    // OpenAIに過去10件のメッセージを送信して分析
    $.ajax({
        url: 'https://api.openai.com/v1/chat/completions',
        type: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'あなたは凄腕のカウンセラーです。以下のメッセージからこの人が抱えている悩みを分析し、まずは要約してください。その後、簡潔にフィードバックをしてください。全体で300文字程度になるようにお願いします。' },
                { role: 'user', content: `過去のメッセージ: ${UserMessages.join('\n')}` }
            ]
        }),
        success: function (response) {
            const analysis = response.choices[0].message.content;
            const html = `
            <div class="message">
            <div class="chatey_text_box"> 
                <p class="text">《今のお悩みの分析》<br>${analysis}</p>
            </div>
                <p class="nowDate">${timestamp}</p> 
            </div>
            `; 
            // 最新メッセージを先頭に表示
            $("#output").prepend(html);
        },
        error: function () {
            $("#response").text("エラーが発生しました。").fadeOut(3000);
        }
    });
});


