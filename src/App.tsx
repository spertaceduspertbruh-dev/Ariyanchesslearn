import React, { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  RotateCcw, 
  MessageSquare, 
  History, 
  ChevronRight, 
  Brain, 
  Sword,
  Bot,
  Layout,
  Target,
  Users,
  Archive
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ChatMessage {
  role: "user" | "coach";
  text: string;
}

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle move logic
  function makeAMove(move: any) {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(current => [...current, result]);
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false;
    const move = makeAMove({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: "q",
    });

    if (move === null) return false;
    explainMove(move);
    return true;
  }

  async function explainMove(move: Move) {
    setIsThinking(true);
    const prompt = `
      You are a friendly Grandmaster Chess Coach. The user just made a move: ${move.san}.
      Current FEN: ${game.fen()}
      Game History so far: ${moveHistory.map(m => m.san).join(", ")}
      
      Briefly (2-3 sentences) explain the strategic significance of this move (${move.san}). 
      Does it control the center? Develop a piece? Prepare an attack? 
      Keep it encouraging and educational.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Grandmaster Ariyan, a wise and encouraging chess coach. You help students understand the 'why' behind moves. Use chess terminology naturally but explain it if it's complex."
        }
      });

      const responseText = result.text;
      setMessages(prev => [...prev, { role: "coach", text: responseText }]);
    } catch (error) {
      console.error("Coach error:", error);
    } finally {
      setIsThinking(false);
    }
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setMessages([{ 
      role: "coach", 
      text: "The board is reset. I'm ready to help you analyze your strategy! Make your first move." 
    }]);
  }

  const getMoveNotation = (index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhite = index % 2 === 0;
    return isWhite ? `${moveNumber}. ` : "";
  };

  return (
    <TooltipProvider>
      <div className="h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex overflow-hidden">
        
        {/* Left Vertical Branding Rail */}
        <div className="w-20 border-r border-white/10 flex flex-col items-center py-10 justify-between shrink-0">
          <div className="text-2xl font-heading font-bold italic tracking-tighter text-[#D4AF37]">AC</div>
          <div className="whitespace-nowrap uppercase tracking-[0.4em] text-[10px] text-white/40 rotate-180 flex items-center gap-4" style={{ writingMode: "vertical-rl" }}>
             Ariyanchesslearner <span className="w-1 h-1 bg-[#D4AF37] rounded-full"></span> Studio Edition
          </div>
          <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Top Header */}
          <header className="h-24 border-b border-white/10 flex items-center justify-between px-12 shrink-0">
            <nav className="flex gap-12 text-[11px] uppercase tracking-[0.3em] font-bold">
              <a href="#" className="text-[#D4AF37] transition-colors">Theory</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">Tactics</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">Grandmasters</a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">Archive</a>
            </nav>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/40 leading-none mb-1">Current Elo</p>
                <p className="text-2xl font-heading italic">1842</p>
              </div>
              <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                 <Button variant="ghost" size="icon" onClick={resetGame} className="text-white/40 hover:text-[#D4AF37] hover:bg-transparent">
                    <RotateCcw className="w-5 h-5" />
                 </Button>
                 <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-[10px] font-bold">AR</div>
              </div>
            </div>
          </header>

          {/* Hero Split Layout */}
          <main className="flex-1 flex overflow-hidden">
            
            {/* Content Column (Coach/Lesson Side) */}
            <div className="w-[480px] border-r border-white/10 flex flex-col bg-[#0d0d0d]">
              <div className="p-12 pb-6">
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-4 block font-black">Active Analysis</span>
                <h1 className="text-6xl font-heading leading-[0.9] mb-6">
                   Grandmaster <br/> <span className="italic text-[#D4AF37]">Insights</span>
                </h1>
                <p className="text-white/40 text-[13px] leading-relaxed mb-8 max-w-sm">
                   Make moves on the board to receive strategic annotations from your AI mentor.
                </p>
              </div>

              {/* Chat/Coach Area */}
              <div className="flex-1 flex flex-col overflow-hidden px-12 pb-8">
                <div className="flex-1 overflow-hidden relative">
                   <ScrollArea className="h-full pr-4" ref={scrollRef}>
                      <div className="space-y-6">
                        {messages.length === 0 && (
                          <div className="border border-white/5 bg-white/[0.02] p-6 text-center">
                             <p className="text-white/30 text-xs italic">Awaiting your first move to begin the lecture...</p>
                          </div>
                        )}
                        {messages.map((msg, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2 mb-1">
                               <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'coach' ? 'bg-[#D4AF37]' : 'bg-white'}`}></div>
                               <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{msg.role === 'coach' ? 'Ariyan GM' : 'Student'}</span>
                            </div>
                            <div className="text-sm leading-relaxed text-white/80 font-medium">
                              {msg.text}
                            </div>
                          </motion.div>
                        ))}
                        {isThinking && (
                          <div className="flex gap-2 items-center py-2">
                             <span className="w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse" />
                             <span className="w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse [animation-delay:0.2s]" />
                             <span className="w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                   </ScrollArea>
                </div>

                {/* Annotation Stats */}
                <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40">
                   <div className="flex items-center gap-2">
                      <Target className="w-3 h-3" /> 
                      <span>Accuracy: 94.2%</span>
                   </div>
                   <div className="text-[#D4AF37] font-bold">+1.2 Advantage</div>
                </div>
              </div>
            </div>

            {/* Interactive Board Section */}
            <div className="flex-1 bg-[#111] relative flex items-center justify-center">
              {/* Abstract Grid Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
              
              <div className="relative z-10 w-[500px]">
                <div className="p-2 border border-white/10 bg-[#0A0A0A] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                  <Chessboard 
                    options={{
                      position: game.fen(), 
                      onPieceDrop: onDrop,
                      darkSquareStyle: { backgroundColor: "#222" },
                      lightSquareStyle: { backgroundColor: "rgba(212, 175, 55, 0.08)" },
                      animationDurationInMs: 400,
                      id: "AriyanBoard"
                    }}
                  />
                </div>
                
                {/* Board Info Labels */}
                <div className="mt-6 flex justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-black text-[10px]">W</div>
                      <span className="text-[11px] uppercase tracking-widest font-bold">White to Move</span>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <span className="block text-[9px] uppercase text-white/30 tracking-widest">Moves</span>
                         <span className="font-heading italic text-lg">{moveHistory.length}</span>
                      </div>
                      <div className="text-right">
                         <span className="block text-[9px] uppercase text-white/30 tracking-widest">Type</span>
                         <span className="font-heading italic text-lg">{game.isCheck() ? "Check" : "Standard"}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Decorative Floating Text */}
              <div className="absolute bottom-12 right-12 text-[100px] font-heading font-black text-white/[0.02] pointer-events-none select-none uppercase tracking-tighter">
                Strategy
              </div>
            </div>
          </main>

          {/* Footer Stats Rail */}
          <footer className="h-16 border-t border-white/10 flex items-center px-12 gap-16 shrink-0 bg-[#0A0A0A]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Daily Streak: 14 Days</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Puzzles: 1,204</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Global Rank: Top 4%</span>
            </div>
            <div className="ml-auto text-[10px] uppercase tracking-tighter text-white/20 font-medium">
              © 2026 Ariyanchesslearner / Studio Edition / v2.1
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
