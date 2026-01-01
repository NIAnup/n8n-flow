const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Platform-specific prompt templates
const platformPrompts = {
  linkedin: (topic, explanation, tone) => `
    Create a professional LinkedIn post about: "${topic}"
    
    Context: ${explanation}
    Tone: ${tone}
    
    Requirements:
    - Professional and engaging
    - 150-300 words
    - Include relevant industry insights
    - Use professional language
    - Add 3-5 relevant hashtags
    - End with a thought-provoking question or call-to-action
    
    Write the post now:
  `,
  
  facebook: (topic, explanation, tone) => `
    Create a Facebook post about: "${topic}"
    
    Context: ${explanation}
    Tone: ${tone}
    
    Requirements:
    - Engaging and conversational
    - 100-200 words
    - Use friendly, approachable language
    - Include emojis where appropriate
    - Add 2-3 relevant hashtags
    - Include a clear call-to-action
    
    Write the post now:
  `,
  
  twitter: (topic, explanation, tone) => `
    Create a Twitter/X post about: "${topic}"
    
    Context: ${explanation}
    Tone: ${tone}
    
    Requirements:
    - Concise and impactful
    - Maximum 280 characters
    - Use clear, punchy language
    - Include 1-2 relevant hashtags
    - Make it shareable and engaging
    
    Write the post now:
  `,
  
  instagram: (topic, explanation, tone) => `
    Create an Instagram post caption about: "${topic}"
    
    Context: ${explanation}
    Tone: ${tone}
    
    Requirements:
    - Engaging and visually descriptive
    - 150-300 words
    - Use emojis strategically
    - Include 5-10 relevant hashtags
    - Write in a way that encourages engagement
    - Include a call-to-action
    
    Write the post now:
  `
};

class AIService {
  /**
   * Generate content using ChatGPT
   */
  async generateWithChatGPT(prompt) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media content writer with 30 years of experience. Create high-quality, engaging content that resonates with audiences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('ChatGPT Error:', error);
      throw new Error(`ChatGPT generation failed: ${error.message}`);
    }
  }

  /**
   * Generate content using Gemini
   */
  async generateWithGemini(prompt) {
    try {
      if (!genAI) {
        throw new Error('Gemini API key not configured');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Error:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  /**
   * Generate platform-specific content
   */
  async generatePlatformContent(topic, explanation, tone, platforms, aiModel) {
    const results = {};
    const generateMethod = aiModel === 'chatgpt' 
      ? this.generateWithChatGPT.bind(this)
      : this.generateWithGemini.bind(this);

    for (const platform of platforms) {
      const prompt = platformPrompts[platform](topic, explanation, tone);
      try {
        results[platform] = await generateMethod(prompt);
      } catch (error) {
        console.error(`Error generating ${platform} content:`, error);
        results[platform] = `Error generating content for ${platform}: ${error.message}`;
      }
    }

    return results;
  }

  /**
   * Detect image style based on topic
   */
  detectImageStyle(topic, explanation) {
    const topicLower = (topic + ' ' + explanation).toLowerCase();
    
    // Business-related keywords
    const businessKeywords = ['business', 'corporate', 'strategy', 'management', 'leadership', 'enterprise', 'company', 'professional'];
    // Tech-related keywords
    const techKeywords = ['technology', 'ai', 'software', 'digital', 'innovation', 'tech', 'coding', 'developer', 'startup', 'app'];
    // Motivation-related keywords
    const motivationKeywords = ['motivation', 'inspiration', 'success', 'growth', 'achievement', 'goal', 'dream', 'aspire', 'empower'];
    
    if (businessKeywords.some(keyword => topicLower.includes(keyword))) {
      return {
        style: 'business',
        prompt: `A minimal, clean, professional illustration in a modern business style. ${topic}. ${explanation}. Use a minimalist design with subtle colors, clean lines, and professional aesthetics suitable for LinkedIn and corporate social media.`
      };
    } else if (techKeywords.some(keyword => topicLower.includes(keyword))) {
      return {
        style: 'tech',
        prompt: `An abstract, futuristic, tech-inspired visual. ${topic}. ${explanation}. Use modern tech aesthetics with abstract shapes, digital elements, vibrant colors, and a cutting-edge feel that represents innovation and technology.`
      };
    } else if (motivationKeywords.some(keyword => topicLower.includes(keyword))) {
      return {
        style: 'motivation',
        prompt: `A human-centric, inspiring image. ${topic}. ${explanation}. Use warm, engaging imagery with people, natural lighting, positive emotions, and motivational elements that connect with viewers on an emotional level.`
      };
    } else {
      return {
        style: 'general',
        prompt: `A professional, high-quality image related to: ${topic}. ${explanation}. The image should be suitable for social media, visually appealing, and relevant to the content.`
      };
    }
  }

  /**
   * Generate image prompt from topic with smart style detection
   */
  generateImagePrompt(topic, explanation) {
    const styleData = this.detectImageStyle(topic, explanation);
    return styleData.prompt;
  }

  /**
   * Generate image using DALL-E (ChatGPT)
   */
  async generateImageWithDALLE(prompt) {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
    });

      return {
        url: response.data[0].url,
        prompt: prompt
      };
    } catch (error) {
      console.error('DALL-E Error:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate monthly content plan
   */
  async generateMonthlyPlan(industry, targetAudience, contentGoal, distribution) {
    const prompt = `
      Create a comprehensive monthly content plan for:
      - Industry: ${industry}
      - Target Audience: ${targetAudience}
      - Content Goal: ${contentGoal}
      - Distribution: ${distribution.educational}% educational, ${distribution.engagement}% engagement, ${distribution.promotional}% promotional
      
      Generate 30 unique topics (one for each day of the month) with:
      1. Day number (1-30)
      2. Topic title
      3. Short explanation (1-2 sentences)
      4. Recommended tone (professional, educational, promotional, or casual)
      5. Suggested platforms (linkedin, facebook, twitter, instagram)
      
      Format as JSON array with this structure:
      [
        {
          "day": 1,
          "topic": "Topic title",
          "explanation": "Brief explanation",
          "tone": "professional",
          "platforms": ["linkedin", "twitter"]
        }
      ]
    `;

    try {
      const generateMethod = this.generateWithChatGPT.bind(this);
      const response = await generateMethod(prompt);
      
      // Try to parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: return structured data
      return this.parseMonthlyPlanFromText(response);
    } catch (error) {
      console.error('Monthly plan generation error:', error);
      throw new Error(`Failed to generate monthly plan: ${error.message}`);
    }
  }

  /**
   * Parse monthly plan from text response
   */
  parseMonthlyPlanFromText(text) {
    // Simple parser - in production, use more robust parsing
    const lines = text.split('\n').filter(line => line.trim());
    const plan = [];
    let currentDay = 1;

    for (const line of lines) {
      if (line.match(/day\s+\d+/i) || line.match(/\d+/)) {
        const dayMatch = line.match(/\d+/);
        if (dayMatch) currentDay = parseInt(dayMatch[0]);
      }
      
      if (line.toLowerCase().includes('topic') || line.length > 20) {
        plan.push({
          day: currentDay++,
          topic: line.replace(/^\d+\.?\s*/, '').trim(),
          explanation: 'Generated content topic',
          tone: 'professional',
          platforms: ['linkedin', 'twitter']
        });
      }
    }

    return plan.slice(0, 30); // Limit to 30 days
  }
}

module.exports = new AIService();

