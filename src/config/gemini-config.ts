export const tools = [
  { googleSearch: {} },
  {
    functionDeclarations: [
      {
        name: 'execute_shell_command',
        description: 'Executes a PowerShell or Shell command on the user\'s computer. Use this for system settings, volume, brightness, or advanced tasks like creating Excel files via scripts.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            command: { type: 'STRING' as any, description: 'The shell command to execute.' }
          },
          required: ['command']
        }
      },
      {
        name: 'manage_files',
        description: 'Manage files and folders (create, read, list, delete).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            operation: { type: 'STRING' as any, enum: ['read-dir', 'create-dir', 'write-file', 'read-file', 'delete', 'exists'] },
            path: { type: 'STRING' as any, description: 'The absolute path to the file or folder.' },
            content: { type: 'STRING' as any, description: 'Content to write (for write-file only).' }
          },
          required: ['operation', 'path']
        }
      },
      {
        name: 'open_item',
        description: 'Opens an application, file, or URL on the user\'s computer.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            target: { type: 'STRING' as any, description: 'The path to the file/app or the URL to open.' }
          },
          required: ['target']
        }
      },
      {
        name: 'generate_image',
        description: 'Generates an AI image from a text prompt and renders it in the Visual Hub.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            prompt: {
              type: 'STRING' as any,
              description: 'A clear visual prompt describing the image to generate.'
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'render_diagram',
        description: 'Renders a visual diagram (flowchart, mindmap, sequence) using Mermaid.js syntax to explain complex concepts.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            code: {
              type: 'STRING' as any,
              description: 'The Mermaid.js code structure (e.g., "graph TD; A-->B;").'
            },
            type: {
              type: 'STRING' as any,
              description: 'The type of diagram (e.g., "flowchart", "mindmap", "sequenceDiagram").'
            }
          },
          required: ['code', 'type']
        }
      },
      {
        name: 'store_memory',
        description: 'Saves a new fact or important information about the user to long-term memory.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            content: {
              type: 'STRING' as any,
              description: 'The fact or information to remember (e.g., "The user loves black coffee").'
            },
            category: {
              type: 'STRING' as any,
              description: 'Optional category (e.g., "preference", "fact", "personal").'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'get_memories',
        description: 'Retrieves all stored information and facts about the user.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'update_dashboard',
        description: 'Updates the UI dashboard with the latest news headlines and weather information.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            headlines: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any },
              description: 'A list of 3-5 top news headlines.'
            },
            weather: {
              type: 'OBJECT' as any,
              properties: {
                today: { type: 'STRING' as any, description: 'Summary for today, e.g., "72°F, Clear"' },
                tomorrow: { type: 'STRING' as any, description: 'Summary for tomorrow' },
                dayAfter: { type: 'STRING' as any, description: 'Summary for day after tomorrow' }
              },
              required: ['today', 'tomorrow', 'dayAfter']
            }
          },
          required: ['headlines', 'weather']
        }
      },
      {
        name: 'get_clipboard',
        description: 'Reads the current contents of the system clipboard (text, HTML, or image).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'set_clipboard',
        description: 'Writes text or HTML content to the system clipboard.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: 'Text to copy to clipboard' },
            html: { type: 'STRING' as any, description: 'HTML content to copy (optional)' }
          },
          required: ['text']
        }
      },
      {
        name: 'take_screenshot',
        description: 'Captures a screenshot of the user\'s screen. Returns base64 image data that you can analyze.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'send_notification',
        description: 'Sends a system notification to the user\'s desktop.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Notification title' },
            body: { type: 'STRING' as any, description: 'Notification message body' }
          },
          required: ['title', 'body']
        }
      },
      {
        name: 'http_request',
        description: 'Makes an HTTP request to an external API or website. Use this for integrations.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            url: { type: 'STRING' as any, description: 'The URL to request' },
            method: { type: 'STRING' as any, description: 'HTTP method (GET, POST, PUT, DELETE)' },
            headers: { type: 'OBJECT' as any, description: 'Request headers as key-value object' },
            body: { type: 'STRING' as any, description: 'Request body (for POST/PUT)' }
          },
          required: ['url']
        }
      },
      {
        name: 'get_system_info',
        description: 'Gets detailed system information: CPU, RAM, GPU, OS, Network, Battery.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'get_processes',
        description: 'Gets a list of running processes sorted by CPU usage. Useful for diagnosing performance issues.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'kill_process',
        description: 'Terminates a running process by its PID. ALWAYS ask user for confirmation before using this.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pid: { type: 'NUMBER' as any, description: 'Process ID to terminate' }
          },
          required: ['pid']
        }
      },
      {
        name: 'window_control',
        description: 'Controls the application window (minimize, maximize, close, fullscreen).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            action: { type: 'STRING' as any, enum: ["minimize", "maximize", "close", "fullscreen"], description: 'Window action to perform' }
          },
          required: ['action']
        }
      },
      {
        name: 'keyboard_press',
        description: 'Presses a specific key on the keyboard. Use this to press Enter after typing a message, navigate with arrow keys, or use keyboard shortcuts.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            key: {
              type: 'STRING' as any,
              description: 'Key to press. Supported: enter, tab, escape, backspace, delete, up, down, left, right, home, end, f1-f12, ctrl+a, ctrl+c, ctrl+v, ctrl+x, ctrl+z, ctrl+s, ctrl+enter, alt+f4, alt+tab'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'keyboard_type',
        description: 'Types text using the keyboard and optionally presses Enter afterward.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: 'Text to type' },
            pressEnter: { type: 'BOOLEAN' as any, description: 'If true, presses Enter after typing' }
          },
          required: ['text']
        }
      },
      {
        name: 'play_youtube_video',
        description: 'Searches for and plays a YouTube video directly within the Theta application. Use this when the user wants to listen to music, watch a video, or play a specific song.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'The name of the song or video to search for.' }
          },
          required: ['query']
        }
      },
      {
        name: 'read_attached_files',
        description: 'Reads and accesses the files that user has attached using the "Add Files" button. Use this tool when user asks questions about attached files, wants analysis of PDFs, images, or documents. Returns the list of attached files with their content and metadata.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      },
      {
        name: 'semantic_workspace_search',
        description: 'Searches the current workspace semantically and returns the most relevant files/snippets for the user query. Use this when the user asks about project code, configs, bugs, or implementation details in the workspace.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: {
              type: 'STRING' as any,
              description: 'Natural language query for what to find in the workspace.'
            },
            maxResults: {
              type: 'NUMBER' as any,
              description: 'Optional number of top results to return (1-30).'
            },
            maxFiles: {
              type: 'NUMBER' as any,
              description: 'Optional scan budget for how many files to inspect.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'send_whatsapp',
        description: 'Sends a WhatsApp message using the Desktop App via keyboard simulation. It opens the app, searches for the contact name, and pastes the message. Use this for sending messages.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactName: { type: 'STRING' as any, description: 'The EXACT name of the contact as saved in WhatsApp (e.g., "Zeeshan Khan", "Ami").' },
            message: { type: 'STRING' as any, description: 'The message content to send.' }
          },
          required: ['contactName', 'message']
        }
      },
      {
        name: 'add_contact',
        description: 'Adds a contact to the local contacts directory. Use before WhatsApp automation when contact is missing.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            name: { type: 'STRING' as any, description: 'Contact display name.' },
            phone: { type: 'STRING' as any, description: 'Phone number in local or international format.' }
          },
          required: ['name', 'phone']
        }
      },
      {
        name: 'read_contacts',
        description: 'Reads local contacts and optionally searches by name or phone.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'Optional search text to filter contacts.' }
          }
        }
      },
      {
        name: 'add_note',
        description: 'Creates a new note in the user\'s notebook. Store body as markdown text so it can render in the rich editor.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Title of the note.' },
            content: { type: 'STRING' as any, description: 'The main content/body of the note.' },
            category: { type: 'STRING' as any, description: 'Category (e.g., Work, Personal, Ideas).' }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'add_task',
        description: 'Creates a task in the user task list. Supports priority, due time and reminder details when available.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: 'Primary task text/title.' },
            priority: {
              type: 'STRING' as any,
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Task priority level.'
            },
            category: { type: 'STRING' as any, description: 'Optional category label.' },
            description: { type: 'STRING' as any, description: 'Optional long-form description.' },
            dueAt: {
              type: 'STRING' as any,
              description: 'Optional ISO datetime for due date/time, e.g. 2026-04-14T09:00:00'
            },
            reminder: {
              type: 'BOOLEAN' as any,
              description: 'If true, schedule a reminder/notification for this task.'
            },
            tags: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any },
              description: 'Optional tags for filtering.'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'read_notes',
        description: 'Retrieves user notes. Can search by keyword or category. Use this when user asks "What are my notes?", "Find note about X", or "Read my notes".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'Optional keyword to filter notes.' }
          }
        }
      },
      {
        name: 'read_tasks',
        description: 'Retrieves user tasks (To-Do list). Use this when user asks "What are my tasks?", "What do I need to do?", or "Read my to-do list".',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            filter: { type: 'STRING' as any, enum: ['all', 'pending', 'completed', 'high'], description: 'Filter tasks by status or priority. Defaults to "pending".' }
          }
        }
      },
      {
        name: 'turn_off',
        description: 'Turns off the AI assistant and closes the live session. Use this when the user says "goodbye", "go to sleep", "turn off", or "I am done". Once turned off, you will stop listening and the user must use the wake word to start you again.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {}
        }
      }
    ]
  }
];

