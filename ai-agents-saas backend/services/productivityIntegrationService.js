const axios = require('axios');

class ProductivityIntegrationService {
  constructor() {
    this.googleCalendarApiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    this.googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY;
    this.notionApiKey = process.env.NOTION_API_KEY;
    this.notionDatabaseId = process.env.NOTION_DATABASE_ID;
    this.clickupApiKey = process.env.CLICKUP_API_KEY;
    this.clickupWorkspaceId = process.env.CLICKUP_WORKSPACE_ID;
    this.outlookClientId = process.env.OUTLOOK_CLIENT_ID;
    this.outlookClientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  }

  // Google Calendar Integration
  async createGoogleCalendarEvents(launchData, calendarId = 'primary') {
    try {
      if (!this.googleCalendarApiKey) {
        throw new Error('Google Calendar API key not configured');
      }

      const events = this.transformLaunchDataToCalendarEvents(launchData);
      const createdEvents = [];

      for (const event of events) {
        try {
          const response = await axios.post(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${this.googleCalendarApiKey}`,
            event,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.googleCalendarApiKey}`
              }
            }
          );
          createdEvents.push(response.data);
        } catch (error) {
          console.error(`Failed to create calendar event: ${event.summary}`, error.message);
        }
      }

      return {
        success: true,
        message: `Successfully created ${createdEvents.length} calendar events`,
        events: createdEvents,
        calendarId: calendarId
      };
    } catch (error) {
      console.error('Google Calendar integration error:', error.message);
      return {
        success: false,
        message: 'Failed to create calendar events',
        error: error.message,
        fallback: this.generateICalFile(launchData)
      };
    }
  }

  // Transform launch data to Google Calendar events
  transformLaunchDataToCalendarEvents(launchData) {
    const events = [];
    const baseDate = new Date(launchData.launchDate || new Date());
    
    // Pre-launch events
    if (launchData.timeline) {
      launchData.timeline.forEach((phase, index) => {
        if (phase.activities && phase.activities.length > 0) {
          phase.activities.forEach((activity, actIndex) => {
            const eventDate = new Date(baseDate);
            eventDate.setDate(eventDate.getDate() - (8 - index * 2) * 7 + actIndex * 2);
            
            events.push({
              summary: `🚀 ${activity}`,
              description: `Phase: ${phase.phase}\nDeliverables: ${phase.deliverables?.join(', ') || 'N/A'}\nKPIs: ${phase.kpis?.join(', ') || 'N/A'}`,
              start: {
                dateTime: eventDate.toISOString(),
                timeZone: 'UTC'
              },
              end: {
                dateTime: new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                timeZone: 'UTC'
              },
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'email', minutes: 24 * 60 },
                  { method: 'popup', minutes: 60 }
                ]
              }
            });
          });
        }
      });
    }

    // Launch day event
    events.push({
      summary: `🎉 LAUNCH DAY: ${launchData.productName || 'Product'}`,
      description: `Product Launch Day!\n\nSocial Posts: ${launchData.socialMediaPosts?.launch || 'Launch post'}\n\nPress Release: ${launchData.pressRelease || 'Press release content'}`,
      start: {
        dateTime: baseDate.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC'
      },
      colorId: '1', // Red color for launch day
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 0 }
        ]
      }
    });

    return events;
  }

  // Generate iCal file as fallback
  generateICalFile(launchData) {
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Product Launch Agent//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

    const baseDate = new Date(launchData.launchDate || new Date());
    
    // Add launch day event
    const launchDate = baseDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    icalContent += `
BEGIN:VEVENT
UID:launch-${Date.now()}@productlaunch.com
DTSTART:${launchDate}
DTEND:${launchDate}
SUMMARY:🚀 LAUNCH DAY: ${launchData.productName || 'Product'}
DESCRIPTION:Product Launch Day! ${launchData.socialMediaPosts?.launch || 'Launch post'}
END:VEVENT`;

    // Add timeline events
    if (launchData.timeline) {
      launchData.timeline.forEach((phase, index) => {
        if (phase.activities && phase.activities.length > 0) {
          phase.activities.forEach((activity, actIndex) => {
            const eventDate = new Date(baseDate);
            eventDate.setDate(eventDate.getDate() - (8 - index * 2) * 7 + actIndex * 2);
            const eventDateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            icalContent += `
BEGIN:VEVENT
UID:timeline-${index}-${actIndex}-${Date.now()}@productlaunch.com
DTSTART:${eventDateStr}
DTEND:${eventDateStr}
SUMMARY:🚀 ${activity}
DESCRIPTION:Phase: ${phase.phase}
END:VEVENT`;
          });
        }
      });
    }

    icalContent += `
END:VCALENDAR`;

    return {
      type: 'text/calendar',
      filename: `product-launch-${launchData.productName || 'calendar'}.ics`,
      content: icalContent
    };
  }

  // Notion Integration
  async exportToNotion(launchData) {
    try {
      if (!this.notionApiKey || !this.notionDatabaseId) {
        throw new Error('Notion API key or database ID not configured');
      }

      const notionData = this.transformLaunchDataToNotion(launchData);
      
      const response = await axios.post(
        'https://api.notion.com/v1/pages',
        notionData,
        {
          headers: {
            'Authorization': `Bearer ${this.notionApiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Successfully exported to Notion',
        notionPageId: response.data.id,
        notionUrl: response.data.url
      };
    } catch (error) {
      console.error('Notion export error:', error.message);
      return {
        success: false,
        message: 'Failed to export to Notion',
        error: error.message,
        fallback: this.generateNotionTemplate(launchData)
      };
    }
  }

  // Transform launch data to Notion format
  transformLaunchDataToNotion(launchData) {
    const timelineBlocks = launchData.timeline?.map(phase => 
      `**${phase.phase}** (${phase.timeline})\n` +
      `Activities: ${phase.activities?.join(', ') || 'N/A'}\n` +
      `Deliverables: ${phase.deliverables?.join(', ') || 'N/A'}\n` +
      `KPIs: ${phase.kpis?.join(', ') || 'N/A'}\n\n`
    ).join('') || '';

    const emailBlocks = Object.entries(launchData.emailCampaigns || {}).map(([key, content]) =>
      `**${key.charAt(0).toUpperCase() + key.slice(1)} Email:**\n${content}\n\n`
    ).join('');

    const socialBlocks = Object.entries(launchData.socialMediaPosts || {}).map(([key, content]) =>
      `**${key.charAt(0).toUpperCase() + key.slice(1)} Post:**\n${content}\n\n`
    ).join('');

    return {
      parent: { database_id: this.notionDatabaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: `🚀 Product Launch: ${launchData.productName || 'Product'}`
              }
            }
          ]
        },
        'Launch Date': {
          date: {
            start: launchData.launchDate || new Date().toISOString().split('T')[0]
          }
        },
        'Product Type': {
          select: {
            name: launchData.productType || 'SaaS'
          }
        },
        'Target Audience': {
          rich_text: [
            {
              text: {
                content: launchData.targetAudience || 'Business users'
              }
            }
          ]
        },
        'Budget': {
          rich_text: [
            {
              text: {
                content: launchData.budget || '$50,000'
              }
            }
          ]
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📅 Launch Timeline' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: timelineBlocks } }]
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📧 Email Campaigns' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: emailBlocks } }]
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📱 Social Media Posts' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: socialBlocks } }]
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📰 Press Release' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: launchData.pressRelease || 'Press release content' } }]
          }
        }
      ]
    };
  }

  // Generate Notion template as fallback
  generateNotionTemplate(launchData) {
    return {
      type: 'text/markdown',
      filename: `notion-template-${launchData.productName || 'product'}.md`,
      content: `# 🚀 Product Launch: ${launchData.productName || 'Product'}

## 📅 Launch Timeline
${launchData.timeline?.map(phase => 
  `### ${phase.phase} (${phase.timeline})
- **Activities:** ${phase.activities?.join(', ') || 'N/A'}
- **Deliverables:** ${phase.deliverables?.join(', ') || 'N/A'}
- **KPIs:** ${phase.kpis?.join(', ') || 'N/A'}`
).join('\n\n') || 'N/A'}

## 📧 Email Campaigns
${Object.entries(launchData.emailCampaigns || {}).map(([key, content]) =>
  `### ${key.charAt(0).toUpperCase() + key.slice(1)} Email
${content}`
).join('\n\n') || 'N/A'}

## 📱 Social Media Posts
${Object.entries(launchData.socialMediaPosts || {}).map(([key, content]) =>
  `### ${key.charAt(0).toUpperCase() + key.slice(1)} Post
${content}`
).join('\n\n') || 'N/A'}

## 📰 Press Release
${launchData.pressRelease || 'Press release content'}

---
*Copy this content into your Notion database manually*`
    };
  }

  // Google Sheets Integration
  async exportToGoogleSheets(launchData) {
    try {
      if (!this.googleSheetsApiKey) {
        throw new Error('Google Sheets API key not configured');
      }

      const sheetsData = this.transformLaunchDataToSheets(launchData);
      
      // For now, return structured data for manual import
      // In production, this would create actual Google Sheets
      return {
        success: true,
        message: 'Data prepared for Google Sheets import',
        sheetsData: sheetsData,
        instructions: 'Copy the data from each sheet and paste into your Google Sheets'
      };
    } catch (error) {
      console.error('Google Sheets export error:', error.message);
      return {
        success: false,
        message: 'Failed to export to Google Sheets',
        error: error.message,
        fallback: this.generateCSVExport(launchData)
      };
    }
  }

  // Transform launch data to Google Sheets format
  transformLaunchDataToSheets(launchData) {
    return {
      'Launch Overview': [
        ['Product Name', 'Product Type', 'Launch Date', 'Target Audience', 'Budget'],
        [
          launchData.productName || 'Product',
          launchData.productType || 'SaaS',
          launchData.launchDate || 'Q1 2024',
          launchData.targetAudience || 'Business users',
          launchData.budget || '$50,000'
        ]
      ],
      'Timeline': [
        ['Phase', 'Timeline', 'Activities', 'Deliverables', 'KPIs']
      ].concat(
        (launchData.timeline || []).map(phase => [
          phase.phase,
          phase.timeline,
          phase.activities?.join('; ') || 'N/A',
          phase.deliverables?.join('; ') || 'N/A',
          phase.kpis?.join('; ') || 'N/A'
        ])
      ),
      'Email Campaigns': [
        ['Campaign Type', 'Content']
      ].concat(
        Object.entries(launchData.emailCampaigns || {}).map(([key, content]) => [
          key.charAt(0).toUpperCase() + key.slice(1),
          content
        ])
      ),
      'Social Media Posts': [
        ['Post Type', 'Content']
      ].concat(
        Object.entries(launchData.socialMediaPosts || {}).map(([key, content]) => [
          key.charAt(0).toUpperCase() + key.slice(1),
          content
        ])
      ),
      'Content Calendar': [
        ['Week', 'Date', 'Platform', 'Content', 'Type']
      ].concat(
        (launchData.contentCalendar || []).flatMap(week => 
          week.content.map(item => [
            week.week,
            item.date,
            item.platform,
            item.content,
            item.type
          ])
        )
      )
    };
  }

  // Generate CSV export as fallback
  generateCSVExport(launchData) {
    const csvData = this.transformLaunchDataToSheets(launchData);
    let csvContent = '';

    Object.entries(csvData).forEach(([sheetName, data]) => {
      csvContent += `\n=== ${sheetName} ===\n`;
      data.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
    });

    return {
      type: 'text/csv',
      filename: `product-launch-${launchData.productName || 'data'}.csv`,
      content: csvContent
    };
  }

  // ClickUp Integration
  async exportToClickUp(launchData) {
    try {
      if (!this.clickupApiKey || !this.clickupWorkspaceId) {
        throw new Error('ClickUp API key or workspace ID not configured');
      }

      const clickupData = this.transformLaunchDataToClickUp(launchData);
      
      // Create tasks in ClickUp
      const createdTasks = [];
      for (const task of clickupData) {
        try {
          const response = await axios.post(
            `https://api.clickup.com/api/v2/list/${this.clickupWorkspaceId}/task`,
            task,
            {
              headers: {
                'Authorization': this.clickupApiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          createdTasks.push(response.data);
        } catch (error) {
          console.error(`Failed to create ClickUp task: ${task.name}`, error.message);
        }
      }

      return {
        success: true,
        message: `Successfully created ${createdTasks.length} tasks in ClickUp`,
        tasks: createdTasks
      };
    } catch (error) {
      console.error('ClickUp export error:', error.message);
      return {
        success: false,
        message: 'Failed to export to ClickUp',
        error: error.message,
        fallback: this.generateClickUpTemplate(launchData)
      };
    }
  }

  // Transform launch data to ClickUp format
  transformLaunchDataToClickUp(launchData) {
    const tasks = [];
    
    // Create main launch task
    tasks.push({
      name: `🚀 Launch: ${launchData.productName || 'Product'}`,
      description: `Product Launch Campaign\n\nTarget Audience: ${launchData.targetAudience || 'Business users'}\nBudget: ${launchData.budget || '$50,000'}\nLaunch Date: ${launchData.launchDate || 'Q1 2024'}`,
      status: 'in progress',
      priority: 1,
      due_date: new Date(launchData.launchDate || Date.now() + 30 * 24 * 60 * 60 * 1000).getTime()
    });

    // Create timeline tasks
    if (launchData.timeline) {
      launchData.timeline.forEach((phase, index) => {
        if (phase.activities && phase.activities.length > 0) {
          phase.activities.forEach((activity, actIndex) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - (8 - index * 2) * 7 + actIndex * 2);
            
            tasks.push({
              name: `📋 ${activity}`,
              description: `Phase: ${phase.phase}\nDeliverables: ${phase.deliverables?.join(', ') || 'N/A'}\nKPIs: ${phase.kpis?.join(', ') || 'N/A'}`,
              status: 'to do',
              priority: 2,
              due_date: dueDate.getTime(),
              parent: tasks[0].id // Link to main launch task
            });
          });
        }
      });
    }

    return tasks;
  }

  // Generate ClickUp template as fallback
  generateClickUpTemplate(launchData) {
    return {
      type: 'text/markdown',
      filename: `clickup-template-${launchData.productName || 'product'}.md`,
      content: `# ClickUp Import Template

## Main Task
- **Name:** 🚀 Launch: ${launchData.productName || 'Product'}
- **Description:** Product Launch Campaign
- **Status:** In Progress
- **Priority:** High
- **Due Date:** ${launchData.launchDate || 'Q1 2024'}

## Subtasks
${launchData.timeline?.map(phase => 
  phase.activities?.map(activity => 
    `- **Name:** 📋 ${activity}\n  **Description:** Phase: ${phase.phase}\n  **Status:** To Do\n  **Priority:** Medium`
  ).join('\n')
).join('\n') || 'N/A'}

---
*Copy these tasks into ClickUp manually*`
    };
  }

  // Get available integrations
  getAvailableIntegrations() {
    return {
      googleCalendar: !!this.googleCalendarApiKey,
      googleSheets: !!this.googleSheetsApiKey,
      notion: !!this.notionApiKey && !!this.notionDatabaseId,
      clickUp: !!this.clickupApiKey && !!this.clickupWorkspaceId,
      outlook: !!this.outlookClientId && !!this.outlookClientSecret
    };
  }
}

module.exports = ProductivityIntegrationService;
