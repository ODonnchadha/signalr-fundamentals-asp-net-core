﻿using ps_globomantics_signalr.Models;

namespace ps_globomantics_signalr.Repositories
{
    public interface IAuctionRepo
    {
        void AddAuction(Auction auction);
        IEnumerable<Auction> GetAll();
        void NewBid(int auctionId, int newBid);
    }
}