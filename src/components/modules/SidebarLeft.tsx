import { Camera, CameraOff } from "lucide-react";

import TodayHeadlines from "../TodayHeadlines";
import SystemAdvisorPanel, { type AdvisorRecommendation } from "./SystemAdvisorPanel";
import { useAudio } from "../../hooks/useAudio";

import type { DashboardData } from "../../types/index";

interface SidebarLeftProps {
  currentWidth: number;
  isResizing: boolean;
  isCameraOn: boolean;
  isCameraLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  toggleCamera: () => void;
  onStartResizing: () => void;
  dashboardData: DashboardData | null;
  isDashboardLoading: boolean;
  setIsUserModalOpen: (open: boolean) => void;
  setIsDashboardModalOpen: (open: boolean) => void;
  refreshDashboard: () => void;
  advisorRecommendations: AdvisorRecommendation[];
  isAdvisorScanning: boolean;
  onAdvisorScanNow: () => void;
  onAdvisorRunFix: (recommendation: AdvisorRecommendation) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({
  currentWidth,
  isResizing,
  isCameraOn,
  isCameraLoading,
  videoRef,
  canvasRef,
  toggleCamera,
  onStartResizing,
  dashboardData,
  isDashboardLoading,
  setIsUserModalOpen,
  setIsDashboardModalOpen,
  refreshDashboard,
  advisorRecommendations,
  isAdvisorScanning,
  onAdvisorScanNow,
  onAdvisorRunFix,
}) => {
  const { playClick } = useAudio();
  return (
    <>
      <aside
        style={{
          width: currentWidth,
          paddingLeft: currentWidth > 0 ? undefined : 0,
          paddingRight: currentWidth > 0 ? undefined : 0,
          opacity: currentWidth > 0 ? 1 : 0,
        }}
        className={`flex border-r border-white/[0.03] flex-col p-2 md:p-4 lg:p-6 gap-4 lg:gap-6 shrink-0 bg-j-panel/90 backdrop-blur-3xl ${isResizing ? "" : "sidebar-transition"} overflow-hidden relative shadow-2xl`}
      >
        {/* 1. Camera Panel */}
        <div className="h-[260px] md:h-[320px] w-full rounded-3xl border border-white/[0.1] bg-j-surface/40 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,229,255,0.05),transparent_75%)]" />

          {isCameraOn ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                style={{ opacity: isCameraLoading ? 0 : 1 }}
              />
              {isCameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 transition-opacity">
                  <div className="w-8 h-8 border-2 border-j-cyan border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-[10px] text-j-cyan font-mono uppercase tracking-widest">
                    Waking Up...
                  </span>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none border-2 border-j-cyan/20 rounded-3xl animate-pulse" />
            </>
          ) : (
            <div className="flex flex-col items-center">
              <CameraOff
                size={56}
                className="text-j-text-muted mb-4 opacity-40 group-hover:opacity-80 transition-opacity"
              />
              <span className="text-j-text-muted text-base tracking-wider font-light">
                camera offline
              </span>
            </div>
          )}

          <button
            onClick={() => {
              playClick();
              toggleCamera();
            }}
            disabled={isCameraLoading}
            className={`absolute bottom-4 right-4 p-3 rounded-full border backdrop-blur-md transition-all z-20 ${
              isCameraOn
                ? "bg-j-cyan/10 border-j-cyan/50 text-j-cyan shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                : isCameraLoading
                  ? "bg-j-amber/10 border-j-amber/50 text-j-amber animate-pulse"
                  : "bg-white/5 border-white/10 text-j-text-muted hover:text-white"
            } ${isCameraLoading ? "cursor-wait" : "cursor-pointer hover:scale-105 active:scale-95"}`}
          >
            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>

          <canvas ref={canvasRef} width={320} height={240} className="hidden" />
        </div>

        {/* 2. Bottom Panel (News Feed) */}
        <TodayHeadlines
          data={dashboardData}
          loading={isDashboardLoading}
          onMapClick={() => {
            playClick();
            setIsUserModalOpen(true);
          }}
          onSettingsClick={() => {
            playClick();
            setIsDashboardModalOpen(true);
          }}
          onRefresh={() => {
            playClick();
            refreshDashboard();
          }}
        />

        <SystemAdvisorPanel
          recommendations={advisorRecommendations}
          isScanning={isAdvisorScanning}
          onScanNow={() => {
            playClick();
            onAdvisorScanNow();
          }}
          onRunFix={onAdvisorRunFix}
        />
      </aside>

      {/* Resize Handle */}
      {currentWidth > 0 && (
        <button
          onMouseDown={onStartResizing}
          className="hidden lg:flex w-2 bg-transparent cursor-col-resize z-40 transition-all absolute top-16 bottom-0 items-center justify-center group"
          style={{ left: currentWidth - 4 }}
        >
          <div className="w-[1px] h-32 bg-white/5 group-hover:bg-j-cyan/30 transition-all rounded-full scale-y-0 group-hover:scale-y-100 origin-center duration-500" />
        </button>
      )}
    </>
  );
};

export default SidebarLeft;
