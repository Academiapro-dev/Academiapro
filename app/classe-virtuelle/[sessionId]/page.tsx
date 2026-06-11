import React, { useState, useEffect, useRef } from "react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isAI: boolean;
}

interface VirtualClassroomProps {
  sessionId: string;
}

const VirtualClassroom: React.FC<VirtualClassroomProps> = ({ sessionId }) => {
  const [duration, setDuration] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState("ai-teacher");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const participants: Participant[] = [
    {
      id: "ai-teacher",
      name: "Professor AI",
      avatar: "🤖",
      isAI: true,
      isSpeaking: activeSpeaker === "ai-teacher",
      isMuted: false,
    },
    {
      id: "user-1",
      name: "Vous",
      avatar: "👤",
      isAI: false,
      isSpeaking: activeSpeaker === "user-1",
      isMuted: isMuted,
    },
    {
      id: "user-2",
      name: "Alice Martin",
      avatar: "👩",
      isAI: false,
      isSpeaking: activeSpeaker === "user-2",
      isMuted: false,
    },
    {
      id: "user-3",
      name: "Thomas Bernard",
      avatar: "👨",
      isAI: false,
      isSpeaking: activeSpeaker === "user-3",
      isMuted: true,
    },
    {
      id: "user-4",
      name: "Sophie Durand",
      avatar: "👩‍💼",
      isAI: false,
      isSpeaking: activeSpeaker === "user-4",
      isMuted: false,
    },
  ];

  const aiResponses = [
    "Excellente question ! En mathématiques, cette notion est fondamentale pour comprendre les bases de l'algèbre.",
    "Analysons ensemble ce problème étape par étape. Premièrement, nous devons identifier les variables.",
    "Très bien observé ! Vous avez parfaitement saisi le concept central de cette leçon.",
    "N'hésitez pas à poser des questions. C'est ainsi qu'on progresse dans l'apprentissage.",
    "Rappelons les principes fondamentaux que nous avons vus précédemment dans ce cours.",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: "1",
        senderId: "ai-teacher",
        senderName: "Professor AI",
        text: "Bienvenue dans la session " + sessionId + " ! Aujourd hui nous allons explorer des concepts fascinants.",
        timestamp: new Date(Date.now() - 300000),
        isAI: true,
      },
      {
        id: "2",
        senderId: "user-2",
        senderName: "Alice Martin",
        text: "Bonjour Professeur ! Je suis prête pour le cours.",
        timestamp: new Date(Date.now() - 240000),
        isAI: false,
      },
      {
        id: "3",
        senderId: "ai-teacher",
        senderName: "Professor AI",
        text: "Parfait Alice ! Commençons par les fondamentaux. Qui peut me dire ce qu'est une variable en programmation ?",
        timestamp: new Date(Date.now() - 180000),
        isAI: true,
      },
    ];
    setMessages(initialMessages);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const speakerRotation = setInterval(() => {
      const ids = ["ai-teacher", "user-2", "user-3", "ai-teacher", "user-4"];
      const random = ids[Math.floor(Math.random() * ids.length)];
      setActiveSpeaker(random);
    }, 4000);
    return () => clearInterval(speakerRotation);
  }, []);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) {
      return pad(h) + ":" + pad(m) + ":" + pad(s);
    }
    return pad(m) + ":" + pad(s);
  };

  const formatTime = (date: Date): string => {
    return date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      senderId: "user-1",
      senderName: "Vous",
      text: inputText,
      timestamp: new Date(),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: "ai-teacher",
        senderName: "Professor AI",
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
        isAI: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  const handleQuit = () => {
    alert("Vous quittez la session " + sessionId + ". Durée totale : " + formatDuration(duration));
  };

  const containerStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#050508",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: "hidden",
    color: "#ffffff",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    backgroundColor: "#0a0a0f",
    borderBottom: "1px solid rgba(200, 169, 110, 0.2)",
    flexShrink: 0,
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const logoIconStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #c8a96e, #8a6a3e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#c8a96e",
    letterSpacing: "0.5px",
  };

  const sessionBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    backgroundColor: "rgba(200, 169, 110, 0.1)",
    borderRadius: "20px",
    border: "1px solid rgba(200, 169, 110, 0.3)",
  };

  const liveDotStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#e74c3c",
    animation: "pulse 1.5s infinite",
  };

  const timerStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: "600",
    color: "#c8a96e",
    fontVariantNumeric: "tabular-nums",
  };

  const quitButtonStyle: React.CSSProperties = {
    padding: "8px 20px",
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    border: "1px solid rgba(231, 76, 60, 0.5)",
    borderRadius: "8px",
    color: "#e74c3c",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  };

  const mainContentStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  };

  const videoAreaStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    gap: "16px",
    overflow: "hidden",
  };

  const mainVideoStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "#0d0d15",
    borderRadius: "16px",
    border: "2px solid rgba(200, 169, 110, 0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 30px rgba(200, 169, 110, 0.1)",
  };

  const aiAvatarBigStyle: React.CSSProperties = {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1a1a2e, #16213e)",
    border: "3px solid #c8a96e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "60px",
    marginBottom: "16px",
    boxShadow: "0 0 40px rgba(200, 169, 110, 0.3)",
    animation: "float 3s ease-in-out infinite",
  };

  const aiNameBigStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#c8a96e",
    marginBottom: "8px",
  };

  const aiSubtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "rgba(200, 169, 110, 0.6)",
    marginBottom: "16px",
  };

  const speakingBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    backgroundColor: "rgba(200, 169, 110, 0.15)",
    borderRadius: "20px",
    border: "1px solid rgba(200, 169, 110, 0.4)",
  };

  const waveStyle: React.CSSProperties = {
    display: "flex",
    gap: "3px",
    alignItems: "center",
  };

  const bottomParticipantsStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    flexShrink: 0,
  };

  const participantCardStyle = (participant: Participant): React.CSSProperties => ({
    flex: 1,
    backgroundColor: participant.isSpeaking ? "rgba(200, 169, 110, 0.1)" : "#0d0d15",
    borderRadius: "12px",
    border: participant.isSpeaking ? "2px solid rgba(200, 169, 110, 0.6)" : "1px solid rgba(255,255,255,0.08)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: participant.isSpeaking ? "0 0 15px rgba(200, 169, 110, 0.15)" : "none",
  });

  const avatarSmallStyle = (participant: Participant): React.CSSProperties => ({
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: participant.isAI
      ? "linear-gradient(135deg, #1a1a2e, #16213e)"
      : "linear-gradient(135deg, #1e2a3a, #0f1923)",
    border: participant.isSpeaking ? "2px solid #c8a96e" : "2px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    position: "relative",
  });

  const participantNameStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  };

  const mutedIconStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(231, 76, 60, 0.8)",
  };

  const rightPanelStyle: React.CSSProperties = {
    width: "320px",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid rgba(200, 169, 110, 0.15)",
    backgroundColor: "#07070d",
    flexShrink: 0,
  };

  const panelHeaderStyle: React.CSSProperties = {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const panelTitleStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: "700",
    color: "#c8a96e",
  };

  const chatMessagesStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const messageStyle = (is