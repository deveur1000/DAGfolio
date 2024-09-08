document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connectButton');
    const manualConnectButton = document.getElementById('manualConnectButton');
    const disconnectButton = document.getElementById('disconnectButton');
    const addressElement = document.getElementById('address');
    const walletAddressInput = document.getElementById('walletAddressInput');
    const tokenBalancesElement = document.getElementById('tokenBalances').querySelector('.window-content');
    const transactionsElement = document.getElementById('transactions').querySelector('.window-content');
    const tokenFilter = document.getElementById('tokenFilter');
    const transactionTable = document.getElementById('transactionTable').querySelector('tbody');
    const loadingModal = document.getElementById('loadingModal');

    let currentAddress = null;
    let allTransactions = [];

    const formatCurrency = (amount, currency = 'USD', decimals = 4) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    };

    const formatToken = (amount, decimals = 4) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    };

    const abbreviateAddress = (address) => {
        return `${address.slice(0, 4)}...${address.slice(-5)}`;
    };

    const createAddressLink = (address) => {
        return `<a href="https://mainnet.dagexplorer.io/address/${address}" target="_blank" rel="noopener noreferrer">${abbreviateAddress(address)}</a>`;
    };

    function showLoading() {
        loadingModal.style.display = 'block';
    }

    function hideLoading() {
        loadingModal.style.display = 'none';
    }

    connectButton.addEventListener('click', async () => {
        try {

            showLoading();
            currentAddress = await connectToStargazer();
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', currentAddress);
            updateUI(true);
            await fetchAndDisplayTokenData();
        } catch (error) {
            console.error('Error connecting to Stargazer:', error);
            addressElement.textContent = 'Failed to connect to Stargazer';
            updateUI(false);
        } finally {
            hideLoading();
        }
    });

    manualConnectButton.addEventListener('click', async () => {
        console.log('clicou');
        const inputAddress = walletAddressInput.value.trim();
        if (inputAddress) {
            try {
                showLoading();
                currentAddress = inputAddress;
                localStorage.setItem('walletConnected', 'true');
                localStorage.setItem('walletAddress', currentAddress);
                updateUI(true);
                await fetchAndDisplayTokenData();
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                addressElement.textContent = 'Failed to connect to wallet';
                updateUI(false);
            } finally {
                hideLoading();
            }
        }
    });

    disconnectButton.addEventListener('click', () => {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
        currentAddress = null;
        walletAddressInput.value = '';
        updateUI(false);
    });

    tokenFilter.addEventListener('change', () => {
        displayTransactions(allTransactions);
    });

    function updateUI(isConnected) {
        if (isConnected) {
            addressElement.innerHTML = `Connected Address: ${createAddressLink(currentAddress)}`;
            connectButton.style.display = 'none';
            manualConnectButton.style.display = 'none';
            walletAddressInput.style.display = 'none';
            disconnectButton.style.display = 'inline-block';
            tokenBalancesElement.parentElement.style.display = 'block';
            transactionsElement.parentElement.style.display = 'block';
        } else {
            addressElement.textContent = '';
            manualConnectButton.style.display = 'inline-block';
            walletAddressInput.style.display = 'inline-block';
            connectButton.style.display = '';
            disconnectButton.style.display = 'none';
            tokenBalancesElement.parentElement.style.display = 'none';
            transactionsElement.parentElement.style.display = 'none';
        }
    }

    async function fetchAndDisplayTokenData() {
        try {
            showLoading();
            const tokenData = await getAllTokenData(currentAddress);
            displayTokenBalances(tokenData);
            allTransactions = tokenData.flatMap(token =>
                token.transactions.map(tx => ({ ...tx, symbol: token.symbol, price: token.price }))
            );
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            displayTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching token data:', error);
        } finally {
            hideLoading();
        }
    }

    function displayTokenBalances(tokenData) {
        const balancesHtml = tokenData.map(token => `
            <div class="token-balance">
                <div class="token-header">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon">
                    <span class="token-symbol">${token.symbol}</span>
                </div>
                <div class="token-amount">${formatToken(token.balance)} ${token.symbol}</div>
                ${token.price ? `
                    <div class="token-value">${formatCurrency(token.balance * token.price)}</div>
                    <div class="token-price">Price: ${formatCurrency(token.price)} / ${token.symbol}</div>` : ''}
            </div>
        `).join('');
        tokenBalancesElement.innerHTML = balancesHtml;
    }

    function displayTransactions(transactions) {
        const filteredTransactions = tokenFilter.value === 'all'
            ? transactions
            : transactions.filter(tx => tx.symbol === tokenFilter.value);

        const transactionsHtml = filteredTransactions.slice(0, 30).map(tx => {
            const isOutflow = tx.source === currentAddress;
            const amount = isOutflow ? -tx.amount : tx.amount;
            const usdValue = tx.price ? amount * tx.price : null;
            return `
                <tr>
                    <td><img src="${tokens.find(t => t.symbol === tx.symbol).icon}" alt="${tx.symbol}" class="token-icon"> ${tx.symbol}</td>
                    <td>${new Date(tx.timestamp).toLocaleString()}</td>
                    <td>${createAddressLink(tx.source)}</td>
                    <td>${createAddressLink(tx.destination)}</td>
                    <td style="color: ${isOutflow ? 'red' : 'green'}">${isOutflow ? '-' : '+'} ${formatToken(Math.abs(amount))}</td>
                    <td>${usdValue ? formatCurrency(Math.abs(usdValue)) : 'N/A'}</td>
                </tr>
            `;
        }).join('');
        transactionTable.innerHTML = transactionsHtml;
    }

    // Check if already connected on page load
    checkConnection();

    async function checkConnection() {
        const isConnected = localStorage.getItem('walletConnected') === 'true';
        if (isConnected) {
            try {
                showLoading();
                const address = localStorage.getItem('walletAddress');
                if (address) {
                    currentAddress = address;
                    updateUI(true);
                    await fetchAndDisplayTokenData();
                } else {
                    // Address not found, clear local storage
                    localStorage.removeItem('walletConnected');
                    localStorage.removeItem('walletAddress');
                    updateUI(false);
                }
            } catch (error) {
                console.error('Error checking connection:', error);
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('walletAddress');
                updateUI(false);
            } finally {
                hideLoading();
            }
        } else {
            updateUI(false);
        }
    }
});