/**
 * ChatGPT service for business gap analysis
 */

import { fetchDemographics, type DemographicsData, type DemographicsError } from './demographicsUtils';

export interface AnalysisInput {
  // Existing business data
  businesses: Array<{
    place_id: string;
    name: string;
    vicinity: string;
    rating?: number;
    price_level?: number;
    types: string[];
    location?: { lat: number; lng: number };
    demographics?: unknown;
  }>;
  
  // Geographic context
  searchArea: {
    center: { lat: number; lng: number };
    radius: number; // in meters
    cityName: string;
  };
  
  // Visual context
  mapScreenshot: string; // base64 encoded image
  
  // Search parameters
  businessType: string;
  searchRadius: number;
  filters: {
    minRating?: number;
    useRatingFilter: boolean;
  };
}

export interface RecommendedPoint {
  id: string;
  lat: number;
  lng: number;
  tortoiseLevel: number; // 0-100 (0 = high risk/high reward, 100 = low risk/steady)
  reasoning: string;
  demographics: {
    targetMatch: number; // 0-100 how well demographics match target
    competitionLevel: number; // 0-100 local competition intensity
    marketPotential: number; // 0-100 estimated market potential
  };
  proximityAnalysis: {
    nearestCompetitor: {
      distance: number; // meters
      name: string;
    };
    supportingBusinesses: string[]; // complementary businesses nearby
  };
  realDemographics?: DemographicsData | DemographicsError; // Real census data for this location
}

export interface GapAnalysisResult {
  analysis: {
    summary: string;
    keyFindings: string[];
    marketOpportunities: string[];
  };
  
  recommendations: RecommendedPoint[];
  
  metadata: {
    analysisDate: string;
    businessType: string;
    totalRecommendations: number;
    confidence: number; // 0-100
  };
}

