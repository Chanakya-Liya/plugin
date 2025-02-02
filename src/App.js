import { useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: "YOUR_API_KEY", dangerouslyAllowBrowser: true });

export default function ChatApp() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: [...messages, userMessage],
      });

      const aiMessageContent = completion.choices?.[0]?.message?.content || "Error: No response";
      const aiMessage = { role: "assistant", content: aiMessageContent };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage = { role: "assistant", content: "Error: Unable to fetch response." };
      setMessages([...messages, userMessage, errorMessage]);
    }
  };

  return (
    <div className="chat-container" style={styles.chatContainer}>
      <div className="messages" style={styles.messages}>
        {messages.map((msg, index) => (
          <div key={index} style={{ ...styles.message, textAlign: msg.role === "user" ? "right" : "left" }}>
            <span
              style={{
                ...styles.messageContent,
                backgroundColor: msg.role === "user" ? "#007bff" : "#e0e0e0",
                color: msg.role === "user" ? "#fff" : "#000",
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    maxWidth: 400,
    margin: "auto",
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 8,
    marginTop: 50,
    backgroundColor: "#fff",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  messages: {
    height: 300,
    overflowY: "auto",
    marginBottom: 10,
    paddingRight: "10px",
    scrollbarWidth: "thin", 
    scrollbarColor: "#007bff #f1f1f1", 
  },
  message: {
    marginBottom: 12,
  },
  messageContent: {
    padding: "10px 14px",
    borderRadius: 20,
    display: "inline-block",
    maxWidth: "75%",
    wordBreak: "break-word",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  inputContainer: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  input: {
    width: "80%",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 20,
    fontSize: 16,
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  sendButton: {
    width: "18%",
    padding: 10,
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 20,
    fontSize: 16,
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },

  customScrollbar: {
    "::webkit-scrollbar": {
      width: "8px",
    },
    "::webkit-scrollbar-track": {
      backgroundColor: "#f1f1f1",
      borderRadius: "50px",
    },
    "::webkit-scrollbar-thumb": {
      backgroundColor: "#007bff",
      borderRadius: "50px",
    },
    "::webkit-scrollbar-thumb:hover": {
      backgroundColor: "#0056b3",
    },
  },
};