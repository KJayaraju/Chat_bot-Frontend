import React, { useRef, useState, useEffect } from "react";
import Markdown from "markdown-to-jsx";
import Image from "../assets/image.png";

import "./Chatui.css";

export default function ChatUI() {
  const fileRef = useRef();
  const imageRef = useRef();
  const chatEndRef = useRef();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);

  const [previewImage, setPreviewImage] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const user = localStorage.getItem("user");
  const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:5000";

  const activeChat = chats.find((c) => c.id === activeChatId);

  // ✅ FETCH CHATS
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${BASE_URL}/api/chat/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        const formatted = data.map((chat) => ({
          id: chat._id,
          title: chat.chatTitle,
          messages: chat.messages.map((m) => ({
            role: m.role === "assistant" ? "bot" : "user",
            text: m.content,
            images: m.images || [],
            files: m.files || [],
          })),
        }));

        setChats(formatted.splice(0, 10)); // limit to 20 chats
        

      } catch (err) {
        console.error("Fetch chats error:", err);
      }
    };

    fetchChats();
  }, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  // ✅ CREATE NEW CHAT
  const createNewChat = () => {
  const newChat = {
    id: Date.now().toString(),
    title: ""|| "New Chart", // empty initially
    messages: [],
  };


    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  // 🎤 Voice
  const startVoice = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };
    recognition.start();
  };

  // 🔊 Read
  const Read = () => {
    if (!activeChat) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const last = activeChat.messages.at(-1);
    if (!last) return;

    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(last.text)
    );
  };

  // 📎 Upload
  const uploadFileToServer = async (file) => {
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) return null;

      return data.url;

    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // 🔥 SEND MESSAGE
  const handleSend = async () => {
  if (!input.trim() && files.length === 0 && images.length === 0) return;

  let chat = activeChat;

  // ✅ Create chat if not exists
  if (!chat) {
    const newChat = {
      id: Date.now().toString(),
      title: "", // ✅ empty initially
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);

    chat = newChat;
  }

  const userMessage = {
    role: "user",
    text: input || "",
    files,
    images,
  };

  const currentInput = input;

  // ✅ UPDATE CHAT SAFELY
  setChats((prev) =>
    prev.map((c) => {
      if (c.id !== chat.id) return c;

      return {
        ...c,
        // ✅ set title ONLY once
       
          title: c.title || "New Chat",

        messages: [...c.messages, userMessage],
      };
    })
  );
  setInput("");
  setFiles([]);
  setImages([]);

  try {
    const token = localStorage.getItem("token");

    let uploadedImageUrl = null;
    let uploadedFileUrl = null;

    if (images.length > 0) {
      uploadedImageUrl = await uploadFileToServer(images[0].file);
    }

    if (files.length > 0) {
      uploadedFileUrl = await uploadFileToServer(files[0]);
    }

    const inputdata={message: currentInput || "",
        image: uploadedImageUrl,
        fileUrl: uploadedFileUrl,
        chatId: chat.id.length === 24 ? chat.id : null}

    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(inputdata),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // ✅ ADD BOT RESPONSE + UPDATE ID

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chat.id) return c;

        return {
          ...c,
          id: data.chatId,
          title: data.title || c.title,
          messages: [
            ...c.messages,
            {
              role: "bot",
              text: data.content,
              images: uploadedImageUrl ? [uploadedImageUrl] : [],
              files: uploadedFileUrl ? [uploadedFileUrl] : [],
            },
          ],
        };
      })
    );

    setActiveChatId(data.chatId);
  } catch (err) {
    console.error("CHAT ERROR:", err);

    setChats((prev) =>
      prev.map((c) =>
        c.id === chat.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                { role: "bot", text: "Server error ❌" },
              ],
            }
          : c
      )
    );
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleImageUpload = (e) => {
    const imgs = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...imgs]);
  };

  const removeFile = (i) => {
    setFiles(files.filter((_, idx) => idx !== i));
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(images[i].preview);
    setImages(images.filter((_, idx) => idx !== i));
  };
  const deleteChat = async (chatId) => {
  const token = localStorage.getItem("token");

  await fetch(`${BASE_URL}/api/chat/${chatId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setChats((prev) => prev.filter((c) => c.id !== chatId));
};

  return (
    <div className="app">
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          <div className="logo-row">
            <img src={Image} alt="Chat Bot" className="logo-img" />
            <h2 className="logo">Snappy</h2>
          </div>

          <button className="menu" onClick={createNewChat}>
            + New chat
          </button>

          <div className="chat-list">
            {chats.map((chat, i) => (
              <div
                key={chat.id || i}
                className={`chat-item ${
                  chat.id === activeChatId ? "active" : ""
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                {chat.title}
                <button
                  className="delete-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  ✕
                </button>

              </div>
            ))}
          </div>
        </div>

        <div className="user">
          <div className="avatar">{user?.[0]}</div>
          <span>{user}</span>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="logo-row">
            <img src={Image} alt="Chat Bot" className="logo-img" />
            <h2 className="logo">Snappy</h2>
          </div>
        </div>

        {/* Chat */}
        <div className="chat-area">
          {!activeChat || activeChat.messages.length === 0 ? (
            <h1 className="center-text">
              Always here, always helpful
            </h1>
          ) : (
            activeChat.messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-row ${
                  msg.role === "user" ? "user-row" : "bot-row"
                }`}
              >
                <div className="message">
                  <div className="message-text"><Markdown>{msg.text}</Markdown></div>

                  {/* Images */}
                  {msg.images &&
                    msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.preview || img} // 🔥 FIX
                        className="chat-img"
                        onClick={() =>
                          setPreviewImage(img.preview || img)
                        }
                        alt=""
                      />
                    ))}

                  {/* Files */}
                  {msg.files &&
                    msg.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="chat-file"
                        onClick={() =>
                          setPreviewFile(
                            typeof file === "string"
                              ? file
                              : URL.createObjectURL(file)
                          )
                        }
                      >
                        📄 {file.name || file} {/* 🔥 FIX */}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* Preview */}
        {(files.length > 0 || images.length > 0) && (
          <div className="preview-container">
            {images.map((img, i) => (
              <div key={i} className="preview-img">
                <img src={img.preview} alt="" />
                <button onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}

            {files.map((file, i) => (
              <div key={i} className="preview-file">
                📄 {file.name}
                <button onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="input-box">
        <div className="input-actions">
          <button onClick={() => fileRef.current.click()}>📎</button>
          <button onClick={() => imageRef.current.click()}>🖼️</button>

          <input type="file" hidden multiple ref={fileRef} onChange={handleFileUpload} />
          <input type="file" hidden accept="image/*" multiple ref={imageRef} onChange={handleImageUpload} />
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
        />

        <button className="send-btn" onClick={handleSend}>➤</button>
        <button className="voice-btn" onClick={startVoice}>🎤</button>
        <button className="voice-btn" onClick={Read}>🔊</button>
      </div>

      {/* Modals */}
      {previewImage && (
        <div className="image-modal">
          <button className="close-btn" onClick={() => setPreviewImage(null)}>✕</button>
          <img src={previewImage} alt="" />
        </div>
      )}

      {previewFile && (
        <div className="image-modal">
          <button className="close-btn" onClick={() => setPreviewFile(null)}>✕</button>
          <iframe src={previewFile} title="file" className="file-viewer" />
        </div>
      )}
    </div>
  );
}