// backend/services/apiServices.js
const axios = require('axios');

/**
 * OpenFIGI API - Konvertiert ISIN zu Trading Symbol
 * API Dokumentation: https://www.openfigi.com/api
 */
const getSymbolFromISIN = async (isin) => {
  try {
    const response = await axios.post(
      'https://api.openfigi.com/v3/mapping',
      [{
        idType: 'ID_ISIN',
        idValue: isin,
        exchCode: 'GER'
      }],
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data[0] && response.data[0].data) {
      const data = response.data[0].data[0];
      return {
        symbol: data.ticker,
        name: data.name,
        exchCode: data.exchCode,
        marketSector: data.marketSector
      };
    }

    return null;
  } catch (error) {
    console.error('OpenFIGI API Fehler:', error.message);
    
    const exchanges = ['US', 'GY', 'SW'];
    for (const exchCode of exchanges) {
      try {
        const response = await axios.post(
          'https://api.openfigi.com/v3/mapping',
          [{
            idType: 'ID_ISIN',
            idValue: isin,
            exchCode: exchCode
          }],
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.data && response.data[0] && response.data[0].data) {
          const data = response.data[0].data[0];
          return {
            symbol: data.ticker,
            name: data.name,
            exchCode: data.exchCode,
            marketSector: data.marketSector
          };
        }
      } catch (err) {
        continue;
      }
    }

    return null;
  }
};

/**
 * Yahoo Finance API - Holt aktuellen Aktienkurs
 */
const getCurrentPrice = async (symbol) => {
  try {
    const symbolVariants = [
      symbol,
      `${symbol}.DE`,
      `${symbol}.F`,
      symbol.replace('.', '-')
    ];

    for (const variant of symbolVariants) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${variant}`,
          {
            params: {
              interval: '1d',
              range: '1d'
            }
          }
        );

        if (response.data?.chart?.result?.[0]) {
          const result = response.data.chart.result[0];
          const currentPrice = result.meta.regularMarketPrice;
          
          if (currentPrice) {
            return {
              price: currentPrice,
              currency: result.meta.currency,
              symbol: variant,
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (err) {
        continue;
      }
    }

    throw new Error(`Kein Preis für Symbol ${symbol} gefunden`);
  } catch (error) {
    console.error('Yahoo Finance API Fehler:', error.message);
    throw error;
  }
};

/**
 * Batch-Update für mehrere Symbole
 */
const getCurrentPrices = async (symbols) => {
  const prices = {};
  
  for (const symbol of symbols) {
    try {
      const priceData = await getCurrentPrice(symbol);
      prices[symbol] = priceData.price;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Preises für ${symbol}:`, error.message);
      prices[symbol] = null;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return prices;
};

module.exports = {
  getSymbolFromISIN,
  getCurrentPrice,
  getCurrentPrices
};
