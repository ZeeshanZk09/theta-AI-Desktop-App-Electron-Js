import { generateImage } from './genai';
import { SystemLog } from '../types/gemini-live';

export interface ToolExecutionContext {
  addLog: (type: SystemLog['type'], message: string, details?: any) => void;
  onVisualizingChanged?: (isVisualizing: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
  onDiagramGenerated?: (code: string) => void;
  onMemoriesUpdated?: (memories: any[]) => void;
  onContactsUpdated?: (contacts: any[]) => void;
  onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  onNotesUpdated?: (notes: any[]) => void;
  onTasksUpdated?: (tasks: any[]) => void;
  electronAPI: any;
  apiKey: string;
  onYouTubePlay?: (videoId: string) => void;
  getAttachedFiles?: () => any[];
  cleanup: () => void;
}

const logToolRunner = (stage: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (details) {
    console.debug(`[GeminiToolRunner ${timestamp}] ${stage}`, details);
    return;
  }
  console.debug(`[GeminiToolRunner ${timestamp}] ${stage}`);
};

export const handleToolCalls = async (
  toolCalls: any[], 
  session: any, 
  context: ToolExecutionContext
) => {
  const { 
    addLog, 
    onVisualizingChanged, 
    onImageGenerated, 
    onDiagramGenerated, 
    onMemoriesUpdated, 
    onContactsUpdated,
    onDashboardUpdated,
    onNotesUpdated,
    onTasksUpdated,
    electronAPI,  
    apiKey, 
    onYouTubePlay,
    cleanup 
  } = context;

  const uiAccessModeByTool: Record<string, 'read' | 'write' | 'update' | 'delete'> = {
    generate_image: 'update',
    render_diagram: 'update',
    store_memory: 'write',
    get_memories: 'read',
    update_dashboard: 'update',
    add_note: 'write',
    read_notes: 'read',
    add_task: 'write',
    read_tasks: 'read',
    add_contact: 'write',
    read_contacts: 'read',
    play_youtube_video: 'update',
    read_attached_files: 'read',
    semantic_workspace_search: 'read',
  };

  const buildUiAccessDetail = (toolName: string, args: any) => {
    switch (toolName) {
      case 'generate_image':
        return `Render generated image in Visual Hub: ${String(args?.prompt || '').slice(0, 120)}`;
      case 'render_diagram':
        return `Render ${args?.type || 'diagram'} in Visual Hub`;
      case 'store_memory':
        return `Write memory entry: ${String(args?.content || '').slice(0, 120)}`;
      case 'get_memories':
        return 'Read stored memories from Memory module';
      case 'update_dashboard':
        return 'Update dashboard cards (headlines/weather)';
      case 'add_note':
        return `Create note: ${String(args?.title || 'Untitled').slice(0, 80)}`;
      case 'read_notes':
        return `Read notes${args?.query ? ` (query: ${String(args.query).slice(0, 80)})` : ''}`;
      case 'add_task':
        return `Create task: ${String(args?.text || '').slice(0, 100)}`;
      case 'read_tasks':
        return `Read task list${args?.filter ? ` (filter: ${args.filter})` : ''}`;
      case 'add_contact':
        return `Create/update contact: ${String(args?.name || '').slice(0, 80)}`;
      case 'read_contacts':
        return `Read contacts${args?.query ? ` (query: ${String(args.query).slice(0, 80)})` : ''}`;
      case 'play_youtube_video':
        return `Open video player panel for query: ${String(args?.query || '').slice(0, 120)}`;
      case 'read_attached_files':
        return 'Read attached files currently shown in UI context';
      case 'semantic_workspace_search':
        return `Run semantic workspace search: ${String(args?.query || '').slice(0, 120)}`;
      default:
        return `UI ${uiAccessModeByTool[toolName] || 'update'} access requested via ${toolName}`;
    }
  };

  for (const call of toolCalls) {
    const args = (call.args || {}) as any;
    const startedAt = Date.now();

    logToolRunner('toolCall:start', {
      name: call.name,
      id: call.id,
      argKeys: Object.keys(args || {}),
    });

    if (uiAccessModeByTool[call.name]) {
      if (typeof electronAPI?.requestActionApproval !== 'function') {
        logToolRunner('toolCall:blockedApprovalBridgeMissing', {
          name: call.name,
          id: call.id,
        });
        session.sendToolResponse({
          functionResponses: [{
            name: call.name,
            id: call.id,
            response: { error: 'UI access approval bridge is unavailable. Action blocked.' }
          }]
        });
        continue;
      }

      const accessMode = uiAccessModeByTool[call.name];
      const detail = buildUiAccessDetail(call.name, args);
      logToolRunner('toolCall:approvalRequested', {
        name: call.name,
        id: call.id,
        accessMode,
      });
      const approval = await electronAPI.requestActionApproval({
        action: `Theta UI ${accessMode.toUpperCase()} Access`,
        detail,
        source: `gemini-tool-runner:${call.name}`,
        rawPayload: {
          tool: call.name,
          accessMode,
          args,
        },
      });

      logToolRunner('toolCall:approvalResolved', {
        name: call.name,
        id: call.id,
        approved: approval?.approved === true,
      });

      if (!approval?.approved) {
        addLog('warning', `UI access denied for ${call.name}`);
        logToolRunner('toolCall:blockedByUser', {
          name: call.name,
          id: call.id,
        });
        session.sendToolResponse({
          functionResponses: [{
            name: call.name,
            id: call.id,
            response: { error: 'Permission denied by user. UI action was not executed.' }
          }]
        });
        continue;
      }
    }

    if (call.name === 'generate_image') {
      const { prompt } = call.args as any;
      addLog('tool', `Invoking Image Generation`, { prompt });

      onVisualizingChanged?.(true);
      try {
        const imageUrl = await generateImage(prompt, apiKey);
        if (imageUrl) {
          addLog('success', 'Image generated successfully');
          onImageGenerated?.(imageUrl);

          onVisualizingChanged?.(false);
          await electronAPI.saveImage({ 
            base64Data: imageUrl, 
            mimeType: 'image/png' 
          });

          session.sendToolResponse({
            functionResponses: [{
              name: 'generate_image',
              id: call.id,
              response: { result: 'Image generated and auto-saved to Downloads folder.' }
            }]
          });
        } else {
          onVisualizingChanged?.(false);
          session.sendToolResponse({
            functionResponses: [{
              name: 'generate_image',
              id: call.id,
              response: { error: 'Image model returned no image data. Please try a different prompt.' }
            }]
          });
        }
      } catch (err: any) {
        console.error('Image generation/save failed:', err);
        onVisualizingChanged?.(false);
        session.sendToolResponse({
          functionResponses: [{
            name: 'generate_image',
            id: call.id,
            response: { error: err?.message || 'Image generation failed.' }
          }]
        });
      }
    } else if (call.name === 'render_diagram') {
      const { code, type } = call.args as any;
      addLog('tool', `Rendering ${type} Diagram`, { codeLength: code.length });
      onVisualizingChanged?.(true);

      onDiagramGenerated?.(code);
      onVisualizingChanged?.(false);
      
      session.sendToolResponse({
        functionResponses: [{
          name: 'render_diagram',
          id: call.id,
          response: { result: 'Diagram rendered successfully in the Visual Intelligence Hub.' }
        }]
      });
    } else if (call.name === 'store_memory') {
      const { content, category } = call.args as any;
      addLog('tool', 'Storing information to memory', { category });

      const newMemory = {
        id: Date.now().toString(),
        content,
        category: category || 'personal',
        timestamp: Date.now()
      };

      // Load existing, add new, and save
      try {
        const currentMemories = await electronAPI.loadMemories();
        const updated = [newMemory, ...currentMemories];
        await electronAPI.saveMemories(updated);
        onMemoriesUpdated?.(updated);
        session.sendToolResponse({
          functionResponses: [{
            name: 'store_memory',
            id: call.id,
            response: { result: 'Memory stored successfully.' }
          }]
        });
      } catch (err) {
        console.error('Store memory failed:', err);
      }
    } else if (call.name === 'get_memories') {
      addLog('tool', 'Retrieving stored memories');

      try {
        const currentMemories = await electronAPI.loadMemories();
        session.sendToolResponse({
          functionResponses: [{
            name: 'get_memories',
            id: call.id,
            response: { memories: currentMemories }
          }]
        });
      } catch (err) {
        console.error('Get memories failed:', err);
      }
    } else if (call.name === 'send_whatsapp') {
      const { contactName, message } = call.args as any;
      addLog('tool', `🚀 Initiating WhatsApp Automation`, { 
        contact: contactName, 
        messageLength: message.length 
      });
      
      try {
        // Execute the keyboard automation
        addLog('info', `⏳ Opening WhatsApp and simulating keyboard inputs...`);
        const result = await electronAPI.sendWhatsAppKeyboard({ 
          name: contactName, 
          message 
        });
        
        if (result.success) {
          addLog('success', `✅ WhatsApp message sent to ${contactName}`);
          
          // Show PowerShell output in console for debugging
          if (result.output) {
            console.log('[WhatsApp Automation] PowerShell Output:', result.output);
          }
          
          session.sendToolResponse({
            functionResponses: [{
              name: 'send_whatsapp',
              id: call.id,
              response: { 
                result: `Message successfully sent to ${contactName}! The automation sequence completed without errors.`,
                details: result.output || 'Keyboard automation executed',
                method: result.method || 'keyboard_simulation'
              }
            }]
          });
        } else {
          addLog('error', `❌ WhatsApp automation failed: ${result.error || 'Unknown error'}`);
          
          // Show detailed error output
          if (result.stdout || result.stderr) {
            console.error('[WhatsApp Automation] PowerShell STDOUT:', result.stdout);
            console.error('[WhatsApp Automation] PowerShell STDERR:', result.stderr);
          }
          
          session.sendToolResponse({
            functionResponses: [{
              name: 'send_whatsapp',
              id: call.id,
              response: { 
                error: `Failed to send message to ${contactName}. ${result.error || 'Unknown automation error'}. Please make sure WhatsApp Desktop is installed and the contact name matches exactly.`,
                diagnostics: {
                  stdout: result.stdout,
                  stderr: result.stderr
                }
              }
            }]
          });
        }
      } catch (err) {
        console.error('Store memory failed:', err);
      }
    } else if (call.name === 'add_note') {
      const { title, content, category } = call.args as any;
      addLog('tool', `Creating new note: ${title}`);

      try {
        const currentNotes = await electronAPI.loadNotes() || [];
        const now = Date.now();
        const newNote = {
          id: now.toString(),
          title: title || 'Untitled Note',
          // Store note body as markdown internally.
          content: typeof content === 'string' ? content : String(content || ''),
          category: category || 'General',
          tags: category ? [String(category)] : [],
          date: new Date(now).toLocaleDateString(),
          createdAt: now,
          updatedAt: now,
          timestamp: now,
        };
        
        const updatedNotes = [newNote, ...currentNotes];
        await electronAPI.saveNotes(updatedNotes);
        
        // Update UI immediately
        onNotesUpdated?.(updatedNotes);

        logToolRunner('toolCall:add_note:completed', {
          id: call.id,
          noteCount: updatedNotes.length,
        });
        
        session.sendToolResponse({
          functionResponses: [{
            name: 'add_note',
            id: call.id,
            response: { result: 'Note created successfully.' }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to create note: ${err.message}`);
        logToolRunner('toolCall:add_note:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
      }
    } else if (call.name === 'add_task') {
      const { text, priority, category, description, dueAt, reminder, tags } = call.args as any;
      addLog('tool', `Adding new task`, { priority });

      try {
        const currentTasks = await electronAPI.loadTasks() || [];
        const newTask = {
          id: Date.now().toString(),
          text,
          completed: false,
          priority: priority || 'medium',
          category: category || 'General',
          description: description || '',
          dueAt: typeof dueAt === 'string' ? dueAt : null,
          reminder: reminder === true,
          tags: Array.isArray(tags) ? tags : [],
          timestamp: Date.now(),
        };
        
        // Add to top
        const updatedTasks = [newTask, ...currentTasks];
        await electronAPI.saveTasks(updatedTasks);

        if (newTask.reminder && newTask.dueAt) {
          try {
            await electronAPI.scheduleTaskReminder({ task: newTask });
          } catch (scheduleError: any) {
            addLog('warning', `Task created, but reminder scheduling failed: ${scheduleError?.message || 'Unknown error'}`);
          }
        }
        
        // Update UI immediately
        onTasksUpdated?.(updatedTasks);

        logToolRunner('toolCall:add_task:completed', {
          id: call.id,
          taskCount: updatedTasks.length,
          reminderScheduled: Boolean(newTask.reminder && newTask.dueAt),
        });
        
        session.sendToolResponse({
          functionResponses: [{
            name: 'add_task',
            id: call.id,
            response: { result: 'Task added to your list.', task: newTask }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to add task: ${err.message}`);
        logToolRunner('toolCall:add_task:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
      }
    } else if (call.name === 'add_contact') {
      const { name, phone } = call.args as any;
      addLog('tool', `Adding contact`, { name });

      try {
        const currentContacts = await electronAPI.loadContacts() || [];
        const normalizedName = String(name || '').trim();
        const normalizedPhone = String(phone || '').trim();

        if (!normalizedName || !normalizedPhone) {
          session.sendToolResponse({
            functionResponses: [{
              name: 'add_contact',
              id: call.id,
              response: { error: 'Both name and phone are required.' }
            }]
          });
          continue;
        }

        const existing = currentContacts.find((c: any) =>
          c.name.toLowerCase() === normalizedName.toLowerCase()
        );

        let updatedContacts;
        if (existing) {
          updatedContacts = currentContacts.map((c: any) =>
            c.id === existing.id
              ? { ...c, phone: normalizedPhone, timestamp: Date.now() }
              : c
          );
        } else {
          const newContact = {
            id: Date.now().toString(),
            name: normalizedName,
            phone: normalizedPhone,
            timestamp: Date.now(),
          };
          updatedContacts = [newContact, ...currentContacts];
        }

        await electronAPI.saveContacts(updatedContacts);
        onContactsUpdated?.(updatedContacts);

        logToolRunner('toolCall:add_contact:completed', {
          id: call.id,
          contactCount: updatedContacts.length,
          updatedExisting: Boolean(existing),
        });

        session.sendToolResponse({
          functionResponses: [{
            name: 'add_contact',
            id: call.id,
            response: {
              result: existing
                ? `Contact ${normalizedName} already existed, phone was updated.`
                : `Contact ${normalizedName} added successfully.`,
              contacts: updatedContacts,
            }
          }]
        });
      } catch (err: any) {
        logToolRunner('toolCall:add_contact:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
        session.sendToolResponse({
          functionResponses: [{
            name: 'add_contact',
            id: call.id,
            response: { error: err?.message || 'Failed to add contact.' }
          }]
        });
      }
    } else if (call.name === 'read_contacts') {
      const { query } = call.args as any;
      addLog('tool', `Reading contacts`, { query: query || 'All' });

      try {
        const contacts = await electronAPI.loadContacts() || [];
        const filtered = query
          ? contacts.filter((c: any) => {
              const q = String(query).toLowerCase();
              return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
            })
          : contacts;

        logToolRunner('toolCall:read_contacts:completed', {
          id: call.id,
          total: contacts.length,
          returned: filtered.length,
          hasQuery: Boolean(query),
        });

        session.sendToolResponse({
          functionResponses: [{
            name: 'read_contacts',
            id: call.id,
            response: {
              count: filtered.length,
              contacts: filtered,
            }
          }]
        });
      } catch (err: any) {
        logToolRunner('toolCall:read_contacts:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
        session.sendToolResponse({
          functionResponses: [{
            name: 'read_contacts',
            id: call.id,
            response: { error: err?.message || 'Failed to read contacts.' }
          }]
        });
      }
    } else if (call.name === 'read_notes') {
      const { query } = call.args as any;
      addLog('tool', `Reading notes`, { query: query || 'All' });

      try {
        const notes = await electronAPI.loadNotes() || [];
        
        let filteredNotes = notes;
        if (query) {
          const lowerQ = query.toLowerCase();
          filteredNotes = notes.filter((n: any) => 
            String(n.title || '').toLowerCase().includes(lowerQ) || 
            String(n.content || '').toLowerCase().includes(lowerQ) ||
            String(n.category || '').toLowerCase().includes(lowerQ) ||
            (Array.isArray(n.tags) && n.tags.some((tag: string) => tag.toLowerCase().includes(lowerQ)))
          );
        }

        // Limit to recent 10 if no query to save tokens
        const finalNotes = query ? filteredNotes : filteredNotes.slice(0, 10);

        logToolRunner('toolCall:read_notes:completed', {
          id: call.id,
          total: notes.length,
          returned: finalNotes.length,
          hasQuery: Boolean(query),
        });

        session.sendToolResponse({
          functionResponses: [{
            name: 'read_notes',
            id: call.id,
            response: { 
              count: finalNotes.length,
              notes: finalNotes 
            }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to read notes: ${err.message}`);
        logToolRunner('toolCall:read_notes:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
      }
    } else if (call.name === 'read_tasks') {
      const { filter } = call.args as any;
      addLog('tool', `Reading tasks`, { filter: filter || 'pending' });

      try {
        const tasks = await electronAPI.loadTasks() || [];
        
        let filteredTasks = tasks;
        if (filter === 'pending') {
          filteredTasks = tasks.filter((t: any) => !t.completed);
        } else if (filter === 'completed') {
          filteredTasks = tasks.filter((t: any) => t.completed);
        } else if (filter === 'high') {
          filteredTasks = tasks.filter((t: any) => !t.completed && t.priority === 'high');
        }

        logToolRunner('toolCall:read_tasks:completed', {
          id: call.id,
          total: tasks.length,
          returned: filteredTasks.length,
          filter: filter || 'all',
        });

        session.sendToolResponse({
          functionResponses: [{
            name: 'read_tasks',
            id: call.id,
            response: { 
              filter: filter || 'all',
              count: filteredTasks.length,
              tasks: filteredTasks 
            }
          }]
        });
      } catch (err: any) {
        addLog('error', `Failed to read tasks: ${err.message}`);
        logToolRunner('toolCall:read_tasks:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
      }
    } else if (call.name === 'read_attached_files') {
      addLog('tool', `📎 Reading attached files`);
      
      try {
        // Get attached files from context (passed via callback)
        const attachedFiles = context.getAttachedFiles ? context.getAttachedFiles() : [];
        logToolRunner('toolCall:read_attached_files:discovered', {
          id: call.id,
          fileCount: attachedFiles.length,
        });
        
        if (attachedFiles.length === 0) {
          addLog('info', 'No files currently attached');
          session.sendToolResponse({
            functionResponses: [{
              name: 'read_attached_files',
              id: call.id,
              response: { 
                result: 'No files are currently attached. User needs to click "Add Files" button to attach files first.',
                fileCount: 0
              }
            }]
          });
        } else {
          addLog('success', `Found ${attachedFiles.length} attached file(s). Reading content...`);
          
          // Read content for each file using Main Process (for PDFs/Docs) or Base64 decode (fallback)
          const filesContent = await Promise.all(attachedFiles.map(async (file: any, idx: number) => {
            let content = "";
            
            if (file.path) {
               // Use the new main process handler which supports PDF, Docx, Text
               try {
                   const readResult = await electronAPI.readFileContent({ path: file.path });
                   content = readResult.content || `Error: ${readResult.error}` || "Unable to read content";
               } catch (e: any) {
                   content = `Error reading file: ${e.message}`;
               }
            } else {
               // Fallback for drag-and-drop or missing path (try to decode base64 if text)
               // Note: 'data' is base64 encoded content
               if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('xml')) {
                   try {
                       content = atob(file.data); 
                   } catch (e) { content = "Unable to decode text content from memory."; }
               } else {
                   content = "[Binary/Image File - Content not available via text tool. Please analyze the visual attachment directly.]";
               }
            }

            return {
              index: idx + 1,
              name: file.name,
              type: file.mimeType,
              // Limit content size per file to avoid context overflow (e.g. 30k chars)
              content: content.length > 30000 ? content.substring(0, 30000) + "...[TRUNCATED]" : content
            };
          }));
          
          session.sendToolResponse({
            functionResponses: [{
              name: 'read_attached_files',
              id: call.id,
              response: { 
                result: `Successfully read ${attachedFiles.length} attached file(s). Use this content to answer the user's request.`,
                files: filesContent
              }
            }]
          });

          logToolRunner('toolCall:read_attached_files:completed', {
            id: call.id,
            fileCount: attachedFiles.length,
          });
        }
      } catch (err: any) {
        addLog('error', `Failed to read attached files: ${err.message}`);
        logToolRunner('toolCall:read_attached_files:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
        session.sendToolResponse({
          functionResponses: [{
            name: 'read_attached_files',
            id: call.id,
            response: { 
              error: `Failed to access attached files: ${err.message}`
            }
          }]
        });
      }
    } else if (call.name === 'semantic_workspace_search') {
      const { query, maxResults, maxFiles } = call.args as any;
      addLog('tool', 'Running semantic workspace search', {
        query,
        maxResults,
      });

      try {
        const result = await electronAPI.semanticWorkspaceSearch({
          query,
          maxResults,
          maxFiles,
        });

        if (!result?.success) {
          logToolRunner('toolCall:semantic_workspace_search:failed', {
            id: call.id,
            error: result?.error || 'Unknown error',
          });

          session.sendToolResponse({
            functionResponses: [{
              name: 'semantic_workspace_search',
              id: call.id,
              response: {
                error: result?.error || 'Semantic workspace search failed.',
                details: result?.details,
              }
            }]
          });
          continue;
        }

        logToolRunner('toolCall:semantic_workspace_search:completed', {
          id: call.id,
          searchedFiles: result.searchedFiles,
          matchedFiles: result.matchedFiles,
          returned: Array.isArray(result.results) ? result.results.length : 0,
        });

        session.sendToolResponse({
          functionResponses: [{
            name: 'semantic_workspace_search',
            id: call.id,
            response: result,
          }]
        });
      } catch (err: any) {
        addLog('error', `Semantic workspace search failed: ${err.message}`);
        logToolRunner('toolCall:semantic_workspace_search:failed_exception', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
        session.sendToolResponse({
          functionResponses: [{
            name: 'semantic_workspace_search',
            id: call.id,
            response: { error: err?.message || 'Semantic workspace search failed.' }
          }]
        });
      }
    } else if (call.name === 'turn_off') {
      addLog('warning', 'AI initiating self-shutdown sequence...');
      // Small delay to let the AI finish its 'Goodbye' if it's speaking
      setTimeout(() => {
        cleanup();
      }, 2000);
      
      session.sendToolResponse({
        functionResponses: [{
          name: 'turn_off',
          id: call.id,
          response: { success: true, message: 'Shutdown initiated.' }
        }]
      });
    } else if (call.name === 'execute_shell_command') {
      const { command } = call.args as any;
      addLog('tool', 'Executing system command', { command });

      const result = await electronAPI.executeSystemCommand({ command });
      session.sendToolResponse({
        functionResponses: [{
          name: 'execute_shell_command',
          id: call.id,
          response: { result }
        }]
      });
    } else if (call.name === 'manage_files') {
      const { operation, path, content } = call.args as any;
      addLog('tool', `File System Operation: ${operation}`, { path });

      try {
        const result = await electronAPI.systemFsOp({ operation, path, content });
        session.sendToolResponse({
          functionResponses: [{
            name: 'manage_files',
            id: call.id,
            response: { result }
          }]
        });
      } catch (err: any) {
        session.sendToolResponse({
          functionResponses: [{
            name: 'manage_files',
            id: call.id,
            response: { error: err.message }
          }]
        });
      }
    } else if (call.name === 'open_item') {
      const { target } = call.args as any;
      addLog('tool', `Opening System Item`, { target });

      await electronAPI.openSystemItem({ target });
      session.sendToolResponse({
        functionResponses: [{
          name: 'open_item',
          id: call.id,
          response: { result: 'Opened successfully' }
        }]
      });
    } else if (call.name === 'update_dashboard') {
      const { headlines, weather } = call.args as any;
      addLog('success', 'AI updated the dashboard with new headlines & weather');

      logToolRunner('toolCall:update_dashboard:completed', {
        id: call.id,
        headlineCount: Array.isArray(headlines) ? headlines.length : 0,
        weatherKeys:
          weather && typeof weather === 'object' ? Object.keys(weather as Record<string, unknown>) : [],
      });
      
      // Notify the app through a callback
      onDashboardUpdated?.({ headlines, weather });


      session.sendToolResponse({
        functionResponses: [{
          name: 'update_dashboard',
          id: call.id,
          response: { result: 'Dashboard updated successfully.' }
        }]
      });
    } else if (call.name === 'get_clipboard') {
      addLog('tool', 'Reading clipboard contents');
      const result = await electronAPI.readClipboard();
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_clipboard',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'set_clipboard') {
      const { text, html } = call.args as any;
      addLog('tool', 'Writing to clipboard', { textLength: text?.length });
      const result = await electronAPI.writeClipboard({ text, html });
      session.sendToolResponse({
        functionResponses: [{
          name: 'set_clipboard',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'take_screenshot') {
      addLog('tool', 'Capturing screenshot');
      const result = await electronAPI.takeScreenshot();
      if (result.success) {
        addLog('success', 'Screenshot captured successfully');
        onImageGenerated?.(`data:${result.mimeType};base64,${result.data}`);
      }
      session.sendToolResponse({
        functionResponses: [{
          name: 'take_screenshot',
          id: call.id,
          response: result.success 
            ? { result: 'Screenshot captured. I can now see your screen.', imageData: result.data }
            : { error: result.error }
        }]
      });
    } else if (call.name === 'send_notification') {
      const { title, body } = call.args as any;
      addLog('tool', 'Sending system notification', { title });
      const result = await electronAPI.sendNotification({ title, body });
      session.sendToolResponse({
        functionResponses: [{
          name: 'send_notification',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'http_request') {
      const { url, method, headers, body } = call.args as any;
      addLog('tool', `Making HTTP ${method || 'GET'} request`, { url });

      const result = await electronAPI.httpFetch({ url, method, headers, body });
      session.sendToolResponse({
        functionResponses: [{
          name: 'http_request',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'get_system_info') {
      addLog('tool', 'Fetching detailed system information');
      const result = await electronAPI.getDetailedSystemInfo();
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_system_info',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'get_processes') {
      addLog('tool', 'Getting running processes');
      const result = await electronAPI.getProcesses();
      session.sendToolResponse({
        functionResponses: [{
          name: 'get_processes',
          id: call.id,
          response: { processes: result }
        }]
      });
    } else if (call.name === 'kill_process') {
      const { pid } = call.args as any;
      addLog('warning', `Terminating process PID: ${pid}`);

      const result = await electronAPI.killProcess({ pid });
      session.sendToolResponse({
        functionResponses: [{
          name: 'kill_process',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'window_control') {
      const { action } = call.args as any;
      addLog('tool', `Window control: ${action}`);
      const result = await electronAPI.windowControl({ action });
      session.sendToolResponse({
        functionResponses: [{
          name: 'window_control',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'keyboard_press') {
      const { key } = call.args as any;
      addLog('tool', `Pressing keyboard key: ${key}`);
      const result = await electronAPI.keyboardPress({ key });
      session.sendToolResponse({
        functionResponses: [{
          name: 'keyboard_press',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'keyboard_type') {
      const { text, pressEnter } = call.args as any;
      addLog('tool', `Typing text${pressEnter ? ' and pressing Enter' : ''}`, { textLength: text?.length });
      const result = await electronAPI.keyboardType({ text, pressEnter: pressEnter || false });
      session.sendToolResponse({
        functionResponses: [{
          name: 'keyboard_type',
          id: call.id,
          response: result
        }]
      });
    } else if (call.name === 'play_youtube_video') {
      const { query } = call.args as any;
      addLog('tool', `Searching YouTube for: ${query}`);
      
      try {
        // We'll use a simple search scraping or a specialized API if available
        // For now, let's use a very reliable way: search via http request to a search provider
        // or just send the query to the UI to handle the search.
        // I prefer handling the search here to be more "agentic".
        
        // Scraping YouTube search result for a video ID
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await electronAPI.httpFetch({ url: searchUrl });
        
        if (response.success) {
          // Find the first video ID in the HTML response
          // A simple regex approach for YouTube video IDs
          const matches = response.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
          if (matches && matches[1]) {
            const videoId = matches[1];
            addLog('success', `Found video. Playing now...`);
            onYouTubePlay?.(videoId);

            logToolRunner('toolCall:play_youtube_video:completed', {
              id: call.id,
              videoId,
            });
            
            session.sendToolResponse({
              functionResponses: [{
                name: 'play_youtube_video',
                id: call.id,
                response: { result: 'Video found and playing in the app player.', videoId }
              }]
            });
          } else {
            throw new Error('Could not find a valid video in search results.');
          }
        } else {
          throw new Error('Failed to search YouTube.');
        }
      } catch (err: any) {
        addLog('error', `YouTube search failed: ${err.message}`);
        logToolRunner('toolCall:play_youtube_video:failed', {
          id: call.id,
          error: err?.message || 'Unknown error',
        });
        session.sendToolResponse({
          functionResponses: [{
            name: 'play_youtube_video',
            id: call.id,
            response: { error: err.message }
          }]
        });
      }
    }

    logToolRunner('toolCall:end', {
      name: call.name,
      id: call.id,
      durationMs: Date.now() - startedAt,
    });
  }
};