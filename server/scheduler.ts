/// <reference path="./declarations.d.ts" />
import { exec } from 'child_process';
import { getContractBlockNumber } from "./storage/getAllContractsBlockNumber.js";
import { getContractLatestBlockNumber } from "./listeners/getBlockNumber.js";
import { log } from './app.js';
import { max } from 'date-fns';
import { config } from './config.js';
import { chargeUser } from './billing.js';
import { ethers } from "ethers";

/**
 * Start running a script/command at a fixed interval.
 * Default interval: 3 minutes
 */

// Replace ${re.event(n)} with decoded log values
export function applyEventParams(input: any, decodedEvent: any) {
  if (!input || typeof input !== "string") return input;

  return input.replace(/\$\{re\.event\((\d+)\)\}/g, (_, index) => {
    const idx = Number(index);
    return decodedEvent?.args?.[idx] !== undefined
      ? decodedEvent.args[idx].toString()
      : "";
  });
}

export function startScheduler(command = 'node server/CheckingLatestBlockNumber/blocknumber.js', intervalMs = config.SCHEDULER_INTERVAL_MS) {
  console.log("!!! SCHEDULER STARTED !!!");
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
        const id = item.id;
        const contractAddress = item.address?.toLowerCase();
        const previousBlock = item.latest_block_number;
        const eventSignature = item.event_signature;
        const api = item.api;
        const params = item.params;
        const times = item.times;
        const ActionName = item.ActionName;
        const ActionType = item.ActionType;
        const abi = item.abi;
        const Workflow_Name = item.Workflow_Name;
        const Workflow_Owner = item.Workflow_Owner;

        console.log("Params are : ", params);

        const paramsjson =
          typeof params === "string"
            ? JSON.parse(params)
            : params || {};

        if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
          console.log("❌ Invalid contract address format:", contractAddress);
          continue;
        }

        console.log(contractAddress, previousBlock, eventSignature);
        let maxBlockNumber: any = 0;
        let maxBlockData: any = 0;
        let maxBlockLog: any = null;
        try {
          const res = await getContractLatestBlockNumber(contractAddress, previousBlock, eventSignature);
          if (res && typeof res === 'object') {
            ({ maxBlockNumber, maxBlockLog } = res as any);
          } else {
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
          console.log(`Could not fetch block number for ${contractAddress}`);
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

          let decodedArgs: any[] = [];

          if (maxBlockLog && abi) {
            try {
              const iface = new ethers.Interface(typeof abi === 'string' ? JSON.parse(abi) : abi);
              const parsedLog = iface.parseLog({
                topics: maxBlockLog.topics,
                data: maxBlockLog.data
              });
              if (parsedLog) {
                decodedArgs = Array.from(parsedLog.args);
                console.log("✅ Successfully decoded log args:", decodedArgs);
              }
            } catch (decodeErr) {
              console.warn("⚠️ Failed to decode log with ABI:", decodeErr);
              decodedArgs = [maxBlockLog.data];
            }
          }

          if (ActionType == "CALL") {
            console.log("contractAddress : ", contractAddress);
            console.log("ABI : ", abi);
            console.log("Event Signature : ", eventSignature);
            console.log("Decoded Args : ", decodedArgs);
          } else {
            //Get Value
            const decodedData = {
              event: eventSignature,
              args: decodedArgs
            }

            // Process the params with dynamic event replacement
            const processedParams: Record<string, any> = {};
            for (const key in paramsjson) {
              processedParams[key] = applyEventParams(paramsjson[key], decodedData);
            }
            console.log("Processed Params:", processedParams);

            let apicall = false;
            //API call
            try {
              const response = await fetch(api, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(processedParams)
              });
              apicall = true;

              const result = await response.json().catch(() => null);
              console.log("📩 API Response:", result);

              // BILLING INTEGRATION
              if (response.ok) {
                // BILLING INTEGRATION: Charge Workflow Owner
                if (Workflow_Owner) {
                  const feeAmount = ethers.parseUnits("0.01", 18);
                  console.log(`[Billing] Charging Workflow Owner: ${Workflow_Owner} amount: 0.01 KWALA...`);
                  await chargeUser(Workflow_Owner, feeAmount);
                } else {
                  console.warn("[Billing] Workflow_Owner is missing, cannot charge.");
                }

                //Update new blocknumber to the database ONLY if API call was successful
                try {
                  const updateBody = {
                    latest_block_number: maxBlockNumber
                  };
                  const url = `${config.SUPABASE_URL.replace(/\/$/, '')}` + `/rest/v1/subscription_latest_blocks?address=eq.${contractAddress.toLowerCase()}&event_signature=eq.${eventSignature}&id=eq.${id}`;
                  const resp2 = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
                      'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
                      'Prefer': 'return=representation',
                    },
                    body: JSON.stringify(updateBody),
                  });

                  if (resp2.ok) {
                    const data = await resp2.json();
                    console.log(`✅ Database updated for ID ${id}. New Block: ${maxBlockNumber}`, data);
                  } else {
                    const errText = await resp2.text();
                    console.error(`❌ Database update failed for ID ${id}. Status: ${resp2.status}`, errText);
                  }
                } catch (dbErr) {
                  console.error("❌ Database update exception:", dbErr);
                }
              }
            } catch (err) {
              apicall = false;
              console.error("❌ API Error:", err);
            }



            if (apicall === true) {
              //save at database everything worked fine
              try {
                const insertBody = {
                  ActionName: ActionName,
                  API_EndPoint: ActionType,
                  ActionStatus: 200,
                  Workflow_Name: Workflow_Name
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
                if (!resp.ok) console.error('Supabase insert error', json);
              } catch (error) {
                console.error("Unable to insert workflow data:", error);
              }
            } else {
              //show 404 error
              try {
                for (let i = 0; i < times; i++) {
                  try {
                    const insertBody = {
                      ActionName: ActionName,
                      ActionType: ActionType,
                      ActionStatus: 404
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
                    if (!resp.ok) console.error('Supabase insert error', json);
                  } catch (error) {
                    console.error("Unable to insert workflow data:", error);
                  }
                }
              } catch (error) {
                console.log("Error is ", error);
              }
            }
          }
        } else {
          console.log(`No new block for ${contractAddress}. Current: ${maxBlockNumber}`);
        }

        console.log("--------------------------------------------------------------------------------------------------");
        console.log("Call API Wait : ", api);
        console.log("--------------------------------------------------------------------------------------------------");
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
