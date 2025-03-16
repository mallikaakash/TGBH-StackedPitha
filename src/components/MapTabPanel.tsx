'use client';

import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { 
  getNearestPlacesWithDemand, 
  PlacePrediction, 
  VIJARAHALLI_LOCATION,
  predictDemand,
  loadModel,
  Place,
  BANGALORE_PLACES
} from '@/services/modelService';
import { 
  getPOIContextualSummary, 
  PointOfInterest,
  POI_CATEGORIES
} from '@/utils/mapboxService';

const DRIVER_PROFILE = {
  id: "#BLR2345",
  rating: 4.7,
  reviews: 987,
  driverScore: 8.2,
  persona: {
    type: "Long Haul Specialist",
    traits: [
      {
        name: "Long Distance Expert",
        description: "Prefers longer routes with higher fare",
        icon: "Road"
      },
      {
        name: "Off-Peak Warrior",
        description: "Reliable during non-rush hours",
        icon: "Clock"
      },
      {
        name: "No-Cancel Legend",
        description: "Rarely cancels accepted rides",
        icon: "Check"
      }
    ],
    badges: ["Road Warrior", "Reliable Driver", "Early Bird"]
  }
};

const LANGUAGE_OPTIONS = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', name: 'മലയാളം (Malayalam)' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
  { code: 'mr-IN', name: 'मराठी (Marathi)' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'od-IN', name: 'ଓଡ଼ିଆ (Odia)' }
];

interface MapTabPanelProps {
  center: [number, number];
}

interface EnhancedPrediction {
  name: string;
  demand_score: number;
  distance?: number;
  duration?: number;
  latitude: number;
  longitude: number;
  description: string;
  demand_category?: string;
  competition_level?: string;
  recommendation?: string;
}

interface POIContext {
  summary: string;
  highDemandPOIs: PointOfInterest[];
  timeSensitivePOIs: PointOfInterest[];
  nearbyPOIs: PointOfInterest[];
}

