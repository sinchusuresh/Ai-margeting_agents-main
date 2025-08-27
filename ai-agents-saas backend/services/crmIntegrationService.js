const axios = require('axios');
require('dotenv').config();

class CRMIntegrationService {
  constructor() {
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY;
    this.salesforceAccessToken = process.env.SALESFORCE_ACCESS_TOKEN;
    this.salesforceInstanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    this.pipedriveApiKey = process.env.PIPEDRIVE_API_KEY;
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
  }

  // HubSpot Integration
  async createHubSpotContact(prospectData, campaignData) {
    try {
      if (!this.hubspotApiKey) {
        throw new Error('HubSpot API key not configured');
      }

      const contactData = {
        properties: {
          firstname: this.extractFirstName(prospectData.prospectName),
          lastname: this.extractLastName(prospectData.prospectName),
          company: prospectData.companyInfo?.companyName || '',
          jobtitle: prospectData.linkedinProfile?.headline || '',
          phone: prospectData.companyInfo?.contactInfo?.phones?.[0] || '',
          email: prospectData.companyInfo?.contactInfo?.emails?.[0] || '',
          industry: prospectData.companyInfo?.industry || '',
          company_size: prospectData.companyInfo?.estimatedSize || '',
          linkedin_url: prospectData.linkedinUrl || '',
          website: prospectData.companyWebsite || '',
          hs_lead_status: 'NEW',
          campaign_name: campaignData.campaignName,
          campaign_goal: campaignData.campaignGoal,
          value_proposition: campaignData.valueProposition
        }
      };

      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Create deal for the campaign
      if (response.data.id) {
        await this.createHubSpotDeal(response.data.id, prospectData, campaignData);
      }

      return {
        success: true,
        contactId: response.data.id,
        message: 'Contact created successfully in HubSpot'
      };

    } catch (error) {
      console.error('HubSpot integration error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createHubSpotDeal(contactId, prospectData, campaignData) {
    try {
      const dealData = {
        properties: {
          dealname: `Cold Outreach - ${prospectData.prospectName || 'Prospect'}`,
          amount: '0',
          dealstage: 'appointmentscheduled',
          pipeline: 'default',
          hs_contact_id: contactId,
          campaign_name: campaignData.campaignName,
          target_role: campaignData.targetRole,
          industry: campaignData.industry
        }
      };

      await axios.post(
        'https://api.hubapi.com/crm/v3/objects/deals',
        dealData,
        {
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('HubSpot deal creation error:', error.message);
    }
  }

  // Salesforce Integration
  async createSalesforceLead(prospectData, campaignData) {
    try {
      if (!this.salesforceAccessToken || !this.salesforceInstanceUrl) {
        throw new Error('Salesforce credentials not configured');
      }

      const leadData = {
        FirstName: this.extractFirstName(prospectData.prospectName),
        LastName: this.extractLastName(prospectData.prospectName),
        Company: prospectData.companyInfo?.companyName || '',
        Title: prospectData.linkedinProfile?.headline || '',
        Phone: prospectData.companyInfo?.contactInfo?.phones?.[0] || '',
        Email: prospectData.companyInfo?.contactInfo?.emails?.[0] || '',
        Industry: prospectData.companyInfo?.industry || '',
        Company_Size__c: prospectData.companyInfo?.estimatedSize || '',
        LinkedIn_URL__c: prospectData.linkedinUrl || '',
        Website: prospectData.companyWebsite || '',
        LeadSource: 'Cold Outreach',
        Status: 'New',
        Campaign_Name__c: campaignData.campaignName,
        Campaign_Goal__c: campaignData.campaignGoal,
        Value_Proposition__c: campaignData.valueProposition
      };

      const response = await axios.post(
        `${this.salesforceInstanceUrl}/services/data/v58.0/sobjects/Lead`,
        leadData,
        {
          headers: {
            'Authorization': `Bearer ${this.salesforceAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        leadId: response.data.id,
        message: 'Lead created successfully in Salesforce'
      };

    } catch (error) {
      console.error('Salesforce integration error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Pipedrive Integration
  async createPipedrivePerson(prospectData, campaignData) {
    try {
      if (!this.pipedriveApiKey) {
        throw new Error('Pipedrive API key not configured');
      }

      const personData = {
        name: prospectData.prospectName || 'Prospect',
        email: prospectData.companyInfo?.contactInfo?.emails?.[0] || '',
        phone: prospectData.companyInfo?.contactInfo?.phones?.[0] || '',
        org_name: prospectData.companyInfo?.companyName || '',
        title: prospectData.linkedinProfile?.headline || '',
        linkedin_url: prospectData.linkedinUrl || '',
        website: prospectData.companyWebsite || '',
        custom_fields: {
          industry: prospectData.companyInfo?.industry || '',
          company_size: prospectData.companyInfo?.estimatedSize || '',
          campaign_name: campaignData.campaignName,
          campaign_goal: campaignData.campaignGoal,
          value_proposition: campaignData.valueProposition
        }
      };

      const response = await axios.post(
        'https://api.pipedrive.com/v1/persons',
        personData,
        {
          headers: {
            'Authorization': `Bearer ${this.pipedriveApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Create deal
      if (response.data.data?.id) {
        await this.createPipedriveDeal(response.data.data.id, prospectData, campaignData);
      }

      return {
        success: true,
        personId: response.data.data?.id,
        message: 'Person created successfully in Pipedrive'
      };

    } catch (error) {
      console.error('Pipedrive integration error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPipedriveDeal(personId, prospectData, campaignData) {
    try {
      const dealData = {
        title: `Cold Outreach - ${prospectData.prospectName || 'Prospect'}`,
        person_id: personId,
        stage_id: 1, // New
        value: 0,
        currency: 'USD',
        custom_fields: {
          campaign_name: campaignData.campaignName,
          target_role: campaignData.targetRole,
          industry: campaignData.industry
        }
      };

      await axios.post(
        'https://api.pipedrive.com/v1/deals',
        dealData,
        {
          headers: {
            'Authorization': `Bearer ${this.pipedriveApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Pipedrive deal creation error:', error.message);
    }
  }

  // Mailmerge and Email Campaign
  async sendMailmergeCampaign(prospects, campaignData, emailTemplates) {
    try {
      if (!this.sendgridApiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const results = [];
      
      for (const prospect of prospects) {
        try {
          // Personalize email template
          const personalizedEmail = this.personalizeEmailTemplate(
            emailTemplates.email,
            prospect,
            campaignData
          );

          const personalizedSubject = this.personalizeEmailTemplate(
            emailTemplates.subject,
            prospect,
            campaignData
          );

          // Send email via SendGrid
          const emailData = {
            personalizations: [{
              to: [{ email: prospect.email, name: prospect.prospectName }],
              subject: personalizedSubject,
              custom_args: {
                prospect_id: prospect.id,
                campaign_id: campaignData.campaignId
              }
            }],
            from: { email: campaignData.fromEmail, name: campaignData.fromName },
            content: [{
              type: 'text/html',
              value: personalizedEmail
            }]
          };

          const response = await axios.post(
            'https://api.sendgrid.com/v3/mail/send',
            emailData,
            {
              headers: {
                'Authorization': `Bearer ${this.sendgridApiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          results.push({
            prospect: prospect.prospectName,
            email: prospect.email,
            success: true,
            messageId: response.data.id
          });

          // Add delay to avoid rate limiting
          await this.delay(1000);

        } catch (error) {
          results.push({
            prospect: prospect.prospectName,
            email: prospect.email,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      };

    } catch (error) {
      console.error('Mailmerge campaign error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Google Sheets Integration
  async exportToGoogleSheets(prospects, campaignData, emailTemplates) {
    try {
      // This would integrate with Google Sheets API
      // For now, return structured data for manual import
      
      const sheetData = {
        spreadsheetId: null,
        sheets: [
          {
            title: 'Prospects',
            data: prospects.map(prospect => ({
              'Prospect Name': prospect.prospectName,
              'Email': prospect.email,
              'Company': prospect.companyName,
              'Role': prospect.role,
              'LinkedIn URL': prospect.linkedinUrl,
              'Company Website': prospect.companyWebsite,
              'Campaign': campaignData.campaignName,
              'Status': 'New'
            }))
          },
          {
            title: 'Email Sequence',
            data: [
              {
                'Email #': 1,
                'Subject': emailTemplates.email1.subject,
                'Content': emailTemplates.email1.content,
                'Timing': 'Day 1',
                'Purpose': 'Initial outreach'
              },
              {
                'Email #': 2,
                'Subject': emailTemplates.email2.subject,
                'Content': emailTemplates.email2.content,
                'Timing': 'Day 3',
                'Purpose': 'Follow-up with value'
              },
              {
                'Email #': 3,
                'Subject': emailTemplates.email3.subject,
                'Content': emailTemplates.email3.content,
                'Timing': 'Day 7',
                'Purpose': 'Final attempt'
              }
            ]
          },
          {
            title: 'Campaign Analytics',
            data: [
              {
                'Metric': 'Total Prospects',
                'Value': prospects.length
              },
              {
                'Metric': 'Campaign Goal',
                'Value': campaignData.campaignGoal
              },
              {
                'Metric': 'Expected Open Rate',
                'Value': '25-35%'
              },
              {
                'Metric': 'Expected Response Rate',
                'Value': '5-8%'
              }
            ]
          }
        ]
      };

      return {
        success: true,
        data: sheetData,
        message: 'Data prepared for Google Sheets import',
        instructions: 'Copy the data from each sheet and paste into your Google Sheets'
      };

    } catch (error) {
      console.error('Google Sheets export error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  }

  extractLastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  personalizeEmailTemplate(template, prospect, campaignData) {
    let personalized = template;
    
    // Replace placeholders with actual data
    const replacements = {
      '{{prospect_name}}': prospect.prospectName || 'there',
      '{{company_name}}': prospect.companyName || 'your company',
      '{{role}}': prospect.role || 'your role',
      '{{industry}}': prospect.industry || 'your industry',
      '{{campaign_goal}}': campaignData.campaignGoal || 'our conversation',
      '{{value_proposition}}': campaignData.valueProposition || 'our solution',
      '{{sender_name}}': campaignData.fromName || 'Our Team'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value);
    });

    return personalized;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get available CRM integrations
  getAvailableIntegrations() {
    const integrations = [];

    if (this.hubspotApiKey) {
      integrations.push({
        name: 'HubSpot',
        type: 'CRM',
        status: 'Configured',
        features: ['Contact Creation', 'Deal Creation', 'Campaign Tracking']
      });
    }

    if (this.salesforceAccessToken) {
      integrations.push({
        name: 'Salesforce',
        type: 'CRM',
        status: 'Configured',
        features: ['Lead Creation', 'Campaign Tracking', 'Custom Fields']
      });
    }

    if (this.pipedriveApiKey) {
      integrations.push({
        name: 'Pipedrive',
        type: 'CRM',
        status: 'Configured',
        features: ['Person Creation', 'Deal Creation', 'Pipeline Management']
      });
    }

    if (this.sendgridApiKey) {
      integrations.push({
        name: 'SendGrid',
        type: 'Email',
        status: 'Configured',
        features: ['Mailmerge Campaigns', 'Email Tracking', 'Template Management']
      });
    }

    return integrations;
  }
}

module.exports = CRMIntegrationService;
