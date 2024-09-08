const API_BASE_URL = 'https://be-mainnet.constellationnetwork.io';

const tokens = [
    { symbol: 'DAG', id: 'DAG', icon: 'https://stargazer-assets.s3.us-east-2.amazonaws.com/logos/dag.png' },
    { symbol: 'DOR', id: 'DAG0CyySf35ftDQDQBnd1bdQ9aPyUdacMghpnCuM', icon: 'https://stargazer-assets.s3.us-east-2.amazonaws.com/logos/dor.png' },
    { symbol: 'ELPACA', id: 'DAG7ChnhUF7uKgn8tXy45aj4zn9AFuhaZr8VXY43', icon: 'https://stargazer-assets.s3.us-east-2.amazonaws.com/logos/elpaca.png' }
];

function adjustForDecimals(amount) {
    return amount / 100000000; // Divide by 10^8 for 8 decimal places
}

async function getTokenBalance(address, tokenId) {
    try {
        const endpoint = tokenId === 'DAG'
            ? `${API_BASE_URL}/addresses/${address}/balance`
            : `${API_BASE_URL}/currency/${tokenId}/addresses/${address}/balance`;
        const response = await axios.get(endpoint);
        return adjustForDecimals(response.data.data.balance);
    } catch (error) {
        console.error(`Error fetching balance for ${tokenId}:`, error);
        return 0;
    }
}

async function getTokenPrice(symbol) {
    try {
        if (symbol === 'DAG') {
            const response = await axios.get('https://d2a4s9vrrsa9d4.cloudfront.net/coin-prices?ids=constellation-labs&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false&token=dagExplorer');
            return response.data.data['constellation-labs'].usd;;
        } else if (symbol === 'DOR') {
            const response = await axios.get('https://api.coingecko.com/api/v3/coins/dor?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
            return response.data.market_data.current_price.usd;
        }
        return null; // ELPACA has no price
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null;
    }
}

async function getTransactions(address, tokenId, limit = 20) {
    try {
        const endpoint = tokenId === 'DAG'
            ? `${API_BASE_URL}/addresses/${address}/transactions`
            : `${API_BASE_URL}/currency/${tokenId}/addresses/${address}/transactions`;
        const response = await axios.get(endpoint, { params: { limit } });
        return response.data.data.map(tx => ({
            ...tx,
            amount: adjustForDecimals(tx.amount),
            fee: adjustForDecimals(tx.fee)
        }));
    } catch (error) {
        console.error(`Error fetching transactions for ${tokenId}:`, error);
        return [];
    }
}

async function getAllTokenData(address) {
    const tokenData = await Promise.all(tokens.map(async (token) => {
        const balance = await getTokenBalance(address, token.id);
        const price = await getTokenPrice(token.symbol);
        const transactions = await getTransactions(address, token.id);
        return { ...token, balance, price, transactions };
    }));
    return tokenData;
}