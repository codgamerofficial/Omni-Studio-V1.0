
import { GoogleGenAI, Modality } from "@google/genai";
import type { FileWithPreview } from '../types';

// Utility to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the "data:mime/type;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const getAiClient = () => {
    // API key must be handled by the execution environment.
    // In a real app, this would be fetched securely.
    if (!process.env.API_KEY) {
        // In a real app, you would have better error handling or a user prompt.
        // For this demo, we use a placeholder if not found, but API calls will fail.
        console.warn("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY! });
}

// 1. Resume Studio
export const generateResume = async (formData: any) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';

    const prompt = `
    System: You are an expert career coach and ATS resume writer. Your job is to convert raw candidate information into (A) an ATS-optimized plain text / applicant-tracking-system friendly resume and (B) a modern visually pleasing human resume breakdown (sections, short bullets). Always produce (A) and (B). Ask only minimal clarifying questions if critical details are missing (job title, years).

    User:
    Candidate raw data:
    • Name: ${formData.name}
    • Email: ${formData.email}
    • Phone: ${formData.phone}
    • Current role: ${formData.current_role}
    • Experience bullets / pasted resume: ${formData.raw_resume_text_or_upload}
    • Target job title(s): ${formData.target_titles}
    • Key skills (optional): ${formData.skills_list}

    Instruction:
    Output "ATS_RESUME:" as plain text (no headers, no special characters like emojis). Keep each section labeled (CONTACT, SUMMARY, SKILLS, EXPERIENCE, EDUCATION, CERTIFICATIONS). Use plain fonts and avoid tables — keep < 2 pages for typical applicants.
    Output "HUMAN_RESUME:" with suggested headings, 3–5 achievement-oriented bullets per role (start each bullet with an action verb + metric when possible). Provide a 2–3 sentence LinkedIn summary.
    Add an "ATS KEYWORDS" list (20–40 keywords / phrases to include for the target job).
    If dates or metrics are missing, estimate ranges and mark them with [ESTIMATE] so the user can confirm.
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            temperature: 0.2,
            maxOutputTokens: 3000,
        }
    });

    return response.text;
};

// 2. Image Studio
export const generateImage = async (prompt: string) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const base64Image = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Image}`;
    }
    throw new Error("No image data received from API.");
};

export const editImage = async (file: File, prompt: string) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-image';
    const base64Image = await fileToBase64(file);

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: file.type } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        const base64Image = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Image}`;
    }
    throw new Error("No image data received from API for edit.");
};

// 3. Video Studio
export const generateVideo = async (prompt: string): Promise<string> => {
    // Veo must create a new client instance each time to get the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'veo-3.1-fast-generate-preview';

    let operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was provided.");
    }
    
    // The download link is temporary and can be used directly in the src attribute of a video tag.
    // It already includes necessary authentication tokens.
    // For long-term storage, you would fetch and store it elsewhere.
    return `${downloadLink}&key=${process.env.API_KEY}`;
};


// 4. Interior Studio
export const analyzeInterior = async (files: FileWithPreview[], preferences: any) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';

    const imageParts = await Promise.all(files.map(async (file) => {
        const base64Image = await fileToBase64(file);
        return { inlineData: { data: base64Image, mimeType: file.type } };
    }));

    const prompt = `
    System: You are an expert interior designer and architect assistant. Analyze user photos and produce practical redesign plans, style boards, furniture recommendations (with dimensions), light and color suggestions, and a render suggestion for AR/3D mockup. Prioritize realistic, buildable recommendations. Output in well-structured markdown.

    User:
    Room type: ${preferences.roomType}
    Uploaded photos are provided.
    Budget range: ${preferences.budget}
    Preferences: ${preferences.style}
    Requirements: ${preferences.requirements}

    Instruction:
    For each photo: give a short diagnosis (what’s working, what’s not).
    Provide a 3-tier redesign plan (Quick fix, Mid-range, Full remodel) with bullets and an itemized shopping list (product types, suggested dimensions, approximate price ranges).
    Provide AR/3D mockup guidance: camera angles, recommended textures.
    List local building/regulatory notes (if rooftop pool or structural changes) and safety flags (structural modifications require a certified structural engineer).
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                ...imageParts,
                { text: prompt },
            ],
        },
    });

    return response.text;
};

// 5. Clothing Studio
export const designClothingFromText = async (description: string) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';

    const prompt = `
    System: You are a fashion designer and technical sketch artist. Produce creative variations, flat pattern suggestions, and a photoreal mockup prompt for each design. Output in well-structured markdown.

    User:
    Action: generate_from_text
    Description: ${description}

    Instruction:
    Output: 1) design variations (names + short rationale), 2) flat sketch (vector-ready description), 3) a detailed prompt to generate a photoreal mockup (for an AI image generator like Nano Banana), 4) sewing notes (materials, stitches, recommended suppliers).
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });

    return response.text;
};

export const designClothingFromImage = async (file: File, instructions: string) => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';
    const base64Image = await fileToBase64(file);

    const prompt = `
    System: You are a fashion designer and technical sketch artist. Analyze the provided image and instructions, then produce design variations and notes. Output in well-structured markdown.

    User:
    Action: edit_uploaded_photo
    Changes: ${instructions}
    
    Instruction:
    Based on the uploaded image and requested changes, provide:
    1) A description of the final design concept.
    2) A flat sketch description of the modified design.
    3) Sewing notes for the alterations (materials, stitches, techniques).
    4) A detailed prompt for an AI image generator to create a mockup of the final design.
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: file.type } },
                { text: prompt },
            ],
        },
    });

    return response.text;
};
