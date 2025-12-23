import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';

// AI Bio Generation API
// This generates a professional bio based on structured inputs from the agent's profile

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Get agent profile with structured bio inputs
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, job_title, funeral_home, agent_city, agent_province, metadata, bio_approval_status, ai_generated_bio')
      .eq('id', agentId)
      .eq('role', 'agent')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const metadata = profile.metadata || {};
    const bioData = metadata.bio || {};

    // Extract structured inputs
    const yearsOfExperience = bioData.years_of_experience || null;
    const specialties = bioData.specialties || [];
    const practicePhilosophyHelp = bioData.practice_philosophy_help || '';
    const practicePhilosophyAppreciate = bioData.practice_philosophy_appreciate || '';
    const practicePhilosophySituations = bioData.practice_philosophy_situations || [];
    const languages = bioData.languages_spoken || [];
    const location = profile.agent_city && profile.agent_province
      ? `${profile.agent_city}, ${profile.agent_province}`
      : profile.agent_city || profile.agent_province || '';

    // Check if we have enough data to generate a bio
    if (!yearsOfExperience && specialties.length === 0 && !practicePhilosophyHelp) {
      return NextResponse.json({ 
        error: 'Insufficient data. Please fill out at least years of experience, specialties, or practice philosophy.' 
      }, { status: 400 });
    }

    // Build the prompt for AI generation
    const prompt = `Generate a professional, neutral, and compassionate "About the Specialist" section for a funeral planning professional.

Use only the verified profile data provided below. Do not add claims, pricing, guarantees, or marketing language. Maintain a calm, respectful tone suitable for sensitive end-of-life planning. Limit to 2-3 short paragraphs.

Profile Data:
- Name: ${profile.full_name || 'This professional'}
- Professional Title: ${profile.job_title || 'Pre-need Planning Specialist'}
- Organization: ${profile.funeral_home || ''}
- Location: ${location}
- Years of Experience: ${yearsOfExperience || 'Not specified'}
- Specialties: ${specialties.join(', ') || 'General pre-need planning'}
- How they help families: ${practicePhilosophyHelp || ''}
- What families appreciate: ${practicePhilosophyAppreciate || ''}
- Best suited for: ${practicePhilosophySituations.join(', ') || ''}
- Languages: ${languages.join(', ') || 'English'}

Requirements:
- Focus on years of experience, areas of support, and family-centered approach
- Mention professional credentials if relevant
- Do not exaggerate or invent information
- No superlatives ("best", "leading", "top")
- No guarantees or promises
- Calm, professional, compassionate tone
- 2-3 short paragraphs maximum

Generate the bio now:`;

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
          max_tokens: 300,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        throw new Error('Failed to generate bio with AI service');
      }

      const aiData = await openaiResponse.json();
      generatedBio = aiData.choices[0]?.message?.content?.trim() || '';
    } else {
      // Fallback: Generate a simple template-based bio if AI is not configured
      const experienceText = yearsOfExperience 
        ? `with over ${yearsOfExperience === '12+' ? '12' : yearsOfExperience} years of experience`
        : '';
      
      const specialtiesText = specialties.length > 0 
        ? `specializing in ${specialties.slice(0, 3).join(', ')}`
        : '';
      
      const locationText = location ? `Based in ${location}, ` : '';
      
      generatedBio = `${profile.full_name || 'This professional'} is a ${profile.job_title || 'licensed funeral planning professional'} ${experienceText} ${specialtiesText ? `, ${specialtiesText}` : ''}. ${locationText}${practicePhilosophyHelp || 'They work closely with families to navigate sensitive decisions with clarity and care.'}

${practicePhilosophyAppreciate || 'Clients value their thoughtful approach, clear communication, and commitment to ensuring every family feels supported throughout the planning process.'}`;
    }

    if (!generatedBio) {
      return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
    }

    // Save the generated bio with 'pending' status
    const auditLog = Array.isArray(profile.bio_audit_log) ? profile.bio_audit_log : [];
    const newAuditEntry = {
      action: 'generated',
      timestamp: new Date().toISOString(),
      bio: generatedBio,
    };
    
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        ai_generated_bio: generatedBio,
        bio_approval_status: 'pending',
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
      status: 'pending'
    });

  } catch (error: any) {
    console.error('Error generating bio:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate bio' 
    }, { status: 500 });
  }
}