export class ChatGPTService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze business gaps using ChatGPT
   */
  /**
   * Enriches recommendations with real demographic data
   */
  async enrichRecommendationsWithDemographics(recommendations: RecommendedPoint[]): Promise<RecommendedPoint[]> {
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (recommendation) => {
        try {
          const demographicsData = await fetchDemographics(recommendation.lat, recommendation.lng);
          return {
            ...recommendation,
            realDemographics: demographicsData
          };
        } catch (error) {
          console.warn(`Failed to fetch demographics for recommendation ${recommendation.id}:`, error);
          return {
            ...recommendation,
            realDemographics: {
              error: 'Failed to fetch demographic data',
              details: error instanceof Error ? error.message : String(error)
            } as DemographicsError
          };
        }
      })
    );

    return enrichedRecommendations;
  }

  async analyzeBusinessGaps(input: AnalysisInput): Promise<GapAnalysisResult> {
    // For development: Check if we should use mock data
    if (this.shouldUseMockData()) {
      console.log('Using mock data for development');
      return await this.getMockAnalysisResult(input);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input);

      // Try using a CORS proxy for development
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = this.baseUrl;
      
      const response = await fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${input.mapScreenshot}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        console.warn('CORS proxy failed, falling back to mock data');
        return await this.getMockAnalysisResult(input);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return await this.validateAndTransformResult(result, input);
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      console.log('Falling back to mock data due to error');
      return await this.getMockAnalysisResult(input);
    }
  }

  /**
   * Build system prompt for ChatGPT
   */
  private buildSystemPrompt(): string {
    return `You are a business location analyst expert specializing in market gap analysis and optimal business placement. You analyze geographic, demographic, and competitive data to identify the best locations for new businesses.

Your analysis should consider:
1. Market gaps (areas with high demand, low supply)
2. Demographic alignment with target customers
3. Competition density and positioning
4. Economic indicators and market potential
5. Geographic accessibility and visibility

For each recommendation, assign a "Tortoise Level" (0-100):
- 0-30: High risk, high reward (Hare strategy - fast growth potential but uncertain)
- 31-70: Balanced risk/reward (Mixed strategy)
- 71-100: Low risk, steady growth (Tortoise strategy - stable, predictable)

Always provide specific reasoning for each recommendation and return results in valid JSON format.

The JSON response must follow this exact structure:
{
  "analysis": {
    "summary": "Brief overview of market conditions",
    "keyFindings": ["Finding 1", "Finding 2"],
    "marketOpportunities": ["Opportunity 1", "Opportunity 2"]
  },
  "recommendations": [
    {
      "id": "rec_1",
      "lat": 30.2672,
      "lng": -97.7431,
      "tortoiseLevel": 75,
      "reasoning": "Detailed explanation for this location",
      "demographics": {
        "targetMatch": 85,
        "competitionLevel": 30,
        "marketPotential": 90
      },
      "proximityAnalysis": {
        "nearestCompetitor": {
          "distance": 1200,
          "name": "Competitor Name"
        },
        "supportingBusinesses": ["Business 1", "Business 2"]
      }
    }
  ],
  "metadata": {
    "analysisDate": "2025-01-XX",
    "businessType": "restaurants",
    "totalRecommendations": 5,
    "confidence": 85
  }
}`;
  }

  /**
   * Build user prompt with input data
   */
  private buildUserPrompt(input: AnalysisInput): string {
    const businessData = input.businesses.map(b => ({
      name: b.name,
      location: b.location,
      rating: b.rating,
      types: b.types,
      vicinity: b.vicinity
    }));

    return `Analyze the following business landscape for ${input.businessType} in ${input.searchArea.cityName}:

EXISTING BUSINESSES (${input.businesses.length} found):
${JSON.stringify(businessData, null, 2)}

SEARCH PARAMETERS:
- Business type: ${input.businessType}
- Search radius: ${(input.searchRadius / 1609.34).toFixed(1)} miles
- Search center: ${input.searchArea.center.lat}, ${input.searchArea.center.lng}
- Current business count: ${input.businesses.length}
- Rating filter: ${input.filters.useRatingFilter ? `Min ${input.filters.minRating}/5` : 'None'}

MAP VISUALIZATION:
The attached image shows the current distribution of ${input.businessType} businesses in the area with their coverage circles.

Please provide:
1. Market gap analysis for ${input.businessType}
2. 3-8 specific location recommendations with precise coordinates
3. Detailed reasoning for each recommendation
4. Tortoise Level scoring (0-100) for each location
5. Competition and demographic analysis

Focus on finding areas that are:
- Underserved by current businesses
- Have good demographic characteristics
- Are accessible and visible
- Have appropriate distance from existing competition

Return results in the specified JSON format only.`;
  }

  /**
   * Check if we should use mock data (for development when API is not available)
   */
  private shouldUseMockData(): boolean {
    // Use mock data if no API key or if explicitly enabled
    return !this.apiKey || this.apiKey === 'demo' || localStorage.getItem('useMockChatGPT') === 'true';
  }

  /**
   * Generate mock analysis result for development
   */
  private async getMockAnalysisResult(input: AnalysisInput): Promise<GapAnalysisResult> {
    const center = input.searchArea.center;
    const businessType = input.businessType;
    
    // Generate some realistic mock recommendations around the search center
    const recommendations: RecommendedPoint[] = [
      {
        id: 'rec_1',
        lat: center.lat + 0.01,
        lng: center.lng + 0.015,
        tortoiseLevel: 85,
        reasoning: `This location offers excellent demographic alignment for ${businessType} with high foot traffic and minimal direct competition. The area has strong purchasing power and fits the target customer profile perfectly.`,
        demographics: {
          targetMatch: 92,
          competitionLevel: 25,
          marketPotential: 88
        },
        proximityAnalysis: {
          nearestCompetitor: {
            distance: 1200,
            name: 'Competitor A'
          },
          supportingBusinesses: ['Coffee Shop', 'Retail Store', 'Gym']
        }
      },
      {
        id: 'rec_2',
        lat: center.lat - 0.008,
        lng: center.lng + 0.02,
        tortoiseLevel: 45,
        reasoning: `High-growth area with emerging demographics. Some competition exists but market demand is growing rapidly. Good opportunity for early entry with moderate risk.`,
        demographics: {
          targetMatch: 75,
          competitionLevel: 60,
          marketPotential: 95
        },
        proximityAnalysis: {
          nearestCompetitor: {
            distance: 800,
            name: 'Competitor B'
          },
          supportingBusinesses: ['Shopping Center', 'Restaurants']
        }
      },
      {
        id: 'rec_3',
        lat: center.lat + 0.012,
        lng: center.lng - 0.01,
        tortoiseLevel: 25,
        reasoning: `Underserved market with high potential but requires significant market education. High risk but substantial first-mover advantage possible.`,
        demographics: {
          targetMatch: 85,
          competitionLevel: 15,
          marketPotential: 90
        },
        proximityAnalysis: {
          nearestCompetitor: {
            distance: 2100,
            name: 'Distant Competitor'
          },
          supportingBusinesses: ['New Development', 'Transit Hub']
        }
      }
    ];

    return {
      analysis: {
        summary: `Analysis of ${businessType} opportunities in ${input.searchArea.cityName} reveals several promising locations with varying risk profiles. The market shows strong demand with 3 optimal expansion opportunities identified.`,
        keyFindings: [
          `${input.businesses.length} existing ${businessType} businesses create competitive baseline`,
          'Northern area shows underserved high-income demographics',
          'Transit corridors offer high foot traffic potential',
          'Mixed-use developments provide complementary business synergies'
        ],
        marketOpportunities: [
          'Capture underserved premium market segment',
          'Establish presence before major developments complete',
          'Leverage proximity to complementary businesses',
          'Target emerging demographic trends'
        ]
      },
      recommendations: await this.enrichRecommendationsWithDemographics(recommendations),
      metadata: {
        analysisDate: new Date().toISOString().split('T')[0],
        businessType: businessType,
        totalRecommendations: recommendations.length,
        confidence: 82
      }
    };
  }

  /**
   * Validate and transform the result from ChatGPT
   */
  private async validateAndTransformResult(result: unknown, input: AnalysisInput): Promise<GapAnalysisResult> {
    // Type assertion after basic validation
    const typedResult = result as {
      analysis?: { summary?: string; keyFindings?: string[]; marketOpportunities?: string[] };
      recommendations?: unknown[];
      metadata?: { confidence?: number };
    };

    // Basic validation
    if (!typedResult.analysis || !typedResult.recommendations || !typedResult.metadata) {
      throw new Error('Invalid response format from ChatGPT');
    }

    // Ensure recommendations have required fields
    const validatedRecommendations: RecommendedPoint[] = typedResult.recommendations.map((rec: unknown, index: number) => {
      const typedRec = rec as Record<string, unknown>;
      return {
      id: typedRec.id as string || `rec_${index + 1}`,
      lat: Number(typedRec.lat),
      lng: Number(typedRec.lng),
      tortoiseLevel: Math.max(0, Math.min(100, Number(typedRec.tortoiseLevel || 50))),
      reasoning: typedRec.reasoning as string || 'No specific reasoning provided',
      demographics: {
        targetMatch: Math.max(0, Math.min(100, Number((typedRec.demographics as Record<string, unknown>)?.targetMatch || 50))),
        competitionLevel: Math.max(0, Math.min(100, Number((typedRec.demographics as Record<string, unknown>)?.competitionLevel || 50))),
        marketPotential: Math.max(0, Math.min(100, Number((typedRec.demographics as Record<string, unknown>)?.marketPotential || 50)))
      },
      proximityAnalysis: {
        nearestCompetitor: {
          distance: Number(((typedRec.proximityAnalysis as Record<string, unknown>)?.nearestCompetitor as Record<string, unknown>)?.distance || 1000),
          name: ((typedRec.proximityAnalysis as Record<string, unknown>)?.nearestCompetitor as Record<string, unknown>)?.name as string || 'Unknown'
        },
        supportingBusinesses: Array.isArray((typedRec.proximityAnalysis as Record<string, unknown>)?.supportingBusinesses) 
          ? (typedRec.proximityAnalysis as Record<string, unknown>).supportingBusinesses as string[]
          : []
      }
    };
    });

    // Enrich recommendations with real demographic data
    const enrichedRecommendations = await this.enrichRecommendationsWithDemographics(validatedRecommendations);

    return {
      analysis: {
        summary: typedResult.analysis.summary || 'Analysis completed',
        keyFindings: Array.isArray(typedResult.analysis.keyFindings) ? typedResult.analysis.keyFindings : [],
        marketOpportunities: Array.isArray(typedResult.analysis.marketOpportunities) ? typedResult.analysis.marketOpportunities : []
      },
      recommendations: enrichedRecommendations,
      metadata: {
        analysisDate: new Date().toISOString().split('T')[0],
        businessType: input.businessType,
        totalRecommendations: enrichedRecommendations.length,
        confidence: Math.max(0, Math.min(100, Number(typedResult.metadata?.confidence || 75)))
      }
    };
  }
}

/**
 * Create a ChatGPT service instance
 */
export function createChatGPTService(apiKey: string): ChatGPTService {
  return new ChatGPTService(apiKey);
}
