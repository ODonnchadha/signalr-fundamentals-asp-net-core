const InitializeSignalRConnection = () => {
    var connection = new signalR.HubConnectionBuilder().withUrl("/auctionhub").build();

    connection.on("ReceiveNewBid", ({ auctionId, newBid }) => {
        const tr = document.getElementById(auctionId + "-tr");
        const input = document.getElementById(auctionId + "-input");
        //start animation
        tr.classList.add("animate-highlight");
        setTimeout(() => tr.classList.remove("animate-highlight"), 2000);

        const bidText = document.getElementById(auctionId + "-bidtext");
        bidText.innerHTML = newBid;
        input.value = newBid + 1;
    });

    connection.on("NotifyOutbid", ({ auctionId }) => {
        const tr = document.getElementById(auctionId + "-tr");
        if (!tr.classList.contains("outbid")) {
            tr.classList.add("outbid");
        }
    });

    connection.on("ReceiveNewAuction", ({ id, itemName, currentBid }) => {
        var tbody = document.querySelector("#table>tbody");
        tbody.innerHTML +=
            `<tr id="${id}-tr" class="align-middle">
                <td>${itemName}</td>
                <td id="${id}-bidtext" class="bid">${currentBid}</td>
                <td class="bid-form-td">
                    <input id="${id}-input" class="bid-input" type="number" value="${currentBid + 1}" />
                    <button class="byn byn-primary" type="button" onclien="submitBid(${id})">Bid</button>
            </tr>`
    })

    connection.start().catch((err) => {
        return console.error(err.toString());
    });

    return connection;
}

const connection = InitializeSignalRConnection();

const submitBid = (auctionId) => {
    const tr = document.getElementById(auctionId + "-tr");
    tr.classList.remove("outbid");

    const bid = document.getElementById(auctionId + "-input").value;
    fetch("/auction/" + auctionId + "/newbid?currentBid=" + bid, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    connection.invoke("NotifyNewBid", { auctionId: parseInt(auctionId), newBid: parseInt(bid) });
}
