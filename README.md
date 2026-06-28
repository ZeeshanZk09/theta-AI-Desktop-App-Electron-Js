# Theta Desktop App

This is a desktop application built with Electron, React, TypeScript, and TailwindCSS.

## Project Structure

- `src/` - React frontend code
  - `App.tsx` - Main UI component
  - `main.tsx` - Entry point
- `electron/` - Electron main process code
- `dist/` - Built files (created after build)

## How to Run

1. **Install Dependencies** (if you haven't already):

   ```bash
   npm install
   ```

2. **Start Development Mode**:
   This runs the React dev server and the Electron app window simultaneously.

   ```bash
   npm run electron:dev
   ```

3. **Build for Production**:
   To create an executable (.exe on Windows, .dmg on Mac):
   ```bash
   npm run electron:build
   ```
   The output file will be in the `dist` or `release` folder.

## PostgreSQL Persistent Storage

Theta can store long-term personal data (memories, profile, contacts, notes, tasks, history, dashboard state, imported folders, and LinkedIn queue/history) in PostgreSQL instead of temporary JSON files.

1. Create a PostgreSQL database (example: `theta_ai`).
2. Add this to your `.env` file:

   ```bash
   THETA_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/theta_ai
   ```

3. Start the app normally:

   ```bash
   npm run electron:dev
   ```

On first startup with PostgreSQL enabled, Theta auto-creates a table (`theta_persistent_state`) and migrates existing legacy JSON state into PostgreSQL.

If DB credentials are missing or invalid, the app falls back to local file storage to avoid data loss.

## Features

- **Custom UI**: Designed according to your sketch with a 3-column layout.
- **System Stats**: Placeholder chart for CPU/RAM usage.
- **Visualizer**: Animated circle visualizer in the center.
- **Transcription**: Placeholder for right sidebar content.

## Note

Since we are currently in the UI development phase, most buttons and data are placeholders.
