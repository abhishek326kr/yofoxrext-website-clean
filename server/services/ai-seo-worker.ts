import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { seoFixJobs, seoIssues, seoOverrides } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { SEO_PROMPTS } from './seo-prompts';

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processAiFixJob(jobId: string) {
  console.log(`[AI Worker] Processing job ${jobId}`);
  
  const [job] = await db.select().from(seoFixJobs).where(eq(seoFixJobs.id, jobId));
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const [issue] = await db.select().from(seoIssues).where(eq(seoIssues.id, job.issueId!));
  if (!issue) {
    throw new Error(`Issue ${job.issueId} not found`);
  }

  await db.update(seoFixJobs)
    .set({ 
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(seoFixJobs.id, jobId));

  try {
    const promptKey = getPromptKey(issue.issueType);
    const template = SEO_PROMPTS[promptKey];
    
    if (!template) {
      throw new Error(`No template found for issue type: ${issue.issueType}`);
    }

    const context = buildContext(issue);
    const userPrompt = template.userPrompt(context);
    
    console.log(`[AI Worker] Calling Gemini for job ${jobId}`);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      systemInstruction: template.systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: template.responseSchema,
      },
      contents: [{
        role: 'user',
        parts: [{ text: userPrompt }]
      }],
    });

    const aiResponse = response.response?.text() || response.text;
    
    if (!aiResponse) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(aiResponse);
    
    console.log(`[AI Worker] Job ${jobId} completed successfully`);
    
    await db.update(seoFixJobs)
      .set({
        status: 'completed',
        aiModel: 'gemini-2.5-flash',
        prompt: userPrompt,
        aiResponse,
        generatedContent: JSON.stringify(parsed),
        updatedAt: new Date(),
      })
      .where(eq(seoFixJobs.id, jobId));

    return { success: true, content: parsed };
    
  } catch (error: any) {
    console.error(`[AI Worker] Job ${jobId} failed:`, error);
    
    await db.update(seoFixJobs)
      .set({
        status: 'failed',
        metadata: { 
          ...(job.metadata as any),
          error: error.message,
          failedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(seoFixJobs.id, jobId));

    return { success: false, error: error.message };
  }
}

function getPromptKey(issueType: string): string {
  if (issueType.includes('meta_description')) return 'META_DESCRIPTION';
  if (issueType.includes('image_alt')) return 'ALT_TEXT';
  if (issueType.includes('h1')) return 'H1_TAG';
  throw new Error(`Unknown issue type: ${issueType}`);
}

function buildContext(issue: any) {
  const metadata = issue.metadata || {};
  
  return {
    pageUrl: issue.pageUrl,
    title: metadata.title || issue.pageUrl.split('/').pop(),
    excerpt: metadata.excerpt || metadata.content || 'YoForex forex trading community and marketplace',
    imageUrl: metadata.imageUrl,
    surroundingText: metadata.surroundingText,
    pageContext: 'Forex trading forum and marketplace',
  };
}

export async function applyAiFixJob(jobId: string) {
  const [job] = await db.select().from(seoFixJobs).where(eq(seoFixJobs.id, jobId));
  
  if (!job || job.status !== 'completed') {
    throw new Error('Job not ready to apply');
  }

  const content = JSON.parse(job.generatedContent || '{}');
  const [issue] = await db.select().from(seoIssues).where(eq(seoIssues.id, job.issueId!));

  const overrideData: any = {
    pageUrl: issue.pageUrl,
    active: true,
  };

  if (content.metaDescription) {
    overrideData.metaDescription = content.metaDescription;
  }
  if (content.h1) {
    overrideData.title = content.h1;
  }
  if (content.altText) {
    overrideData.metadata = { altText: content.altText };
  }

  await db.insert(seoOverrides).values(overrideData);
  
  await db.update(seoFixJobs)
    .set({
      status: 'approved',
      appliedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(seoFixJobs.id, jobId));

  console.log(`[AI Worker] Job ${jobId} applied successfully`);
  
  return { success: true };
}
