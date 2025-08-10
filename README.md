# Team 62 Map - Business Gap Analysis Tool

A comprehensive web application for analyzing business opportunities and market gaps using Google Maps API and AI-powered insights.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the project root with your API keys:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your actual API keys
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_CHATGPT_API_KEY=your_chatgpt_api_key_here
```

### 2. Get API Keys

- **Google Maps API Key**: [Get it here](https://console.cloud.google.com/apis/credentials)
  - Required for map functionality and business search
  - Enable: Maps JavaScript API, Places API, Geocoding API

- **ChatGPT API Key**: [Get it here](https://platform.openai.com/api-keys)
  - Optional: Required for AI-powered gap analysis
  - Used for business recommendations and market insights

### 3. Install & Run

```bash
npm install
npm run dev
```

## 🔧 Features

- **Interactive Map**: Google Maps integration with business search
- **Business Categories**: 300+ Google Places API categories with quick links
- **Gap Analysis**: AI-powered market opportunity analysis
- **Demographics**: Census data integration for market insights
- **Heatmaps**: Visual business density analysis
- **Responsive Design**: Works on desktop and mobile

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── GoogleMap.tsx   # Main map component
│   ├── BusinessSearch.tsx # Business category search
│   └── ...
├── utils/              # Utility functions
│   ├── env.ts         # Environment variables
│   ├── businessCategories.ts # Business categories
│   └── ...
└── ...
```

## 🔒 Security

- API keys are stored in environment variables (`.env`)
- `.env` file is gitignored for security
- No API keys are stored in localStorage or client-side code

## 📝 TODO

1. Change the bounding box for when pulling the data from census (if possible)
2. Explore using NAICS codes in the business search suggestions
   ```
   Google Business Profile Category | NAICS Codes
   Business Service                | 999999
   Pet Services                    | 812910
   Hotel                          | 721110
   Restaurant                     | 722511
   Yoga Studio                    | 713940
   Gym                            | 713940
   Arts & Entertainment           | 711510
   Educational Institution        | 11699
   Cleaning Service               | 561720
   Photography Service            | 541920
   Bakery                         | 311811
   ```
3. Add a button to show traffic layer 