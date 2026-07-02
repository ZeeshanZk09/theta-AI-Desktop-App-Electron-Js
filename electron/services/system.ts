import { exec, spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { type BrowserWindow } from "electron";
import * as si from "systeminformation";

import { logger } from "../utils/logger";

export const BLOCKED_COMMAND_PATTERNS = [
  /rm\s+-rf\s+\//,
  /rmdir\s+\/s\s+\/q\s+[a-zA-Z]:\\/i,
  /del\s+\/f\s+\/s\s+\/q\s+[a-zA-Z]:\\/i,
  /mkfs/,
  /dd\s+if=/,
  /format\s+[a-zA-Z]:/i,
  />\s*\/dev\/(sda|hda|nvme)/,
  />\s*\\\\.\\PhysicalDrive/,
];

let wakeWordProcess: ChildProcess | null = null;

function resolveWakeWordScriptPath() {
  const candidates = [
    path.join(process.cwd(), "wake_word_bg.py"),
    path.join(__dirname, "../wake_word_bg.py"),
    path.join(process.resourcesPath || "", "wake_word_bg.py"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(__dirname, "../wake_word_bg.py");
}

function resolvePythonExecutable() {
  const explicitPath = process.env.Theta_PYTHON_PATH;
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  if (process.platform === "win32") {
    const venvPython = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPython)) {
      return venvPython;
    }
  }

  return "python";
}

export function startWakeWordDetector(mainWindow: BrowserWindow) {
  if (wakeWordProcess) return;

  const pythonExecutable = resolvePythonExecutable();
  const wakeWordScript = resolveWakeWordScriptPath();
  logger.log(`Starting Wake Word Detector (Python): ${pythonExecutable}`);
  
  try {
    wakeWordProcess = spawn(pythonExecutable, [wakeWordScript]);

    wakeWordProcess.stdout?.on("data", (data) => {
      try {
        const output = data.toString().trim();
        const lines = output.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          const result = JSON.parse(line);
          mainWindow.webContents.send("wake-word-detected", result);
        }
      } catch (e) {
        logger.error("Error parsing wake word output:", e);
      }
    });

    wakeWordProcess.stderr?.on("data", (data) => {
      logger.error(`Wake Word Error: ${data}`);
    });

    wakeWordProcess.on("close", (code) => {
      logger.log(`Wake word process exited with code ${code}`);
      wakeWordProcess = null;
    });
  } catch (error) {
    logger.error("Failed to start wake word detector:", error);
  }
}

export function killWakeWordProcess() {
  if (wakeWordProcess) {
    wakeWordProcess.kill();
    wakeWordProcess = null;
  }
}

export async function getDetailedSystemInfo() {
  const [cpu, mem, graphics, os, network, battery, fsSize] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.osInfo(),
    si.networkInterfaces(),
    si.battery(),
    si.fsSize(),
  ]);
  return { cpu, mem, graphics, os, network, battery, fsSize };
}

export async function getProcesses() {
  const processes = await si.processes();
  const sorted = processes.list
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 20)
    .map((p) => ({ name: p.name, pid: p.pid, cpu: p.cpu, mem: p.mem }));
  return sorted;
}

export function killProcess(pid: number) {
  process.kill(pid);
}

export function execCommand(command: string): Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }> {
  return new Promise((resolve) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ success: !error, stdout, stderr, error: error?.message });
    });
  });
}
