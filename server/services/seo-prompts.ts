// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

export interface PromptTemplate {
  systemInstruction: string;
  userPrompt: (context: any) => string;
  responseSchema: any;
}

export const SEO_PROMPTS: Record<string, PromptTemplate> = {
  META_DESCRIPTION: {
    systemInstruction: `You are an SEO expert specializing in meta descriptions for forex trading and financial websites. 
Generate compelling, SEO-optimized meta descriptions that encourage clicks while accurately representing page content.`,
    userPrompt: (context) => `Generate an SEO-optimized meta description for this page:

Page URL: ${context.pageUrl}
Page Title: ${context.title || 'N/A'}
Content Excerpt: ${context.excerpt || 'No content available'}

Requirements:
- 150-160 characters (strict limit)
- Include relevant keywords naturally
- Compelling call-to-action
- Accurate representation of page content
- Engaging and click-worthy

Respond with JSON only.`,
    responseSchema: {
      type: 'object',
      properties: {
        metaDescription: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['metaDescription', 'reasoning'],
    },
  },

  ALT_TEXT: {
    systemInstruction: `You are an accessibility and SEO expert. Generate descriptive, SEO-friendly alt text for images on forex trading websites.`,
    userPrompt: (context) => `Generate descriptive alt text for this image:

Image URL: ${context.imageUrl}
Page Context: ${context.pageContext || 'Forex trading forum'}
Surrounding Text: ${context.surroundingText || 'N/A'}

Requirements:
- 80-125 characters
- Describe what's visible in the image
- Include relevant forex/trading keywords if applicable
- Natural and readable
- Accessibility-focused

Respond with JSON only.`,
    responseSchema: {
      type: 'object',
      properties: {
        altText: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['altText', 'reasoning'],
    },
  },

  H1_TAG: {
    systemInstruction: `You are an SEO expert specializing in heading optimization for forex and trading websites.`,
    userPrompt: (context) => `Generate an SEO-optimized H1 heading for this page:

Page URL: ${context.pageUrl}
Current Title: ${context.title || 'N/A'}
Content Excerpt: ${context.excerpt || 'No content available'}

Requirements:
- 40-70 characters
- Engaging and descriptive
- Include primary keyword
- Clear value proposition
- Optimized for search engines and users

Respond with JSON only.`,
    responseSchema: {
      type: 'object',
      properties: {
        h1: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['h1', 'reasoning'],
    },
  },
};
