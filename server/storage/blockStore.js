// In-memory block tracking (can be extended to use JSON files)
// Stores the last processed block for each contract

const blockStore = new Map();

export function getLastBlock(contractAddress, topic0) {
  const key = `${contractAddress}-${topic0}`;
  return blockStore.get(key) || null;
}

export function setLastBlock(contractAddress, topic0, blockNumber) {
  const key = `${contractAddress}-${topic0}`;
  blockStore.set(key, blockNumber);
  console.log(`✓ Stored last block for ${contractAddress}: ${blockNumber}`);
}

export function getAllBlocks() {
  return Object.fromEntries(blockStore);
}

export function clearBlock(contractAddress, topic0) {
  const key = `${contractAddress}-${topic0}`;
  blockStore.delete(key);
}
