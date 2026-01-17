import { useEffect, useRef, useState } from "react";

function App() {
    const fileInputRef = useRef(null);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }, []);

    // 🔽 Resize + compress image (CRITICAL FIX)
    const compressImage = (file) =>
        new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = () => {
                img.src = reader.result;
            };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxSize = 1024;

                let width = img.width;
                let height = img.height;

                if (width > height && width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        const reader2 = new FileReader();
                        reader2.onload = () =>
                            resolve(reader2.result.split(",")[1]);
                        reader2.readAsDataURL(blob);
                    },
                    "image/jpeg",
                    0.6 // compression quality
                );
            };

            reader.readAsDataURL(file);
        });

    const analyzeImage = async (file) => {
        try {
            setLoading(true);
            setAnswer("");

            const base64Image = await compressImage(file);

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
                                        text:
                                            "Read the question from the image and give only the correct answer.",
                                    },
                                    {
                                        inline_data: {
                                            mime_type: "image/jpeg",
                                            data: base64Image,
                                        },
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            const data = await response.json();
            setAnswer(
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "No answer found"
            );
        } catch (err) {
            console.error(err);
            setAnswer("❌ Error processing image");
        } finally {
            setLoading(false);
        }
    };

    const handleImageCapture = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow reselect same image
        if (file) analyzeImage(file);
    };

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: 16,
                textAlign: "center",
            }}
        >
            <h2>📸 Question Reader</h2>

            <button
                onClick={() => fileInputRef.current.click()}
                style={{ padding: "12px 20px", fontSize: 16 }}
            >
                {isMobile ? "Open Camera" : "Upload Image"}
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
                    <pre style={{ whiteSpace: "pre-wrap" }}>{answer}</pre>
                </div>
            )}
        </div>
    );
}

export default App;