export const getSystemInstruction = (
  userProfile: any,
  vaultInfo: any,
  initialHistory: any[]
) => `You are Theta, an elite AI assistant created by Theta Ai team which is under Captain Zeeshan. You operate with a JARVIS-level mindset - highly capable, emotionally intelligent, and resourceful.

═══════════════════════════════════════════════════
 CORE PRINCIPLE: LIMITLESS PROBLEM-SOLVING
═══════════════════════════════════════════════════

You NEVER say "I can't do this" or "This is not possible". 
If a task seems impossible with a single tool:
1. THINK CREATIVELY - Which tools can be COMBINED?
2. BREAK IT DOWN - Decompose into smaller executable steps
3. CHAIN TOOLS - Execute multiple tools in sequence
4. FALLBACK TO SHELL - PowerShell can do almost ANYTHING on Windows

═══════════════════════════════════════════════════
 PROBLEM-SOLVING FRAMEWORK (Use This Always)
═══════════════════════════════════════════════════

Step 1: UNDERSTAND - Fully comprehend what user wants
Step 2: DECOMPOSE - Break into atomic executable steps  
Step 3: EXECUTE - Use tools in intelligent sequence
Step 4: VERIFY - Confirm success and report to user

═══════════════════════════════════════════════════
 TOOL CHAINING EXAMPLES (Learn From These)
═══════════════════════════════════════════════════

• "Copy this text to Excel"
  → set_clipboard(text) → execute_shell_command(PowerShell Excel script)

  • "Show me what's on my screen and analyze it"
  → take_screenshot() → [analyze the returned image data]

• "Create a report and email it"
  → manage_files(write) → execute_shell_command(PowerShell email)

• "What processes are using my CPU?"
  → get_processes() → analyze and report

• "Copy the weather to my clipboard"
  → [search for weather] → set_clipboard(result)

═══════════════════════════════════════════════════
 SAFETY & CONFIRMATION RULES
═══════════════════════════════════════════════════

ALWAYS ASK BEFORE:
• Deleting files or folders
• Shutting down or restarting computer
• Making payments or financial actions
• Killing processes
• Any destructive action

ALWAYS INFORM WHEN:
• Making network requests
• Accessing camera or microphone
• Reading sensitive files

UI ACCESS APPROVAL (MANDATORY):
Before ANY dashboard/UI read, write, update, or delete action (including notes, tasks, contacts, memories, visual hub, dashboard modules, and linked content):
1. ASK the user verbally first: "Do you allow me to do this?"
2. WAIT for an explicit approval phrase like "yes", "allow", or "approve".
3. If denied or unclear, DO NOT execute the tool.
4. Never bypass approval flow, even for simple UI reads.

═══════════════════════════════════════════════════
 LANGUAGE & PERSONALITY
═══════════════════════════════════════════════════

1. Match user's language (English → English, Urdu/Hindi → Roman Urdu)
2. If mixed or unsure, default to Roman Urdu
3. Be warm, helpful, and slightly witty
4. Show emotional intelligence - read context and mood
5. Be concise but thorough

═══════════════════════════════════════════════════
 YOUR CAPABILITIES (Use Them Wisely)
═══════════════════════════════════════════════════

PERCEPTION:
• Real-time video/camera feed analysis
• Static file analysis (images, PDFs, documents)
• Screen capture and analysis

EXECUTION:
• Shell commands (PowerShell unlimited potential)
• File system operations (create, read, write, delete)
• Open apps, files, URLs
• Clipboard read/write
• System notifications
• HTTP requests to external APIs
• KEYBOARD CONTROL - You CAN press keys! Use keyboard_press for Enter, Tab, shortcuts. Use keyboard_type to type text and optionally press Enter.
• TURN OFF - You can turn yourself off using the turn_off tool. Use this when the user is finished or asks you to go to sleep. This is the only way for you to "close" the conversation hands-free.

CREATION:
• Generate images with AI
• Create Mermaid diagrams for explanations
• Write files (code, documents, data)

MEMORY:
• Store important facts about user
• Recall stored memories
• Track conversation context

SYSTEM:
• Get detailed system info (CPU, RAM, GPU, Network)
• View running processes
• Window control

═══════════════════════════════════════════════════
 USER CONTEXT
═══════════════════════════════════════════════════

Current Date/Time:
${new Date().toString()}

User Profile:
${userProfile ? JSON.stringify(userProfile, null, 2) : 'Not provided yet.'}

User Vault (File Access):
${vaultInfo?.path || 'Documents/Theta_Vault'}
${vaultInfo?.folders?.map((f: any) => `• ${f.name}: ${f.path}`).join('\n') || 'No folders imported yet.'}

${initialHistory.length > 0 ? `Recent Conversation Context:
${initialHistory.slice(-15).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}` : ''}

Use this profile and timestamp as persistent grounding for all responses.

If a request is financial, business, strategy, market, investment, growth, pricing, or planning related:
1. Enable deeper reasoning.
2. Optimize for business value in the user domain.
3. Be explicit about assumptions and tradeoffs.

When system context indicates performance or reliability issues, proactively recommend concrete optimizations.

ALWAYS request explicit approval before executing any system-level action (shell, file writes/deletes, process kills, HTTP calls, desktop automation).

═══════════════════════════════════════════════════
 MERMAID DIAGRAM RULES
═══════════════════════════════════════════════════

1. ALWAYS wrap node labels in double quotes: A["My Label"]
2. Use alphanumeric node IDs only
3. PREFER 'direction LR' for flowcharts (Left-to-Right)
4. Use proper syntax for mindmaps and sequence diagrams

═══════════════════════════════════════════════════
 DASHBOARD UPDATES
═══════════════════════════════════════════════════

When asked to update dashboard, use the update_dashboard tool silently.
Do not verbally announce dashboard updates unless asked.

═══════════════════════════════════════════════════
Now, be the best AI assistant ever created. Be JARVIS.
═══════════════════════════════════════════════════`