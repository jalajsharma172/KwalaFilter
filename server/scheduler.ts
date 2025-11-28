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
        const contractAddress = item.address?.toLowerCase();
        const previousBlock = item.latest_block_number;
        const eventSignature = item.event_signature;
        const api=item.api;
        const params=item.params;
        const times=item.times;
        const ActionName=item.ActionName;
        const ActionType=item.ActionType;
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

      console.log(`Calling getContractLatestBlockNumber with:
        contractAddress: ${contractAddress},
        previousBlock: ${previousBlock},
        thirdParam: 0x4ac4a00ba3e8b27bf5a8914617d33a9b0cc8b2d9ecebd7931321bee29bcb010f`);

     const { maxBlockNumber, maxBlockData } = await getContractLatestBlockNumber(contractAddress, previousBlock, eventSignature);
 
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
        console.log(
          `🔔 New block found for ${contractAddress}: ${maxBlockNumber} (previous: ${previousBlock})`
        );

      const data= Number(BigInt(maxBlockData));//5
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

//Update new blocknumber to the database
try {
   const updateBody = {
      latest_block_number: maxBlockNumber
    };

    const url = `${config.SUPABASE_URL.replace(/\/$/, '')}` +`/rest/v1/subscription_latest_blocks?address=eq.${contractAddress.toLowerCase()}&&event_signature=eq.${eventSignature}`;
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
