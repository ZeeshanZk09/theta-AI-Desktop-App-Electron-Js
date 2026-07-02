/* eslint-disable react-hooks/exhaustive-deps */
import { Plus, Trash2, Save, Search, FileText, Download } from "lucide-react";
import { marked } from "marked";
import Quill from "quill";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TurndownService from "turndown";

import { useAudio } from "../../hooks/useAudio";

import "quill/dist/quill.snow.css";

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  timestamp?: number;
  createdAt?: number;
  updatedAt?: number;
  date?: string;
}

interface NotesSectionProps {
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onSaveNote, onDeleteNote }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [editorHtml, setEditorHtml] = useState("<p></p>");
  const [isDirty, setIsDirty] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    note: Note;
    x: number;
    y: number;
  } | null>(null);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isProgrammaticUpdateRef = useRef(false);

  const { playClick } = useAudio();

  const turndown = useMemo(
    () =>
      new TurndownService({
        codeBlockStyle: "fenced",
        headingStyle: "atx",
      }),
    []
  );

  const normalizedNotes: Note[] = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
        createdAt: note.createdAt || note.timestamp || Date.now(),
        updatedAt: note.updatedAt || note.timestamp || Date.now(),
      })),
    [notes]
  );

  const selectedNote = useMemo(
    () => normalizedNotes.find((note) => note.id === selectedNoteId) || null,
    [normalizedNotes, selectedNoteId]
  );

  const handleCreateNew = () => {
    playClick();
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timestamp: Date.now(),
    };

    onSaveNote(newNote);
    setSelectedNoteId(newNote.id);
    setTitleInput(newNote.title);
    setTagsInput("");
    setEditorHtml("<p></p>");
    setIsDirty(false);
  };

  const handleSelectNote = (note: Note) => {
    playClick();
    setSelectedNoteId(note.id);
    setTitleInput(note.title || "Untitled Note");
    setTagsInput((note.tags || []).join(", "));
    setEditorHtml(marked.parse(note.content || "") as string);
    setIsDirty(false);
  };

  const handleSave = () => {
    if (!selectedNote) return;

    const markdownBody = turndown.turndown(editorHtml || "<p></p>");
    const normalizedTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const updatedNote: Note = {
      ...selectedNote,
      title: titleInput.trim() || "Untitled Note",
      content: markdownBody,
      tags: normalizedTags,
      updatedAt: Date.now(),
      timestamp: Date.now(),
    };

    onSaveNote(updatedNote);
    setIsDirty(false);
  };

  const exportNote = (note: Note, format: "md" | "txt") => {
    const extension = format === "md" ? "md" : "txt";
    const body = format === "md" ? note.content : note.content.replace(/[#*_`>-]/g, "");
    const safeTitle = (note.title || "note").replace(/[^a-z0-9-_ ]/gi, "").trim() || "note";
    const fileName = `${safeTitle}.${extension}`;

    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredNotes = normalizedNotes.filter((note) => {
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!editorContainerRef.current || quillRef.current) return;

    const quill = new Quill(editorContainerRef.current, {
      theme: "snow",
      modules: {
        toolbar: {
          container: "#notes-rich-toolbar",
          handlers: {
            divider: function () {
              const range = quill.getSelection(true);
              const index = range?.index || quill.getLength();
              quill.clipboard.dangerouslyPasteHTML(index, "<hr />");
              quill.setSelection(index + 1, 0);
            },
          },
        },
      },
    });

    quill.on("text-change", () => {
      if (isProgrammaticUpdateRef.current) return;
      setEditorHtml(quill.root.innerHTML);
      setIsDirty(true);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedNote || !quillRef.current) return;

    isProgrammaticUpdateRef.current = true;
    quillRef.current.clipboard.dangerouslyPasteHTML(
      marked.parse(selectedNote.content || "") as string
    );
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 0);
  }, [selectedNote, selectedNote?.id]);

  useEffect(() => {
    if (normalizedNotes.length === 0) return;
    if (!selectedNoteId) {
      handleSelectNote(normalizedNotes[0]);
    }
  }, [handleSelectNote, normalizedNotes, selectedNoteId]);

  useEffect(() => {
    const hideContextMenu = () => setContextMenu(null);
    window.addEventListener("click", hideContextMenu);
    return () => window.removeEventListener("click", hideContextMenu);
  }, []);

  return (
    <div className="h-full w-full flex rounded-3xl overflow-hidden border border-white/10 bg-j-panel/60 backdrop-blur-xl">
      <aside className="w-[320px] border-r border-white/10 p-4 flex flex-col gap-4 bg-black/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Notes</h2>
            <p className="text-[11px] text-j-text-muted">Rich editor + markdown storage</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="p-2 rounded-xl bg-j-cyan/15 text-j-cyan border border-j-cyan/30 hover:bg-j-cyan hover:text-black transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-j-text-muted" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title or content..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-j-text-primary focus:outline-none focus:border-j-cyan/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({ note, x: event.clientX, y: event.clientY });
              }}
              className={`rounded-2xl border p-3 cursor-pointer transition-colors ${
                selectedNoteId === note.id
                  ? "border-j-cyan/40 bg-j-cyan/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm text-white font-semibold truncate">
                  {note.title || "Untitled Note"}
                </h3>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    playClick();
                    onDeleteNote(note.id);
                  }}
                  className="p-1 rounded-lg hover:bg-rose-500/20 text-j-text-muted hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[11px] text-j-text-secondary line-clamp-2 mt-1">
                {note.content || "No content"}
              </p>
              <div className="text-[10px] text-j-text-muted mt-2">
                {new Date(note.updatedAt || note.timestamp || Date.now()).toLocaleString()}
              </div>
            </button>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-xs text-j-text-muted border border-white/10 rounded-xl p-4">
              No matching notes found.
            </div>
          )}
        </div>
      </aside>

      <section className="flex-1 p-5 flex flex-col gap-4">
        {!selectedNote ? (
          <div className="h-full flex items-center justify-center text-j-text-muted text-sm">
            Select a note to start editing.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={titleInput}
                  onChange={(event) => {
                    setTitleInput(event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Note title"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-j-text-primary focus:outline-none focus:border-j-cyan/40"
                />
                <input
                  value={tagsInput}
                  onChange={(event) => {
                    setTagsInput(event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-j-text-primary focus:outline-none focus:border-j-cyan/40"
                />
              </div>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-j-cyan text-black font-semibold hover:brightness-110 transition-colors"
              >
                <Save size={14} />
                {isDirty ? "Save" : "Saved"}
              </button>
            </div>

            <div
              id="notes-rich-toolbar"
              className="rounded-xl border text-black border-white/10 bg-black p-2"
            >
              <span className="ql-formats">
                <select className="ql-header" defaultValue="">
                  <option value="1">H1</option>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="">Normal</option>
                </select>
              </span>
              <span className="ql-formats">
                <button className="ql-bold" />
                <button className="ql-italic" />
                <button className="ql-underline" />
                <button className="ql-strike" />
              </span>
              <span className="ql-formats">
                <button className="ql-list" value="ordered" />
                <button className="ql-list" value="bullet" />
              </span>
              <span className="ql-formats">
                <button className="ql-blockquote" />
                <button className="ql-code-block" />
                <button className="ql-divider">HR</button>
              </span>
              <span className="ql-formats">
                <button className="ql-clean" />
              </span>
            </div>

            <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden bg-white">
              <div ref={editorContainerRef} className="h-full text-black" />
            </div>

            <div className="text-[11px] text-j-text-muted">
              Notes are stored as markdown internally and rendered as rich text in editor.
            </div>
          </>
        )}
      </section>

      {contextMenu && (
        <div
          className="fixed z-[140] rounded-xl border border-white/10 bg-j-panel shadow-2xl p-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => exportNote(contextMenu.note, "md")}
            className="w-full text-left px-3 py-2 text-xs text-j-text-primary hover:bg-white/5 rounded-lg inline-flex items-center gap-2"
          >
            <Download size={12} />
            Export as .md
          </button>
          <button
            onClick={() => exportNote(contextMenu.note, "txt")}
            className="w-full text-left px-3 py-2 text-xs text-j-text-primary hover:bg-white/5 rounded-lg inline-flex items-center gap-2"
          >
            <FileText size={12} />
            Export as .txt
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
