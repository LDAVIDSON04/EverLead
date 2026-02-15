import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agents/generate-bio-preview
 * Generates a bio from structured inputs (no auth). Used on create-account Step 3
 * before the agent exists. Returns { bio } only; does not save.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      yearsOfExperience,
      practicePhilosophyHelp,
      practicePhilosophyAppreciate,
      fullName = '',
      jobTitle = 'Pre-need Planning Specialist',
      businessName = '',
      location = '',
    } = body;

    if (!yearsOfExperience || !practicePhilosophyHelp || !practicePhilosophyAppreciate) {
      return NextResponse.json(
        { error: 'Please fill in years of experience and both practice philosophy fields.' },
        { status: 400 }
      );
    }

    const prompt = `Generate a professional and compassionate bio for a funeral planning professional.

Use only the verified profile data provided below. Do not add claims, pricing, guarantees, or marketing language. Maintain a calm, respectful tone suitable for sensitive end-of-life planning.

Profile Data:
- Name: ${fullName || 'This professional'}
- Professional Title: ${jobTitle || 'Pre-need Planning Specialist'}
- Organization: ${businessName || ''}
- Location: ${location || ''}
- Years of Experience: ${yearsOfExperience} ${String(yearsOfExperience) === '1' ? 'year' : 'years'}
- How they help families: ${practicePhilosophyHelp}
- What families appreciate: ${practicePhilosophyAppreciate}

Requirements:
- Create a bio with exactly 2 paragraphs maximum
- First paragraph: Introduction with name, title, organization, location, and years of experience, plus how they help families
- Second paragraph: What families appreciate about their service, their communication style, values, and commitment to compassionate care
- Focus on years of experience, areas of support, and family-centered approach
- Do not exaggerate or invent information
- No superlatives ("best", "leading", "top")
- No guarantees or promises
- Calm, professional, compassionate tone
- Each paragraph should be 3-4 sentences
- Total word count should be 100-150 words
- DO NOT include any heading, title, or section name like "About the Specialist" or "About" at the beginning
- Start directly with the bio content - no headings whatsoever

Generate the bio now (no heading, just the bio content):`;

    const aiApiKey = process.env.OPENAI_API_KEY;
    let generatedBio = '';

    if (aiApiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional bio writer for healthcare and service professionals. Write neutral, compassionate, and professional bios suitable for sensitive end-of-life planning services.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        return NextResponse.json({ error: 'Failed to generate bio. Please try again.' }, { status: 500 });
      }

      const aiData = await openaiResponse.json();
      generatedBio = aiData.choices[0]?.message?.content?.trim() || '';
      generatedBio = generatedBio
        .replace(/^\*\*About the Specialist\*\*\s*/i, '')
        .replace(/^About the Specialist\s*/i, '')
        .replace(/^##\s*About the Specialist\s*/i, '')
        .replace(/^#\s*About the Specialist\s*/i, '')
        .replace(/^\*\*About\*\*\s*/i, '')
        .replace(/^About\s*/i, '')
        .trim();
    } else {
      const experienceText = `${yearsOfExperience} ${String(yearsOfExperience) === '1' ? 'year' : 'years'} of experience`;
      const locationText = location ? `Based in ${location}, ` : '';
      generatedBio = `${fullName || 'This professional'} is a ${jobTitle || 'licensed funeral planning professional'} with ${experienceText}. ${locationText}${practicePhilosophyHelp}\n\n${practicePhilosophyAppreciate}`;
    }

    if (!generatedBio) {
      return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
    }

    return NextResponse.json({ bio: generatedBio });
  } catch (error: unknown) {
    console.error('Error in generate-bio-preview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate bio' },
      { status: 500 }
    );
  }
}
