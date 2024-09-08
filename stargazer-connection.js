async function connectToStargazer() {
  if (!window.stargazer) {
    throw new Error('Stargazer not detected');
  }
  console.log("Stargazer version " + window.stargazer.version + " detected");
  const provider = window.stargazer.getProvider("constellation");
  try {
    const accounts = await provider.request({ method: "dag_requestAccounts", params: [] });
    if (accounts && accounts.length > 0) {
      return accounts[0];
    } else {
      throw new Error('No accounts returned');
    }
  } catch (error) {
    console.error('Error activating Stargazer provider:', error);
    throw error;
  }
}

async function getConnectedAddress() {
  if (!window.stargazer) {
    return null;
  }
  const provider = window.stargazer.getProvider("constellation");
  try {
    const accounts = await provider.request({ method: "dag_accounts", params: [] });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting connected address:', error);
    return null;
  }
}