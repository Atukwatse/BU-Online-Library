const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class CoverService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.coversPath = process.env.COVERS_PATH || './uploads/covers';
    this.ensureCoversDirectory();
  }

  ensureCoversDirectory() {
    if (!fs.existsSync(this.coversPath)) {
      fs.mkdirSync(this.coversPath, { recursive: true });
    }
  }

  async generateCover(bookData) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const { title, author, category } = bookData;
      
      // Create a descriptive prompt for book cover generation
      const prompt = this.createCoverPrompt(title, author, category);
      
      // Generate image using DALL-E 3
      const imageUrl = await this.generateImage(prompt);
      
      // Download and process the image
      const coverImagePath = await this.downloadAndProcessImage(imageUrl, title);
      
      return coverImagePath;
    } catch (error) {
      console.error('Error generating book cover:', error);
      throw new Error('Failed to generate book cover');
    }
  }

  createCoverPrompt(title, author, category) {
    const categoryStyles = {
      'Computer Science': 'modern digital art with technology elements, blue and silver color scheme',
      'Information Science': 'organized library theme with books and data visualization, warm colors',
      'Research': 'academic and scholarly design with graphs and papers, professional look',
      'Web Development': 'code and web elements, modern tech aesthetic',
      'Database': 'structured data patterns, organized and clean design',
      'default': 'professional book cover with elegant typography'
    };

    const style = categoryStyles[category] || categoryStyles['default'];
    
    return `Create a professional book cover for "${title}" by ${author} in the ${category} field. ${style}. The design should be suitable for an academic library, clean, modern, and professional. Include the title and author name in readable typography. No text overlays other than title and author.`;
  }

  async generateImage(prompt) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: process.env.OPENAI_MODEL || 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1792',
          quality: 'standard',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data[0].url;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('Failed to generate image with OpenAI API');
    }
  }

  async downloadAndProcessImage(imageUrl, title) {
    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      // Generate unique filename
      const filename = `${this.sanitizeFilename(title)}_${uuidv4()}.png`;
      const outputPath = path.join(this.coversPath, filename);
      
      // Process and save image using Sharp
      await sharp(imageBuffer)
        .resize(800, 1200, { 
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      return `/uploads/covers/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process and save cover image');
    }
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }

  async deleteCover(coverImagePath) {
    try {
      if (coverImagePath) {
        const fullPath = path.join(process.cwd(), coverImagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      console.error('Error deleting cover image:', error);
    }
  }
}

module.exports = new CoverService();