const MapTabPanel: React.FC<MapTabPanelProps> = ({ center }) => {
  const vijarahalliCenter: [number, number] = [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude];
  
  const [currentLocation, setCurrentLocation] = useState({ 
    lat: VIJARAHALLI_LOCATION.latitude, 
    lng: VIJARAHALLI_LOCATION.longitude 
  });
  const [hotspots, setHotspots] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [markdownData, setMarkdownData] = useState<string>('');
  const [aiGuidance, setAiGuidance] = useState<string>('');
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [poiContext, setPOIContext] = useState<POIContext | null>(null);
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
  const [translatedGuidance, setTranslatedGuidance] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [apiTested, setApiTested] = useState<boolean>(false);

  useEffect(() => {
    const testTranslationApi = async () => {
      try {
        const testText = "Hello, this is a test message.";
        
        const requestBody = JSON.stringify({
          input: testText,
          source_language_code: "en-IN",
          target_language_code: "hi-IN",
          speaker_gender: "Male",
          mode: "formal",
          model: "mayura:v1",
          enable_preprocessing: false,
          output_script: null,
          numerals_format: "international"
        });
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': '4c271227-c828-428a-8253-0e5ce0b13ed5'
          },
          body: requestBody
        };
        
        console.log('Testing Sarvam API with simple text...');
        const response = await fetch('https://api.sarvam.ai/translate', options);
        
        if (!response.ok) {
          console.error('API test failed with status:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('API test successful, response:', data);
        setApiTested(true);
      } catch (error) {
        console.error('API test failed:', error);
      }
    };
    
    testTranslationApi();
  }, []);

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    console.log('Map moved, but keeping Vajrahalli as fixed base for calculations');
  };

  const generateMarkdown = (predictions: EnhancedPrediction[], poiData: POIContext | null): string => {
    const timestamp = new Date().toLocaleString();
    const currentHour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    const timeOfDay = 
      currentHour >= 5 && currentHour < 12 ? "morning" :
      currentHour >= 12 && currentHour < 17 ? "afternoon" :
      currentHour >= 17 && currentHour < 21 ? "evening" : "night";
    
    let markdown = `# Driver Guidance\n\n`;
    
    markdown += `## Current Conditions\n`;
    markdown += `- Time: ${new Date().toLocaleTimeString()}\n`;
    markdown += `- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}\n`;
    markdown += `- Location: Vijarahalli\n`;
    markdown += `- Traffic: ${currentHour >= 8 && currentHour <= 10 || currentHour >= 17 && currentHour <= 19 ? "Heavy" : "Normal"}\n`;
    markdown += `- Weather: ${Math.random() > 0.2 ? "Clear" : "Rainy"}\n\n`;
    
    markdown += `## Driver Profile\n`;
    markdown += `- Driver type: ${DRIVER_PROFILE.persona.type}\n`;
    markdown += `- Strengths: Long trips, Off-peak hours, Reliable service\n`;
    markdown += `- Rating: ${DRIVER_PROFILE.rating} stars (${DRIVER_PROFILE.reviews} reviews)\n\n`;
    
    if (poiData && (poiData.highDemandPOIs.length > 0 || poiData.timeSensitivePOIs.length > 0)) {
      markdown += `## Nearby Places with Customers\n\n`;
      
      if (poiData.highDemandPOIs.length > 0) {
        markdown += "### Busy places right now:\n";
        poiData.highDemandPOIs.slice(0, 3).forEach(poi => {
          markdown += `- ${poi.name} (${poi.category}) - ${poi.distance.toFixed(1)} km away\n`;
          markdown += `  - Why busy: ${poi.category === 'Office' ? 'People leaving work' : 
                                     poi.category === 'Shopping' ? 'Shoppers looking for rides' : 
                                     poi.category === 'Restaurant' ? 'Diners finishing meals' : 
                                     'Many people need rides'}\n`;
        });
        markdown += "\n";
      }
      
      if (poiData.timeSensitivePOIs.length > 0) {
        markdown += "### Places with people leaving soon:\n";
        poiData.timeSensitivePOIs.slice(0, 3).forEach(poi => {
          markdown += `- ${poi.name} (${poi.category}) - ${poi.distance.toFixed(1)} km away\n`;
          markdown += `  - When: ${poi.category === 'Office' ? 'Next 30-60 minutes' : 
                                 poi.category === 'Shopping' ? 'Soon (closing time)' : 
                                 poi.category === 'Restaurant' ? 'After meal times' : 
                                 'Next hour'}\n`;
        });
        markdown += "\n";
      }
    }
    
    markdown += `## Best Areas for Rides\n\n`;
    const topAreas = predictions.slice(0, 5);
    topAreas.forEach((pred, index) => {
      const distanceStr = pred.distance ? `${pred.distance.toFixed(1)} km away` : '';
      const timeStr = pred.duration ? `(${Math.round(pred.duration)} min drive)` : '';
      markdown += `${index + 1}. ${pred.name} - ${distanceStr} ${timeStr}\n`;
      markdown += `   - Demand: ${pred.demand_category}\n`;
      markdown += `   - Competition: ${pred.competition_level}\n`;
    });
    markdown += "\n";
    
    markdown += `## What I Need From You\n\n`;
    markdown += `Please focus on providing clear, concise and relevant guidance for drivers. Avoid generic advice and focus on:\n\n`;
    markdown += `1. TOP PLACES TO GO: List 3-4 specific locations where customers are likely to be right now, with brief reasons why\n`;
    markdown += `2. BEST STRATEGY: A concise strategy for where to position for best results based on time of day\n\n`;
    markdown += `3. Keep the advice localized to areas within 8km of the driver's current location (Vajrahalli)\n\n`;
    
    markdown += `## Response Format\n\n`;
    markdown += `Please structure your response with just these two sections:\n`;
    markdown += `- TOP PLACES TO GO (3-4 specific locations with brief reasons)\n`;
    markdown += `- BEST STRATEGY (specific position advice for current time)\n`;
    
    markdown += `Keep language straightforward. Focus only on actionable, location-specific advice. Avoid generic tips like "cruise around" or "keep your app open" that would apply to any driver anywhere.`;
    
    return markdown;
  };

  const enhancePredictions = (predictions: any[]): EnhancedPrediction[] => {
    return predictions.map(pred => {
      let demand_category = 'Medium';
      if (pred.demand_score >= 0.7) demand_category = 'High';
      else if (pred.demand_score <= 0.4) demand_category = 'Low';
      
      let competition_level = 'Medium';
      if (pred.demand_score >= 0.8) competition_level = 'High';
      else if (pred.demand_score <= 0.3) competition_level = 'Low';
      
      return {
        ...pred,
        demand_category,
        competition_level
      };
    });
  };

  const generateDriverGuidance = async (markdownPrompt: string) => {
    setIsGeneratingGuidance(true);
    
    try {
      const API_KEY = 'AIzaSyDhz3n2Xtcw0pqKj7zpYGkP02zxSXBfMzY';
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const requestData = {
        contents: [
          {
            parts: [
              { text: markdownPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.95,
        }
      };
      
      console.log('Sending request to Gemini API with prompt:', markdownPrompt);
      
      const response = await fetch(`${apiUrl}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Gemini API full response:', data);
      
      const generatedText = data.candidates[0]?.content?.parts[0]?.text || 'No guidance generated';
      console.log('Extracted text content from Gemini:', generatedText);
      
      console.log('Content length:', generatedText.length, 'characters');
      
      const sections = generatedText.split('##').map((section: string) => section.trim());
      console.log('Content sections:', sections.length);
      sections.forEach((section: string, index: number) => {
        if (index > 0) {
          const sectionTitle = section.split('\n')[0];
          console.log(`Section ${index}: ${sectionTitle} (${section.length} chars)`);
        }
      });
      
      setAiGuidance(generatedText);
      
      if (selectedLanguage !== 'en-IN') {
        translateGuidance(generatedText, selectedLanguage);
      } else {
        setTranslatedGuidance('');
      }
      
      setShowGuidance(true);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setAiGuidance(`
# Driving Guide

## TOP PLACES TO GO
1. **Indiranagar** - Many office workers leaving (6.2 km away)
   Tech park closing time = many rides needed

2. **Koramangala** - Tech companies & restaurants (5.8 km)
   Popular evening spot with many young professionals

3. **HSR Layout** - Residential & shopping area (7.3 km)
   ${new Date().getHours() >= 17 ? "People returning from work now" : 
     new Date().getHours() >= 12 && new Date().getHours() <= 15 ? "Lunchtime rush at restaurants" :
     "Shopping centers with steady customer flow"}

## BEST STRATEGY
${new Date().getHours() >= 17 && new Date().getHours() <= 19 ? 
  "Position near office buildings on Outer Ring Road. Many people need rides home after work." : 
  new Date().getHours() >= 12 && new Date().getHours() <= 14 ? 
  "Wait near restaurant clusters in Koramangala 5th Block or Indiranagar 12th Main." :
  new Date().getHours() >= 7 && new Date().getHours() <= 9 ? 
  "Stay in residential areas like HSR Layout or Marathahalli. Many people need rides to work." :
  "Focus on shopping malls and entertainment spots like Phoenix Marketcity or Forum Mall."}
      `);
      
      if (selectedLanguage !== 'en-IN') {
        setTimeout(() => translateGuidance(aiGuidance, selectedLanguage), 100);
      } else {
        setTranslatedGuidance('');
      }
      
      setShowGuidance(true);
    } finally {
      setIsGeneratingGuidance(false);
    }
  };

  const loadPredictions = async () => {
    setLoading(true);
    
    try {
      console.log('Loading predictions for Vajrahalli:', VIJARAHALLI_LOCATION);
      
      const model = await loadModel();
      console.log('Prediction method being used:', model ? 'TensorFlow.js Model' : 'Time-based heuristic fallback');
      
      const poiContextPromise = getPOIContextualSummary(VIJARAHALLI_LOCATION);
      
      const predictions = await getNearestPlacesWithDemand(VIJARAHALLI_LOCATION);
      console.log('Received predictions for 6 closest places:', predictions);
      
      console.log('===== DETAILED PREDICTION INFORMATION FOR 6 CLOSEST PLACES =====');
      predictions.forEach((prediction, index) => {
        console.log(`Prediction ${index + 1}: ${prediction.name}`);
        console.log(`  Demand Score: ${prediction.demand_score.toFixed(2)}`);
        console.log(`  Distance: ${prediction.distance.toFixed(2)} km`);
        console.log(`  Estimated Duration: ${prediction.duration.toFixed(0)} minutes`);
        console.log(`  Location: [${prediction.latitude}, ${prediction.longitude}]`);
        console.log(`  Description: ${prediction.description}`);
        console.log('----------------------------------------');
      });
      
      console.log('===== GETTING PREDICTIONS FOR ALL BANGALORE PLACES =====');
      const allPredictions = await Promise.all(
        BANGALORE_PLACES.map(async (place: Place) => {
          try {
            const R = 6371;
            const lat1 = VIJARAHALLI_LOCATION.latitude * Math.PI/180;
            const lat2 = place.latitude * Math.PI/180;
            const dLat = (place.latitude - VIJARAHALLI_LOCATION.latitude) * Math.PI/180;
            const dLon = (place.longitude - VIJARAHALLI_LOCATION.longitude) * Math.PI/180;
            
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(lat1) * Math.cos(lat2) * 
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const directDistance = R * c;
            
            const demand_score = await predictDemand(place);
            
            const estimatedRoadDistance = directDistance * 1.3;
            const duration = estimatedRoadDistance / 30 * 60;
            
            return {
              name: place.name,
              demand_score,
              distance: estimatedRoadDistance,
              duration: duration,
              latitude: place.latitude,
              longitude: place.longitude,
              description: place.description
            };
          } catch (error) {
            console.error(`Error processing prediction for ${place.name}:`, error);
            return {
              name: place.name,
              demand_score: 0.5,
              latitude: place.latitude,
              longitude: place.longitude,
              description: place.description
            };
          }
        })
      );
      
      const sortedPredictions = allPredictions.sort((a, b) => b.demand_score - a.demand_score);
      
      console.log('===== PREDICTIONS FOR ALL BANGALORE PLACES =====');
      sortedPredictions.forEach((prediction, index) => {
        console.log(`Place ${index + 1}: ${prediction.name}`);
        console.log(`  Demand Score: ${prediction.demand_score.toFixed(2)}`);
        if (prediction.distance) {
          console.log(`  Distance: ${prediction.distance.toFixed(2)} km`);
          console.log(`  Estimated Duration: ${prediction.duration?.toFixed(0)} minutes`);
        }
        console.log(`  Location: [${prediction.latitude}, ${prediction.longitude}]`);
        console.log(`  Description: ${prediction.description}`);
        console.log('----------------------------------------');
      });
      
      const enhancedPredictions = enhancePredictions(sortedPredictions);
      
      const poiData = await poiContextPromise;
      setPOIContext(poiData);
      
      console.log('===== POI CONTEXT DATA =====');
      console.log(poiData);
      
      const markdown = generateMarkdown(enhancedPredictions, poiData);
      setMarkdownData(markdown);
      console.log('===== MARKDOWN FOR GEMINI API =====');
      console.log(markdown);
      
      setHotspots(predictions);
      setShowPredictions(true);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processContentForDisplay = (content: string) => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/\# (.*?)(<br \/>|$)/g, '<h1 class="text-3xl font-bold text-purple-800 mb-6 pb-2 border-b-2 border-purple-200 mt-2">$1</h1>')
      
      .replace(/\#\# (.*?)(<br \/>|$)/g, 
        '<div class="mt-8 mb-6">' +
          '<div class="bg-purple-700 h-1 w-16 mb-2 rounded-full"></div>' +
          '<h2 class="text-xl font-bold text-white bg-purple-700 px-4 py-2 rounded-lg inline-block">$1</h2>' +
        '</div>'
      )
      
      .replace(/\#\#\# (.*?)(<br \/>|$)/g, '<h3 class="text-lg font-bold text-purple-700 mt-6 mb-3">$1</h3>')
      
      .replace(/\*\*([\w\s\-]+)\*\* - (.*?)(<br \/>){2,}/g, 
        '<div class="bg-white rounded-lg p-4 my-4 shadow-md border-l-4 border-purple-500">' +
          '<div class="font-bold text-lg text-purple-800 mb-1">$1</div>' +
          '<div class="text-gray-700">$2</div>' +
        '</div>'
      )
      
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-900 font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-purple-700">$1</em>')
      
      .replace(/(\d)\. (.*?)(<br \/>){1,2}(?=\d\.|<div class="|<h|$)/g, 
        '<div class="flex items-start my-5 guidance-item">' +
          '<div class="flex-shrink-0 bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-3 mt-0.5">$1</div>' +
          '<div class="flex-1 bg-white p-4 rounded-lg shadow border border-purple-100">$2</div>' +
        '</div>'
      )

      .replace(/- (.*?)(<br \/>)(?=- |<div class="|<h|$)/g, 
        '<div class="flex items-start my-3">' +
          '<div class="flex-shrink-0 w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center mt-1 mr-3">' +
            '<div class="w-2 h-2 bg-purple-600 rounded-full"></div>' +
          '</div>' +
          '<div class="flex-1">$1</div>' +
        '</div>'
      )
      
      .replace(/<br \/><br \/>/g, '<div class="h-4"></div>')
      .replace(/<br \/>/g, ' ');
  };
  
  const formatTranslatedContent = (content: string) => {
    const lines = content.split('\n');
    let formattedContent = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        formattedContent += `<h1 class="text-3xl font-bold text-purple-800 mb-6 pb-2 border-b-2 border-purple-200 mt-2">${line.substring(2)}</h1>`;
      } 
      else if (line.startsWith('## ')) {
        formattedContent += `<div class="mt-8 mb-6">
          <div class="bg-purple-700 h-1 w-16 mb-2 rounded-full"></div>
          <h2 class="text-xl font-bold text-white bg-purple-700 px-4 py-2 rounded-lg inline-block">${line.substring(3)}</h2>
          </div>`;
      }
      else if (/^\d+\./.test(line)) {
        const match = line.match(/^(\d+)\.\s*(.*)/);
        if (match) {
          const [_, number, text] = match;
          formattedContent += `<div class="flex items-start my-5 guidance-item">
            <div class="flex-shrink-0 bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-3 mt-0.5">${number}</div>
            <div class="flex-1 bg-white p-4 rounded-lg shadow border border-purple-100">${text}</div>
          </div>`;
        }
      }
      else if (line.startsWith('- ')) {
        formattedContent += `<div class="flex items-start my-3">
          <div class="flex-shrink-0 w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center mt-1 mr-3">
            <div class="w-2 h-2 bg-purple-600 rounded-full"></div>
          </div>
          <div class="flex-1">${line.substring(2)}</div>
        </div>`;
      }
      else if (line.includes('**')) {
        const boldMatch = line.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          const locationName = boldMatch[1];
          const restOfLine = line.replace(/\*\*([^*]+)\*\*/, '').trim();
          if (restOfLine.startsWith('-')) {
            formattedContent += `<div class="bg-white rounded-lg p-4 my-4 shadow-md border-l-4 border-purple-500">
              <div class="font-bold text-lg text-purple-800 mb-1">${locationName}</div>
              <div class="text-gray-700">${restOfLine.substring(1).trim()}</div>
            </div>`;
          } else {
            formattedContent += `<strong class="text-purple-900 font-bold">${locationName}</strong> ${restOfLine}<br><br>`;
          }
        }
      }
      else if (line.length > 0) {
        formattedContent += `<p class="my-2">${line}</p>`;
      }
      else {
        formattedContent += `<div class="h-4"></div>`;
      }
    }
    
    return formattedContent;
  };
  
  const translateGuidance = async (text: string, targetLanguage: string) => {
    if (targetLanguage === 'en-IN') {
      setTranslatedGuidance('');
      setTranslationError(null);
      return;
    }
    
    setIsTranslating(true);
    setTranslationError(null);
    
    try {
      console.log(`Translating content from English to ${targetLanguage}`);
      console.log(`Original text length: ${text.length} characters`);
      
      const sections = text.split(/##\s+/);
      let translatedSections: string[] = [];
      
      const title = sections[0].trim();
      let translatedTitle = '';
      
      if (title.length > 0) {
        const titleResponse = await translateTextChunk(title, targetLanguage);
        translatedTitle = titleResponse;
        translatedSections.push(translatedTitle);
      }
      
      for (let i = 1; i < sections.length; i++) {
        if (sections[i].trim().length === 0) continue;
        
        const sectionText = `## ${sections[i].trim()}`;
        
        if (sectionText.length > 900) {
          const paragraphs = sectionText.split('\n\n');
          let currentChunk = '';
          
          for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length > 900) {
              if (currentChunk.length > 0) {
                const chunkResponse = await translateTextChunk(currentChunk, targetLanguage);
                translatedSections.push(chunkResponse);
                currentChunk = '';
              }
              
              if (paragraph.length > 900) {
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                let sentenceChunk = '';
                
                for (const sentence of sentences) {
                  if (sentenceChunk.length + sentence.length > 900) {
                    if (sentenceChunk.length > 0) {
                      const sentenceResponse = await translateTextChunk(sentenceChunk, targetLanguage);
                      translatedSections.push(sentenceResponse);
                      sentenceChunk = '';
                    }
                    
                    if (sentence.length > 900) {
                      const truncatedSentence = sentence.substring(0, 900);
                      const truncatedResponse = await translateTextChunk(truncatedSentence, targetLanguage);
                      translatedSections.push(truncatedResponse);
                    } else {
                      sentenceChunk = sentence;
                    }
                  } else {
                    sentenceChunk += ' ' + sentence;
                  }
                }
                
                // Translate any remaining sentence chunk
                if (sentenceChunk.length > 0) {
                  const finalSentenceResponse = await translateTextChunk(sentenceChunk, targetLanguage);
                  translatedSections.push(finalSentenceResponse);
                }
              } else {
                // Paragraph fits in a chunk by itself
                const paragraphResponse = await translateTextChunk(paragraph, targetLanguage);
                translatedSections.push(paragraphResponse);
              }
            } else {
              // Add the paragraph to the current chunk
              currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
            }
          }
          
          // Translate any remaining chunk
          if (currentChunk.length > 0) {
            const finalChunkResponse = await translateTextChunk(currentChunk, targetLanguage);
            translatedSections.push(finalChunkResponse);
          }
        } else {
          // Section fits within the limit
          const sectionResponse = await translateTextChunk(sectionText, targetLanguage);
          translatedSections.push(sectionResponse);
        }
      }
      
      // Combine all translated sections
      const translatedText = translatedSections.join('\n\n');
      console.log(`Translated text length: ${translatedText.length} characters`);
      setTranslatedGuidance(translatedText);
      
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError('Translation failed. Please try again or use English.');
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Helper function to translate a single chunk of text
  const translateTextChunk = async (text: string, targetLanguage: string): Promise<string> => {
    // Make sure we don't exceed the 1000 character limit
    if (text.length > 1000) {
      console.warn(`Truncating text from ${text.length} to 1000 characters`);
      text = text.substring(0, 1000);
    }
    
    const requestBody = JSON.stringify({
      input: text,
      source_language_code: "en-IN",
      target_language_code: targetLanguage,
      speaker_gender: "Male",
      mode: "formal",
      model: "mayura:v1",
      enable_preprocessing: false,
      output_script: null,
      numerals_format: "international"
    });
    
    console.log(`Translating chunk of ${text.length} characters`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': '4c271227-c828-428a-8253-0e5ce0b13ed5'
      },
      body: requestBody
    };
    
    const response = await fetch('https://api.sarvam.ai/translate', options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error status:', response.status);
      console.error('Translation API error text:', errorText);
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.translated_text) {
      return data.translated_text;
    } else {
      console.error('No translation in response:', data);
      throw new Error('No translated text received');
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className={`h-full relative rounded-lg overflow-hidden shadow-sm border border-slate-200 ${showGuidance ? 'h-1/2' : 'h-full'}`}>
        <Map 
          center={vijarahalliCenter}
          zoom={13} 
          hotspots={hotspots}
          loading={loading}
          onLocationUpdate={handleLocationUpdate}
        />
        
        {/* Prediction button - only shown if predictions aren't already visible */}
        {!showPredictions && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <button 
              className="bg-purple-600 text-white py-3 px-6 rounded-full text-lg font-medium hover:bg-purple-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={loadPredictions}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></span>
                  <span>Loading predictions...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 2v10l4 4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  <span>Load predictions in the next hour</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Display a button to call Gemini API when predictions are loaded */}
        {showPredictions && markdownData && !showGuidance && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <button 
              className="bg-green-600 text-white py-3 px-6 rounded-full text-lg font-medium hover:bg-green-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={() => generateDriverGuidance(markdownData)}
              disabled={isGeneratingGuidance}
            >
              {isGeneratingGuidance ? (
                <>
                  <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></span>
                  <span>Creating your guide...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span>Get Driving Tips</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Display AI-generated guidance */}
      {showGuidance && (
        <div className="h-1/2 overflow-auto bg-gradient-to-b from-white to-purple-50 p-6 rounded-lg shadow-lg mt-4 border border-purple-100">
          <div className="flex justify-between items-center mb-5 sticky top-0 bg-white py-3 px-4 rounded-lg shadow-sm z-10">
            <h2 className="text-2xl font-bold text-purple-800">Your Driving Guide</h2>
            <div className="flex items-center">
              <div className="relative flex items-center mr-3">
                <div className="flex items-center bg-purple-50 border border-purple-200 rounded-md overflow-hidden">
                  <div className="p-2 bg-purple-100 text-purple-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z"></path>
                    </svg>
                  </div>
                  <select 
                    className="px-3 py-2 bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none pr-8"
                    value={selectedLanguage}
                    onChange={(e) => {
                      const newLanguage = e.target.value;
                      setSelectedLanguage(newLanguage);
                      // Only translate if we have guidance content
                      if (aiGuidance) {
                        translateGuidance(aiGuidance, newLanguage);
                      }
                    }}
                    disabled={isTranslating || !apiTested}
                  >
                    <option value="en-IN">English</option>
                    {LANGUAGE_OPTIONS.filter(lang => lang.code !== 'en-IN').map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <button 
                className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                onClick={() => setShowGuidance(false)}
                aria-label="Close guidance"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Translation status indicator */}
          {isTranslating ? (
            <div className="bg-purple-100 text-purple-800 py-3 px-4 rounded-md mb-4 flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-3"></div>
              <span>Translating to {LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.name}...</span>
            </div>
          ) : translationError ? (
            <div className="bg-red-100 text-red-800 py-3 px-4 rounded-md mb-4">
              <p>{translationError}</p>
              <p className="text-sm mt-1">Showing content in English instead.</p>
            </div>
          ) : selectedLanguage !== 'en-IN' && apiTested ? (
            <div className="bg-green-50 text-green-800 py-2 px-4 rounded-md mb-4 flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Showing content in {LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.name}</span>
            </div>
          ) : !apiTested && selectedLanguage !== 'en-IN' ? (
            <div className="bg-yellow-50 text-yellow-800 py-2 px-4 rounded-md mb-4 flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Translation service unavailable. Showing English content.</span>
            </div>
          ) : null}
          
          {/* Content container with better spacing */}
          <div className="max-w-3xl mx-auto">
            <div 
              className="prose max-w-none guidance-content pb-16"
              dangerouslySetInnerHTML={{ 
                __html: (selectedLanguage !== 'en-IN' && translatedGuidance) 
                  ? formatTranslatedContent(translatedGuidance) 
                  : processContentForDisplay(aiGuidance)
              }}
            />
          </div>
        </div>
      )}

      {/* Add custom CSS for guidance presentation */}
      <style jsx global>{`
        .guidance-content h1 {
          color: #6b21a8;
          margin-top: 0.5rem;
        }
        .guidance-content h2 {
          letter-spacing: 0.5px;
          display: inline-block;
        }
        .guidance-content strong {
          color: #6b21a8;
        }
        .guidance-content .guidance-item:last-child {
          margin-bottom: 2rem;
        }
        .guidance-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        /* Better spacing between sections */
        .guidance-content > div {
          margin-bottom: 0.75rem;
        }
        /* Custom scrollbar for better UX */
        .overflow-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #d8b4fe;
          border-radius: 10px;
        }
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }
      `}</style>
    </div>
  );
};

export default MapTabPanel; 