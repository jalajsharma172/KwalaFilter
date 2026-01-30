// file: getLatestLogBlock.js
// run with Node 18+ (has global fetch) or install node-fetch and uncomment import

// import fetch from "node-fetch"; // uncomment if using Node < 18 and installed node-fetch
import { config } from "../config.js";

/**
 * Fetch the latest block number where the contract emitted an event (log).
 * Uses Etherscan V2 Sepolia endpoint.
 *
 * @param {string} contractAddress - checks logs for this address
 * @returns {Promise<number|null>} decimal block number or null on failure
 */
export async function getContractLatestBlockNumber(contractAddress, preBlockNumber, eventSignature) {
  try {
    const apikey = config.ETHERSCAN_API_KEY;
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };
    console.log("preBlockNumber :  - ", preBlockNumber);

    const response = await fetch(
      `https://api.etherscan.io/v2/api?apikey=${apikey}&chainid=11155111&module=logs&action=getLogs&fromBlock=${preBlockNumber}&address=${contractAddress}&topic0=${eventSignature}&page=1&offset=10000`,
      requestOptions
    );

    const result = await response.text();
    const resJson = JSON.parse(result);

    if (resJson.status === "1" && resJson.result.length > 0) {
      const blockNumbers = resJson.result.map(log => parseInt(log.blockNumber, 16));
      const maxBlockNumber = Math.max(...blockNumbers);

      // Find the log entry with the maxBlockNumber
      const maxBlockLog = resJson.result.find(
        log => parseInt(log.blockNumber, 16) === maxBlockNumber
      );

      const maxBlockData = maxBlockLog?.data || null;

      console.log(`API caLL at block number ${maxBlockNumber} at  ${contractAddress} is  with data: ${maxBlockData}`);

      return { maxBlockNumber, maxBlockLog };
    } else {
      console.log(`No logs found for contract ${contractAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching block number for contract ${contractAddress}:`, error);
    return null;
  }
}
