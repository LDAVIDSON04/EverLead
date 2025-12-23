"use client";

interface AboutSectionProps {
  summary: string;
  fullBio: string;
  aiGeneratedBio?: string | null;
}

export function AboutSection({ summary, fullBio, aiGeneratedBio }: AboutSectionProps) {
  // Use AI-generated bio if available, otherwise use provided summary/fullBio
  let displayBio = aiGeneratedBio || fullBio || summary;
  
  // Remove "About the Specialist" heading if present (case-insensitive, with or without markdown)
  displayBio = displayBio
    .replace(/^\*\*About the Specialist\*\*\s*/i, '')
    .replace(/^About the Specialist\s*/i, '')
    .replace(/^##\s*About the Specialist\s*/i, '')
    .replace(/^#\s*About the Specialist\s*/i, '')
    .trim();
  
  // Split bio into paragraphs and display all of them
  const bioParagraphs = displayBio ? displayBio.split('\n\n').filter(p => p.trim().length > 0) : [];
  
  // If no paragraphs, use summary or displayBio as fallback
  const paragraphsToShow = bioParagraphs.length > 0 ? bioParagraphs : [summary || displayBio || ''];

  return (
    <div id="about" className="py-8 border-t border-gray-200">
      <div className="text-gray-700 leading-relaxed space-y-4">
        {paragraphsToShow.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
