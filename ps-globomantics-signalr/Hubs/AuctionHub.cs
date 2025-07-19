using Microsoft.AspNetCore.SignalR;
using ps_globomantics_signalr.Models;

namespace ps_globomantics_signalr.Hubs
{
    public class AuctionHub: Hub
    {
        /// <summary>
        /// Add a group.
        /// </summary>
        /// <param name="auction"></param>
        /// <returns></returns>
        public async Task NotifyNewBid(AuctionNotify auction)
        {
            var groupName = $"auction-{auction.AuctionId}";
            // If not exist, created. Otherwise, nothing.
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.OthersInGroup(groupName).SendAsync("NotifyOutbid", auction);
            await Clients.All.SendAsync("ReceiveNewBid", auction);
        }

        //public async Task NotifyNewBid(AuctionNotify auction)
        //{
        //    // Function name.
        //    // And a parameter to pass to the function.
        //    await Clients.All.SendAsync("ReceiveNewBid", auction);
        //}
    }
}
