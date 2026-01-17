import { useEffect, useRef, useState } from "react";

function App() {
  const fileInputRef = useRef(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const mobileCheck = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Convert image to Base64
  const toBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });

  const analyzeImage = async (file) => {
    setLoading(true);
    setAnswer("");

    const base64Image = await toBase64(file);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Image,
                  },
                },
                {
                  text:
                    "Read the question from this image and give the correct answer only.",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("FULL GEMINI RESPONSE:", data);
    setAnswer(
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found"
    );
    setLoading(false);
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeImage(file);
    }

    // 🔑 RESET INPUT so it works every time
    e.target.value = "";
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "16px",
      }}
    >
      <h2>📸 Question Reader</h2>

      <button
        onClick={openCamera}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {isMobile ? "Open Camera" : "Upload / Use Webcam"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={isMobile ? "environment" : undefined}
        style={{ display: "none" }}
        onChange={handleImageCapture}
      />

      {loading && <p>🔍 Reading question...</p>}

      {answer && (
        <div style={{ marginTop: 20 }}>
          <h3>🤖 Answer</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
