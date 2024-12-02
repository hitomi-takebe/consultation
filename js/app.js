
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

// ここからAPI取得
// OpenAI APIキー
const OPENAI_API_KEY =
console.log("OPENAI_API_KEY!");

// データ登録（クリックイベント）
$("#push").on("click", function () {
    const msg = {
        text:$("#text").val(),
        timestamp: new Date().toLocaleString(), // タイムスタンプ
    };
    // Firebase Realtime Databaseに新しいデータを追加
    const newPostRef = push(dbRef);
    console.log(msg,"newPostRefの中身を確認");
    set(newPostRef, msg);
    // 入力欄をリセット
    $("#text").val("");
    //ボタンを押したときの動作
    swal.fire({
    title: "登録しました！",
    text: "コメントを登録しました",
    icon: "success",
    });
});

// データ取得（リアルタイムで表示）
onChildAdded(dbRef, function (data) {
    const msg = data.val();
    console.log(msg,"msgの内容を表示")
    const html = `
        <div class="message">
            <div class="text_box"> 
                <p class="text">${msg.text}</p>
            </div>
            <p class="nowDate">${msg.timestamp}</p> 
        </div>
    `;
    // 最新メッセージを先頭に表示
    $("#output").prepend(html);
});
