import { MessageSquare, Paperclip, X, Plus } from "lucide-react";
import React from "react";

import { useAudio } from "../../hooks/useAudio";
import { ConnectionStatus } from "../../types";
import LogTerminal from "../LogTerminal";

import type { Message } from "../../types";
import type { SystemLog } from "../../types/gemini-live";

interface SidebarRightProps {
  currentWidth: number;
  isResizing: boolean;
  rightPanelMode: "chat" | "terminal";
  setRightPanelMode: (mode: "chat" | "terminal") => void;
  messages: Message[];
  logs: SystemLog[];
  status: ConnectionStatus;
  attachedFiles: { name: string; data?: string; mimeType?: string; path?: string; type?: string; size?: number; content?: string }[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
  handleNativeFileSelect: () => void;
  removeFile: (idx: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onStartResizing: () => void;
  isThinking?: boolean;
  currentThought?: string;
  thinkingEnabled?: boolean;
  setThinkingEnabled?: (enabled: boolean) => void;
  currentOutput?: string;
}

const SidebarRight: React.FC<SidebarRightProps> = ({
  currentWidth,
  isResizing,
  rightPanelMode,
  setRightPanelMode,
  messages,
  logs,
  status,
  attachedFiles,
  chatInput,
  setChatInput,
  handleSendChat,
  handleNativeFileSelect,
  removeFile,
  messagesEndRef,
  onStartResizing,
  isThinking,
  currentThought,
  thinkingEnabled,
  setThinkingEnabled,
  currentOutput,
}) => {
  const { playClick } = useAudio();
  return (
    <>
      {/* Resize Handle */}
      {currentWidth > 0 && (
        <div
          onMouseDown={onStartResizing}
          className="hidden xl:flex w-2 bg-transparent cursor-col-resize z-40 transition-all absolute top-16 bottom-0 items-center justify-center group"
          style={{ right: currentWidth - 4 }}
        >
          <div className="w-[1px] h-32 bg-white/5 group-hover:bg-j-cyan/30 transition-all rounded-full scale-y-0 group-hover:scale-y-100 origin-center duration-500" />
        </div>
      )}

      <aside
        style={{
          width: currentWidth,
          paddingLeft: currentWidth > 0 ? undefined : 0,
          paddingRight: currentWidth > 0 ? undefined : 0,
          opacity: currentWidth > 0 ? 1 : 0,
        }}
        className={`flex border-l border-white/10 p-2 md:p-4 xl:p-6 flex-col bg-j-panel/95 backdrop-blur-3xl ${isResizing ? "" : "sidebar-transition"} overflow-hidden relative shadow-2xl sci-fi-grid`}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-j-cyan/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 shrink-0 relative z-10">
          <div>
            <h2 className="text-xs font-mono font-bold text-j-cyan tracking-[0.3em] uppercase">
              {rightPanelMode === "chat" ? "System_Transcription" : "Kernel_Logs"}
            </h2>
            <div className="h-0.5 w-8 bg-j-cyan mt-1 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => {
                playClick();
                setRightPanelMode("chat");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${
                rightPanelMode === "chat"
                  ? "bg-j-cyan/20 text-j-cyan ring-1 ring-j-cyan/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                  : "text-j-text-muted hover:text-white"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${rightPanelMode === "chat" ? "bg-j-cyan animate-pulse" : "bg-transparent"}`}
              />
              Chat
            </button>
            <button
              onClick={() => {
                playClick();
                setRightPanelMode("terminal");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${
                rightPanelMode === "terminal"
                  ? "bg-j-cyan/20 text-j-cyan ring-1 ring-j-cyan/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                  : "text-j-text-muted hover:text-white"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${rightPanelMode === "terminal" ? "bg-j-cyan animate-pulse" : "bg-transparent"}`}
              />
              Logs
            </button>
          </div>
        </div>

        {/* Professional Deep Reasoning Toggle */}
        {rightPanelMode === "chat" && (
          <div className="flex items-center justify-between px-4 mb-6 py-2 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${thinkingEnabled ? "bg-j-cyan shadow-[0_0_10px_cyan]" : "bg-gray-500/50"}`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${thinkingEnabled ? "text-j-text-primary" : "text-j-text-muted"}`}
                >
                  Deep Reasoning
                </span>
                <span className="text-[9px] text-white/30 hidden sm:block">
                  {thinkingEnabled ? "Logic & Strategy Active" : "Fast Response Mode"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                setThinkingEnabled?.(!thinkingEnabled);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ease-in-out focus:outline-none ${thinkingEnabled ? "bg-j-cyan/20 border-j-cyan/50" : "bg-black/40"}`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full shadow ring-0 transition duration-300 ease-in-out mt-0.5 ml-0.5 ${thinkingEnabled ? "translate-x-4 bg-j-cyan shadow-[0_0_5px_white]" : "translate-x-0 bg-gray-500"}`}
              />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          {rightPanelMode === "chat" ? (
            <>
              {messages.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar pb-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} group mb-4`}
                    >
                      <div
                        className="flex items-center gap-2 mb-1.5 px-1 w-full"
                        style={{
                          justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                          flexDirection: msg.role === "user" ? "row" : "row",
                        }}
                      >
                        {msg.role !== "user" && (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-j-cyan shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-j-cyan">
                              {msg.isStreaming ? "Theta_TRANSCRIBING..." : "Theta_RESPONSE"}
                            </span>
                          </div>
                        )}

                        {msg.role === "user" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-j-text-muted">
                              USER_CMD
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Persistent Thought Display */}
                      {msg.thought && (
                        <div className="w-full mb-2 animate-in fade-in duration-500">
                          <div className="bg-j-surface/30 border-l border-j-cyan/20 pl-3 py-2 rounded-r-lg max-w-[90%]">
                            <span className="text-[8px] font-mono text-j-cyan/50 tracking-widest uppercase block mb-1">
                              Reasoning_Archive
                            </span>
                            <p className="text-[10px] text-j-text-secondary/60 italic leading-relaxed font-light">
                              {msg.thought}
                            </p>
                          </div>
                        </div>
                      )}

                      <div
                        className={`p-4 rounded-2xl text-[12px] leading-[1.6] max-w-[95%] shadow-xl border transition-all duration-300 ${
                          msg.role === "user"
                            ? "bg-j-surface/90 border-white/10 text-j-text-primary rounded-tr-none group-hover:border-white/20"
                            : msg.isStreaming
                              ? "bg-j-cyan/5 border-j-cyan/20 text-j-text-primary/90 rounded-tl-none italic shadow-[0_0_15px_rgba(0,229,255,0.05)]"
                              : "bg-j-cyan/10 border-j-cyan/30 text-j-text-primary rounded-tl-none group-hover:border-j-cyan/50 shadow-[0_4px_25px_rgba(0,229,255,0.05)]"
                        }`}
                      >
                        {msg.text}
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3 bg-j-cyan ml-1 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Live Thinking Block - Shows whenever thinking text exists */}
                  {currentThought && (
                    <div className="flex flex-col items-start px-2 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-6">
                      <div className="bg-j-panel/30 border-l border-j-cyan/30 pl-3 py-2 my-1 rounded-r-lg max-w-[90%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono tracking-widest text-j-cyan/60 uppercase flex items-center gap-1.5">
                            {isThinking ? (
                              <>
                                <span className="w-1.5 h-1.5 bg-j-cyan rounded-full animate-pulse" />
                                Thinking...
                              </>
                            ) : (
                              <>Reasoning Complete</>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-j-text-secondary/70 italic leading-relaxed font-light">
                          {currentThought}
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-j-cyan/20 blur-2xl rounded-full animate-pulse-slow" />
                    <div className="relative w-24 h-24 border border-j-cyan/30 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 border border-j-cyan/10 border-dashed rounded-full animate-spin-slow" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-j-cyan rounded-full shadow-[0_0_15px_rgba(0,229,255,1)]" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-j-text-primary font-mono text-sm tracking-[0.2em] uppercase mb-2 font-bold decoration-j-cyan/50 underline-offset-8">
                    Awaiting Interaction
                  </h3>
                  <p className="text-j-text-secondary text-[11px] leading-relaxed max-w-[240px] font-medium">
                    Voice transcription aur chat history yahan numayan hogi.
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-12 w-full opacity-40">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 bg-j-text-secondary/30 rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-j-cyan/80 w-1/3 animate-data-flow"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col border border-white/5 rounded-2xl bg-black/20">
              <LogTerminal logs={logs} className="flex-1" />
            </div>
          )}
        </div>

        {/* AI Interaction Section */}
        <div
          className={`mt-auto pt-6 border-t border-white/10 relative z-10 ${status !== ConnectionStatus.CONNECTED ? "opacity-80" : ""}`}
        >
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-bottom-2 duration-300">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 bg-j-cyan/10 border border-j-cyan/30 rounded-xl group/file relative shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-j-cyan/5 -translate-x-full group-hover/file:translate-x-0 transition-transform duration-500" />
                  <span className="text-[10px] text-j-cyan font-mono truncate max-w-[120px] relative z-10">
                    {file.name}
                  </span>
                  <button
                    onClick={() => {
                      playClick();
                      removeFile(idx);
                    }}
                    className="p-1 hover:bg-j-crimson/20 rounded-md text-j-text-muted hover:text-j-crimson transition-colors relative z-10"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {attachedFiles.length < 5 && (
                <button
                  onClick={() => {
                    playClick();
                    handleNativeFileSelect();
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-xl border border-dashed border-j-cyan/30 text-j-cyan/40 hover:border-j-cyan hover:text-j-cyan hover:bg-j-cyan/5 transition-all"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          )}

          <div className="relative group">
            {/* Premium Glow effect behind input */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-j-cyan/40 via-j-blue/20 to-j-cyan/40 rounded-[22px] blur-sm opacity-0 group-focus-within:opacity-100 transition-all duration-700 animate-pulse-slow" />

            <div className="relative flex items-center bg-black/80 rounded-[20px] border border-white/20 group-focus-within:border-j-cyan/50 shadow-2xl transition-all duration-300">
              <button
                onClick={() => {
                  playClick();
                  handleNativeFileSelect();
                }}
                disabled={status !== ConnectionStatus.CONNECTED || attachedFiles.length >= 5}
                className="absolute left-4 p-2 text-j-text-muted hover:text-j-cyan disabled:opacity-30 transition-all z-10"
                title="Attach Files"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder={
                  status === ConnectionStatus.CONNECTED ? "TYPE_COMMAND_HERE..." : "SYSTEM_OFFLINE"
                }
                disabled={status !== ConnectionStatus.CONNECTED}
                className={`w-full bg-transparent px-5 py-4 pl-14 pr-14 text-[13px] transition-all font-medium focus:outline-none 
                                    ${
                                      status === ConnectionStatus.CONNECTED
                                        ? "text-j-text-primary placeholder:text-j-text-muted/60"
                                        : "text-j-crimson/80 placeholder:text-j-crimson/60 font-black tracking-widest"
                                    }`}
              />

              <button
                onClick={() => {
                  playClick();
                  handleSendChat();
                }}
                disabled={
                  (!chatInput.trim() && attachedFiles.length === 0) ||
                  status !== ConnectionStatus.CONNECTED
                }
                className={`absolute right-2 p-2.5 rounded-2xl transition-all duration-300 shadow-lg ${
                  (chatInput.trim() || attachedFiles.length > 0) &&
                  status === ConnectionStatus.CONNECTED
                    ? "bg-j-cyan text-black shadow-j-cyan/20 scale-100"
                    : "bg-j-cyan/5 text-j-cyan/30 scale-95 opacity-50 shrink-0"
                }`}
              >
                <MessageSquare
                  size={18}
                  className={chatInput.trim() ? "animate-in zoom-in duration-300" : ""}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-j-text-muted uppercase tracking-[0.2em]">
                Theta-v2.5_core
              </span>
              {status === ConnectionStatus.CONNECTED && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-j-cyan/10 text-j-cyan border border-j-cyan/20 animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <div
                className={`w-1 h-3 rounded-full transition-all duration-500 ${status === ConnectionStatus.CONNECTED ? "bg-j-cyan shadow-[0_0_5px_cyan]" : "bg-white/5"}`}
              />
              <div
                className={`w-1 h-3 rounded-full transition-all duration-500 delay-75 ${status === ConnectionStatus.CONNECTED ? "bg-j-cyan shadow-[0_0_5px_cyan]" : "bg-white/5"}`}
              />
              <div
                className={`w-1 h-3 rounded-full transition-all duration-500 delay-150 ${status === ConnectionStatus.CONNECTED ? "bg-j-cyan shadow-[0_0_5px_cyan]" : "bg-white/5"}`}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarRight;
