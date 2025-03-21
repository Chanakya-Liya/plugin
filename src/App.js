import { useState, useRef } from "react";

export default function ChatApp() {
  const [input, setInput] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [containerHeight, setContainerHeight] = useState(300);
  const isDraggingRef = useRef(false);

  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current) {
      const container = document.querySelector('.chat-container');
      const containerRect = container.getBoundingClientRect();
      const maxHeight = window.innerHeight * 0.8; // 80vh
      const newHeight = Math.min(
        Math.max(200, e.clientY - containerRect.top),
        maxHeight
      );
      setContainerHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const sendMessage = async () => {
    const formattedCode = input.split(/\r?\n/).join('\n');
    
    const userMessage = { 
      role: "user", 
      content: `Purpose: ${purpose}\n\n${formattedCode}`,
      purpose: purpose 
    };
    setMessages([...messages, userMessage]);
    setInput("");
    setPurpose("");

    try {
      const response = await fetch('http://127.0.0.1:8080/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: formattedCode,
          purpose: purpose 
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      let aiResponse = "";
      
      if (data.status === 'error') {
        // Format the response with better spacing and structure
        const fixSuggestion = data.fix_suggestion || '';
        const refactoredCode = data.refactored_code || '';
        
        aiResponse = `### Error:\n${data.message || 'Unknown error'}\n\n`;
        
        if (fixSuggestion) {
          aiResponse += `### Suggested Fix:\n\`\`\`python\n${
            fixSuggestion.text
              .replace('Analyze the following Python code and suggest fixes:', '')
              .replace(/```python\n/, '')
              .replace(/```$/, '')
              .trim()
          }\n\`\`\`\n\n`;
        }

        if (refactoredCode) {
          aiResponse += `### Refactored Code:\n\`\`\`python\n${
            refactoredCode
              .split('\n')
              .map(line => line.trim())
              .join('\n')
          }\n\`\`\``;
        }
      } else {
        aiResponse = `### Success:\n${data.message || ''}\n\n### Code:\n\`\`\`python\n${data.code || ''}\n\`\`\``;
      }

      const aiMessage = { 
        role: "assistant", 
        content: aiResponse,
        status: data.status 
      };
      
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage = { 
        role: "assistant", 
        content: "Error: Unable to fetch response from local server.",
        status: "error"
      };
      setMessages([...messages, userMessage, errorMessage]);
    }
  };

  return (
    <div className="chat-container" style={styles.chatContainer}>
      <div className="messages" style={{ ...styles.messages, height: containerHeight }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            ...styles.message, 
            textAlign: msg.role === "user" ? "right" : "left" 
          }}>
            <pre
              style={{
                ...styles.messageContent,
                backgroundColor: msg.role === "user" ? "#007bff" : 
                  msg.status === "error" ? "#ffebee" : "#f5f5f5",
                color: msg.role === "user" ? "#fff" : "#000",
                whiteSpace: "pre-wrap",
                fontFamily: msg.role === "user" ? "inherit" : "'Consolas', monospace",
                fontSize: msg.role === "user" ? "inherit" : "14px",
                textAlign: "left",
                padding: "16px",
                lineHeight: "1.5"
              }}
            >
              {msg.content}
            </pre>
          </div>
        ))}
      </div>
      <div style={styles.resizeHandle} onMouseDown={handleMouseDown}>
        <div style={styles.resizeIcon}></div>
      </div>
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <div style={styles.topInputContainer}>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              style={styles.purposeInput}
              placeholder="Enter purpose..."
            />
            <button 
              onClick={sendMessage} 
              style={{
                ...styles.sendButton,
                opacity: !input.trim() || !purpose.trim() ? 0.5 : 1,
                cursor: !input.trim() || !purpose.trim() ? 'not-allowed' : 'pointer'
              }}
              disabled={!input.trim() || !purpose.trim()}
            >
              Send
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            style={{
              ...styles.input,
              fontFamily: "'Consolas', monospace",
              fontSize: "14px",
              whiteSpace: "pre",
              overflowY: "auto"
            }}
            placeholder="Type your code here... (Ctrl + Enter to send)"
          />
          {error && <div style={styles.errorMessage}>{error}</div>}
        </div>
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
    overflowY: "auto",
    marginBottom: 10,
    paddingRight: "5px", 
    scrollbarWidth: "thin", 
    scrollbarColor: "#007bff #f1f1f1", 
    transition: "height 0.1s ease",
    maxHeight: "80vh",  
  },
  message: {
    marginBottom: 12,
  },
  messageContent: {
    padding: "10px 14px",
    borderRadius: "8px",
    maxWidth: "90%",
    wordBreak: "break-word",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    margin: "8px 0",  
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 10,
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  topInputContainer: {
    display: "flex",
    gap: 10,
    width: "100%",
  },
  purposeInput: {
    flex: 1,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 20,
    fontSize: 16,
    height: "40px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  errorMessage: {
    color: "#d32f2f",
    fontSize: "12px",
    marginTop: "4px",
    textAlign: "left",
  },
  input: {
    width: "calc(100% - 20px)",  
    padding: "10px",             
    border: "1px solid #ddd",
    borderRadius: 20,
    fontSize: 16,
    outline: "none",
    transition: "border-color 0.3s ease",
    minHeight: "100px",
    resize: "vertical",
    margin: "5px 0",
    boxSizing: "border-box",     
  },
  sendButton: {
    height: "40px",
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 20,
    fontSize: 16,
    transition: "all 0.3s ease",
    minWidth: "100px",
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

  resizeHandle: {
    width: "100%",
    height: "20px",
    cursor: "ns-resize",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: "0 0 8px 8px",
    userSelect: "none",
  },

  resizeIcon: {
    width: "30px",
    height: "4px",
    backgroundColor: "#007bff",
    borderRadius: "2px",
    opacity: 0.5,
  }
};