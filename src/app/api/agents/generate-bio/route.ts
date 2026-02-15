import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// AI Bio Generation API
// This generates a professional bio based on structured inputs from the agent's profile

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Get agent profile with structured bio inputs
    // Use supabaseAdmin for internal API calls (like from signup)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, job_title, funeral_home, agent_city, agent_province, metadata, bio_approval_status, ai_generated_bio, bio_audit_log')
      .eq('id', agentId)
      .eq('role', 'agent')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Never overwrite an existing bio — agent may have edited it in Settings; that should stick
    const existingBio = typeof profile.ai_generated_bio === 'string' ? profile.ai_generated_bio.trim() : '';
    if (existingBio) {
      return NextResponse.json({ bio: profile.ai_generated_bio, status: 'approved' });
    }

    // Type assertion for TypeScript
    const profileWithAudit = profile as typeof profile & { bio_audit_log?: any[] };

    const metadata = profile.metadata || {};
    const bioData = metadata.bio || {};

    // Extract structured inputs
    const yearsOfExperience = bioData.years_of_experience || null;
    const practicePhilosophyHelp = bioData.practice_philosophy_help || '';
    const practicePhilosophyAppreciate = bioData.practice_philosophy_appreciate || '';
    const location = profile.agent_city && profile.agent_province
      ? `${profile.agent_city}, ${profile.agent_province}`
      : profile.agent_city || profile.agent_province || '';

    // Check if we have enough data to generate a bio
    if (!yearsOfExperience || !practicePhilosophyHelp || !practicePhilosophyAppreciate) {
      return NextResponse.json({ 
        error: 'Insufficient data. Please fill out years of experience and both practice philosophy fields.' 
      }, { status: 400 });
    }

    // Build the prompt for AI generation
    const prompt = `Generate a professional and compassionate bio for a funeral planning professional.

Use only the verified profile data provided below. Do not add claims, pricing, guarantees, or marketing language. Maintain a calm, respectful tone suitable for sensitive end-of-life planning.

Profile Data:
- Name: ${profile.full_name || 'This professional'}
- Professional Title: ${profile.job_title || 'Pre-need Planning Specialist'}
- Organization: ${profile.funeral_home || ''}
- Location: ${location}
- Years of Experience: ${yearsOfExperience} ${yearsOfExperience === '1' ? 'year' : 'years'}
- How they help families: ${practicePhilosophyHelp}
- What families appreciate: ${practicePhilosophyAppreciate}

Requirements:
- Create a bio with exactly 2 paragraphs maximum
- First paragraph: Introduction with name, title, organization, location, and years of experience, plus how they help families
- Second paragraph: What families appreciate about their service, their communication style, values, and commitment to compassionate care
- Focus on years of experience, areas of support, and family-centered approach
- Mention professional credentials if relevant
- Do not exaggerate or invent information
- No superlatives ("best", "leading", "top")
- No guarantees or promises
- Calm, professional, compassionate tone
- Each paragraph should be 3-4 sentences
- Total word count should be 100-150 words
- DO NOT include any heading, title, or section name like "About the Specialist" or "About" at the beginning
- Start directly with the bio content - no headings whatsoever

Generate the bio now (no heading, just the bio content):`;

    // Call OpenAI API (or your preferred AI service)
    // For now, we'll use a simple template-based approach until you configure your AI service
    // Replace this with actual AI API call when ready
    
    const aiApiKey = process.env.OPENAI_API_KEY;
    let generatedBio = '';

    if (aiApiKey) {
      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // or 'gpt-4' for better quality
          messages: [
            {
              role: 'system',
              content: 'You are a professional bio writer for healthcare and service professionals. Write neutral, compassionate, and professional bios suitable for sensitive end-of-life planning services.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 300, // Reduced for 2 paragraphs max
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error('Failed to generate bio with AI service');
      }

      const aiData = await openaiResponse.json();
      generatedBio = aiData.choices[0]?.message?.content?.trim() || '';
      
      // Remove any "About the Specialist" heading variants that might have been included
      generatedBio = generatedBio
        .replace(/^\*\*About the Specialist\*\*\s*/i, '')
        .replace(/^About the Specialist\s*/i, '')
        .replace(/^##\s*About the Specialist\s*/i, '')
        .replace(/^#\s*About the Specialist\s*/i, '')
        .replace(/^\*\*About\*\*\s*/i, '')
        .replace(/^About\s*/i, '')
        .trim();
    } else {
      // Fallback: Generate a simple template-based bio if AI is not configured
      const experienceText = yearsOfExperience 
        ? `with ${yearsOfExperience} ${yearsOfExperience === '1' ? 'year' : 'years'} of experience`
        : '';
      
      const locationText = location ? `Based in ${location}, ` : '';
      
      generatedBio = `${profile.full_name || 'This professional'} is a ${profile.job_title || 'licensed funeral planning professional'} ${experienceText}. ${locationText}${practicePhilosophyHelp}

${practicePhilosophyAppreciate}`;
    }

    if (!generatedBio) {
      return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
    }

    // Save the generated bio with 'pending' status
    const auditLog = Array.isArray(profileWithAudit.bio_audit_log) ? profileWithAudit.bio_audit_log : [];
    const newAuditEntry = {
      action: 'generated',
      timestamp: new Date().toISOString(),
      bio: generatedBio,
    };
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        ai_generated_bio: generatedBio,
        bio_approval_status: 'approved', // Auto-approve bios - no separate approval needed
        bio_last_updated: new Date().toISOString(),
        bio_audit_log: [...auditLog, newAuditEntry],
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('Error saving bio:', updateError);
      return NextResponse.json({ error: 'Failed to save generated bio' }, { status: 500 });
    }

    return NextResponse.json({ 
      bio: generatedBio,
      status: 'approved'
    });

  } catch (error: any) {
    console.error('Error generating bio:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate bio' 
    }, { status: 500 });
  }
}
