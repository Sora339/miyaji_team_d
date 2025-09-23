export default function CameraIndexPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
        padding: "2rem 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>カメラ画面</h1>
      <p style={{ color: "#4b5563", textAlign: "center", maxWidth: "32rem" }}>
        回答送信後に自動的にこのページの <code>/camera/&lt;resultId&gt;</code>{" "}
        へ移動します。 テストする場合は <code>/question</code>{" "}
        ページから回答送信ボタンを押してください。
      </p>
    </div>
  );
}
