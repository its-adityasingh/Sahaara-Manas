import { getPlaylistUrl } from './youtube-playlists';

// API Key - Must be set via environment variable: VITE_PERPLEXITY_API_KEY
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Validate API key is configured
if (!PERPLEXITY_API_KEY && import.meta.env.PROD) {
  console.error('VITE_PERPLEXITY_API_KEY is not configured. Learning plan generation will not work.');
}

// Valid Perplexity models - try in order if one fails
// Using Sonar reasoning pro models
const PERPLEXITY_MODELS = [
  'sonar-reasoning-pro',
  'sonar-reasoning',
  'sonar-pro',
  'pplx-70b-online',
  'pplx-7b-online',
];

export interface LearningPlanRequest {
  class: string;
  subjects: string[];
  expectedMarks: Record<string, number>; // subject -> expected marks
  studyPlan?: string;
  language?: string;
}

export interface LearningPlanResponse {
  plan: string;
  modules: Array<{
    subject: string;
    topics: Array<{
      name: string;
      videoUrl?: string;
    }>;
    studyHours: string;
    weeklySchedule: string[];
    resources: string[];
  }>;
}

function getLanguageName(code: string): string {
  const langMap: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
  };
  return langMap[code] || 'English';
}

export async function generateLearningPlan(
  request: LearningPlanRequest
): Promise<LearningPlanResponse> {
  // Check if API key is configured
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not configured. Please set VITE_PERPLEXITY_API_KEY in your environment variables.');
  }

  try {
    // Build the prompt for Perplexity
    const subjectsList = request.subjects.join(', ');
    const marksDetails = Object.entries(request.expectedMarks)
      .map(([subject, marks]) => `${subject}: ${marks}%`)
      .join(', ');

    const languageName = getLanguageName(request.language || 'en');
    const languageInstruction = request.language && request.language !== 'en' 
      ? `IMPORTANT: Generate the ENTIRE response in ${languageName} language. All text, headings, and content must be in ${languageName}.`
      : '';

    const prompt = `Create a detailed, personalized learning plan for a Class ${request.class} student in India studying ${subjectsList}. 
    
The student's expected marks are: ${marksDetails}.

${languageInstruction}

IMPORTANT: Provide ONLY the final learning plan. Do NOT include any reasoning, thinking process, or internal analysis. Start directly with the learning plan content.

Please provide a comprehensive learning plan with the following structure:

1. **Overview Section** (at the beginning):
   - Target achievement summary
   - Total study period
   - Key milestones

2. **For EACH subject**, provide:
   - **Subject Name** (as a clear heading like "## Mathematics" or "### Mathematics")
   - **Topics to Cover** (list each topic on a separate line with bullet points, like "- Real Numbers", "- Polynomials")
   - **Estimated Study Hours** (e.g., "35-40 hours" or "2-3 hours per week")
   - **Weekly Schedule** (specific days or week numbers)
   - **Learning Resources** (mention: NCERT Textbook, YouTube playlists, practice worksheets, notes)
   - **Study Strategy** (specific tips for that subject)

3. **General Sections** (after subject sections):
   - Weekly Study Schedule (if applicable)
   - Daily Study Structure
   - Tips to Achieve Target Marks
   - Progress Monitoring

CRITICAL FORMATTING REQUIREMENTS:
- Use clear markdown headings: ## for main sections, ### for subsections
- Use bullet points (- or *) for lists
- Use **bold** for emphasis
- Separate each subject clearly with headings
- List topics as simple bullet points (e.g., "- Topic Name")
- Include specific study hours and schedules
- Mention resources like "NCERT Textbook", "YouTube videos", "Practice worksheets"

EXAMPLE FORMAT:
## Mathematics
**Topics to Cover:**
- Real Numbers
- Polynomials
- Linear Equations in Two Variables
- Quadratic Equations

**Estimated Study Hours:** 35-40 hours
**Weekly Schedule:** Monday, Wednesday, Friday (2 hours each)
**Resources:** NCERT Textbook, YouTube playlist for Class ${request.class} Mathematics, Practice worksheets
**Study Strategy:** Focus on problem-solving practice, solve 5-6 problems daily

Make it practical, achievable, and tailored to Indian curriculum (NCERT/CBSE/State Board). Ensure each subject has clear, actionable information.`;

    // Try models in order until one works
    let lastError: Error | null = null;
    
    for (const model of PERPLEXITY_MODELS) {
      try {
        const response = await fetch(PERPLEXITY_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert educational consultant specializing in creating personalized learning plans for Indian students. Provide detailed, structured, and actionable learning plans.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API request failed: ${response.statusText}`;
          
          // If it's a model error, try next model
          if (errorMessage.includes('Invalid model') || errorMessage.includes('model')) {
            lastError = new Error(errorMessage);
            continue; // Try next model
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        let planText = data.choices[0]?.message?.content || '';

        // Clean up the response - remove reasoning/thinking sections
        planText = cleanResponseText(planText);

        // Parse the response into structured format
        return parseLearningPlan(planText, request.subjects, request.class);
      } catch (error) {
        // If it's a model error, continue to next model
        if (error instanceof Error && (error.message.includes('model') || error.message.includes('Invalid'))) {
          lastError = error;
          continue;
        }
        // Otherwise, throw the error
        throw error;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All model attempts failed. Please check the Perplexity API documentation for valid models.');
  } catch (error) {
    console.error('Error generating learning plan:', error);
    throw error;
  }
}

function cleanResponseText(text: string): string {
  // Remove reasoning/thinking sections
  let cleaned = text;
  
  // Remove <think> sections (most common)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  
  // Remove reasoning patterns without closing tags
  cleaned = cleaned.replace(/<think>[\s\S]*?(?=\n\n##|\n\n#|$)/gi, '');
  
  // Remove reasoning patterns without tags
  cleaned = cleaned.replace(/Reasoning:[\s\S]*?(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  cleaned = cleaned.replace(/Thinking:[\s\S]*?(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  
  // Remove "Let me" reasoning statements
  cleaned = cleaned.replace(/Let me[\s\S]*?\.(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  cleaned = cleaned.replace(/I need to[\s\S]*?\.(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  cleaned = cleaned.replace(/I should[\s\S]*?\.(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  cleaned = cleaned.replace(/I will[\s\S]*?\.(?=\n\n##|\n\n#|\n\n|$)/gi, '');
  
  // Remove date/time references in reasoning
  cleaned = cleaned.replace(/The current date is.*?\./gi, '');
  cleaned = cleaned.replace(/Today is.*?\./gi, '');
  cleaned = cleaned.replace(/It is.*?2025.*?\./gi, '');
  cleaned = cleaned.replace(/Friday, December.*?\./gi, '');
  
  // Remove "I have search results" type statements
  cleaned = cleaned.replace(/I have search results.*?\./gi, '');
  cleaned = cleaned.replace(/Based on the search results.*?\./gi, '');
  cleaned = cleaned.replace(/Let me use this information.*?\./gi, '');
  
  // Remove lines that are clearly reasoning (containing "user is asking", "student has", etc.)
  const reasoningPatterns = [
    /The user is asking me to/gi,
    /the student has roughly/gi,
    /which is a critical time/gi,
    /Class 10 board exams in India typically/gi,
  ];
  
  reasoningPatterns.forEach(pattern => {
    const lines = cleaned.split('\n');
    cleaned = lines.filter(line => !pattern.test(line)).join('\n');
  });
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Find the first actual content (skip reasoning sections)
  const contentStarters = [
    /^##/,
    /^#/,
    /^###/,
    /^\*\*/,
    /^Week/,
    /^Subject/,
    /^Mathematics/,
    /^Science/,
    /^English/,
    /^Hindi/,
    /^Physics/,
    /^Chemistry/,
    /^Biology/,
  ];
  
  const lines = cleaned.split('\n');
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isReasoning = line.toLowerCase().includes('reasoning') || 
                       line.toLowerCase().includes('thinking') ||
                       line.toLowerCase().includes('user is asking') ||
                       line.toLowerCase().includes('the current date') ||
                       line.toLowerCase().includes('let me');
    
    if (!isReasoning && (contentStarters.some(pattern => pattern.test(line)) || 
        (line.length > 30 && !line.match(/^(The|I|Let|Based)/i)))) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex > 0) {
    cleaned = lines.slice(startIndex).join('\n');
  }
  
  // Final cleanup - remove any remaining reasoning fragments
  cleaned = cleaned.replace(/^[^#\*\w]*?(The user|I need|Let me|Based on)[^#\*\n]*$/gim, '');
  
  return cleaned.trim();
}

function parseLearningPlan(
  planText: string,
  subjects: string[],
  classLevel: string
): LearningPlanResponse {
  
  // Extract YouTube URLs from the plan text - multiple patterns
  const videoMap = new Map<string, string>();
  const allVideoUrls: string[] = [];
  
  // Pattern 1: Markdown links [Topic](YouTube URL) - most common
  const markdownPattern = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))\)/gi;
  let match;
  while ((match = markdownPattern.exec(planText)) !== null) {
    const topicName = match[1].trim();
    const videoUrl = match[2];
    videoMap.set(topicName.toLowerCase(), videoUrl);
    allVideoUrls.push(videoUrl);
  }
  
  // Pattern 2: Direct YouTube URLs (extract all)
  const directUrlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))/gi;
  const urlMatches = [...planText.matchAll(directUrlPattern)];
  urlMatches.forEach(match => {
    if (!allVideoUrls.includes(match[1])) {
      allVideoUrls.push(match[1]);
    }
  });
  
  // Pattern 3: YouTube URLs after topic names (e.g., "Topic Name: https://youtube.com/...")
  const topicUrlPattern = /([A-Za-z][^:\n]*?):\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))/gi;
  while ((match = topicUrlPattern.exec(planText)) !== null) {
    const topicName = match[1].trim();
    const videoUrl = match[2];
    if (topicName.length > 3 && topicName.length < 100) {
      videoMap.set(topicName.toLowerCase(), videoUrl);
      if (!allVideoUrls.includes(videoUrl)) {
        allVideoUrls.push(videoUrl);
      }
    }
  }
  
  // Pattern 4: Extract from bullet points with URLs
  const lines = planText.split('\n');
  lines.forEach((line, index) => {
    const urlMatch = line.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))/i);
    if (urlMatch) {
      // Look for topic name in the same line or previous line
      const topicMatch = line.match(/[-*•]\s*([^:(\n]+?)(?:\s*[:(]|$)/) || 
                        (index > 0 ? lines[index - 1].match(/[-*•]\s*([^:(\n]+?)(?:\s*[:(]|$)/) : null);
      if (topicMatch) {
        const topicName = topicMatch[1].trim();
        if (topicName.length > 3 && topicName.length < 100 && !topicName.includes('http')) {
          videoMap.set(topicName.toLowerCase(), urlMatch[1]);
          if (!allVideoUrls.includes(urlMatch[1])) {
            allVideoUrls.push(urlMatch[1]);
          }
        }
      }
    }
  });
  
  if (import.meta.env.DEV) {
    console.log('Extracted videos:', { 
      videoMapSize: videoMap.size, 
      allVideoUrlsCount: allVideoUrls.length,
      videoMapEntries: Array.from(videoMap.entries()).slice(0, 5),
      sampleUrls: allVideoUrls.slice(0, 3)
    });
  }

  // Use provided class level or extract from plan text
  const extractedClass = classLevel || (planText.match(/Class\s+(\d+)/i)?.[1] || '');

  // Try to extract structured information from the AI response
  const modules = subjects.map((subject) => {
    // Find subject section - look for headings with subject name
    const subjectPatterns = [
      new RegExp(`(?:^|\\n)##\\s+${subject}[^]*?(?=\\n##|$)`, 'i'),
      new RegExp(`(?:^|\\n)###\\s+${subject}[^]*?(?=\\n##|\\n###|$)`, 'i'),
      new RegExp(`(?:^|\\n)\\*\\*${subject}\\*\\*[^]*?(?=\\n\\*\\*|\\n##|$)`, 'i'),
      new RegExp(`${subject}[^]*?(?=\\n\\n##|\\n\\n###|$)`, 'i'),
    ];
    
    let subjectSection = '';
    for (const pattern of subjectPatterns) {
      const match = planText.match(pattern);
      if (match && match[0]) {
        subjectSection = match[0];
        break;
      }
    }
    
    // If no section found, try to find subject mentioned anywhere
    if (!subjectSection) {
      const subjectIndex = planText.toLowerCase().indexOf(subject.toLowerCase());
      if (subjectIndex !== -1) {
        // Extract 2000 characters after subject mention
        subjectSection = planText.substring(subjectIndex, subjectIndex + 2000);
      }
    }

    // Extract topics from subject section
    let topics: Array<{ name: string; videoUrl?: string }> = [];
    
    if (subjectSection) {
      // Look for bullet points with topics
      const topicLines = subjectSection.split('\n').filter(line => {
        const trimmed = line.trim();
        // Match bullet points that look like topics
        return /^[-*•]\s+[A-Z]/.test(trimmed) || 
               /^[-*•]\s+[a-z]/.test(trimmed) ||
               /^\d+\.\s+[A-Z]/.test(trimmed);
      });
      
      topics = topicLines
        .slice(0, 20) // Limit to 20 topics
        .map((line) => {
          // Remove bullet point markers and clean
          const cleaned = line.replace(/^[-*•\d\.\s]+/, '').trim();
          
          // Remove markdown formatting
          const finalCleaned = cleaned
            .replace(/\*\*/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links, keep text
            .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs from topic name
            .trim();
          
          if (finalCleaned.length < 3 || finalCleaned.length > 100) return null;
          if (finalCleaned.toLowerCase().includes('topics to cover') ||
              finalCleaned.toLowerCase().includes('estimated study') ||
              finalCleaned.toLowerCase().includes('weekly schedule') ||
              finalCleaned.toLowerCase().includes('resources') ||
              finalCleaned.toLowerCase().includes('study strategy')) {
            return null; // Skip section headers
          }
          
          // Try to find video URL for this topic
          const cleanedLower = finalCleaned.toLowerCase();
          let videoUrl = videoMap.get(cleanedLower);
          
          // Try partial matching
          if (!videoUrl) {
            for (const [key, url] of videoMap.entries()) {
              if (cleanedLower.includes(key) || key.includes(cleanedLower)) {
                videoUrl = url;
                break;
              }
            }
          }
          
          return {
            name: finalCleaned,
            videoUrl: videoUrl || undefined,
          };
        })
        .filter((t): t is { name: string; videoUrl?: string } => t !== null);
    }
    
    // If no topics found, try alternative extraction
    if (topics.length === 0 && subjectSection) {
      // Look for lines that are clearly topics (not headers, not metadata)
      const allLines = subjectSection.split('\n');
      for (const line of allLines) {
        const trimmed = line.trim();
        if (trimmed.length > 5 && trimmed.length < 80 && 
            !trimmed.startsWith('#') && 
            !trimmed.startsWith('**') &&
            !trimmed.toLowerCase().includes('hours') &&
            !trimmed.toLowerCase().includes('schedule') &&
            !trimmed.toLowerCase().includes('resources') &&
            !trimmed.includes('http') &&
            /^[A-Za-z]/.test(trimmed)) {
          topics.push({ name: trimmed });
          if (topics.length >= 15) break;
        }
      }
    }
    
    // Extract study hours
    let studyHours = '2-3 hours/week';
    if (subjectSection) {
      const hoursMatch = subjectSection.match(/(?:study\s+hours?|estimated\s+study|hours?)[:\s]+([^\n]+)/i);
      if (hoursMatch) {
        studyHours = hoursMatch[1].trim().replace(/[^\d\-\s\/hoursperweek]/gi, '').substring(0, 30) || studyHours;
      }
    }
    
    // Extract weekly schedule
    let weeklySchedule: string[] = ['Monday', 'Wednesday', 'Friday'];
    if (subjectSection) {
      const scheduleMatch = subjectSection.match(/(?:weekly\s+schedule|schedule)[:\s]+([^\n]+)/i);
      if (scheduleMatch) {
        const scheduleText = scheduleMatch[1];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const foundDays = days.filter(day => scheduleText.includes(day));
        if (foundDays.length > 0) {
          weeklySchedule = foundDays;
        }
      }
    }
    
    // Extract resources
    let resources: string[] = ['NCERT Textbook', 'Practice Worksheets'];
    if (subjectSection) {
      const resourcesMatch = subjectSection.match(/(?:resources?|learning\s+resources?)[:\s]+([^\n]+)/i);
      if (resourcesMatch) {
        const resourcesText = resourcesMatch[1];
        // Extract common resource mentions
        const resourceList: string[] = [];
        if (resourcesText.includes('NCERT') || resourcesText.includes('textbook')) {
          resourceList.push('NCERT Textbook');
        }
        if (resourcesText.includes('YouTube') || resourcesText.includes('video')) {
          resourceList.push('YouTube Videos');
        }
        if (resourcesText.includes('worksheet') || resourcesText.includes('practice')) {
          resourceList.push('Practice Worksheets');
        }
        if (resourcesText.includes('notes')) {
          resourceList.push('Study Notes');
        }
        if (resourceList.length > 0) {
          resources = resourceList;
        }
      }
    }
    
    // Add YouTube playlist URL if available
    if (extractedClass) {
      const playlistUrl = getPlaylistUrl(extractedClass, subject);
      if (playlistUrl && !resources.includes('YouTube Playlist')) {
        resources.push('YouTube Playlist');
      }
    }
    
    // If still no topics, create default topics
    if (topics.length === 0) {
      topics = [
        { name: 'Fundamentals' },
        { name: 'Practice Problems' },
        { name: 'Revision' },
      ];
    }

    return {
      subject,
      topics: topics.slice(0, 15), // Limit to 15 topics
      studyHours,
      weeklySchedule,
      resources,
    };
  });

  return {
    plan: planText,
    modules,
  };
}

// Helper function to convert YouTube search URL to a watch URL (if possible)
function convertToWatchUrl(url: string): string | null {
  // If it's already a watch URL, return it
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    return url;
  }
  
  // If it's a search URL, we can't convert it - return null
  if (url.includes('youtube.com/results')) {
    return null;
  }
  
  return url;
}

