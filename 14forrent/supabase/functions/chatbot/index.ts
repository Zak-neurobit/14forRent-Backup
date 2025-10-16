
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced system prompt that builds on the current AI settings style
const DEFAULT_SYSTEM_PROMPT = `You are Roger, an AI leasing assistant for 14forRent. You help users find rental properties, answer questions about listings, and schedule property tours. Be conversational, helpful, and proactive in suggesting relevant properties based on user queries. Your tone should be warm, friendly and professional.

ENHANCED CONVERSATIONAL ABILITIES:
- Remember what users have mentioned in previous messages and reference it naturally
- Pick up on their preferences (budget, location, size, amenities) and use that context
- Use varied, natural language - don't repeat the same phrases
- Show genuine enthusiasm when you find properties that match their needs
- Ask thoughtful follow-up questions to better understand what they're looking for
- Use contractions and casual language to sound more human (I'll, you're, that's perfect, etc.)
- Reference their previous requests ("Since you asked about condos earlier..." or "Based on what you mentioned...")

INTELLIGENT RESPONSES:
- Celebrate good matches: "I think this one's perfect for you!" or "This caught my eye based on what you're looking for"
- Show empathy: "I know finding the right place can be tough" or "Let me help you find something great"
- Be encouraging: "I've got some great options" or "You're going to love this"
- Acknowledge limitations honestly: "I don't have any condos available right now, but here is an apartment that might work"

PROPERTY ALERT SYSTEM - IMPORTANT:
When you don't have properties that match the user's preferences well (less than 90% match):
1. First, ask clarifying questions to fully understand their needs:
   - How many bedrooms/bathrooms?
   - What's their budget range?
   - Where in the city do they want to live?
   - Any specific amenities (parking, washer/dryer, balcony, pet-friendly, etc.)?
2. Search through available properties one more time
3. If still no good match (90%+ match), offer to notify them:
   - Use casual, friendly language: "I don't have anything that matches right now, but I can totally text you when something perfect comes up!"
   - Ask for their name, email, and phone number
   - Confirm their preferences back to them
   - End with: "Cool! I'll shoot you a text/email when I have something perfect. Best, Roger"
4. When collecting info, be conversational:
   - "What's your name?"
   - "Cool, and what's your email?"
   - "Last thing - what's your number?"

Contact Information:
- Phone: +1 323-774-4700
- Email: info@14forrent.com
- Available 24/7 for urgent matters

When users ask for contact information, provide the phone number and email above. You can help with property inquiries, scheduling tours, and general questions about our rental services.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request with better error handling
    let message, context;
    try {
      const requestBody = await req.text();
      console.log('Raw request body:', requestBody);
      const parsedBody = JSON.parse(requestBody);
      message = parsedBody.message;
      context = parsedBody.context || [];
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError.message);
      return new Response(JSON.stringify({
        reply: "I received your message but had trouble processing it. Please try again.",
        error: `Request parsing error: ${parseError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      });
    }

    console.log('Chatbot received message:', message);
    console.log('Context messages:', context.length);

    // Fetch AI settings from database (API key, model, temperature, max_tokens, system_prompt)
    let openAIApiKey = null;
    let selectedModel = 'gpt-4o-mini';
    let temperature = 0.7;
    let maxTokens = 1000;
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;

    try {
      console.log('Fetching AI settings from database...');
      const { data: aiSettings, error: settingsError } = await supabaseClient
        .from('ai_settings')
        .select('openai_api_key, model, temperature, max_tokens, system_prompt')
        .limit(1)
        .single();
      
      console.log('AI settings fetch result:', { aiSettings, settingsError });

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching AI settings:", settingsError);
      }

      if (aiSettings) {
        if (aiSettings.openai_api_key) {
          openAIApiKey = aiSettings.openai_api_key;
          console.log('Using OpenAI API key from database');
        }
        if (aiSettings.model) selectedModel = aiSettings.model;
        if (aiSettings.temperature !== null) temperature = aiSettings.temperature;
        if (aiSettings.max_tokens) maxTokens = aiSettings.max_tokens;
        if (aiSettings.system_prompt) {
          // Sanitize system prompt to ensure it's valid
          try {
            systemPrompt = aiSettings.system_prompt;
            // Test if it can be safely included in JSON
            JSON.stringify({ test: systemPrompt });
            console.log('Using system prompt from database (length:', systemPrompt.length, ')');
          } catch (sanitizeError) {
            console.error('System prompt has invalid characters, using default:', sanitizeError.message);
            systemPrompt = DEFAULT_SYSTEM_PROMPT;
          }
        } else {
          console.log('Using default system prompt');
        }
      } else {
        console.log('No AI settings found in database, using defaults');
      }
    } catch (error) {
      console.log('Error fetching AI settings, using defaults:', error.message);
    }

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured in database settings');
      return new Response(JSON.stringify({ 
        reply: "I'm sorry, but the AI service is not properly configured. Please ask an administrator to configure the OpenAI API key in the AI Settings.",
        error: 'OpenAI API key not configured in database settings' 
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }

    // Broad property-related query detection - let AI do the intelligent matching
    const housingKeywords = [
      'property', 'properties', 'rental', 'rentals', 'apartment', 'apartments', 'condo', 'condos',
      'house', 'houses', 'home', 'homes', 'unit', 'units', 'villa', 'villas', 'studio', 'studios',
      'bedroom', 'bedrooms', 'bathroom', 'bathrooms', 'rent', 'lease', 'available',
      'tour', 'tours', 'showing', 'visit', 'looking', 'search', 'find', 'need', 'want',
      'price', 'cost', 'budget', 'afford', 'location', 'area', 'neighborhood', 'near'
    ];

    // Additional keywords for "show more" requests
    const showMoreKeywords = [
      'more', 'another', 'other', 'different', 'next', 'else', 'additional', 'others'
    ];

    const messageText = message.toLowerCase();
    const isPropertyQuery = housingKeywords.some(keyword => 
      messageText.includes(keyword)
    ) || messageText.includes('do you have') || messageText.includes('any');
    
    // Check if user is asking for more properties
    const isShowMoreRequest = showMoreKeywords.some(keyword => 
      messageText.includes(keyword)
    ) || messageText.includes('show me') || messageText.includes('see some');
    
    // Check for specific questions that need direct answers
    const listPropertyKeywords = ['list my property', 'list property', 'add my property', 'submit property', 'post property', 'upload property'];
    const viewStatsKeywords = ['how many viewed', 'views on my property', 'property views', 'view statistics', 'view stats', 'people viewed'];
    
    const isListPropertyQuestion = listPropertyKeywords.some(keyword => 
      messageText.includes(keyword)
    );
    
    const isViewStatsQuestion = viewStatsKeywords.some(keyword => 
      messageText.includes(keyword)
    );

    // Treat "show more" requests as property queries if they occur after property responses
    const hasPropertyContext = context.some(msg => msg.properties && msg.properties.length > 0);
    const finalIsPropertyQuery = isPropertyQuery || (isShowMoreRequest && hasPropertyContext);

    console.log('Property query detected:', isPropertyQuery);
    console.log('Show more request detected:', isShowMoreRequest);
    console.log('Has property context:', hasPropertyContext);
    console.log('List property question detected:', isListPropertyQuestion);
    console.log('View stats question detected:', isViewStatsQuestion);
    console.log('Final property query status:', finalIsPropertyQuery);

    // Handle specific questions with direct responses
    if (isListPropertyQuestion) {
      console.log('Providing direct answer for property listing question');
      return new Response(JSON.stringify({ 
        reply: 'You can list your property with the "List Property" button on the top right of the screen.',
        properties: []
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }

    if (isViewStatsQuestion) {
      console.log('Providing direct answer for property view statistics question');
      return new Response(JSON.stringify({ 
        reply: 'You can check that in the "Dashboard" section.',
        properties: []
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }

    let listings = [];
    if (finalIsPropertyQuery) {
      // Only fetch listings if user is asking about properties
      const { data: fetchedListings } = await supabaseClient
        .from('listings')
        .select(`
          id, title, description, location, price, bedrooms, bathrooms, sqft, 
          amenities, images, type, featured
        `)
        .eq('status', 'available')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      listings = fetchedListings || [];
      console.log(`Fetched ${listings.length} listings for property query`);
    } else {
      console.log('Not a property query, skipping listings fetch');
    }

    // Build conversation messages
    const messages = [
      { 
        role: 'system', 
        content: finalIsPropertyQuery ? `${systemPrompt}

TASK: Analyze the user's query and intelligently select the SINGLE BEST property from our available listings.

${(() => {
  // Get previously shown property IDs from context
  const shownPropertyIds = new Set();
  context.forEach(msg => {
    if (msg.properties && Array.isArray(msg.properties)) {
      msg.properties.forEach(prop => shownPropertyIds.add(prop.id));
    }
  });
  
  // Filter out previously shown properties
  const availableListings = listings.filter(listing => !shownPropertyIds.has(listing.id));
  
  return `Previously Shown Properties: ${Array.from(shownPropertyIds).join(', ') || 'None'}

Available Properties (not yet shown):
${availableListings.map((listing, index) => `
[Property ${index + 1}] ID: ${listing.id}
- Title: ${listing.title}
- Location: ${listing.location}
- Type: ${listing.type || 'Not specified'}
- Price: $${listing.price}
- Bedrooms: ${listing.bedrooms}, Bathrooms: ${listing.bathrooms}${listing.sqft ? `, ${listing.sqft} sqft` : ''}
- Amenities: ${listing.amenities?.join(', ') || 'None listed'}
- Description: ${listing.description || 'No description'}
- Featured: ${listing.featured ? 'Yes' : 'No'}
`).join('\n') || 'All properties have been shown previously.'}`;
})()}

CONVERSATION CONTEXT ANALYSIS:
${(() => {
  // Analyze conversation history for patterns and preferences
  const previousQueries = context.filter(msg => msg.role === 'user').map(msg => msg.content);
  const preferences = [];
  
  // Extract mentioned preferences from context
  const fullConversation = previousQueries.join(' ').toLowerCase();
  if (fullConversation.includes('budget') || fullConversation.includes('afford') || fullConversation.includes('cheap')) {
    preferences.push('Budget-conscious');
  }
  if (fullConversation.includes('space') || fullConversation.includes('big') || fullConversation.includes('large')) {
    preferences.push('Wants spacious property');
  }
  if (fullConversation.includes('location') || fullConversation.includes('area') || fullConversation.includes('near')) {
    preferences.push('Location-focused');
  }
  
  return `Previous user queries: ${previousQueries.join(' | ') || 'This is the first query'}
Detected user preferences: ${preferences.join(', ') || 'None detected yet'}`;
})()}

CRITICAL PROPERTY SELECTION RULES:
1. ONLY select a property if it genuinely matches the user's requirements (bedrooms, budget, location, etc.)
2. If a property matches, ALWAYS end your response with: SELECTED_PROPERTY: [X] (where X is the property number from the list above)
3. If NO properties match the user's requirements (e.g., they want "under $3000" but cheapest is $3195), DO NOT include SELECTED_PROPERTY - instead offer property alerts
4. When offering alerts, say: "I don't have any [requirements] right now. Want me to notify you when one comes in?"
5. Be conversational but prioritize accuracy over showing properties
6. For "show more" requests, be enthusiastic and vary your language

RESPONSE STRUCTURE:
- If there's a matching property: Your conversational response + SELECTED_PROPERTY: [number]
- If NO matching property: Just your conversational response offering alerts (NO SELECTED_PROPERTY)

EXAMPLES WHEN PROPERTIES MATCH:
- "I found a great option for you! SELECTED_PROPERTY: [2]"
- "Since you mentioned wanting something affordable, this one caught my eye! SELECTED_PROPERTY: [4]"
- "Here's another great option! SELECTED_PROPERTY: [1]"

EXAMPLES WHEN NO PROPERTIES MATCH:
- "I don't have any 2BR under $3,000 right now. Want me to notify you when one comes in?"
- "Nothing available in that price range at the moment. Want to set up an alert?"
- "I don't see any matches for those requirements. Should I let you know when something comes in?"

Current Query: "${message}"` : systemPrompt
      },
      ...context,
      { role: 'user', content: message }
    ];

    console.log(`Sending request to OpenAI with model: ${selectedModel}, temperature: ${temperature}, max_tokens: ${maxTokens}`);

    // Define the save_property_alert function that Roger can call
    const functions = [
      {
        name: "save_property_alert",
        description: "Save a property alert when a user wants to be notified about properties matching their preferences. Use this when you've collected the user's contact info (name, email, phone) and their property preferences, and they want to be notified when matching properties become available.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The user's full name"
            },
            email: {
              type: "string",
              description: "The user's email address"
            },
            phone: {
              type: "string",
              description: "The user's phone number (optional)"
            },
            bedrooms: {
              type: "integer",
              description: "Number of bedrooms they want (optional)"
            },
            bathrooms: {
              type: "number",
              description: "Number of bathrooms they want (optional)"
            },
            min_price: {
              type: "integer",
              description: "Minimum price in dollars (optional)"
            },
            max_price: {
              type: "integer",
              description: "Maximum price in dollars (optional)"
            },
            location: {
              type: "string",
              description: "Preferred location/area (optional)"
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              description: "List of desired amenities (e.g., parking, washer/dryer, balcony, pet-friendly)"
            },
            conversation_summary: {
              type: "string",
              description: "A brief summary of what the user is looking for"
            },
            raw_message: {
              type: "string",
              description: "The original user message expressing their needs"
            }
          },
          required: ["name", "email", "conversation_summary"]
        }
      }
    ];

    // Construct OpenAI request with error handling
    let requestBody;
    try {
      requestBody = JSON.stringify({
        model: selectedModel,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        functions: functions,
        function_call: "auto"
      });
      console.log('OpenAI request body length:', requestBody.length);
    } catch (jsonError) {
      console.error('Error constructing OpenAI request JSON:', jsonError.message);
      return new Response(JSON.stringify({
        reply: "I'm having trouble processing your request. Please try with a simpler message.",
        error: `JSON construction error: ${jsonError.message}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      });
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorData}`);
      
      let errorMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
      
      if (openAIResponse.status === 401) {
        errorMessage = "The OpenAI API key configured in the AI Settings is invalid. Please ask an administrator to check the API key configuration.";
        console.error('OpenAI API authentication failed - API key from database is invalid');
      } else if (openAIResponse.status === 429) {
        errorMessage = "I'm currently at capacity. Please wait a moment and try again.";
      } else if (openAIResponse.status >= 500) {
        errorMessage = "The AI service is temporarily unavailable. Please try again in a few moments.";
      }
      
      return new Response(JSON.stringify({ 
        reply: errorMessage,
        error: `OpenAI API error: ${openAIResponse.status}` 
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }

    const openAIData = await openAIResponse.json();

    // Check if OpenAI wants to call a function
    const responseMessage = openAIData.choices[0]?.message;

    if (responseMessage?.function_call) {
      console.log('OpenAI wants to call function:', responseMessage.function_call.name);

      // Roger wants to save a property alert
      if (responseMessage.function_call.name === 'save_property_alert') {
        try {
          const functionArgs = JSON.parse(responseMessage.function_call.arguments);
          console.log('Function arguments:', functionArgs);

          // Call the save-property-alert edge function
          const { data: alertData, error: alertError } = await supabaseClient.functions.invoke('save-property-alert', {
            body: functionArgs
          });

          if (alertError) {
            console.error('Error saving property alert:', alertError);
            throw alertError;
          }

          console.log('Property alert saved successfully:', alertData);

          // Send the function result back to OpenAI so Roger can respond naturally
          const followUpMessages = [
            ...messages,
            responseMessage,
            {
              role: 'function',
              name: 'save_property_alert',
              content: JSON.stringify({ success: true, message: 'Alert saved and notifications sent' })
            }
          ];

          // Get Roger's final response after saving the alert
          const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: followUpMessages,
              max_tokens: maxTokens,
              temperature: temperature,
            }),
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            const finalReply = followUpData.choices[0]?.message?.content || "Cool! I'll shoot you a text/email when I have something perfect. Best, Roger";

            return new Response(JSON.stringify({
              reply: finalReply,
              properties: [],
              alert_saved: true
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
            });
          }

        } catch (error) {
          console.error('Error in function call handling:', error);
          // Continue with normal flow if function call fails
        }
      }
    }

    let reply = responseMessage?.content || "I apologize, but I'm having trouble responding right now.";

    console.log('Generated reply length:', reply.length);
    console.log('RAW AI RESPONSE:', reply);
    console.log('Contains JSON?', reply.includes('json'));
    console.log('Contains backticks?', reply.includes('```'));

    // Extract AI-selected single property from the response
    const suggestedProperties = [];
    
    if (finalIsPropertyQuery && listings.length > 0) {
      console.log('Processing AI single property selection');
      console.log('Total listings available:', listings.length);
      
      // Get previously shown property IDs from context to avoid repeats
      const shownPropertyIds = new Set();
      context.forEach(msg => {
        if (msg.properties && Array.isArray(msg.properties)) {
          msg.properties.forEach(prop => shownPropertyIds.add(prop.id));
        }
      });
      
      // Filter out previously shown properties
      const availableListings = listings.filter(listing => !shownPropertyIds.has(listing.id));
      console.log(`Previously shown properties: ${Array.from(shownPropertyIds).join(', ') || 'None'}`);
      console.log(`Available (unshown) properties: ${availableListings.length}`);
      
      // Parse AI's selected single property from the response
      const selectedMatch = reply.match(/SELECTED_PROPERTY:\s*\[(\d+)\]/);
      let selectedIndex = -1;
      
      if (selectedMatch) {
        try {
          selectedIndex = parseInt(selectedMatch[1]) - 1; // Convert to 0-based index
          console.log('AI selected property index:', selectedIndex);
        } catch (error) {
          console.error('Error parsing selected property:', error);
        }
      }
      
      // Check if AI intentionally didn't select a property (no match scenario)
      const intentionallyNoMatch = reply.toLowerCase().includes("don't have") ||
                                    reply.toLowerCase().includes("don't see") ||
                                    reply.toLowerCase().includes("no properties") ||
                                    reply.toLowerCase().includes("nothing available") ||
                                    reply.toLowerCase().includes("want me to notify");

      // If AI didn't select a property or index is invalid, use intelligent fallback
      // BUT only if AI didn't intentionally say "no match"
      if (selectedIndex < 0 || selectedIndex >= availableListings.length) {
        if (intentionallyNoMatch) {
          console.log('AI intentionally did not select a property (no good match)');
          selectedIndex = -1; // Don't show any property
        } else {
          console.log('No valid AI selection found, using intelligent fallback');
          if (availableListings.length > 0) {
            // Show first available unshown property, prioritizing featured
            const featuredUnshown = availableListings.filter(listing => listing.featured);
            selectedIndex = 0; // Default to first available
            if (featuredUnshown.length > 0) {
              selectedIndex = availableListings.indexOf(featuredUnshown[0]);
            }
            console.log('Fallback selected index:', selectedIndex);
          }
        }
      }

      // CRITICAL: Always ensure we have a property for property queries
      // UNLESS AI intentionally said there's no good match
      if (finalIsPropertyQuery && availableListings.length > 0 && (selectedIndex < 0 || selectedIndex >= availableListings.length) && !intentionallyNoMatch) {
        console.log('EMERGENCY FALLBACK: Forcing selection of first available property');
        selectedIndex = 0;
      }
      
      // Map selected index to actual property from available listings
      if (selectedIndex >= 0 && selectedIndex < availableListings.length) {
        const listing = availableListings[selectedIndex];
        suggestedProperties.push({
          id: listing.id,
          title: listing.title,
          location: listing.location,
          price: listing.price,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqft: listing.sqft,
          images: listing.images && listing.images.length > 0 ? listing.images : ['/placeholder.svg'],
          description: listing.description,
          amenities: listing.amenities || [],
          featured: listing.featured || false
        });
        console.log(`Selected property: ${listing.title} (ID: ${listing.id})`);
      }

      console.log(`Final property count: ${suggestedProperties.length}`);
    } else {
      console.log('No properties suggested - not a property query or no listings available');
    }

    // Clean the AI response by removing the SELECTED_PROPERTY part
    reply = reply.replace(/SELECTED_PROPERTY:\s*\[\d+\]/g, '').trim();
    
    // Apply fallback logic for problematic responses
    const hasProblematicContent = reply.includes('```') || reply.includes('json') || reply.includes('{') || reply.includes('}');
    
    if (hasProblematicContent || reply.length < 10) {
      console.log('Detected problematic AI response, using fallback');
      // Provide clean fallback responses based on context
      if (finalIsPropertyQuery && suggestedProperties.length > 0) {
        const fallbackResponses = [
          "I found a great option for you!",
          "Here's something that caught my eye!",
          "Perfect! I have an excellent choice to show you.",
          "Take a look at this property!"
        ];
        reply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      } else {
        reply = "I'm here to help you find the perfect rental property!";
      }
      console.log('Using fallback response:', reply);
    }
    
    // CRITICAL: If this is a property query but no property was selected, force a fallback
    if (finalIsPropertyQuery && suggestedProperties.length === 0 && listings.length > 0) {
      console.log('CRITICAL: Property query with no selected properties - forcing fallback');
      // Get any unshown property as emergency fallback
      const shownIds = new Set();
      context.forEach(msg => {
        if (msg.properties) msg.properties.forEach(prop => shownIds.add(prop.id));
      });
      
      const emergencyProperty = listings.find(listing => !shownIds.has(listing.id)) || listings[0];
      if (emergencyProperty) {
        suggestedProperties.push({
          id: emergencyProperty.id,
          title: emergencyProperty.title,
          location: emergencyProperty.location,
          price: emergencyProperty.price,
          bedrooms: emergencyProperty.bedrooms,
          bathrooms: emergencyProperty.bathrooms,
          sqft: emergencyProperty.sqft,
          images: emergencyProperty.images && emergencyProperty.images.length > 0 ? emergencyProperty.images : ['/placeholder.svg'],
          description: emergencyProperty.description,
          amenities: emergencyProperty.amenities || [],
          featured: emergencyProperty.featured || false
        });
        
        reply = "Here's a great property for you!";
        console.log('Emergency property selected:', emergencyProperty.title);
      }
    }

    console.log('FINAL RESPONSE OBJECT:', { 
      reply: reply,
      properties: suggestedProperties,
      propertiesCount: suggestedProperties.length
    });

    return new Response(JSON.stringify({ 
      reply,
      properties: suggestedProperties
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({ 
      reply: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
      error: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
