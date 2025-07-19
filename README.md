## ASP.NET Core SignalR Fundamentals by Roland Guijt

- OVERVIEW:
    - Is it possible to have a web page automatically update when the data it displays has to change? 
        - Yes. The technology is built into ASP.NET Core.
    - C#. ASP.NET Core. JavaScript. Visual Studio 2022.

- POWER OF SIGNALR:
    - Real-time web applications. Browser. Dynamic updates. Reflecting real-time changes.
    - [GitHub](https://github.com/RolandGuijt/ps-globomantics-signalr)
    - Hubs and Clients:
        - Hub maintains connections with clients. ASP.NET Server-side application.
        - Client -> Hub -> All connected clients.
    - DEMO: MVC application with views and hubs. Client-side JavaScript.
        - Clients call methods on the hub and respond to hub calls.
        - Clients can also be .NET or Java applications.
    - Remote procedure call: RPC.
        - Procedure == Method == Function.
        - SignalR makes it possible to call methods, or functions, remotely.
        ```javascript
            ReceiveNewBid(action) {
                // Update UI.
            }
        ```
        ```c#
            NotifyNewBid(ActionNotify auction)
            {
                Clients.All.SendMessage("ReceiveNewBid", auction);
            }
        ```
    - Two-way connection in pleace between server and client. Low-level connection.
        - SignalR uses a hub protocol that defines the format of the messages.
            - Default hub protocol: JSON.
        ```json
            {
                "type": 1,
                "target": "ReceiveNewBid",
                "arguments":[{"auctionId":1,"newBid":25}]
            }
        ```
    - Client-side part in JavaScript:
        - Establish connection. Call NotifyNewBid. Write ReceiveNewBid.
        - Install client library. Ensure script placement based upon priority.
        ```javascript
            npm install @microsoft/signalr
        ```
    - With SignalR, the connection is always initiated by the client:
        ```javascript
            const initializeSignalRConnection = () => {
                const connection = 
                    new signalR.HubConnectionBuilder()
                        .withUrl("/auctionhub")
                        .build();
                connection.on("ReceiveNewBid", ({
                    auctionId,
                    newBid
                }) => {
                    const tr = document.getElementById(auctionId + "-tr");
                    const input = document.getElementById(auctionId + "-input");
                    // Start animation:
                    tr.classList.add("animate-highlight");
                    setTimeout(() => tr.classList.remove("animate-highlight"), 2000);

                    const bidText = document.getElementById(auctionId + "-bidtext");
                    bidText.innerHTML = newBid;
                    input.value = newBid + 1;
                });
                connection.start().catch(error => {
                    console.log(error.toString());
                });
                return connection;
            }
            const conn = initializeSignalRConnection();
            conn.invoke("NotifyNewBid", {
                auctionId: parseInt(auctionId),
                newBid: parseInt(bid)
            });
        ```
        ```css
            @keyframes highlight {
                50% {
                    background-color: yellow;
                }
            }
            .animate-highlight {
                animation-name: highlight;
                animation-duration: 2s;
            }
        ```
    - Two-way connections:
        - Underlying technology: Support for three. Transports. 
            - Websockets. Offer a true, long-lasting true connection that is duplex.
                - Upgrades the socket of a normal HTTP request to a websocket.
                - Connection remains until closed or a network problem occurs.
            - Server Sent Events (SSE):
                - Use HTTP requests. Can perform server-to-client HTTP requests.
                    - JavaScript object EventSource.
            - Long Polling:
                - Sever-to-client messages the client performs an HTTP request to the server which remains open.
                - Until there is a message to send or a request timeout occurs.
                - Rinse and repeat. So, request again. Very resource intensive.
    - Befpre the connection is established, the client will first negotiate with the server.
        - Which transports are supported? So, fallback mechanism.
    - For Websockets to work: Browser and server must support.
        - Routers and firewalls must offer support as well.
        - It is supported most of the time.
        - NOTE: Consider disabling negotiation and fallback.
            ```javascript
                const initializeSignalRConnection = () => {
                    const connection = 
                        new signalR.HubConnectionBuilder()
                            .withUrl("/auctionhub", {
                                transport: signalR.HttpTransportType.WebSockets,
                                skipNegotiation: true
                            })
                            .build();
            ```

- SERVER & CLIENT FEATURES:
    - Only restriction. Available client libraries for the technology.
    - NuGet Installation: Microsoft.AspNetCore.SignalR.Client
    - IHubContext & Caller:
        - IHubContext can be used anywhere in the application after it's DI.
        - Doesn't have the concept of the "caller." e.g.: Client that initiated the call.
    - Client groups.
        - Using a connection id. Per the same connection. The id will change after a new connection.
        - Dynamic. On-the-fly. Add connection id to the group.
            - Functions can be called on groups.
        ```csharp
            public async Task NotifyNewBid(AuctionNotify auction)
            {
                var groupName = $"auction-{auction.AuctionId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                await Clients.OthersInGroup(groupName).SendAsync("NotifyOutbid", auction);
                await Clients.All.SendAsync("ReceiveNewBid", auction);
            }
        ```
        - Keep alive messaging: Needed. 
            - WebSocket connections tend to close automatically after a certain period of inactivity.
            - Keep alive messages prevent this.
        - JSON may not be effecient enough. Especially with larger messages.
        - MessagePack protocol. Binary.
            ```javascript
                Microsoft.AspNetCore.SignalR.Protocols.MessagePack
            ```
            ```csharp
                builder.Services.AddSignalR(
                    options => options.EnableDetailedErrors = true)
                    .AddMessagePackProtocol();
            ```
        - NOTE: Serialization is strickly case sensitive.
    - Exceptions & logging:
        - If the hub errors out, the what? Currently, no UI message.
            - Console tab. Connection is still there.
            ```csharp
                throw new Exception("Exception");
                // Message will now be visible with this exception.
                throw new HubException("HubException");
            ```
            - Exceptions not of type HubException will not send the exception message to the client by default.
            ```csharp
                builder.Services.AddSignalR(options => 
                {
                    options.EnableDetailedErrors = true
                });
            ```
            - Be careful with turning on EnableDetailedErrors.
        - Loggng
            ```json
                {
                   "Logging": {
                        "LogLevel": {
                            "Microsoft.AspNetCore.SignalR": "Debug",
                            "Microsoft.AspNetCore.Http.Connections": "Debug"
                        }
                   } 
                }
            ```
    - Application Design Considerations:
        - Fallback scenario if SignalR connection isn't available.
        - Combine SignalR with traditional API.
            - Perhaps 1-2 punch. Client calls API and then Hub. (To inform other clients.)
            - Babysit connection state:
                ```javascript
                    if (!connection.state === "Connected") {
                        location.reload();
                    }
                ```
        - Use SPAs if application has more than one page. Beware multiple pages, especially server-rendered pages.
            - Client-side navigation. Build connection in root component. e.g.: (AuctionNotify auction).
        - Combine multiple simple type parameters in a complex object.
            - SignalR looks for method by name and by parameters.
            - e.g.: So all clients need to be updated after introducting additional parameters to a method.
        - Consider automatic connections.
            ```javascript
                var connection = new signalR.HubConnectionBuilder().
                    .withUrl("/auctionHub")
                    .withAutomaticReconnect()
                    .build();
            ```
            - Stateful reconnect. When anabled and the connection drops, the messages are buffered.
                - And both client and server have buffers.
    - Streaming:
        - Specific scenarios.
        