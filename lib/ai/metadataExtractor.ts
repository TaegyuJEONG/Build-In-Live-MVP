import OpenAI from "openai";

// Initialize OpenAI. Make sure OPENAI_API_KEY is in your .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedProjectData {
  about: string;
  categories: string[];
  platforms: string[];
  targetAudience: string[];
  techStacks: string[];
  useCases: string[];
}

/**
 * Extracts structured project metadata from a README.md string using GPT-4o-mini
 * @param readmeText The raw markdown string of the project's README
 * @returns ExtractedProjectData containing the structured metadata
 */
export async function extractMetadataFromReadme(readmeText: string): Promise<ExtractedProjectData | null> {
  const prompt = `
    You are an expert developer and product manager. Analyze the following GitHub README.md text and extract the project details.
    
    Return ONLY a valid JSON object matching this exact structure:
    {
      "about": "A 1-2 sentence compelling summary of what the project does.",
      "categories": ["Category 1", "Category 2"], // e.g., "Developer Tools", "AI", "Marketplace"
      "platforms": ["web", "ios", "android"], // the platforms this project runs on, default to ["web"] if unclear
      "targetAudience": ["target audience 1", "target audience 2"],
      "techStacks": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      "useCases": ["Use case 1", "Use case 2"]
    }

    README TEXT:
    ---
    ${readmeText.substring(0, 5000) /* Limit token length roughly */}
    ---
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for deterministic extraction
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as ExtractedProjectData;
    return parsed;
  } catch (error) {
    console.error("Failed to extract metadata from README via OpenAI:", error);
    return null;
  }
}
