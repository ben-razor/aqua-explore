/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/. 
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.3.1-231
 *
 */
 import { Fluence, FluencePeer } from '@fluencelabs/fluence';
 import {
     ResultCodes,
     RequestFlow,
     RequestFlowBuilder,
     CallParams,
 } from '@fluencelabs/fluence/dist/internal/compilerSupport/v1.js';
 
 
 function missingFields(obj, fields) {
     return fields.filter(f => !(f in obj))
 }
 
 // Services
 
 export function registerPeer(...args) {
     let peer;
     let serviceId;
     let service;
     if (FluencePeer.isInstance(args[0])) {
         peer = args[0];
     } else {
         peer = Fluence.getPeer();
     }
 
     if (typeof args[0] === 'string') {
         serviceId = args[0];
     } else if (typeof args[1] === 'string') {
         serviceId = args[1];
     }  
  else {
      serviceId = "peer"
 }
 
     // Figuring out which overload is the service.
     // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
     // If the first argument is peer, we are checking further. The second argument might either be
     // an object, that it must be the service object
     // or a string, which is the service id. In that case the service is the third argument
     if (!(FluencePeer.isInstance(args[0])) && typeof args[0] === 'object') {
         service = args[0];
     } else if (typeof args[1] === 'object') {
         service = args[1];
     } else {
         service = args[2];
     }
 
     const incorrectServiceDefinitions = missingFields(service, ['is_connected']);
     if (!incorrectServiceDefinitions.length) {
         throw new Error("Error registering service Peer: missing functions: " + incorrectServiceDefinitions.map((d) => "'" + d + "'").join(", "))
     }
 
     peer.internals.callServiceHandler.use((req, resp, next) => {
         if (req.serviceId !== serviceId) {
             next();
                 return;
             }
 
 
  if (req.fnName === 'is_connected') {
      
  const callParams = {
      ...req.particleContext,
      tetraplets: {
          arg0: req.tetraplets[0]
      },
  };
  resp.retCode = ResultCodes.success;
  resp.result = service.is_connected(req.args[0], callParams)
 
  }
     
 
             next();
         });
  }
       
 
 
 export function registerOp(...args) {
     let peer;
     let serviceId;
     let service;
     if (FluencePeer.isInstance(args[0])) {
         peer = args[0];
     } else {
         peer = Fluence.getPeer();
     }
 
     if (typeof args[0] === 'string') {
         serviceId = args[0];
     } else if (typeof args[1] === 'string') {
         serviceId = args[1];
     }  
  else {
      serviceId = "op"
 }
 
     // Figuring out which overload is the service.
     // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
     // If the first argument is peer, we are checking further. The second argument might either be
     // an object, that it must be the service object
     // or a string, which is the service id. In that case the service is the third argument
     if (!(FluencePeer.isInstance(args[0])) && typeof args[0] === 'object') {
         service = args[0];
     } else if (typeof args[1] === 'object') {
         service = args[1];
     } else {
         service = args[2];
     }
 
     const incorrectServiceDefinitions = missingFields(service, ['identity']);
     if (!incorrectServiceDefinitions.length) {
         throw new Error("Error registering service Op: missing functions: " + incorrectServiceDefinitions.map((d) => "'" + d + "'").join(", "))
     }
 
     peer.internals.callServiceHandler.use((req, resp, next) => {
         if (req.serviceId !== serviceId) {
             next();
                 return;
             }
 
 
  if (req.fnName === 'identity') {
      
  const callParams = {
      ...req.particleContext,
      tetraplets: {
          
      },
  };
  resp.retCode = ResultCodes.success;
  service.identity(callParams); resp.result = {}
 
  }
     
 
             next();
         });
  }
       
 
 
 export function registerTest(...args) {
     let peer;
     let serviceId;
     let service;
     if (FluencePeer.isInstance(args[0])) {
         peer = args[0];
     } else {
         peer = Fluence.getPeer();
     }
 
     if (typeof args[0] === 'string') {
         serviceId = args[0];
     } else if (typeof args[1] === 'string') {
         serviceId = args[1];
     }  
  else {
      serviceId = "test"
 }
 
     // Figuring out which overload is the service.
     // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
     // If the first argument is peer, we are checking further. The second argument might either be
     // an object, that it must be the service object
     // or a string, which is the service id. In that case the service is the third argument
     if (!(FluencePeer.isInstance(args[0])) && typeof args[0] === 'object') {
         service = args[0];
     } else if (typeof args[1] === 'object') {
         service = args[1];
     } else {
         service = args[2];
     }
 
     const incorrectServiceDefinitions = missingFields(service, ['doSomething', 'getUserList']);
     if (!incorrectServiceDefinitions.length) {
         throw new Error("Error registering service Test: missing functions: " + incorrectServiceDefinitions.map((d) => "'" + d + "'").join(", "))
     }
 
     peer.internals.callServiceHandler.use((req, resp, next) => {
         if (req.serviceId !== serviceId) {
             next();
                 return;
             }
 
 
  if (req.fnName === 'doSomething') {
      
  const callParams = {
      ...req.particleContext,
      tetraplets: {
          
      },
  };
  resp.retCode = ResultCodes.success;
  resp.result = service.doSomething(callParams)
 
  }
     
 
 
  if (req.fnName === 'getUserList') {
      
  const callParams = {
      ...req.particleContext,
      tetraplets: {
          
      },
  };
  resp.retCode = ResultCodes.success;
  resp.result = service.getUserList(callParams)
 
  }
     
 
             next();
         });
  }
       
 
 // Functions
 
  export function betterMessage(...args) {
      let peer;
      let relay;
      let config;
      if (FluencePeer.isInstance(args[0])) {
          peer = args[0];
          relay = args[1];
 config = args[2];
      } else {
          peer = Fluence.getPeer();
          relay = args[0];
 config = args[1];
      }
     
      let request;
      const promise = new Promise((resolve, reject) => {
          const r = new RequestFlowBuilder()
                  .disableInjections()
                  .withRawScript(
                      `
      (xor
  (seq
   (seq
    (seq
     (seq
      (seq
       (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
       (call %init_peer_id% ("getDataSrv" "relay") [] relay)
      )
      (call -relay- ("op" "noop") [])
     )
     (xor
      (call relay ("peer" "is_connected") [relay] isOnline)
      (seq
       (call -relay- ("op" "noop") [])
       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
      )
     )
    )
    (call -relay- ("op" "noop") [])
   )
   (xor
    (match isOnline true
     (xor
      (call %init_peer_id% ("test" "doSomething") [])
      (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
     )
    )
    (null)
   )
  )
  (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
 )
 
                  `,
                  )
                  .configHandler((h) => {
                      h.on('getDataSrv', '-relay-', () => {
                     return peer.getStatus().relayPeerId;
                 });
                 h.on('getDataSrv', 'relay', () => {return relay;});
                 h.onEvent('callbackSrv', 'response', (args) => {
   
 });
 
                 h.onEvent('errorHandlingSrv', 'error', (args) => {
                     const [err] = args;
                     reject(err);
                 });
             })
             .handleScriptError(reject)
             .handleTimeout(() => {
                 reject('Request timed out for betterMessage');
             })
         if(config && config.ttl) {
             r.withTTL(config.ttl)
         }
         request = r.build();
     });
     peer.internals.initiateFlow(request);
     return Promise.race([promise, Promise.resolve()]);
 }
       
 