import React, { useState } from "react";

export const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Bonjour ! Comment puis-je vous aider sur SISAG ?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    // Placeholder: simulate bot response
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: "bot", text: "Merci pour votre question. Un agent vous répondra bientôt !" }]);
    }, 800);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          className="bg-blue-700 text-white rounded-full p-3 shadow-lg hover:bg-blue-800 transition flex items-center gap-2"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chatbot"
        >
          <span role="img" aria-label="Chatbot">🤖</span>
        </button>
      )}
      {open && (
        <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-700 rounded-t-xl text-white">
            <span className="font-bold">Chatbot SISAG</span>
            <button onClick={() => setOpen(false)} className="text-white text-xl">×</button>
          </div>
          <div className="flex-1 px-4 py-2 overflow-y-auto" style={{ maxHeight: 300 }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-3 py-2 rounded-lg text-sm ${msg.sender === "user" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre question..."
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition"
            >Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}