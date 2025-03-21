# Gemini AI 2.0 

A Perplexity-style search engine powered by Google's Gemini 2.0 Flash model with grounding through Google Search. Get AI-powered answers to your questions with real-time web sources and citations.

Created by [@Davidayo](https://www.davidayo.com/)

<!-- ![Kapture 2025-02-13 at 10 35 14](https://github.com/user-attachments/assets/2302898e-03ae-40a6-a16c-301d6b91c5af) -->


## Features

- 🔍 Real-time web search integration
- 🤖 Powered by Google's latest Gemini 2.0 Flash model
- 📚 Source citations and references for answers
- 💬 Follow-up questions in the same chat session
- 🎨 Clean, modern UI inspired by Perplexity
- ⚡ Fast response times

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express.js + TypeScript
- AI: Google Gemini 2.0 Flash API
- Search: Google Search API integration

## Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Google API key with access to Gemini API

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/
   cd Gemini-Search
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Environment Variables

- `GOOGLE_API_KEY`: Your Google API key with access to Gemini API
- `NODE_ENV`: Set to "development" by default, use "production" for production builds

## Development

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run start`: Run the production server
- `npm run check`: Run TypeScript type checking

## Security Notes

- Never commit your `.env` file or expose your API keys
- The `.gitignore` file is configured to exclude sensitive files
- If you fork this repository, make sure to use your own API keys

## License

MIT License - feel free to use this code for your own projects!

## Acknowledgments

- Inspired by [Perplexity](https://www.perplexity.ai/)
- Built with [Google's Gemini API](https://ai.google.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## Deployment to Vercel

This application has been optimized for deployment on Vercel. The project uses a hybrid approach:

1. Static client-side assets served by Vercel
2. API routes handled as serverless functions

To deploy on Vercel:

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in your Vercel project settings:
   - `GOOGLE_API_KEY`: Your Gemini API key
   - Any other environment variables from your `.env` file

The deployment should work automatically with the included `vercel.json` configuration.

### Note on API Routes

During local development, the project uses a traditional Express server. However, for Vercel deployment, the API routes are deployed as serverless functions in the `/api` directory.

If you're adding new API routes:
1. Add them to both the Express server (`server/routes.ts`) for local development
2. Update the serverless API handler (`api/[[...route]].ts`) to handle the new routes in production
