import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setupEnvironment } from "../server/env";
import {
    GoogleGenerativeAI,
    type ChatSession,
} from "@google/generative-ai";
import { marked } from "marked";

const env = setupEnvironment();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
    },
});

// Store chat sessions in memory
const chatSessions = new Map<string, ChatSession>();

interface WebSource {
    uri: string;
    title: string;
}

interface GroundingChunk {
    web?: WebSource;
}

interface TextSegment {
    startIndex: number;
    endIndex: number;
    text: string;
}

interface GroundingSupport {
    segment: TextSegment;
    groundingChunkIndices: number[];
    confidenceScores: number[];
}

interface GroundingMetadata {
    groundingChunks: GroundingChunk[];
    groundingSupports: GroundingSupport[];
    searchEntryPoint?: any;
    webSearchQueries?: string[];
}

// Format raw text into proper markdown
async function formatResponseToMarkdown(text: string): Promise<string> {
    // Ensure consistent newlines
    let processedText = text.replace(/\r\n/g, "\n");

    // Process main sections (lines that start with word(s) followed by colon)
    processedText = processedText.replace(
        /^([A-Za-z][A-Za-z\s]+):(\s*)/gm,
        "## $1$2"
    );

    // Process sub-sections (any remaining word(s) followed by colon within text)
    processedText = processedText.replace(
        /(?<=\n|^)([A-Za-z][A-Za-z\s]+):(?!\d)/gm,
        "### $1"
    );

    // Process bullet points
    processedText = processedText.replace(/^[•●○]\s*/gm, "* ");

    // Split into paragraphs
    const paragraphs = processedText.split("\n\n").filter(Boolean);

    // Process each paragraph
    const formatted = paragraphs
        .map((p) => {
            // If it's a header or list item, preserve it
            if (p.startsWith("#") || p.startsWith("*") || p.startsWith("-")) {
                return p;
            }
            // Add proper paragraph formatting
            return `${p}\n`;
        })
        .join("\n\n");

    // Configure marked options for better header rendering
    marked.setOptions({
        gfm: true,
        breaks: true,
    });

    // Convert markdown to HTML using marked
    return marked.parse(formatted);
}

// Process response and extract sources
async function processResponse(response: any) {
    const text = response.text();
    
    // Format the response text to proper markdown/HTML
    const formattedText = await formatResponseToMarkdown(text);

    // Extract sources from grounding metadata
    const sourceMap = new Map<
        string,
        { title: string; url: string; snippet: string }
    >();

    if (response.candidates && response.candidates[0]?.groundingMetadata) {
        const metadata = response.candidates[0].groundingMetadata as unknown as GroundingMetadata;
        const { groundingChunks, groundingSupports } = metadata;

        if (groundingChunks && groundingSupports) {
            // Process each grounding support
            groundingSupports.forEach((support) => {
                support.groundingChunkIndices.forEach((chunkIndex) => {
                    if (
                        groundingChunks[chunkIndex] &&
                        groundingChunks[chunkIndex].web
                    ) {
                        const webSource = groundingChunks[chunkIndex].web!;
                        sourceMap.set(webSource.uri, {
                            title: webSource.title,
                            url: webSource.uri,
                            snippet: support.segment.text,
                        });
                    }
                });
            });
        }
    }

    // Format sources
    const sources = Array.from(sourceMap.values());

    return {
        text,
        html: formattedText,
        sources,
    };
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { route } = req.query;
    
    // Ensure that route is treated as an array (even if it's a single value)
    const routePath = Array.isArray(route) ? route : route ? [route] : [];
    const path = '/' + routePath.join('/');
    
    console.log(`Handling API request for path: ${path}`);
    console.log(`Method: ${req.method}`);
    
    // Main search endpoint - creates a new chat session
    if (req.method === 'GET' && path === '/search') {
        try {
            const query = req.query.q as string;

            if (!query) {
                return res.status(400).json({
                    message: "Query parameter 'q' is required",
                });
            }

            // Create a new chat session with search capability
            const chat = model.startChat({
                tools: [
                    {
                        // @ts-ignore - google_search is a valid tool but not typed in the SDK yet
                        google_search: {},
                    },
                ],
            });

            // Generate a unique ID for this chat session
            const sessionId = Date.now().toString();
            chatSessions.set(sessionId, chat);

            // Generate content with search tool
            const result = await chat.sendMessage(query);
            const response = await result.response;
            
            // Process the response
            const processedResponse = await processResponse(response);

            return res.status(200).json({
                ...processedResponse,
                sessionId,
            });
        } catch (error: any) {
            console.error("Error in search endpoint:", error);
            return res.status(500).json({
                message: "An error occurred",
                error: error.message,
            });
        }
    }
    
    // Follow-up endpoint - continues an existing chat session
    if (req.method === 'POST' && path === '/follow-up') {
        try {
            const { sessionId, query } = req.body;

            if (!sessionId || !query) {
                return res.status(400).json({
                    message: "Both 'sessionId' and 'query' are required",
                });
            }

            // Get the chat session from memory
            const chat = chatSessions.get(sessionId);
            if (!chat) {
                return res.status(404).json({
                    message: "Chat session not found",
                });
            }

            // Send follow-up message
            const result = await chat.sendMessage(query);
            const response = await result.response;
            
            // Process the response
            const processedResponse = await processResponse(response);

            return res.status(200).json({
                ...processedResponse,
                sessionId,
            });
        } catch (error: any) {
            console.error("Error in follow-up endpoint:", error);
            return res.status(500).json({
                message: "An error occurred",
                error: error.message,
            });
        }
    }

    // No matching route
    return res.status(404).json({ error: 'API endpoint not found' });
} 