import { exec } from 'child_process';
import { getContractBlockNumber } from "./storage/getAllContractsBlockNumber.js";
import {getContractLatestBlockNumber} from "./listeners/getBlockNumber.js";
import { log } from './app.js';
import { max } from 'date-fns';
import { config } from './config.js';
/**
 * Start running a script/command at a fixed interval.
 * Default interval: 3 minutes
 */



// Replace ${re.event(n)} with decoded log values
export function applyEventParams(input, decodedEvent) {
  if (!input || typeof input !== "string") return input;

  return input.replace(/\$\{re\.event\((\d+)\)\}/g, (_, index) => {
    const idx = Number(index);
    return decodedEvent?.args?.[idx] !== undefined
      ? decodedEvent.args[idx].toString()
      : "";
  });
}




export function startScheduler(command = 'node server/CheckingLatestBlockNumber/blocknumber.js', intervalMs = 30 * 1000) {
  console.log(`|  ${intervalMs}ms | -----------------------------------------------`);

  // Run immediately once
  runOnce();

  const id = setInterval(runOnce, intervalMs);




  async function runOnce() {
    console.log(`[${new Date().toISOString()}] Scheduler: executing command`);
    
    try {
      const data = await getContractBlockNumber();

      for (const item of data) {
        await new Promise(resolve => setTimeout(resolve, 1000)); //300ms delay between each contract processing
        const id=item.id;         
        const contractAddress = item.address?.toLowerCase();
        const previousBlock = item.latest_block_number;
        const eventSignature = item.event_signature;
        const api=item.api;
        const params=item.params;
        const times=item.times;
        const ActionName=item.ActionName;
        const ActionType=item.ActionType;
        const abi=item.abi;
      console.log(contractAddress, previousBlock);

console.log("Params are : ",params);

        const paramsjson =
  typeof params === "string"
    ? JSON.parse(params)
    : params || {};

        
      if (!contractAddress) {
        console.log("❌ Invalid contract address:", item);
        continue;
      }


      console.log(contractAddress,previousBlock,eventSignature);
      let maxBlockNumber: any = 0;
      let maxBlockData: any = 0;
      try {
        const res = await getContractLatestBlockNumber(contractAddress, previousBlock, eventSignature);
        if (res && typeof res === 'object') {
          ({ maxBlockNumber, maxBlockData } = res as any);
        } else {
          // If the helper returned a primitive (number), treat it as the block number
          maxBlockNumber = res as any;
        }
      } catch (error) {
        console.log("error is ", error);
      }
 
      if (maxBlockNumber === undefined) {
        console.error(`❌ getContractLatestBlockNumber returned undefined for contract ${contractAddress}`);
        continue;
      }

      console.log(`Received ${contractAddress}: ${maxBlockNumber}`);
      
      
      if (maxBlockNumber === null) {
        console.log(`Could not fetch block number for contract ${contractAddress}`);
        continue;
      }

            if (maxBlockNumber !== previousBlock) {
          console.log(`Calling getContractLatestBlockNumber with:
              contractAddress: ${contractAddress},
              previousBlock: ${previousBlock},
              thirdParam: ${eventSignature}`);
              console.log(
                `🔔 New block found for ${contractAddress}: ${maxBlockNumber} (previous: ${previousBlock})`
              );
            const data= Number(BigInt(maxBlockData));//5


              if(ActionType=="CALL"){
                console.log("contractAddress : ",contractAddress);
                console.log("ABI : ",abi);
                console.log("Event Signature : ",eventSignature);
                console.log("Data : ",data);
                
              }else{
                            //Get Value
                          const decodedData={
                            event:eventSignature,
                            args:[data]
                          } 
                            
                            // Process the params with dynamic event replacement
                            const processedParams = {};

                            for (const key in paramsjson) {
                              processedParams[key] = applyEventParams(paramsjson[key], decodedData);
                            }

                            console.log("Processed Params:", processedParams);



                  let apicall=false;
                                                  //API call ho gayi
                                                                try {
                                                                  const response = await fetch(api, {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify(processedParams)
                                                                  });
                                                                  apicall=true;

                                                                  const result = await response.json().catch(() => null);
                                                                  console.log("📩 API Response:", result);
                                                                } catch (err) {
                                                                  apicall=false;
                                                                  console.error("❌ API Error:", err);
                                                                }

                                                                  //Update new blocknumber to the database subscription_latest_blocks
                                                                  try {
                                                                    const updateBody = {
                                                                        latest_block_number: maxBlockNumber
                                                                      };

                                                                      const url = `${config.SUPABASE_URL.replace(/\/$/, '')}` +`/rest/v1/subscription_latest_blocks?address=eq.${contractAddress.toLowerCase()}&&event_signature=eq.${eventSignature}&&id=eq.${id}`;
                                                                      const resp2 = await fetch(url, {
                                                                        method: 'PATCH', // IMPORTANT: Use PATCH for update
                                                                        headers: {
                                                                          'Content-Type': 'application/json',
                                                                          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                                                                          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                                                                          'Prefer': 'return=representation',
                                                                        },
                                                                        body: JSON.stringify(updateBody),
                                                                      });
                                                                    const json2 = await resp2.json().catch(() => null);

                                                                    if (!resp2.ok) {
                                                                      console.warn('❌❌❌❌❌❌Could not save latest block to Supabase', resp2.status, json2);
                                                                    } else {
                                                                      console.log('Saved latest block for', contractAddress, '->', data);
                                                                    }
                                                                  } catch (error) {
                                                                    console.log("❌❌❌❌❌❌Unable to update latest block number in database:", error);
                                                                    
                                                                  }      
                          if(apicall===true){
                            //save at database everything worked fine
                                try {
                                  const insertBody = {
                                    ActionName:ActionName,
                                    API_EndPoint:ActionType,
                                    ActionStatus:200
                                  };
                            
                                  const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Workflow`;
                            
                                  const resp = await fetch(sbUrl, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                                      'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                                      'Prefer': 'return=representation',
                                    },
                                    body: JSON.stringify(insertBody),
                                  });
                            
                                  const json = await resp.json();
                                  if (!resp.ok) {
                                    console.error('Supabase insert error',  json); 
                                  }
                                }catch (error) {
                                  console.error("Unable to insert workflow data:", error);
                                }   
                                }else{
                                  //show 404 error & Kitne times humne try kiya hai
                                    try {
                                        for(let i=0;i<times;i++){
                                          //Save it to the database.

                                      try {
                                        const insertBody = {
                                          ActionName:ActionName,
                                          ActionType:ActionType,
                                          ActionStatus:404
                                        };
                                  
                                        const sbUrl = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/Workflow`;
                                  
                                        const resp = await fetch(sbUrl, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                                            'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                                            'Prefer': 'return=representation',
                                          },
                                          body: JSON.stringify(insertBody),
                                        });
                                  
                                        const json = await resp.json();
                                        if (!resp.ok) {
                                          console.error('Supabase insert error',  json); 
                                        }
                                      }catch (error) {
                                        console.error("Unable to insert workflow data:", error);
                                      }
                                        }
                                    } catch (error) {
                                      console.log("Error is ",error);
                                      
                                    }
                                }
                          
                              console.log("Max Block Data is ",data);

                              console.log("--------------------------------------------------------------------------------------------------");
                              console.log("Call API CAll API  : ",api);
                              console.log("--------------------------------------------------------------------------------------------------");

                              console.log("Max Block Data is ",data);
              }




      } else {
        console.log(`No new block for ${contractAddress}. Current: ${maxBlockNumber}`);
      }
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduler error:`, error);
    }
    






  }

  return {
    stop: () => clearInterval(id),
  };
}

export default startScheduler;
