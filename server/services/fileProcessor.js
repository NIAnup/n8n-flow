const XLSX = require('xlsx');
const csv = require('csv-parser');
const mammoth = require('mammoth');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

class FileProcessor {
  /**
   * Process Excel file (.xlsx)
   */
  async processExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const weeklySchedule = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      };

      // Map days to schedule
      data.forEach(row => {
        const day = (row.Day || row.day || '').toString().toLowerCase();
        const topic = row.Topic || row.topic || '';
        const explanation = row['Short Explanation'] || row['short explanation'] || row.Explanation || row.explanation || '';
        const platforms = this.parsePlatforms(row.Platform || row.platform || '');

        const dayKey = this.mapDayToKey(day);
        if (dayKey && topic) {
          weeklySchedule[dayKey] = {
            topic,
            explanation,
            platforms
          };
        }
      });

      return weeklySchedule;
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  /**
   * Process CSV file
   */
  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const weeklySchedule = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      };

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const day = (row.Day || row.day || '').toString().toLowerCase();
          const topic = row.Topic || row.topic || '';
          const explanation = row['Short Explanation'] || row['short explanation'] || row.Explanation || row.explanation || '';
          const platforms = this.parsePlatforms(row.Platform || row.platform || '');

          const dayKey = this.mapDayToKey(day);
          if (dayKey && topic) {
            weeklySchedule[dayKey] = {
              topic,
              explanation,
              platforms
            };
          }
        })
        .on('end', () => {
          resolve(weeklySchedule);
        })
        .on('error', (error) => {
          reject(new Error(`CSV processing failed: ${error.message}`));
        });
    });
  }

  /**
   * Process Word document (.docx)
   */
  async processDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      // Parse text into weekly schedule
      // This is a simplified parser - you may need to enhance based on document structure
      const lines = text.split('\n').filter(line => line.trim());
      const weeklySchedule = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      };

      let currentDay = null;
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        const dayKey = this.mapDayToKey(lowerLine);
        
        if (dayKey) {
          currentDay = dayKey;
        } else if (currentDay && line.length > 10) {
          // Assume this is a topic/explanation
          const parts = line.split(':');
          if (parts.length >= 2) {
            weeklySchedule[currentDay] = {
              topic: parts[0].trim(),
              explanation: parts.slice(1).join(':').trim(),
              platforms: ['linkedin', 'twitter']
            };
          }
        }
      });

      return weeklySchedule;
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }

  /**
   * Map day string to key
   */
  mapDayToKey(day) {
    const dayMap = {
      'monday': 'monday',
      'mon': 'monday',
      'tuesday': 'tuesday',
      'tue': 'tuesday',
      'wednesday': 'wednesday',
      'wed': 'wednesday',
      'thursday': 'thursday',
      'thu': 'thursday',
      'friday': 'friday',
      'fri': 'friday',
      'saturday': 'saturday',
      'sat': 'saturday',
      'sunday': 'sunday',
      'sun': 'sunday'
    };

    return dayMap[day.toLowerCase()] || null;
  }

  /**
   * Parse platforms from string
   */
  parsePlatforms(platformString) {
    if (!platformString) return ['linkedin', 'twitter'];
    
    const platforms = [];
    const lower = platformString.toLowerCase();
    
    if (lower.includes('linkedin')) platforms.push('linkedin');
    if (lower.includes('facebook')) platforms.push('facebook');
    if (lower.includes('twitter') || lower.includes('x')) platforms.push('twitter');
    if (lower.includes('instagram')) platforms.push('instagram');
    
    return platforms.length > 0 ? platforms : ['linkedin', 'twitter'];
  }

  /**
   * Process file based on extension
   */
  async processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.xlsx':
      case '.xls':
        return await this.processExcel(filePath);
      case '.csv':
        return await this.processCSV(filePath);
      case '.docx':
        return await this.processDOCX(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Generate Excel template
   */
  generateExcelTemplate() {
    const templateData = [
      {
        'Day': 'Monday',
        'Topic': 'AI in Healthcare',
        'Short Explanation': 'How AI improves diagnosis accuracy',
        'Platform': 'LinkedIn, Twitter'
      },
      {
        'Day': 'Tuesday',
        'Topic': 'Startup Growth',
        'Short Explanation': 'Tips for early-stage founders',
        'Platform': 'Twitter'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Schedule');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new FileProcessor();

