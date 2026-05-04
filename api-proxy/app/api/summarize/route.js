import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || '');

// Allow CORS for the extension
const getCorsHeaders = (origin) => {
  // In production, check origin against allowed extension IDs.
  // Example: if (origin === 'chrome-extension://<YOUR_ID>') { ... }
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
};

export async function OPTIONS(req) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req) {
  const origin = req.headers.get('origin');

  try {
    if (!process.env.AI_API_KEY) {
      throw new Error('AI_API_KEY environment variable is missing.');
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing text.' }, { status: 400, headers: getCorsHeaders(origin) });
    }

    // Data Minimization: Limit to first 10,000 characters
    const cleanText = text.substring(0, 10000);

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "A bulleted list of 3-5 main points from the text."
            },
            insight: {
              type: SchemaType.STRING,
              description: "A single, compelling sentence capturing the core message or most surprising takeaway."
            },
            readingTime: {
              type: SchemaType.INTEGER,
              description: "Estimated reading time of the original full text in minutes. (Assuming 200 words/min)"
            }
          },
          required: ["summary", "insight", "readingTime"]
        }
      }
    });

    const prompt = `Analyze the following webpage content and provide a summary, a key insight, and the estimated reading time.

    Content:
    ${cleanText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const responseData = JSON.parse(responseText);

    return NextResponse.json(responseData, { headers: getCorsHeaders(origin) });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process content with AI.' },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}
