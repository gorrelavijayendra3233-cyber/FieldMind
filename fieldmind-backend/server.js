require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are FieldMind AI, an expert farming assistant for Indian farmers. Answer farming questions clearly and practically. If farmer writes in Hindi or Telugu reply in same language. Keep answers concise and easy to understand. Focus only on farming topics.'
        },
        { role: 'user', content: message }
      ],
      max_tokens: 500
    });
    res.json({ success: true, reply: response.choices[0].message.content });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are an expert agricultural scientist specializing in Indian crops. Analyze this crop image and provide: 1. Crop type identified 2. Health status 3. Disease name if any 4. Severity level 5. Treatment steps 6. Preventive measures. Keep response practical for Indian farmers.'
          },
          {
            type: 'image_url',
            image_url: { url: 'data:image/jpeg;base64,' + imageBase64 }
          }
        ]
      }],
      max_tokens: 800
    });
    res.json({ success: true, result: response.choices[0].message.content });
  } catch (err) {
    console.error('Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/mandi', async (req, res) => {

  try {

    const today = new Date();

    const endDate = today
      .toISOString()
      .split('T')[0];

    const startDate = new Date(
      today - 30 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];



    const url =
      'https://india-agriculture-mandi-prices-live-historical.p.rapidapi.com/prices/historical' +
      '?commodity=Rice%2CChilli%2CCotton%2COnion%2CTomato%2CMaize' +
      '&state=Telangana' +
      '&start_date=' + startDate +
      '&end_date=' + endDate +
      '&limit=100';



    console.log('Fetching mandi data...');



    const response = await fetch(url, {

      method: 'GET',

      headers: {

        'x-rapidapi-host':
          'india-agriculture-mandi-prices-live-historical.p.rapidapi.com',

        'x-rapidapi-key':
          RAPIDAPI_KEY

      }

    });



    const data = await response.json();



    // ========================================
    // REAL API DATA
    // ========================================

    if (
      data.status === 'success' &&
      data.data &&
      data.data.length > 0
    ) {

      const cropMap = {};



      data.data.forEach(item => {

        const crop = item.commodity;



        if (!cropMap[crop]) {
          cropMap[crop] = [];
        }



        cropMap[crop].push(item);

      });



      const prices = Object.keys(cropMap).map(crop => {

        const records = cropMap[crop].sort(

          (a, b) =>
            new Date(a.arrival_date) -
            new Date(b.arrival_date)

        );



        const latest =
          records[records.length - 1];

        const prev =
          records[records.length - 2];



        const todayPrice =
          Number(latest.modal_price);

        const yesterdayPrice =
          Number(prev?.modal_price || todayPrice);



        return {

          name: crop,

          market: latest.market,

          district: latest.district,

          state: latest.state,

          price: todayPrice,

          prevPrice: yesterdayPrice,

          minPrice: latest.min_price,

          maxPrice: latest.max_price,

          date: latest.arrival_date,

          up: todayPrice > yesterdayPrice,

          change: todayPrice - yesterdayPrice

        };

      });



      console.log(
        'Unique crops found:',
        prices.length
      );



      return res.json({
        success: true,
        prices
      });

    }



    // ========================================
    // FORCE FALLBACK IF API FAILS
    // ========================================

    throw new Error('API failed');

  } catch (err) {

    console.error(
      'Mandi Error:',
      err.message
    );



    const today = new Date()
      .toISOString()
      .split('T')[0];



    const fallbackPrices = [

      {
        name: 'Cotton',
        market: 'Warangal Apmc',
        district: 'Warangal',
        state: 'Telangana',
        price: 10300,
        prevPrice: 6930,
        minPrice: 7000,
        maxPrice: 10350,
        date: today,
        up: true,
        change: 670
      },

      {
        name: 'Tomato',
        market: 'Rythu Bazaar',
        district: 'Hyderabad',
        state: 'Telangana',
        price: 2200,
        prevPrice: 1500,
        minPrice: 1800,
        maxPrice: 2500,
        date: today,
        up: true,
        change: 700
      },

      {
        name: 'Onion',
        market: 'Bowenpally',
        district: 'Hyderabad',
        state: 'Telangana',
        price: 1200,
        prevPrice: 1450,
        minPrice: 1000,
        maxPrice: 1600,
        date: today,
        up: false,
        change: -250
      },

      {
        name: 'Rice',
        market: 'Karimnagar',
        district: 'Karimnagar',
        state: 'Telangana',
        price: 4950,
        prevPrice: 2400,
        minPrice: 2200,
        maxPrice: 2600,
        date: today,
        up: true,
        change: 50
      },

      {
        name: 'Maize',
        market: 'Nizamabad',
        district: 'Nizamabad',
        state: 'Telangana',
        price: 2100,
        prevPrice: 1750,
        minPrice: 1600,
        maxPrice: 1950,
        date: today,
        up: true,
        change: 50
      },

      {
        name: 'Dry Chillies',
        market: 'Khammam',
        district: 'Khammam',
        state: 'Telangana',
        price: 18000,
        prevPrice: 10000,
        minPrice: 15000,
        maxPrice: 20000,
        date: today,
        up: true,
        change: 7000
      }

    ];



    res.json({
      success: true,
      prices: fallbackPrices
    });

  }

});
app.listen(5000, () => {
  console.log('FieldMind backend running on port 5000');
});