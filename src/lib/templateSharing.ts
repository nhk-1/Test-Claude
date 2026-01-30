import { WorkoutTemplate } from './types';

// Generate a shareable code for a template
export function generateTemplateCode(template: WorkoutTemplate): string {
  // Create a clean copy without IDs and timestamps
  const shareable = {
    name: template.name,
    description: template.description,
    exercises: template.exercises,
  };

  // Encode to base64
  const json = JSON.stringify(shareable);
  return btoa(encodeURIComponent(json));
}

// Decode a template from a shareable code
export function decodeTemplateCode(code: string): { name: string; description?: string; exercises: any[] } | null {
  try {
    const json = decodeURIComponent(atob(code));
    const data = JSON.parse(json);

    // Validate basic structure
    if (!data.name || !Array.isArray(data.exercises)) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

// Generate a shareable URL (can be used with the app URL)
export function generateShareUrl(template: WorkoutTemplate, baseUrl: string = ''): string {
  const code = generateTemplateCode(template);
  return `${baseUrl}/templates/share?code=${code}`;
}
